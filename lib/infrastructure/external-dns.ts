import { Construct } from 'constructs';
import eks = require("aws-cdk-lib/aws-eks");
import iam = require("aws-cdk-lib/aws-iam");

export interface ExternalDNSProps {
  cluster: eks.Cluster;
  hostZoneId: string;
  domainFilters: string[];
}

export class ExternalDNS extends Construct {
  constructor(scope: Construct, id: string, props: ExternalDNSProps) {
    super(scope, id);

    const externalDnsServiceAccount = props.cluster.addServiceAccount(
      "external-dns",
      {
        name: "external-dns",
        namespace: "kube-system",
      }
    );

    externalDnsServiceAccount.addToPrincipalPolicy(
      new iam.PolicyStatement({
        resources: ["arn:aws:route53:::hostedzone/*"],
        actions: ["route53:ChangeResourceRecordSets"],
      })
    );

    externalDnsServiceAccount.addToPrincipalPolicy(
      new iam.PolicyStatement({
        resources: ["*"],
        actions: ["route53:ListHostedZones", "route53:ListResourceRecordSets"],
      })
    );

    props.cluster.addHelmChart("ExternalDns", {
      chart: "external-dns",
      release: "external-dns",
      repository: "https://charts.bitnami.com/bitnami",
      version: "5.4.5",
      values: {
        serviceAccount: {
          create: false,
          name: "external-dns",
        },
        podSecurityContext: {
          fsGroup: 65534,
          runAsUser: 0,
        },
        provider: "aws",
        aws: {
          zoneType: "public",
        },
        txtOwnerId: props.hostZoneId,
        domainFilters: props.domainFilters,
      },
      namespace: "kube-system",
    });
  }
}
