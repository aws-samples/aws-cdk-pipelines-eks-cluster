import * as cdk from "@aws-cdk/core";
import eks = require("@aws-cdk/aws-eks");
import iam = require("@aws-cdk/aws-iam");
import * as path from "path";
import { readFileSync } from "fs";

export interface AWSLoadBalancerControllerProps {
  cluster: eks.Cluster;
}

export class AWSLoadBalancerController extends cdk.Construct {
  constructor(
    scope: cdk.Construct,
    id: string,
    props: AWSLoadBalancerControllerProps
  ) {
    super(scope, id);

    const policyFile = readFileSync(
      path.join(__dirname, "../../policies/aws-load-balancer-controller.json"),
      "utf-8"
    );

    const awsLoadBalancerControllerPolicyDocument = iam.PolicyDocument.fromJson(
      JSON.parse(policyFile)
    );

    const awsLoadBalancerControllerPolicy = new iam.ManagedPolicy(
      this,
      "AWSLoadBalancerControllerIAMPolicy",
      {
        document: awsLoadBalancerControllerPolicyDocument,
      }
    );

    const loadBalancerControllerServiceAccount =
      props.cluster.addServiceAccount("aws-load-balancer-controller", {
        name: "aws-load-balancer-controller",
        namespace: "kube-system",
      });

    loadBalancerControllerServiceAccount.role.addManagedPolicy(
      awsLoadBalancerControllerPolicy
    );

    props.cluster.addHelmChart("AwsLoadBalancerController", {
      chart: "aws-load-balancer-controller",
      release: "aws-load-balancer-controller",
      repository: "https://aws.github.io/eks-charts",
      version: "1.2.7",
      values: {
        clusterName: props.cluster.clusterName,
        serviceAccount: {
          create: false,
          name: "aws-load-balancer-controller",
        },
      },
      namespace: "kube-system",
    });
  }
}
