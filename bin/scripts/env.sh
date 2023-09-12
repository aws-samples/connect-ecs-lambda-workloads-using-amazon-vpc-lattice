#!/bin/bash

export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION="us-west-2"

export CERT_ARN="YOUR-ACM-CERTIFICATE-ARN"
export CUSTOM_DOMAIN_NAME="YOUR-DOMAIN-NAME"
export HOSTZONE_ID="YOUR-ROUTE53-HOSTEDZONE-ID"
