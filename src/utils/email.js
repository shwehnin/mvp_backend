const nodemailer = require("nodemailer");

exports.sendMail = async (email, subject, body) => {
    return new Promise((resolve, reject) => {
        const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: subject,
            text: body,
        };
        console.log("Email to:", email);
        console.log("Mail options:", mailOptions);
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Error sending mail", error);
                reject(Error("Error sending gmail"));
            }
            resolve("Password reset OTP sent to your email");
        });
    });
};
