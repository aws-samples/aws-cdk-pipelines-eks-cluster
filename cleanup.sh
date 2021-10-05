#!/bin/bash
cdk destroy -y
aws cloudformation delete-stack --stack-name EKSClusterA-EKSCluster
aws cloudformation delete-stack --stack-name EKSClusterB-EKSCluster
aws cloudformation delete-stack --stack-name UpdateDNS-AppDns