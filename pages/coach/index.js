import { Button, VStack } from "@chakra-ui/react";
import { useAuth } from "reactfire";
import { useUserData } from "~/helpers/utils";

const Home = () => {
    const auth = useAuth();
    const { data: user } = useUserData();

    return (
        <VStack>
            <p>
                Signed in as: {user.fname} {user.lname}
            </p>
            <Button colorScheme="blue" onClick={() => auth.signOut()}>
                Sign Out
            </Button>
        </VStack>
    );
};

export default Home;
