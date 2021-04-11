import { Heading, Stack } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { useFirestore } from "reactfire";
import OrgForm from "~/forms/OrgForm";
import { useUserRef } from "~/helpers/utils";
import { useFormState } from "../../helpers/utils";

const NewOrganization = () => {
    const firestore = useFirestore();
    const userRef = useUserRef();
    const router = useRouter();

    // Form
    const [formState, wrapAction] = useFormState();
    const handleSubmit = wrapAction(async ({ name, address, city, state, country, zip }) => {
        const ref = await firestore.collection("orgs").add({
            name,
            address,
            city,
            state,
            country,
            zip,
            admin: userRef,
        });
        router.push(`/coach/${ref.id}`);
    });

    return (
        <Stack spacing={6} flexBasis={600}>
            <Heading>New Organization</Heading>
            <OrgForm onSubmit={handleSubmit} buttonText="Create Organization" confirmOrg {...formState} />
        </Stack>
    );
};

export default NewOrganization;
