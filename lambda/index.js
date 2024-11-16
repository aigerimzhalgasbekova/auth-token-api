const { KMSClient, SignCommand, SigningAlgorithmSpec } = require('@aws-sdk/client-kms');
const { DynamoDBDocumentClient, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const base64url = require('base64url');
const { getValidatedCredentials } = require('./validator');

const region = process.env.AWS_REGION;

exports.handler = async (event) => {
    console.debug(`Input event: ${JSON.stringify(event)}`);
    try {
        // get the user credentials from the Authorization header
        const {valid, username, password, message} = getValidatedCredentials(event.headers);
        if (!valid) {
            console.error(`Invalid credentials: ${message}`);
            return {
                isBase64Encoded: false,
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({"message": "Bad request"}),
            };
        }

        // check if the user exists in the database
        const exist = await existInDynamoDB(username, password);
        if (!exist) {
            return {
                isBase64Encoded: false,
                statusCode: 401,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({"message": "Unauthorized"}),
            };
        }

        // issue a JWT token
        return await sign(username);
    } catch (error) {
        console.error(`Error while processing the request: ${error}`);
        return {
            isBase64Encoded: false,
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({"message": "Internal server error"}),
        };
    }
};

const existInDynamoDB = async (username, password) => {
    const ddbDocClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
    const queryCommand = new QueryCommand({
        TableName: 'Users',
        KeyConditionExpression: 'Username = :username and Password = :password',
        ExpressionAttributeValues: {
            ':username': username,
            ':password': password,
        }
    });
    const response = await ddbDocClient.send(queryCommand);
    return response.Items.length === 1;
}

const sign = async (username) => {
    const kmsKeyAliasName = process.env.KMS_KEY_ALIAS_NAME;

    // create JWT components
    const headers = {
        "alg": "RS256",
        "typ": "JWT",
        "kid": kmsKeyAliasName
    }
    const nowInSeconds = new Date() / 1000;
    let payload = {
        user_name: username,
        iss: "https://example.com",
        iat: Math.floor(nowInSeconds),
        // hardcoded 1 hour expiration, could be set as an environment variable
        exp: Math.floor(nowInSeconds + 3600),
        // there could be added more claims e.g roles, permissions, etc.
    }

    let tokenComponents = {
        header: base64url(JSON.stringify(headers)),
        payload: base64url(JSON.stringify(payload)),
    };
    let message = Buffer.from(tokenComponents.header + "." + tokenComponents.payload)

    const kmsClient = new KMSClient({ region });
    const signParams = {
        KeyId: kmsKeyAliasName,
        Message: message,
        MessageType: 'RAW',
        // RSASSA_PSS is a more secure algorithm than RSASSA_PKCS1_V1_5 and preferred for new implementations
        SigningAlgorithm: SigningAlgorithmSpec.RSASSA_PSS_SHA_256,
    };
    const signResponse = await kmsClient.send(new SignCommand(signParams));
    if (!signResponse.Signature) {
        console.error('Error signing the token');
        return {
            isBase64Encoded: false,
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({"message": "Internal server error"}),
        };
    }
    tokenComponents['signature'] = Buffer.from(signResponse.Signature).toString('base64');
    // JWT token is a concatenation of header, payload and signature separated by dots
    const token = tokenComponents.header + "." + tokenComponents.payload + "." + tokenComponents.signature
    return {
        isBase64Encoded: false,
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({"access_token": token}),
    };
};
