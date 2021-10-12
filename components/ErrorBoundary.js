/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Alert, AlertDescription, AlertIcon, AlertTitle, Box } from "@chakra-ui/react";
import React from "react";

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    render() {
        if (this.state.error) {
            return (
                <Alert status="error">
                    <AlertIcon />
                    <Box>
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>An unexpected error has occurred. Try refreshing the page.</AlertDescription>
                    </Box>
                </Alert>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
