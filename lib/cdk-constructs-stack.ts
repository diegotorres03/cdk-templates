import {
  Stack,
  StackProps,
  aws_iam as IAM,
  aws_codebuild as CodeBuild,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

import { PipeConstruct } from './pipeline/pipeline-construct'
const { log } = console


export class CdkConstructsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const AWS_ACCOUNT_ID = Stack.of(this).account

    // [x] create an instance of pipeline construct
    const pipe = new PipeConstruct(this, 'cdk-constructs-pipeline')

    // [x] create code repo.
    const codeRepo = pipe.createCodeRepository('cdk-constructs')

    // [x] create artifact domain.
    const artifactDomain = pipe.createArtifactDomain('diegotrs-constructs')

    // [x] create artifact repo.
    const artifactRepo = pipe.createArtifactRepository(artifactDomain.domainName, 'cdk-constructs', [
      // 'aws-cdk-lib',
    ])
    artifactRepo.addDependsOn(artifactDomain)

    const NPM_TOKEN = 'eyJ2ZXIiOjEsImlzdSI6MTY2OTgyMjgzMCwiZW5jIjoiQTEyOEdDTSIsInRhZyI6ImdoT2Vwekt0T0hYM3JZb0VqMGN3N2ciLCJleHAiOjE2Njk4NjYwMzAsImFsZyI6IkExMjhHQ01LVyIsIml2IjoiQXJiNFFLMllTRG40LWtoSSJ9.flg2DJBhGHOjs4j5PpkAPg.gUE0zgkt1sj8G3Gz.JsEAJN0GjSQsDcKksghu99lqgkLwHOs0-J9PYrvxVoJrA10imGrap6XpwAavR9att_i6bGGvGhBYbUyOVHdj-7dXqSayj6RGf8e7Xpm2CaPtCLpHHUqu5VMe2aNED9ZehgC5fwZDIibX2wlwczi8KFeTsOWIMFR1qO1QdFiAg4ZyD-ECMDKEMKqW26CSUG_tSsl_Km4OL8Bd984mRCpuaTywz26lz7R95Y5BpVIyY95maySJd_1StyqIhEGQGFTSGFsVvr2ASvBI74PzpdK2EDQCnw5Zv0Z-x5MIxsNQMBDw_-hCzsD0EWYl-y5e5nlEmPyQ4WOpb8pq5I-qXI-u4YICDtxZMnoBjYvs3rapgWSURbf3Iv7VYpnLGwOHRPVN9FEM1Xk1dObmP9N1MTwJO3wLeZn5RffT7eYaw3QFEV4iGmvliyXkDaBcVsDMaA_aEhp4v1R2GfPgS3vLd5w0HpnQghqtu4hrMJcVL68pOy7X3EoybGuTuclrJQHkoSKkHPIzhfCII8eZC5z1ZfxYjAcT0c_sgBthYdUpIZLQaHZYcXRNnzxKRgMjunuH28a6GyDDviglOQD9zB7KYXtOLCGdToe6JQZJp6kEVSkh2wJBa_fS6iJn3aJ4jMPF1qz8ueavPPuPO6m9kFQjn9CfAkhKCxNa4506JWgcnF5CROm4-6NZ7AHD9xAwKsq5xkxIw7OtiP7L657Zyk4Q0QTtBWjMC6JaQUGicG9vFmHa1X9W8U1PwJa-v8xzQGgQF5CeZGKRrM0ljXFr1D0G6I_Ref-gzIMI7lpdNgDNp03eJ3SiGjIEEYtE6w-FfGRMThK6NTtWIGQtAM4lleqlfrrgtSy3VyKwbpVR8XQ8HTWmSedDaZJtaay48Ejcc5XmGQRwHAf-uUaDVHSBTYrHONsF.iG4lqCbvVMDFeg0W9wgGxg'

    const packages = [
      'dynamodb',
      'graphql',
      'rest-api',
      'pipeline',
    ]

    // [x] create pipeline.
    pipe
      .source(codeRepo)
      // [x] create pipeline source.
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
          pre_build: { commands: ['npm --version', 'node --version'] },
          build: { commands: ['cdk deploy --all --require-approval never'] },
          post_build: { commands: ['echo "OMFG!! its working \\(*.*)/  "'] },
        }
      })

      // [ ] publish to code artifact
      .build({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'npm i -g typescript',
              // `aws codeartifact login --tool npm --domain ${artifactDomain.domainName} --repository ${artifactRepo.repositoryName}`
            ]
          },
          build: {
            commands: [
              `echo "artifactRepo.externalConnections = ${artifactRepo.externalConnections}"`,
              // `npm config set registry=https://diegotrs-constructs-760178732320.d.codeartifact.us-east-2.amazonaws.com/npm/${artifactRepo.repositoryName}/`,
              // `export NPM_TOKEN=eyJ2ZXIiOjEsImlzdSI6MTY2OTIxOTM1MCwiZW5jIjoiQTEyOEdDTSIsInRhZyI6Ik9UWDZmc1FMR05QMVM4WHpFSEdlUnciLCJleHAiOjE2NjkyNjI1NTAsImFsZyI6IkExMjhHQ01LVyIsIml2IjoiYmoyNG9KM2w2dTAtOF83WiJ9.TFOEAQe1zQAnu8tllpgH2w.Y5J8bHam3zJnkfdV.gfjByzHor--5ulnfgi_jn0vAGnLvIEypDc-LZNw9PP0PU2JA1pByecLtgUR8hU01EpkRHDr7F0A_E2ZZfu8DWNcDC-jrn_BQnGLVxpcDW0xgK2QzvWSSuT8usx8YkdJByj2KPGfA7rKeBOJp3F6IPNEZXbLYYNp4yOqWoyRfIZszkHfGsT6B-4dc4QGHpfUCoWUi4Iweo3hBxHCLA_gXztNmEf5M_1DXApY5ODE2jWX4X6TwQmcRqO0aXIVuCX-6lmClnMPdxsKgY0-tCMo8CkXSDuh0a4hBA8a3a9gX7_EbdztJHBfK8cbJg1la4Cn4e20gUkJj0aeMxpEmCG16Wy44ax92QpmEzVhnxuDs1HFo9dJP7s_79i3FyT4nvHdYe7-5WIaPmHjpQIOyZrIiueJu2yzihBzzUJRNWsV65FbL9rf8C_9ETG6rQ7Sip8KjDxKODkgFoGrRUQleBrtPYqnNeURUuY2GvXPrt6nWk3zwkMkM9EHp5kG5h_e4-perb8GT2wepKLgqxld77pAdIC8LmqIX7NT2BDgn5YFikSAKX0K4BZ_50GjZuv4sfIyRyz170P6LEgW7m5Lc8XhE1yofm5PD1S0pPNso3eGpskF9q-FbnuVC6Uh21WNlyPazS5N5qUGQcs8UWy9HOD0HeFH86sv9lBRKXIb41Q7twpX-dElv__zaZSG7NPRCzv_yN9ozGAx1bU-hbEvgWm42hTa66KOwKR0oJWHWwpzPkJ0w3H7fSnWYCfQgd1e-FyR5A1Fz55_vxIy8UuFWTC0kVcgIgiOGTMev1iFuP464dImikn9aN4lNqq0z_QtTEDV1y0NGpMEoMUb-A3UCZdOjPQyQpmXI7Hli8-ptc2K2lUU5H6aEBXgPmjnLKG-q65GI-WGkZVOmVV5OWUsqOUEv9P1nnQgcVCyA6gE1hWLXZYLyXD5-.xFVnUwF0TdXTFBU-dkZDjQ`,
              // `export NPM_REGISTRY=https://diegotrs-constructs-760178732320.d.codeartifact.us-east-2.amazonaws.com/npm/cdk-constructs/`,
              // `export NPM_TOKEN=\`aws codeartifact get-authorization-token --domain "${artifactDomain.domainName}" --domain-owner "${AWS_ACCOUNT_ID}" --query authorizationToken --output text\``,
              // `export NPM_REGISTRY=\`aws codeartifact get-repository-endpoint --domain "${artifactDomain.domainName}" --domain-owner "${AWS_ACCOUNT_ID}" --repository "${artifactRepo.repositoryName}" --format npm --query repositoryEndpoint --output text | sed s~^https://~~\``,
              // 'npm login',
              `npm config set registry=https://diegotrs-constructs-760178732320.d.codeartifact.us-east-2.amazonaws.com/npm/cdk-constructs/`,
              `npm config set //diegotrs-constructs-760178732320.d.codeartifact.us-east-2.amazonaws.com/npm/cdk-constructs/:_authToken=${NPM_TOKEN}`,
              ``,
              // 'ls',

              'cd lib/dynamodb',
              'npm version patch',
              'npm publish',

              'cd ../graphql',
              'npm version patch',
              'npm publish',

              'cd ../rest-api',
              'npm version patch',
              'npm publish',

              'cd ../webapp',
              'npm run build',
              'npm version patch',
              'npm publish',


              'cd ../pipeline',
              'npm version patch',
              'npm publish',

              'echo "this can be the cfn-guard step, just use before the other"',
            ]
          }
        }
      }, {
        access: [
          (buildProject: CodeBuild.Project) => buildProject.addToRolePolicy(new IAM.PolicyStatement({
            actions: ["codeartifact:GetAuthorizationToken"],
            resources: [`arn:aws:codeartifact:us-east-2:760178732320:domain/${artifactDomain.domainName}`],
            effect: IAM.Effect.ALLOW,
          })),

          (buildProject: CodeBuild.Project) => buildProject.addToRolePolicy(new IAM.PolicyStatement({
            actions: ['codeartifact:GetRepositoryEndpoint', 'codeartifact:ReadFromRepository'],
            resources: [`arn:aws:codeartifact:us-east-2:760178732320:domain/${artifactDomain.domainName}/${artifactRepo.repositoryName}`],
            effect: IAM.Effect.ALLOW,
          })),

          (buildProject: CodeBuild.Project) => buildProject.addToRolePolicy(new IAM.PolicyStatement({
            actions: ['codeartifact:PublishPackageVersion', 'codeartifact:PutPackageMetadata'],
            resources: [`arn:aws:codeartifact:us-east-2:760178732320:domain/${artifactDomain.domainName}/${artifactRepo.repositoryName}/*/*/*`],
            effect: IAM.Effect.ALLOW,
          })),

          (buildProject: CodeBuild.Project) => buildProject.addToRolePolicy(new IAM.PolicyStatement({
            actions: ['sts:GetServiceBearerToken'],
            resources: [`*`],
            conditions: {
              StringEquals: { 'sts:AWSServiceName': 'codeartifact.amazonaws.com' },
            },
            effect: IAM.Effect.ALLOW,
          })),

          (buildProject: CodeBuild.Project) => buildProject.addToRolePolicy(new IAM.PolicyStatement({
            actions: ['codecommit:GitPull', 'codecommit:GitPush'],
            resources: [codeRepo.repositoryArn],
            effect: IAM.Effect.ALLOW,
          })),

        ]
      })

    // aws codeartifact login --tool npm --domain my_domain --domain-owner 111122223333 --repository my_repo





    // [ ] create pipeline build.

    // [ ] create stack.
    // [ ] .
    // [ ] .

  }
}



// --require-approval

