import * as k8s from "@kubernetes/client-node";
import * as yaml from "js-yaml";
import { TrafficRule } from "@prisma/client";
import { logger } from "../utils/logger";
import * as fs from "fs";
import * as path from "path";

const kc = new k8s.KubeConfig();

// Load Kubernetes config
try {
  if (process.env.KUBECONFIG) {
    kc.loadFromFile(process.env.KUBECONFIG);
  } else {
    kc.loadFromDefault();
  }
} catch (error) {
  logger.warn(
    "Could not load Kubernetes config. K8s features will be disabled."
  );
}

const k8sApi = kc.makeApiClient(k8s.CustomObjectsApi);

interface IstioVirtualService {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
  };
  spec: {
    hosts: string[];
    http: Array<{
      route: Array<{
        destination: {
          host: string;
          subset: string;
        };
        weight: number;
      }>;
    }>;
  };
}

export async function deployTrafficRule(rule: TrafficRule): Promise<any> {
  try {
    // Generate Istio VirtualService YAML
    const virtualService: IstioVirtualService = {
      apiVersion: "networking.istio.io/v1beta1",
      kind: "VirtualService",
      metadata: {
        name: `${rule.serviceName.toLowerCase()}-vs`,
        namespace: "default",
      },
      spec: {
        hosts: [rule.serviceName.toLowerCase()],
        http: [
          {
            route: [
              {
                destination: {
                  host: rule.serviceName.toLowerCase(),
                  subset: rule.version1Name,
                },
                weight: rule.version1Weight,
              },
              {
                destination: {
                  host: rule.serviceName.toLowerCase(),
                  subset: rule.version2Name,
                },
                weight: rule.version2Weight,
              },
            ],
          },
        ],
      },
    };

    // Generate DestinationRule
    const destinationRule = {
      apiVersion: "networking.istio.io/v1beta1",
      kind: "DestinationRule",
      metadata: {
        name: `${rule.serviceName.toLowerCase()}-dr`,
        namespace: "default",
      },
      spec: {
        host: rule.serviceName.toLowerCase(),
        subsets: [
          {
            name: rule.version1Name,
            labels: {
              version: rule.version1Name,
            },
          },
          {
            name: rule.version2Name,
            labels: {
              version: rule.version2Name,
            },
          },
        ],
      },
    };

    logger.info("Generated Istio configuration:", {
      virtualService,
      destinationRule,
    });

    // Save to GitOps repo (for ArgoCD)
    const gitopsDir = path.join(__dirname, "../../gitops-repo/istio");

    if (!fs.existsSync(gitopsDir)) {
      fs.mkdirSync(gitopsDir, { recursive: true });
    }

    const vsPath = path.join(
      gitopsDir,
      `${rule.serviceName.toLowerCase()}-virtualservice.yaml`
    );
    const drPath = path.join(
      gitopsDir,
      `${rule.serviceName.toLowerCase()}-destinationrule.yaml`
    );

    fs.writeFileSync(vsPath, yaml.dump(virtualService));
    fs.writeFileSync(drPath, yaml.dump(destinationRule));

    logger.info(`Saved Istio configs to GitOps repo: ${gitopsDir}`);

    // Apply directly to Kubernetes cluster (if connected)
    try {
      // Apply VirtualService
      await k8sApi
        .createNamespacedCustomObject(
          "networking.istio.io",
          "v1beta1",
          "default",
          "virtualservices",
          virtualService
        )
        .catch(async (error) => {
          if (error.statusCode === 409) {
            // Resource exists, update it
            await k8sApi.replaceNamespacedCustomObject(
              "networking.istio.io",
              "v1beta1",
              "default",
              "virtualservices",
              virtualService.metadata.name,
              virtualService
            );
          } else {
            throw error;
          }
        });

      // Apply DestinationRule
      await k8sApi
        .createNamespacedCustomObject(
          "networking.istio.io",
          "v1beta1",
          "default",
          "destinationrules",
          destinationRule
        )
        .catch(async (error) => {
          if (error.statusCode === 409) {
            await k8sApi.replaceNamespacedCustomObject(
              "networking.istio.io",
              "v1beta1",
              "default",
              "destinationrules",
              destinationRule.metadata.name,
              destinationRule
            );
          } else {
            throw error;
          }
        });

      logger.info("Successfully applied Istio configuration to cluster");
    } catch (k8sError) {
      logger.warn(
        "Could not apply to cluster (cluster may not be available):",
        k8sError
      );
    }

    return {
      virtualService,
      destinationRule,
      gitopsPath: gitopsDir,
    };
  } catch (error) {
    logger.error("Error deploying traffic rule:", error);
    throw error;
  }
}

export async function getK8sServiceStatus(serviceName: string): Promise<any> {
  try {
    const coreApi = kc.makeApiClient(k8s.CoreV1Api);
    const response = await coreApi.readNamespacedService(
      serviceName,
      "default"
    );
    return response.body;
  } catch (error) {
    logger.error(`Error fetching service ${serviceName}:`, error);
    throw error;
  }
}
