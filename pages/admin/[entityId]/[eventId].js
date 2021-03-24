import {
    Box,
    Button,
    ButtonGroup,
    Checkbox,
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
import { useState } from "react";
import { CSVLink } from "react-csv";
import { IoAdd, IoChevronDown, IoRemove } from "react-icons/io5";
import { useFirestore, useFirestoreCollectionData } from "reactfire";
import EventProvider, { useEvent } from "~/contexts/EventProvider";
import EventForm from "~/forms/EventForm";
import { delay } from "~/helpers/utils";

const toDict = (obj, x) => {
    obj[x.id] = { ...x, ...obj[x.id] };
    return obj;
};

const sum = arr => arr.reduce((a, b) => a + b, 0);

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

    console.log(showCols);

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
                                <Td key={col.key}>{col.renderer?.(row) ?? row[col.key]}</Td>
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
        { label: "Name", key: "name", renderer: row => <Tooltip label={`${row.address}`}>{row.name}</Tooltip> },
        { label: "Address", key: "address", hideByDefault: true },
        { label: "Contact", key: "admin" },
        { label: "Contact Email", key: "adminEmail", hideByDefault: true },
        { label: "# Teams Applied", key: "applyTeams", reducer: sum },
        { label: "Expected # Students", key: "expectedStudents", reducer: sum },
        {
            label: "# Tree Teams",
            key: "maxTeams",
            renderer: row => (
                <HStack spacing={4}>
                    <IconButton
                        size="sm"
                        aria-label="Add Team"
                        icon={<IoRemove />}
                        onClick={() => onUpdate(row.id, { maxTeams: (row.maxTeams ?? 0) - 1 })}
                        disabled={(row.maxTeams ?? 0) <= 0}
                    />
                    <Box>{row.maxTeams ?? 0}</Box>
                    <IconButton
                        size="sm"
                        aria-label="Add Team"
                        icon={<IoAdd />}
                        onClick={() => onUpdate(row.id, { maxTeams: (row.maxTeams ?? 0) + 1 })}
                    />
                </HStack>
            ),
            reducer: sum,
        },
        {
            label: "# Sampling Teams",
            key: "maxTeamsSapling",
            renderer: row => (
                <HStack spacing={4}>
                    <IconButton
                        size="sm"
                        aria-label="Add Team"
                        icon={<IoRemove />}
                        onClick={() => onUpdate(row.id, { maxTeamsSapling: (row.maxTeamsSapling ?? 0) - 1 })}
                        disabled={(row.maxTeamsSapling ?? 0) <= 0}
                    />
                    <Box>{row.maxTeamsSapling ?? 0}</Box>
                    <IconButton
                        size="sm"
                        aria-label="Add Team"
                        icon={<IoAdd />}
                        onClick={() => onUpdate(row.id, { maxTeamsSapling: (row.maxTeamsSapling ?? 0) + 1 })}
                    />
                </HStack>
            ),
            reducer: sum,
        },
        {
            label: "Stage",
            key: "stage",
            renderer: row => {
                const stage = row.stage ?? event.defaultStage;
                return (
                    <ButtonGroup isAttached>
                        <Button
                            mr="-px"
                            {...(stage == "apply" ? { colorScheme: "blue" } : {})}
                            onClick={() => onUpdate(row.id, { stage: "apply" })}
                        >
                            Apply
                        </Button>
                        <Button
                            {...(stage == "teams" ? { colorScheme: "blue" } : {})}
                            onClick={() => onUpdate(row.id, { stage: "teams" })}
                        >
                            Teams
                        </Button>
                    </ButtonGroup>
                );
            },
        },
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
        stage: x.stage ?? event.defaultStage,
    }));

    return <TableView cols={cols} rows={rows} defaultSortKey="name" filename="organizations.csv" />;
};

const Teams = ({ teams, orgsById, studentsByTeam }) => {
    const cols = [
        { label: "Name", key: "name" },
        { label: "Organization", key: "org" },
        { label: "# Students", key: "numStudents", reducer: sum },
        { label: "# Waivers Signed", key: "numSigned", reducer: sum },
    ];

    const rows = teams.map(x => ({
        id: x.id,
        name: x.name,
        org: orgsById[x.org.id].name,
        numStudents: studentsByTeam[x.id]?.length ?? 0,
        numSigned: studentsByTeam[x.id]?.filter(x => x.waiverSigned)?.length ?? 0,
    }));

    return <TableView cols={cols} rows={rows} defaultSortKey="name" filename="teams.csv" />;
};

const Students = ({ students, teamsById, orgsById, onUpdate }) => {
    const cols = [
        { label: "Name", key: "name", renderer: row => <Tooltip label={`${row.email}`}>{row.name}</Tooltip> },
        { label: "Email", key: "email", hideByDefault: true },
        { label: "Parent Email", key: "parentEmail" },
        { label: "Organization", key: "org" },
        { label: "Team", key: "team" },
        {
            label: "Waiver signed?",
            key: "waiverSigned",
            renderer: row => (
                <Checkbox
                    isChecked={row.waiverSigned ?? false}
                    onChange={e => onUpdate(row.id, { waiverSigned: e.target.checked })}
                />
            ),
            reducer: sum,
        },
    ];

    const rows = students.map(x => ({
        id: x.id,
        name: `${x.fname} ${x.lname}`,
        email: x.email,
        parentEmail: x.parentEmail,
        org: orgsById[x.org.id].name,
        team: teamsById[x.team?.id]?.name,
        waiverSigned: !!x.waiverSigned,
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
    const handleUpdate = async ({ name, date, maxStudents, maxTeams, maxTeamsSapling }) => {
        setFormState({ isLoading: true, error: null });
        await delay(300);
        try {
            await eventRef.update({
                name,
                maxStudents,
                maxTeams,
                maxTeamsSapling,
            });
            setFormState({ isLoading: false, error: null });
        } catch (err) {
            setFormState({ isLoading: false, error: err });
        }
    };

    // Update handlers

    const handleOrgUpdate = async (id, update) => {
        await eventOrgsRef.doc(id).update(update);
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
                        <Teams teams={teams} orgsById={orgsById} studentsByTeam={studentsByTeam} />
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
