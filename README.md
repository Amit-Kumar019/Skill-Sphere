# 🌌 Skill Sphere: Premium Freelance & Bidding Marketplace

Skill Sphere is a premium, multi-role freelance marketplace where clients can post projects with budget metrics, timelines, and milestones, and freelancers can build professional profiles, upload PDF credentials, and submit bidding proposals.

---

## 🚀 Key Modules & Feature Status

- [x] **Multi-Role Authentication (Module 1)**: Login/Signup, Role selectors (Freelancer, Client, Admin), JWT session cookies, Email Verification pipelines, password reset recovery, and **Google OAuth 2.0 Sign-In**.
- [x] **Client & Freelancer Professional Profiles (Module 3)**: Multi-step setup wizard, professional bio summaries, hourly rate limits, dynamic skill tags, certification grids, avatar uploads, and **Cloudinary-hosted PDF resume storage**.
- [x] **Gig / Project Marketplace (Module 4)**: Job creation forms with min/max budget controls, document attachments, target dates, and **Dynamic Milestones Allocation Calculators**. Advanced keyword and category search explorer.
- [x] **Proposals & Bidding System (Module 5)**: Freelancer cover letters, bid rates, delivery duration estimates, document attachments, and client-side review dashboards to hire or reject applicants.

---

## 🛠️ Technology Stack

| Layer | Technology | Key Dependencies |
| :--- | :--- | :--- |
| **Backend** | Node.js + Express.js | Mongoose (MongoDB), JWT, bcrypt, Cookie-Parser, Multer, Cloudinary SDK, Nodemailer |
| **Frontend** | React (Vite) + TypeScript | Lucide-React, React-Router-Dom, Vanilla CSS |
| **Storage** | MongoDB + Cloudinary | Storing user details & gig scopes in MongoDB; streaming logos, avatars, and PDF resumes to Cloudinary |

---

## 📂 Project Structure

```bash
Skill_Sphere/
├── backend/                  # Server configuration, routing, and database models
│   ├── config/               # Database connection and auto-seeding scripts
│   ├── controllers/          # Business logic (Auth, Profiles, Gigs, Proposals)
│   ├── middleware/           # JWT authenticators and Multer file parsers
│   ├── models/               # MongoDB Mongoose Schemas (Users, Gigs, Proposals, etc.)
│   ├── routes/               # API route maps
│   ├── utils/                # Cloudinary uploads and mail dispatch helpers
│   ├── .env.example          # Environment variables template
│   └── server.js             # Application entry point
│
├── frontend/                 # Client React single-page application
│   ├── src/
│   │   ├── components/       # Reusable overlays (ProtectedRoute, EditProfile modal)
│   │   ├── context/          # Auth session state provider
│   │   ├── pages/            # View pages (Login, Gigs list, GigDetails, Profile Setup)
│   │   ├── App.tsx           # Router mappings and shell layout
│   │   ├── index.css         # Curated theme stylesheet (slate/violet dark mode)
│   │   └── main.tsx          # React bundler mount
│
└── learning.md               # Visual, CSS, and SDK integration logs
```

---

## ⚙️ Local Setup Guide

### 1. Prerequisites
Ensure you have **Node.js** (v18+) and **MongoDB** installed and running on your local machine.

### 2. Backend Installation & Config
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install node dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` file by duplicating the provided template:
   ```bash
   cp .env.example .env
   ```
4. Configure your credentials inside `.env` (MongoDB URI, JWT secrets, SMTP mail user/password, and Cloudinary keys).
5. Start the backend development server:
   ```bash
   npm run dev
   ```
   *Note: On first startup, the connection script will automatically detect empty collections and **auto-seed** lookup Category and Skill tables in your MongoDB database.*

### 3. Frontend Installation & Run
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install client dependencies:
   ```bash
   npm install
   ```
3. Set your Google Web Client ID inside `vite.config.ts` or as `VITE_GOOGLE_CLIENT_ID` in your environment (for Google pop-up sign-in).
4. Run the frontend local server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173`.

---

## 🧪 Testing the Onboarding & Bidding Flows

* **Database Seeding**: Check the backend console output for: `Database seeded successfully with Categories and Skills!`.
* **Registration**: Register a new Client account and a new Freelancer account, or use existing local DB users.
* **Onboarding**: Log in with either account. The Dashboard will prompt you with a warning banner to complete your profile setup. Walk through the wizards to upload avatars/resumes and configure rates.
* **Marketplace posting**: Log in as a Client, click **Post a Gig**, assign budget amounts, add milestones, and upload project scopes.
* **Bidding**: Log in as a Freelancer, click **Explore Gigs**, find the posted gig, and fill out a cover letter, bid amount, and attachments.
* **Hiring**: Log in as the Client, view submitted bids, and click **Accept & Hire** on the candidate. The gig status will shift to `In Progress` and other pending applications will automatically reject.
