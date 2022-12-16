
import {
    Stack, StackProps,
    aws_iam as iam,
    aws_dynamodb as Dynamo,
    aws_dax as Dax,
    aws_lambda as Lambda,
    aws_lambda_event_sources as LambdaEventSources,
    CfnOutput,
    PhysicalName,
    //
} from 'aws-cdk-lib'


import { Construct } from 'constructs'
import { IoTConstruct } from './iot/iot-construct'
import { DynamoCostruct } from './dynamodb'
import { WebAppConstruct } from './webapp'
import { GraphQLConstruct } from './graphql'

export class IoTAppSyncStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props)


        // const deviceTable = new DynamoCostruct(this, 'deviceTable')

        // deviceTable
        //     .addKeys('groupId', 'deviceId')
        //     // .addIndex('buildingId')
            

        // deviceTable
        //     .on('delete')
        //     .fn(async function (event, new, old) {
        //         const aws = require('aws-sdk')
        //         // [ ] if system delete due to ttl policy, send to analitycs pipeline
        //         const firehose = new aws.Firehose({ region: process.env.REGION })
        //         const res = await firehose.putRecord({
        //             DeliveryStreamName: process.env.STREAM_NAME,
        //             Record: { Data: JSON.stringify(old) }
        //         }).promise()
        //         console.log(res)
        //     }, {
        //         name: 'onDeleteHandler',
        //         env: {
        //             TABLE_NAME: deviceTable.table.tableName,
        //             STREAM_NAME: 'stream from other Stack',
        //             REGION: props?.env?.region,
        //         },
        //     })



        const iot = new IoTConstruct(this, 'iot-appsync-core')


        // [ ] create iot thing
        // [ ] create thing shadow

        iot
            .topicRule('/topic/other/*')
            .description('this is a test topic')
            .sql(`SELECT topic(2) as device_id, timestamp() as timestamp FROM /topic/ther/2`)
            .fn(function (event) {
                console.log(event)
                return {
                    success: true
                }

            }, {
                name: 'topicHandler',
            })
            .end()


        // const appsync = new GraphQLConstruct(this, 'iot-appsync-graphql')
        // appsync.createApi('iot-appsync-graphql', '/path/to/schema.graphql')
        // appsync
        //     .mutation('putDeviceData')
        //     .fn(async function (event) {
        //         // [ ] save on Dynamo
        //         // [ ] let IoT core know of the update 
        //     }, {})
        //     .end()



        // const webapp = new WebAppConstruct(this, 'iot-appsync-webapp')
        // webapp
        //     .run('./src', ['npm run build', 'npm run test'])
        //     .addAssets('./path/to/webapp/dist')



    }
}


/*
POST: Mutation
{
 "state": {
  "desired": {
   "controllerState": "ON",
   "controllerLightCode": 200
  }
 }
}

Query result:
{
 "state": {
  "desired": {
   "controllerState": "ON",
   "controllerLightCode": 200
  },
  "reported": {
   "controllerState": "ON",
   "controllerLightCode": 200
  }
 }
}

*/