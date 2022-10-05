import {
    Stack, StackProps,
    aws_dynamodb as Dynamo,
    aws_dax as Dax,
    aws_ec2 as EC2,
    aws_iam as IAM,
    Fn,
    aws_lambda as Lambda,
    CfnOutput,
} from 'aws-cdk-lib'

import { promises as fs } from 'fs'

import { Construct } from 'constructs'
// import * as sqs from 'aws-cdk-lib/aws-sqs'
import { ApiBuilderConstruct } from './rest-api/api-builder-construct'


export class TestApiForGQLStack extends Stack {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props)

        const restApiBuilder = new ApiBuilderConstruct(this, 'sample-api-gql', { env: { ...props.env } })

        const restApi = restApiBuilder.createApi('gql-demo-rest')


        const table = new Dynamo.Table(this, 'gql-test-table', {
            partitionKey: { name: 'userId', type: Dynamo.AttributeType.STRING },
            sortKey: { name: 'itemId', type: Dynamo.AttributeType.STRING },
            billingMode: Dynamo.BillingMode.PAY_PER_REQUEST,
        })


        // restApi.get('/users', async function (event: any) {
        restApi.get('/users', function () {
            const aws = require('aws-sdk')
            const dynamo = new aws.DynamoDB.DocumentClient({ region: process.env.REGION })
            exports.handler = async function (event: any) {
                console.log(JSON.stringify(event, undefined, 2))
                const res = await dynamo.scan({ TableName: process.env.USERS_TABLE }).promise()
                console.log(JSON.stringify(res, undefined, 2))
                return {
                    // @ts-ignore
                    body: JSON.stringify(res.Items.filter(item => item.itemId === 'definition')),
                    statusCode: 200,
                    headers: {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Headers": "Content-Type",
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,PATCH"
                    }
                }
            }
        }, {
            name: 'get-users',
            env: { REGION: props.env?.region, USERS_TABLE: table.tableName },
            access: [(fn: Lambda.Function) => table.grantReadData(fn)],
        })

        restApi.post('/users', async function (event: any) {
            console.log(JSON.stringify(event, undefined, 2))
            const aws = require('aws-sdk')
            const dynamo = new aws.DynamoDB.DocumentClient({ region: process.env.REGION })
            const res = await dynamo.put({
                TableName: process.env.USERS_TABLE,
                Item: JSON.parse(event.body)
            }).promise()
            return {
                body: JSON.stringify(res),
                statusCode: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,PATCH"
                }
            }
        }, {
            name: 'create-user',
            env: { REGION: props.env?.region, USERS_TABLE: table.tableName },
            access: [(fn: Lambda.Function) => table.grantReadWriteData(fn)],
        })

        restApi.get('/users/{userId}', async function (event: any) {
            console.log(JSON.stringify(event, undefined, 2))
            const aws = require('aws-sdk')
            const dynamo = new aws.DynamoDB.DocumentClient({ region: process.env.REGION })
            const res = (await dynamo.get({
                TableName: process.env.USERS_TABLE,
                Key: { userId: event.pathParameters.userId, itemId: 'definition' },
            }).promise())
            return {
                body: JSON.stringify(res.Item),
                statusCode: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,PATCH"
                }
            }
        }, {
            name: 'get-user',
            env: { REGION: props.env?.region, USERS_TABLE: table.tableName },
            access: [(fn: Lambda.Function) => table.grantReadData(fn)],
        })

        // restApi.put('/users/{userId}', async function (event: any) {
        //     return {
        //         body: JSON.stringify(event),
        //         statusCode: 200,
        //         headers: {
        //             "Content-Type": "application/json",
        //             "Access-Control-Allow-Headers": "Content-Type",
        //             "Access-Control-Allow-Origin": "*",
        //             "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,PATCH"
        //         }
        //     }
        // }, {
        //     name: 'put-user',
        //     env: { REGION: props.env?.region },
        // })

        // restApi.delete('/users/{userId}', async function (event: any) {
        //     return {
        //         body: JSON.stringify(event),
        //         statusCode: 200,
        //         headers: {
        //             "Content-Type": "application/json",
        //             "Access-Control-Allow-Headers": "Content-Type",
        //             "Access-Control-Allow-Origin": "*",
        //             "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,PATCH"
        //         }
        //     }
        // }, {
        //     name: 'delete-user',
        //     env: { REGION: props.env?.region },
        // })


        restApi.get('/users/{userId}/items', async function (event: any) {
            const aws = require('aws-sdk')
            const dynamo = new aws.DynamoDB.DocumentClient({ region: process.env.REGION })
            const res = await dynamo.query({
                TableName: process.env.USERS_TABLE,
                KeyConditionExpression: 'userId = :userId and begins_with(itemId, :itemPrefix)',
                ExpressionAttributeValues: {
                    ':userId': event.pathParameters.userId,
                    ':itemPrefix': 'item',
                },
                // AttributesToGet: ['userId', 'itemId'],
            }).promise()
            return {
                // @ts-ignore
                body: JSON.stringify(res.Items.map(item => ({ userId: item.userId, itemId: item.itemId }))),
                statusCode: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,PATCH"
                }
            }
        }, {
            name: 'get-user-items',
            env: { REGION: props.env?.region, USERS_TABLE: table.tableName },
            access: [(fn: Lambda.Function) => table.grantReadData(fn)],
        })

        restApi.get('/users/{userId}/items/{itemId}', async function (event: any) {
            const aws = require('aws-sdk')
            const dynamo = new aws.DynamoDB.DocumentClient({ region: process.env.REGION })
            const res = await dynamo.get({
                TableName: process.env.USERS_TABLE,
                Key: {
                    userId: event.pathParameters.userId,
                    itemId: event.pathParameters.itemId,
                },
            }).promise()
            return {
                body: JSON.stringify(res.Item),
                statusCode: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Headers": "Content-Type",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,PATCH"
                }
            }
        }, {
            name: 'get-user-item',
            env: { REGION: props.env?.region, USERS_TABLE: table.tableName },
            access: [(fn: Lambda.Function) => table.grantReadData(fn)],
        })


    }
}