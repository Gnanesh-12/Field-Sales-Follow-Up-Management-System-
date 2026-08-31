# Field Sales Follow-Up Management System - Tech Stack

This document outlines the technologies and libraries used across the different components of the Field Sales Follow-Up Management System. The system is divided into three main parts: Backend, Admin Dashboard, and Employee Mobile Application.

## 1. Backend

The backend is built with a robust, scalable architecture using Node.js and NestJS, providing RESTful APIs for both the Admin and Employee clients.

**Core Technologies:**
- **Framework:** NestJS (Node.js) - Chosen for its modular architecture and TypeScript support.
- **Language:** TypeScript
- **Database ORM:** Prisma - Provides type-safe database access and schema migrations.
- **Database Systems:** PostgreSQL (Primary production database via `pg`) & SQLite (`better-sqlite3` adapter integration).

**Authentication & Security:**
- **Strategy:** JWT (JSON Web Tokens) with Passport.js (`@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`).
- **Password Hashing:** bcryptjs

**Utilities & Features:**
- **File Uploads:** Multer (integrated via NestJS) for handling image and document uploads.
- **Environment Management:** dotenv
- **Reactivity:** RxJS (Core to NestJS architecture).

**Development & Testing:**
- **Testing:** Jest & Supertest (for E2E and Unit testing).
- **Linting & Formatting:** ESLint & Prettier.

---

## 2. Admin (Web Dashboard)

The admin panel is a modern, responsive single-page web application (SPA) built for managing the field sales operations, users, and monitoring activities.

**Core Technologies:**
- **Library:** React (v18)
- **Language:** TypeScript
- **Build Tool:** Vite - For extremely fast development server and optimized production builds.

**Styling & UI:**
- **CSS Framework:** Tailwind CSS (v4) - Utility-first styling with PostCSS integration.
- **Icons:** Lucide React - Clean, modern vector icons.

**Networking & State:**
- **HTTP Client:** Axios - For making API requests to the backend.

**Development Tools:**
- **Linting:** ESLint (with React hooks and refresh plugins for Vite).

---

## 3. Employee (Mobile Application)

The employee application is a cross-platform mobile app designed for field sales representatives to track their visits, locations, and submit reports on the go.

**Core Technologies:**
- **Framework:** Flutter - Allows building natively compiled applications for mobile from a single codebase.
- **Language:** Dart

**State Management & Architecture:**
- **State Management:** Riverpod (`flutter_riverpod`) - A reactive caching and data-binding framework.

**Device Features & Integrations:**
- **Location Services:**
  - `geolocator`: For fetching GPS coordinates of the employee.
  - `geocoding`: For reverse-geocoding coordinates to physical addresses.
- **Media:** `image_picker` - For capturing photos of customer sites or documents.
- **Local Storage:** `flutter_secure_storage` - For securely storing authentication tokens locally on the device.

**Networking & Utilities:**
- **HTTP Client:** `http` package - For communicating with the backend APIs.
- **Typography:** `google_fonts`
- **Formatting:** `intl` (for date and number formatting).
- **Unique IDs:** `uuid` - For generating unique local identifiers when offline or caching.

**Development & Testing:**
- **Testing:** `flutter_test`, `mocktail` (for mocking dependencies in unit tests).
- **Linting:** `flutter_lints`
