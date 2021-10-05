import * as cdk from "@aws-cdk/core";
import eks = require("@aws-cdk/aws-eks");
import iam = require("@aws-cdk/aws-iam");

export interface ClusterAutoScalerProps {
  cluster: eks.Cluster;
}

export class ClusterAutoscaler extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: ClusterAutoScalerProps) {
    super(scope, id);

    const caServiceAccount = props.cluster.addServiceAccount(
      "cluster-autoscaler",
      {
        name: "cluster-autoscaler",
        namespace: "kube-system",
      }
    );

    caServiceAccount.addToPrincipalPolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: [
          "autoscaling:DescribeAutoScalingGroups",
          "autoscaling:DescribeAutoScalingInstances",
          "autoscaling:DescribeLaunchConfigurations",
          "autoscaling:DescribeTags",
          "autoscaling:SetDesiredCapacity",
          "autoscaling:TerminateInstanceInAutoScalingGroup",
          "ec2:DescribeLaunchTemplateVersions",
        ],
      })
    );

    props.cluster.addHelmChart("ClusterAutoscaler", {
      chart: "cluster-autoscaler",
      release: "cluster-autoscaler",
      repository: "https://kubernetes.github.io/autoscaler",
      values: {
        rbac: {
          serviceAccount: {
            create: false,
            name: "cluster-autoscaler",
          },
        },
        autoDiscovery: {
          clusterName: props.cluster.clusterName,
        },
      },
      version: "9.10.7",
      namespace: "kube-system",
    });

    props.cluster.addHelmChart("MetricsServer", {
      chart: "metrics-server",
      release: "metrics-server",
      repository: "https://charts.bitnami.com/bitnami",
      version: "5.9.3",
      namespace: "kube-system",
    });
  }
}
