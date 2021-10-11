import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2020-08-27" });

export const getStripe = (stripeAccount: string) => {
    return new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2020-08-27", stripeAccount });
};

export default stripe;
