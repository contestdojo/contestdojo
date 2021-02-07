import { Alert, AlertIcon, Button, Heading, Link, Spinner, Stack } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "reactfire";
import * as yup from "yup";
import FormField from "~/components/FormField";
import { delay } from "~/helpers/utils";
import EmptyLayout from "~/layouts/EmptyLayout";

const schema = yup.object().shape({
    email: yup.string().email().required().label("Email Address"),
    password: yup.string().required().label("Password"),
});

const LoginForm = ({ onSubmit, isLoading, error }) => {
    const { register, handleSubmit, errors } = useForm({
        mode: "onTouched",
        resolver: yupResolver(schema),
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={4}>
                {error && (
                    <Alert status="error">
                        <AlertIcon />
                        {error.message}
                    </Alert>
                )}

                <FormField
                    ref={register}
                    type="email"
                    name="email"
                    label="Email Address"
                    placeholder="blaise.pascal@gmail.com"
                    error={errors.email}
                    isRequired
                />

                <FormField
                    ref={register}
                    type="password"
                    name="password"
                    label="Password"
                    placeholder="Enter password..."
                    error={errors.password}
                    isRequired
                />

                <Button isLoading={isLoading} type="submit" colorScheme="blue">
                    Login
                </Button>
            </Stack>
        </form>
    );
};

const LoginPage = () => {
    const auth = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async ({ email, password }) => {
        setLoading(true);
        await delay(300);
        try {
            await auth.signInWithEmailAndPassword(email, password);
        } catch (err) {
            setError(err);
        }
        setLoading(false);
    };

    return (
        <Stack spacing={6} m={6} flexShrink={1} flexBasis={400}>
            <Heading textAlign="center">Login</Heading>
            <LoginForm onSubmit={handleSubmit} error={error} isLoading={loading} />
            <NextLink href="/register" passHref>
                <Link>New organization? Register here</Link>
            </NextLink>
        </Stack>
    );
};

const Wrapper = () => {
    const auth = useAuth();
    const router = useRouter();

    const [ready, setReady] = useState(false);

    useEffect(() => {
        auth.onAuthStateChanged(user => {
            if (user) {
                router.replace("/");
            } else {
                setReady(true);
            }
        });
    }, []);

    if (ready) {
        return <LoginPage />;
    } else {
        return <Spinner />;
    }
};

const Login = () => (
    <Suspense fallback={<Spinner />}>
        <Wrapper />
    </Suspense>
);

export default Login;
