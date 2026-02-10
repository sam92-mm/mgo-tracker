const fs = require('fs');

async function scrape() {
    try {
        // 1. Mennään ensin Wikin etusivulle
        const mainResponse = await fetch("https://monopolygo.wiki/");
        const mainHtml = await mainResponse.text();
        
        // 2. Etsitään etusivulta linkki, joka viittaa päivän tapahtumiin
        // Etsii kaavaa: /todays-events-.../
        const linkMatch = mainHtml.match(/\/todays-events-[a-z0-9-]+\//i);
        
        if (!linkMatch) {
            console.error("Päivän tapahtumalinkkiä ei löytynyt etusivulta.");
            // Luodaan tyhjä tiedosto, jotta HTML ei hajoa
            fs.writeFileSync('data.json', JSON.stringify({ updated: new Date(), events: [], note: "Linkkiä ei löytynyt" }, null, 2));
            return;
        }

        const targetUrl = "https://monopolygo.wiki" + linkMatch[0];
        console.log("Löytyi dynaaminen URL: " + targetUrl);

        // 3. Haetaan varsinainen tapahtumasivu
        const response = await fetch(targetUrl);
        const html = await response.text();
        
        const events = [];
        
        // 4. Etsitään tapahtumat (kokeillaan useaa eri kaavaa)
        // Kaava A: Taulukko-solut
        const tableRegex = /<td>(\d{1,2}:\d{2}\s*(?:AM|PM)?\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM)?)<\/td><td>(.*?)<\/td>/gi;
        let match;

        while ((match = tableRegex.exec(html)) !== null) {
            let name = match[2].replace(/<[^>]*>?/gm, '').trim();
            if (name.length > 2 && name.length < 100) {
                events.push({ time: match[1].trim(), name: name });
            }
        }

        // 5. Jos taulukko ei tärpännyt, kokeillaan yleistä tekstihakua
        if (events.length === 0) {
            const textRegex = /(\d{1,2}:\d{2}\s*(?:AM|PM)?\s*-\s*\d{1,2}:\d{2}\s*(?:AM|PM)?)\s+(.*)/gi;
            while ((match = textRegex.exec(html)) !== null) {
                let name = match[2].split('<')[0].trim();
                if (name.length > 2 && name.length < 50) {
                    events.push({ time: match[1].trim(), name: name });
                }
            }
        }

        const output = {
            updated: new Date().toISOString(),
            events: events,
            url: targetUrl
        };

        fs.writeFileSync('data.json', JSON.stringify(output, null, 2));
        console.log(`Valmis! Löytyi ${events.length} tapahtumaa osoitteesta ${targetUrl}`);

    } catch (e) {
        console.error("Kriittinen virhe:", e);
        process.exit(1);
    }
}

scrape();
