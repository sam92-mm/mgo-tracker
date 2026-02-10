const fs = require('fs');

async function scrape() {
    const d = new Date();
    const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();

    // Kokeillaan useampaa URL-vaihtoehtoa, koska Wiki muuttaa muotoilua
    const urls = [
        `https://monopolygo.wiki/todays-events-${month}-${day}-${year}/`,
        `https://monopolygo.wiki/todays-events-${month}-${day}th-${year}/`,
        `https://monopolygo.wiki/todays-events-${month}-${day}st-${year}/`,
        `https://monopolygo.wiki/todays-events-${month}-${day}rd-${year}/`
    ];

    let html = "";
    for (let url of urls) {
        try {
            console.log("Yritetään hakea: " + url);
            const response = await fetch(url);
            if (response.ok) {
                html = await response.text();
                break;
            }
        } catch (e) { continue; }
    }

    if (!html) {
        console.error("Sivua ei löytynyt millään URL-muodolla.");
        process.exit(1);
    }

    const events = [];
    
    // UUSI REGEKS: Etsii kellonajan (esim 11:00 AM) ja sen jälkeen tulevan tekstin 
    // riippumatta siitä, onko se taulukossa vai listassa.
    // Etsii kaavaa: AIKA - AIKA TAPAHTUMAN_NIMI
    const pattern = /(\d{1,2}:\d{2}\s*(?:AM|PM)?\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*<\/td><td>(.*?)<\/td>/gi;
    let match;

    while ((match = pattern.exec(html)) !== null) {
        let time = match[1].replace(/<[^>]*>?/gm, '').trim();
        let name = match[2].replace(/<[^>]*>?/gm, '').trim();
        
        if (name && name.length < 100) {
            events.push({ time, name });
        }
    }

    // Jos taulukko-haku epäonnistui, kokeillaan yleisempää tekstihakua
    if (events.length === 0) {
        const fallbackPattern = /(\d{1,2}:\d{2}\s*(?:AM|PM)?\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM)?)\s+(.*)/gi;
        while ((match = fallbackPattern.exec(html)) !== null) {
            let time = match[1].trim();
            let name = match[2].split('<')[0].trim(); // Otetaan teksti ennen seuraavaa HTML-tagia
            if (name.length > 3 && name.length < 50) {
                events.push({ time, name });
            }
        }
    }

    const output = {
        updated: new Date().toISOString(),
        events: events
    };

    fs.writeFileSync('data.json', JSON.stringify(output, null, 2));
    console.log(`Valmis! Löytyi ${events.length} tapahtumaa.`);
}

scrape();
