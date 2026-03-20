import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { describe, expect, it } from 'vitest'
import { CognitoAuthStack } from './lib/cognito-auth-stack'

describe('CognitoAuthStack', () => {
  it('creates the core auth infrastructure', () => {
    const app = new cdk.App()
    const stack = new CognitoAuthStack(app, 'TestAuthStack')
    const template = Template.fromStack(stack)

    template.resourceCountIs('AWS::Cognito::UserPool', 1)
    template.resourceCountIs('AWS::Cognito::UserPoolClient', 1)
    template.resourceCountIs('AWS::DynamoDB::Table', 1)
    template.resourceCountIs('AWS::Lambda::Function', 1)
    template.resourceCountIs('AWS::ApiGatewayV2::Api', 1)
    template.resourceCountIs('AWS::SSM::Parameter', 8)
    template.resourceCountIs('AWS::SecretsManager::Secret', 2)
  }, 15000)
})
