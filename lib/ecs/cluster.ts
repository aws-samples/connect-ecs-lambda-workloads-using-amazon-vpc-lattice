// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { IVpc } from 'aws-cdk-lib/aws-ec2';
import { ICluster } from 'aws-cdk-lib/aws-ecs';
import { aws_vpclattice as vpclattice } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import ec2 = require('aws-cdk-lib/aws-ec2');
import ecs = require('aws-cdk-lib/aws-ecs');

export interface EcsClusterProps {
    readonly cidr?: string;
    readonly appName: string;
    readonly sn?: vpclattice.CfnServiceNetwork;
}

export class EcsCluster extends Construct {

    public readonly vpc: IVpc;
    public readonly cluster: ICluster;

    constructor(scope: Construct, id: string, props: EcsClusterProps) {
        super(scope, id);

        this.vpc = new ec2.Vpc(this, props.appName+'-vpc', {
            ipAddresses: ec2.IpAddresses.cidr(props.cidr!),
            natGateways: 1,
            vpcName: props.appName+'-vpc'
        });

        new vpclattice.CfnServiceNetworkVpcAssociation(this, 'sn-'+props.appName+'-vpc', {
            vpcIdentifier: this.vpc.vpcId,
            serviceNetworkIdentifier: props.sn!.attrArn
        });

        this.cluster = new ecs.Cluster(this, props.appName+'-cluster', {
            vpc: this.vpc,
            containerInsights: true,
            clusterName: props.appName+'-cluster',
            enableFargateCapacityProviders: true
        });
    }
}