// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from 'constructs';
import { aws_vpclattice as vpclattice } from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';

export class Lattice extends Construct {

    public readonly lattice_sn: vpclattice.CfnServiceNetwork;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.lattice_sn = new vpclattice.CfnServiceNetwork(this, 'lattice-demo', {
            authType: 'NONE',
            name: 'lattice-demo',
        });

        const lattice_lg = new logs.LogGroup(this, 'lattice-demo-log');

        new vpclattice.CfnAccessLogSubscription(this, 'lattice-demo-logsub', {
            destinationArn: lattice_lg.logGroupArn,
            resourceIdentifier: this.lattice_sn.attrArn
        });
          
    }
}