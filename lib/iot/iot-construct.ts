import {
    Stack,
    StackProps,
    aws_lambda as Lambda,
    aws_ec2 as EC2,
    aws_iam as IAM,
    aws_iot as IoT,
    CfnOutput,
    RemovalPolicy,
    Duration,
} from 'aws-cdk-lib'
// import {} from '@aws-cdk/aws-iot'
import { Construct } from 'constructs'
import { FunctionConstruct } from '../lambda/function-construct'

const { log, warn, error } = console


// export interface FunctionOptions {
//     name: string
//     env: any
//     access: Function[]
//     vpc: EC2.Vpc | string
//     securityGroupIds: string[]
//     layers?: Lambda.ILayerVersion[]
// }

export class IoTConstruct extends Construct {

    layers: Map<string, Lambda.LayerVersion> = new Map()
    layersToUse: Set<Lambda.LayerVersion> = new Set()
    thingCounter = 0
    topicRules: Map<string, any> = new Map()
    topicName: string
    topicDescription: string
    query: string
    ruleHandler: FunctionConstruct



    constructor(scope: Construct, id: string) {
        super(scope, id)
    }

    topicRule(topicName: string) {
        this.topicName = topicName
        return this
    }

    description(topicDescription: string) {
        this.topicDescription = topicDescription
        return this
    }

    sql(query: string) {
        this.query = query
        return this
    }

    fn(code: Function, options?) {
        const handler = new FunctionConstruct(this, `thing_${this.topicName}`)
        handler.handler(code, options)
        this.ruleHandler = handler
        return this
    }
    end() {
        // const func = new lambda.Function(this, 'MyFunction', {
        //     runtime: lambda.Runtime.NODEJS_14_X,
        //     handler: 'index.handler',
        //     code: lambda.Code.fromInline(`
        //       exports.handler = (event) => {
        //         console.log("It is test for lambda action of AWS IoT Rule.", event);
        //       };`
        //     ),
        //   });

        new IoT.CfnTopicRule(this, 'TopicRule', {
            topicRulePayload: {
                sql: this.query,
                description: this.topicDescription,
                actions: [{
                    lambda: { functionArn: this.ruleHandler.lambda.functionArn }
                }]
            }
            // ruleName: `${this.topicName}-rule`,
            // RuleName: 'MyTopicRule', // optional
            // description: 'invokes the lambda function', // optional
            // sql: IoT.IotSql.fromStringAsVer20160323("SELECT topic(2) as device_id, timestamp() as timestamp FROM 'device/+/data'"),
            // actions: [new actions.LambdaFunctionAction(func)],
        });
    }

    // [ ] create thing
    createThing() {
        this.thingCounter += 1
        const thing = new IoT.CfnThing(this, `thing_${this.thingCounter}`, {

        })
    }

}



// [ ] create Certificate

// [ ] create policy

// [ ] connect thing and certificate

// [ ] connect policy and certificate