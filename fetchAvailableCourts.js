const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');

const baseUrl = "https://deportemunicipaltemuco.cl/recintos/{}/arrendar/0?tag_id=16&date={}&range=60&start_time={}:00&end_time={}:00";

const recintos = {
    804: ["Germán Becker", "Temuco"],
    855: ["Labranza", "Labranza"]
};

const canchas = ["Cancha Tenis 1", "Cancha Tenis 2", "Cancha Tenis 3", "Cancha Tenis 4"];

async function fetchAvailableCourts(startDate, selectedRecintos, daysToIterate, selectedCanchas, startHour, endHour) {
    console.log('Starting fetchAvailableCourts with params:', { startDate, selectedRecintos, daysToIterate, selectedCanchas, startHour, endHour });
    let results = [];
    const recintosList = selectedRecintos.length > 0 ? selectedRecintos : Object.keys(recintos);

    for (let i = 0; i < daysToIterate; i++) {
        const currentDate = moment(startDate).add(i, 'days');
        const formattedDate = currentDate.format("DD/MM/YYYY");
        const dayOfWeek = currentDate.format("dddd");

        for (const recintoCode of recintosList) {
            const [recintoName, city] = recintos[recintoCode] || ["Unknown", "Unknown"];
            const hourRange = (startHour && endHour) ? range(parseInt(startHour), parseInt(endHour) + 1) : range(8, 21);

            for (const hour of hourRange) {
                const url = baseUrl.replace('{}', recintoCode)
                                   .replace('{}', formattedDate)
                                   .replace('{}', hour)
                                   .replace('{}', hour + 1);
                console.log('Fetching URL:', url);

                try {
                    const response = await axios.get(url);

                    if (response.status === 200) {
                        const $ = cheerio.load(response.data);
                        const elementos = $('h5.complexForm-content-facilityTitle');
                        let canchasEncontradas = elementos
                            .filter((_, el) => $(el).text().includes('Cancha Tenis'))
                            .map((_, el) => $(el).text().trim())
                            .get();

                        if (selectedCanchas.length > 0) {
                            canchasEncontradas = canchasEncontradas.filter(cancha => 
                                selectedCanchas.includes(cancha)
                            );
                        }

                        if (canchasEncontradas.length > 0) {
                            const bookingUrl = `https://deportemunicipaltemuco.cl/recintos/${recintoCode}/arrendar/0?tag_id=16&date=${formattedDate}&range=60&start_time=${hour.toString().padStart(2, '0')}:00&end_time=${(hour + 1).toString().padStart(2, '0')}:00`;

                            results.push({
                                recintoName,
                                recintoCode,
                                date: formattedDate,
                                dayOfWeek,
                                hour: `${hour.toString().padStart(2, '0')}:00`,
                                canchas: canchasEncontradas,
                                bookingUrl
                            });
                        }
                    }
                } catch (error) {
                    console.error(`Error fetching data for ${formattedDate} at ${hour}:00:`, error.message);
                }
            }
        }
    }

    console.log('Finished fetchAvailableCourts, results:', results);
    return results;
}

function range(start, end) {
    return Array.from({ length: end - start }, (_, i) => start + i);
}

module.exports = { fetchAvailableCourts, canchas };
