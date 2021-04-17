import { Divider, Heading, Stack } from "@chakra-ui/react";
import EventProvider, { useEvent } from "~/components/contexts/EventProvider";
import StudentLayout from "./StudentLayout";

const StudentEventLayoutContent = ({ children, flexBasis, ...props }) => {
    const { data: event } = useEvent();

    return (
        <Stack spacing={6} flexBasis={flexBasis ?? 600} {...props}>
            <Heading>{event.name}</Heading>
            <Divider />
            {children}
        </Stack>
    );
};

const StudentEventLayout = ({ children, ...props }) => (
    <StudentLayout>
        <EventProvider>
            <StudentEventLayoutContent {...props}>{children}</StudentEventLayoutContent>
        </EventProvider>
    </StudentLayout>
);

export default StudentEventLayout;
