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
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
expense-tracker/
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── api/             # API routes
│   │   ├── auth/            # Authentication pages
│   │   └── dashboard/       # Dashboard pages
│   ├── components/          # React components
│   ├── lib/                 # Utilities and database
│   └── auth.ts             # NextAuth configuration
├── public/                  # Static assets
└── docs/                    # Documentation
```

## Documentation

- [SETUP.md](SETUP.md) - Detailed setup instructions
- [QUICKSTART.md](QUICKSTART.md) - 5-minute getting started guide
- [IMPLEMENTATION.md](IMPLEMENTATION.md) - Complete feature list and architecture
- [CHECKLIST.md](CHECKLIST.md) - Pre-launch testing checklist

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

**Note**: Update Google OAuth redirect URIs with your Vercel domain.

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Render
- DigitalOcean App Platform

## Usage

1. **Sign In** - Use your Google account to authenticate
2. **Add Expenses** - Track daily transactions with categories
3. **View Dashboard** - See spending overview and statistics
4. **Generate Reports** - Analyze spending patterns with charts
5. **Export Data** - Download CSV or Excel reports
6. **Offline Mode** - Add expenses offline, auto-syncs when online

## Features in Detail

### Offline-First Architecture
- All data stored locally in IndexedDB
- Automatic background sync when connection restored
- Optimistic UI updates for instant feedback

### Reports & Analytics
- Monthly spending breakdown
- Category-wise distribution (pie charts)
- Transaction history with filters
- Export to CSV/Excel

### PWA Support
- Install as native app on mobile/desktop
- Offline functionality
- Push notifications (future feature)
- Background sync

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions, please create an issue on GitHub.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Lucide](https://lucide.dev/)
- Charts by [Recharts](https://recharts.org/)
