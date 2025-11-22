const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        projectId: 'jobzai'
    });
}

const db = admin.firestore();

const exactMappings = {
    "New York, NY (HQ)": "New York, NY, USA",
    "New York, New York, USA": "New York, NY, USA",
    "New York, New York": "New York, NY, USA",
    "San Francisco, California": "San Francisco, CA, USA",
    "Dublin": "Dublin, Ireland",
    "London": "London, UK",
    "Tokyo, Japan": "Tokyo, Japan",
    "US, CA, Santa Clara": "Santa Clara, CA, USA",
    "Israel, Yokneam": "Yokneam, Israel",
    "China, Shanghai": "Shanghai, China",
    "India, Bengaluru": "Bengaluru, India",
    "Bengaluru": "Bengaluru, India",
    "Taiwan, Taipei": "Taipei, Taiwan",
    "Israel, Tel Aviv": "Tel Aviv, Israel",
    "Paris, France": "Paris, France",
    "Dublin, Ireland": "Dublin, Ireland",
    "Lisboa": "Lisbon, Portugal",
    "Lisbon, Portugal": "Lisbon, Portugal",
    "Seoul, South Korea": "Seoul, South Korea",
    "Sydney, Australia": "Sydney, Australia",
    "Mexico City": "Mexico City, Mexico",
    "Boston, Massachusetts, USA": "Boston, MA, USA",
    "Chicago": "Chicago, IL, USA",
    "Amsterdam": "Amsterdam, Netherlands",
    "Singapore": "Singapore",
    "UK": "United Kingdom",
    "USA": "United States",
    "United States": "United States",
    "NAMER": "North America",
    "EMEA": "Europe, Middle East, Africa",
    "China, Shenzhen": "Shenzhen, China",
    "India, Pune": "Pune, India",
    "Taiwan, Hsinchu": "Hsinchu, Taiwan",
    "Israel, Raanana": "Raanana, Israel",
    "Japan, Tokyo": "Tokyo, Japan",
    "Foster City, CA (Hybrid) In office M,W,F": "Foster City, CA, USA",
    "Mountain View, CA (Hybrid) In office M,W,F": "Mountain View, CA, USA",
    "San Diego, CA (Hybrid) In office M,W,F": "San Diego, CA, USA",
    "Austin, TX (Hybrid) In office M,W,F": "Austin, TX, USA",
};

async function normalizeLocations() {
    console.log('Starting location normalization...');
    const snapshot = await db.collection('jobs').get();
    let batch = db.batch();
    let count = 0;
    let totalUpdated = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        let loc = data.location;
        if (!loc) continue;

        let newLoc = loc;

        // 1. Exact Mappings
        if (exactMappings[loc]) {
            newLoc = exactMappings[loc];
        }
        // 2. Heuristics
        else {
            // Remove "(HQ)"
            newLoc = newLoc.replace(" (HQ)", "");

            // Remove "(Hybrid)..." suffix
            if (newLoc.includes("(Hybrid)")) {
                newLoc = newLoc.split("(Hybrid)")[0].trim();
                // If it ends with comma, remove it
                if (newLoc.endsWith(",")) newLoc = newLoc.slice(0, -1);
                // Add USA if it looks like "City, ST" (e.g. "Austin, TX")
                if (/^[A-Z][a-z]+, [A-Z]{2}$/.test(newLoc)) {
                    newLoc += ", USA";
                }
            }

            // "US, ST, City" -> "City, ST, USA"
            if (newLoc.startsWith("US, ")) {
                const parts = newLoc.split(", ");
                if (parts.length === 3) {
                    // US, CA, Santa Clara -> Santa Clara, CA, USA
                    newLoc = `${parts[2]}, ${parts[1]}, USA`;
                }
            }
        }

        if (newLoc !== loc) {
            batch.update(doc.ref, { location: newLoc });
            count++;
            totalUpdated++;
        }

        if (count >= 400) {
            await batch.commit();
            batch = db.batch();
            count = 0;
            console.log(`Committed batch. Total updated so far: ${totalUpdated}`);
        }
    }

    if (count > 0) {
        await batch.commit();
        console.log(`Committed final batch.`);
    }

    console.log(`Normalization complete. Updated ${totalUpdated} jobs.`);
}

normalizeLocations().catch(console.error);
