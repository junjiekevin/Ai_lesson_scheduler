document.getElementById('fetchData').addEventListener('click', async () => {
    try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbzJDgQjuWk9_r-8l91Uly36nA65y5Wz0lEWXBTDcMDYA-ty1na7HnaXxwrJeBY9AniH/exec');
        if (!response.ok) {
            throw new Error('Network response was not OK');
        }
        const data = await response.json();
        console.log('Data:', data);  // Log data for debugging
        populateTable(data);
    } catch (error) {
        console.error('Error retrieving data:', error);
    }
});

function populateTable(data) {
    const tableBody = document.getElementById('submissionsBody');
    tableBody.innerHTML = '';  // Clear previous content

    // Iterate over the rows, skipping the header row and timestamp
    data.slice(1).forEach(row => {
        const tr = document.createElement('tr');
        // Extract and combine Preferred Day and Time fields
        const name = row[1];
        const category = row[2];
        const dayTime1 = `${row[3]} - ${row[4]}`;  // Preferred Day / Time 1
        const dayTime2 = `${row[5]} - ${row[6]}`;  // Preferred Day / Time 2
        const dayTime3 = `${row[7]} - ${row[8]}`;  // Preferred Day / Time 3
        const frequency = row[9];
        const email = row[10];

        // Create HTML for the row
        tr.innerHTML = `
            <td>${name}</td>
            <td>${category}</td>
            <td>${dayTime1}</td>
            <td>${dayTime2}</td>
            <td>${dayTime3}</td>
            <td>${frequency}</td>
            <td>${email}</td>
        `;
        tableBody.appendChild(tr);
    });
}