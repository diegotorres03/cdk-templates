import {
    Stack,
    StackProps,
    aws_lambda as Lambda,
    aws_ec2 as EC2,
    aws_iam as IAM,
    CfnOutput,
    RemovalPolicy,
    Duration,
} from 'aws-cdk-lib'
import { Construct } from 'constructs'

const { log, warn, error } = console

// function exampleUsage() {
//     const fn = new FunctionConstruct()
//     fn
//         .layer('s3:/bucket/folder/key')
//         .layer('./local/paht/to/assets')
//         .layer(function someFunction(params){console.log(params)})

//     fn.handler(function handler(event, context) {
//         console.log(event, runInNewContext)
//         return {success: true}
//     })

// }

export interface FunctionOptions {
    name: string
    env: any
    access: Function[]
    vpc: EC2.Vpc | string
    securityGroupIds: string[]
    layers?: Lambda.ILayerVersion[]
}

export class FunctionConstruct extends Construct {

    layers: Map<string, Lambda.LayerVersion> = new Map()
    layersToUse: Set<Lambda.LayerVersion> = new Set()

    constructor(scope: Construct, id: string) {
        super(scope, id)
    }

    /**
     * create a layer from local file, s3 url or existing layer construct
     *
     * @author Diego Torres
     * @memberof FunctionConstruct
     * @param {string} name - layer friendly name
     * @param {string} path - local or s3 path to layer folder
     * @return {Lambda.LayerVersion} 
     */
    createLayer(name: string, path: string): Lambda.LayerVersion {
        console.info(`creating layer ${name} using ${path}`)
        const layer = new Lambda.LayerVersion(this, name, {
            removalPolicy: RemovalPolicy.DESTROY,
            code: Lambda.Code.fromAsset(path), // './layers/dax'
        })
        this.layers.set(name, layer)
        return layer
    }

    useLayer(name: string) {
        const layer = this.layers.get(name)
        if (!layer) return warn(`layer ${name} not found!`)
        this.layersToUse.add(layer)
    }

    handler(functionCode: string | Function, options: FunctionOptions) {
        if (!options.name) throw new Error('name is required')

        let vpc
        let sgs
        if (options.vpc) {
            vpc = options.vpc === 'default' ?
                EC2.Vpc.fromLookup(this, 'default-vpc-' + options.name, { isDefault: true }) :
                options.vpc as EC2.Vpc
            sgs = [EC2.SecurityGroup.fromLookupByName(this, 'defaultSG-' + options.name, 'default', vpc)]
            //  sgs = Array.isArray(options.securityGroupIds) ? options.securityGroupIds
            //     .map(sgId => EC2.SecurityGroup.fromSecurityGroupId(this, 'sgid', sgId)) : []
            // console.log('sgids', options.securityGroupIds)
            // console.log(sgs)
        }


        const lambdaParams = {
            runtime: Lambda.Runtime.NODEJS_16_X,
            code: getCode(functionCode),
            timeout: Duration.minutes(1),
            layers: Array.from(this.layersToUse),
            // code: Lambda.Code.fromAsset(lambdaDef.path),
            allowPublicSubnet: vpc ? true : undefined,
            securityGroups: sgs,
            handler: 'index.handler',
            vpc,
            environment: { ...options.env }
        } as Lambda.FunctionProps

        const lambda = new Lambda.Function(this, options.name, lambdaParams)

        if (options && Array.isArray(options.access)) {
            options.access.forEach(fn => fn(lambda))
        }

        return lambda
    }

}


function getCode(source: string | Function,) {
    if(typeof source === 'string') {
        if(source.includes('s3://')) {
            // const bucket = ''
            // const key = ''
            // return Lambda.Code.fromBucket(bucket, key)
        }
        return Lambda.Code.fromAsset(source)        
    }

    let code
    const functionCodeStr = source.toString()

    if (functionCodeStr.includes('exports.handler = ')) {
        // console.log('full function')
        code = `(${functionCodeStr})()`
    } else {
        // console.log('handler function')
        code = `(function() {
            exports.handler = ${functionCodeStr}
        })()`
        // console.log(code)
    }
    return Lambda.Code.fromInline(code)
}
