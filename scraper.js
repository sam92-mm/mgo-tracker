const fs = require('fs');

async function scrape() {
    const d = new Date();
    const monthShorts = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const month = monthShorts[d.getMonth()];
    const day = d.getDate();
    const year = d.getFullYear();

    // Osoite, jonka sanoit olevan livenä
    const targetUrl = `https://monopolygo.wiki/todays-events-${month}-${day}-${year}/`;

    console.log("Yritetään hakea: " + targetUrl);

    try {
        const response = await fetch(targetUrl, {
            headers: {
                // TÄMÄ ON TÄRKEÄ: Teeskennellään olevamme tavallinen Chrome-selain
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            console.error(`Virhe: Wiki vastasi tilakoodilla ${response.status}`);
            // Jos haku epäonnistuu, ei ylikirjoiteta vanhaa toimivaa dataa
            return;
        }

        const html = await response.text();
        const events = [];

        // Käytetään erittäin joustavaa etsintää, joka poimii ajan ja nimen
        // Etsii kaavaa: 11:00 AM - 12:00 PM jossain solussa
        const pattern = /(\d{1,2}:\d{2}\s*(?:AM|PM)?\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM)?)(?:<\/td><td>|[^<]*>)(.*?)(?:<\/td>|<\/div>|<br>)/gi;
        
        let match;
        while ((match = pattern.exec(html)) !== null) {
            let time = match[1].trim();
            let name = match[2].replace(/<[^>]*>?/gm, '').trim(); // Siivotaan HTML
            
            if (name && name.length > 2 && name.length < 60) {
                events.push({ time, name });
            }
        }

        if (events.length === 0) {
            console.log("Sivu löytyi, mutta parseri ei löytänyt tapahtumia. HTML-rakenne on saattanut muuttua.");
            // Tulostetaan pätkä HTML:ää lokiin, jotta näet missä vika
            console.log("HTML alku:", html.substring(0, 500));
            return;
        }

        const output = {
            updated: new Date().toISOString(),
            events: events,
            url: targetUrl
        };

        fs.writeFileSync('data.json', JSON.stringify(output, null, 2));
        console.log(`Onnistui! Löytyi ${events.length} tapahtumaa.`);

    } catch (e) {
        console.error("Kriittinen virhe haussa:", e.message);
    }
}

scrape();
