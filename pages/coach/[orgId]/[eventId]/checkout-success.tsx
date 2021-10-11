import { Divider, Heading, Stack } from "@chakra-ui/react";
import { GetServerSideProps } from "next";
import { useFirestore, useFirestoreDocData } from "reactfire";
import Stripe from "stripe";
import { firestore } from "~/helpers/firebase";
import stripe from "~/helpers/stripe";

const format = new Intl.NumberFormat(undefined, {
    currency: "usd",
    style: "currency",
    maximumFractionDigits: 2,
});

type CheckoutSuccessProps = {
    session: Stripe.Checkout.Session;
};

const CheckoutSuccess = ({ session }: CheckoutSuccessProps) => {
    const { eventId, orgId } = session.metadata as any;

    const firestore = useFirestore();

    const eventRef = firestore.collection("events").doc(eventId);
    const { data: event } = useFirestoreDocData<any>(eventRef);

    const orgRef = firestore.collection("orgs").doc(orgId);
    const { data: org } = useFirestoreDocData<any>(orgRef);

    return (
        <Stack spacing={6} flexBasis={600}>
            <Heading>Purchase Success!</Heading>
            <Divider />
            <Stack spacing={4}>
                <p>
                    Your payment of <b>{format.format((session.amount_total ?? 0) / 100)}</b> was successful, and a
                    receipt has been emailed to <b>{session.customer_details?.email}</b>.
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

type CheckoutSuccessParams = {
    orgId: string;
    eventId: string;
};

export const getServerSideProps: GetServerSideProps<CheckoutSuccessProps, CheckoutSuccessParams> = async ({
    params,
    query: { session_id },
}) => {
    if (!params) return { notFound: true };
    if (typeof session_id !== "string") return { notFound: true };

    const { eventId, orgId } = params;

    const eventRef = firestore.collection("events").doc(eventId);
    const event = await eventRef.get();
    const eventData = event.data();

    if (!eventData) return { notFound: true };

    const entity = await eventData.owner.get();
    const entityData = entity.data();

    let session;
    try {
        session = await stripe.checkout.sessions.retrieve(session_id.toString(), {
            stripeAccount: entityData.stripeAccountId,
        });
    } catch (e) {
        return { notFound: true };
    }

    return {
        props: {
            session,
        },
    };
};
