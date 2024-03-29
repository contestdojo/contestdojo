/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/* Copyright (c) 2021 Oliver Ni */

import { Center, ChakraProvider, Spinner } from "@chakra-ui/react";
import "katex/dist/katex.min.css";
import { DefaultSeo } from "next-seo";
import Head from "next/head";
import Router, { useRouter } from "next/router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { Suspense } from "react";
import NoSSR from "react-no-ssr";
import { FirebaseAppProvider, preloadAuth, preloadFirestore, preloadFunctions, useFirebaseApp } from "reactfire";

import DialogProvider from "~/components/contexts/DialogProvider";
import ErrorBoundary from "~/components/ErrorBoundary";
import AdminEventLayout from "~/components/layouts/AdminEventLayout";
import AdminLayout from "~/components/layouts/AdminLayout";
import CoachLayout from "~/components/layouts/CoachLayout";
import EmptyLayout from "~/components/layouts/EmptyLayout";
import StudentEventLayout from "~/components/layouts/StudentEventLayout";
import StudentLayout from "~/components/layouts/StudentLayout";
import theme from "~/helpers/theme";
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

const preloadSDKs = (firebaseApp) => {
  return Promise.all([
    preloadAuth({ firebaseApp }),
    preloadFirestore({ firebaseApp }),
    preloadFunctions({ firebaseApp }),
  ]);
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
    : router.pathname.startsWith("/student/[eventId]") ||
      router.pathname.startsWith("/student/smt21") ||
      router.pathname.startsWith("/student/xQAnkZ7gdhSdhXHNQetN")
    ? StudentEventLayout
    : router.pathname.startsWith("/student")
    ? StudentLayout
    : router.pathname.startsWith("/admin/[entityId]/[eventId]") ||
      router.pathname.startsWith("/admin/[entityId]/smt21") ||
      router.pathname.startsWith("/admin/[entityId]/xQAnkZ7gdhSdhXHNQetN")
    ? AdminEventLayout
    : router.pathname.startsWith("/admin")
    ? AdminLayout
    : EmptyLayout;

  const Layout = Component.layout ?? DefaultLayout;
  const layoutProps = Component.layoutProps ?? {};

  return (
    <>
      <DefaultSeo title="ContestDojo" description="Online math competition platform." />
      <Head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=1" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=1" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=1" />
        <link rel="manifest" href="/site.webmanifest?v=1" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg?v=1" color="#f40808" />
        <link rel="shortcut icon" href="/favicon.ico?v=1" />
        <meta name="msapplication-TileColor" content="#da532c" />
      </Head>
      <ErrorBoundary>
        <FirebaseAppProvider firebaseConfig={firebaseConfig} suspense>
          <NoSSR>
            <ChakraProvider theme={theme}>
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
