/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import {
  Alert,
  AlertIcon,
  Button,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Select,
  Stack,
} from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";

import FormField from "~/components/FormField";

const schema = yup.object({
  name: yup.string().required().label("Name"),
  type: yup.string().required().oneOf(["standard", "guts", "target"], "Invalid type").label("Type"),
  duration: yup.number().typeError("Invalid number").required().label("Duration"),
  team: yup.boolean().required(),
  numPerSet: yup.number().when("type", {
    is: (x) => ["guts", "target"].includes(x),
    then: yup.number().typeError("Invalid number").required(),
  }),
});

const OrgForm = ({ onSubmit, isLoading, error, buttonText, defaultValues }) => {
  const { register, handleSubmit, watch, errors } = useForm({
    defaultValues,
    mode: "onTouched",
    resolver: yupResolver(schema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={4}>
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error.message}
          </Alert>
        )}

        <FormField
          ref={register}
          name="name"
          label="Name"
          placeholder="Individual Round"
          error={errors.name}
          isRequired
        />

        <FormField
          ref={register}
          type="number"
          name="duration"
          label="Total Duration (seconds)"
          placeholder="300"
          error={errors.duration}
          isRequired
        />

        <FormControl id="type" isInvalid={errors.type} isRequired>
          <FormLabel>Type</FormLabel>
          <Select ref={register} name="type" placeholder="Select option">
            <option value="standard">Standard</option>
            <option value="guts">Guts</option>
            <option value="target">Target</option>
          </Select>
          <FormErrorMessage>{errors.type?.message}</FormErrorMessage>
        </FormControl>

        {watch("type") === "guts" && (
          <FormField
            ref={register}
            type="number"
            name="numPerSet"
            label="# Problems Per Set"
            placeholder="4"
            error={errors.numPerSet}
            isRequired
          />
        )}

        {watch("type") === "target" && (
          <FormField
            ref={register}
            type="number"
            name="numPerSet"
            label="# Problems Per Set"
            placeholder="4"
            error={errors.numPerSet}
            isRequired
          />
        )}

        <FormControl id="team" isInvalid={errors.team}>
          <FormLabel>Team</FormLabel>
          <Checkbox ref={register} name="team">
            This is a team round
          </Checkbox>
          <FormErrorMessage>{errors.team?.message}</FormErrorMessage>
        </FormControl>

        <Button isLoading={isLoading} type="submit" colorScheme="blue">
          {buttonText ?? "Submit"}
        </Button>
      </Stack>
    </form>
  );
};

export default OrgForm;
