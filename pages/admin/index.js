/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { VStack } from "@chakra-ui/react";
import { useUserData } from "~/helpers/utils";

const Home = () => {
    const { data: user } = useUserData();

    return (
        <VStack>
            <p>
                Signed in as: {user.fname} {user.lname}
            </p>
        </VStack>
    );
};

export default Home;
