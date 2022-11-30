// command to connect to the repo from npm
// aws codeartifact login --tool npm --domain my_domain --domain-owner 111122223333 --repository my_repo



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
// import { PipeConstruct } from './pipeline/pipe-construct'
import { PipeConstruct } from './pipeline/src/pipeline-construct'
import { error } from 'console'
import { CodeBuild } from 'aws-sdk'


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
        webapp.run('webapp', ['cat package.json','npm run build', 'ls'])
        webapp.addAssets('./webapp/dist')

        const pipe = new PipeConstruct(this, 'main-pipeline')

        const codeRepo = pipe.createCodeRepository('code-repo')
        const artifactDomain = pipe.createArtifactDomain('test-artifact-domain')
        const artifactRepo = pipe.createArtifactRepository(artifactDomain.domainName, 'test-artifact-repo')
        artifactRepo.addDependsOn(artifactDomain)


        pipe
            .source(codeRepo)
            .build({
                version: '0.2',
                phases: {
                    pre_build: {
                        commands: [
                            'echo "pre build!!"',
                            'npm i -g browserify',
                            'npm ci',
                        ]
                    },
                    build: {
                        commands: [
                            'echo "building stuff!!"',
                            'npm run build',
                            // `aws s3 cp ${webapp.webappBucket.bucketDomainName.toString()}`
                        ]
                    },
                    post_build: { commands: ['echo "post build!!"'] },
                }
            })
            .catch(err => pipe.retry(3))
            .build({
                version: '0.2',
                phases: {
                    pre_build: { commands: ['echo "pre build!!"'] },
                    build: {
                        commands: [
                            'echo "building stuff!!"',
                            'npm i -g browserify',
                            'ls',
                            'npm run build',
                            // 'aws s3 cp '
                        ]
                    },
                    post_build: { commands: ['echo "post build!!"'] },
                }
            }, {
                s3Bucket: webapp.webappBucket, 
            })
            .catch(err => {
                error(err.message)
                return pipe.skip()
            })
            .deploy('webapp')
            .deploy('arn:Lambda:fn')
    }

}

// asd
