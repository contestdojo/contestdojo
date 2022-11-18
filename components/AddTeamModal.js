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
  name: yup.string().required().label("Team Name"),
});

const AddTeamModal = ({ isOpen, onClose, onSubmit, isLoading, error }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
    resolver: yupResolver(schema),
  });

  const ref = useRef();

  return (
    <Modal isOpen={isOpen} initialFocusRef={ref} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create Team</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <form id="add-team" onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={4}>
              {error && (
                <Alert status="error">
                  <AlertIcon />
                  {error.message}
                </Alert>
              )}

              <FormField
                {...register("name")}
                name="name"
                label="Team Name"
                placeholder="New Team"
                error={errors.name}
                isRequired
              />
            </Stack>
          </form>
        </ModalBody>

        <ModalFooter>
          <Button type="submit" form="add-team" colorScheme="blue" mr={3} isLoading={isLoading}>
            Save
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddTeamModal;
