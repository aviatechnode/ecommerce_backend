import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send an email
 * @param to Recipient email
 * @param subject Email subject
 * @param html HTML content of the email
 */
export const sendEmail = async (to: string, subject: string, html: string) => {
  await transporter.sendMail({
    from: `"MOgrace Autoparts" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};