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

echo -e "Start building the Lattice stack...."

export CIDR_RANGE=10.0.0.0/16

npm run build

npm run test

echo -e "Completed building the Lattice stack...."
