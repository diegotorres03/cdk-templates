import * as cdk from 'aws-cdk-lib';
import { error } from 'console';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';
import { PipeConstruct } from './pipeline/pipeline-construct'

export class PipelineTestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // const webapp = new WebAppConstruct()

    // webapp.addAssets('./path/to/assets')

    const pipe = new PipeConstruct(this, 'main-pipeline')

    const codeRepo = pipe.createCodeRepository('code-repo')

    pipe
      .source(codeRepo)
      .build({
        version: '0.2',
        phases: {
          pre_build: { commands: [ 'echo "pre build!!"' ]},
          build: {
            commands: [
              'echo "building stuff!!"',
              'npm i -g browserify',
              'ls',
              'npm run build',
              'aws s3 cp '
            ]
          },
          post_build: {commands: [ 'echo "post build!!"']},
        }
      })
      .catch(err => pipe.retry(3))
      .build({
        version: '0.2',
        phases: {
          pre_build: { commands: [ 'echo "pre build!!"' ]},
          build: {
            commands: [
              'echo "building stuff!!"',
              'npm i -g browserify',
              'ls',
              'npm run build',
              'aws s3 cp '
            ]
          },
          post_build: {commands: [ 'echo "post build!!"']},
        }
      })
      .catch(err => {
        error(err.message)
        return pipe.skip()
      })
      .deploy('webapp')
      .deploy('arn:Lambda:fn')
  }
}
