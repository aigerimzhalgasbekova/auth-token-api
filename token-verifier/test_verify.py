import jwt

# toke from `make token-get` output
incoming_token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjY5Yjg1MDM5LTc2MWItNDdkYi04MjJlLTQ4ODBkYzdmMzBhZiJ9.eyJ1c2VyX25hbWUiOiJhZG1pbiIsImlzcyI6Imh0dHBzOi8vZXhhbXBsZS5jb20iLCJpYXQiOjE3MjUwMzgzOTQsImV4cCI6MTcyNTA0MTk5NH0.BegfJsSjrYH0Y0Bi+x2OoGARY5Apo9beyby8RmQ04jIwl29UafH7sHxd2juWo3WBXkNDlr3c37SqyL/d/5H7ZuCDL567KTob8XuMN0y1Hh59/0H0fwQDtD3ICI0/82iOVD7f8ZtwN4VLbHHV5MDF9CpoAXAx2rxO7LPHxPw3VLscb86ZtLJgREZYUE8ZOidmvKBFEhO7ioL2MKDhcJ3AhgbdCCCwmKrWj8ZW3XVsRntPxx4PbBpgtI9SKkqbzdu90gtXkpCjz7dAZI98otsd1//20bUzJ3JfDUWzibdBGgJRwYd+S2ROty6cfDHkw0mRJLBjS91CV4Hz3sZ3mWF6Ig=="
# public key from `aws --endpoint-url=http://localhost:4566 kms get-public-key --key-id 69b85039-761b-47db-822e-4880dc7f30af` output
public_key = b"-----BEGIN PUBLIC KEY-----\n" + b"MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvaFTdJJLOu8a2lGPEtN4y0wdGyRrdNdiS9QPQK4uL+WmzDS/nRpD4W7ruwnciogY4FdEGKTNk9kMgMJQY4A+GdJNeGYyYneJ4veRAA0fqu8vc7jS2pqnzvtLq0SSma6bAKQaeSL2yHVP3rJ+wHL/J+LzXFU7mWGHEzPAOOxMPFq2p9GuD6LDPZzX6xJuaKDwe3GVLXB1bKFnpVtTTPMwl37o87gyPIS42m4GA8/Z+bLgS10hemPbegmDVHMQXD4XEzJzQF1NPhbGWD/ADb7qTgNBcfnKgzZFyR7fPGwRJocBHMdOyMa8JXzwxKZAazUMdbPweEqXtlBjU1z+zsk5GwIDAQAB" + b"\n-----END PUBLIC KEY-----"

def verify_jwt(incoming_token, public_key, algorithms):
    jwt.decode(incoming_token, public_key, algorithms)
    return True
verification_result = verify_jwt(incoming_token, public_key, ['RS256'])

if verification_result:
    print("JWT verified successfully")
else:
    print("JWT verification failed")