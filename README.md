# Field Sales Follow-Up Management System

A comprehensive, full-stack monorepo application designed to manage and track field sales operations efficiently. The system empowers field sales executives with a mobile application to log their daily field visits, follow-ups, and materials supplied, while providing a web-based dashboard for administrators to monitor field activities, employee performance, and manage customer sites.

## 🚀 Features

### For Administrators (Web Panel)
- **Employee Management:** Add, activate/deactivate, and track field sales personnel.
- **Customer & Site Management:** Maintain a registry of customers and their geo-tagged locations.
- **Activity Monitoring:** Review field visits, follow-ups, employee locations, attachments, and material supplies submitted by field executives in real-time.
- **Approval Workflow:** Approve or reject submitted field visits.

### For Field Executives (Mobile App)
- **Daily Operations:** Log field visits with detailed notes, status, and associated materials.
- **Location Tracking:** Geo-tag field visits automatically for accurate reporting.
- **Evidence Collection:** Attach images to field visit reports as proof of visit or site conditions.
- **Follow-ups:** Schedule and track upcoming follow-ups with customers.
- **Secure Access:** First-time login with PIN setup and secure token-based authentication.

---

## 🛠️ Technology Stack

This project is built using a modern, scalable technology stack and follows a monorepo architecture with three main components:

### 1. Backend API (`/backend`)
- **Framework:** [NestJS](https://nestjs.com/) (Node.js framework)
- **Database:** MongoDB
- **ORM:** [Prisma](https://www.prisma.io/)
- **Authentication:** JWT (JSON Web Tokens) with Passport
- **Language:** TypeScript

### 2. Admin Dashboard (`/admin`)
- **Framework:** [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling:** Tailwind CSS v4 & PostCSS
- **Icons:** Lucide React
- **HTTP Client:** Axios
- **Language:** TypeScript

### 3. Employee Mobile App (`/employee`)
- **Framework:** [Flutter](https://flutter.dev/) (Dart)
- **State Management:** Riverpod
- **Local Storage:** Flutter Secure Storage
- **Geolocation:** Geolocator & Geocoding
- **Media:** Image Picker

---

## 📂 Project Structure

```plaintext
Field-Sales-Follow-Up-Management-System/
├── admin/                  # Web dashboard for administrators (React/Vite)
├── backend/                # RESTful API serving both admin and employee apps (NestJS)
├── employee/               # Cross-platform mobile application (Flutter)
└── README.md               # Project documentation
```

---

## 🚦 Getting Started

### Prerequisites
Before running the application, ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Flutter SDK](https://docs.flutter.dev/get-started/install) (for the mobile app)
- A connected physical device or emulator (Android/iOS)

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Initialize Prisma & generate client
npx prisma generate

# Sync database schema to MongoDB
npx prisma db push

# (Optional) Seed the database with initial admin user and sample data
npm run prisma:seed

# Start the development server
npm run start:dev
```
*The backend API will run on `http://localhost:3000`.*

### 2. Admin Panel Setup

```bash
# Navigate to the admin directory (in a new terminal)
cd admin

# Install dependencies
npm install

# Start the development server
npm run dev
```
*The admin panel will be accessible at `http://localhost:5173`.*

### 3. Employee App Setup

```bash
# Navigate to the employee directory (in a new terminal)
cd employee

# Get Flutter dependencies
flutter pub get

# Run the app on a connected device/emulator
flutter run
```

---

## 🗄️ Database Schema Overview

The system relies on a well-structured relational database with the following core entities:
- **Employee & Admin:** Handles user roles and authentication.
- **CustomerSite:** Represents physical locations of customers.
- **FieldVisit:** The central entity logging a visit, linked to an employee, site, location, and status.
- **FollowUp:** Tasks scheduled for future customer interactions.
- **Location & Attachment:** Geo-coordinates and media files linked to field visits.
- **Material & MaterialSupply:** Tracks inventory/materials provided during a visit.

---

## 📧 Email Integration (Phase 1)

Kshetra now includes secure, direct-from-employee email sending via the Gmail API. Employees can connect their existing Gmail accounts securely via Google OAuth to send emails and field visit reports directly from the app.

### 1. Google Cloud Setup (Production)
To enable Gmail API sending, you must configure a project in the Google Cloud Console:
1. **Enable the Gmail API**: In your Google Cloud project, navigate to **APIs & Services > Library** and enable the "Gmail API".
2. **OAuth Consent Screen**:
   - Set the User Type to **External** (or Internal if using Google Workspace).
   - Add the necessary scope: `https://www.googleapis.com/auth/gmail.send`.
   - Add your application name, support email, and developer contact info.
3. **Create OAuth Client**:
   - Navigate to **APIs & Services > Credentials** and click **Create Credentials > OAuth client ID**.
   - Select **Web application** as the application type.
   - Add your authorized redirect URIs. For local development, this is typically `http://localhost:3000/email/gmail/callback/web`. For production, use your deployed backend URL.
4. **Environment Variables**:
   Add the generated Client ID and Client Secret to your backend environment (or Render dashboard):
   ```env
   GOOGLE_CLIENT_ID="your_client_id_here"
   GOOGLE_CLIENT_SECRET="your_client_secret_here"
   GOOGLE_REDIRECT_URI="https://your-backend.onrender.com/email/gmail/callback/web"
   GMAIL_SCOPES="https://www.googleapis.com/auth/gmail.send"
   EMAIL_PROVIDER="gmail" # Use 'gmail' in production
   ```

### 2. Local Testing with Mailpit (Development)
For local development without needing real Gmail accounts or Google Cloud setup, you can use Mailpit to catch and inspect outgoing emails.
1. **Install Mailpit**:
   - Via Docker: `docker run -d -p 1025:1025 -p 8025:8025 axllent/mailpit`
   - Via Homebrew (macOS): `brew install mailpit && mailpit`
2. **Configure Backend**:
   Update your backend `.env` file to use Mailpit:
   ```env
   EMAIL_PROVIDER="mailpit"
   MAILPIT_HOST="localhost"
   MAILPIT_PORT="1025"
   ```
3. **View Emails**:
   Open the Mailpit web interface at `http://localhost:8025` to see all emails sent by the application during development.

---

## 📝 License

This project is proprietary and confidential. Unauthorized copying, distribution, or modification of this project is strictly prohibited.
