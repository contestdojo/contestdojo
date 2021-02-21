import { useRouter } from "next/router";
import AuthWrapper from "~/components/AuthWrapper";
import { useUserData } from "~/helpers/utils";

const HomePage = () => {
    const router = useRouter();
    const { data: user } = useUserData();

    if (user.type == "coach") {
        router.replace("/coach");
    } else if (user.type == "student") {
        router.replace("/student");
    } else if (user.type == "admin") {
        router.replace("/admin");
    }

    return null;
};

const Home = () => (
    <AuthWrapper>
        <HomePage />
    </AuthWrapper>
);

export default Home;
