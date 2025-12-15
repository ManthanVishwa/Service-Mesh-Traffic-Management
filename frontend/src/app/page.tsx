"use client";

import {
  Box,
  Container,
  Heading,
  Button,
  useDisclosure,
} from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import TrafficRulesList from "@/components/TrafficRulesList";
import CreateRuleModal from "@/components/CreateRuleModal";
import Header from "@/components/Header";

export default function Home() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Header />
      <Container maxW="container.xl" py={8}>
        <Box
          mb={6}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Heading size="lg">Traffic Rules</Heading>
          <Button leftIcon={<AddIcon />} colorScheme="brand" onClick={onOpen}>
            Create Rule
          </Button>
        </Box>

        <TrafficRulesList />

        <CreateRuleModal isOpen={isOpen} onClose={onClose} />
      </Container>
    </>
  );
}
