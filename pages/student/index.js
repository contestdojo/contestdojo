import { VStack } from "@chakra-ui/react";
import { useUserData } from "~/helpers/utils";

const Home = () => {
    const { data: user } = useUserData();

    return (
        <VStack>
            <p>
                Signed in as: {user.fname} {user.lname}
            </p>
        </VStack>
    );
};

export default Home;
