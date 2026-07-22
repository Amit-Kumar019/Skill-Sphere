# 🌌 Skill Sphere: Premium Freelance & Bidding Marketplace

Skill Sphere is a state-of-the-art, premium multi-role freelance marketplace. Clients can post complex projects with milestone targets and escrow payments, and freelancers can build verified profiles, showcase portfolios, submit proposals, and chat in real-time. The platform includes full administrative governance and dispute arbitration.

---

## 🚀 Key Modules & Feature Status

- [x] **Multi-Role Authentication (Module 1)**: Login/Signup, role selectors (Freelancer, Client, Admin), JWT session cookies, email verification pipelines, password recovery, and **Google OAuth 2.0 Sign-In**.
- [x] **Professional Onboarding (Module 2)**: Multi-step setup wizard, hourly rates, dynamic skill tags, certification grids, and **Cloudinary-hosted PDF resume storage**.
- [x] **Verification & Portfolios (Module 3)**: Freelancer KYC document uploads (Aadhaar, PAN, selfie), availability schedule settings, and dynamic portfolio galleries with screenshots and source links.
- [x] **Gig Marketplace (Module 4)**: Job creation forms with min/max budget controls, document attachments, target dates, and **Dynamic Milestones Allocation Calculators** with client gig-tracking panels.
- [x] **Bidding & Proposals (Module 5)**: Cover letters, bid rates, delivery duration estimates, document attachments, and client-side dashboards to accept/reject applicants.
- [x] **Real-Time Chat & Inbox (Module 6)**: Double-pane, glassmorphic conversational viewport powered by **Socket.IO**. Supports file attachments, live typing status indicator, and duplicate-prevention message rendering.
- [x] **Milestone Escrow Payments (Module 7)**: Hired milestone releases integrated with **Stripe Checkout Sessions** and a fully detailed **Mock Payment Simulation Modal Gateway** for testing.
- [x] **Reviews & Rating Analytics (Module 8)**: Client-side ratings and comment reviews that dynamically update freelancer average reputation ratings.
- [x] **Real-Time Notification Center (Module 9)**: Database-backed message alerts synced with a live **Bell Widget** and badge indicator in the user dashboard.
- [x] **Admin Governance & Disputes (Module 10)**: Admin dashboards at `/admin` offering user account blocking, KYC document auditing, and escrow dispute resolution arbitrations.

---

## 🛠️ Technology Stack

| Layer | Technology | Key Dependencies |
| :--- | :--- | :--- |
| **Backend** | Node.js + Express.js | Mongoose (MongoDB), Socket.IO, Stripe SDK, JWT, bcrypt, Cookie-Parser, Multer, Cloudinary SDK, Nodemailer |
| **Frontend** | React (Vite) + TypeScript | Socket.IO-Client, Lucide-React, React-Router-Dom, Vanilla CSS |
| **Storage** | MongoDB + Cloudinary | Storing transactions, user details, and gig scopes in MongoDB; streaming files and images to Cloudinary |

---

## 📂 Project Structure

```bash
Skill_Sphere/
├── backend/                  # Express server, Socket.IO listeners, and models
│   ├── config/               # Database connection and seeding scripts
│   ├── controllers/          # Business logic (Auth, Profiles, Gigs, Chat, Payments, Admin)
│   ├── middleware/           # JWT authenticators, CORS filters, and Multer upload limits
│   ├── models/               # MongoDB Mongoose Schemas (Users, Gigs, Disputes, Payments, etc.)
│   ├── routes/               # API endpoints maps
│   ├── utils/                # Cloudinary, Mailers, and Notification broadcasters
│   └── server.js             # Server entry point
│
├── frontend/                 # Client React single-page application
│   ├── src/
│   │   ├── components/       # Common layouts (ProtectedRoute, EditProfile card)
│   │   ├── context/          # Auth context and user session providers
│   │   ├── pages/            # View pages (Dashboard, AdminDashboard, Chat, GigDetails, etc.)
│   │   ├── App.tsx           # Router mappings & routes configuration
│   │   ├── index.css         # Premium dark mode stylesheet (slate/violet styling)
│   │   └── main.tsx          # Client bundle setup
│
└── README.md                 # Project roadmap, tech stack, and setup instructions
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

### 3. Frontend Installation & Run
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install client dependencies:
   ```bash
   npm install
   ```
3. Set your Google Web Client ID inside `vite.config.ts` or as `VITE_GOOGLE_CLIENT_ID` in your environment.
4. Run the frontend local server:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5173`.

---

## 🧪 Testing the Advanced Flows

* **Registration & Onboarding**: Sign up as a Client or Freelancer. Complete the profile setup wizard on your Dashboard to configuration details.
* **KYC Audit**: Log in as a Freelancer, visit your Profile, click **Verify Identity** to upload documents. Log in as an Admin (`role: "admin"`), navigate to `/admin`, and audit the pending KYC.
* **Bidding & Hiring**: As a Client, post a gig with milestones. As a Freelancer, submit a proposal. As a Client, accept the candidate to shift status to `In Progress`.
* **Milestone Payment & Escrow**: On the Gig Details page, the client can click **Pay Milestone** to open the simulation checkout gate. Confirming the mock credentials transitions the milestone status to `Approved` and updates payment status.
* **Escrow Disputes**: If a milestone has been paid but conflict arises, either user can click **Raise Dispute** on that milestone. The dispute will be escalated to the platform admins dashboard under `/admin` for arbitration.
* **Real-Time Inbox**: Hired participants can chat live from the details page. Test live typing notifications, socket file attachments, and automatic scroll-to-bottom features.
