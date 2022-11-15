# Pre-deployment

## Getting started with CloudFormation
- **example:** _I want to feel less overwhelmed when starting to work with CloudFormation for the first time._

## CloudFormation Template Authoring Tools (IDE / CLI)
- **example:** _I want to auto-fill account information, resource paramenters, etc. in the IDE (cfn-lint?)_
- 

## CloudFormation Template Authoring and Testing
- **example:** _I want to use multiple conditions in CFN templates. For example, I want to define if IAM resource exists then only update IAM parameters._

## Others
- **example:** _I want to estimate the time it will take to deploy CFN template before starting provisioning._

---

# During deployment

## CI/CD and Automation
- **example:** _I want to define usage and set quota limits on resources created by CFN._

## Visualization and Troubleshooting
- **example:** _I want to easily find the failure root cause of stack and stack sets CRUD operations._

---

# Post deployment

## Migration
- **example:** _I want to move resources between stacks._

## Drift
- **example:** _I want my stack to roll-back to original template configuration when there are resource drifts. (Drift Remediation)_

## ChangeSet
- **example:** _I want ChangeSet to track changes that will occur to nested stacks, dependent resources, and parameter values (SSM parameters)._

## Deletion
- **example:** _I want to auto-empty and delete fuction for resources such as S3 buckets, or Hosted Zones._

## Asset management
- **example:** _I want to visually group all stacks under directories / folders in the AWS Console._
