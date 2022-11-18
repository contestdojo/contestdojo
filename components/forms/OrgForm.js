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
import { countries } from "countries-list";
import { useForm } from "react-hook-form";
import * as yup from "yup";

import FormField from "~/components/FormField";

const schema = yup.object({
  name: yup.string().required().label("Organization Name"),
  address: yup.string().required().label("Street Address"),
  city: yup.string().required().label("City"),
  state: yup.string().required().label("State/Province"),
  country: yup.string().required().label("Country"),
  zip: yup.string().required().label("Postal Code"),
});

const confirmSchema = schema.concat(
  yup.object({
    confirmOrg: yup.boolean().required().equals([true], "You must select this checkbox."),
  })
);

const OrgForm = ({ onSubmit, isLoading, error, buttonText, defaultValues, confirmOrg }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues,
    mode: "onTouched",
    resolver: yupResolver(confirmOrg ? confirmSchema : schema),
  });

  const countriesSorted = Object.entries(countries);
  countriesSorted.sort(([, a], [, b]) => (a.name > b.name ? 1 : -1));

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
          label="Organization Name"
          placeholder="Math High School"
          error={errors.name}
          isRequired
        />

        <FormField
          ref={register}
          name="address"
          label="Street Address"
          placeholder="1234 Main St"
          error={errors.address}
          isRequired
        />

        <Stack direction="row" spacing={4}>
          <FormField ref={register} name="city" label="City" placeholder="Sacramento" error={errors.city} isRequired />
          <FormField
            ref={register}
            name="state"
            label="State/Province"
            placeholder="California"
            error={errors.state}
            isRequired
          />
        </Stack>

        <Stack direction="row" spacing={4}>
          <FormControl id="country" isInvalid={errors.country} isRequired>
            <FormLabel>Country</FormLabel>
            <Select ref={register} name="country" placeholder="Select option">
              {countriesSorted.map(([code, { name }]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </Select>
            <FormErrorMessage>{errors.country?.message}</FormErrorMessage>
          </FormControl>
          <FormField ref={register} name="zip" label="Postal Code" placeholder="12345" error={errors.zip} isRequired />
        </Stack>

        {confirmOrg && (
          <FormControl id="confirmOrg" isInvalid={errors.confirmOrg} isRequired>
            <FormLabel>
              I affirm that I am a legitimate representative of this organization, and that I am authorized to register
              for events on their behalf. By continuing, I give my consent for tournament organizers to contact the
              organization for verification purposes.
            </FormLabel>
            <Checkbox ref={register} name="confirmOrg">
              I affirm
            </Checkbox>
            <FormErrorMessage>{errors.confirmOrg?.message}</FormErrorMessage>
          </FormControl>
        )}

        <Button isLoading={isLoading} type="submit" colorScheme="blue">
          {buttonText ?? "Submit"}
        </Button>
      </Stack>
    </form>
  );
};

export default OrgForm;
