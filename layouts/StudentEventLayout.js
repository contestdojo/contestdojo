import { Divider, Heading, Stack } from "@chakra-ui/react";
import EventProvider, { useEvent } from "~/contexts/EventProvider";
import StudentLayout from "./StudentLayout";

const StudentEventLayoutContent = ({ children }) => {
    const { data: event } = useEvent();

    return (
        <Stack spacing={6} flexBasis={600}>
            <Heading>{event.name}</Heading>
            <Divider />
            {children}
        </Stack>
    );
};

const StudentEventLayout = ({ children }) => (
    <StudentLayout>
        <EventProvider>
            <StudentEventLayoutContent>{children}</StudentEventLayoutContent>
        </EventProvider>
    </StudentLayout>
);

export default StudentEventLayout;
