// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from 'constructs';
import { Duration, aws_vpclattice as vpclattice } from 'aws-cdk-lib';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import * as path from 'path';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { CfnOutput } from "aws-cdk-lib";

import lambda = require('aws-cdk-lib/aws-lambda');
import ec2 = require('aws-cdk-lib/aws-ec2');

export interface LambdaProps {
    readonly appName?: string;
    readonly cidr?: string;
    readonly sn?: vpclattice.CfnServiceNetwork;
    readonly certArn?: string;
    readonly domainName?: string;
    readonly r53hz?: route53.IHostedZone;
}

export class Lambda extends Construct {

    public readonly vpc: IVpc;
    public readonly lambda: lambda.Function;

    constructor(scope: Construct, id: string, props: LambdaProps) {
        super(scope, id);

        this.lambda = new lambda.Function(this, props.appName + '-lambda', {
            code: lambda.Code.fromAsset(
                path.join(__dirname, '.'),
                {
                    exclude: ['**', '!lambda_function.py']
                }),
            runtime: lambda.Runtime.PYTHON_3_10,
            handler: 'lambda_function.lambda_handler',
            description: props.appName + ' Lambda Function',
            memorySize: 128,
            functionName: props.appName + '-lambda',
            timeout: Duration.seconds(60),
            //securityGroups: [lambdaSG],
            //vpc: this.vpc
        });

        const lambda_svc = new vpclattice.CfnService(this, props.appName + '-svc', {
            certificateArn: props.certArn,
            customDomainName: props.appName + '.' + props.domainName,
            name: props.appName + '-svc'
        });

        const CnameRecord = new route53.CnameRecord(this, `CnameApiRecord`, {
            recordName: props.appName,
            zone: props.r53hz!,
            domainName: lambda_svc.attrDnsEntryDomainName
        });

        new CfnOutput(this, props.appName + 'URL', { value: `https://${CnameRecord.domainName}` });

        const lambda_tg = new vpclattice.CfnTargetGroup(this, props.appName + '-lambda-tg', {
            type: 'LAMBDA',
            name: props.appName + '-lambda-tg',
            targets: [{
                id: this.lambda.functionArn,
                //port: 443
            }]
        });

        new vpclattice.CfnListener(this, props.appName + '-lambda-listener', {
            defaultAction: {
                forward: {
                    targetGroups: [{
                        targetGroupIdentifier: lambda_tg.attrId,
                    }]
                }
            },
            protocol: 'HTTPS',
            name: props.appName + '-svc-listener',
            port: 443,
            serviceIdentifier: lambda_svc.attrArn
        });

        new vpclattice.CfnServiceNetworkServiceAssociation(this, props.appName + '-lattice-svc', {
            serviceIdentifier: lambda_svc.attrArn,
            serviceNetworkIdentifier: props.sn?.attrArn
        });
    }
}