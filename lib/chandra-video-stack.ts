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

import { WebAppConstruct } from './webapp'

// const responseHeaders = {
//     "Content-Type": "application/json",
//     "Access-Control-Allow-Headers": "Content-Type",
//     "Access-Control-Allow-Origin": "*",
//     "Access-Control-Allow-Methods": "OPTIONS,POST,GET,PUT,PATCH"
// }

export class ChandraDemoStack extends Stack {

    constructor(scope: Construct, id: string, props?: StackProps) {
        // @ts-ignore
        super(scope, id, props)

        const chandraVideo =  new WebAppConstruct(this, 'chandra-video')
        // chandraVideo.addAssets('C:/Users/diegotrs/Downloads/chandra-video')

    }
}