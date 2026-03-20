import path from 'node:path'
import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2'
import * as apigwv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations'
import * as cognito from 'aws-cdk-lib/aws-cognito'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import * as ssm from 'aws-cdk-lib/aws-ssm'

export class CognitoAuthStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const appName = 'vibe'
    const refreshTokenTtlDays = 30
    const parameterPrefix = `/${appName}/auth`

    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${appName}-users`,
      selfSignUpEnabled: false,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 12,
        requireDigits: true,
        requireLowercase: true,
        requireUppercase: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    })

    const userPoolClient = userPool.addClient('WebBffClient', {
      userPoolClientName: `${appName}-web-bff`,
      disableOAuth: true,
      authFlows: {
        adminUserPassword: true,
        userPassword: false,
        userSrp: false,
      },
      enableTokenRevocation: true,
      preventUserExistenceErrors: true,
      generateSecret: false,
      refreshTokenValidity: cdk.Duration.days(refreshTokenTtlDays),
      accessTokenValidity: cdk.Duration.minutes(15),
      idTokenValidity: cdk.Duration.minutes(15),
    })
    const cognitoIssuer = `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`

    const sessionTable = new dynamodb.Table(this, 'SessionTable', {
      tableName: `${appName}-auth-sessions`,
      partitionKey: {
        name: 'sessionId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecoverySpecification: {
        pointInTimeRecoveryEnabled: true,
      },
      timeToLiveAttribute: 'ttl',
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    })

    const serviceTokenSecret = new secretsmanager.Secret(this, 'AuthApiServiceTokenSecret', {
      secretName: `${appName}/auth/api-service-token`,
      generateSecretString: {
        passwordLength: 48,
        excludePunctuation: true,
        includeSpace: false,
        generateStringKey: 'serviceToken',
        secretStringTemplate: JSON.stringify({ app: appName }),
      },
    })

    const nextSessionSecret = new secretsmanager.Secret(this, 'NextSessionSecret', {
      secretName: `${appName}/auth/next-session-secret`,
      generateSecretString: {
        passwordLength: 64,
        excludePunctuation: true,
        includeSpace: false,
      },
    })

    const authLogGroup = new logs.LogGroup(this, 'AuthApiLambdaLogs', {
      logGroupName: `/aws/lambda/${appName}-auth-api`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    })

    const authApiFunction = new lambdaNodejs.NodejsFunction(this, 'AuthApiFunction', {
      functionName: `${appName}-auth-api`,
      entry: path.join(process.cwd(), 'infra', 'lambda', 'auth-handler.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.seconds(15),
      memorySize: 512,
      logGroup: authLogGroup,
      environment: {
        COGNITO_USER_POOL_ID: userPool.userPoolId,
        COGNITO_USER_POOL_CLIENT_ID: userPoolClient.userPoolClientId,
        SESSION_TABLE_NAME: sessionTable.tableName,
        SERVICE_TOKEN_SECRET_ARN: serviceTokenSecret.secretArn,
        REFRESH_TOKEN_TTL_DAYS: String(refreshTokenTtlDays),
      },
      bundling: {
        format: lambdaNodejs.OutputFormat.CJS,
        target: 'node20',
        minify: false,
        sourceMap: true,
      },
    })

    sessionTable.grantReadWriteData(authApiFunction)
    serviceTokenSecret.grantRead(authApiFunction)

    authApiFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cognito-idp:AdminInitiateAuth', 'cognito-idp:RevokeToken'],
        resources: ['*'],
      }),
    )

    const httpApi = new apigwv2.HttpApi(this, 'AuthHttpApi', {
      apiName: `${appName}-auth-api`,
    })

    const integration = new apigwv2Integrations.HttpLambdaIntegration('AuthLambdaIntegration', authApiFunction)

    httpApi.addRoutes({
      path: '/auth/login',
      methods: [apigwv2.HttpMethod.POST],
      integration,
    })

    httpApi.addRoutes({
      path: '/auth/refresh',
      methods: [apigwv2.HttpMethod.POST],
      integration,
    })

    httpApi.addRoutes({
      path: '/auth/logout',
      methods: [apigwv2.HttpMethod.POST],
      integration,
    })

    const authApiBaseUrlParam = new ssm.StringParameter(this, 'AuthApiBaseUrlParameter', {
      parameterName: `${parameterPrefix}/api-base-url`,
      stringValue: httpApi.apiEndpoint,
    })

    const userPoolIdParam = new ssm.StringParameter(this, 'UserPoolIdParameter', {
      parameterName: `${parameterPrefix}/user-pool-id`,
      stringValue: userPool.userPoolId,
    })

    const userPoolClientIdParam = new ssm.StringParameter(this, 'UserPoolClientIdParameter', {
      parameterName: `${parameterPrefix}/user-pool-client-id`,
      stringValue: userPoolClient.userPoolClientId,
    })

    const issuerParam = new ssm.StringParameter(this, 'IssuerParameter', {
      parameterName: `${parameterPrefix}/issuer`,
      stringValue: cognitoIssuer,
    })

    const jwksUriParam = new ssm.StringParameter(this, 'JwksUriParameter', {
      parameterName: `${parameterPrefix}/jwks-uri`,
      stringValue: `${cognitoIssuer}/.well-known/jwks.json`,
    })

    const sessionTableParam = new ssm.StringParameter(this, 'SessionTableParameter', {
      parameterName: `${parameterPrefix}/session-table-name`,
      stringValue: sessionTable.tableName,
    })

    const serviceTokenArnParam = new ssm.StringParameter(this, 'ServiceTokenSecretArnParameter', {
      parameterName: `${parameterPrefix}/service-token-secret-arn`,
      stringValue: serviceTokenSecret.secretArn,
    })

    const nextSessionSecretArnParam = new ssm.StringParameter(this, 'NextSessionSecretArnParameter', {
      parameterName: `${parameterPrefix}/next-session-secret-arn`,
      stringValue: nextSessionSecret.secretArn,
    })

    new cdk.CfnOutput(this, 'AuthApiBaseUrl', { value: authApiBaseUrlParam.stringValue })
    new cdk.CfnOutput(this, 'CognitoUserPoolId', { value: userPoolIdParam.stringValue })
    new cdk.CfnOutput(this, 'CognitoUserPoolClientId', { value: userPoolClientIdParam.stringValue })
    new cdk.CfnOutput(this, 'CognitoIssuer', { value: issuerParam.stringValue })
    new cdk.CfnOutput(this, 'CognitoJwksUri', { value: jwksUriParam.stringValue })
    new cdk.CfnOutput(this, 'SessionTableName', { value: sessionTableParam.stringValue })
    new cdk.CfnOutput(this, 'AuthApiServiceTokenSecretArn', { value: serviceTokenArnParam.stringValue })
    new cdk.CfnOutput(this, 'NextSessionSecretArn', { value: nextSessionSecretArnParam.stringValue })
  }
}
