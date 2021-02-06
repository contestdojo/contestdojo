import { Center, Spinner } from "@chakra-ui/react";
import { Suspense } from "react";
import NoSSR from "react-no-ssr";

const EmptyLayout = ({ children }) => (
    <Center height="100vh">
        <NoSSR>
            <Suspense fallback={<Spinner />}>{children}</Suspense>
        </NoSSR>
    </Center>
);

export default EmptyLayout;
