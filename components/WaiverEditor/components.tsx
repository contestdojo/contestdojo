/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

// @ts-nocheck

import {
  Alert,
  AlertIcon,
  Button,
  chakra,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import { Component, useEffect, useRef } from "react";
import SignatureCanvas from "react-signature-canvas";

import BlankCard from "~/components/BlankCard";
import Card from "~/components/Card";
import { components as defaultComponents } from "~/components/Markdown";

import { useWaiverState } from "./WaiverProvider";

const MissingID = () => (
  <Alert status="error" mb={4} maxW={500}>
    <AlertIcon />
    An ID must be provided for this component.
  </Alert>
);

const RequiredIndicator = () => <chakra.span color="red">*</chakra.span>;

const SignatureModal = ({ id, isOpen, onClose, setValue }) => {
  const ref = useRef(null);

  const handleSave = () => {
    if (ref.current.isEmpty()) setValue(null);
    else setValue(ref.current.toDataURL());

    onClose();
  };

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
          <Button colorScheme="blue" onClick={handleSave}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

const Signature = ({ node, id }) => {
  const [value, setValue] = useWaiverState(id);
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    if (value === undefined) setValue(null);
  }, []);

  if (!id) return <MissingID />;

  return (
    <>
      {value ? (
        <Card mb={4} h={120} w={300} backgroundImage={value} backgroundSize="cover" cursor="pointer" onClick={onOpen} />
      ) : (
        <BlankCard
          as="input"
          mb={4}
          m={0}
          h={120}
          w={300}
          cursor="pointer"
          onClick={onOpen}
          position="relative"
          overflow="visible"
          type="text"
          required
          tabIndex={-1}
          textAlign="center"
          placeholder="Click to Sign"
          onFocus={(e) => e.target.blur()}
          value=""
        />
      )}
      <SignatureModal id={id} isOpen={isOpen} onClose={onClose} setValue={setValue} />
    </>
  );
};

const Field = ({ node, id, placeholder, width = 300, readonly = false, optional = false, initialValue = "" }) => {
  const [value, setValue] = useWaiverState(id);
  useEffect(() => {
    if (value === undefined && !optional) setValue(null);
  }, []);
  if (!id) return <MissingID />;
  return (
    <>
      <Input
        name={id}
        mb={4}
        placeholder={placeholder}
        size="sm"
        maxW={width}
        isReadOnly={readonly}
        value={value ?? initialValue}
        onChange={(e) => setValue(e.target.value)}
        isRequired={!optional}
      />
      {!optional && <RequiredIndicator />}
    </>
  );
};

const FieldInline = ({ node, id, placeholder, width = 200, readonly = false, optional = false, initialValue = "" }) => {
  const [value, setValue] = useWaiverState(id);
  useEffect(() => {
    if (value === undefined && !optional) setValue(null);
  }, []);
  if (!id) return <MissingID />;
  return (
    <>
      <Input
        name={id}
        placeholder={placeholder}
        size="xs"
        display="inline"
        maxW={width}
        isReadOnly={readonly}
        value={value ?? initialValue}
        onChange={(e) => setValue(e.target.value)}
        isRequired={!optional}
      />
      {!optional && <RequiredIndicator />}
    </>
  );
};

export const components: { [key: string]: Component } = {
  ...defaultComponents,
  "cd-signature": Signature,
  "cd-field": Field,
  "cd-field-inline": FieldInline,
};
