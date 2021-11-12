/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

// @ts-nocheck

import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Code,
  Divider,
  Heading,
  Input,
  Link,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  OrderedList,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  UnorderedList,
  useDisclosure,
} from "@chakra-ui/react";
import { Component, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

import { useWaiverState } from "./WaiverProvider";

import BlankCard from "~/components/BlankCard";
import Card from "~/components/Card";

const MissingID = () => (
  <Alert status="error" mb={4} maxW={500}>
    <AlertIcon />
    An ID must be provided for this component.
  </Alert>
);

const SignatureModal = ({ isOpen, onClose }) => {
  const ref = useRef(null);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent width="auto">
        <ModalHeader>Sign</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Card width={402}>
            <SignatureCanvas ref={ref} canvasProps={{ height: 160, width: 400 }} />
          </Card>
        </ModalBody>

        <ModalFooter>
          <Button mr={3} onClick={() => ref.current.clear()}>
            Clear
          </Button>
          <Button colorScheme="blue" onClick={onClose}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const Signature = ({ node, id }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  if (!id) return <MissingID />;

  return (
    <>
      <BlankCard mb={4} m={0} h={120} w={300} cursor="pointer" onClick={onOpen}>
        Click to Sign
      </BlankCard>
      <SignatureModal isOpen={isOpen} onClose={onClose} />
    </>
  );
};

const Field = ({ node, id, placeholder, width = 300, readonly = false, initialValue }) => {
  const [value, setValue] = useWaiverState(id);
  if (!id) return <MissingID />;
  return (
    <Input
      mb={4}
      placeholder={placeholder}
      size="sm"
      maxW={width}
      isReadOnly={readonly}
      value={value ?? initialValue}
      onChange={(e) => setValue(e.target.value)}
    />
  );
};

const FieldInline = ({ node, id, placeholder = "Text Input", width = 200, readonly = false, initialValue }) => {
  const [value, setValue] = useWaiverState(id);
  if (!id) return <MissingID />;
  return (
    <Input
      placeholder={placeholder}
      size="xs"
      display="inline"
      maxW={width}
      isReadOnly={readonly}
      value={value ?? initialValue}
      onChange={(e) => setValue(e.target.value)}
    />
  );
};

export const components: { [key: string]: Component } = {
  a: ({ node, ...props }) => <Link color="blue.500" {...props} />,
  blockquote: ({ node, ...props }) => <Box pl={3} borderLeftWidth={4} {...props} />,
  code: ({ node, ...props }) => <Code {...props} />,
  h1: ({ node, ...props }) => <Heading mb={4} as="h1" size="lg" {...props} />,
  h2: ({ node, ...props }) => <Heading mb={4} as="h2" size="md" {...props} />,
  h3: ({ node, ...props }) => <Heading mb={4} as="h3" size="sm" {...props} />,
  h4: ({ node, ...props }) => <Heading mb={4} as="h4" size="xs" {...props} />,
  h5: ({ node, ...props }) => <Heading mb={4} as="h5" size="xs" {...props} />,
  h6: ({ node, ...props }) => <Heading mb={4} as="h6" size="xs" {...props} />,
  hr: ({ node, ...props }) => <Divider mb={4} {...props} />,
  li: ListItem,
  ol: ({ node, ...props }) => <OrderedList mb={4} {...props} />,
  p: ({ node, ...props }) => <Text mb={4} {...props} />,
  ul: ({ node, ...props }) => <UnorderedList mb={4} {...props} />,
  table: ({ node, ...props }) => <Table mb={4} {...props} />,
  tbody: Tbody,
  td: Td,
  th: Th,
  thead: Thead,
  tr: Tr,
  "cd-signature": Signature,
  "cd-field": Field,
  "cd-field-inline": FieldInline,
};
