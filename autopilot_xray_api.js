const googleIt = require('google-it');
const fs = require('fs');

const JOB_TITLE = "Relationship Manager";
const LOCATION = "Bangalore";
const OUTPUT_FILE = "candidates.csv";

const query = `site:linkedin.com/in "${JOB_TITLE}" "${LOCATION}"`;

console.log(`🚀 KeyOwn AutoPilot (API Mode) starting...`);
console.log(`🔍 Searching LinkedIn via X-Ray for: ${JOB_TITLE} in ${LOCATION}...`);

googleIt({ 'query': query, 'limit': 30 })
    .then(results => {
        if (!results || results.length === 0) {
            console.log('⚠️ No profiles found or Google blocked the request.');
            return;
        }

        console.log(`✅ Search executed. Extracting profiles...`);
        console.log(`🎉 Extracted ${results.length} LinkedIn profiles!`);
        
        let csvContent = "Candidate Name & Title,LinkedIn URL,Profile Snippet\n";
        results.forEach(c => {
            const cleanTitle = c.title.replace(/"/g, '""').replace(/\n/g, ' ');
            const cleanSnippet = c.snippet.replace(/"/g, '""').replace(/\n/g, ' ');
            csvContent += `"${cleanTitle}","${c.link}","${cleanSnippet}"\n`;
        });

        fs.writeFileSync(OUTPUT_FILE, csvContent);
        console.log(`💾 Saved all candidates to ${OUTPUT_FILE}`);
        console.log(`🛑 AutoPilot finished. You can now open ${OUTPUT_FILE} and contact them!`);
    })
    .catch(error => {
        console.error('Error running search:', error);
    });
