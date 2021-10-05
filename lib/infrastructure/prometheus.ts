import * as cdk from "@aws-cdk/core";
import eks = require("@aws-cdk/aws-eks");

export interface PrometheusProps {
  cluster: eks.Cluster;
}

export class Prometheus extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: PrometheusProps) {
    super(scope, id);

    props.cluster.addHelmChart("Prometheus", {
      chart: "prometheus",
      release: "prometheus",
      version: "14.6.0",
      repository: "https://prometheus-community.github.io/helm-charts",
      values: {
        alertmanager: {
          persistentVolume: {
            storageClass: "gp2",
          },
        },
        server: {
          persistentVolume: {
            storageClass: "gp2",
          },
        },
      },
      namespace: "prometheus",
    });
  }
}
