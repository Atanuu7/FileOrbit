# 🌌 FileOrbit

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

**FileOrbit** is a premium, minimalist file-sharing web application built for the modern web. It enables secure, anonymous file transfers with zero footprint. Upload files, generate 6-digit relay codes, and share them instantly via QR codes.

---

## ✨ Features

- **🛸 Orbital Relay**: Generate unique 6-digit alphanumeric codes for secure file retrieval.
- **🛡️ High-Security Encryption**: Optional password protection for sensitive files using industry-standard Bcrypt hashing.
- **🧪 Nano-link Expiry**: Files automatically vanish after 10 minutes or reaching a custom download limit.
- **📱 QR Code Sharing**: Instant mobile access via dynamically generated QR codes.
- **🌈 Premium Aesthetics**: A stunning "Glassmorphism" UI with smooth orbital animations and dark/light mode support.
- **⚡ Fast Integration**: Direct uplink to Cloudinary for high-speed file storage and retrieval.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/) (Vite)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (Future-proof CSS)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Components**: Custom Glassmorphism UI components

### Backend
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express 5](https://expressjs.com/)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Mongoose)
- **Cloud Storage**: [Cloudinary](https://cloudinary.com/)
- **Cron Jobs**: [Node-Cron](https://www.npmjs.com/package/node-cron) for automated data purging

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/Atanuu7/FileOrbit.git
cd FileOrbit
```

### 2. Environment Setup

#### Server Configuration (`server/.env`)
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Client Configuration (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api/files
```

### 3. Install & Run

**Start the Backend:**
```bash
cd server
npm install
node index.js
```

**Start the Frontend:**
```bash
cd client
npm install
npm run dev
```

---

## 📂 Project Structure

```text
FileOrbit/
├── server/
│   ├── src/
│   │   ├── config/      # Database & Cloudinary initialization
│   │   ├── models/      # Mongoose Schemas
│   │   ├── routes/      # REST API Endpoints
│   │   └── utils/       # Cleanup Cron Jobs
│   └── index.js         # Entry Point
├── client/
│   ├── src/
│   │   ├── components/  # Atomic UI Components
│   │   ├── App.jsx      # Main Logic & Routing
│   │   └── index.css    # Tailwind v4 & Design Tokens
│   └── public/          # Static Assets
└── README.md
```

---

## 🚀 Deployment

### Backend (Render / Railway)
1. Set the root directory to `server/`.
2. Add all environment variables from `.env.example`.
3. Build Command: `npm install`.
4. Start Command: `node index.js`.

### Frontend (Vercel)
1. Set the root directory to `client/`.
2. Add `VITE_API_URL` environment variable.
3. Vercel will auto-detect Vite settings.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ by <b>Atanu</b> for a secure and anonymous web.
</p>
