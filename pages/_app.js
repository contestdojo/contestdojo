import { Center, ChakraProvider, Spinner } from "@chakra-ui/react";
import { DefaultSeo } from "next-seo";
import Router, { useRouter } from "next/router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { Suspense } from "react";
import NoSSR from "react-no-ssr";
import { FirebaseAppProvider, preloadAuth, preloadFirestore, preloadFunctions, useFirebaseApp } from "reactfire";
import DialogProvider from "~/components/DialogProvider";
import CoachLayout from "~/layouts/CoachLayout";
import EmptyLayout from "~/layouts/EmptyLayout";
import StudentLayout from "~/layouts/StudentLayout";
import "~/styles/main.scss";

Router.events.on("routeChangeStart", NProgress.start);
Router.events.on("routeChangeComplete", NProgress.done);
Router.events.on("routeChangeError", NProgress.done);

const firebaseConfig = {
    apiKey: "AIzaSyAOOHi3dy5rYfJWiXJBEF4h_qJChyxIQLU",
    authDomain: "ncmt-67ea1.firebaseapp.com",
    projectId: "ncmt-67ea1",
    storageBucket: "ncmt-67ea1.appspot.com",
    messagingSenderId: "97736862094",
    appId: "1:97736862094:web:6a71d522dc08e59eb15cdf",
};

const preloadSDKs = async firebaseApp => {
    if (process.env.NODE_ENV === "production") {
        return Promise.all([
            preloadAuth({ firebaseApp }),
            preloadFirestore({ firebaseApp }),
            preloadFunctions({ firebaseApp }),
        ]);
    } else if (process.env.NODE_ENV === "development") {
        return Promise.all([
            preloadAuth({
                firebaseApp,
                setup: auth => auth().useEmulator("http://localhost:9099/"),
            }),
            preloadFirestore({
                firebaseApp,
                setup: firestore => firestore().useEmulator("localhost", 8080),
            }),
            preloadFunctions({
                firebaseApp,
                setup: functions => functions().useEmulator("localhost", 5001),
            }),
        ]);
    }
};

const PageSpinner = () => (
    <Center height="100vh">
        <Spinner />
    </Center>
);

const ContentWrapper = ({ children }) => {
    const firebaseApp = useFirebaseApp();
    preloadSDKs(firebaseApp);
    return children;
};

const App = ({ Component, pageProps }) => {
    const router = useRouter();

    const DefaultLayout = router.pathname.startsWith("/coach")
        ? CoachLayout
        : router.pathname.startsWith("/student")
        ? StudentLayout
        : EmptyLayout;

    const Layout = Component.layout ?? DefaultLayout;
    const layoutProps = Component.layoutProps ?? {};

    return (
        <>
            <DefaultSeo title="NCMT" description="NCMT Dashboard" />
            <FirebaseAppProvider firebaseConfig={firebaseConfig} suspense>
                <NoSSR>
                    <ChakraProvider>
                        <DialogProvider>
                            <Suspense fallback={<PageSpinner />}>
                                <ContentWrapper>
                                    <Layout {...layoutProps}>
                                        <Component {...pageProps} />
                                    </Layout>
                                </ContentWrapper>
                            </Suspense>
                        </DialogProvider>
                    </ChakraProvider>
                </NoSSR>
            </FirebaseAppProvider>
        </>
    );
};

export default App;
