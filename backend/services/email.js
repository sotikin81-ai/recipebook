// Сервис отправки email
// Использует Resend (рекомендуется) или Nodemailer как fallback
// Настройте одну из опций в переменных окружения Railway

const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.RESEND_API_KEY) {
    // Resend — самый простой вариант, бесплатно 3000 писем/мес
    transporter = nodemailer.createTransport({
      host: "smtp.resend.com",
      port: 465,
      secure: true,
      auth: {
        user: "resend",
        pass: process.env.RESEND_API_KEY,
      },
    });
  } else if (process.env.SMTP_HOST) {
    // Любой SMTP (Gmail, Yandex и т.д.)
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Dev-режим: логируем письма в консоль
    console.warn("⚠️  Email не настроен. Письма выводятся в консоль.");
    transporter = {
      sendMail: async (opts) => {
        console.log("\n📧 EMAIL (dev mode):");
        console.log("  To:", opts.to);
        console.log("  Subject:", opts.subject);
        console.log("  Body:", opts.text || opts.html?.replace(/<[^>]+>/g, ""));
        console.log("");
        return { messageId: "dev-" + Date.now() };
      },
    };
  }
  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const from = process.env.EMAIL_FROM || "РецептБук <noreply@recipebook.app>";
  const t = getTransporter();
  try {
    const result = await t.sendMail({ from, to, subject, html, text });
    console.log(`✉️  Email sent to ${to}: ${result.messageId}`);
    return result;
  } catch (err) {
    console.error("❌ Email send error:", err.message);
    throw err;
  }
}

module.exports = { sendEmail };
