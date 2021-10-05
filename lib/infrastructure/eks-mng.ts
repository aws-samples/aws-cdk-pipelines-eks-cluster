import * as cdk from "@aws-cdk/core";
import eks = require("@aws-cdk/aws-eks");
import iam = require("@aws-cdk/aws-iam");
import ec2 = require("@aws-cdk/aws-ec2");

export interface EksManagedNodeGroupProps {
  cluster: eks.Cluster;
  nameSuffix: string;
}

export class EksManagedNodeGroup extends cdk.Construct {
  constructor(
    scope: cdk.Construct,
    id: string,
    props: EksManagedNodeGroupProps
  ) {
    super(scope, id);

    const lt = new ec2.CfnLaunchTemplate(this, "SSMLaunchTemplate", {
      launchTemplateData: {
        instanceType: "t3a.medium",
        tagSpecifications: [
          {
            resourceType: "instance",
            tags: [
              { key: "Name", value: `app-${props.nameSuffix}` },
              { key: "Environment", value: props.nameSuffix },
            ],
          },
          {
            resourceType: "volume",
            tags: [{ key: "Environment", value: props.nameSuffix }],
          },
        ],
      },
    });

    const nodeRole = new iam.Role(this, "EksNodeRole", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    nodeRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEKSWorkerNodePolicy")
    );
    nodeRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "AmazonEC2ContainerRegistryReadOnly"
      )
    );
    nodeRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
    );

    props.cluster.addNodegroupCapacity("app-ng", {
      launchTemplateSpec: {
        id: lt.ref,
        version: lt.attrLatestVersionNumber,
      },
      minSize: 3,
      maxSize: 6,
      amiType: eks.NodegroupAmiType.AL2_X86_64,
      nodeRole: nodeRole,
    });
  }
}
