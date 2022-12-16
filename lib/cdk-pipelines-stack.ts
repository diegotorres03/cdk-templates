import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines'
import * as CodeCommit from 'aws-cdk-lib/aws-codecommit'
import { CfnOutput } from 'aws-cdk-lib'

const createCodeRepository = (scope: Construct, name: string, path?: string) => {
    // [ ] create repo
    const codeRepo = new CodeCommit.Repository(scope, name, {
        repositoryName: name,
        description: 'public web component repository, usefull for quick PoCs',
        code: path ? CodeCommit.Code.fromDirectory(path) : undefined,
    })

    new CfnOutput(scope, 'codeRepoSSH', { value: codeRepo.repositoryCloneUrlSsh, })
    new CfnOutput(scope, 'codeRepoHTTPS', { value: codeRepo.repositoryCloneUrlHttp, })
    return codeRepo
}
export class CDKPipelineTestStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        const codeRepo = createCodeRepository(this, 'cdk-pipelines-test')

        const pipeline = new CodePipeline(this, 'Pipeline', {
            pipelineName: 'MyPipeline',
            synth: new ShellStep('Synth', {
                input: CodePipelineSource.codeCommit(codeRepo, 'main'),
                commands: ['npm ci', 'npm run build', 'npx cdk synth']
            })
        })
    }
}