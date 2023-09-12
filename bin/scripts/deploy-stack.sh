#!/usr/bin/env bash

######################################################################
# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. #
# SPDX-License-Identifier: MIT-0                                     #
######################################################################

#############################################################################
# Lattice, ECS, Lambda resources
##############################################################################

scriptsPath="$( dirname "$( which "$0" )" )"

source $scriptsPath/env.sh

echo -e "Start building the Lattice resources...."

export CIDR_RANGE=10.0.0.0/16

cdk bootstrap

cdk --app "npx ts-node bin/lattice-ecs-lambda-blog.ts" deploy --require-approval never

echo -e "Completed building the Lattice resources...."
