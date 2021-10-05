import * as cdk from "@aws-cdk/core";
import eks = require("@aws-cdk/aws-eks");
import ec2 = require("@aws-cdk/aws-ec2");
import iam = require("@aws-cdk/aws-iam");
import * as ssm from "@aws-cdk/aws-ssm";

import { EksManagedNodeGroup } from "./infrastructure/eks-mng";
import { AWSLoadBalancerController } from "./infrastructure/aws-load-balancer-controller";
import { ExternalDNS } from "./infrastructure/external-dns";
import { ClusterAutoscaler } from "./infrastructure/cluster-autoscaler";
import { ContainerInsights } from "./infrastructure/container-insights";
import { Calico } from "./infrastructure/calico";
import { Prometheus } from "./infrastructure/prometheus";
import { Echoserver } from "./application/echoserver";

export interface EksClusterStackProps extends cdk.StackProps {
  clusterVersion: eks.KubernetesVersion;
  nameSuffix: string;
}

export class EksClusterStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: EksClusterStackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, "Vpc", { maxAzs: 3 });

    const cluster = new eks.Cluster(this, `acme-${props.nameSuffix}`, {
      clusterName: `acme-${props.nameSuffix}`,
      version: props.clusterVersion,
      defaultCapacity: 0,
      vpc,
      vpcSubnets: [{ subnetType: ec2.SubnetType.PRIVATE }],
    });

    const aud = `${cluster.clusterOpenIdConnectIssuer}:aud`;
    const sub = `${cluster.clusterOpenIdConnectIssuer}:sub`;

    const conditions = new cdk.CfnJson(this, "awsNodeOIDCCondition", {
      value: {
        [aud]: "sts.amazonaws.com",
        [sub]: "system:serviceaccount:kube-system:aws-node",
      },
    });

    const awsNodeIamRole = new iam.Role(this, "awsNodeIamRole", {
      assumedBy: new iam.WebIdentityPrincipal(
        `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:oidc-provider/${cluster.clusterOpenIdConnectIssuer}`
      ).withConditions({
        StringEquals: conditions,
      }),
    });

    awsNodeIamRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEKS_CNI_Policy")
    );

    const awsNodeCniPatch = new eks.KubernetesPatch(
      this,
      "serviceAccount/aws-node",
      {
        cluster,
        resourceName: "serviceAccount/aws-node",
        resourceNamespace: "kube-system",
        applyPatch: {
          metadata: {
            annotations: {
              "eks.amazonaws.com/role-arn": awsNodeIamRole.roleArn,
            },
          },
        },
        restorePatch: {
          metadata: {
            annotations: {},
          },
        },
      }
    );

    const eksMng = new EksManagedNodeGroup(this, "EksManagedNodeGroup", {
      cluster: cluster,
      nameSuffix: props.nameSuffix,
    });

    eksMng.node.addDependency(awsNodeCniPatch);

    new AWSLoadBalancerController(this, "AWSLoadBalancerController", {
      cluster: cluster,
    });

    const hostZoneId = ssm.StringParameter.valueForStringParameter(
      this,
      "/eks-cdk-pipelines/hostZoneId"
    );

    const zoneName = ssm.StringParameter.valueForStringParameter(
      this,
      "/eks-cdk-pipelines/zoneName"
    );

    new ExternalDNS(this, "ExternalDNS", {
      cluster: cluster,
      hostZoneId: hostZoneId,
      domainFilters: [`${props.nameSuffix}.${zoneName}`],
    });

    new ClusterAutoscaler(this, "ClusterAutoscaler", {
      cluster: cluster,
    });

    new ContainerInsights(this, "ContainerInsights", {
      cluster: cluster,
    });

    new Calico(this, "Calico", {
      cluster: cluster,
    });

    new Prometheus(this, "Prometheus", {
      cluster: cluster,
    });

    new Echoserver(this, "EchoServer", {
      cluster: cluster,
      nameSuffix: props.nameSuffix,
      domainName: zoneName,
    });
  }
}
