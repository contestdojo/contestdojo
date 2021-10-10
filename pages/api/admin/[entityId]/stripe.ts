import { NextApiRequest, NextApiResponse } from "next";
import absoluteUrl from "next-absolute-url";
import { auth, firestore } from "~/helpers/firebase";
import stripe from "~/helpers/stripe";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    const { entityId } = req.query;
    if (typeof entityId !== "string") return res.status(400).end();

    const entityRef = firestore.collection("entities").doc(entityId);
    const entity = await entityRef.get();
    const entityData = entity.data();

    if (!entityData) return res.status(404).end();

    try {
        const { uid } = await auth.verifyIdToken(req.headers.authorization ?? "");
        if (!entityData.admins.some((x: any) => x.id === uid)) return res.status(401).end();
    } catch (e) {
        return res.status(401).end();
    }

    let accountId = entityData.stripeAccountId as string;

    if (!accountId) {
        const account = await stripe.accounts.create({
            type: "standard",
            business_profile: { name: entityData.name as string },
        });
        await entityRef.update({ stripeAccountId: account.id });
        accountId = account.id;
    }

    const { origin } = absoluteUrl(req);

    const link = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${origin}/api/admin/${entityId}/stripe`,
        return_url: `${origin}/admin/${entityId}`,
        type: "account_onboarding",
    });

    res.status(200).send(link);
};

export default handler;
