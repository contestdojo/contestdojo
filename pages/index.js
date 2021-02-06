import { Button, Spinner, VStack } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { AuthCheck, useAuth, useUser } from "reactfire";

const HomePage = () => {
    const { data: user } = useUser();
    const auth = useAuth();

    return (
        <VStack>
            <p>Signed in as: {user.displayName}</p>
            <Button colorScheme="blue" onClick={() => auth.signOut()}>
                Sign Out
            </Button>
        </VStack>
    );
};

const Home = () => {
    const auth = useAuth();
    const router = useRouter();

    useEffect(() => {
        auth.onAuthStateChanged(user => {
            if (!user) {
                router.replace("/login");
            }
        });
    }, []);

    return (
        <AuthCheck fallback={<Spinner />}>
            <HomePage />
        </AuthCheck>
    );
};

export default Home;
