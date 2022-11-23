import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

import { PipeConstruct } from './pipeline/pipeline-construct'

export class CdkConstructsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // [x] create an instance of pipeline construct
    const pipe = new PipeConstruct(this, 'cdk-constructs-pipeline')

    // [x] create code repo.
    const codeRepo = pipe.createCodeRepository('cdk-constructs')

    // [x] create artifact domain.
    const artifactDomain = pipe.createArtifactDomain('diegotrs-constructs')

    // [x] create artifact repo.
    const artifactRepo = pipe.createArtifactRepository(artifactDomain.domainName, 'cdk-constructs')
    artifactRepo.addDependsOn(artifactDomain)

    // [ ] create pipeline.
    pipe.source(codeRepo)
      // [ ] create pipeline source.
      .build({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              // 'python': '3.10',
              'nodejs': '16',
              // 'java': 'corretto17',
              // 'dotnet': '6.0'
            },
            commands: ['npm i -g aws-cdk@2.46.0', 'npm i']
          },
          pre_build: {commands: ['npm --version', 'node --version']},
          build: { commands: ['cdk deploy --all --require-approval never'] },
          post_build: {commands: ['echo "OMFG!! its working \\(*.*)/  "']},
        }
      })
      .build({
        version: '0.2',
        pahses: { build: {commands: ['echo "this can be the cfn-guard step, just use before the other"'] } }
      })



    // [ ] create pipeline build.

    // [ ] create stack.
    // [ ] .
    // [ ] .

  }
}



// --require-approval

