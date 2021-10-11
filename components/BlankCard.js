/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import Card from "./Card";

const { Flex, Text } = require("@chakra-ui/layout");

const BlankCard = ({ children, ...props }) => {
    return (
        <Card
            as={Flex}
            m={2}
            p={4}
            flex={1}
            justifyContent="center"
            alignItems="center"
            borderStyle="dashed"
            {...props}
        >
            <Text as="h4" size="md" color="gray.500">
                {children}
            </Text>
        </Card>
    );
};

export default BlankCard;
