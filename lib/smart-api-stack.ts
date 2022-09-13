import {
  Stack, StackProps,
  aws_apigateway as ApiGateway,
  aws_iam as IAM,
  aws_dynamodb as DynamoDB,
  aws_lambda as Lambda,
  RemovalPolicy,
  CfnOutput
} from 'aws-cdk-lib'
import { Construct } from 'constructs'
// import * as sqs from 'aws-cdk-lib/aws-sqs';

const claudiaApiConfig = require('../../claudia.json')

/**
 * @typedef {Object} LambdaDef
 * @property {string} path - path to code 
 * @property {handler} handler - file and method name, like index.handle 
 * @property {Object} env - environment variables 
 */

interface LambdaDef {
  runtime?: Lambda.Runtime
  path: string
  handler?: string
  env?: any
  name?: string
}

export class SmartApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const usersTable = new DynamoDB.Table(this, 'users-table', {
      // this is the username as CB use it on their urls
      partitionKey: { name: 'cbUsername', type: DynamoDB.AttributeType.STRING },

      // Type of record, like: lovense-callback, profile, token-today, budjets and so on
      sortKey: { name: 'recType', type: DynamoDB.AttributeType.STRING },

      // if this attr is present, the item will be autodeleted when the date past this field
      timeToLiveAttribute: '_expireOn',

      // for dev only, if the stack is deleted, all data should go too
      removalPolicy: RemovalPolicy.DESTROY,
    })

    // const apiGateway = ''
    // const apiLambda = Lambda.Function
    //   .fromFunctionName(this, 'apiLambda', claudiaApiConfig.lambda.name)

    // const apiLambdaRole = IAM.Role
    //   .fromRoleName(this, 'apiLambdaRole', claudiaApiConfig.lambda.role)

    // usersTable.grantReadWriteData(apiLambdaRole)

    new CfnOutput(this, 'usersTableName', { value: usersTable.tableName })
    new CfnOutput(this, 'usersTableArn', { value: usersTable.tableArn })

    // new CfnOutput(this, 'apiLambdaRoleName', { value: apiLambdaRole.roleName })
    // new CfnOutput(this, 'apiLambdaRoleArn', { value: apiLambdaRole.roleArn })

    const api = this.createApi('name')


    // new CfnOutput(this, 'apiLambdaRoleName', { value: api.api })
    // new CfnOutput(this, 'apiLambdaRoleArn', { value: apiLambdaRole.roleArn })


    const createUserLambda = this.createLambda({
      path: '../functions/create-user',
      name: 'createUser',
      env: { USERS_TABLE: usersTable.tableName }
    })
    const getUsersLambda = this.createLambda({
      path: '../functions/get-user',
      name: 'getUsers',
      env: { USERS_TABLE: usersTable.tableName, TEST_THING: 'a' }
    })
    const deleteUsersLambda = this.createLambda({
      path: '../functions/delete-user',
      name: 'deleteUsers',
      env: { USERS_TABLE: usersTable.tableName }
    })

    const lovenseCallbackLambda = this.createLambda({
      path: '../functions/callback',
      name: 'lovenseCallback',
      env: { USERS_TABLE: usersTable.tableName }
    })

    usersTable.grantReadWriteData(lovenseCallbackLambda)
    usersTable.grantReadWriteData(createUserLambda)
    usersTable.grantReadWriteData(getUsersLambda)
    usersTable.grantReadWriteData(getUsersLambda)
    usersTable.grantReadWriteData(deleteUsersLambda)

    // dasd

    api.post('users', createUserLambda)
    api.get('users', getUsersLambda)
    api.get('users/{id}', getUsersLambda)
    api.delete('users', deleteUsersLambda)

    api.post('lovense/callback', lovenseCallbackLambda)

  }


  createApi(apiName: string) {
    let method = null
    let path = null
    const api = new ApiGateway.RestApi(this, 'apiName', {
      deployOptions: { stageName: process.env.STAGE || 'dev' },
      defaultCorsPreflightOptions: {
        allowOrigins: ApiGateway.Cors.ALL_ORIGINS,
        allowMethods: ApiGateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-type', 'X-Amz-Date', 'X-Api-Key', 'Authorization',
          'Access-Controll-Allow-Headers', 'Access-Controll-Allow-Origins', 'Access-Controll-Allow-Methods',
        ],
        allowCredentials: true,
      },
    })

    const methods = {
      /**
       * 
       * @param {string} path - path on api, like users/{id}/profile 
       * @param {LambdaDef} lambdaDef 
       */
      post: (path: string, lambda: Lambda.Function) => {
        method = 'POST'
        api.root.resourceForPath(path)
          // api.root.addResource(path)
          .addMethod(method,
            new ApiGateway.LambdaIntegration(lambda, { proxy: true }))

      },

      get: (path: string, lambda: Lambda.Function) => {
        method = 'GET'
        api.root.resourceForPath(path)
          // api.root.addResource(path)
          .addMethod(method,
            new ApiGateway.LambdaIntegration(lambda, { proxy: true }))
      },

      delete: (path: string, lambda: Lambda.Function) => {
        method = 'DELETE'
        api.root.resourceForPath(path)
          // api.root.addResource(path)
          .addMethod(method,
            new ApiGateway.LambdaIntegration(lambda, { proxy: true }))
      },

      patch: (path: string, lambda: Lambda.Function) => {
        method = 'PATCH'
        api.root.resourceForPath(path)
          // api.root.addResource(path)
          .addMethod(method,
            new ApiGateway.LambdaIntegration(lambda, { proxy: true }))
      },

      put: (path: string, lambda: Lambda.Function) => {
        method = 'PUT'
        api.root.resourceForPath(path)
          // api.root.addResource(path)
          .addMethod(method,
            new ApiGateway.LambdaIntegration(lambda, { proxy: true }))
      },

    }
    return { api, ...methods }
  }

  /**
   * 
   * @param {LambdaDef} LambdaDef 
   * @returns 
   */
  createLambda(lambdaDef: LambdaDef) {
    if (!lambdaDef.name) throw new Error('name is required')

    const lambda = new Lambda.Function(this, lambdaDef.name, {
      runtime: lambdaDef.runtime || Lambda.Runtime.NODEJS_16_X,
      code: Lambda.Code.fromAsset(lambdaDef.path),
      handler: lambdaDef.handler || 'index.handler',
      environment: { ...lambdaDef.env }
    })
    return lambda
  }

}
