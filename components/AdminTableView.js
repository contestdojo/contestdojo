/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import {
  Box,
  Button,
  Editable,
  EditableInput,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Stack,
  Table,
  Tbody,
  Td,
  Tfoot,
  Th,
  Thead,
  Tooltip,
  Tr,
} from "@chakra-ui/react";
import { Fragment, useState } from "react";
import { CSVLink } from "react-csv";
import { HiChevronDown, HiMinus, HiPlus } from "react-icons/hi";

import StyledEditablePreview from "~/components/StyledEditablePreview";

export const sumReducer = (arr) => arr.reduce((a, b) => a + b, 0);
export const countReducer = (arr) => arr.filter(Boolean).length;
export const dayjsRenderer = (val) => val.format("M/DD/YYYY");

export const updateRenderer =
  (onUpdate, updater) =>
  (val, { id }) => {
    if (typeof updater === "string") {
      const key = updater;
      updater = (newVal) => ({ [key]: newVal });
    }

    return (
      <Editable defaultValue={val} onSubmit={(newVal) => onUpdate(id, updater(newVal))}>
        <StyledEditablePreview />
        <EditableInput />
      </Editable>
    );
  };

export const addRemoveRenderer =
  (onUpdate, label) =>
  (val, { id }, key) =>
    (
      <HStack spacing={2}>
        <IconButton
          size="xs"
          aria-label={`Remove ${label}`}
          icon={<HiMinus />}
          onClick={() => onUpdate(id, { [key]: val - 1 })}
          disabled={val <= 0}
        />
        <Box>{val}</Box>
        <IconButton
          size="xs"
          aria-label={`Add ${label}`}
          icon={<HiPlus />}
          onClick={() => onUpdate(id, { [key]: val + 1 })}
        />
      </HStack>
    );

const AdminTableView = ({ cols, rows, filename, defaultSortKey, defaultSortOrder, extraButtons, tableProps = {} }) => {
  const [showCols, setShowCols] = useState(cols.filter((x) => !x.hideByDefault).map((x) => x.key));
  const [sortBy, setSortBy] = useState(defaultSortKey ?? "");
  const [sortOrder, setSortOrder] = useState(defaultSortOrder ?? "asc");

  let displayRows = rows;
  let displayCols = cols.filter((x) => showCols.includes(x.key));

  if (sortBy !== "") {
    displayRows = [...rows].sort((a, b) => {
      const av = a[sortBy] ?? "";
      const bv = b[sortBy] ?? "";
      if (av === bv) return 0;
      const mult = sortOrder === "asc" ? 1 : -1;
      return av > bv ? mult : -mult;
    });
  }

  return (
    <Stack spacing={4} position="relative">
      <HStack justifyContent="flex-end">
        {extraButtons}
        <Box>
          <Menu closeOnSelect={false}>
            <MenuButton as={Button} rightIcon={<HiChevronDown />}>
              Fields
            </MenuButton>
            <MenuList>
              <MenuOptionGroup title="Shown Fields" type="checkbox" value={showCols} onChange={setShowCols}>
                {cols.map((col) => (
                  <MenuItemOption key={col.key} value={col.key}>
                    {col.label}
                  </MenuItemOption>
                ))}
              </MenuOptionGroup>
            </MenuList>
          </Menu>
        </Box>
        <Box>
          <Menu closeOnSelect={false}>
            <MenuButton as={Button} rightIcon={<HiChevronDown />}>
              Sort By
            </MenuButton>
            <MenuList>
              <MenuOptionGroup title="Order" type="radio" value={sortOrder} onChange={setSortOrder}>
                <MenuItemOption value="asc">Ascending</MenuItemOption>
                <MenuItemOption value="dsc">Descending</MenuItemOption>
              </MenuOptionGroup>
              <MenuDivider />
              <MenuOptionGroup title="Fields" type="radio" value={sortBy} onChange={setSortBy}>
                {cols.map((col) => (
                  <MenuItemOption key={col.key} value={col.key}>
                    {col.label}
                  </MenuItemOption>
                ))}
              </MenuOptionGroup>
            </MenuList>
          </Menu>
        </Box>
        <Tooltip label="CSV file will be unsorted and contain all fields regardless of selected values.">
          <Button colorScheme="blue">
            <CSVLink data={rows} headers={cols} filename={filename}>
              Download CSV
            </CSVLink>
          </Button>
        </Tooltip>
      </HStack>
      <Box overflow="scroll">
        <Table size="sm" {...tableProps}>
          <Thead>
            <Tr>
              {displayCols.map((col) => (
                <Th key={col.key}>{col.label}</Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {displayRows.map((row) => (
              <Tr key={row.id}>
                {displayCols.map((col) => {
                  const El = col.skipCell ? Fragment : Td;
                  return <El key={col.key}>{col.renderer?.(row[col.key], row, col.key) ?? row[col.key]}</El>;
                })}
              </Tr>
            ))}
          </Tbody>
          <Tfoot>
            <Tr>
              <Td>
                <b>Total</b>
              </Td>
              {displayCols.slice(1).map((col) => (
                <Td key={col.key}>
                  <b>{col.reducer?.(rows.map((row) => row[col.key]))}</b>
                </Td>
              ))}
            </Tr>
          </Tfoot>
        </Table>
      </Box>
    </Stack>
  );
};

export default AdminTableView;
