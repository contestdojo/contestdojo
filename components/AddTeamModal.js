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
import { useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import * as yup from "yup";

import { makeCustomFieldsSchema, renderCustomFields } from "./forms/customFields";

import FormField from "~/components/FormField";

const AddTeamModal = ({
  heading = "Create Team",
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  error,
  defaultValues,
  customFields = [],
}) => {
  const formId = useMemo(uuidv4, []);

  const schema = useMemo(
    () =>
      yup.object({
        name: yup.string().required().label("Team Name"),
        customFields: makeCustomFieldsSchema(customFields),
      }),
    [customFields]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    mode: "onTouched",
    resolver: yupResolver(schema),
    defaultValues,
  });

  const ref = useRef();

  return (
    <Modal isOpen={isOpen} initialFocusRef={ref} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{heading}</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <form id={formId} onSubmit={handleSubmit(onSubmit)}>
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

              {renderCustomFields(customFields, register, errors)}
            </Stack>
          </form>
        </ModalBody>

        <ModalFooter>
          <Button type="submit" form={formId} colorScheme="blue" mr={3} isLoading={isLoading}>
            Save
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AddTeamModal;
