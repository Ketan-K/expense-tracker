"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Illustration - Empty Wallet */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <svg
              className="w-48 h-48 md:w-64 md:h-64"
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Wallet body */}
              <rect
                x="40"
                y="60"
                width="120"
                height="80"
                rx="8"
                fill="url(#walletGradient)"
                stroke="#4f46e5"
                strokeWidth="3"
              />
              {/* Wallet flap */}
              <path
                d="M 40 60 Q 100 40, 160 60"
                fill="url(#flapGradient)"
                stroke="#4f46e5"
                strokeWidth="3"
              />
              {/* Empty indicator - broken line */}
              <line
                x1="70"
                y1="100"
                x2="130"
                y2="100"
                stroke="#6366f1"
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.5"
              />
              {/* Sad face inside wallet */}
              <circle cx="85" cy="90" r="3" fill="#6366f1" opacity="0.7" />
              <circle cx="115" cy="90" r="3" fill="#6366f1" opacity="0.7" />
              <path
                d="M 85 110 Q 100 105, 115 110"
                stroke="#6366f1"
                strokeWidth="2"
                fill="none"
                opacity="0.7"
              />
              {/* Floating coins/money symbols */}
              <text
                x="30"
                y="50"
                fontSize="24"
                fill="#9333ea"
                opacity="0.6"
                className="animate-bounce"
                style={{ animationDelay: "0s" }}
              >
                ₹
              </text>
              <text
                x="165"
                y="75"
                fontSize="20"
                fill="#4f46e5"
                opacity="0.5"
                className="animate-bounce"
                style={{ animationDelay: "0.2s" }}
              >
                ₹
              </text>
              <text
                x="170"
                y="140"
                fontSize="22"
                fill="#a855f7"
                opacity="0.6"
                className="animate-bounce"
                style={{ animationDelay: "0.4s" }}
              >
                ₹
              </text>

              {/* Gradients */}
              <defs>
                <linearGradient id="walletGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#312e81" />
                  <stop offset="100%" stopColor="#1e1b4b" />
                </linearGradient>
                <linearGradient id="flapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3730a3" />
                  <stop offset="100%" stopColor="#312e81" />
                </linearGradient>
              </defs>
            </svg>
            {/* Glow effect */}
            <div className="absolute inset-0 blur-2xl opacity-20 bg-gradient-to-r from-app-gradient-from to-app-gradient-to" />
          </div>
        </div>

        {/* 404 Number with gradient */}
        <div className="relative mb-8">
          <h1 className="text-[200px] font-bold leading-none bg-gradient-to-r from-app-gradient-from via-app-gradient-via to-app-gradient-to bg-clip-text text-transparent animate-pulse">
            404
          </h1>
          <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-app-gradient-from via-app-gradient-via to-app-gradient-to" />
        </div>

        {/* Error Message */}
        <div className="space-y-4 mb-12">
          <h2 className="text-4xl font-bold text-white">Oops! Page Not Found</h2>
          <p className="text-xl text-gray-400 max-w-md mx-auto">
            Looks like this page took an unexpected expense and disappeared from our books.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/dashboard"
            className="px-8 py-4 bg-gradient-to-r from-app-gradient-from to-app-gradient-to hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all"
          >
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold border border-gray-700 hover:border-gray-600 hover:scale-105 active:scale-95 transition-all"
          >
            Go Back
          </button>
        </div>

        {/* Helpful Links */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <p className="text-sm text-gray-500 mb-4">Quick Links</p>
          <div className="flex flex-wrap gap-6 justify-center text-sm">
            <Link
              href="/dashboard"
              className="text-gray-400 hover:text-app-gradient-from transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/expenses"
              className="text-gray-400 hover:text-app-expenses transition-colors"
            >
              Expenses
            </Link>
            <Link
              href="/dashboard/income"
              className="text-gray-400 hover:text-app-income transition-colors"
            >
              Income
            </Link>
            <Link
              href="/dashboard/loans"
              className="text-gray-400 hover:text-app-loans transition-colors"
            >
              Loans
            </Link>
            <Link
              href="/dashboard/budgets"
              className="text-gray-400 hover:text-app-budgets transition-colors"
            >
              Budgets
            </Link>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-app-gradient-from opacity-5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-app-gradient-to opacity-5 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
}
