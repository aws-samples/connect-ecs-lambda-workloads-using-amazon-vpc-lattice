#!/usr/bin/env bash

######################################################################
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. #
# SPDX-License-Identifier: MIT-0                                     #
######################################################################

scriptsPath="$( dirname "$( which "$0" )" )"

source $scriptsPath/env.sh

echo -e "Start cleanup..."

echo -e "Start building the Lattice resources...."

export CIDR_RANGE=10.0.0.0/16

cdk --app "npx ts-node bin/lattice-ecs-lambda-blog.ts" destroy --require-approval never

echo -e "Cleanup completed..."