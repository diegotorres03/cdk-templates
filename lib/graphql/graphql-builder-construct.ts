// Note, require 
// https://aws.amazon.com/blogs/mobile/building-scalable-graphql-apis-on-aws-with-cdk-and-aws-appsync/
import {
    Stack, StackProps,
    aws_appsync as AppSync,
    aws_apigateway as ApiGateway,
    aws_ec2 as EC2,
    aws_iam as IAM,
    aws_lambda as Lambda,
    aws_s3 as S3,
    aws_s3_deployment as S3Deployment,
    RemovalPolicy,
    CfnOutput,
    Duration,
} from 'aws-cdk-lib'
// import * as AppSync from '@aws-cdk/aws-appsync'
import { Construct } from 'constructs'
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import { promises as fs } from 'fs'

const { log } = console

import { ApiBuilderConstruct } from '../rest-api/api-builder-construct'

const getHandlerFromInlineFn = (fn: Function) => {
    const functionCodeStr = fn.toString()
    let code

    if (functionCodeStr.includes('exports.handler = ')) {
        code = `(${functionCodeStr})()`
    } else {
        code = `(function() {
            exports.handler = ${functionCodeStr}
        })()`
        log(code)
    }
    return code
}

const next = (resolverParams: any, run: Function) => ({
    requestMapping(mappingTemplate: string) {
        resolverParams['requestMappingTemplate'] = mappingTemplate
        log(mappingTemplate)
        return this
    },
    responseMapping(mappingTemplate: string) {
        resolverParams['responseMappingTemplate'] = mappingTemplate
        log(mappingTemplate)
        return this
    },
    end() {
        log(resolverParams)
        return run(resolverParams)
    }
})


// const output = 

export class GraphQLConstruct extends Construct {

    private api: AppSync.CfnGraphQLApi

    private httpDataSource: AppSync.CfnDataSource

    private http = (type: string, fieldName: string, apiId: string) => (endpoint: { url: string, method?: string }) => {
        log(endpoint)

        this.httpDataSource = new AppSync.CfnDataSource(this, `http-data-source-${type}-${fieldName}`, {
            apiId: apiId,
            name: `httpDataSource_${type}_${fieldName}`,
            type: 'HTTP',
            httpConfig: {
                // authorizationConfig: {
                //     authorizationType: 'AWS_IAM'
                // },
                endpoint: endpoint.url,

            },

        })


        return next({}, (params: any) => {
            const resolverParams = {
                apiId,
                typeName: type,
                fieldName,
                dataSourceName: this.httpDataSource.name,
                requestMappingTemplate: params.requestMappingTemplate,
                responseMappingTemplate: params.responseMappingTemplate,

            } as AppSync.CfnResolverProps
            console.table(resolverParams)
            const resolver = new AppSync.CfnResolver(this, `resolver-${type}-${fieldName}`, resolverParams)
            resolver.addDependsOn(this.httpDataSource)

        })

    }


    private fn = (type: string, fieldName: string, apiId: string) => (inlineFn: Function, options?: any) => {
        const lambda = this.createLambda(inlineFn, options)
        const involeLambdaPolicy = new IAM.PolicyDocument({
            statements: [
                new IAM.PolicyStatement({
                    effect: IAM.Effect.ALLOW,
                    actions: ['lambda:InvokeFunction'],
                    resources: [lambda.functionArn],
                }),
            ],
        })

        const invokeLambdaRole = new IAM.Role(this, `invokeLambdaRole-${type}-${fieldName}`, {
            assumedBy: new IAM.ServicePrincipal('appsync.amazonaws.com'),
            inlinePolicies: {
                InvokeLambda: involeLambdaPolicy,
            },
        })


        const dataSource = new AppSync.CfnDataSource(this, `gql-data-source-${type}-${fieldName}`, {
            apiId: apiId,
            name: `notesLambda_${type}_${fieldName}`,
            type: 'AWS_LAMBDA',
            lambdaConfig: { lambdaFunctionArn: lambda.functionArn },
            serviceRoleArn: invokeLambdaRole.roleArn, // este me falto
        })



        return next({ lambda }, (params: any) => {
            const resolver = new AppSync.CfnResolver(this, 'resolver-' + fieldName, {
                apiId: apiId,
                typeName: type,
                fieldName: fieldName,
                dataSourceName: dataSource.name,
                requestMappingTemplate: params.requestMappingTemplate,
                responseMappingTemplate: params.responseMappingTemplate,
                pipelineConfig: {
                    functions: []
                }

            })
            resolver.addDependsOn(dataSource)
        })
    }

    constructor(scope: Construct, id: string, props?: StackProps) {
        // @ts-ignore
        super(scope, id, props)
    }

    async createApi(schemaPath: string) {

        this.api = new AppSync.CfnGraphQLApi(this, 'gql-api', {
            name: 'demo-api',
            authenticationType: 'API_KEY', //  API_KEY, AWS_IAM, AMAZON_COGNITO_USER_POOLS, OPENID_CONNECT, or AWS_LAMBDA
            xrayEnabled: true,


        })

        const schema = new AppSync.CfnGraphQLSchema(this, 'gql-api-schema', {
            apiId: this.api.attrApiId,
            definition: (await fs.readFile(schemaPath)).toString(),
        })

        new CfnOutput(this, `gql-api-id`, { value: this.api.attrApiId })
        new CfnOutput(this, `gql-api-url`, { value: this.api.attrGraphQlUrl })


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

        let vpc
        let sgs
        if (options.vpc) {
            vpc = options.vpc as EC2.Vpc
            sgs = [EC2.SecurityGroup.fromLookupByName(this, 'defaultSG-' + options.name, 'default', options.vpc)]
            //  sgs = Array.isArray(options.securityGroupIds) ? options.securityGroupIds
            //     .map(sgId => EC2.SecurityGroup.fromSecurityGroupId(this, 'sgid', sgId)) : []
            log('sgids', options.securityGroupIds)
            log(sgs)
        }


        const functionCodeStr = functionCode.toString()
        let code

        if (functionCodeStr.includes('exports.handler = ')) {
            log('full function')
            code = `(${functionCodeStr})()`
        } else {
            log('handler function')
            code = `(function() {
                exports.handler = ${functionCodeStr}
            })()`
            log(code)
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


        // log('\n\nlambda params')
        // log(lambdaParams)

        const lambda = new Lambda.Function(this, options.name, lambdaParams)

        new CfnOutput(this, `${options.name}-lambda-arn`, { value: lambda.functionArn })


        if (options && Array.isArray(options.access)) {
            options.access.forEach(fn => fn(lambda))
        }

        return lambda
    }



    mutation(fieldName: string) {
        return {
            fn: this.fn('Mutation', fieldName, this.api.attrApiId),
            // http, dynamo,
        }
    }


    query(fieldName: string) {


        const dynamo = (tableName: string) => {
            return next({ tableName }, (params: any) => { })
        }


        const pipe = (pipeContext: any = {}) => {

            const handlers = {
                fn: (...params) => {
                    console.log('on pipeline lambda handler')
                    if(!pipeContext.lambdas) pipeContext.lambdas = []
                    pipeContext.lambdas.push(params)
                    return handlers
                },
                html: () => { },
                dynamo: () => { },
                endPipe: () => { return }
            }
            return handlers
        }

        return {
            fn: this.fn('Query', fieldName, this.api.attrApiId),
            http: this.http('Query', fieldName, this.api.attrApiId),
            dynamo,
            pipe,
        }
    }

    subscription(fieldName: string) { }

    /**
     * This method enable pipeline resolvers
     */
    pipe(fn: Lambda.Function) {

        const html = () => { }
        const dynamo = (tableName: string) => {
            return next({ tableName }, (params: any) => { })
        }


        return {
            fn: () => { },
            html: () => { },
            dynamo: () => { },
        }
    }



}


