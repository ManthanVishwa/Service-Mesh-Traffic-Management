"use client";

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
  Select,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";
import { trafficRulesApi } from "@/lib/api";
import { mutate } from "swr";

interface CreateRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateRuleModal({
  isOpen,
  onClose,
}: CreateRuleModalProps) {
  const [serviceName, setServiceName] = useState("");
  const [version1Name, setVersion1Name] = useState("v1");
  const [version2Name, setVersion2Name] = useState("v2");
  const [version1Weight, setVersion1Weight] = useState(80);
  const [ruleType, setRuleType] = useState<
    "WEIGHTED" | "HEADER_MATCH" | "PATH_BASED"
  >("WEIGHTED");
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const version2Weight = 100 - version1Weight;

  const handleSubmit = async () => {
    if (!serviceName || !version1Name || !version2Name) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      await trafficRulesApi.create({
        serviceName,
        version1Name,
        version2Name,
        version1Weight,
        version2Weight,
        ruleType,
      });

      toast({
        title: "Rule Created",
        description: "Traffic rule has been created successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      mutate("rules");
      handleClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create traffic rule",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setServiceName("");
    setVersion1Name("v1");
    setVersion2Name("v2");
    setVersion1Weight(80);
    setRuleType("WEIGHTED");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent bg="gray.800">
        <ModalHeader>Create Traffic Rule</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Service Name</FormLabel>
              <Input
                placeholder="e.g., dummy-service"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
              />
            </FormControl>

            <HStack width="100%" spacing={4}>
              <FormControl isRequired>
                <FormLabel>Version 1 Name</FormLabel>
                <Input
                  placeholder="e.g., v1"
                  value={version1Name}
                  onChange={(e) => setVersion1Name(e.target.value)}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Version 2 Name</FormLabel>
                <Input
                  placeholder="e.g., v2"
                  value={version2Name}
                  onChange={(e) => setVersion2Name(e.target.value)}
                />
              </FormControl>
            </HStack>

            <FormControl>
              <FormLabel>Rule Type</FormLabel>
              <Select
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value as any)}
              >
                <option value="WEIGHTED">Weighted Routing</option>
                <option value="HEADER_MATCH">Header Match</option>
                <option value="PATH_BASED">Path Based</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Traffic Distribution</FormLabel>
              <VStack spacing={4} align="stretch">
                <HStack justify="space-between">
                  <Text fontSize="sm" color="gray.400">
                    {version1Name || "Version 1"}: {version1Weight}%
                  </Text>
                  <Text fontSize="sm" color="gray.400">
                    {version2Name || "Version 2"}: {version2Weight}%
                  </Text>
                </HStack>
                <Slider
                  value={version1Weight}
                  onChange={setVersion1Weight}
                  min={0}
                  max={100}
                  step={5}
                  colorScheme="brand"
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb boxSize={6} />
                </Slider>
                <HStack spacing={2} fontSize="xs" color="gray.500">
                  <Text>← More traffic to {version1Name || "Version 1"}</Text>
                  <Text>|</Text>
                  <Text>More traffic to {version2Name || "Version 2"} →</Text>
                </HStack>
              </VStack>
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            colorScheme="brand"
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            Create Rule
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
