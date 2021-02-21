import { useRouter } from "next/router";
import { AuthCheck } from "reactfire";
import { useUserData } from "~/helpers/utils";

const RedirectLogin = () => {
    const router = useRouter();
    router.replace("/login");
    return null;
};

const AuthChecker = ({ children, type }) => {
    const router = useRouter();

    const { data: userData } = useUserData();
    if (type && userData.type !== type) {
        router.replace("/");
    }

    return children;
};

const AuthWrapper = ({ children, type }) => (
    <AuthCheck fallback={<RedirectLogin />}>
        <AuthChecker type={type}>{children}</AuthChecker>
    </AuthCheck>
);

export default AuthWrapper;
