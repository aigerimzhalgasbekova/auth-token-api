#!/usr/bin/env python
import os
import jwt
import sys
import base64
import boto3

# Set AWS credentials and region to match localstack
if 'AWS_ACCESS_KEY_ID' not in os.environ:
    os.environ['AWS_ACCESS_KEY_ID'] = 'key'
if 'AWS_SECRET_ACCESS_KEY' not in os.environ:
    os.environ['AWS_SECRET_ACCESS_KEY'] = 'secret'
if 'AWS_DEFAULT_REGION' not in os.environ:
    os.environ['AWS_DEFAULT_REGION'] = 'eu-west-1'

def get_public_key(kid):
    session = boto3.Session()
    kms_client = session.client('kms', endpoint_url='http://localstack:4566')
    response = kms_client.get_public_key(KeyId=kid)
    public_key = response['PublicKey']
    public_key = base64.b64encode(public_key)
    return b"-----BEGIN PUBLIC KEY-----\n" + public_key + b"\n-----END PUBLIC KEY-----"

def verify_jwt(incoming_token, public_key, algorithms):
    jwt.decode(incoming_token, public_key, algorithms)
    return True

if len(sys.argv) < 2 or len(sys.argv[1]) < 3:
    print("Please provide the incoming JWT as a command line argument")
    sys.exit(1)

incoming_token = sys.argv[1]

public_key = get_public_key(jwt.get_unverified_header(incoming_token.split('.')[0]).get('kid'))

verification_result = verify_jwt(incoming_token, public_key, algorithms=[jwt.get_unverified_header(incoming_token).get('alg')])

if verification_result:
    print("JWT verified successfully")
else:
    print("JWT verification failed")