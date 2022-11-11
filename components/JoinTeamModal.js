/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import {
  Alert,
  AlertIcon,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";

import FormField from "~/components/FormField";

const schema = yup.object({
  code: yup.string().required().label("Join Code"),
});

const JoinTeamModal = ({ isOpen, onClose, onSubmit, isLoading, error }) => {
  const { register, handleSubmit, errors } = useForm({
    mode: "onTouched",
    resolver: yupResolver(schema),
  });

  const ref = useRef();

  return (
    <Modal isOpen={isOpen} initialFocusRef={ref} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Join Team</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <form id="join-team" onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={4}>
              {error && (
                <Alert status="error">
                  <AlertIcon />
                  {error.message}
                </Alert>
              )}

              <FormField
                type="text"
                ref={(e) => {
                  register(e);
                  ref.current = e;
                }}
                name="code"
                label="Join Code"
                placeholder="abcd"
                error={errors.code}
                isRequired
              />
            </Stack>
          </form>
        </ModalBody>

        <ModalFooter>
          <Button type="submit" form="join-team" colorScheme="blue" mr={3} isLoading={isLoading}>
            Join Team
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default JoinTeamModal;
