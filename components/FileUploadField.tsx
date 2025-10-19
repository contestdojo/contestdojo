/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Button, FormControl, FormErrorMessage, FormHelperText, FormLabel, HStack, Input, Link, Text } from "@chakra-ui/react";
import { forwardRef, useRef, useState } from "react";

const FileUploadField = forwardRef(
  ({ name, label, helperText, error, isRequired, isDisabled, accept = "*", existingFileUrl, ...props }, ref) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        setFileName(file.name);
      }
    };

    const handleButtonClick = () => {
      fileInputRef.current?.click();
    };

    if (error && !Array.isArray(error)) {
      error = [error];
    }

    return (
      <FormControl id={name} isInvalid={error} isRequired={isRequired} {...props}>
        <FormLabel>{label}</FormLabel>
        <HStack spacing={3}>
          <Button onClick={handleButtonClick} isDisabled={isDisabled} size="sm">
            Choose File
          </Button>
          {fileName && <Text fontSize="sm">{fileName}</Text>}
          {!fileName && existingFileUrl && (
            <Link href={existingFileUrl} isExternal fontSize="sm" color="blue.500">
              View existing file
            </Link>
          )}
          {!fileName && !existingFileUrl && <Text fontSize="sm" color="gray.500">No file chosen</Text>}
        </HStack>
        <Input
          ref={fileInputRef}
          type="file"
          name={name}
          accept={accept}
          onChange={handleFileSelect}
          display="none"
        />
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
        {error?.map((x: any) => (
          <FormErrorMessage key={x}>{x.message}</FormErrorMessage>
        ))}
      </FormControl>
    );
  }
);

export default FileUploadField;
