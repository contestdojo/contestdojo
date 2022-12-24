/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

import { Box, HStack, useRadio, useRadioGroup } from "@chakra-ui/react";

const RadioItem = ({ children, inputRef, ...props }) => {
  const { getInputProps, getCheckboxProps } = useRadio(props);

  const input = getInputProps();
  const checkbox = getCheckboxProps();

  return (
    <Box as="label">
      <input {...input} ref={inputRef} />
      <Box
        {...checkbox}
        cursor="pointer"
        borderWidth="1px"
        borderRadius="md"
        boxShadow="md"
        _checked={{ bg: "blue.500", color: "white", borderColor: "blue.500" }}
        _focus={{ boxShadow: "outline" }}
        px={5}
        py={3}
        textTransform="capitalize"
      >
        {children}
      </Box>
    </Box>
  );
};

const RadioToggle = ({ name, inputRef, value, defaultValue, options, onChange }) => {
  const { getRootProps, getRadioProps } = useRadioGroup({
    name,
    defaultValue,
    onChange,
    value,
  });

  const group = getRootProps();

  return (
    <HStack {...group}>
      {options.map((value) => {
        let text = value;

        if (Array.isArray(value)) {
          text = value[0];
          value = value[1];
        }

        const radio = getRadioProps({ value });
        return (
          <RadioItem key={value} {...radio} inputRef={inputRef}>
            {text}
          </RadioItem>
        );
      })}
    </HStack>
  );
};

export default RadioToggle;
