import sendgrid from "@sendgrid/mail";
import absoluteUrl from "next-absolute-url";
import { firestore, withFirebaseAuth } from "~/helpers/firebase";
import stripe from "~/helpers/stripe";

sendgrid.setApiKey(process.env.SENDGRID_KEY as string);

const handler = withFirebaseAuth(async (req, res) => {
    if (req.method !== "POST") return res.status(405).end();

    // Validate query & body

    const { orgId, eventId } = req.query;
    if (typeof orgId !== "string") return res.status(400).end();
    if (typeof eventId !== "string") return res.status(400).end();

    const { email, number } = req.body;
    if (typeof email !== "string") return res.status(400).end();
    if (typeof number !== "number") return res.status(400).end();

    // Get connected account

    const eventRef = firestore.collection("events").doc(eventId);
    const event = await eventRef.get();
    const eventData = event.data();
    if (!eventData) return res.status(404).end();

    const entity = await eventData.owner.get();
    const entityData = entity.data();

    if (!entityData) return res.status(404).end();
    if (!entityData.stripeAccountId) return res.status(400).end("The event organizer has not yet configured payments.");

    // Do payment

    const customers = await stripe.customers.list({ email, limit: 1 }, { stripeAccount: entityData.stripeAccountId });
    const customer: any = {};
    if (customers["data"].length === 0) {
        customer["customer_email"] = email;
    } else {
        customer["customer"] = customers["data"][0].id;
    }

    const { origin } = absoluteUrl(req);
    const metadata = { orgId, eventId, numSeats: number };

    const session = await stripe.checkout.sessions.create(
        {
            mode: "payment",
            payment_method_types: ["card"],
            payment_intent_data: { metadata },
            metadata,
            line_items: [
                {
                    name: `Student Seat for ${eventData.name}`,
                    currency: "usd",
                    amount: eventData.costPerStudent * 100,
                    quantity: number,
                },
            ],
            success_url: `${origin}/coach/${orgId}/${eventId}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/coach/${orgId}/${eventId}/teams`,
            allow_promotion_codes: true,
            ...customer,
        },
        { stripeAccount: entityData.stripeAccountId }
    );

    res.status(200).json({ id: session.id });
}, "coach");

export default handler;
