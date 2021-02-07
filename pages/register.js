import { Alert, AlertIcon, Button, Heading, Link, Spinner, Stack } from "@chakra-ui/react";
import { yupResolver } from "@hookform/resolvers/yup";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth, useFirestore } from "reactfire";
import * as yup from "yup";
import FormField from "~/components/FormField";
import { delay } from "~/helpers/utils";
import EmptyLayout from "~/layouts/EmptyLayout";

const schema = yup.object().shape({
    fname: yup.string().required().label("First Name"),
    lname: yup.string().required().label("Last Name"),
    email: yup.string().email().required().label("Email Address"),
    password: yup
        .string()
        .required()
        .matches(
            /^.*(?=.{8,})((?=.*[!@#$%^&*()\-_=+{};:,<.>]){1})(?=.*\d)((?=.*[a-z]){1})((?=.*[A-Z]){1}).*$/,
            "Password must contain at least 8 characters, one uppercase, one number and one special case character"
        )
        .label("Password"),
    passwordConfirm: yup
        .string()
        .equals([yup.ref("password")], "Passwords must match")
        .label("Confirm Password"),
});

const RegistrationForm = ({ onSubmit, isLoading, error }) => {
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
                    name="fname"
                    label="First Name"
                    placeholder="Blaise"
                    error={errors.fname}
                    isRequired
                />

                <FormField
                    ref={register}
                    name="lname"
                    label="Last Name"
                    placeholder="Pascal"
                    error={errors.lname}
                    isRequired
                />

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
                    label="Create Password"
                    placeholder="Enter secure password..."
                    error={errors.password}
                    isRequired
                />

                <FormField
                    ref={register}
                    type="password"
                    name="passwordConfirm"
                    label="Confirm Password"
                    placeholder="Re-enter password..."
                    error={errors.passwordConfirm}
                    isRequired
                />

                <Button isLoading={isLoading} type="submit" colorScheme="blue">
                    Register
                </Button>
            </Stack>
        </form>
    );
};

const RegisterPage = () => {
    const auth = useAuth();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const firestore = useFirestore();

    const handleSubmit = async ({ fname, lname, email, password }) => {
        setLoading(true);
        await delay(300);

        try {
            const { user } = await auth.createUserWithEmailAndPassword(email, password);
            await user.updateProfile({ displayName: `${fname} ${lname}` });
            await firestore.collection("users").doc(user.uid).set({
                fname,
                lname,
                email,
                type: "coach",
            });
        } catch (err) {
            setError(err);
        }

        setLoading(false);
    };

    return (
        <Stack spacing={6} m={6} flexShrink={1} flexBasis={400}>
            <Heading textAlign="center">Coach Registration</Heading>
            <RegistrationForm onSubmit={handleSubmit} error={error} isLoading={loading} />
            <NextLink href="/login" passHref>
                <Link>Not a coach, or already have an account? Login here</Link>
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
        return <RegisterPage />;
    } else {
        return <Spinner />;
    }
};

const Register = () => (
    <Suspense fallback={<Spinner />}>
        <Wrapper />
    </Suspense>
);

Register.layout = EmptyLayout;

export default Register;
