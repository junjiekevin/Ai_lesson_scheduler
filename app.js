// Fetching data from Google Sheets
document.getElementById('fetchData').addEventListener('click', async () => {
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
});

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

// Erro notification function
function showNotification(message) {
    // Create notification div
    const notificationDiv = document.createElement('div');
    notificationDiv.style.position = 'fixed';
    notificationDiv.style.bottom = '20px';
    notificationDiv.style.right = '20px';
    notificationDiv.style.backgroundColor = '#ff3333'; // Notification background color
    notificationDiv.style.color = '#fff'; // Text color
    notificationDiv.style.padding = '30px 40px'; // Increased padding
    notificationDiv.style.borderRadius = '5px';
    notificationDiv.style.zIndex = '1000'; // Make sure it's on top
    notificationDiv.style.fontSize = '30px'; // Text size
    notificationDiv.style.display = 'flex'; // Use flex to align items

    // Create close button
    const closeButton = document.createElement('span');
    closeButton.textContent = 'X'; // Close button text
    closeButton.style.marginLeft = 'auto'; // Push the close button to the right
    closeButton.style.cursor = 'pointer'; // Change cursor to pointer
    closeButton.style.fontSize = '20px'; // Size of close button
    closeButton.style.color = '#fff'; // Close button color

    // Add click event to close the notification
    closeButton.addEventListener('click', () => {
        notificationDiv.remove(); // Remove notification on click
    });

    // Append close button to notification div
    notificationDiv.appendChild(document.createTextNode(message)); // Add the message
    notificationDiv.appendChild(closeButton); // Add close button to the notification

    // Append notification div to body
    document.body.appendChild(notificationDiv);
}

// Create weekly schedule based on student submissions
function createWeeklySchedule(submissions) {
    const schedule = {};
    const assignedTimes = {}; // Track assigned times

    submissions.forEach(row => {
        const name = row[0];  // Full Name
        const lessonCategory = row[1]; // Lesson Category
        const preferences = [
            row[2], // Preferred Day / Time 1
            row[3], // Preferred Day / Time 2
            row[4]  // Preferred Day / Time 3
        ];

        let assigned = false; // Flag to check if assigned a time

        // Using loop to allow break
        for (const preference of preferences) {
            if (preference) {
                const [day, time] = preference.split(' - '); // Split into day and time

                // Initialize schedule for the day if it doesn't exist
                if (!schedule[day]) {
                    schedule[day] = [];
                }

                // Check if this time is already assigned
                const isTimeTaken = schedule[day].some(entry => entry.time === time);

                if (!isTimeTaken) {
                    // If not taken, assign this time slot
                    schedule[day].push({ name, lessonCategory, time });
                    assignedTimes[`${day}-${time}`] = true; // Mark this time as assigned
                    assigned = true; // Mark as assigned
                    break; // Exit the loop after assignment
                }
            }
        }

        // If no preferred time slot was available, notify
        if (!assigned) {
            showNotification(`Note: No available time slots for ${name} (${lessonCategory})`); // Notificaiton UI
        }
    });

    return schedule;
}

// Function to display AI suggested schedule in structured table
function displayScheduleToTeacher(schedule) {
    const scheduleTable = document.getElementById('scheduleTable').getElementsByTagName('tbody')[0];
    scheduleTable.innerHTML = '';  // Clear previous schedule
    const timeSlots = [
        "9:00am", "10:00am", "11:00am", "12:00pm", 
        "1:00pm", "2:00pm", "3:00pm", "4:00pm", 
        "5:00pm", "6:00pm", "7:00pm", "8:00pm", "9:00pm"
    ];
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    // Create rows for each time slot
    timeSlots.forEach(time => {
        const row = document.createElement('tr');
        const timeCell = document.createElement('td');
        timeCell.textContent = time; // Add the time slot
        row.appendChild(timeCell);

        // Populate each day's cell
        days.forEach(day => {
            const cell = document.createElement('td');
            const entries = schedule[day] || []; // Get entries for the day or empty array
            const scheduled = entries.find(entry => entry.time === time); // Check if student is scheduled at this time
            
            if (scheduled) {
                cell.textContent = `${scheduled.name} (${scheduled.lessonCategory})`; // Format: student_name (lesson_cat)
            } else {
                cell.textContent = ''; // Leave empty if no one is scheduled
            }

            row.appendChild(cell); // Add cell to the row
        });

        scheduleTable.appendChild(row); // Add the row to the table
    });
}

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