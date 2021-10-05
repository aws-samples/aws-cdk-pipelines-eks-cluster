import eks = require("@aws-cdk/aws-eks");
import { Construct, Environment, StackProps, Stage } from "@aws-cdk/core";
import { EksClusterStack } from "./eks-cluster-stack";

export interface EksClusterStageProps extends StackProps {
  clusterVersion: eks.KubernetesVersion;
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
