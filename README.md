# Homework

This is a homework as part of the hiring process for Cujo AI. We hope you'll find this assignment interesting and relevant for the job you are applying for.

Please read the instructions below carefully. If you are unsure about the requirements or if you have any problems or questions related to the environment, don't hesitate to contact the hiring manager. Happy coding!

## Introduction

In this homework, you are tasked to implement a token endpoint that issues OAuth tokens as per [OAuth 2.0 Client Credentials Grant](https://datatracker.ietf.org/doc/html/rfc6749#section-4.4). However, the implementation does not have to conform to the full standard and you don't need to support parameters that are OPTIONAL in the RFC to limit the scope of the homework. E.g. you don't need to implement support for refresh tokens.

The endpoint uses AWS API Gateway, AWS Lambda, AWS DynamoDB and AWS KMS. Your task is to implement the AWS Lambda function, everything else is preconfigured and are ready to be used. You can freely to choose the AWS Lambda runtime you want use. However, this project comes pre-configured using Nodejs runtime and dummy lambda. This means, you can use a programming language you feel is the best for the task.

## Homework Environment

This project comes with a docker compose based setup that is pre-configured using Localstack to run an AWS API Gateway and the Lambda function you will implement so that your code can be invoked using an HTTP request.

The environment is also setup with a DynamoDB table that contains OAuth client configurations as well as an AWS KMS key that can be used to sign and verify OAuth tokens. The DynamoDB table name is `Users` and the KMS Key alias is `alias/signing-key`. You can check [init.sh](init-scripts/init.sh) for further details.

At the root of the project you'll find [Makefile](Makefile) with targets that are designed to help you along your way. These targets use containerized utilities that are available as docker compose services to make them easy to use and will hopefully provide you a problem free experience in setting up the environment and validating your solution.

## Getting started

### Pre-requirements

To run and setup this project you'll need:
* Docker (version 26.0.0 or greater)
* Make

### Setup

To setup the project and to run the token endpoint:

```sh
$ make up
```

To test if everything worked ok, you can try to request a token:

```sh
$ make token-get
```

If everything worked, you should be greeted with an output `xyz`.

If you want to change the Lambda runtime from the default `nodejs20.x`, change the configuration to your liking on [init.sh](init-scripts/init.sh) by changing the value of `runtime` variable and reset environment with `make reset`.

To list available Lambda runtimes:

```sh
$ make list-runtimes
```

### Usage

As you work on your Lambda code and want to update it in the Localstack environment:

```sh
$ make update-lambda
```

This will repackage your code and call AWS Lambda running on Localstack to update your function to the repackaged version.

To validate your solution:

```sh
$ make token-verify
```

This will try issue a new token using the token endpoint and try to verify it. If the token endpoint returned a valid JWT token, you are greeted with output `JWT verified successfully`. With any other output or error, your solution is not producing the expected output.

### Logging

All AWS related logs are exposed the standard way from the Localstack docker container.
You can also inspect them with  below command:
```sh
$ make logs
```

### Interacting with Localstack (AWS Resources)
You may need to check your AWS resources staged in Localstack. There are 2 options provided by default:

Use you own aws cli and set localstack endpoint with pre-configured credentials configured similar as in `docker-compose.yaml` `aws-cli` docker container

```sh
AWS_DEFAULT_REGION=eu-west-1 AWS_ACCESS_KEY_ID=key AWS_SECRET_ACCESS_KEY=secret aws --endpoint-url=http://localhost:4566 <actual AWS CLI command>

# For example list dynamodb table items
AWS_DEFAULT_REGION=eu-west-1 AWS_ACCESS_KEY_ID=key AWS_SECRET_ACCESS_KEY=secret aws --endpoint-url=http://localhost:4566 dynamodb scan --table-name Users
```

Or you can use docker compose provided `aws-cli` container as shown below.

```sh
docker compose run --rm aws-cli --endpoint-url=http://localstack:4566 <actual AWS CLI command>

# For example list dynamodb table items
docker compose run --rm aws-cli --endpoint-url=http://localstack:4566 dynamodb scan --table-name Users
```

It is recommended to set alias for this command anyway.


## Task Assignment

Please complete the following tasks for this assignment:

* Write an AWS Lambda function that implements [OAuth 2.0 Client Credentials Grant](https://datatracker.ietf.org/doc/html/rfc6749#section-4.4) excluding support for refresh tokens.
* It should verify the presented client credentials against the OAuth clients configured in the `Users` DynamoDB table.
* It should issue OAuth tokens in [JSON Web Token](https://datatracker.ietf.org/doc/html/rfc7519) format that are signed with the `alias/signing-key` KMS key.
* Place the implementation in [Lambda](lambda/) folder.
* Cover it with unit tests where you see fit.
* Feel free to improve existing project to your heart's contents.

## Optional design questions

1. How would you ensure safe and reliable deployments of the token endpoint, i.e. what kind of CICD pipeline you'd build?
2. How would you you improve the security of the token endpoint implementation?
3. How would you implement observability (metrics, monitoring, alerting) for the token endpoint in a real world deployment?
4. How would you deploy the token endpoint in a real world situation to ensure high availability?
5. How would you enable other services to validate tokens issued by the token endpoint?
