# Expense Tracker PWA

A modern, offline-first expense tracking Progressive Web App with comprehensive financial management features.

## ✨ Features

- 🔐 **Secure Authentication** - Google OAuth integration via NextAuth.js v5
- 💾 **Offline-First** - Works without internet, auto-syncs when online
- 📊 **Visual Analytics** - Interactive charts and spending insights
- 📱 **Progressive Web App** - Install on mobile and desktop
- 🌙 **Dark Mode** - Beautiful light/dark theme support
- 📥 **Data Export** - CSV and Excel export with multiple sheets
- 🏷️ **Custom Categories** - Flexible category management
- 💰 **Budget Tracking** - Set and monitor category-based budgets
- 💸 **Income Tracking** - Manage income sources and history
- 🤝 **Loan Management** - Track loans and payment schedules
- 👥 **Contact Management** - Store contact information
- 🔄 **Smart Sync** - Queue-based offline sync system
- 🎯 **Admin Dashboard** - Database migrations and maintenance tools

## 🚀 Tech Stack

- **Framework**: Next.js 16.1.6 (App Router, React 19)
- **Database**: MongoDB Atlas
- **Authentication**: NextAuth.js v5
- **Offline Storage**: Dexie.js v3 (IndexedDB)
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Icons**: Lucide React
- **PWA**: next-pwa
- **Exports**: xlsx, papaparse

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (free tier works)
- Google Cloud Console account

## ⚙️ Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd expense-tracker
npm install
```

### 2. MongoDB Atlas Setup

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a database user with read/write permissions
3. Whitelist IP: `0.0.0.0/0` (for Vercel) or your specific IP
4. Get connection string: **Connect** → **Connect your application** → Copy the URI

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable **Google+ API**
4. **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen (add app name, support email)
6. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.vercel.app/api/auth/callback/google`
7. Copy **Client ID** and **Client Secret**

### 4. Environment Variables

Create `.env.local` in the root directory:

```env
# Database
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/expense-tracker?retryWrites=true&w=majority

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-with-command-below>

# Google OAuth
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-client-secret>

# Admin Access (comma-separated email list)
ADMIN_EMAILS=admin@example.com,developer@example.com
```📁 Project Structure

```
expense-tracker/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── admin/        # Admin endpoints (migrations, indexes)
│   │   │   ├── auth/         # NextAuth endpoints
│   │   │   ├── budgets/      # Budget CRUD
│   │   │   ├── categories/   # Category management
│   │   │   ├── contacts/     # Contact management
│   │   │   ├── expenses/     # Expense CRUD
│   │   │   ├── export/       # CSV/Excel export
│   │   │   ├── incomes/      # Income tracking
│   │   │   ├── loans/        # Loan management
│   │   │   └── sync/         # Offline sync
│   │   ├── auth/            # Auth pages
│   │   ├── admin/           # Admin dashboard
│   │   └── dashboard/       # Main app pages
│   ├── components/          # React components
│   │   ├── budgets/         # Budget components
│   │   ├── filters/         # Filter components
│   │   ├── reports/         # Analytics components
│   │   └── shared/          # Shared UI components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Core utilities
│   │   ├── db.ts           # Dexie IndexedDB setup
│   │   ├── mongodb.ts      # MongoDB connection
│   │   ├── syncUtils.ts    # Offline sync logic
│   │   ├── auth-utils.ts   # Admin authorization
│   │   └── types.ts        # TypeScript types
│   └── auth.ts             # NextAuth configuration
├── public/                  # Static assets & PWA files
└── ADMIN.md                # Admin setup guide
```

## 📖 Documentation

- **[ADMIN.md](ADMIN.md)** - Admin dashboard access and configuration
- **README.md** - This file (setup and features)
- **LICENSE** - MIT License

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub/GitLab
2. Import repository on [Vercel](https://vercel.com)
3. Add environment variables:
   - `MONGODB_URI`
   - `NEXTAUTH_URL` (your Vercel domain)
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `ADMIN_EMAILS` (comma-separated admin emails)
4. Update Google OAuth redirect URIs with Vercel domain
5. Deploy!

### Post-Deployment

1. Sign in with an admin email
2. Visit `/admin` dashboard
3. Run **Database Indexes** to optimize performance
4. Run migrations if upgrading from older versions

### Other Platforms

Compatible with any Next.js hosting platform:
- Netlify
- R📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - Database
- [NextAuth.js](https://next-auth.js.org/) - Authentication
- [Dexie.js](https://dexie.org/) - IndexedDB wrapper
- [Recharts](https://recharts.org/) - Charts library
- [Lucide](https://lucide.dev/) - Icons

---

**Built with ❤️ using modern web technologies**
- Category-wise breakdowns (pie charts, bar charts)
- Transaction history with search and filters
- Date range selection for custom periods
- Export data to CSV or Excel

**Income Tracking**
- Add income sources (salary, freelance, etc.)
- Track income history
- View income vs. expense comparisons

**Loan Management**
- Track loans given or taken
- Record payment schedules
- Monitor outstanding balances
- Link contacts to loans

**Offline Mode**
- Add/edit expenses without internet
- Changes stored in local queue
- Auto-sync when connection restored
- Visual sync status indicator

**Admin Tools** (Admin users only)
- Database index optimization
- Data migrations for schema updates
- System maintenance utilities

## 🏗️ Architecture

### Offline-First Design
- **Dexie.js** manages local IndexedDB storage
- **Sync Queue** tracks offline changes
- **Optimistic Updates** for instant UI feedback
- **Background Sync** when connection restored
- **Conflict Resolution** with server-side timestamps

### Security
- **NextAuth.js v5** for authentication
- **MongoDB** for secure data storage
- **Admin Authorization** via email whitelist
- **API Route Protection** with session validation
- **Environment Variable** security for credentials

## 🛠️ Development

### Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🔧 Admin Access

Configure admin users in `.env.local`:

```env
ADMIN_EMAILS=admin@example.com,dev@example.com
```

See **[ADMIN.md](ADMIN.md)** for detailed admin setup. Architecture
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
