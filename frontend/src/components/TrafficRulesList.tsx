"use client";

import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Progress,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { CheckCircleIcon, WarningIcon } from "@chakra-ui/icons";
import useSWR, { mutate } from "swr";
import { trafficRulesApi, TrafficRule } from "@/lib/api";
import { useState } from "react";

const fetcher = () => trafficRulesApi.getAll();

export default function TrafficRulesList() {
  const {
    data: rules,
    error,
    isLoading,
  } = useSWR("rules", fetcher, {
    refreshInterval: 5000,
  });
  const [deployingId, setDeployingId] = useState<string | null>(null);
  const toast = useToast();

  const handleDeploy = async (id: string) => {
    setDeployingId(id);
    try {
      await trafficRulesApi.deploy(id);
      toast({
        title: "Rule Deployed",
        description:
          "Traffic rule has been successfully deployed to Kubernetes",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      mutate("rules");
    } catch (error) {
      toast({
        title: "Deployment Failed",
        description: "Failed to deploy traffic rule to Kubernetes",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setDeployingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await trafficRulesApi.delete(id);
      toast({
        title: "Rule Deleted",
        description: "Traffic rule has been deleted",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      mutate("rules");
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete traffic rule",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="brand.500" />
        <Text mt={4} color="gray.400">
          Loading traffic rules...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        Failed to load traffic rules. Please check if the backend is running.
      </Alert>
    );
  }

  if (!rules || rules.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <WarningIcon boxSize={12} color="gray.500" mb={4} />
        <Text fontSize="lg" color="gray.400">
          No traffic rules configured yet
        </Text>
        <Text fontSize="sm" color="gray.500" mt={2}>
          Create your first traffic rule to get started
        </Text>
      </Box>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      {rules.map((rule: TrafficRule) => (
        <Card
          key={rule.id}
          bg="gray.800"
          borderColor="gray.700"
          borderWidth="1px"
        >
          <CardHeader>
            <HStack justify="space-between">
              <Heading size="md">{rule.serviceName}</Heading>
              <HStack>
                <Badge colorScheme={rule.deployedAt ? "green" : "yellow"}>
                  {rule.deployedAt ? "Deployed" : "Not Deployed"}
                </Badge>
                <Badge colorScheme="purple">{rule.ruleType}</Badge>
              </HStack>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              {/* Traffic Distribution */}
              <Box>
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm" color="gray.400">
                    Traffic Distribution
                  </Text>
                  <Text fontSize="sm" fontWeight="bold">
                    {rule.version1Name}: {rule.version1Weight}% |{" "}
                    {rule.version2Name}: {rule.version2Weight}%
                  </Text>
                </HStack>
                <Box position="relative">
                  <Progress
                    value={rule.version1Weight}
                    size="lg"
                    colorScheme="blue"
                    borderRadius="md"
                  />
                  <HStack
                    position="absolute"
                    top="50%"
                    left="50%"
                    transform="translate(-50%, -50%)"
                    spacing={4}
                  >
                    <Text fontSize="xs" fontWeight="bold" color="white">
                      {rule.version1Name}
                    </Text>
                    <Text fontSize="xs" fontWeight="bold" color="white">
                      {rule.version2Name}
                    </Text>
                  </HStack>
                </Box>
              </Box>

              {/* Metadata */}
              <HStack justify="space-between" fontSize="sm" color="gray.500">
                <Text>
                  Created: {new Date(rule.createdAt).toLocaleDateString()}
                </Text>
                {rule.deployedAt && (
                  <HStack>
                    <CheckCircleIcon color="green.400" />
                    <Text>
                      Last deployed:{" "}
                      {new Date(rule.deployedAt).toLocaleString()}
                    </Text>
                  </HStack>
                )}
              </HStack>

              {/* Actions */}
              <HStack justify="flex-end" spacing={3}>
                <Button
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  onClick={() => handleDelete(rule.id)}
                >
                  Delete
                </Button>
                <Button
                  size="sm"
                  colorScheme="brand"
                  onClick={() => handleDeploy(rule.id)}
                  isLoading={deployingId === rule.id}
                  loadingText="Deploying..."
                >
                  Apply & Deploy
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      ))}
    </VStack>
  );
}
