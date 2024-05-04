import { Construct } from 'constructs';
import eks = require("aws-cdk-lib/aws-eks");

export interface EchoserverProps {
  cluster: eks.Cluster;
  nameSuffix: string;
  domainName: string;
}

export class Echoserver extends Construct {
  constructor(scope: Construct, id: string, props: EchoserverProps) {
    super(scope, id);

    const appLabel = { app: "echoserver" };

    const app_namespace = {
      apiVersion: "v1",
      kind: "Namespace",
      metadata: { name: "echoserver" },
    };

    const deployment = {
      apiVersion: "apps/v1",
      kind: "Deployment",
      metadata: { name: "echoserver", namespace: "echoserver" },
      spec: {
        replicas: 3,
        selector: { matchLabels: appLabel },
        template: {
          metadata: { labels: appLabel },
          spec: {
            containers: [
              {
                name: "echoserver",
                image: "gcr.io/google_containers/echoserver:1.10",
                ports: [{ containerPort: 8080 }],
              },
            ],
          },
        },
      },
    };

    const service = {
      apiVersion: "v1",
      kind: "Service",
      metadata: { name: "echoserver", namespace: "echoserver" },
      spec: {
        type: "NodePort",
        ports: [{ port: 80, targetPort: 8080 }],
        selector: appLabel,
      },
    };

    const ingress = {
      apiVersion: "networking.k8s.io/v1",
      kind: "Ingress",
      metadata: {
        name: "echoserver",
        namespace: "echoserver",
        annotations: {
          "kubernetes.io/ingress.class": "alb",
          "alb.ingress.kubernetes.io/scheme": "internet-facing",
        },
      },
      spec: {
        rules: [
          {
            host: `echoserver.${props.nameSuffix}.${props.domainName}`,
            http: {
              paths: [
                {
                  path: "/",
                  pathType: "Prefix",
                  backend: {
                    service: {
                      name: "echoserver",
                      port: {
                        number: 80,
                      },
                    },
                  },
                },
              ],
            },
          },
          {
            host: `app.${props.domainName}`,
            http: {
              paths: [
                {
                  path: "/",
                  pathType: "Prefix",
                  backend: {
                    service: {
                      name: "echoserver",
                      port: {
                        number: 80,
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    };

    props.cluster.addManifest(
      "echoserver",
      app_namespace,
      service,
      deployment,
      ingress
    );
  }
}
