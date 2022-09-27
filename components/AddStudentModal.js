/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import { useRef } from "react";

import AddStudentForm from "~/components/forms/AddStudentForm";

const AddStudentModal = ({ isOpen, onClose, title, isLoading, ...props }) => {
  const initialFocusRef = useRef();
  return (
    <Modal isOpen={isOpen} initialFocusRef={initialFocusRef} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title ?? "Invite Student"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <AddStudentForm initialFocusRef={initialFocusRef} showButton={false} isLoading={isLoading} {...props} />
        </ModalBody>

        <ModalFooter>
          <Button type="submit" form="add-student" colorScheme="blue" mr={3} isLoading={isLoading}>
            Save
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddStudentModal;
