import {
    Box,
    Button,
    ButtonGroup,
    Checkbox,
    Editable,
    EditableInput,
    Heading,
    HStack,
    IconButton,
    Menu,
    MenuButton,
    MenuDivider,
    MenuItemOption,
    MenuList,
    MenuOptionGroup,
    Stack,
    Tab,
    Table,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Tbody,
    Td,
    Tfoot,
    Th,
    Thead,
    Tooltip,
    Tr,
} from "@chakra-ui/react";
import dayjs from "dayjs";
import { useState } from "react";
import { CSVLink } from "react-csv";
import { IoAdd, IoChevronDown, IoRemove } from "react-icons/io5";
import { useFirestore, useFirestoreCollectionData } from "reactfire";
import StyledEditablePreview from "~/components/StyledEditablePreview";
import EventProvider, { useEvent } from "~/contexts/EventProvider";
import EventForm from "~/forms/EventForm";
import { delay } from "~/helpers/utils";

const toDict = (obj, x) => {
    obj[x.id] = { ...x, ...obj[x.id] };
    return obj;
};

const sum = arr => arr.reduce((a, b) => a + b, 0);

const updateRenderer = (onUpdate, key, updateKey) => (val, { id }) => (
    <Editable defaultValue={val} onSubmit={newVal => onUpdate(id, { [updateKey ?? key]: newVal })}>
        <StyledEditablePreview />
        <EditableInput />
    </Editable>
);

const dayjsRenderer = val => val.format("M/DD/YYYY");

const TableView = ({ cols, rows, filename, defaultSortKey }) => {
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
                                <Td key={col.key}>{col.renderer?.(row[col.key], row) ?? row[col.key]}</Td>
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

const Orgs = ({ event, orgs, onUpdate }) => {
    const cols = [
        { label: "ID", key: "id", hideByDefault: true },
        { label: "Name", key: "name", renderer: updateRenderer(onUpdate, "name") },
        { label: "Address", key: "address", hideByDefault: true },
        { label: "Contact", key: "admin", hideByDefault: true },
        { label: "Contact Email", key: "adminEmail", hideByDefault: true },
        { label: "# Teams Applied", key: "applyTeams", reducer: sum },
        { label: "Expected # Students", key: "expectedStudents", reducer: sum },
        {
            label: "# Tree Teams",
            key: "maxTeams",
            renderer: (val, { id }) => (
                <HStack spacing={2}>
                    <IconButton
                        size="xs"
                        aria-label="Remove Team"
                        icon={<IoRemove />}
                        onClick={() => onUpdate(id, { maxTeams: val - 1 })}
                        disabled={val <= 0}
                    />
                    <Box>{val}</Box>
                    <IconButton
                        size="xs"
                        aria-label="Add Team"
                        icon={<IoAdd />}
                        onClick={() => onUpdate(id, { maxTeams: val + 1 })}
                    />
                </HStack>
            ),
            reducer: sum,
        },
        {
            label: "# Sapling Teams",
            key: "maxTeamsSapling",
            renderer: (val, { id }) => (
                <HStack spacing={2}>
                    <IconButton
                        size="xs"
                        aria-label="Remove Team"
                        icon={<IoRemove />}
                        onClick={() => onUpdate(id, { maxTeamsSapling: val - 1 })}
                        disabled={val <= 0}
                    />
                    <Box>{val}</Box>
                    <IconButton
                        size="xs"
                        aria-label="Add Team"
                        icon={<IoAdd />}
                        onClick={() => onUpdate(id, { maxTeamsSapling: val + 1 })}
                    />
                </HStack>
            ),
            reducer: sum,
        },
        {
            label: "# Paid Students",
            key: "paidStudents",
            renderer: (val, { id }) => (
                <HStack spacing={2}>
                    <IconButton
                        size="xs"
                        aria-label="Remove Student"
                        icon={<IoRemove />}
                        onClick={() => onUpdate(id, { paidStudents: val - 1 })}
                        disabled={val <= 0}
                    />
                    <Box>{val}</Box>
                    <IconButton
                        size="xs"
                        aria-label="Add Student"
                        icon={<IoAdd />}
                        onClick={() => onUpdate(id, { paidStudents: val + 1 })}
                    />
                </HStack>
            ),
            reducer: sum,
        },
        {
            label: "Stage",
            key: "stage",
            renderer: (val, { id }) => (
                <ButtonGroup isAttached>
                    <Button
                        mr="-px"
                        {...(val == "apply" ? { colorScheme: "blue" } : {})}
                        onClick={() => onUpdate(id, { stage: "apply" })}
                    >
                        Apply
                    </Button>
                    <Button
                        {...(val == "teams" ? { colorScheme: "blue" } : {})}
                        onClick={() => onUpdate(id, { stage: "teams" })}
                    >
                        Teams
                    </Button>
                </ButtonGroup>
            ),
        },
        { label: "Start Time", key: "startTime", hideByDefault: true, renderer: dayjsRenderer },
        { label: "Last Update Time", key: "updateTime", hideByDefault: true, renderer: dayjsRenderer },
        { label: "Notes", key: "notes", hideByDefault: true, renderer: updateRenderer(onUpdate, "notes") },
    ];

    const rows = orgs.map(x => ({
        id: x.id,
        name: x.name,
        address: `${x.address}, ${x.city}, ${x.state}, ${x.country} ${x.zip}`,
        admin: `${x.adminData?.fname} ${x.adminData?.lname}`,
        adminEmail: x.adminData?.email,
        applyTeams: x.applyTeams,
        expectedStudents: x.expectedStudents,
        maxTeams: x.maxTeams ?? 0,
        maxTeamsSapling: x.maxTeamsSapling ?? 0,
        paidStudents: x.paidStudents ?? 0,
        stage: x.stage ?? event.defaultStage,
        startTime: dayjs.unix(x.startTime.seconds),
        updateTime: dayjs.unix(x.updateTime.seconds),
        notes: x.notes ?? "",
    }));

    return <TableView cols={cols} rows={rows} defaultSortKey="name" filename="organizations.csv" />;
};

const Teams = ({ teams, orgsById, studentsByTeam, onUpdate }) => {
    const cols = [
        { label: "ID", key: "id", hideByDefault: true },
        { label: "Number", key: "number" },
        { label: "Name", key: "name", renderer: updateRenderer(onUpdate, "name") },
        { label: "Organization", key: "org" },
        { label: "Division", key: "division" },
        { label: "# Students", key: "numStudents", reducer: sum },
        { label: "# Waivers Signed", key: "numSigned", reducer: sum },
        { label: "Notes", key: "notes", hideByDefault: true, renderer: updateRenderer(onUpdate, "notes") },
    ];

    const rows = teams.map(x => ({
        id: x.id,
        number: x.number ?? "",
        name: x.name,
        org: orgsById[x.org.id]?.name,
        division: x.division == 0 ? "Tree" : "Sapling",
        numStudents: studentsByTeam[x.id]?.length ?? 0,
        numSigned: studentsByTeam[x.id]?.filter(x => x.waiverSigned)?.length ?? 0,
        notes: x.notes ?? "",
    }));

    return <TableView cols={cols} rows={rows} defaultSortKey="number" filename="teams.csv" />;
};

const Students = ({ students, teamsById, orgsById, onUpdate }) => {
    const cols = [
        { label: "ID", key: "id", hideByDefault: true },
        { label: "Name", key: "name", renderer: updateRenderer(onUpdate, "name") },
        { label: "Email", key: "email", hideByDefault: true },
        { label: "Parent Email", key: "parentEmail", renderer: updateRenderer(onUpdate, "parentEmail") },
        { label: "Birthdate", key: "birthdate", renderer: updateRenderer(onUpdate, "birthdate") },
        { label: "Gender", key: "gender", renderer: updateRenderer(onUpdate, "gender") },
        { label: "Organization", key: "org" },
        { label: "Team", key: "team" },
        {
            label: "Waiver sent?",
            key: "waiverSent",
            renderer: (val, { id }) => (
                <Checkbox isChecked={val} onChange={e => onUpdate(id, { waiverSent: e.target.checked })} />
            ),
            reducer: sum,
        },
        {
            label: "Waiver signed?",
            key: "waiverSigned",
            renderer: (val, { id }) => (
                <Checkbox isChecked={val} onChange={e => onUpdate(id, { waiverSigned: e.target.checked })} />
            ),
            reducer: sum,
        },
        { label: "Notes", key: "notes", hideByDefault: true, renderer: updateRenderer(onUpdate, "notes") },
    ];

    const rows = students.map(x => ({
        id: x.id,
        name: `${x.fname} ${x.lname}`,
        email: x.email,
        parentEmail: x.parentEmail ?? "",
        org: orgsById[x.org.id].name,
        team: teamsById[x.team?.id]?.name ?? "",
        waiverSigned: !!x.waiverSigned,
        waiverSent: !!x.waiverSent,
        notes: x.notes ?? "",
    }));

    return <TableView cols={cols} rows={rows} defaultSortKey="name" filename="students.csv" />;
};

const EventContent = () => {
    // Data
    const firestore = useFirestore();
    const { ref: eventRef, data: event } = useEvent();

    // Get orgs

    const eventOrgsRef = eventRef.collection("orgs");
    const { data: eventOrgs } = useFirestoreCollectionData(eventOrgsRef, { idField: "id" });
    let orgsById = eventOrgs.reduce(toDict, {});

    const rootOrgsRef = firestore.collection("orgs");
    const { data: rootOrgs } = useFirestoreCollectionData(rootOrgsRef, { idField: "id" });
    orgsById = rootOrgs.filter(x => orgsById.hasOwnProperty(x.id)).reduce(toDict, orgsById);

    // Get teams
    const teamsRef = eventRef.collection("teams");
    const { data: teams } = useFirestoreCollectionData(teamsRef, { idField: "id" });
    const teamsById = teams.reduce(toDict, {});

    // Get students
    const studentsRef = eventRef.collection("students");
    let { data: students } = useFirestoreCollectionData(studentsRef, { idField: "id" });
    const studentsById = students.reduce(toDict, {});

    // Make dicts

    const teamsByOrg = {};
    const studentsByTeam = {};
    const studentsByOrg = {};

    for (const team of teams) {
        const key = team.org?.id ?? null;
        if (!teamsByOrg.hasOwnProperty(key)) teamsByOrg[key] = [];
        teamsByOrg[key].push(team);
    }

    for (const student of students) {
        const teamKey = student.team?.id ?? null;
        if (!studentsByTeam.hasOwnProperty(teamKey)) studentsByTeam[teamKey] = [];
        studentsByTeam[teamKey].push(student);

        const orgKey = teamsById[student.team?.id]?.org?.id ?? null;
        if (!studentsByOrg.hasOwnProperty(orgKey)) studentsByOrg[orgKey] = [];
        studentsByOrg[orgKey].push(student);
    }

    // Form
    const [formState, setFormState] = useState({ isLoading: false, error: null });
    const handleUpdate = async ({ name }) => {
        setFormState({ isLoading: true, error: null });
        await delay(300);
        try {
            await eventRef.update({ name });
            setFormState({ isLoading: false, error: null });
        } catch (err) {
            setFormState({ isLoading: false, error: err });
        }
    };

    // Update handlers

    const handleOrgUpdate = async (id, update) => {
        await eventOrgsRef.doc(id).update(update);
    };

    const handleTeamUpdate = async (id, update) => {
        await teamsRef.doc(id).update(update);
    };

    const handleStudentUpdate = async (id, update) => {
        await studentsRef.doc(id).update(update);
    };

    return (
        <Stack spacing={6} flex={1} minWidth={0}>
            <Heading>{event.name}</Heading>
            <Tabs>
                <TabList>
                    <Tab>Organizations</Tab>
                    <Tab>Teams</Tab>
                    <Tab>Students</Tab>
                    <Tab>Tests</Tab>
                    <Tab>Event Details</Tab>
                </TabList>

                <TabPanels>
                    <TabPanel>
                        <Orgs
                            event={event}
                            orgs={Object.values(orgsById)}
                            teamsByOrg={teamsByOrg}
                            studentsByOrg={studentsByOrg}
                            onUpdate={handleOrgUpdate}
                        />
                    </TabPanel>
                    <TabPanel>
                        <Teams
                            teams={teams}
                            orgsById={orgsById}
                            studentsByTeam={studentsByTeam}
                            onUpdate={handleTeamUpdate}
                        />
                    </TabPanel>
                    <TabPanel>
                        <Students
                            students={students}
                            teamsById={teamsById}
                            orgsById={orgsById}
                            onUpdate={handleStudentUpdate}
                        />
                    </TabPanel>
                    <TabPanel>Tests</TabPanel>
                    <TabPanel>
                        <Box maxWidth={600}>
                            <EventForm
                                key={event.id}
                                onSubmit={handleUpdate}
                                buttonText="Update Event"
                                defaultValues={event}
                                {...formState}
                            />
                        </Box>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Stack>
    );
};

const Event = () => (
    <EventProvider>
        <EventContent />
    </EventProvider>
);

export default Event;
