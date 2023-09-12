// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { aws_vpclattice as vpclattice, aws_elasticloadbalancingv2 as elbv2, aws_certificatemanager as acm } from 'aws-cdk-lib';
import { IVpc } from 'aws-cdk-lib/aws-ec2';
import { FargateService, ICluster } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { CfnOutput } from "aws-cdk-lib";


import ecs = require('aws-cdk-lib/aws-ecs');
import log = require('aws-cdk-lib/aws-logs');


export interface EcsServiceProps {
  readonly appName?: string;
  readonly vpc?: IVpc;
  readonly cluster?: ICluster;
  readonly taskCount?: number;
  readonly image?: string;
  readonly healthCheckPath?: string;
  readonly addSvcToLattice: boolean;
  readonly sn?: vpclattice.CfnServiceNetwork;
  readonly certArn?: string;
  readonly domainName?: string;
  readonly r53hz?: route53.IHostedZone;
  readonly publicAlb: boolean;
  readonly envVariables?: {
    [key: string]: string;
  };
}

export class EcsService extends Construct {

  public readonly ecsService: FargateService;

  constructor(scope: Construct, id: string, props: EcsServiceProps = {
    addSvcToLattice: false,
    publicAlb: true
  }) {
    super(scope, id);

    const appName = props.appName! || 'sample-app';

    const svc = new ApplicationLoadBalancedFargateService(this, appName + '-service', {
      cluster: props.cluster,
      memoryLimitMiB: 512,
      desiredCount: props.taskCount,
      cpu: 256,
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry(props.image!),
        containerPort: 8080,
        containerName: props.appName,
        environment: props.envVariables!,
      },
      taskSubnets: {
        subnets: props.vpc?.privateSubnets,
      },
      serviceName: appName + '-service',
      loadBalancerName: appName + '-alb',
      protocol: elbv2.ApplicationProtocol.HTTPS,
      publicLoadBalancer: props.publicAlb,
      //domainName: props.appName+'.'+props.domainName,
      //domainZone: props.r53hz,
      certificate: acm.Certificate.fromCertificateArn(this, appName + '-domain-cert', props.certArn!)
    });

    svc.targetGroup.configureHealthCheck({
      path: props.healthCheckPath,
      unhealthyThresholdCount: 5,
    });

    this.ecsService = svc.service;

    if (props.addSvcToLattice) {

      const ecs_svc = new vpclattice.CfnService(this, props.appName + '-svc', {
        certificateArn: props.certArn,
        customDomainName: props.appName + '.' + props.domainName,
        name: props.appName + '-svc'
      });

      const CnameRecord = new route53.CnameRecord(this, appName + '-cname-record', {
        recordName: props.appName,
        zone: props.r53hz!,
        domainName: ecs_svc.attrDnsEntryDomainName
      });

      new CfnOutput(this, props.appName + 'URL', { value: `https://${CnameRecord.domainName}` });

      const ecs_tg = new vpclattice.CfnTargetGroup(this, props.appName + '-ecs-tg', {
        type: 'ALB',
        name: props.appName + '-ecs-tg',
        targets: [{
          id: svc.loadBalancer.loadBalancerArn,
          port: 443
        }],
        config: {
          port: 443,
          protocol: 'HTTPS',
          vpcIdentifier: props.vpc!.vpcId
        }
      });

      new vpclattice.CfnListener(this, props.appName + '-lambda-listener', {
        defaultAction: {
          forward: {
            targetGroups: [{
              targetGroupIdentifier: ecs_tg.attrId,
            }]
          }
        },
        protocol: 'HTTPS',
        name: props.appName + '-svc-listener',
        port: 443,
        serviceIdentifier: ecs_svc.attrArn
      });

      new vpclattice.CfnServiceNetworkServiceAssociation(this, props.appName + '-lattice-svc', {
        serviceIdentifier: ecs_svc.attrArn,
        serviceNetworkIdentifier: props.sn?.attrArn
      });

    } else {

      const CnameRecord = new route53.CnameRecord(this, appName + '-cname-record', {
        recordName: props.appName,
        zone: props.r53hz!,
        domainName: svc.loadBalancer.loadBalancerDnsName
      });

      new CfnOutput(this, props.appName + 'URL', { value: `https://${CnameRecord.domainName}` });
    }

  }
}