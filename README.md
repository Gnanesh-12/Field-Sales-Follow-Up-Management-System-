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

## 📝 License

This project is proprietary and confidential. Unauthorized copying, distribution, or modification of this project is strictly prohibited.
