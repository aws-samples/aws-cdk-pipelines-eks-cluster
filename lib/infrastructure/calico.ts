import * as cdk from "@aws-cdk/core";
import eks = require("@aws-cdk/aws-eks");

export interface CalicoProps {
  cluster: eks.Cluster;
}

export class Calico extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: CalicoProps) {
    super(scope, id);

    props.cluster.addHelmChart("Calico", {
      chart: "tigera-operator",
      release: "calico",
      repository: "https://docs.projectcalico.org/charts",
      version: "v3.20.0",
      values: {
        installation: {
          kubernetesProvider: "EKS",
        },
      },
      namespace: "kube-system",
    });
  }
}
