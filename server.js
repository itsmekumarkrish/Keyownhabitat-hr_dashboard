const express = require('express');
const cors = require('cors');
const multer = require('multer');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Define Database Schema
const campaignSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    name: String,
    email: String,
    role: String,
    status: String
});
const CampaignLog = mongoose.model('CampaignLog', campaignSchema);
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Bypass-Tunnel-Reminder']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Clean route for the HR Dashboard
app.get('/hrdashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'hrdashboard', 'index.html'));
});

// Configure Multer for resume + photo uploads
const upload = multer({ dest: 'uploads/' });

// Email transporter setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

// ─── Job Descriptions (inline text for candidate email) ────────────────────
const roleJDs = {
    'Relationship Manager (RM)': {
        overview: 'Build relationships with prospective customers, understand their housing goals, conduct the initial financial assessment, and guide them through the homeownership journey.',
        responsibilities: [
            'Handle inbound and outbound customer enquiries.',
            'Conduct customer profiling and financial assessment.',
            'Understand income, rent, EMIs, liabilities and eligibility.',
            'Explain KeyOwn Habitat services.',
            'Schedule consultations and property visits.',
            'Maintain CRM records.',
            'Coordinate with internal teams until closure.',
            'Build long-term customer relationships.'
        ],
        requirements: [
            'Excellent communication and customer handling skills.',
            'Sales orientation with CRM knowledge.',
            'Negotiation skills.'
        ]
    },
    'Business Development Manager': {
        overview: 'The BDM drives the growth of KeyOwn Habitat by establishing strategic partnerships and expanding our market footprint.',
        responsibilities: [
            'Identify and pursue new business opportunities, channel partners, and B2B collaborations.',
            'Manage the end-to-end sales pipeline, from lead generation to deal closure.',
            'Analyze market trends and competitor strategies to position HOAS effectively.',
            'Pitch the KeyOwn Habitat value proposition to builders and developers.'
        ],
        requirements: [
            '1–3 years of experience in Business Development, preferably in PropTech or FinTech.',
            'Strong presentation skills and the ability to influence key stakeholders.',
            'Goal-oriented, aggressive sales approach with a track record of meeting targets.'
        ]
    },
    'Field Executive': {
        overview: 'Field Executives are our on-ground operators ensuring property verifications and client site visits happen flawlessly.',
        responsibilities: [
            'Travel to various property sites across the city for inspections and client meetings.',
            'Assist Relationship Managers in conducting physical property showcases.',
            'Collect and verify physical KYC and property documents from clients and builders.',
            'Report daily field activities and property statuses to the operations team.'
        ],
        requirements: [
            '0–2 years of field experience (freshers welcome).',
            'Must possess a valid two-wheeler driving license and own a two-wheeler.',
            'Willingness to travel extensively within the city limits daily.'
        ]
    },
    'Manager': {
        overview: 'The Manager oversees daily departmental workflows, ensuring operational excellence and strategic alignment.',
        responsibilities: [
            'Lead, supervise, and mentor cross-functional teams to achieve business objectives.',
            'Optimize daily operations and streamline processes for maximum efficiency.',
            'Monitor performance metrics and generate actionable reports for upper management.',
            'Resolve complex client or operational escalations efficiently.'
        ],
        requirements: [
            '1–6 years of managerial experience (MBA highly preferred).',
            'Strong leadership capabilities and conflict resolution skills.',
            'Strategic thinker with a data-driven approach to problem-solving.'
        ]
    },
    'Team Leader': {
        overview: 'As a Team Leader, you will manage a squad of executives, ensuring they hit their targets and maintain high morale.',
        responsibilities: [
            'Mentor, train, and guide a team of Relationship Managers and Field Executives.',
            'Assign daily tasks, monitor KPIs, and ensure monthly team targets are achieved.',
            'Conduct regular feedback sessions and performance appraisals.',
            'Act as the first point of escalation for client issues faced by the team.'
        ],
        requirements: [
            '2–5 years of experience specifically in Team Handling and Sales/Operations.',
            'Ability to motivate a team and drive results under pressure.',
            'Excellent communication and organizational skills.'
        ]
    },
    'Operations Executive': {
        overview: 'The backbone of our platform, ensuring that all backend processes and documentation move swiftly and accurately.',
        responsibilities: [
            'Handle the backend processing of client applications and property agreements.',
            'Maintain accurate CRM records and ensure data hygiene.',
            'Liaise with the finance and legal teams to push files through to completion.',
            'Identify bottlenecks in current processes and suggest operational improvements.'
        ],
        requirements: [
            '1–3 years of experience in back-office operations or administration.',
            'High attention to detail and proficiency in MS Excel / CRM software.',
            'Ability to multitask and handle high volumes of documentation.'
        ]
    },
    'HR Executive': {
        overview: 'You will shape the culture of KeyOwn Habitat by recruiting top talent and ensuring a phenomenal employee experience.',
        responsibilities: [
            'Manage end-to-end recruitment: sourcing, screening, interviewing, and offering.',
            'Facilitate smooth employee onboarding and orientation programs.',
            'Plan and execute employee engagement and culture-building initiatives.',
            'Maintain HR records, manage leaves, and assist in payroll processing.'
        ],
        requirements: [
            '1–4 years of experience in Human Resources (Startup experience is a plus).',
            'Strong empathy, interpersonal skills, and understanding of HR compliance.',
            'Ability to build a positive and inclusive workplace culture.'
        ]
    },
    'Marketing Specialist': {
        overview: 'Drive brand awareness and client acquisition through creative, high-impact digital marketing campaigns.',
        responsibilities: [
            "Manage KeyOwn Habitat's presence across all social media channels (Instagram, LinkedIn, Facebook).",
            'Design and execute digital ad campaigns to drive high-quality lead generation.',
            'Create compelling content (blogs, ad copy, newsletters) focused on rent-to-own benefits.',
            'Track marketing ROI, analyze campaign metrics, and optimize spend.'
        ],
        requirements: [
            '2–4 years of experience in Digital Marketing or Performance Marketing.',
            'Proficiency in Meta Ads, Google Ads, and basic design tools (Canva/Figma).',
            'Creative mindset with strong copywriting skills.'
        ]
    },
    'Real Estate Advisor': {
        overview: "Provide expert consultation to our clients, helping them select the perfect property that aligns with their financial goals.",
        responsibilities: [
            "Conduct in-depth consultations to understand clients' homeownership aspirations.",
            'Assist clients in property selection from our verified inventory.',
            'Perform local market analysis to advise clients on property appreciation and investment value.',
            'Guide clients through the financial nuances of transitioning from rent to EMI.'
        ],
        requirements: [
            '2–5 years of experience in Real Estate Advisory or Property Consulting.',
            'Deep understanding of the local real estate market and pricing trends.',
            'Trustworthy, professional demeanor with excellent advisory skills.'
        ]
    },
    'Customer Success Manager': {
        overview: 'Ensure every client has a flawless journey from the moment they sign their lease to the day they receive their property deed.',
        responsibilities: [
            'Oversee the complete tenant onboarding process post-agreement.',
            'Act as a dedicated concierge, addressing client queries and concerns proactively.',
            'Ensure timely rent/EMI collections and manage payment schedules.',
            'Drive long-term customer satisfaction, retention, and referral programs.'
        ],
        requirements: [
            '3–6 years of experience in Customer Success, Account Management, or Client Servicing.',
            'High emotional intelligence, patience, and problem-solving abilities.',
            'Ability to handle high-value clients and complex escalations.'
        ]
    },
    'Finance Executive': {
        overview: 'Manage the financial backbone of the HOAS model, tracking the complex flow of rent, equity, and asset investments.',
        responsibilities: [
            'Handle rent-to-own financial modeling and client equity calculations.',
            'Track incoming payments, manage invoices, and handle general accounting tasks.',
            'Perform monthly ledger reconciliation and audit preparations.',
            'Assist in processing developer payouts and banking compliance.'
        ],
        requirements: [
            '2–5 years of experience in Finance, Accounting, or FinTech operations.',
            'Strong proficiency in Tally/QuickBooks and advanced Excel modeling.',
            'Keen eye for detail and uncompromising ethics regarding financial data.'
        ]
    },
    'Legal & Compliance Officer': {
        overview: 'Protect the company and our clients by ensuring every property transaction and agreement is legally sound and compliant.',
        responsibilities: [
            'Conduct rigorous legal verification and due diligence of all properties.',
            'Draft, review, and finalize Lease-to-Own agreements, NDAs, and developer contracts.',
            'Ensure strict regulatory compliance with RERA and local real estate laws.',
            'Handle dispute resolution and provide legal counsel to the management team.'
        ],
        requirements: [
            '3–7 years of experience as Legal Counsel, specifically in Real Estate or Property Law.',
            'LLB degree and active bar council registration.',
            'Exceptional drafting skills and deep knowledge of RERA and property registration.'
        ]
    }
};

function buildJDHtml(role) {
    const jd = roleJDs[role];
    if (!jd) return '<p style="color:#555;">Please contact us for the full job description.</p>';
    return `
      <p style="font-size:14px;color:#444;line-height:1.7;margin:0 0 12px;"><strong>Role Overview:</strong> ${jd.overview}</p>
      <p style="font-size:13px;font-weight:700;color:#006241;margin:16px 0 6px;">Key Responsibilities</p>
      <ul style="margin:0;padding-left:18px;">
        ${jd.responsibilities.map(r => `<li style="font-size:13px;color:#444;line-height:1.7;margin-bottom:4px;">${r}</li>`).join('')}
      </ul>
      <p style="font-size:13px;font-weight:700;color:#006241;margin:16px 0 6px;">Requirements</p>
      <ul style="margin:0;padding-left:18px;">
        ${jd.requirements.map(r => `<li style="font-size:13px;color:#444;line-height:1.7;margin-bottom:4px;">${r}</li>`).join('')}
      </ul>
    `;
}

// ─── Application Submission Endpoint ────────────────────────────────────────
app.post('/api/apply', upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'photo', maxCount: 1 }
]), async (req, res) => {
    try {
        const { firstName, lastName, email, phone, location, intro, role } = req.body;
        const fullName = `${firstName} ${lastName}`;
        const resumeFile = req.files['resume'] ? req.files['resume'][0] : null;
        const photoFile  = req.files['photo']  ? req.files['photo'][0]  : null;

        if (!resumeFile) return res.status(400).json({ error: 'Resume is required.' });
        if (!firstName || !lastName || !email || !phone || !location || !role) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        if (firstName.trim().length < 3 || lastName.trim().length < 3) {
            return res.status(400).json({ error: 'Both First Name and Last Name must be at least 3 characters.' });
        }
        if (!/^[0-9]{10}$/.test(phone)) {
            return res.status(400).json({ error: 'Please provide a valid 10-digit mobile number.' });
        }

        console.log(`📩 New application from ${fullName} for ${role}`);

        // ── 1. COMPANY / HR EMAIL ──────────────────────────────────────────
        const hrAttachments = [
            { filename: resumeFile.originalname, path: resumeFile.path }
        ];
        if (photoFile) {
            hrAttachments.push({ filename: photoFile.originalname, path: photoFile.path });
        }

        const hrHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Arial', sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .wrapper { max-width: 620px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #006241, #00a86b); padding: 32px 36px; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 10px; }
    .body { padding: 32px 36px; }
    .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #006241; margin: 24px 0 12px; }
    .detail-table { width: 100%; border-collapse: collapse; }
    .detail-table td { padding: 10px 14px; font-size: 14px; }
    .detail-table td:first-child { font-weight: 600; color: #555; width: 140px; background: #f9f9f9; border-radius: 6px 0 0 6px; }
    .detail-table td:last-child { color: #222; }
    .detail-table tr { border-bottom: 1px solid #f0f0f0; }
    .intro-box { background: #f0faf5; border-left: 4px solid #006241; border-radius: 0 8px 8px 0; padding: 14px 18px; font-size: 14px; color: #333; line-height: 1.6; margin-top: 8px; }
    .footer { background: #f9f9f9; padding: 20px 36px; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center; }
    .footer a { color: #006241; text-decoration: none; }
    .action-btn { display: inline-block; background: #006241; color: #fff !important; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>📋 New Job Application Received</h1>
      <p>A candidate has submitted their application via the KeyOwn Habitat Careers portal.</p>
      <span class="badge">🎯 ${role}</span>
    </div>
    <div class="body">
      <div class="section-title">Candidate Details</div>
      <table class="detail-table">
        <tr><td>Full Name</td><td>${fullName}</td></tr>
        <tr><td>Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
        <tr><td>Mobile</td><td>${phone}</td></tr>
        <tr><td>Location</td><td>${location}</td></tr>
        <tr><td>Role Applied</td><td><strong>${role}</strong></td></tr>
      </table>

      ${intro ? `
      <div class="section-title">Candidate Introduction</div>
      <div class="intro-box">${intro}</div>
      ` : ''}

      <div class="section-title">Attachments</div>
      <p style="font-size:14px; color:#555; margin:0;">
        📄 <strong>Resume:</strong> ${resumeFile.originalname}<br>
        ${photoFile ? `🖼️ <strong>Photo:</strong> ${photoFile.originalname}` : ''}
      </p>
      <p style="font-size:13px; color:#888; margin-top:10px;">Please find the attached resume${photoFile ? ' and photo' : ''} for your review.</p>
    </div>
    <div class="footer">
      This email was automatically generated by the KeyOwn Habitat Careers Portal.<br>
      <a href="mailto:hr@keyownhabitat.com">hr@keyownhabitat.com</a> | <a href="https://www.keyownhabitat.com">www.keyownhabitat.com</a>
    </div>
  </div>
</body>
</html>`;

        await transporter.sendMail({
            from: `"KeyOwn Habitat Careers" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER,
            subject: `🆕 New Application: ${fullName} — ${role}`,
            html: hrHTML,
            attachments: hrAttachments
        });

        // ── 2. CANDIDATE CONFIRMATION EMAIL ───────────────────────────────
        const candidateHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Arial', sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .wrapper { max-width: 620px; margin: 30px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #006241, #00a86b); padding: 36px; text-align: center; }
    .header img { width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; padding: 12px; }
    .header h1 { color: #ffffff; margin: 16px 0 6px; font-size: 24px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.9); margin: 0; font-size: 15px; }
    .body { padding: 36px; }
    .greeting { font-size: 18px; font-weight: 600; color: #222; margin-bottom: 12px; }
    .text { font-size: 14px; color: #555; line-height: 1.8; margin-bottom: 16px; }
    .highlight-box { background: linear-gradient(135deg, #f0faf5, #e8f5ef); border-radius: 12px; padding: 20px 24px; margin: 24px 0; }
    .highlight-box h3 { color: #006241; margin: 0 0 12px; font-size: 15px; }
    .steps-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .steps-table td { padding-bottom: 14px; vertical-align: top; }
    .step-num-cell { width: 28px; padding-right: 12px; }
    .step-num { background: #006241; color: #fff; border-radius: 50%; width: 24px; height: 24px; display: inline-block; text-align: center; line-height: 24px; font-size: 12px; font-weight: bold; }
    .step-text { font-size: 13px; color: #444; line-height: 1.6; margin: 0; padding-top: 2px; }
    .role-badge { display: inline-block; background: #006241; color: #fff; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; margin: 8px 0; }
    .docs-section { background: #fff8f0; border-radius: 12px; padding: 20px 24px; margin: 20px 0; border: 1px solid #ffe0b2; }
    .docs-section h3 { color: #e65100; margin: 0 0 10px; font-size: 14px; }
    .doc-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #555; margin: 6px 0; }
    .divider { border: none; border-top: 1px solid #eee; margin: 28px 0; }
    .contact-info { text-align: center; }
    .contact-info p { font-size: 13px; color: #888; margin: 4px 0; }
    .contact-info a { color: #006241; text-decoration: none; font-weight: 500; }
    .footer { background: #f9f9f9; padding: 20px 36px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #aaa; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🎉 Application Received!</h1>
      <p>Thank you for applying to KeyOwn Habitat</p>
    </div>
    <div class="body">
      <div class="greeting">Dear ${firstName},</div>
      <p class="text">
        We are thrilled to have received your application! Your profile has been submitted successfully for the following position:
      </p>
      <div style="text-align:center; margin: 16px 0;">
        <span class="role-badge">📌 ${role}</span>
      </div>
      <p class="text">
        Our HR team will carefully review your application and be in touch with you shortly.
      </p>

      <div class="highlight-box">
        <h3>📋 What Happens Next?</h3>
        <table class="steps-table">
          <tr>
            <td class="step-num-cell"><div class="step-num">1</div></td>
            <td><p class="step-text"><strong>Application Review</strong> — Our HR team will carefully review your resume and profile.</p></td>
          </tr>
          <tr>
            <td class="step-num-cell"><div class="step-num">2</div></td>
            <td><p class="step-text"><strong>Initial Screening Call</strong> — If shortlisted, you will receive a call for a brief introductory conversation.</p></td>
          </tr>
          <tr>
            <td class="step-num-cell"><div class="step-num">3</div></td>
            <td><p class="step-text"><strong>Interview Round</strong> — Attend an in-person or virtual interview with our team leads.</p></td>
          </tr>
          <tr>
            <td class="step-num-cell"><div class="step-num">4</div></td>
            <td><p class="step-text"><strong>Offer &amp; Onboarding</strong> — Selected candidates will receive an official offer letter and be onboarded into the KeyOwn Habitat family!</p></td>
          </tr>
        </table>
      </div>

      <p class="text">
        We have included the <strong>Job Description</strong> for the <strong>${role}</strong> role below for your reference. Please go through it carefully before your interview.
      </p>

      <div style="background:#f8f9fa;border-radius:10px;padding:20px 24px;margin:20px 0;border:1px solid #e0e0e0;">
        <p style="font-size:13px;font-weight:700;color:#006241;text-transform:uppercase;letter-spacing:1px;margin:0 0 14px;">📋 Job Description — ${role}</p>
        ${buildJDHtml(role)}
      </div>

      <p class="text">
        We look forward to potentially having you as part of our mission to transition tenants into homeowners across India. If you have any questions, please don't hesitate to reach out.
      </p>

      <hr class="divider">
      <div class="contact-info">
        <p><strong>KeyOwn Habitat HR Team</strong></p>
        <p>📧 <a href="mailto:hr@keyownhabitat.com">hr@keyownhabitat.com</a></p>
        <p>🌐 <a href="https://www.keyownhabitat.com">www.keyownhabitat.com</a></p>
        <p>📞 +91 98865 35949</p>
      </div>
    </div>
    <div class="footer">
      © 2025 KeyOwn Habitat. All rights reserved.
    </div>
  </div>
</body>
</html>`;

        // 1. Send beautifully formatted email to the CANDIDATE
        await transporter.sendMail({
            from: `"KeyOwn Habitat HR" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: `✅ Application Received — ${role} | KeyOwn Habitat`,
            html: candidateHTML
        });


        // Clean up uploaded temp files
        if (resumeFile) fs.unlink(resumeFile.path, () => {});
        if (photoFile)  fs.unlink(photoFile.path,  () => {});

        res.json({ success: true, message: 'Application submitted! Please check your email for confirmation.' });

    } catch (error) {
        console.error('Application Error:', error);
        res.status(500).json({ error: 'Failed to process application. Please try again.' });
    }
});

// ─── Assessment Form Endpoint (Homepage) ──────────────────────────────────
app.post('/api/assessment', upload.none(), async (req, res) => {
    try {
        const { name, email, phone, city } = req.body;

        if (!name || !email || !phone || !city) {
            return res.status(400).json({ error: 'Please fill out all required fields.' });
        }

        // 1. Send Alert Email to KeyOwn Team
        const teamHTML = `
            <h2>🚨 New Free Assessment Lead!</h2>
            <p>A new customer has requested a Home Ownership Assessment.</p>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Current City:</strong> ${city}</p>
            <br>
            <p>Please assign an advisor to call this lead ASAP.</p>
        `;

        await transporter.sendMail({
            from: `"KeyOwn AutoPilot" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER, // Send to internal team
            subject: `🚨 NEW LEAD: ${name} from ${city}`,
            html: teamHTML
        });

        // 2. Send Welcome Email to Customer
        const customerHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 30px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
    <div style="background: #006241; padding: 30px; text-align: center; color: #fff;">
      <h1 style="margin: 0; font-size: 24px;">Welcome to KeyOwn Habitat</h1>
    </div>
    <div style="padding: 30px;">
      <p style="font-size: 16px; color: #333;">Hi <strong>${name}</strong>,</p>
      <p style="font-size: 16px; color: #555; line-height: 1.6;">Thank you for requesting your Free Home Ownership Assessment! We have received your details.</p>
      <p style="font-size: 16px; color: #555; line-height: 1.6;">Our algorithm is currently generating your 120-month transition roadmap. A certified HOAS advisor will call you shortly at <strong>${phone}</strong> to walk you through your Equity Match Calculation.</p>
      <div style="background: #f8f9fa; border-left: 4px solid #00a86b; padding: 15px; margin: 25px 0;">
        <p style="margin: 0; font-size: 14px; color: #333;"><strong>Next Step:</strong> Please keep an eye out for a call from our Bangalore headquarters.</p>
      </div>
      <p style="font-size: 16px; color: #555;">Best Regards,<br>The KeyOwn Habitat Team</p>
    </div>
  </div>
</body>
</html>`;

        await transporter.sendMail({
            from: `"KeyOwn Habitat" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: `Your Free Assessment is Processing! | KeyOwn Habitat`,
            html: customerHTML
        });

        res.json({ success: true, message: 'Assessment request submitted successfully.' });

    } catch (error) {
        console.error('Assessment Error:', error);
        res.status(500).json({ error: 'Failed to process request.' });
    }
});

// ─── Admin Dashboard Endpoints ──────────────────────────────────────────────
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'keyown2026';
const ADMIN_TOKEN = 'keyown-secure-token-9988';

// Helper to log campaigns
async function logCampaign(record) {
    try {
        await CampaignLog.create(record);
    } catch (e) {
        console.error('Failed to log campaign to MongoDB:', e);
    }
}

app.post('/api/admin/login', (req, res) => {
    if (req.body.password === ADMIN_PASSWORD) {
        res.json({ success: true, token: ADMIN_TOKEN });
    } else {
        res.status(401).json({ success: false, error: 'Unauthorized' });
    }
});

// Sleep helper for throttling
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

app.post('/api/campaign/upload', upload.single('campaignFile'), async (req, res) => {
    if (req.headers.authorization !== ADMIN_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
        return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    // Set up SSE/streaming response for live progress
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    
    const sendEvent = (data) => {
        res.write(JSON.stringify(data) + '\\n');
    };

    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            sendEvent({ type: 'log', message: `CSV parsed successfully. Found ${results.length} rows.` });
            
            // Read the template once
            const templatePath = path.join(__dirname, 'email_campaign.html');
            let baseTemplate = '';
            try {
                baseTemplate = fs.readFileSync(templatePath, 'utf-8');
            } catch (err) {
                sendEvent({ type: 'error', message: 'Could not find email_campaign.html template.' });
                return res.end();
            }

            let successCount = 0;
            let errorCount = 0;

            for (let i = 0; i < results.length; i++) {
                const row = results[i];
                // Assuming columns: Name, Email, Role
                const name = row.Name || row.name || 'Candidate';
                const email = row.Email || row.email || '';
                const role = row.Role || row.role || 'a position';

                if (!email) {
                    errorCount++;
                    sendEvent({ type: 'log', message: `Row ${i+1} skipped (No Email).` });
                    continue;
                }

                // Replace placeholders
                const personalizedHtml = baseTemplate
                    .replace(/\\[Candidate Name\\]/g, name)
                    .replace(/{{CandidateName}}/g, name)
                    .replace(/{{Role}}/g, role);

                try {
                    await transporter.sendMail({
                        from: `"KeyOwn Habitat HR" <${process.env.GMAIL_USER}>`,
                        to: email,
                        subject: `You're invited to apply: ${role} | KeyOwn Habitat`,
                        html: personalizedHtml
                    });
                    successCount++;
                    sendEvent({ type: 'log', message: `✅ Sent to ${email}` });
                    logCampaign({ name, email, role, status: 'Sent' });
                } catch (err) {
                    errorCount++;
                    sendEvent({ type: 'log', message: `❌ Failed to send to ${email}` });
                    logCampaign({ name, email, role, status: 'Failed' });
                }

                // Update progress
                sendEvent({ type: 'progress', current: i + 1, total: results.length });

                // Throttling: Wait 1.5 seconds between emails to avoid Gmail rate limits (max 500/day, max ~1/sec recommended)
                await sleep(1500);
            }

            // Cleanup
            fs.unlink(req.file.path, () => {});

            sendEvent({ type: 'log', message: `Campaign Complete! Successfully sent: ${successCount}. Errors: ${errorCount}.` });
            sendEvent({ type: 'done' });
            res.end();
        });
});

// API: Get Campaign Logs
app.get('/api/campaign/logs', async (req, res) => {
    try {
        const logs = await CampaignLog.find().sort({ date: -1 });
        res.json(logs);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to read logs from database' });
    }
});

// API: Download Campaign Logs as CSV or PDF
app.get('/api/campaign/download', async (req, res) => {
    try {
        const startDateStr = req.query.startDate; // Format: DD_MM_YYYY
        const endDateStr = req.query.endDate; // Format: DD_MM_YYYY
        const format = req.query.format || 'csv'; // 'csv' or 'pdf'
        
        let query = {};
        if (startDateStr && endDateStr) {
            const startParts = startDateStr.split('_');
            const endParts = endDateStr.split('_');
            
            if (startParts.length === 3 && endParts.length === 3) {
                const sDay = parseInt(startParts[0], 10);
                const sMonth = parseInt(startParts[1], 10) - 1;
                const sYear = parseInt(startParts[2], 10);
                
                const eDay = parseInt(endParts[0], 10);
                const eMonth = parseInt(endParts[1], 10) - 1;
                const eYear = parseInt(endParts[2], 10);
                
                const startDate = new Date(sYear, sMonth, sDay, 0, 0, 0);
                const endDate = new Date(eYear, eMonth, eDay, 23, 59, 59, 999);
                query.date = { $gte: startDate, $lte: endDate };
            }
        }
        const reportTitleDate = (startDateStr && endDateStr) ? ((startDateStr === endDateStr) ? startDateStr : `${startDateStr}_to_${endDateStr}`) : 'all';
        
        const filteredLogs = await CampaignLog.find(query).sort({ date: -1 });

        if (filteredLogs.length === 0) {
            return res.status(404).send('No logs found for this date in the database');
        }

        if (format === 'pdf') {
            const doc = new PDFDocument({ margin: 50 });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=campaign_report_${reportTitleDate}.pdf`);
            doc.pipe(res);

            // Title
            doc.fontSize(20).text('KeyOwn Habitat - Campaign Report', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(12).fillColor('gray').text(`Report Date: ${reportTitleDate.replace(/_/g, '/')}`, { align: 'center' });
            doc.moveDown(2);

            // Table Header
            const startY = doc.y;
            doc.fontSize(10).fillColor('black');
            doc.text('Date & Time', 50, startY, { width: 100 });
            doc.text('Candidate Name', 160, startY, { width: 120 });
            doc.text('Email Address', 290, startY, { width: 150 });
            doc.text('Status', 450, startY, { width: 70 });
            
            doc.moveTo(50, startY + 15).lineTo(520, startY + 15).stroke();
            
            let rowY = startY + 25;

            // Table Rows
            filteredLogs.forEach(log => {
                // Add new page if we run out of space
                if (rowY > 700) {
                    doc.addPage();
                    rowY = 50;
                }

                const d = new Date(log.date);
                const dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                doc.fillColor('black');
                doc.text(dateStr, 50, rowY, { width: 100 });
                doc.text(log.name, 160, rowY, { width: 120 });
                doc.text(log.email, 290, rowY, { width: 150 });
                
                if (log.status === 'Sent') doc.fillColor('green');
                else doc.fillColor('red');
                doc.text(log.status, 450, rowY, { width: 70 });
                
                rowY += 20;
            });

            doc.end();
            
        } else {
            // CSV Format
            let csvContent = 'Date,Time,Name,Email,Role,Status\\n';
            filteredLogs.forEach(log => {
                const d = new Date(log.date);
                const dateStr = d.toLocaleDateString();
                const timeStr = d.toLocaleTimeString();
                csvContent += `"${dateStr}","${timeStr}","${log.name}","${log.email}","${log.role}","${log.status}"\n`;
            });

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=campaign_report_${reportTitleDate}.csv`);
            res.send(csvContent);
        }
    } catch (e) {
        res.status(500).send('Failed to generate report');
    }
});

app.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}`);
});
