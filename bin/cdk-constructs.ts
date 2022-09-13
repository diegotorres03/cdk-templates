#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkConstructsStack } from '../lib/cdk-constructs-stack';
import { ApiBuilderStack } from '../lib/api-builder'
import { SmartApiStack } from '../lib/smart-api-stack'
import { TableStack } from '../lib/table-stack'
import { ApiStack } from '../lib/api-stack'

const region = process.env.AWS_REGION || 'us-east-2'

const app = new cdk.App()

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAUL_REGION || 'us-east-2',
}

// const defaultVpc = cdk.aws_ec2.Vpc.fromLookup(app, 'default-vpc', { vpcId: 'vpc-9cb3d0f7', region: 'us-east-2' })
// console.log('defaultVpc', defaultVpc)

const tables = new TableStack(app, 'tables', {
  daxSubnetIds: ["subnet-a66de6cd", "subnet-a65392db", "subnet-055f7749"],
  daxSecurityGroupIds: ["sgr-022dc12c5095e64c1"],
  // env,
})

const api = new ApiStack(app, 'dax-api', {
  daxCache: tables.daxCache,
  table: tables.table,
  // env,
})


api.addDependency(tables)


// const apiBuilder = new ApiBuilderStack(app, 'inline-api', {
// })

// const api = apiBuilder.createApi('inline-api')



// api.get('/users/{id}', function run() {
//   // pre handler handler 
//   const aws = require('aws-sdk')
//   console.log('pre handler')
//   // @ts-ignore
//   exports.handler = async function (event, context) {
//     // your code here
//     console.log('asdadkjasdjhasdkjhaskjdhkajshdkasjdhk')
//     console.log(JSON.stringify(event, undefined, 2));
//     return {
//       statusCode: 200,
//       body: JSON.stringify([{ id: 'user1' }, { id: 'user2' },]),
//       headers: {
//         'Content-type': 'application/json',
//         'Access-Controll-Allow-Origins': '*',
//       }
//     }
//   };
// }, {
//   layers: [],
//   env: {}, name: 'getUser',
//   authorizer: null
// })


// api.post('/users', function run() {
//   const aws = require('aws-sdk')
//   const dynamo = new aws.DynamoDB.DocumentClient()
// }, {})




