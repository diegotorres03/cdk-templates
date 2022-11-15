import {
    Stack,
    StackProps,
    aws_codepipeline as CodePipeline,
    aws_codecommit as CodeCommit,
    CfnOutput,
    RemovalPolicy,
    Duration,
} from 'aws-cdk-lib'
import { Construct } from 'constructs'

const { log, warn, error } = console



export class PipeConstruct extends Construct {

    constructor(scope: Construct, id: string) {
        super(scope, id)

        // [ ] example of every step

        // [ ] create repo
        const codeRepo = new CodeCommit.Repository(this, 'code-repo', {
            repositoryName: 'web-components-library',
            description: 'public web component repository, usefull for quick PoCs',
        })

        // [ ] create pipeline
        // [ ] build
        // [ ] deploy
        // [ ] artifact repo

        // const pipeline = new CodePipeline.Pipeline(this, 'pipeline', {
        //     crossAccountKeys: false,
        //     stages: [
        //         {
        //             stageName: '',
        //             actions: [],
        //         }
        //     ],
        // })
        // pipeline.addStage({ stageName: '', actions: [], })
        
        // const someStage = pipeline.addStage({
        //     stageName: 'SomeStage',
        //     transitionToEnabled: false,
        //     transitionDisabledReason: 'Manual transition only', // optional reason
        // })

        // someStage.addAction(someAction)


    }



}