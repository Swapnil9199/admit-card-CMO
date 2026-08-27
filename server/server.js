import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5001;
const CONFIG_FILE = path.join(__dirname, 'smtp_config.json');

// Enable CORS and JSON parsing for large PDF base64 payloads
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to load SMTP configuration
function loadSmtpConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading smtp_config.json:", err);
  }

  // Fallback to environment variables or defaults
  return {
    adminName: process.env.ADMIN_NAME || "Combine Mentor Official",
    adminEmail: process.env.ADMIN_EMAIL || process.env.SMTP_USER || "admin@combinementor.in",
    host: process.env.SMTP_HOST || "",
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_PORT === '465',
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    provider: "custom"
  };
}

// Helper to save SMTP configuration
function saveSmtpConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Error saving smtp_config.json:", err);
    return false;
  }
}

// Helper to create Nodemailer transporter
async function createTransporter(customConfig = null) {
  const config = customConfig || loadSmtpConfig();

  const user = String(config.user || config.adminEmail || '').trim();
  const pass = String(config.pass || '').replace(/\s+/g, '').trim();
  const host = String(config.host || '').trim();
  const isGmail = host.includes('gmail') || config.provider === 'gmail' || user.endsWith('@gmail.com');

  if ((host || isGmail) && user && pass) {
    if (isGmail) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: user,
          pass: pass
        },
        tls: {
          rejectUnauthorized: false
        }
      });
    }

    return nodemailer.createTransport({
      host: host,
      port: config.port ? parseInt(config.port) : 587,
      secure: config.secure || config.port === 465,
      auth: {
        user: user,
        pass: pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // Fallback to test Ethereal account if no SMTP provided
  try {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } catch (err) {
    console.warn("Using JSON transport fallback", err);
    return nodemailer.createTransport({
      jsonTransport: true
    });
  }
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// GET active SMTP configuration (with password masked for security)
app.get('/api/get-smtp', (req, res) => {
  const config = loadSmtpConfig();
  res.json({
    success: true,
    config: {
      ...config,
      pass: config.pass ? '••••••••' : '',
      hasPass: Boolean(config.pass)
    }
  });
});

// POST save Admin SMTP configuration
app.post('/api/save-smtp', (req, res) => {
  const newConfig = req.body;
  const currentConfig = loadSmtpConfig();

  // If password was masked and unchanged, retain existing password
  const passToSave = newConfig.pass === '••••••••' ? currentConfig.pass : newConfig.pass;

  const configToSave = {
    adminName: newConfig.adminName || "Combine Mentor Official",
    adminEmail: newConfig.adminEmail || "",
    host: newConfig.host || "",
    port: parseInt(newConfig.port) || 587,
    secure: Boolean(newConfig.secure || parseInt(newConfig.port) === 465),
    user: newConfig.user || "",
    pass: passToSave || "",
    provider: newConfig.provider || "custom"
  };

  const saved = saveSmtpConfig(configToSave);
  if (saved) {
    res.json({ success: true, message: "Admin SMTP configuration saved successfully!" });
  } else {
    res.status(500).json({ success: false, message: "Failed to write SMTP configuration file." });
  }
});

// POST test SMTP connection
app.post('/api/test-smtp', async (req, res) => {
  try {
    const newConfig = req.body;
    const currentConfig = loadSmtpConfig();
    const passToTest = newConfig.pass === '••••••••' ? currentConfig.pass : newConfig.pass;

    const configToTest = {
      ...newConfig,
      pass: passToTest
    };

    const transporter = await createTransporter(configToTest);
    
    // Verify connection configuration
    await transporter.verify();

    // Optionally send a test email to admin
    if (configToTest.adminEmail) {
      await transporter.sendMail({
        from: `"${configToTest.adminName || 'Admin'}" <${configToTest.adminEmail}>`,
        to: configToTest.adminEmail,
        subject: "SMTP Configuration Verified - Combine Mentor Official",
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0284c7;">✓ SMTP Connection Verified Successfully</h2>
            <p>Your Admin SMTP configuration is working properly and is ready to send admit cards to candidates.</p>
            <p style="font-size: 12px; color: #64748b;">Timestamp: ${new Date().toLocaleString()}</p>
          </div>
        `
      });
    }

    res.json({
      success: true,
      message: `SMTP connection established successfully! Verified sender: ${configToTest.adminEmail || configToTest.user}`
    });
  } catch (error) {
    console.error("SMTP Test Error:", error);
    let userFriendlyMsg = error.message || 'Please check host, port, username, and password.';
    if (error.message?.includes('535') || error.message?.includes('BadCredentials') || error.message?.includes('Username and Password not accepted')) {
      userFriendlyMsg = 'Google authentication rejected: Google requires a 16-character App Password generated at myaccount.google.com/apppasswords rather than your normal password. Also ensure your sender Gmail matches the Google account where the App Password was created.';
    }
    res.status(400).json({
      success: false,
      message: `SMTP connection failed: ${userFriendlyMsg}`
    });
  }
});

// POST Send Admit Card PDF via Email from Admin to Candidate
app.post('/api/send-admit-card-email', async (req, res) => {
  const recipientEmail = req.body.recipientEmail || req.body.email;
  const recipientName = req.body.recipientName || req.body.candidateName || req.body.name || "Candidate";
  const seatNo = req.body.seatNo || req.body.seatNumber || "N/A";
  const examTitle = req.body.examTitle || "MPSC Combine Examination 2026";
  const examCentre = req.body.examCentre || "Assigned Examination Centre";
  const rawPdf = req.body.pdfBase64;
  const pdfBase64 = typeof rawPdf === 'object' && rawPdf ? rawPdf.pdfBase64 : rawPdf;
  const filename = req.body.filename || `Admit_Card_${String(recipientName).replace(/\s+/g, '_')}.pdf`;

  if (!recipientEmail) {
    return res.status(400).json({
      success: false,
      message: "Admit card generated successfully, but we could not send it to the email address. Please try again.",
      error: "Recipient email is missing."
    });
  }

  if (!pdfBase64) {
    return res.status(400).json({
      success: false,
      message: "Admit card generated successfully, but we could not send it to the email address. Please try again.",
      error: "PDF attachment data is missing."
    });
  }

  try {
    const smtpConfig = loadSmtpConfig();
    const transporter = await createTransporter(smtpConfig);

    const safeName = recipientName || "Candidate";
    const safeExam = examTitle || "MPSC Combine Examination 2026";
    const safeSeat = seatNo || "N/A";
    const safeCentre = examCentre || "Assigned Examination Centre";

    // Format sender as Admin's Name <admin@email.com>
    const adminSenderName = smtpConfig.adminName || "Combine Mentor Official";
    const adminSenderEmail = smtpConfig.adminEmail || smtpConfig.user || "admin@combinementor.in";
    const fromAddress = `"${adminSenderName}" <${adminSenderEmail}>`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
          .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
          .header { background: #0f172a; color: #ffffff; padding: 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 22px; letter-spacing: 1px; }
          .header p { margin: 6px 0 0; font-size: 13px; color: #94a3b8; }
          .content { padding: 24px; }
          .greeting { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #0f172a; }
          .details-box { background: #f1f5f9; border-left: 4px solid #0284c7; padding: 16px; border-radius: 6px; margin-bottom: 20px; }
          .details-box table { width: 100%; border-collapse: collapse; font-size: 14px; }
          .details-box td { padding: 6px 0; }
          .label { font-weight: 600; color: #475569; width: 140px; }
          .value { color: #0f172a; font-weight: 700; }
          .instructions { background: #fefce8; border: 1px solid #fef08a; padding: 14px; border-radius: 6px; font-size: 13px; color: #713f12; margin-bottom: 20px; }
          .footer { padding: 16px 24px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1>COMBINE MENTOR OFFICIAL</h1>
            <p>Official Hall Ticket / Admit Card Notification</p>
          </div>
          <div class="content">
            <div class="greeting">Dear ${safeName},</div>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
              Your Admit Card for <strong>${safeExam}</strong> has been generated successfully. Please find your official 2-page Hall Ticket attached with this email.
            </p>
            
            <div class="details-box">
              <table>
                <tr>
                  <td class="label">Candidate Name:</td>
                  <td class="value">${safeName}</td>
                </tr>
                <tr>
                  <td class="label">Seat Number:</td>
                  <td class="value" style="color: #0284c7; font-family: monospace; font-size: 15px;">${safeSeat}</td>
                </tr>
                <tr>
                  <td class="label">Exam Title:</td>
                  <td class="value">${safeExam}</td>
                </tr>
                <tr>
                  <td class="label">Exam Centre:</td>
                  <td class="value">${safeCentre}</td>
                </tr>
              </table>
            </div>

            <div class="instructions">
              <strong>Important Exam Day Instructions:</strong>
              <ul style="margin: 6px 0 0; padding-left: 20px;">
                <li>Please take a clear printout (A4 size) of the attached Admit Card.</li>
                <li>Ensure the unique QR code is clearly visible and not smudged.</li>
                <li>Bring a valid Photo Identity Proof along with your Admit Card to the exam centre.</li>
              </ul>
            </div>

            <p style="font-size: 13px; color: #64748b;">
              Sent by: <strong>${adminSenderName}</strong> (${adminSenderEmail})<br/>
              If you have any queries, please visit <a href="https://combinementor.in" style="color: #0284c7;">combinementor.in</a> or reach out on Telegram <strong>@combinementor</strong>.
            </p>
          </div>
          <div class="footer">
            &copy; 2026 Combine Mentor Official, Pune. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;

    const cleanFilename = filename || `Admit_Card_${safeName.replace(/\s+/g, '_')}.pdf`;

    const mailOptions = {
      from: fromAddress,
      to: recipientEmail,
      subject: `Hall Ticket / Admit Card: ${safeExam} - ${safeName}`,
      html: htmlContent,
      attachments: [
        {
          filename: cleanFilename,
          content: Buffer.from(pdfBase64, 'base64'),
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl(info);

    console.log(`[Email Sent] From: ${fromAddress} -> To: ${recipientEmail} | Candidate: ${safeName} | ID: ${info.messageId}`);
    if (previewUrl) {
      console.log(`[Ethereal Preview URL]: ${previewUrl}`);
    }

    return res.status(200).json({
      success: true,
      message: "Admit card generated successfully and sent to your email.",
      messageId: info.messageId,
      previewUrl: previewUrl || null
    });
  } catch (error) {
    console.error("[Email Error]:", error);
    return res.status(200).json({
      success: false,
      message: "Admit card generated successfully, but we could not send it to the email address. Please try again.",
      error: error.message || "Failed to send email."
    });
  }
});

// Serve production static assets from Vite build (for Render deployment)
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Email Service Backend running on port ${PORT}`);
});
