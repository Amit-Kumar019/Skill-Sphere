const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
    let transporter;

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        const smtpPort = parseInt(process.env.SMTP_PORT) || 465;
        const isSecure = smtpPort === 465 || process.env.SMTP_SECURE === "true";

        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: smtpPort,
            secure: isSecure, // true for 465, false for 587
            family: 4, // Force IPv4 resolution to prevent ENETUNREACH on cloud environments like Render
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            connectionTimeout: 10000, // 10 seconds connection timeout
            greetingTimeout: 5000,
            socketTimeout: 10000,
        });
    } else {
        // Fallback: Create an Ethereal account automatically if no SMTP settings are provided
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.log("================ ETHEREAL MAIL DEV CREDS ================");
        console.log("User:", testAccount.user);
        console.log("Pass:", testAccount.pass);
        console.log("========================================================");
    }

    const mailOptions = {
        from: process.env.SMTP_FROM || "Skill Sphere <noreply@skillsphere.com>",
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    try {
        const info = await transporter.sendMail(mailOptions);

        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            console.log(`[SMTP] Email sent successfully to ${options.email}. Message ID: ${info.messageId}`);
        } else {
            console.log("================ ETHEREAL MAIL DEV CREDS ================");
            console.log("Email Sent successfully to:", options.email);
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
            console.log("========================================================");
        }

        return info;
    } catch (error) {
        console.error("[SMTP ERROR] Failed to send email:", error.message || error);
        throw error;
    }
};

module.exports = sendEmail;
