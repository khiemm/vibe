#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { CognitoAuthStack } from '../lib/cognito-auth-stack'

const app = new cdk.App()

new CognitoAuthStack(app, 'VibeCognitoAuthStack', {
  stackName: process.env.CDK_STACK_NAME ?? 'vibe-cognito-auth',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? process.env.AWS_REGION ?? 'ap-southeast-1',
  },
})
