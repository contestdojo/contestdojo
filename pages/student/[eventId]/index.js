/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Heading, HStack, Icon, Stack, Tag, Text } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { HiUser } from "react-icons/hi";
import { useFirestoreCollectionData, useFirestoreDocData, useUser } from "reactfire";
import ButtonLink from "~/components/ButtonLink";
import Card from "~/components/Card";
import { useEvent } from "~/components/contexts/EventProvider";

const Event = () => {
    const { ref: eventRef, data: event } = useEvent();
    const { data: user } = useUser();
    const { eventId } = useRouter().query;

    const studentRef = eventRef.collection("students").doc(user.uid);
    const { data: student } = useFirestoreDocData(studentRef, { idField: "id" });

    const teamRef = student.team ?? eventRef.collection("teams").doc("none"); // Hack for conditionals
    const teamMembersRef = eventRef.collection("students").where("team", "==", teamRef);
    const { data: teamMembers } = useFirestoreCollectionData(teamMembersRef, { idField: "id" });

    const { data: org } = useFirestoreDocData(student.org);
    const { data: team } = useFirestoreDocData(teamRef);

    return (
        <Stack spacing={6} flexBasis={600}>
            <p>
                {student.team
                    ? `Welcome to ${event.name}! Your coach at ${org.name} has assigned you to Team ${team.name}. `
                    : `Welcome to ${event.name}! You have yet to be assigned a team by your coach. `}
                You will complete registration and take tests on this portal.
            </p>

            {student.team && (
                <Card p={4} as={Stack} spacing={4}>
                    <HStack>
                        <Heading size="md">{team.name}</Heading>
                        {team.number && <Tag size="sm">{team.number}</Tag>}
                    </HStack>
                    {teamMembers.map(x => (
                        <HStack>
                            <Icon as={HiUser} boxSize={6} />
                            {x.number && (
                                <Tag colorScheme={x.id === student.id ? "blue" : undefined} size="sm">
                                    {x.number}
                                </Tag>
                            )}
                            <Text>
                                {x.fname} {x.lname}
                            </Text>
                        </HStack>
                    ))}
                </Card>
            )}

            <ButtonLink href={`/student/${eventId}/tests`} colorScheme="blue" size="lg">
                Click here to take your tests
            </ButtonLink>
        </Stack>
    );
};

export default Event;
