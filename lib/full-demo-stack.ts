import * as aws from 'aws-sdk'
import * as DaxClient from 'amazon-dax-client'

import {
    Stack, StackProps,
    aws_lambda as Lambda,
    aws_iam as IAM,
    RemovalPolicy,
    CfnOutput,
    Duration,
} from 'aws-cdk-lib'
// import * as AppSync from '@aws-cdk/aws-appsync'
import { Construct } from 'constructs'
// import * as sqs from 'aws-cdk-lib/aws-sqs';

import { GraphQLConstruct } from './graphql/graphql-builder-construct'
import { DynamoCostruct } from './dynamodb/dynamo-construct'
import { ApiBuilderConstruct } from './rest-api/api-builder-construct'
import { WebAppConstruct } from './webapp/webapp-construct'
import { ApiGateway } from 'aws-cdk-lib/aws-events-targets'

// const output = 
interface FullDemoStackProps extends StackProps {
    daxSubnetIds: string[] // subnet-a66de6cd –	subnet-a65392db – subnet-055f7749
    daxSecurityGroupIds: string[] // sgr-022dc12c5095e64c1
}

// const responseHeaders = {
//     "Content-Type": "application/json",
//     "Access-Control-Allow-Headers": "Content-Type",
//     "Access-Control-Allow-Origin": "*",
//     "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,PATCH"
// }

export class FullDemoStack extends Stack {

    constructor(scope: Construct, id: string, props: FullDemoStackProps) {
        // @ts-ignore
        super(scope, id, props)

        // [ ] create table
        const db = new DynamoCostruct(this, 'items-table')
        db.addKeys('partition', 'sort')
        db.createDax({
            securityGroupIds: props.daxSecurityGroupIds,
            subnetIds: props.daxSubnetIds
        })

        // [ ] create rest api
        const apiBuilder = new ApiBuilderConstruct(this, 'rest-api')
        const api = apiBuilder.createApi('rest-api-demo')
        
        // const swaggerFile = {}
        // api.createApi(swaggerFile)

        const daxLayer = apiBuilder.createLayer('full-demo-node_modules', './layers/dax')

        api.get('/items', async function (event) {
            // [ ] list items from aws
            const aws = require('aws-sdk')
            const DaxClient = require('amazon-dax-client')
            const { log, error } = console

            log(JSON.stringify(event, undefined, 2))

            if (!process.env.TABLE_NAME) throw new Error('TABLE_NAME must be specified on lambda env variables')
            if (!process.env.DAX_URL) throw new Error('DAX_URL must be specified on lambda env variables')

            const dax = new DaxClient({ endpoints: [process.env.DAX_URL] })
            const dynamo = new aws.DynamoDB.DocumentClient({ region: process.env.region, service: dax })

            const params = {
                TableName: process.env.TABLE_NAME,
            }
            log(params)
            const res = await dynamo.scan(params).promise()

            return {
                statusCode: 200,
                body: JSON.stringify(res.Items),
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,PATCH"
                },
            }
        }, {
            name: 'list-items',
            env: {
                ...props.env,
                TABLE_NAME: db.table.tableName,
                DAX_URL: db.daxCache.attrClusterDiscoveryEndpointUrl,
            },
            access: [
                (fn: Lambda.Function) => db.table.grantReadData(fn),
                (fn: Lambda.Function) => {
                    // db.table.grantReadData(fn)
                    // https://aws.amazon.com/blogs/database/how-to-increase-performance-while-reducing-costs-by-using-amazon-dynamodb-accelerator-dax-and-aws-lambda/
                    fn.addToRolePolicy(new IAM.PolicyStatement({
                        actions: ['dax:PutItem', 'dax:GetItem', 'dax:Scan'],
                        effect: IAM.Effect.ALLOW,
                        resources: [db.daxCache.attrArn]
                    }))
                },

            ],
            layers: [daxLayer],
            vpc: 'default'
        })

        api.get('/items/{partition}/{sort}', async function (event) {
            // [ ] get item from aws
            const aws = require('aws-sdk')
            // const DaxClient = require('amazon-dax-client')
            const { log, error } = console

            log(JSON.stringify(event, undefined, 2))

            if (!process.env.TABLE_NAME) throw new Error('TABLE_NAME must be specified on lambda env variables')
            if (!process.env.DAX_URL) throw new Error('DAX_URL must be specified on lambda env variables')

            // const dax = new DaxClient({ endpoints: [process.env.DAX_URL] })
            const dynamo = new aws.DynamoDB.DocumentClient({
                region: process.env.region,
                // service: dax 
            })

            const { partition, sort } = event.pathParameters
            const params = {
                TableName: process.env.TABLE_NAME,
                Key: { partition, sort },
            }
            log(params)
            const res = await dynamo.get(params).promise()

            return {
                statusCode: 200,
                body: JSON.stringify(res.Item),
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,PATCH"
                },
            }
        }, {
            name: 'get-item',
            env: {
                ...props.env,
                TABLE_NAME: db.table.tableName,
                DAX_URL: db.daxCache.attrClusterDiscoveryEndpointUrl,
            },
            access: [
                (fn: Lambda.Function) => db.table.grantReadData(fn),
                (fn: Lambda.Function) => {
                    // https://aws.amazon.com/blogs/database/how-to-increase-performance-while-reducing-costs-by-using-amazon-dynamodb-accelerator-dax-and-aws-lambda/
                    fn.addToRolePolicy(new IAM.PolicyStatement({
                        actions: ['dax:PutItem', 'dax:GetItem', 'dax:Scan'],
                        effect: IAM.Effect.ALLOW,
                        resources: [db.daxCache.attrArn]
                    }))
                },

            ],
            layers: [daxLayer],
            vpc: 'default'
        })

        api.post('/items', async function (event) {
            const aws = require('aws-sdk')
            const { log } = console

            log(JSON.stringify(event, undefined, 2))

            if (!process.env.TABLE_NAME) throw new Error('TABLE_NAME must be specified on lambda env variables')
            const dynamo = new aws.DynamoDB.DocumentClient({ region: process.env.region })

            const item = JSON.parse(event.body)
            const params = {
                TableName: process.env.TABLE_NAME,
                Item: item,
            }

            log(params)
            await dynamo.put(params).promise()
            return {
                statusCode: 204,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,PATCH"
                },
            }

        }, {
            name: 'create-item',
            env: { ...props.env, TABLE_NAME: db.table.tableName },
            access: [
                (fn: Lambda.Function) => db.table.grantWriteData(fn),
            ],
        })

        // [ ] create graphql api

        // [ ] create web app

    }
}




// todo
// [ ] what the model looks like



