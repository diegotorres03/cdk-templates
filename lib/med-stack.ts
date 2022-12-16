import {
    Stack, StackProps,
} from 'aws-cdk-lib'

import { Construct } from 'constructs'
import { DynamoCostruct } from '../lib/dynamodb'
import { GraphQLConstruct } from '../lib/graphql'

export class MedStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // [ ] create table (for medical records and for access)
        const patientTable = new DynamoCostruct(this, 'patients-table')
        patientTable.addKeys('tenentId', 'resource')

        // [ ] create gql api
        const gql = new GraphQLConstruct(this, 'med-api')

        gql.createApi('med-api', './graphql/med.schema.gql')

        gql
            .mutation('createPatient')
            .fn(async function (event) {
                const aws = require('aws-sdk')
                const dynamo = new aws.DynamoDB.DocumentClient()
                console.log(JSON.stringify(event, undefined, 2))

                const patient = event.arguments.resource
                const params = {
                    TableName: process.env.TABLE_NAME,
                    Item: patient,
                }
                await dynamo.put(params).promise()
                console.log('patient', patient)
                return patient
            }, {
                name: 'create-patient',
                env: { ...props?.env, TABLE_NAME: patientTable.table.tableName },
                access: [(fn) => patientTable.table.grantWriteData(fn)],
            })
            .end()

        gql
            .query('getPatient')
            .fn(async function (event) {
                const aws = require('aws-sdk')
                const dynamo = new aws.DynamoDB.DocumentClient()
                console.log(JSON.stringify(event, undefined, 2))
                const { tenentId, resource } = event.arguments.key

                const params = {
                    TableName: process.env.TABLE_NAME,
                    Key: { tenentId, resource }
                }
                console.log(params)
                const res = await dynamo.get(params).promise()

                return res.Item
            }, {
                name: 'get-patient',
                env: { ...props?.env, TABLE_NAME: patientTable.table.tableName },
                access: [(fn) => patientTable.table.grantReadData(fn)],
            })
            .end()


        gql.query('listPatients')
            .pipe()
            .fn(async function (event) {
                console.log(JSON.stringify(event, undefined, 2))
                console.log('filtering by doctor tenent id')
                // const userToken = event.request.headers.Authorization // this can be the JWT
                if (process.env.ALLOW_USER !== 'true') throw new Error('🧙 You shall not pass!!!')
                return event
            }, {
                name: 'authorize-user',
                env: { ALLOW_USER: 'true' }
            })
            .fn(async function (event) {
                const aws = require('aws-sdk')
                const dynamo = new aws.DynamoDB.DocumentClient()
                console.log(JSON.stringify(event, undefined, 2))

                const params = {
                    TableName: process.env.TABLE_NAME,
                }
                console.log(params)
                const res = await dynamo.scan(params).promise()

                console.log(res.Items)

                const allowedTenent = ['tenent1', 'tenent3']
                const Items = res.Items.filter(item => {
                    return allowedTenent.findIndex(allowed => allowed === item.tenentId) !== -1
                })

                return Items
            }, {
                name: 'list-patients',
                env: { ...props?.env, TABLE_NAME: patientTable.table.tableName },
                access: [(fn) => patientTable.table.grantReadData(fn)],
            })
            .end()


        /*
        gql.subscription('onCreatePatient')
                .setFilter(`
                    ## Response Mapping Template - onCreatePatient subscription
                    $extensions.setSubscriptionFilter({
                        "filterGroup": [
                            {
                                "filters" : [
                                    {
                                        "tenentId" : "tenent1",
                                    }
                                ]
                            },{
                                "filters" : [
                                    {
                                        "tenentId" : "tenent3",
                                    }
                                ]

                            }
                        ]
                    })

                    $util.toJson($context.result)
                `)/* */
    }

}


/*
[Authorization and Authentication](https://docs.aws.amazon.com/appsync/latest/devguide/security-authz.html)

https://docs.aws.amazon.com/appsync/latest/devguide/what-is-appsync.html

https://docs.aws.amazon.com/appsync/latest/devguide/aws-appsync-real-time-enhanced-filtering.html

[filtering subs](https://aws.amazon.com/blogs/mobile/appsync-enhanced-filtering/)


*/


/*
Example request
*/


// {
//     "arguments": {
//         "resource": {
//             "tenentId": "tenent1",
//             "resource": "patient1",
//             "Data": "test data"
//         }
//     },
//     "identity": null,
//     "source": null,
//     "request": {
//         "headers": {
//             "x-forwarded-for": "172.11.78.176, 70.132.36.136",
//             "cloudfront-viewer-country": "US",
//             "cloudfront-is-tablet-viewer": "false",
//             "x-amzn-requestid": "52d38bca-abab-4b6a-9716-a4b6421abde0",
//             "via": "2.0 45a2765e8899cfc33e0aa485520ceb14.cloudfront.net (CloudFront)",
//             "cloudfront-forwarded-proto": "https",
//             "origin": "https://us-east-2.console.aws.amazon.com",
//             "content-length": "309",
//             "x-forwarded-proto": "https",
//             "accept-language": "en-US,en;q=0.5",
//             "host": "oacl5nddqvejhnjzixueiaoqdu.appsync-api.us-east-2.amazonaws.com",
//             "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:102.0) Gecko/20100101 Firefox/102.0",
//             "cloudfront-is-mobile-viewer": "false",
//             "accept": "application/json, text/plain, */*",
//             "cloudfront-viewer-asn": "7018",
//             "cloudfront-is-smarttv-viewer": "false",
//             "accept-encoding": "gzip, deflate, br",
//             "referer": "https://us-east-2.console.aws.amazon.com/",
//             "content-type": "application/json",
//             "x-api-key": "da2-gmjkosu6krgqjl4jbn2tiuynfa",
//             "sec-fetch-mode": "cors",
//             "x-amz-cf-id": "dfZHBlT5QRJzBz9MvT-h0EDzs1FJKgJ6gQX8KsoI6RdGURLZwqy3uQ==",
//             "x-amzn-trace-id": "Root=1-63652b0f-3ab0765c015fe5473b23d502",
//             "sec-fetch-dest": "empty",
//             "x-amz-user-agent": "AWS-Console-AppSync/",
//             "cloudfront-is-desktop-viewer": "true",
//             "sec-fetch-site": "cross-site",
//             "x-forwarded-port": "443"
//         },
//         "domainName": null
//     },
//     "prev": null,
//     "info": {
//         "selectionSetList": [
//             "tenentId",
//             "resource",
//             "Data"
//         ],
//         "selectionSetGraphQL": "{\n  tenentId\n  resource\n  Data\n}",
//         "fieldName": "createPatient",
//         "parentTypeName": "Mutation",
//         "variables": {}
//     },
//     "stash": {}
// }

