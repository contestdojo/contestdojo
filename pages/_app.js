import { Center, ChakraProvider, Spinner } from "@chakra-ui/react";
import { DefaultSeo } from "next-seo";
import Head from "next/head";
import Router, { useRouter } from "next/router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { Suspense } from "react";
import NoSSR from "react-no-ssr";
import { FirebaseAppProvider, preloadAuth, preloadFirestore, preloadFunctions, useFirebaseApp } from "reactfire";
import ErrorBoundary from "~/components/ErrorBoundary";
import DialogProvider from "~/contexts/DialogProvider";
import AdminLayout from "~/layouts/AdminLayout";
import CoachLayout from "~/layouts/CoachLayout";
import EmptyLayout from "~/layouts/EmptyLayout";
import StudentLayout from "~/layouts/StudentLayout";
import "~/styles/main.scss";

const useEmulatorsInDebug = false;

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
    } else if (process.env.NODE_ENV === "development" && useEmulatorsInDebug) {
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
        : router.pathname.startsWith("/admin")
        ? AdminLayout
        : EmptyLayout;

    const Layout = Component.layout ?? DefaultLayout;
    const layoutProps = Component.layoutProps ?? {};

    return (
        <>
            <DefaultSeo title="SMT" description="SMT Dashboard" />
            <Head>
                <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
                <link rel="manifest" href="/site.webmanifest" />
                <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
                <meta name="msapplication-TileColor" content="#da532c" />
                <meta name="theme-color" content="#ffffff" />
            </Head>
            <ErrorBoundary>
                <FirebaseAppProvider firebaseConfig={firebaseConfig} suspense>
                    <NoSSR>
                        <ChakraProvider>
                            <DialogProvider>
                                <Suspense fallback={<PageSpinner />}>
                                    <ContentWrapper>
                                        <Layout {...layoutProps}>
                                            <ErrorBoundary>
                                                <Component {...pageProps} />
                                            </ErrorBoundary>
                                        </Layout>
                                    </ContentWrapper>
                                </Suspense>
                            </DialogProvider>
                        </ChakraProvider>
                    </NoSSR>
                </FirebaseAppProvider>
            </ErrorBoundary>
        </>
    );
};

export default App;
