/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Textarea } from "@chakra-ui/react";
import TextareaAutosize from "react-textarea-autosize";

const ResizingTextarea = props => (
    <Textarea
        minH="unset"
        overflow="hidden"
        transition="none"
        resize="none"
        minRows={1}
        as={TextareaAutosize}
        {...props}
    />
);

export default ResizingTextarea;
