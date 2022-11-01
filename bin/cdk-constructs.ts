#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TableStack } from '../lib/table-stack'
import { ApiStack } from '../lib/api-stack'
import { S3AITagStack, S3AITagStackProps } from '../lib/s3-ai-tag/s3-at-tags-stack'
import { GraphQLStack } from '../lib/graphql-stack'
import { WebAppStack } from '../lib/webapp-stack'
import { TestApiForGQLStack } from '../lib/test-rest-api-for-graphql-stack'
import { FullDemoStack } from '../lib/full-demo-stack'
import { ChandraDemoStack } from '../lib/chandra-video-stack'

////////////////////////////////////////////////////////////

const app = new cdk.App()

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAUL_REGION || 'us-east-2',
}

// const defaultVpc = cdk.aws_ec2.Vpc.fromLookup(app, 'default-vpc', { vpcId: 'vpc-9cb3d0f7', region: 'us-east-2' })
// console.log('defaultVpc', defaultVpc)

const securityGroupIds = ["sg-87eb21cc"]
const subnetIds = ["subnet-a66de6cd", "subnet-a65392db", "subnet-055f7749"]
// const tables = new TableStack(app, 'tables', {
//   daxSubnetIds: subnets,
//   daxSecurityGroupIds: securityGroupIds,
//   env,
// })

// const webapp = './webapp'

// const api = new ApiStack(app, 'dax-api', {
//   daxCache: tables.daxCache,
//   table: tables.table,
//   webapp,
//   // securityGroupIds: securityGroupIds,
//   env,
// })

// api.addDependency(tables)


// const s3TagBucket = new S3AITagStack(app, 's3-ai-tag', {})


// const gqlApi = new GraphQLStack(app, 'gql-api')

// const testRest = new TestApiForGQLStack(app, 'test-rest-gql', { env })

new WebAppStack(app, 'gql-webapp', {
  assetsPath: './webapp-gql-test/dist',
  env,
})

new FullDemoStack(app, 'full-demo', {
  daxSecurityGroupIds: securityGroupIds,
  daxSubnetIds: subnetIds,
  env,
})

// gqlApi.createApi()
// .schema('./graphql/schema.gql')

// publishing a video for Chandra // delete on nov 15
new ChandraDemoStack(app, 'chandra-stack')

