"use client";

import {
  Box,
  Flex,
  Heading,
  HStack,
  Badge,
  Icon,
  Text,
} from "@chakra-ui/react";
import { FaServer } from "react-icons/fa";

export default function Header() {
  return (
    <Box bg="gray.800" borderBottom="1px" borderColor="gray.700" px={8} py={4}>
      <Flex justify="space-between" align="center">
        <HStack spacing={4}>
          <Icon as={FaServer} boxSize={8} color="brand.400" />
          <Box>
            <Heading size="md">Service Mesh Dashboard</Heading>
            <Text fontSize="sm" color="gray.400">
              Traffic Management & Routing Control
            </Text>
          </Box>
        </HStack>
        <HStack spacing={4}>
          <Badge colorScheme="green" px={3} py={1} borderRadius="md">
            Kubernetes Connected
          </Badge>
          <Badge colorScheme="blue" px={3} py={1} borderRadius="md">
            Istio Active
          </Badge>
        </HStack>
      </Flex>
    </Box>
  );
}
