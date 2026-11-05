// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);
const API_KEY = "NTThCMD8hwz8cLDnpNGT9CdGRrGM6FfnG8h6dkFm";
const API_URL = "https://api.nasa.gov/planetary/apod";
async function testNASA() {
    const url = `${API_URL}?api_key=${API_KEY}&start_date=2026-11-01&end_date=2026-11-05`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Failed to fetch NASA data");
        }

        const data = await response.json();

        console.log(data);

    } catch (error) {
        console.error("Error:", error);
    }
}

testNASA();