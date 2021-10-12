/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Button,
    Stack,
    Text,
} from "@chakra-ui/react";
import { useRef } from "react";

type IntroDialogProps = {
    isOpen: boolean;
    onClose: () => void;
};

const IntroDialog = ({ isOpen, onClose }: IntroDialogProps) => {
    const ref = useRef(null);

    return (
        <AlertDialog
            isOpen={isOpen}
            leastDestructiveRef={ref}
            closeOnEsc={false}
            closeOnOverlayClick={false}
            onClose={onClose}
        >
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader fontSize="lg" fontWeight="bold">
                        Welcome to ContestDojo!
                    </AlertDialogHeader>

                    <AlertDialogBody as={Stack} spacing={4}>
                        <Text>
                            ContestDojo is an online math competition platform used by events such as the Stanford Math
                            Tournament and the Berkeley Math Tournament.
                        </Text>
                        <Text>
                            If you've used ContestDojo in the past for another tournament, such as SMT 2021, please sign
                            in with your existing account.
                        </Text>
                    </AlertDialogBody>

                    <AlertDialogFooter>
                        <Button colorScheme="blue" ref={ref} onClick={onClose}>
                            Continue
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
};

export default IntroDialog;
