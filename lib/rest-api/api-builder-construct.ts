import {
    Stack, StackProps,
    aws_apigateway as ApiGateway,
    aws_ec2 as EC2,
    aws_iam as IAM,
    aws_dynamodb as DynamoDB,
    aws_lambda as Lambda,
    aws_s3 as S3,
    aws_s3_deployment as S3Deployment,
    RemovalPolicy,
    CfnOutput,
    Duration
} from 'aws-cdk-lib'
import { Construct } from 'constructs'
// import * as sqs from 'aws-cdk-lib/aws-sqs';


/**
 * @typedef {Object} LambdaDef
 * @property {string} path - path to code 
 * @property {handler} handler - file and method name, like index.handle 
 * @property {Object} env - environment variables 
 */

interface LambdaDef {
    runtime?: Lambda.Runtime
    path: string
    handler?: string
    env?: any
    name?: string
}

export class ApiBuilderConstruct extends Construct {

    // private codeBucket: S3.bucket

    constructor(scope: Construct, id: string) {
        super(scope, id)
    }


    createApi(apiName: string) {
        console.log('creating api <(*.*<)')
        let method = null
        let path = null
        const api = new ApiGateway.RestApi(this, apiName, {
            deployOptions: { stageName: process.env.STAGE || 'dev' },
            defaultCorsPreflightOptions: {
                allowOrigins: ApiGateway.Cors.ALL_ORIGINS,
                allowMethods: ApiGateway.Cors.ALL_METHODS,
                allowHeaders: [
                    'Content-type', 'X-Amz-Date', 'X-Api-Key', 'Authorization',
                    'Access-Controll-Allow-Headers', 'Access-Controll-Allow-Origins', 'Access-Controll-Allow-Methods',
                ],
                allowCredentials: true,
            },
        })


        const apiUrl = new CfnOutput(this, 'apiUrl', { value: api.url })

        const requestHandler = (method: string) => (path: string, lambdaCode: Function, options: any) => {
            console.log(`creating ${method} <(*.*<)`)


            const lambda = this.createLambda(lambdaCode, options)

            if (Array.isArray(options.layers))
                options.layers.forEach((layer: Lambda.LayerVersion) => lambda.addLayers(layer))

            console.log('adding path', path)

            api.root.resourceForPath(path)
                // api.root.addResource(path)
                .addMethod(method,
                    new ApiGateway.LambdaIntegration(lambda, { proxy: true }))
        }

        const methods = {
            /**
             * 
             * @param {string} path - path on api, like users/{id}/profile 
             * @param {LambdaDef} lambdaDef 
             */
            post: requestHandler('POST'),

            get: requestHandler('GET'),

            delete: requestHandler('DELETE'),

            patch: requestHandler('PATCH'),

            put: requestHandler('PUT'),

        }
        return { api, ...methods }
    }

    /**
     * original location api-builder.ts
     * @author Diego Torres <diegotorres@easyarchery.net>
     * @version 1.0.0
     * @param {LambdaDef} LambdaDef 
     * @returns 
     */
    createLambda(functionCode: Function, options: {
        name: string, env: any, access: Function[], vpc: EC2.Vpc, securityGroupIds: string[]
    }) {
        if (!options.name) throw new Error('name is required')

        let vpc = undefined
        let sgs = undefined
        if (options.vpc) {
            vpc = options.vpc as EC2.Vpc
            sgs = [EC2.SecurityGroup.fromLookupByName(this, 'defaultSG', 'default', options.vpc)]
            //  sgs = Array.isArray(options.securityGroupIds) ? options.securityGroupIds
            //     .map(sgId => EC2.SecurityGroup.fromSecurityGroupId(this, 'sgid', sgId)) : []
            console.log('sgids', options.securityGroupIds)
            console.log(sgs)
        }


        const functionCodeStr = functionCode.toString()
        let code = undefined

        if (functionCodeStr.includes('exports.handler = ')) {
            console.log('full function')
            code = `(${functionCodeStr})()`
        } else {
            console.log('handler function')
            code = `(function() {
                exports.handler = ${functionCodeStr}
            })()`
            console.log(code)
        }

        const lambdaParams = {
            runtime: Lambda.Runtime.NODEJS_16_X,
            code: Lambda.Code.fromInline(code),
            timeout: Duration.minutes(1),
            // code: Lambda.Code.fromAsset(lambdaDef.path),
            allowPublicSubnet: vpc ? true : undefined,
            securityGroups: sgs,
            handler: 'index.handler',
            vpc,
            environment: { ...options.env }
        }


        // console.log('\n\nlambda params')
        // console.log(lambdaParams)

        const lambda = new Lambda.Function(this, options.name, lambdaParams)

        if (options && Array.isArray(options.access)) {
            options.access.forEach(fn => fn(lambda))
        }

        return lambda
    }

    createLayer(name: string, path: string) {
        console.info(`creating layer ${name} using ${path}`)
        const layer = new Lambda.LayerVersion(this, name, {
            removalPolicy: RemovalPolicy.DESTROY,
            code: Lambda.Code.fromAsset(path), // './layers/dax'
        })
        return layer
    }

}
