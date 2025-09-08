import nodemailer from "nodemailer";

// Email sending utility using Gmail SMTP with App Password
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    // Validate required environment variables
    const requiredEnvVars = ["GMAIL_APP_PASSWORD", "EMAIL_SENDER"];
    const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

    if (missingEnvVars.length > 0) {
      console.error(`❌ Missing environment variables: ${missingEnvVars.join(", ")}`);
      throw new Error("Gmail SMTP configuration incomplete");
    }

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    // Send email
    await transporter.sendMail({
      from: `"2K Lobby" <${process.env.EMAIL_SENDER}>`,
      to: to, // Use the 'to' parameter passed
      subject,
      text,   // Include text as fallback
      html,   // Include HTML content
    });

    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error("❌ Email sending error:", error.message);
    throw error;
  }
};

export default sendEmail;