import json

# helper functions
def build_response(code, body):
    # headers for cors
    headers = {
        # "Access-Control-Allow-Origin": "amazonaws.com",
        # "Access-Control-Allow-Credentials": True,
        "Content-Type": "application/json"
    }
    ip = json.loads(body["body"])
    print('input request:', ip)
    # lattice integration
    response = {
        "isBase64Encoded": False,
        "statusCode": code,
        "headers": headers,
        "body": json.dumps({"id": "abc1234", "email": ip["email"]})
    }
    return response

def lambda_handler(event, context):
    print('event:', event)
    print('context:', context)
    output = build_response(200, event)
    print(json.dumps(output))
    return output
