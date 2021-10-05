import * as cdk from "@aws-cdk/core";
import * as route53 from "@aws-cdk/aws-route53";
import * as ssm from "@aws-cdk/aws-ssm";

export interface AppDnsStackProps extends cdk.StackProps {
  envName: string;
}

export class AppDnsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: AppDnsStackProps) {
    super(scope, id, props);

    const hostZoneId = ssm.StringParameter.valueForStringParameter(
      this,
      "/eks-cdk-pipelines/hostZoneId"
    );

    const zoneName = ssm.StringParameter.valueForStringParameter(
      this,
      "/eks-cdk-pipelines/zoneName"
    );

    const zone = route53.HostedZone.fromHostedZoneAttributes(this, "appZone", {
      zoneName: zoneName,
      hostedZoneId: hostZoneId,
    });

    new route53.CnameRecord(this, "appCnameRecord", {
      zone: zone,
      recordName: "app",
      domainName: `echoserver.${props.envName}.${zoneName}`,
      ttl: cdk.Duration.seconds(30),
    });
  }
}
