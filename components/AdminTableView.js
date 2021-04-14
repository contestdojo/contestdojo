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
import { useState } from "react";
import { CSVLink } from "react-csv";
import { IoAdd, IoChevronDown, IoRemove } from "react-icons/io5";
import StyledEditablePreview from "~/components/StyledEditablePreview";

export const sumReducer = arr => arr.reduce((a, b) => a + b, 0);

export const dayjsRenderer = val => val.format("M/DD/YYYY");

export const updateRenderer = (onUpdate, updater) => (val, { id }) => {
    if (typeof updater === "string") {
        const key = updater;
        updater = newVal => ({ [key]: newVal });
    }

    return (
        <Editable defaultValue={val} onSubmit={newVal => onUpdate(id, updater(newVal))}>
            <StyledEditablePreview />
            <EditableInput />
        </Editable>
    );
};

export const addRemoveRenderer = (onUpdate, label) => (val, { id }, key) => (
    <HStack spacing={2}>
        <IconButton
            size="xs"
            aria-label={`Remove ${label}`}
            icon={<IoRemove />}
            onClick={() => onUpdate(id, { [key]: val - 1 })}
            disabled={val <= 0}
        />
        <Box>{val}</Box>
        <IconButton
            size="xs"
            aria-label={`Add ${label}`}
            icon={<IoAdd />}
            onClick={() => onUpdate(id, { [key]: val + 1 })}
        />
    </HStack>
);

const AdminTableView = ({ cols, rows, filename, defaultSortKey }) => {
    const [showCols, setShowCols] = useState(cols.filter(x => !x.hideByDefault).map(x => x.key));
    const [sortBy, setSortBy] = useState(defaultSortKey ?? "");
    const [sortOrder, setSortOrder] = useState("asc");

    let displayRows = rows;
    let displayCols = cols.filter(x => showCols.includes(x.key));

    if (sortBy !== "") {
        displayRows = [...rows].sort((a, b) => {
            if (a[sortBy] == b[sortBy]) return 0;
            const mult = sortOrder == "asc" ? 1 : -1;
            return a[sortBy] > b[sortBy] ? mult : -mult;
        });
    }

    return (
        <Stack spacing={4}>
            <HStack justifyContent="flex-end">
                <Box>
                    <Menu closeOnSelect={false}>
                        <MenuButton as={Button} rightIcon={<IoChevronDown />}>
                            Fields
                        </MenuButton>
                        <MenuList>
                            <MenuOptionGroup
                                title="Shown Fields"
                                type="checkbox"
                                value={showCols}
                                onChange={setShowCols}
                            >
                                {cols.map(col => (
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
                        <MenuButton as={Button} rightIcon={<IoChevronDown />}>
                            Sort By
                        </MenuButton>
                        <MenuList>
                            <MenuOptionGroup title="Order" type="radio" value={sortOrder} onChange={setSortOrder}>
                                <MenuItemOption value="asc">Ascending</MenuItemOption>
                                <MenuItemOption value="dsc">Descending</MenuItemOption>
                            </MenuOptionGroup>
                            <MenuDivider />
                            <MenuOptionGroup title="Fields" type="radio" value={sortBy} onChange={setSortBy}>
                                {cols.map(col => (
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
            <Table>
                <Thead>
                    <Tr>
                        {displayCols.map(col => (
                            <Th key={col.key}>{col.label}</Th>
                        ))}
                    </Tr>
                </Thead>
                <Tbody>
                    {displayRows.map(row => (
                        <Tr key={row.id}>
                            {displayCols.map(col => (
                                <Td key={col.key}>{col.renderer?.(row[col.key], row, col.key) ?? row[col.key]}</Td>
                            ))}
                        </Tr>
                    ))}
                </Tbody>
                <Tfoot>
                    <Tr>
                        <Td>
                            <b>Total</b>
                        </Td>
                        {displayCols.slice(1).map(col => (
                            <Td key={col.key}>
                                <b>{col.reducer?.(rows.map(row => row[col.key]))}</b>
                            </Td>
                        ))}
                    </Tr>
                </Tfoot>
            </Table>
        </Stack>
    );
};

export default AdminTableView;
