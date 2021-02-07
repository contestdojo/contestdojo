import { Spinner } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { AuthCheck, useAuth } from "reactfire";

const AuthWrapper = ({ children, type }) => {
    const auth = useAuth();
    const router = useRouter();

    useEffect(() => {
        auth.onAuthStateChanged(user => {
            if (!user) {
                router.replace("/login");
            }
        });
    }, []);

    return <AuthCheck fallback={<Spinner />}>{children}</AuthCheck>;
};

export default AuthWrapper;
