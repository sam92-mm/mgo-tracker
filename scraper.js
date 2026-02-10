const fs = require('fs');

async function scrape() {
    const d = new Date();
    const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
    const url = `https://monopolygo.wiki/todays-events-${months[d.getMonth()]}-${d.getDate()}-${d.getFullYear()}/`;

    console.log("Haetaan osoitteesta: " + url);

    try {
        const response = await fetch(url);
        const html = await response.text();
        
        // Etsitään tapahtumat HTML-koodista
        const regex = /(\d{1,2}:\d{2}\s*(?:AM|PM)?\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*(.*?)(?=<|$)/gi;
        let matches;
        const events = [];

        while ((matches = regex.exec(html)) !== null) {
            const time = matches[1].trim();
            const name = matches[2].trim();
            if (name.length > 3 && name.length < 50) {
                events.push({ time, name });
            }
        }

        const output = {
            updated: new Date().toISOString(),
            events: events
        };

        fs.writeFileSync('data.json', JSON.stringify(output, null, 2));
        console.log("Data tallennettu tiedostoon data.json");
    } catch (e) {
        console.error("Haku epäonnistui: ", e);
        process.exit(1);
    }
}

scrape();
