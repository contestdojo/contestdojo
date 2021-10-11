/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Divider, Heading, Stack } from "@chakra-ui/react";

const Home = () => {
    return (
        <Stack spacing={6} maxW={600} mx="auto">
            <Heading size="2xl">Coach Portal</Heading>
            <Divider />
            <Stack spacing={4}>
                <p>
                    This is your coach portal. Here, you will be able to sign up for events on behalf of organizations,
                    invite students and form teams, and more.
                </p>
                <p>
                    If this is your first time here, you can start by creating an organization using the button on the
                    left sidebar. An organization could be an accredited school's math team, but it could also be a math
                    group not associated with any school.
                </p>
                <p>Once you create an organization, you'll be able to register students for events.</p>
            </Stack>
        </Stack>
    );
};

export default Home;
