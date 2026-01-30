# Expense Tracker

A modern, offline-first expense tracking Progressive Web App (PWA) built with Next.js, MongoDB Atlas, and Google OAuth.

## Features

- 🔐 **Google OAuth Authentication** - Secure sign-in with your Google account
- 💾 **Offline-First** - Works without internet using IndexedDB, syncs when online
- 📊 **Reports & Analytics** - Visual insights with charts and category breakdowns
- 📱 **PWA Support** - Install as an app on mobile and desktop
- 🌙 **Dark Mode** - System-aware theme with manual toggle
- 📥 **Export Data** - Download your expenses as CSV or Excel
- 🏷️ **Custom Categories** - Create and manage your own expense categories
- 💰 **Budget Tracking** - Set and monitor monthly budgets per category

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: MongoDB Atlas
- **Authentication**: NextAuth.js v5 with Google OAuth
- **Offline Storage**: Dexie.js (IndexedDB)
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Icons**: Lucide React
- **PWA**: next-pwa

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account
- Google OAuth credentials

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up MongoDB Atlas

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user
3. Whitelist your IP address (or use 0.0.0.0/0 for Vercel deployment)
4. Get your connection string

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure OAuth consent screen
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (production)
7. Copy Client ID and Client Secret

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Generate NEXTAUTH_SECRET: `openssl rand -base64 32`

### 5. Run Development Server

```bash
npm run dev

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
