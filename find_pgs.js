const https = require('https');
const fs = require('fs');

console.log('🔍 Connecting to OpenStreetMap database to find PGs in Bangalore...');

// Overpass QL query to find Hostels and PGs in Bangalore
// Bounding box for Bangalore: 12.834, 77.460, 13.143, 77.784
const query = `
[out:json][timeout:25];
(
  node["tourism"="hostel"](12.834,77.460,13.143,77.784);
  node["name"~"PG",i](12.834,77.460,13.143,77.784);
  node["name"~"Paying Guest",i](12.834,77.460,13.143,77.784);
);
out body;
>;
out skel qt;
`;

const options = {
    hostname: 'overpass-api.de',
    path: '/api/interpreter',
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'KeyOwnHabitat-Recruiting-Tool/1.0'
    }
};

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            const pgs = parsed.elements.filter(e => e.tags && e.tags.name);
            
            console.log(`✅ Found ${pgs.length} PGs and Hostels in Bangalore!`);
            
            let csvContent = "PG Name,Phone Number,Website,Address\\n";
            let validLeads = 0;

            pgs.forEach(pg => {
                const name = pg.tags.name || "Unknown PG";
                const phone = pg.tags.phone || pg.tags['contact:phone'] || "No phone listed";
                const website = pg.tags.website || pg.tags['contact:website'] || "No website";
                const street = pg.tags['addr:street'] || "";
                const city = pg.tags['addr:city'] || "Bangalore";
                
                // Only save if it has a name
                if (name !== "Unknown PG") {
                    csvContent += `"${name}","${phone}","${website}","${street}, ${city}"\n`;
                    validLeads++;
                }
            });

            fs.writeFileSync('pg_leads_bangalore.csv', csvContent);
            console.log(`✅ Successfully saved ${validLeads} PG Owner leads to 'pg_leads_bangalore.csv'`);
            console.log(`Open the Excel file, grab their phone numbers, and send them the WhatsApp template!`);

        } catch (e) {
            console.error('Error parsing data:', e.message);
        }
    });
});

req.on('error', (e) => {
    console.error('API Error:', e.message);
});

req.write(`data=${encodeURIComponent(query)}`);
req.end();
