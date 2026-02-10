const fs = require('fs');

async function scrape() {
    const d = new Date();
    const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
    const url = `https://monopolygo.wiki/todays-events-${months[d.getMonth()]}-${d.getDate()}-${d.getFullYear()}/`;

    console.log("Haetaan osoitteesta: " + url);

    try {
        const response = await fetch(url);
        const html = await response.text();
        
        const events = [];
        
        // UUSI PARSERI: Etsii taulukon rivit <tr> ja solut <td>
        // Tämä on huomattavasti varmempi tapa kuin pelkkä tekstihaku
        const rowRegex = /<tr><td>(.*?)<\/td><td>(.*?)<\/td>/gi;
        let match;

        while ((match = rowRegex.exec(html)) !== null) {
            let time = match[1].replace(/<[^>]*>?/gm, '').trim(); // Poistaa mahdolliset HTML-tagit
            let name = match[2].replace(/<[^>]*>?/gm, '').trim();

            // Varmistetaan, että rivi sisältää kellonajan (numeroita)
            if (time.match(/\d/) && name.length > 2) {
                events.push({ time, name });
            }
        }

        const output = {
            updated: new Date().toISOString(),
            events: events
        };

        fs.writeFileSync('data.json', JSON.stringify(output, null, 2));
        console.log(`Löytyi ${events.length} tapahtumaa.`);
        
    } catch (e) {
        console.error("Haku epäonnistui: ", e);
        process.exit(1);
    }
}

scrape();
