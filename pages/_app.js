import { ChakraProvider } from "@chakra-ui/react";
import Router from "next/router";
import NProgress from "nprogress";
import "nprogress/nprogress.css";
import { FirebaseAppProvider } from "reactfire";
import EmptyLayout from "../layouts/EmptyLayout";
import "../styles/main.scss";

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

const App = ({ Component, pageProps }) => {
    const Layout = Component.layout ?? EmptyLayout;
    const layoutProps = Component.layoutProps ?? {};

    return (
        <FirebaseAppProvider firebaseConfig={firebaseConfig} suspense>
            <ChakraProvider>
                <Layout {...layoutProps}>
                    <Component {...pageProps} />
                </Layout>
            </ChakraProvider>
        </FirebaseAppProvider>
    );
};

export default App;
