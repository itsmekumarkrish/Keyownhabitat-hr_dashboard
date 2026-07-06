const puppeteer = require('puppeteer');
const fs = require('fs');

// Settings
const JOB_TITLE = "Relationship Manager";
const LOCATION = "Bangalore";
const OUTPUT_FILE = "candidates.csv";

// The Google Dork (X-Ray Search) strategies
const strategies = {
    pdf: `filetype:pdf "${JOB_TITLE}" "${LOCATION}" (resume OR cv) -job -jobs -sample`,
    linkedin: `site:linkedin.com/in "${JOB_TITLE}" "${LOCATION}"`,
    facebook: `site:facebook.com "${JOB_TITLE}" "${LOCATION}" (works at OR worked at)`
};

// Choose which platform to search (change to 'linkedin' or 'facebook')
const CURRENT_STRATEGY = 'facebook';
const searchQuery = strategies[CURRENT_STRATEGY];

async function runAutoPilot() {
    console.log(`🚀 Starting KeyOwn AutoPilot...`);
    console.log(`🔍 Searching ${CURRENT_STRATEGY.toUpperCase()} for: ${JOB_TITLE} in ${LOCATION}...`);

    // Launch a visible browser so the user can watch the robot work
    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: null,
        args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

    // Go to Google
    await page.goto('https://www.google.com', { waitUntil: 'networkidle2' });

    // Type the search query like a human
    await page.type('textarea[name="q"], input[name="q"]', searchQuery, { delay: 100 });
    await page.keyboard.press('Enter');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    console.log('✅ Search executed. Extracting resumes...');

    const candidates = [];

    // Scrape the first 2 pages of results
    for (let i = 0; i < 2; i++) {
        // Extract the links and titles from Google search results
        const results = await page.evaluate(() => {
            const items = document.querySelectorAll('div.g');
            const data = [];
            items.forEach(item => {
                const titleElement = item.querySelector('h3');
                const linkElement = item.querySelector('a');
                const snippetElement = item.querySelector('div.VwiC3b, div.IsZvec'); // Google's snippet classes change often
                
                if (titleElement && linkElement && linkElement.href.endsWith('.pdf')) {
                    data.push({
                        title: titleElement.innerText,
                        url: linkElement.href,
                        snippet: snippetElement ? snippetElement.innerText : ''
                    });
                }
            });
            return data;
        });

        candidates.push(...results);

        // Try to click "Next" page
        const nextButton = await page.$('a#pnnext');
        if (nextButton) {
            console.log('➡️ Moving to next page of results...');
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2' }),
                nextButton.click(),
            ]);
            // Random human delay
            await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
        } else {
            break;
        }
    }

    console.log(`🎉 Extracted ${candidates.length} PDF resumes!`);
    
    // Save to CSV
    let csvContent = "Candidate/Resume Title,PDF Link,Snippet Extract\n";
    candidates.forEach(c => {
        // Basic cleanup for CSV formatting
        const cleanTitle = c.title.replace(/"/g, '""').replace(/\n/g, ' ');
        const cleanSnippet = c.snippet.replace(/"/g, '""').replace(/\n/g, ' ');
        csvContent += `"${cleanTitle}","${c.url}","${cleanSnippet}"\n`;
    });

    fs.writeFileSync(OUTPUT_FILE, csvContent);
    console.log(`💾 Saved all candidates to ${OUTPUT_FILE}`);
    console.log(`🛑 AutoPilot finished. You can now open ${OUTPUT_FILE} and review the resumes.`);

    // Leave the browser open for a few seconds so the user can see, then close
    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
}

runAutoPilot().catch(console.error);
