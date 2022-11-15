// Note, require 
// https://aws.amazon.com/blogs/mobile/building-scalable-graphql-apis-on-aws-with-cdk-and-aws-appsync/
import {
    Stack, StackProps,
    aws_dynamodb as DynamoDB,
    aws_lambda as Lambda,
    RemovalPolicy,
    CfnOutput,
    Duration,
} from 'aws-cdk-lib'
// import * as AppSync from '@aws-cdk/aws-appsync'
import { Construct } from 'constructs'
// import * as sqs from 'aws-cdk-lib/aws-sqs';

import { GraphQLConstruct } from './graphql/graphql-builder-construct'


// const output = 

export class GraphQLStack extends Stack {

    constructor(scope: Construct, id: string, props?: StackProps) {
        // @ts-ignore
        super(scope, id, props)

        // lib/appsync-cdk-app-stack.ts
        const notesTable = new DynamoDB.Table(this, 'CDKNotesTablee', {
            billingMode: DynamoDB.BillingMode.PAY_PER_REQUEST,
            partitionKey: {
                name: 'id',
                type: DynamoDB.AttributeType.STRING,
            },
            removalPolicy: RemovalPolicy.DESTROY,
        })



        const gql = new GraphQLConstruct(this, 'test-api')

        gql.createApi('demo-api', './graphql/schema.gql')

        gql.query('getNoteById')
            // @ts-ignore
            .fn(async function (event) {
                console.log(event)
                const noteId = event.arguments.noteId
                const AWS = require('aws-sdk')
                const docClient = new AWS.DynamoDB.DocumentClient()
                const params = {
                    TableName: process.env.NOTES_TABLE,
                    Key: { id: noteId }
                }
                const { Item } = await docClient.get(params).promise()
                return Item
            }, {
                name: 'get-note-by-id',
                env: { ...props?.env, NOTES_TABLE: notesTable.tableName },
                access: [(fn: Lambda.Function) => notesTable.grantReadData(fn)]
            })
            .requestMapping('TODO: request mapping here')
            .responseMapping('TODO: response mapping here')
            .end()


        /////////////////////
        // [ ] this is the desired way to use
        gql.query('listNotes')
            .pipe({})
            .fn(function (event) {
                console.log(JSON.stringify(event, undefined, 2))
                const now = Date.now()
                if(now % 2 === 0) return new Error('test error')
                return {
                    step1: 'done',
                    now
                }
            }, { name: 'step_1' })
            .fn(async function (event) {
                console.log(event)
                const AWS = require('aws-sdk')
                const docClient = new AWS.DynamoDB.DocumentClient()
                const params = {
                    TableName: process.env.NOTES_TABLE,
                }
                console.log('dynamo params')
                console.log(params)
                const data = await docClient.scan(params).promise()
                return data.Items

            }, {
                name: 'list-nodes',
                env: { ...props?.env, NOTES_TABLE: notesTable.tableName },
                access: [(fn: Lambda.Function) => notesTable.grantReadData(fn)]
            })
            .end()

        // ---------

        // gql.query('listNotes')
        //     // @ts-ignore
        //     .fn(async function (event) {
        //         console.log(event)
        //         const AWS = require('aws-sdk')
        //         const docClient = new AWS.DynamoDB.DocumentClient()
        //         const params = {
        //             TableName: process.env.NOTES_TABLE,
        //         }
        //         console.log('dynamo params')
        //         console.log(params)
        //         const data = await docClient.scan(params).promise()
        //         return data.Items

        //     }, {
        //         name: 'list-nodes',
        //         env: { ...props?.env, NOTES_TABLE: notesTable.tableName },
        //         access: [(fn: Lambda.Function) => notesTable.grantReadData(fn)]
        //     })
        //     .end()

        gql.mutation('createNote')
            // @ts-ignore    
            .fn(async function (event) {
                console.log(event)
                const AWS = require('aws-sdk')
                const dynamo = new AWS.DynamoDB.DocumentClient()
                const note = event.arguments.note
                const params = {
                    TableName: process.env.NOTES_TABLE,
                    Item: note
                }
                await dynamo.put(params).promise()
                console.log('note')
                console.log(note)
                return note
            }, {
                name: 'create-note',
                env: { ...props?.env, NOTES_TABLE: notesTable.tableName },
                access: [(fn: Lambda.Function) => notesTable.grantWriteData(fn)]
            })
            .end()

        gql.mutation('deleteNote')
            // @ts-ignore
            .fn(async function (event) {
                console.log(event)
                const AWS = require('aws-sdk')
                const docClient = new AWS.DynamoDB.DocumentClient()
                const noteId = event.arguments.noteId // [x] get from event
                const params = {
                    TableName: process.env.NOTES_TABLE,
                    Key: {
                        id: noteId
                    }
                }
                await docClient.delete(params).promise()
                return noteId
            }, {
                name: 'delete-note',
                env: { ...props?.env, NOTES_TABLE: notesTable.tableName },
                access: [(fn: Lambda.Function) => notesTable.grantWriteData(fn)]
            })
            .end()

        gql.mutation('updateNote')
            // @ts-ignore
            .fn(async function (event) {
                console.log(event)
                const AWS = require('aws-sdk')
                const docClient = new AWS.DynamoDB.DocumentClient()
                const note = event.arguments.note // [x] get from event
                let params = {
                    TableName: process.env.NOTES_TABLE,
                    Key: {
                        id: note.id
                    },
                    ExpressionAttributeValues: {},
                    ExpressionAttributeNames: {},
                    UpdateExpression: "",
                    ReturnValues: "UPDATED_NEW"
                }
                let prefix = "set "
                let attributes = Object.keys(note)
                for (let i = 0; i < attributes.length; i++) {
                    let attribute = attributes[i]
                    if (attribute !== "id") {
                        params["UpdateExpression"] += prefix + "#" + attribute + " = :" + attribute
                        // @ts-ignore
                        params["ExpressionAttributeValues"][":" + attribute] = note[attribute]
                        // @ts-ignore
                        params["ExpressionAttributeNames"]["#" + attribute] = attribute
                        prefix = ", "
                    }
                }
                console.log('params: ', params)

                await docClient.update(params).promise()
                return note

            }, {
                name: 'update-note',
                env: { ...props?.env, NOTES_TABLE: notesTable.tableName },
                access: [(fn: Lambda.Function) => notesTable.grantWriteData(fn)]
            })
            .end()

        //         gql.query('listUserItems')
        //             .http({ url: 'https://hyv8xaaj80.execute-api.us-east-2.amazonaws.com/dev', method: 'get' })
        //             .requestMapping(`{
        //     "version": "2018-05-29",
        //     "method": "GET",
        //     "params": {
        //         "headers": {
        //             "Content-Type": "application/json"
        //         }
        //     },
        //     "resourcePath": "/users"
        // }`)
        //             .responseMapping(`## return the body
        // #if($ctx.result.statusCode == 200)
        //     ##if response is 200
        //     $ctx.result.body
        // #else
        //     ##if response is not 200, append the response to error block.
        //     $utils.appendError($ctx.result.body, "$ctx.result.statusCode")
        // #end`)
        //             .end()


    }



}


