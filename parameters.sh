#!/bin/bash
read -p "GitHub OAuth Token: " github_token
aws secretsmanager create-secret --name github-oauth-token --description "Secret for GitHub" --secret-string "$github_token"
read -p "Host Zone ID (ZABC12345678DEF): " host_zone_id
aws ssm put-parameter --name '/eks-cdk-pipelines/hostZoneId' --type String --value "$host_zone_id"
read -p "Zone Name (mydomain.com): " zone_name
aws ssm put-parameter --name '/eks-cdk-pipelines/zoneName' --type String --value "$zone_name"