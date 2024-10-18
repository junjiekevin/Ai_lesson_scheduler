# PWA AI Voice Lesson Scheduler

## Project Overview

The **AI Voice Lesson Scheduler** is a Progressive Web App (PWA) designed to simplify and manage **one-on-one voice lessons**. It uses **Google Forms** for student input, **Google Sheets** for data storage, and the **Google Calendar API** to sync finalized schedules. The PWA offers **cost-effective, multi-platform access** across **iOS, Android, and desktop** without requiring a backend, ensuring easy access and seamless scheduling for teachers and students.

---

## Problem Statement

Scheduling lessons manually can be time-consuming and prone to conflicts. This app automates the process by **collecting student preferences** through forms and **suggesting optimal schedules** based on availability. Teachers can easily finalize and sync schedules to Google Calendar, reducing administrative overhead.

---

## Key Features

- **Google Forms Integration**: Collects student information (name, category, preferred times, and frequency).
- **Google Sheets for Data Storage**: Stores all submissions.
- **AI Scheduling Suggestions**: Provides conflict-free, rule-based recommendations.
- **Teacher Finalization Interface**: Allows teachers to review and finalize schedules.
- **Google Calendar Sync**: Finalized schedules are synced to Google Calendar.
- **Offline Access with PWA**: Works seamlessly across devices with offline support.
- **Post-Lesson Notifications**: Confirms completed lessons or tracks missed ones.
- **Cancellations with Messaging**: Option to cancel lessons with custom messages.

---

## Why Use a PWA?

- **Cost-Effective**: No need for backend infrastructure.
- **Multi-Platform Usage**: Works on **iOS, Android, and desktop**.
- **Hosted for Free**: Easily deployable on **GitHub Pages** or **Netlify**.

---

## How to Run the Project Locally

1. **Clone the Repository**:
   git clone https://github.com/YOUR_USERNAME/lesson-scheduler.git
   cd lesson-scheduler
2. **Run a Local Server**:
   npx http-server .
3. **Open the App in Your Browser**:
4. **View Submissions and Finalize Schedules**:
   Use the "View Submissions" button to fetch student preferences.
   Finalize lesson times via the PWA interface.

---

## Workflow

1. **Access the PWA**:  
   Teachers and students access the app via a **shared link** hosted on **GitHub Pages or Netlify**.
2. **Submit Lesson Preferences via Google Forms**:  
   Students fill out:
   - Name and lesson category.
   - Top 3 preferred days and time slots.
   - Frequency (Weekly, Biweekly, Monthly, Once).
3. **View Submissions in the PWA**:  
   Teachers see AI-suggested schedules in the **interface**.
4. **Finalize Schedules and Sync to Google Calendar**:  
   Teachers confirm lesson times, which are synced to **Google Calendar**.
5. **Post-Lesson Confirmation and Missed Lesson Tracking**:  
   Students confirm completed lessons, or missed lessons are logged automatically.

---

## Future Development Plans

1. **Enhanced AI Scheduling Logic**:  
   Implement smarter algorithms to adapt to changing availability.
2. **Develop a Python Backend**:  
   If user interest grows, add backend support to enable advanced features.
3. **Advanced Reporting Features**:  
   Track attendance and missed lessons with detailed analytics.
4. **UI Improvements**:  
   Integrate **TailwindCSS or Bootstrap** for a modern interface.

---

## Technologies Used

- **Google Forms**: Collect student preferences.
- **Google Sheets API**: Store and retrieve submissions.
- **Google Calendar API**: Sync lesson schedules.
- **HTML, CSS, JavaScript**: Build the frontend interface.
- **PWA Support**: Offline functionality using service workers.
- **GitHub Pages / Netlify**: Free hosting for easy access.

---

## Acknowledgments

- **Google Cloud Platform**: For API services.
- **GitHub Pages and Netlify**: For free hosting solutions.
- **Students and Teachers**: For feedback during development.
