/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { EditablePreview } from "@chakra-ui/react";

const StyledEditablePreview = () => (
  <EditablePreview
    width="100%"
    _hover={{
      boxShadow: "0 0 0 3px rgb(0 0 0 / 10%)",
      borderRadius: "0.375rem",
      cursor: "pointer",
    }}
    _after={{ content: "'\\200b'" }}
  />
);

export default StyledEditablePreview;
