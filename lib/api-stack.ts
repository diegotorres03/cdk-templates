import {
    Stack, StackProps,
    aws_dynamodb as Dynamo,
    aws_dax as Dax,
    aws_ec2 as EC2,
    Fn,
    aws_lambda as Lambda,
} from 'aws-cdk-lib'

import { promises as fs } from 'fs'

import { Construct } from 'constructs'
// import * as sqs from 'aws-cdk-lib/aws-sqs'
import { ApiBuilderStack } from './api-builder'


interface ApiStackProps extends StackProps {
    table: Dynamo.Table
    daxCache: Dax.CfnCluster
}

// const region  = process.env.AWS_REGION || 'us-east-2'

export class ApiStack extends Stack {
    constructor(scope: Construct, id: string, props: ApiStackProps) {
        super(scope, id, props)

        const apiBuilder = new ApiBuilderStack(this, 'dax-test')
        const api = apiBuilder.createApi('dax-test')

        console.log(props.daxCache.attrClusterDiscoveryEndpointUrl)

        // const tableName = Fn.importValue('tableName')
        // const table = Dynamo.Table.fromTableArn(this, 'ordersTable', tableName)



        // const defaultVpc = EC2.Vpc.fromLookup(this, 'default-vpc', { vpcId: 'vpc-9cb3d0f7', region: 'us-east-2' })
        // const defaultVpc = EC2.Vpc.fromLookup(this, 'default-vpc', { isDefault: true, region: this.region })
        // console.log('defaultVpc', defaultVpc)


        const daxLayer = apiBuilder.createLayer('js-dax-dependencies', './layers/dax')
        api.post('/data', function () {
            // post to dynamo
            const aws = require('aws-sdk')
            const dynamo = new aws.DynamoDB.DocumentClient()
            // @ts-ignore
            exports.handler = async function (event, context) {
                const params = {
                    TableName: process.env.TABLE_NAME,
                    Item: JSON.parse(event.body),
                }
                console.log('params')
                console.log(params)
                const res = await dynamo.put(params).promise()
                console.log(res)
                return {
                    body: JSON.stringify(params),
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
            name: 'createDataItem',
            env: {
                TABLE_NAME: props.table.tableName,
            },
            access: [
                // props.table.grantWriteData,
                (fn: Lambda.Function) => props.table.grantWriteData(fn),
            ],
        })


        api.get('/data', async function () {
            const aws = require('aws-sdk')
            // const fs = require('fs').promises

            // @ts-ignore
            let dynamo

            try {

                const DaxClient = require('/opt/node_modules/amazon-dax-client')
                const dax = new DaxClient({ endpoints: [process.env.DAX_URL] })
                dynamo = new aws.DynamoDB.DocumentClient({ service: dax })

            } catch (err) {
                console.error(err)
                dynamo = new aws.DynamoDB.DocumentClient()
            }

            // const DaxClient2 = require('/opt/amazon-dax-client')

            console.log(process.env.DAX_URL)
            // const dynamo = new aws.DynamoDB.DocumentClient({service: dax})
            // @ts-ignore
            exports.handler = async function (event, context) {
                const params = {
                    TableName: process.env.TABLE_NAME,
                    Key: { partition: 'group2', sort: 'user 1' },

                }
                // console.log(dax)
                console.log(params)
                // const res = await daxLayer.g

                // @ts-ignore
                const res = await dynamo.get(params).promise()
                console.log(res)

                // console.log(await fs.readdir('/opt/'))
                // console.log(await fs.readdir('/tmp/'))

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
            }

            // read from dax
        }, {
            name: 'getData',
            layers: [daxLayer],
            env: {
                TABLE_NAME: props.table.tableName,
                DAX_URL: props.daxCache.attrClusterDiscoveryEndpointUrl,
            },
            access: [
                (fn: Lambda.Function) => props.table.grantReadData(fn),
            ],
            // vpc: defaultVpc,
        })


    }

}

// PSCS = Parts Service ....
// DPO = Dealrs Parts Order
// O2P = 