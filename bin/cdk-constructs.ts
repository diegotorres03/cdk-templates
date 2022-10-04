#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkConstructsStack } from '../lib/cdk-constructs-stack';
import { ApiBuilderStack } from '../lib/api-builder'
import { SmartApiStack } from '../lib/smart-api-stack'
import { TableStack } from '../lib/table-stack'
import { ApiStack } from '../lib/api-stack'
import { S3AITagStack, S3AITagStackProps } from '../lib/s3-ai-tag/s3-at-tags-stack'
import { GraphQLStack } from '../lib/graphql-stack'
import { WebAppStack } from '../lib/webapp-stack'
import { TestApiForGQLStack } from '../lib/test-rest-api-for-graphql-stack'
const region = process.env.AWS_REGION || 'us-east-2'

const app = new cdk.App()

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAUL_REGION || 'us-east-2',
}

// const defaultVpc = cdk.aws_ec2.Vpc.fromLookup(app, 'default-vpc', { vpcId: 'vpc-9cb3d0f7', region: 'us-east-2' })
// console.log('defaultVpc', defaultVpc)

const securityGroupIds = ["sgr-022dc12c5095e64c1"]

const tables = new TableStack(app, 'tables', {
  daxSubnetIds: ["subnet-a66de6cd", "subnet-a65392db", "subnet-055f7749"],
  daxSecurityGroupIds: securityGroupIds,
  env,
})

const webapp = './webapp'

const api = new ApiStack(app, 'dax-api', {
  daxCache: tables.daxCache,
  table: tables.table,
  webapp,
  // securityGroupIds: securityGroupIds,
  env,
})

api.addDependency(tables)


const s3TagBucket = new S3AITagStack(app, 's3-ai-tag', {})


const gqlApi = new GraphQLStack(app, 'gql-api')

const testRest = new TestApiForGQLStack(app, 'test-rest-gql', { env })

new WebAppStack(app, 'gql-webapp', { assetsPath: './webapp-gql-test/dist'})

// gqlApi.createApi()
// .schema('./graphql/schema.gql')



