/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { extendTheme, theme as defaultTheme } from "@chakra-ui/react";

const linedVariant = props => {
    const { colorScheme: c } = props;
    const base = defaultTheme.components.Table.variants.simple(props);

    return {
        ...base,
        table: {
            marginLeft: "-1px",
            marginTop: "-1px",
        },
        th: {
            borderWidth: 0,
            boxShadow: "inset 1px 1px 0 0 rgb(16 22 26 / 15%)",
        },
        td: {
            ...base.td,
            borderWidth: 0,
            boxShadow: "inset 1px 1px 0 0 rgb(16 22 26 / 15%)",
        },
    };
};

const theme = extendTheme({
    components: {
        Table: {
            variants: {
                lined: linedVariant,
            },
        },
    },
});

export default theme;
