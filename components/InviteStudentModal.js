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

import InviteStudentForm from "~/components/forms/InviteStudentForm";

const InviteStudentModal = ({ isOpen, onClose, title, isLoading, ...props }) => {
  const initialFocusRef = useRef();

  return (
    <Modal isOpen={isOpen} initialFocusRef={initialFocusRef} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{title ?? "Invite Students"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <InviteStudentForm isLoading={isLoading} {...props} />
        </ModalBody>

        <ModalFooter>
          <Button type="submit" form="invite-students" colorScheme="blue" mr={3} isLoading={isLoading}>
            Save
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default InviteStudentModal;
