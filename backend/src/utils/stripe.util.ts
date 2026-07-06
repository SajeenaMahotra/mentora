import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string;

export const stripeClient = new Stripe(STRIPE_SECRET_KEY);