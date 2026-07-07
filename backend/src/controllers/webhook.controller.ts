import logger from "../config/logger";
import { Request, Response } from "express";
import { stripeClient } from "../utils/stripe.util";
import { bookingRepository } from "../repositories/booking.repository";
import { auditLogService } from "../services/audit-log.service";
import { notificationService } from "../services/notification.service";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function stripeWebhook(req: Request, res: Response) {
  const signature = req.headers["stripe-signature"] as string;

  let event;
  try {
    event = stripeClient.webhooks.constructEvent(req.body, signature, WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const bookingId = session.metadata?.bookingId;

    if (bookingId && session.payment_intent) {
      const booking = await bookingRepository.markAsPaid(bookingId, session.payment_intent as string);

      await auditLogService.log({
        action: "PAYMENT_RECEIVED",
        targetType: "Booking",
        targetId: bookingId,
        metadata: {
          paymentIntentId: session.payment_intent,
          amount: booking?.packagePrice,
        },
      });

      if (booking) {
        try {
          await notificationService.create({
            recipient: booking.mentor.toString(),
            type: "payment_confirmed",
            title: "Payment received",
            body: `You've been paid for "${booking.packageTitle}"`,
            link: "/mentor/bookings",
            relatedType: "Payment",
            relatedId: bookingId,
          });
        } catch (err) {
          logger.error("Failed to create notification", { err });
        }
      }
    }
  }

  res.json({ received: true });
}