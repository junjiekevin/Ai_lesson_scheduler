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
        row.slice(1).forEach(cell => {  // Skip the first element (timestamp)
            const td = document.createElement('td');
            td.textContent = cell ? cell : 'N/A';  // Handle empty cells
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });
}