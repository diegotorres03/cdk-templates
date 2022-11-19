import {
    Stack,
    StackProps,
    aws_codeartifact as CodeArtifact,
    aws_codepipeline as CodePipeline,
    aws_codecommit as CodeCommit,
    aws_codepipeline_actions as CodePipelineActions,
    aws_codebuild as CodeBuild,
    CfnOutput,
    RemovalPolicy,
    Duration,
} from 'aws-cdk-lib'
import { Construct } from 'constructs'

const { log, warn, error } = console

let buildCount = 0

export class PipeConstruct extends Construct {

    pipeline: CodePipeline.Pipeline
    sourceOutput: CodePipeline.Artifact

    constructor(scope: Construct, id: string) {
        super(scope, id)

        // [ ] example of every step



        // [ ] create pipeline
        // [ ] build
        // [ ] deploy
        // [ ] artifact repo

        this.pipeline = new CodePipeline.Pipeline(this, 'pipeline', {
            crossAccountKeys: false,
        })




    }

    getBuildCount() {
        return buildCount++
    }


    createCodeRepository(name: string) {
        // [ ] create repo
        const codeRepo = new CodeCommit.Repository(this, name, {
            repositoryName: 'web-components-library',
            description: 'public web component repository, usefull for quick PoCs',
        })

        new CfnOutput(this, 'codeRepoSSH', { value: codeRepo.repositoryCloneUrlSsh, })
        new CfnOutput(this, 'codeRepoHTTPS', { value: codeRepo.repositoryCloneUrlHttp, })
        return codeRepo
    }


    source(codeRepo: CodeCommit.Repository) {
        this.sourceOutput = new CodePipeline.Artifact()
        const sourceAction = new CodePipelineActions.CodeCommitSourceAction({
            actionName: 'CodeCommit',
            repository: codeRepo,
            output: this.sourceOutput,
        })


        const sourceStage = this.pipeline.addStage({ stageName: 'Source' })
        sourceStage.addAction(sourceAction)

        return this
    }

    build(buildSpecJson: any) {
        // https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html
        const count = this.getBuildCount()
        const buildProject = new CodeBuild.Project(this, 'Build-project-' + count , {
            buildSpec: CodeBuild.BuildSpec.fromObject(buildSpecJson)
        })

        const buildStage = this.pipeline.addStage({ stageName: 'Build-' + count })
        buildStage.addAction(new CodePipelineActions.CodeBuildAction({
            actionName: 'CodeBuild',
            project: buildProject,
            input: this.sourceOutput,
            outputs: [new CodePipeline.Artifact()],
        }))
        return this
    }

    deploy(target: any) {
        return this
    }
}