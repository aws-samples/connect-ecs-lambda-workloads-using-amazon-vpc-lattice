import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Lattice } from './lattice/lattice';
import { EcsCluster } from './ecs/cluster';
import { EcsService } from './ecs/service';
import { aws_vpclattice as vpclattice } from 'aws-cdk-lib';
import { Lambda } from './lambda/lambda';
import * as route53 from 'aws-cdk-lib/aws-route53';


export class LatticeEcsLambdaBlogStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const sn = new Lattice(this, 'lattice-sn');

    const r53hz = route53.HostedZone.fromHostedZoneAttributes(this, 'lambda-hz', {
      hostedZoneId: process.env.HOSTZONE_ID!,
      zoneName: process.env.CUSTOM_DOMAIN_NAME!
    });  

    const uiAppName = 'ui';
    const checkoutAppName = 'checkout';
    const ordersAppName = 'orders';

    //Create UI Resources
    const uiCluster = new EcsCluster(this, 'ui-cluster', {
      appName: uiAppName,
      cidr: process.env.CIDR_RANGE,
      sn: sn.lattice_sn
    });

    const uiSvc = new EcsService(this, 'ui-svc', {
      appName: uiAppName,
      taskCount: 1,
      cluster: uiCluster.cluster,
      vpc: uiCluster.vpc,
      image: 'public.ecr.aws/aws-containers/retail-store-sample-ui:0.4.0',
      healthCheckPath: '/actuator/health',
      addSvcToLattice: false,
      publicAlb: true,
      certArn: process.env.CERT_ARN,
      domainName: process.env.CUSTOM_DOMAIN_NAME,
      r53hz: r53hz,
      envVariables: {
        ENDPOINTS_CHECKOUT: 'https://'+checkoutAppName+'.'+process.env.CUSTOM_DOMAIN_NAME+':443',
        ENDPOINTS_ORDERS: 'https://'+ordersAppName+'.'+process.env.CUSTOM_DOMAIN_NAME+':443'
      }
    });

    //Create CheckOut Resources
    const checkoutCluster = new EcsCluster(this, 'checkout-cluster', {
      appName: checkoutAppName,
      cidr: process.env.CIDR_RANGE,
      sn: sn.lattice_sn
    });

    const checkoutSvc = new EcsService(this, 'checkout-svc', {
      appName: checkoutAppName,
      taskCount: 1,
      cluster: checkoutCluster.cluster,
      vpc: checkoutCluster.vpc,
      image: 'public.ecr.aws/aws-containers/retail-store-sample-checkout:0.4.0',
      healthCheckPath: '/health',
      addSvcToLattice: true,
      publicAlb: false,
      certArn: process.env.CERT_ARN,
      domainName: process.env.CUSTOM_DOMAIN_NAME,
      sn: sn.lattice_sn,
      r53hz: r53hz,
      envVariables: {
        ENDPOINTS_ORDERS: 'https://'+ordersAppName+'.'+process.env.CUSTOM_DOMAIN_NAME
      }
    });

    const lambdaSvc = new Lambda(this, 'orders-lambda-stack', {
      appName: ordersAppName,
      cidr: process.env.CIDR_RANGE,
      sn: sn.lattice_sn,
      certArn: process.env.CERT_ARN,
      domainName: process.env.CUSTOM_DOMAIN_NAME,
      r53hz: r53hz
    });

  }
}
