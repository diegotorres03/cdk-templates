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

import { ApiBuilderConstruct } from './rest-api/src/api-builder-construct'
import { DynamoCostruct } from './dynamodb'


import { Construct } from 'constructs'
import { Table } from 'aws-cdk-lib/aws-dynamodb'
// import * as sqs from 'aws-cdk-lib/aws-sqs'

interface TablesStackProps extends StackProps {
    daxSubnetIds: string[] // subnet-a66de6cd –	subnet-a65392db – subnet-055f7749
    daxSecurityGroupIds: string[] // sgr-022dc12c5095e64c1
}

export class TableStack extends Stack {

    public readonly table: Dynamo.Table
    public readonly daxCache: Dax.CfnCluster

    constructor(scope: Construct, id: string, props: TablesStackProps) {
        super(scope, id, props)

        const table = new DynamoCostruct(this, 'dynamo-table')
        // table.addDax() // add an existing DAX cluster
        table.createDax({
            subnetIds: props.daxSubnetIds,
            securityGroupIds: props.daxSecurityGroupIds
        }) // create a new DAX cluster

        table.addStreamHandler([
            DynamoCostruct.operations.INSERT,
            DynamoCostruct.operations.DELETE,
        ],
            // @ts-ignore    
            function (oldItem, newItem) {
                return {
                    statusCode: 200,
                    body: JSON.stringify({ oldItem, newItem }),
                    headers: { 'Content-Type': 'application/json' },
                }
            },
            {

            })


        // // [ ] Dynamo table
        // this.table = new Dynamo.Table(this, 'testTable', {
        //     tableName: PhysicalName.GENERATE_IF_NEEDED,
        //     billingMode: Dynamo.BillingMode.PAY_PER_REQUEST,
        //     partitionKey: { name: 'partition', type: Dynamo.AttributeType.STRING },
        //     sortKey: { name: 'sort', type: Dynamo.AttributeType.STRING },
        // })

        // new CfnOutput(this, 'tableName', {
        //     value: this.table.tableName,
        //     exportName: 'tableName'
        // })

        // // [ ] stream?


        // // [ ] Dax?
        // const daxRole = new iam.Role(this, 'DaxRole', {
        //     assumedBy: new iam.ServicePrincipal('dax.amazonaws.com'),
        //     description: 'service role for DAX',
        // })

        // daxRole.addToPolicy(new iam.PolicyStatement({
        //     effect: iam.Effect.ALLOW,
        //     actions: ['dynamodb:*'],
        //     resources: [this.table.tableArn],
        // }))

        // const daxSubnetGroup = new Dax.CfnSubnetGroup(this, 'DaxSubnetGroup', {
        //     description: 'private subnet group for DAX',
        //     subnetIds: props.daxSubnetIds, // [] create a subnet and get the id
        //     subnetGroupName: 'dax-test-group',
        // })

        // this.daxCache = new Dax.CfnCluster(this, 'DaxCluster', {
        //     iamRoleArn: daxRole.roleArn,
        //     nodeType: 'dax.t3.small',
        //     replicationFactor: 1,
        //     // securityGroupIds: props.daxSecurityGroupIds,
        //     subnetGroupName: daxSubnetGroup.ref
        // })



        // new CfnOutput(this, 'daxEndpoint', {
        //     value: this.daxCache.attrClusterDiscoveryEndpointUrl,
        //     exportName: 'daxClusterEndpointUrl'
        // })

    }

}