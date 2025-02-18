let currentSchedule = {};

const API_KEY = CONFIG.GOOGLE_API_KEY;
const CLIENT_ID = CONFIG.GOOGLE_CLIENT_ID;
const SCOPES = [
    "https://www.googleapis.com/auth/forms.body",
    "https://www.googleapis.com/auth/spreadsheets.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/drive.file"
].join(" ");
const DISCOVERY_DOCS = [
    "https://forms.googleapis.com/$discovery/rest",
    "https://sheets.googleapis.com/$discovery/rest",
    "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"
];

function loadGapi() {
    gapi.load("client:auth2", initGapi);
}

async function initGapi() {
    try {
        await gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            scope: SCOPES,
            discoveryDocs: DISCOVERY_DOCS
        });

        console.log("Google API Initialized");
        updateSignInStatus(gapi.auth2.getAuthInstance().isSignedIn.get());

        document.getElementById("authorizeButton").addEventListener("click", () => {
            gapi.auth2.getAuthInstance().signIn().then(user => {
                console.log("User signed in:", user.getBasicProfile().getName());
            }).catch(error => console.error("Sign-in Error:", error));
        });

        document.getElementById("signOutButton").addEventListener("click", () => {
            gapi.auth2.getAuthInstance().signOut();
        });

    } catch (error) {
        console.error("Google API Initialization Error:", error);
    }
}

function updateSignInStatus(isSignedIn) {
    document.getElementById("authorizeButton").style.display = isSignedIn ? "none" : "block";
    document.getElementById("signOutButton").style.display = isSignedIn ? "block" : "none";

    if (isSignedIn) {
        console.log("User signed in successfully.");
        const user = gapi.auth2.getAuthInstance().currentUser.get();
        console.log("User Info:", user.getBasicProfile());
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.onload = loadGapi;
    document.body.appendChild(script);
});

// Function to fetch data from Google Sheets
async function fetchData() {
    try {
        const response = await fetch('https://script.google.com/macros/s/AKfycbzJDgQjuWk9_r-8l91Uly36nA65y5Wz0lEWXBTDcMDYA-ty1na7HnaXxwrJeBY9AniH/exec');
        if (!response.ok) {
            throw new Error('Network response was not OK');
        }
        const data = await response.json();
        console.log('Data:', data);  // Log data for debugging
        
        // Populate table with student submissions
        populateTable(data);
        
    } catch (error) {
        console.error('Error retrieving data:', error);
    }
}

// Call fetchData when the page loads
document.addEventListener('DOMContentLoaded', fetchData);

// New Event Listener for Generate Schedule Button
document.getElementById('generateSchedule').addEventListener('click', () => {
    console.log("Generate Schedule button clicked"); // For Debugging
    const submissions = Array.from(document.querySelectorAll('#submissionsBody tr')).map(tr => {
        return [
            tr.children[0].textContent,  // Full Name
            tr.children[1].textContent,  // Lesson Category
            tr.children[2].textContent,  // Preferred Day / Time 1
            tr.children[3].textContent,  // Preferred Day / Time 2
            tr.children[4].textContent,  // Preferred Day / Time 3
            tr.children[5].textContent,  // Frequency
            tr.children[6].textContent   // Email
        ];
    });
    
    console.log("Submissions for Schedule Generation:", submissions); // For Debugging

    // Create weekly schedule from student submissions
    const weeklySchedule = createWeeklySchedule(submissions);
    console.log("Generated Weekly Schedule:", weeklySchedule); // For Debugging
    displayScheduleToTeacher(weeklySchedule);
});

function showNotification(message) {
    const notificationDiv = Object.assign(document.createElement('div'), {
        textContent: message,
        style: `
            position: fixed; 
            bottom: 20px; 
            right: 20px; 
            background-color: #ff3333;
            color: #fff; 
            padding: 20px 30px; 
            border-radius: 5px; 
            z-index: 1000;
            font-size: 20px; 
            display: flex; 
            align-items: center; 
            justify-content: space-between;
        `
    });

    const closeButton = Object.assign(document.createElement('span'), {
        textContent: '✖',
        style: `
            cursor: pointer; 
            font-size: 19px; 
            color: #fff; 
            margin-left: 10px;
        `,
        onclick: () => notificationDiv.remove()
    });

    notificationDiv.appendChild(closeButton);
    document.body.appendChild(notificationDiv);
}

function createWeeklySchedule(submissions) {
    currentSchedule = {}; // Reset global schedule

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    // Ensure all days exist even if empty
    days.forEach(day => {
        currentSchedule[day] = [];  // Make sure days exist
    });

    submissions.forEach(row => {
        const name = row[0];  
        const lessonCategory = row[1];
        const preferences = [row[2], row[3], row[4]];

        let assigned = false;

        for (const preference of preferences) {
            if (preference) {
                const [day, time] = preference.split(' - ');

                // Now guaranteed to exist
                if (!currentSchedule[day].some(entry => entry.time === time)) {
                    currentSchedule[day].push({ name, lessonCategory, time });
                    assigned = true;
                    break;
                }
            }
        }

        if (!assigned) {
            showNotification(`No available time slots for ${name} (${lessonCategory})`);
        }
    });

    console.log("Finalized Schedule:", currentSchedule); // Debugging
    return currentSchedule;
}

function displayScheduleToTeacher(currentSchedule) {
    const scheduleTable = document.getElementById('scheduleTable').getElementsByTagName('tbody')[0];
    scheduleTable.innerHTML = '';  // Clear previous schedule
    const timeSlots = [
        "9:00am", "10:00am", "11:00am", "12:00pm", 
        "1:00pm", "2:00pm", "3:00pm", "4:00pm", 
        "5:00pm", "6:00pm"
    ];
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    timeSlots.forEach(time => {
        const row = document.createElement('tr');
        const timeCell = document.createElement('td');
        timeCell.textContent = time;
        row.appendChild(timeCell);

        days.forEach(day => {
            const cell = document.createElement('td');
            cell.setAttribute('data-day', day);
            cell.setAttribute('data-time', time);

            const entries = currentSchedule[day] || [];
            const scheduled = entries.find(entry => entry.time === time);
            
            if (scheduled) {
                cell.textContent = `${scheduled.name} (${scheduled.lessonCategory})`;
            } else {
                cell.textContent = '';  // Ensure empty cells exist
            }

            // Make every cell draggable (even empty ones)
            cell.draggable = true;

            // Add event listeners for dragging and dropping
            cell.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text', `${day}-${time}`);
            });

            cell.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            cell.addEventListener('drop', (e) => {
                e.preventDefault();
                const draggedData = e.dataTransfer.getData('text').split('-');
                moveLesson(draggedData[0], draggedData[1], day, time);
            });

            cell.classList.add('schedule-cell');
            row.appendChild(cell);
        });

        scheduleTable.appendChild(row);
    });
}

function moveLesson(draggedDay, draggedTime, targetDay, targetTime) {
    if (![draggedDay, draggedTime, targetDay, targetTime].every(Boolean)) {
        console.warn("moveLesson() received undefined values:", { draggedDay, draggedTime, targetDay, targetTime });
        return;
    }

    console.log(`Moving lesson from ${draggedDay} at ${draggedTime} to ${targetDay} at ${targetTime}`);

    // Ensure both days exist in the schedule
    currentSchedule[draggedDay] ??= [];
    currentSchedule[targetDay] ??= [];

    // Find the lesson being moved
    const draggedIndex = currentSchedule[draggedDay].findIndex(entry => entry.time === draggedTime);
    if (draggedIndex === -1) {
        console.warn(`Dragged lesson not found at ${draggedDay} ${draggedTime}`);
        return;
    }

    const draggedEntry = currentSchedule[draggedDay][draggedIndex];
    const targetIndex = currentSchedule[targetDay].findIndex(entry => entry.time === targetTime);

    if (targetIndex !== -1) {
        // Swap logic
        console.log(`Swapping ${draggedEntry.name} (${draggedTime}) with ${currentSchedule[targetDay][targetIndex].name} (${targetTime})`);
        [currentSchedule[draggedDay][draggedIndex], currentSchedule[targetDay][targetIndex]] =
            [{ ...currentSchedule[targetDay][targetIndex], time: draggedTime }, { ...draggedEntry, time: targetTime }];
    } else {
        console.log(`Moving lesson to empty slot at ${targetDay} ${targetTime}`);

        currentSchedule[targetDay].push({ ...draggedEntry, time: targetTime });
        currentSchedule[draggedDay].splice(draggedIndex, 1);
    }

    console.log("Updated Schedule:", currentSchedule);
    displayScheduleToTeacher(currentSchedule);
}

function updateScheduleUI(day, time, entry) {
    const scheduleTable = document.getElementById('scheduleTable').getElementsByTagName('tbody')[0];
    const rows = scheduleTable.getElementsByTagName('tr');

    for (let row of rows) {
        const cells = row.getElementsByTagName('td');
        for (let cell of cells) {
            if (cell.getAttribute('data-day') === day && cell.getAttribute('data-time') === time) {
                cell.textContent = entry ? `${entry.name} (${entry.lessonCategory})` : ''; 
            }
        }
    }
}


function enableDragAndDrop() {
    const scheduleCells = document.querySelectorAll('.schedule-cell'); 

    scheduleCells.forEach(cell => {
        cell.setAttribute('draggable', 'true'); 

        cell.addEventListener('dragstart', (event) => {
            event.dataTransfer.setData('text', event.target.id);  
        });

        cell.addEventListener('dragover', (event) => {
            event.preventDefault();  
        });

        cell.addEventListener('drop', (event) => {
            event.preventDefault();

            // Get data for the dragged element
            const draggedId = event.dataTransfer.getData('text');
            const draggedElement = document.getElementById(draggedId);
            const targetCell = event.target;

            // Ensure not dropping element onto itself
            if (draggedElement !== targetCell) {
                // Update DOM visually
                const tempText = draggedElement.textContent;
                draggedElement.textContent = targetCell.textContent;
                targetCell.textContent = tempText;

                // Update schedule data accordingly
                updateScheduleData(draggedElement, targetCell);
            }
        });
    });
}

function updateScheduleData(draggedElement, targetCell) {
    const draggedTime = draggedElement.getAttribute('data-time'); 
    const targetTime = targetCell.getAttribute('data-time');
    const draggedDay = draggedElement.getAttribute('data-day');
    const targetDay = targetCell.getAttribute('data-day');

    const draggedIndex = currentSchedule[draggedDay]?.findIndex(item => item.time === draggedTime);
    const targetIndex = currentSchedule[targetDay]?.findIndex(item => item.time === targetTime);

    if (draggedIndex !== -1) {
        const temp = currentSchedule[draggedDay][draggedIndex];
        currentSchedule[draggedDay][draggedIndex] = currentSchedule[targetDay]?.[targetIndex] || null;
        currentSchedule[targetDay][targetIndex] = temp;

        console.log('Updated schedule:', currentSchedule);
        displayScheduleToTeacher(currentSchedule);
    }
}

// Enable drag and drop functionality on page load
document.addEventListener('DOMContentLoaded', enableDragAndDrop);

// Populate table with submission data
function populateTable(data) {
    const tableBody = document.getElementById('submissionsBody');
    tableBody.innerHTML = '';  // Clear previous content

    // Iterate over rows, skip header row and timestamp
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

        // Create HTML for row
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

// Event listener for Finalize Schedule button
document.getElementById('finalizeSchedule').addEventListener('click', () => {
    console.log("Clickity clicked!"); // Log onto console for debugging

    // Logic for sending finalized schedule to Google Calendar will be here
    const scheduleTable = document.getElementById('scheduleTable');
    const finalizeSchedule = [];

    // Gathering finalized schedule from table
    const rows = scheduleTable.getElementsByTagName('tr');
    for (let i = 1; i < rows.length; i++) { // Skip header row
        const rowData = {
            time: rows[i].cells[0].textContent, // Time slots
            assignments: []
        };

        for (let j = 1; j < rows[i].cells.length; j++) { // Iterating through 'Days'
            if (rows[i].cells[j].textContent) {
                rowData.assignments.push(rows[i].cells[j].textContent); // Add assigned student
            }
        }
        finalizeSchedule.push(rowData);
    }
    
    console.log("Finalized Schedule: ", finalizeSchedule);

})