import nodemailer from "nodemailer";
import logger from "../config/logger";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === "465", // true for port 465, false for 587/others
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMail(to: string, subject: string, body: string): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      text: body,
    });
    logger.info("Email sent", { to, subject });
  } catch (err) {
    logger.error("Failed to send email", { to, subject, error: (err as Error).message });
  }
}