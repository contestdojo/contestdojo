import { Divider, Heading, Stack } from "@chakra-ui/react";
import { useFirestore, useFirestoreDocData } from "reactfire";
import stripe from "~/helpers/stripe";

const format = new Intl.NumberFormat(undefined, {
    currency: "usd",
    style: "currency",
    maximumFractionDigits: 2,
});

const CheckoutSuccess = ({ session }) => {
    const { eventId, orgId } = session.metadata;

    const firestore = useFirestore();

    const eventRef = firestore.collection("events").doc(eventId);
    const { data: event } = useFirestoreDocData(eventRef);

    const orgRef = firestore.collection("orgs").doc(orgId);
    const { data: org } = useFirestoreDocData(orgRef);

    return (
        <Stack spacing={6} flexBasis={600}>
            <Heading>Purchase Success!</Heading>
            <Divider />
            <Stack spacing={4}>
                <p>
                    Your payment of <b>{format.format(session.amount_total / 100)}</b> was successful, and a receipt has
                    been emailed to <b>{session.customer_details.email}</b>.
                </p>
                <p>
                    Your purchased seats have been added to <b>{org.name}</b> for <b>{event.name}</b>.
                </p>
                <p>For any questions or concerns, please contact the event organizer.</p>
            </Stack>
        </Stack>
    );
};

export default CheckoutSuccess;

export const getServerSideProps = async ({ query: { session_id: sessionId } }) => {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return {
        props: {
            session,
        },
    };
};
