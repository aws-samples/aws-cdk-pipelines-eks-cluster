import * as cdk from "@aws-cdk/core";
import eks = require("@aws-cdk/aws-eks");
import iam = require("@aws-cdk/aws-iam");

export interface ContainerInsightsProps {
  cluster: eks.Cluster;
}

export class ContainerInsights extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: ContainerInsightsProps) {
    super(scope, id);

    const cwNamespace = props.cluster.addManifest("amazon-cloudwatch", {
      apiVersion: "v1",
      kind: "Namespace",
      metadata: { name: "amazon-cloudwatch" },
    });

    const cwMetricsServiceAccount = props.cluster.addServiceAccount(
      "aws-cloudwatch-metrics",
      {
        name: "aws-cloudwatch-metrics",
        namespace: "amazon-cloudwatch",
      }
    );

    cwMetricsServiceAccount.node.addDependency(cwNamespace);

    cwMetricsServiceAccount.role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy")
    );

    props.cluster.addHelmChart("AwsCloudWatchMetrics", {
      chart: "aws-cloudwatch-metrics",
      release: "aws-cloudwatch-metrics",
      version: "0.0.5",
      repository: "https://aws.github.io/eks-charts",
      values: {
        clusterName: props.cluster.clusterName,
        serviceAccount: {
          create: false,
          name: "aws-cloudwatch-metrics",
        },
      },
      namespace: "kube-system",
    });

    const fluentBitServiceAccount = props.cluster.addServiceAccount(
      "aws-for-fluent-bit",
      {
        name: "aws-for-fluent-bit",
        namespace: "kube-system",
      }
    );

    fluentBitServiceAccount.node.addDependency(cwNamespace);

    fluentBitServiceAccount.role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchAgentServerPolicy")
    );

    props.cluster.addHelmChart("AwsForFluentBit", {
      chart: "aws-for-fluent-bit",
      release: "aws-for-fluent-bit",
      version: "0.1.11",
      repository: "https://aws.github.io/eks-charts",
      values: {
        cloudWatch: {
          logGroupName: `/aws/containerinsights/${props.cluster.clusterName}/application`,
          logStreamPrefix: "${HOST_NAME}-",
        },
        firehose: {
          enabled: false,
        },
        kinesis: {
          enabled: false,
        },
        elasticsearch: {
          enabled: false,
        },
        serviceAccount: {
          create: false,
          name: "aws-for-fluent-bit",
        },
      },
      namespace: "kube-system",
    });
  }
}
