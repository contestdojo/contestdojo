/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

// @ts-nocheck

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
  Select,
  Stack,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";

import FormField from "~/components/FormField";
import { RenderRules, rulesSchema } from "~/components/forms/rules";

const DEFAULT_FIELDS = [
  { id: "id", label: "ID" },
  { id: "number", label: "Number" },
  { id: "fname", label: "First Name" },
  { id: "lname", label: "Last Name" },
  { id: "grade", label: "Grade" },
  { id: "org.id", label: "Organization ID" },
  { id: "team.id", label: "Team ID" },
  { id: "notes", label: "Notes" },
];

const VALUE_PLACEHOLDERS = {
  "=": "Enter value",
  "!=": "Enter value",
  "=~": "Enter regex",
  "!~": "Enter regex",
  in: "Enter values, comma-separated",
};

const schema = yup.object({
  isPrivate: yup.boolean(),
  mode: yup.string().oneOf(["any-allow", "all-allow", "any-deny", "all-deny"]).required(),
  rules: rulesSchema,
});

const AllowedStudentsModal = ({ customFields, defaultValues, isOpen, onClose, onSubmit, isLoading, error }) => {
  const {
    register,
    handleSubmit,
    control,
    watch,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues,
    mode: "onTouched",
    resolver: yupResolver(schema),
  });

  const isPrivate = watch("isPrivate");
  const values = getValues();

  return (
    <Modal size="4xl" isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Test Restrictions</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <form id="test-restrictions" onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={4}>
              {error && (
                <Alert status="error">
                  <AlertIcon />
                  {error.message}
                </Alert>
              )}

              <Checkbox {...register("isPrivate")}>Enable rules engine</Checkbox>

              {isPrivate && (
                <FormField as={Select} {...register("mode")} label="Mode" error={errors.mode}>
                  <option value="any-allow">Deny by default, allow if ANY rule is met</option>
                  <option value="all-allow">Deny by default, allow if ALL rules are met</option>
                  <option value="any-deny">Allow by default, deny if ANY rule is met</option>
                  <option value="all-deny">Allow by default, deny if ALL rules are met</option>
                </FormField>
              )}

              {isPrivate && (
                <RenderRules
                  name="rules"
                  defaultFields={DEFAULT_FIELDS}
                  customFields={customFields}
                  control={control}
                  values={values?.rules}
                  register={register}
                  errors={errors}
                />
              )}
            </Stack>
          </form>
        </ModalBody>

        <ModalFooter>
          <Button type="submit" form="test-restrictions" colorScheme="blue" mr={3} isLoading={isLoading}>
            Save
          </Button>
          <Button onClick={onClose}>Cancel</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AllowedStudentsModal;
