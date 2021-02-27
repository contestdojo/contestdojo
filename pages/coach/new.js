import { Heading, Stack } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useState } from "react";
import { useFirestore } from "reactfire";
import OrgForm from "~/forms/OrgForm";
import { delay, useUserRef } from "~/helpers/utils";

const NewOrganization = () => {
    const firestore = useFirestore();
    const userRef = useUserRef();
    const router = useRouter();

    // Form
    const [formState, setFormState] = useState({ isLoading: false, error: null });
    const handleSubmit = async ({ name, address, city, state, country, zip }) => {
        setFormState({ isLoading: true, error: null });
        await delay(300);
        try {
            const ref = await firestore.collection("orgs").add({
                name,
                address,
                city,
                state,
                country,
                zip,
                admin: userRef,
            });
            setFormState({ isLoading: false, error: null });
            router.push(`/coach/${ref.id}`);
        } catch (err) {
            setFormState({ isLoading: false, error: err });
        }
    };

    return (
        <Stack spacing={6} m={6} flexShrink={1} flexBasis={600}>
            <Heading>New Organization</Heading>
            <OrgForm onSubmit={handleSubmit} buttonText="Create Organization" confirmOrg {...formState} />
        </Stack>
    );
};

export default NewOrganization;
