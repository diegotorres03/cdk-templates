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
import { DynamoCostruct } from './dynamodb/dynamo-construct'
import { ApiBuilderConstruct } from './rest-api/api-builder-construct'
import { WebAppConstruct } from './webapp/webapp-construct'
// import { } from ''
// import { } from ''
// import { } from ''


// const output = 
interface FullDemoStackProps extends StackProps {
    daxSubnetIds: string[] // subnet-a66de6cd –	subnet-a65392db – subnet-055f7749
    daxSecurityGroupIds: string[] // sgr-022dc12c5095e64c1
}

export class FullDemoStack extends Stack {

    constructor(scope: Construct, id: string, props: FullDemoStackProps) {
        // @ts-ignore
        super(scope, id, props)

        // [ ] create table
        const table = new DynamoCostruct(this, 'items-table')
        table.addKeys('partition', 'sort')
        table.createDax({
            securityGroupIds: props.daxSecurityGroupIds,
            subnetIds: props.daxSubnetIds
        })

        // [ ] create rest api

        // [ ] create graphql api

        // [ ] create web app



    }
}

