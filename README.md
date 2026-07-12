# TransitOps 🚛

TransitOps is a modern, end-to-end Smart Transport Operations Platform designed to digitize vehicle, driver, dispatch, maintenance, and expense management. It eliminates the need for messy spreadsheets by providing a centralized dashboard with strict business rules, real-time status transitions, and actionable operational insights.

---

## 🌟 Key Features

- **Role-Based Access Control (RBAC):** Secure authentication tailored for Fleet Managers, Drivers, Safety Officers, and Financial Analysts.
- **Dynamic KPI Dashboard:** Real-time visibility into Fleet Utilization, Active/Pending Trips, Vehicle Statuses, and Operational Costs.
- **Smart Trip Dispatching:** Automated validation ensures cargo doesn't exceed vehicle capacity, prevents double-booking of drivers/vehicles, and blocks drivers with expired licenses.
- **Automated Status Transitions:** Dispatching a trip or logging maintenance automatically updates the status of the associated vehicles and drivers across the entire platform.
- **Maintenance & Expense Tracking:** Log maintenance records and fuel consumption to automatically calculate total operational costs and vehicle ROI.
- **Modern UI/UX:** Built with a beautiful, responsive, glassmorphic interface that includes a dark/light mode toggle and optimized data tables.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 (via Vite)
- **Styling:** Tailwind CSS v4
- **Routing:** React Router DOM v6
- **Charts:** Recharts
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs

---

## 🚀 Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
- Node.js (v18 or higher recommended)
- PostgreSQL running locally or via a cloud provider

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/transitops.git
cd transitops
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with the following variables:
```env
PORT=5000
DATABASE_URL="postgresql://username:password@localhost:5432/transitops?schema=public"
JWT_SECRET="your_super_secret_jwt_key_here"
```

Initialize the database and run the seed script to populate realistic fake data:
```bash
# Push the schema to your database
npx prisma db push

# Generate the Prisma client
npx prisma generate

# Seed the database with fake data
node seed.js
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```

Start the Vite development server:
```bash
npm run dev
```

The application will be running at `http://localhost:5173`.

---

## 👥 User Roles (For Testing)
When you run the seed script, the following default users are created (Password for all: `password123`):
- **Fleet Manager:** `admin@transitops.com`
- **Finance Lead:** `finance@transitops.com`
- **Safety Officer:** `safety@transitops.com`

---

## 📜 License
This project was built for the Odoo Hackathon 2026. Feel free to use and modify the code as needed.
