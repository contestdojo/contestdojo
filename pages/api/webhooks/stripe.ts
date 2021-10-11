import { firestore as adminFirestore } from "firebase-admin";
import { NextApiRequest, NextApiResponse } from "next";
import getRawBody from "raw-body";
import Stripe from "stripe";
import { firestore } from "~/helpers/firebase";
import stripe from "~/helpers/stripe";

const processCheckoutSessionCompleted = async (
    req: NextApiRequest,
    res: NextApiResponse,
    session: Stripe.Checkout.Session
) => {
    let { eventId, orgId } = session.metadata as any;
    if (typeof eventId !== "string") return res.status(400).end("Missing event id");
    if (typeof orgId !== "string") return res.status(400).end("Missing org id");

    // Get event

    const numSeats = session.line_items?.data?.[0]?.quantity ?? 10;
    if (!numSeats) return res.status(400).end("Missing num seats");

    const eventOrgRef = firestore.collection("events").doc(eventId).collection("orgs").doc(orgId);
    await eventOrgRef.set({ maxStudents: adminFirestore.FieldValue.increment(numSeats) }, { merge: true });

    res.status(200).end();
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method !== "POST") return res.status(405).end();

    const sig = req.headers["stripe-signature"];
    if (!sig) return res.status(400).end();

    let stripeEvent;
    try {
        const rawBody = await getRawBody(req);
        stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET as string);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${(err as any).message}`);
    }

    switch (stripeEvent.type) {
        case "checkout.session.completed":
            await processCheckoutSessionCompleted(req, res, stripeEvent.data.object as Stripe.Checkout.Session);
        default:
            res.status(204).end();
    }
};

export default handler;

export const config = {
    api: { bodyParser: false },
};
