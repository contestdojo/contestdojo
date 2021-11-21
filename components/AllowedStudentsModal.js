/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import {
  Alert,
  AlertIcon,
  Button,
  Checkbox,
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
import ResizingTextarea from "~/components/ResizingTextarea";

const schema = yup.object({
  isPrivate: yup.boolean(),
  allowedStudents: yup.string().label("Allowed Students"),
});

const AllowedStudentsModal = ({ defaultValues, isOpen, onClose, onSubmit, isLoading, error }) => {
  const { register, handleSubmit, errors, watch } = useForm({
    defaultValues,
    mode: "onTouched",
    resolver: yupResolver(schema),
  });

  const isPrivate = watch("isPrivate");
  const ref = useRef();

  return (
    <Modal size="xl" isOpen={isOpen} initialFocusRef={ref} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Allowed Students</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <form id="allowed-students" onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={4}>
              {error && (
                <Alert status="error">
                  <AlertIcon />
                  {error.message}
                </Alert>
              )}

              <Checkbox ref={register} name="isPrivate">
                Restrict to Certain Students
              </Checkbox>

              {isPrivate && (
                <FormField
                  ref={(e) => {
                    register(e);
                    ref.current = e;
                  }}
                  as={ResizingTextarea}
                  componentProps={{ maxRows: 20 }}
                  name="allowedStudents"
                  label="Allowed Students"
                  placeholder={"ib9RgWDUmMaKEdJJGOonoKBmFaA3\nR0JX4QCRuChV75HsPmypnwBwI8Z2\n183C\n201A"}
                  helperText="Enter IDs or #s, one per line"
                  error={errors.allowedStudents}
                />
              )}
            </Stack>
          </form>
        </ModalBody>

        <ModalFooter>
          <Button type="submit" form="allowed-students" colorScheme="blue" mr={3} isLoading={isLoading}>
            Save
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AllowedStudentsModal;
