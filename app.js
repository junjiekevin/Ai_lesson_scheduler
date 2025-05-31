// Global variables
let currentSchedule = {};
const MISSED_LESSONS_SHEET = "Missed Lessons";
const TIME_SLOTS = ["9:00am", "10:00am", "11:00am", "12:00pm", "1:00pm", "2:00pm", "3:00pm", "4:00pm", "5:00pm", "6:00pm"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Google API configuration (loaded from config.js)
const API_KEY = CONFIG.GOOGLE_API_KEY;
const CLIENT_ID = CONFIG.GOOGLE_CLIENT_ID;
const PROJECT_ID = CONFIG.PROJECT_ID;
let tokenClient;

const SCOPES = [
    "https://www.googleapis.com/auth/forms.body",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/calendar"
].join(" ");

const DISCOVERY_DOCS = [
    "https://forms.googleapis.com/$discovery/rest?version=v1",
    "https://sheets.googleapis.com/$discovery/rest?version=v4",
    "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest",
    "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
    "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"
];

// Initialize Google APIs
function loadGapi() {
    gapi.load("client", initGapi);
}

async function initGapi() {
    try {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: DISCOVERY_DOCS
        });
        console.log("Google API Client Initialized");
    } catch (error) {
        console.error("Google API Initialization Error:", error);
    }
}

// Authentication
window.onload = () => {
    google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse
    });

    google.accounts.id.renderButton(
        document.getElementById("authorizeButton"),
        { theme: "outline", size: "large" }
    );

    google.accounts.id.prompt();
};

function handleCredentialResponse(response) {
    const jwt = response.credential;
    const userInfo = parseJwt(jwt);
    console.log("User Info:", userInfo);

    document.getElementById("generateSchedule").disabled = false;
    document.getElementById("finalizeSchedule").disabled = false;
    document.getElementById("refreshDataBtn").disabled = false;
    document.getElementById("resetScheduleBtn").disabled = false;
    document.getElementById("authorizeButton").style.display = "none";
    document.getElementById("signOutButton").style.display = "block";

    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: async (tokenResponse) => {
            if (tokenResponse.error) {
                console.error("OAuth Token Error:", tokenResponse);
                showNotification("Authorization failed.");
                return;
            }
    
            console.log("OAuth Token granted:", tokenResponse);
            gapi.client.setToken({ access_token: tokenResponse.access_token });
            await initGapi();
        }
    });    

    tokenClient.requestAccessToken();
}

// Form Creation Functionality
document.getElementById("copyFormBtn").addEventListener("click", async () => {
    try {
        const formUrl = await createNewForm();
        if (formUrl) {
            showNotification("Form created successfully! URL copied to clipboard.");
            await navigator.clipboard.writeText(formUrl);
            
            // Create a clickable link to display
            const formLink = document.createElement('a');
            formLink.href = formUrl;
            formLink.textContent = 'Open Form';
            formLink.target = '_blank';
            formLink.style.display = 'block';
            formLink.style.marginTop = '10px';
            
            const formContainer = document.createElement('div');
            formContainer.style.position = 'fixed';
            formContainer.style.bottom = '20px';
            formContainer.style.right = '20px';
            formContainer.style.backgroundColor = 'white';
            formContainer.style.padding = '15px';
            formContainer.style.borderRadius = '8px';
            formContainer.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
            formContainer.style.zIndex = '1000';
            
            formContainer.innerHTML = '<p>Form created! URL copied to clipboard.</p>';
            formContainer.appendChild(formLink);
            
            const closeButton = document.createElement('button');
            closeButton.textContent = 'Close';
            closeButton.style.marginTop = '10px';
            closeButton.onclick = () => formContainer.remove();
            formContainer.appendChild(closeButton);
            
            document.body.appendChild(formContainer);
        }
    } catch (error) {
        console.error("Error creating form:", error);
        showNotification("Failed to create form. Check console for details.");
    }
});

async function createNewForm() {
    try {
        // Create the form structure
        const form = {
            info: {
                title: "Lesson Scheduling Form",
                documentTitle: "Lesson Scheduling Form"
            },
            items: [
                {
                    title: "Full Name",
                    questionItem: {
                        question: {
                            required: true,
                            textQuestion: {
                                paragraph: false
                            }
                        }
                    }
                },
                {
                    title: "Lesson Category",
                    questionItem: {
                        question: {
                            required: true,
                            choiceQuestion: {
                                type: "DROP_DOWN",
                                options: [
                                    { value: "MSM" },
                                    { value: "Curtis" },
                                    { value: "Bard" },
                                    { value: "Private" },
                                    { value: "Consultation" }
                                ]
                            }
                        }
                    }
                },
                {
                    title: "Preferred Day and Time Slot #1 (e.g., Monday 3:00pm)",
                    questionItem: {
                        question: {
                            required: true,
                            textQuestion: {
                                paragraph: false
                            }
                        }
                    }
                },
                {
                    title: "Preferred Day and Time Slot #2",
                    questionItem: {
                        question: {
                            required: false,
                            textQuestion: {
                                paragraph: false
                            }
                        }
                    }
                },
                {
                    title: "Preferred Day and Time Slot #3",
                    questionItem: {
                        question: {
                            required: false,
                            textQuestion: {
                                paragraph: false
                            }
                        }
                    }
                },
                {
                    title: "Frequency",
                    questionItem: {
                        question: {
                            required: true,
                            choiceQuestion: {
                                type: "RADIO",
                                options: [
                                    { value: "Weekly" },
                                    { value: "Biweekly" },
                                    { value: "Monthly" },
                                    { value: "Once" }
                                ]
                            }
                        }
                    }
                },
                {
                    title: "Email Address",
                    questionItem: {
                        question: {
                            required: true,
                            textQuestion: {
                                paragraph: false
                            }
                        }
                    }
                }
            ]
        };

        // Create the form using Forms API
        const response = await gapi.client.forms.forms.create({
            resource: form
        });

        const formId = response.result.formId;
        localStorage.setItem("userFormId", formId);

        // Get the form URL
        const formUrl = `https://docs.google.com/forms/d/${formId}/viewform`;

        // Try to create a linked sheet (optional)
        try {
            await createLinkedSheet(formId);
        } catch (sheetError) {
            console.log("Could not automatically link sheet. Please link manually in Google Forms settings.");
            showNotification("Form created! Please manually link a Google Sheet in Forms settings.");
        }

        return formUrl;
    } catch (error) {
        console.error("Error creating form:", error);
        throw error;
    }
}

async function createLinkedSheet(formId) {
    try {
        // Create a new spreadsheet
        const spreadsheet = {
            properties: {
                title: "Lesson Responses"
            }
        };

        const sheetResponse = await gapi.client.sheets.spreadsheets.create({
            resource: spreadsheet
        });

        const sheetId = sheetResponse.result.spreadsheetId;
        localStorage.setItem("userSheetId", sheetId);

        // Link the form to the sheet
        await gapi.client.forms.forms.batchUpdate({
            formId: formId,
            resource: {
                requests: [{
                    createItem: {
                        item: {
                            title: "Form Responses",
                            questionGroupItem: {
                                questions: [],
                                grid: {
                                    columns: {
                                        type: "RADIO"
                                    }
                                }
                            }
                        },
                        location: {
                            index: 0
                        }
                    }
                }]
            }
        });

        return sheetId;
    } catch (error) {
        console.error("Error creating linked sheet:", error);
        throw error;
    }
}

// Data Fetching and Display
async function fetchData() {
    const sheetId = localStorage.getItem("userSheetId");
    if (!sheetId) {
        showNotification("No sheet linked. Please create your form first.");
        return;
    }

    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: "Form Responses 1"
        });

        const rows = response.result.values;
        if (!rows || rows.length <= 1) {
            showNotification("No responses found yet.");
            return;
        }

        populateTable(rows);
    } catch (error) {
        console.error("Error fetching data:", error);
        showNotification("Failed to load form responses.");
    }
}

function populateTable(data) {
    const tableBody = document.getElementById('submissionsBody');
    tableBody.innerHTML = '';

    data.slice(1).forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row[1]}</td>
            <td>${row[2]}</td>
            <td>${row[3]} - ${row[4]}</td>
            <td>${row[5]} - ${row[6]}</td>
            <td>${row[7]} - ${row[8]}</td>
            <td>${row[9]}</td>
            <td>${row[10]}</td>
        `;
        tableBody.appendChild(tr);
    });
}

// Schedule Generation and Management
document.getElementById('generateSchedule').addEventListener('click', () => {
    const submissions = Array.from(document.querySelectorAll('#submissionsBody tr')).map(tr => {
        return [
            tr.children[0].textContent,
            tr.children[1].textContent,
            tr.children[2].textContent,
            tr.children[3].textContent,
            tr.children[4].textContent,
            tr.children[5].textContent,
            tr.children[6].textContent
        ];
    });
    
    const weeklySchedule = createWeeklySchedule(submissions);
    displayScheduleToTeacher(weeklySchedule);
});

function createWeeklySchedule(submissions) {
    currentSchedule = {};
    DAYS.forEach(day => currentSchedule[day] = []);

    submissions.forEach(row => {
        const [name, category, pref1, pref2, pref3, frequency, email] = row;
        let assigned = false;

        for (const preference of [pref1, pref2, pref3]) {
            if (!preference) continue;
            
            const [day, time] = preference.split(' - ');
            if (!day || !time) continue;

            if (!currentSchedule[day].some(entry => entry.time === time)) {
                currentSchedule[day].push({ 
                    name, 
                    lessonCategory: category, 
                    time,
                    frequency,
                    email
                });
                assigned = true;
                break;
            }
        }

        if (!assigned) {
            showNotification(`No available slots for ${name}. Please assign manually.`);
        }
    });

    return currentSchedule;
}

function displayScheduleToTeacher(schedule) {
    const scheduleTable = document.getElementById('scheduleTable').getElementsByTagName('tbody')[0];
    scheduleTable.innerHTML = '';

    TIME_SLOTS.forEach(time => {
        const row = document.createElement('tr');
        const timeCell = document.createElement('td');
        timeCell.textContent = time;
        row.appendChild(timeCell);

        DAYS.forEach(day => {
            const cell = document.createElement('td');
            cell.setAttribute('data-day', day);
            cell.setAttribute('data-time', time);

            const scheduled = schedule[day]?.find(entry => entry.time === time);
            
            if (scheduled) {
                cell.textContent = `${scheduled.name} (${scheduled.lessonCategory})`;
                cell.style.backgroundColor = "#e8f5e9"; // Light green for scheduled
            }

            // Drag and drop setup
            cell.draggable = true;
            cell.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text', `${day}-${time}`);
            });

            cell.addEventListener('dragover', (e) => e.preventDefault());
            cell.addEventListener('drop', (e) => {
                e.preventDefault();
                const [draggedDay, draggedTime] = e.dataTransfer.getData('text').split('-');
                moveLesson(draggedDay, draggedTime, day, time);
            });

            // Right-click to mark as missed
            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (scheduled) {
                    if (confirm(`Mark ${scheduled.name}'s lesson as missed?`)) {
                        markLessonAsMissed(day, time, scheduled.name);
                    }
                }
            });

            row.appendChild(cell);
        });

        scheduleTable.appendChild(row);
    });
}

function moveLesson(fromDay, fromTime, toDay, toTime) {
    if (![fromDay, fromTime, toDay, toTime].every(Boolean)) return;

    currentSchedule[fromDay] ??= [];
    currentSchedule[toDay] ??= [];

    const fromIndex = currentSchedule[fromDay].findIndex(entry => entry.time === fromTime);
    if (fromIndex === -1) return;

    const toIndex = currentSchedule[toDay].findIndex(entry => entry.time === toTime);
    const lesson = currentSchedule[fromDay][fromIndex];

    if (toIndex !== -1) {
        // Swap lessons
        [currentSchedule[fromDay][fromIndex], currentSchedule[toDay][toIndex]] = [
            { ...currentSchedule[toDay][toIndex], time: fromTime },
            { ...lesson, time: toTime }
        ];
    } else {
        // Move to empty slot
        currentSchedule[toDay].push({ ...lesson, time: toTime });
        currentSchedule[fromDay].splice(fromIndex, 1);
    }

    displayScheduleToTeacher(currentSchedule);
}

// Calendar and Email Integration
document.getElementById('finalizeSchedule').addEventListener('click', async () => {
    try {
        await syncScheduleToCalendar(currentSchedule);
        await sendConfirmationEmails(currentSchedule);
        showNotification("Schedule finalized and notifications sent!");
    } catch (error) {
        console.error("Error finalizing schedule:", error);
        showNotification("Failed to complete all finalization steps.");
    }
});

async function syncScheduleToCalendar(schedule) {
    try {
        const calendarId = 'primary';
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        for (const [day, slots] of Object.entries(schedule)) {
            for (const slot of slots.filter(s => s.name)) {
                const date = getNextWeekday(day);
                const startTime = new Date(`${date}T${convertTo24Hour(slot.time)}:00`);
                const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

                await gapi.client.calendar.events.insert({
                    calendarId,
                    resource: {
                        summary: `Lesson with ${slot.name} (${slot.lessonCategory})`,
                        description: `Frequency: ${slot.frequency}\nEmail: ${slot.email}`,
                        start: { dateTime: startTime.toISOString(), timeZone },
                        end: { dateTime: endTime.toISOString(), timeZone },
                        reminders: {
                            useDefault: false,
                            overrides: [
                                {method: 'email', minutes: 24 * 60},
                                {method: 'popup', minutes: 30}
                            ]
                        }
                    }
                });
            }
        }
    } catch (error) {
        console.error("Error syncing to calendar:", error);
        throw error;
    }
}

async function sendConfirmationEmails(schedule) {
    try {
        const studentSlots = {};
        
        for (const [day, slots] of Object.entries(schedule)) {
            for (const slot of slots.filter(s => s.name)) {
                if (!studentSlots[slot.email]) {
                    studentSlots[slot.email] = {
                        name: slot.name,
                        slots: []
                    };
                }
                studentSlots[slot.email].slots.push(`${day} at ${slot.time}`);
            }
        }

        for (const [email, data] of Object.entries(studentSlots)) {
            const subject = `Your Lesson Schedule Confirmation`;
            const message = `
                Hello ${data.name},<br><br>
                Your lesson(s) have been scheduled for:<br><br>
                ${data.slots.join('<br>')}<br><br>
                Please reply to this email if you need to reschedule.<br><br>
                Thank you!<br>
                Your Music Teacher
            `;

            await gapi.client.gmail.users.messages.send({
                userId: 'me',
                resource: {
                    raw: btoa(
                        `To: ${email}\r\n` +
                        `Subject: ${subject}\r\n` +
                        `Content-Type: text/html; charset=UTF-8\r\n\r\n` +
                        message
                    ).replace(/\+/g, '-').replace(/\//g, '_')
                }
            });
        }
    } catch (error) {
        console.error("Error sending emails:", error);
        throw error;
    }
}

// Missed Lessons Tracking
async function markLessonAsMissed(day, time, studentName) {
    try {
        const sheetId = localStorage.getItem("userSheetId");
        if (!sheetId) throw new Error("No sheet linked");

        await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: sheetId,
            range: MISSED_LESSONS_SHEET,
            valueInputOption: "RAW",
            resource: {
                values: [[
                    new Date().toISOString(),
                    studentName,
                    `${day} at ${time}`,
                    "Missed"
                ]]
            }
        });
        
        showNotification(`Marked ${studentName}'s lesson as missed`);
    } catch (error) {
        console.error("Error marking lesson as missed:", error);
        showNotification("Failed to mark lesson as missed");
    }
}

// Utility Functions
function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`;
    }).join(''));

    return JSON.parse(jsonPayload);
}

function getNextWeekday(day) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const targetDay = days.indexOf(day);
    const today = new Date();
    const currentDay = today.getDay();
    
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) daysToAdd += 7;
    
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysToAdd);
    return nextDate.toISOString().split('T')[0];
}

function convertTo24Hour(timeStr) {
    const [time, modifier] = timeStr.split(/(am|pm)/);
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') hours = '00';
    if (modifier === 'pm') hours = parseInt(hours, 10) + 12;
    
    return `${hours}:${minutes || '00'}`;
}

function showNotification(message) {
    const notificationDiv = Object.assign(document.createElement('div'), {
        textContent: message,
        style: `
            position: fixed; 
            bottom: 20px; 
            right: 20px; 
            background-color: #ff5722;
            color: white; 
            padding: 12px 20px; 
            border-radius: 5px; 
            z-index: 1000;
            font-size: 16px; 
            display: flex; 
            align-items: center; 
            justify-content: space-between;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `
    });

    const closeButton = Object.assign(document.createElement('span'), {
        textContent: '✖',
        style: `
            cursor: pointer; 
            font-size: 16px; 
            margin-left: 10px;
        `,
        onclick: () => notificationDiv.remove()
    });

    notificationDiv.appendChild(closeButton);
    document.body.appendChild(notificationDiv);
    setTimeout(() => notificationDiv.remove(), 5000);
}

// Button Handlers
document.getElementById('refreshDataBtn').addEventListener('click', async () => {
    try {
        await fetchData();
        showNotification("Data refreshed successfully!");
    } catch (error) {
        console.error("Error refreshing data:", error);
        showNotification("Failed to refresh data.");
    }
});

document.getElementById('resetScheduleBtn').addEventListener('click', () => {
    if (confirm("Are you sure you want to reset the schedule? All changes will be lost.")) {
        currentSchedule = {};
        displayScheduleToTeacher(currentSchedule);
        showNotification("Schedule has been reset");
    }
});

document.getElementById('signOutButton').addEventListener('click', () => {
    google.accounts.id.disableAutoSelect();
    google.accounts.oauth2.revoke(gapi.client.getToken().access_token);
    gapi.client.setToken(null);
    window.location.reload();
});

// Initialize the app
document.addEventListener("DOMContentLoaded", () => {
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.onload = loadGapi;
    document.body.appendChild(script);
});