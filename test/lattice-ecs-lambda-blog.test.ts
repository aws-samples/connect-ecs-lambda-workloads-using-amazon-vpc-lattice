import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { AwsSolutionsChecks } from 'cdk-nag';
import * as LatticeEcsLambdaBlog from '../lib/lattice-ecs-lambda-blog-stack';

// example test. To run these tests, uncomment this file along with the
// example resource in lib/lattice-ecs-lambda-blog-stack.ts
test('VPC Lattice Stack is Created', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new LatticeEcsLambdaBlog.LatticeEcsLambdaBlogStack(app, 'LatticeECSLambdaTest', {
        stackName: 'LatticeECSLambdaTestStack',
    });
    // THEN

    cdk.Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }))

    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::IAM::Role', 5);
    template.resourceCountIs('AWS::EC2::VPC', 2);
    // Lattice
    template.resourceCountIs('AWS::VpcLattice::ServiceNetwork', 1);
    template.resourceCountIs('AWS::VpcLattice::Service', 2);
    template.resourceCountIs('AWS::VpcLattice::Listener', 2);
    template.resourceCountIs('AWS::VpcLattice::TargetGroup', 2);
    template.resourceCountIs('AWS::VpcLattice::ServiceNetworkServiceAssociation', 2);
    template.resourceCountIs('AWS::VpcLattice::ServiceNetworkVpcAssociation', 2);
    template.resourceCountIs('AWS::Route53::RecordSet', 3);
    // ECS
    template.resourceCountIs('AWS::ECS::Cluster', 2);
    template.resourceCountIs('AWS::ECS::TaskDefinition', 2);
    template.resourceCountIs('AWS::ECS::Service', 2);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 2);



});
