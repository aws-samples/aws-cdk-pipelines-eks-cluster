import { Construct } from 'constructs';
import { Environment, StackProps, Stage } from "aws-cdk-lib";
import { AppDnsStack } from "./app-dns-stack";

export interface AppDnsStageProps extends StackProps {
  envName: string;
  env: Environment;
}

export class AppDnsStage extends Stage {
  constructor(scope: Construct, id: string, props: AppDnsStageProps) {
    super(scope, id, props);

    new AppDnsStack(this, "AppDns", {
      tags: {
        Application: "AppDns",
        Environment: id,
      },
      envName: props.envName,
      env: props.env,
    });
  }
}
