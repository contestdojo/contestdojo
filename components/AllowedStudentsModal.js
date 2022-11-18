/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import {
  Alert,
  AlertIcon,
  Button,
  Checkbox,
  HStack,
  IconButton,
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
import { useFieldArray, useForm } from "react-hook-form";
import { HiTrash } from "react-icons/hi";
import * as yup from "yup";

import FormField from "~/components/FormField";

const DEFAULT_FIELDS = [
  { id: "id", label: "ID" },
  { id: "number", label: "Number" },
  { id: "name", label: "First Name" },
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
  rules: yup.array(
    yup.object({
      field: yup.string().label("Fields").required(),
      rule: yup.string().oneOf(["=", "!=", "=~", "!~", "in"]).required(),
      value: yup.string().required(),
    })
  ),
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

  const { fields, append, remove } = useFieldArray({
    control,
    name: "rules",
  });

  const values = getValues();

  console.log(fields);

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

              {isPrivate &&
                fields.map((item, index) => (
                  <HStack key={item.id} alignItems="flex-end">
                    <FormField
                      as={Select}
                      {...register(`rules.${index}.field`)}
                      label="Field"
                      error={errors[`rules.${index}.field`]}
                    >
                      {DEFAULT_FIELDS.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.label}
                        </option>
                      ))}
                      {customFields.map((x) => (
                        <option key={`customFields.${x.id}`} value={`customFields.${x.id}`}>
                          [Custom] {x.label}
                        </option>
                      ))}
                    </FormField>

                    <FormField
                      as={Select}
                      {...register(`rules.${index}.rule`)}
                      label="Rule"
                      error={errors[`rules.${index}.rule`]}
                    >
                      <option value="=">Equals</option>
                      <option value="!=">Does not equal</option>
                      <option value="=~">Matches regex</option>
                      <option value="!~">Does not match regex</option>
                      <option value="in">One of</option>
                    </FormField>

                    <FormField
                      {...register(`rules.${index}.value`)}
                      label="Value"
                      error={errors[`rules.${index}.value`]}
                      placeholder={VALUE_PLACEHOLDERS[values.rules?.[index]?.rule]}
                    />

                    <IconButton icon={<HiTrash />} onClick={() => remove(index)} />
                  </HStack>
                ))}

              {isPrivate && (
                <Button
                  type="button"
                  alignSelf="flex-start"
                  onClick={() => append({ field: "", rule: "=", value: "" })}
                >
                  Add Rule
                </Button>
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
