require('dotenv').config();
const fs = require('fs');
const nodemailer = require('nodemailer');
const csv = require('csv-parser');

// 1. Setup Email Transporter using your existing .env credentials
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

// 2. Load the HTML Email Template
const htmlTemplate = fs.readFileSync('email_campaign.html', 'utf8');

const results = [];

console.log('🚀 Initializing KeyOwn Campaign Manager...');
console.log('📖 Reading candidates from candidates.csv...');

// 3. Read the CSV file
fs.createReadStream('candidates.csv')
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
        console.log(`✅ Found ${results.length} candidates. Beginning email sequence...\n`);
        
        let successCount = 0;
        let failCount = 0;

        // 4. Loop through candidates and send personalized emails
        for (let i = 0; i < results.length; i++) {
            const candidate = results[i];
            
            // Extract the Name and Email from the CSV headers
            const fullName = candidate['Candidate Name & Title'] ? candidate['Candidate Name & Title'].split('-')[0].trim() : 'Candidate';
            // Only use the First Name for a friendlier greeting
            const firstName = fullName.split(' ')[0];
            const email = candidate['Email Address'];

            if (!email) {
                console.log(`⚠️ Skipping ${firstName} - No email address found.`);
                continue;
            }

            // 5. Personalize the HTML Template
            // This searches the HTML file for "[Candidate Name]" and replaces it with their actual First Name
            const personalizedHTML = htmlTemplate.replace('[Candidate Name]', firstName);

            try {
                // 6. Send the Email
                await transporter.sendMail({
                    from: `"KeyOwn Habitat Recruitment" <${process.env.GMAIL_USER}>`,
                    to: email,
                    subject: `${firstName}, join the KeyOwn Habitat team in Bangalore!`,
                    html: personalizedHTML
                });
                
                console.log(`📩 SUCCESS: Sent personalized invitation to ${firstName} at ${email}`);
                successCount++;
                
                // Add a small 2-second delay between emails so Google doesn't flag us for spamming
                await new Promise(resolve => setTimeout(resolve, 2000));
                
            } catch (error) {
                console.error(`❌ FAILED to send to ${email}:`, error.message);
                failCount++;
            }
        }

        console.log(`\n🎉 CAMPAIGN COMPLETE!`);
        console.log(`✅ Successfully sent: ${successCount}`);
        if (failCount > 0) console.log(`❌ Failed to send: ${failCount}`);
        console.log(`To view the sent emails, check the 'Sent' folder in your Gmail account.`);
    });
