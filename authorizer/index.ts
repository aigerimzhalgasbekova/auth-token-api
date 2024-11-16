import { KMSClient, SigningAlgorithmSpec, VerifyCommand, VerifyCommandInput } from '@aws-sdk/client-kms';
import {
    APIGatewayAuthorizerResult,
    APIGatewayTokenAuthorizerEvent,
    PolicyDocument,
} from 'aws-lambda';
class UnauthorizedError extends Error {}

const JWT_PREFIX = 'Bearer ';

export const handler = async (
    event: APIGatewayTokenAuthorizerEvent,
): Promise<APIGatewayAuthorizerResult> => {
    try {
        const { authorizationToken, methodArn } = event;
        const username = await authorize(authorizationToken);
        return generatePolicy(username, methodArn);
    } catch (error) {
        console.error('rejecting invalid request access', error);
        if (
            error instanceof UnauthorizedError
        ) {
            throw error;
        }
        throw new Error('Unauthorized');
    }
};

const authorize = async (authorizationToken: string): Promise<string> => {
    const kmsKeyId = process.env.KMS_KEY_ID;
   
    if (!authorizationToken || !authorizationToken.startsWith(JWT_PREFIX)) {
        throw new UnauthorizedError('not authorized to access this service');
    }
    
    const token = authorizationToken.replace(JWT_PREFIX, '');
    
    const [headerBase64, payloadBase64, signatureBase64] = token.split('.');

    const header = Buffer.from(headerBase64, 'base64').toString()
    const payload = Buffer.from(payloadBase64, 'base64').toString()
    console.debug('Decoded info', {
        header,
        payload,
    })
    //validate header and payload
    if (!header || header['kid'] !== kmsKeyId) {
        throw new UnauthorizedError('not authorized to access this service');
    }
    if (!payload || !payload['user_name']) {
        throw new UnauthorizedError('not authorized to access this service');
    }
    // could also validate the user_name from payload

    // The evil line that you need
    const signatureToVerify = Uint8Array.from(Buffer.from(signatureBase64, 'base64'));

    const input: VerifyCommandInput = {
        KeyId: kmsKeyId,
        Message: Buffer.from(headerBase64 + '.' + payloadBase64),
        MessageType: 'RAW',
        Signature: Buffer.from(signatureToVerify),
        SigningAlgorithm: SigningAlgorithmSpec.RSASSA_PSS_SHA_256
    };

    const kmsClient = new KMSClient({ region: process.env.AWS_REGION });
    const command = new VerifyCommand(input);
    const response = await kmsClient.send(command);

    if (!response.SignatureValid) {
        throw new UnauthorizedError('not authorized to access this service');
    }

    return payload['user_name'];
}

// Help function to generate an IAM policy
const generatePolicy = (
    principalId: string,
    methodArn: string,
): APIGatewayAuthorizerResult => {
    const policyDocument: PolicyDocument = {
        Version: '2012-10-17',
        Statement: [
            {
                Action: 'execute-api:Invoke',
                Effect: 'Allow',
                Resource: methodArn,
            },
        ],
    };
    return {
        principalId,
        policyDocument,
    };
};