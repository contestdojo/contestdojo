import { Divider, Heading, Stack } from "@chakra-ui/react";
import EventProvider, { useEvent } from "~/contexts/EventProvider";
import StudentLayout from "./StudentLayout";

const StudentEventLayoutContent = ({ children, flexBasis }) => {
    const { data: event } = useEvent();

    console.log(flexBasis);

    return (
        <Stack spacing={6} flexBasis={flexBasis ?? 600}>
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
