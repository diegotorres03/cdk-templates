import {
    Stack,
    StackProps,
    aws_s3 as S3,
    aws_s3_deployment as S3Deployment,
    aws_cloudfront as CloudFront,
    aws_cloudfront_origins as CloudFrontOrigins,
    aws_route53 as Route53,
    aws_certificatemanager as ACM,
    aws_iam as IAM,
    CfnOutput,
    RemovalPolicy,
} from 'aws-cdk-lib'
import { Construct } from 'constructs'

import { WebAppConstruct } from './webapp/webapp-construct'


// define properties for webapp stack
export interface WebappProps extends StackProps {

    /** @param {string} assetsPath where the website is located */
    assetsPath: string
    domainName?: string
}

export class WebAppStack extends Stack {
    constructor(scope: Construct, id: string, props: WebappProps) {
        super(scope, id, props)

        const webapp = new WebAppConstruct(this, 'webapp')
        webapp.addAssets(props.assetsPath)

    }
}
