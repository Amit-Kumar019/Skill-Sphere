const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
    let transporter;

    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_PORT === "465",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
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

    const info = await transporter.sendMail(mailOptions);

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log("Email Sent successfully!");
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }

    return info;
};

module.exports = sendEmail;
