import { Construct } from 'constructs';
import eks = require("aws-cdk-lib/aws-eks");
import { Environment, StackProps, Stage } from "aws-cdk-lib";
import { EksClusterStack } from "./eks-cluster-stack";
import * as lambda from "aws-cdk-lib/aws-lambda";

export interface EksClusterStageProps extends StackProps {
  clusterVersion: eks.KubernetesVersion;
  kubectlLayer: lambda.LayerVersion;
  nameSuffix: string;
  env: Environment;
}

export class EksClusterStage extends Stage {
  constructor(scope: Construct, id: string, props: EksClusterStageProps) {
    super(scope, id, props);

    new EksClusterStack(this, "EKSCluster", {
      tags: {
        Application: "EKSCluster",
        Environment: id,
      },
      clusterVersion: props.clusterVersion,
      nameSuffix: props.nameSuffix,
      env: props.env,
    });
  }
}
