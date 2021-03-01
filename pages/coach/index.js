import { Divider, Heading, Stack } from "@chakra-ui/react";

const Home = () => {
    return (
        <Stack spacing={6} flexBasis={600}>
            <Heading size="2xl">Coach Portal</Heading>
            <Divider />
            <Stack spacing={4}>
                <p>
                    This is your coach portal. Here, you will be able to sign up for events on behalf of organizations,
                    invite students and form teams, and more.
                </p>
                <p>
                    If this is your first time here, you can start by creating an organization using the button on the
                    left sidebar. An organization could be an accredited school's math team, but it could also be a math
                    group not associated with any school.
                </p>
                <p>Once you create an organization, you'll be able to register students for events.</p>
            </Stack>
        </Stack>
    );
};

export default Home;
