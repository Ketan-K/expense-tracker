"use client";

import { signIn } from "next-auth/react";
import { Wallet, TrendingUp, PieChart, BarChart3 } from "lucide-react";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl border border-white/20 hover:shadow-3xl transition-all">
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-full mb-4 shadow-lg">
              <Wallet className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
              Expense Tracker
            </h1>
            <p className="text-sm sm:text-base text-white/80">
              Track expenses, manage budgets, get insights
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="text-center">
              <div className="bg-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-2 hover:bg-white/20 transition-all">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white mx-auto" />
              </div>
              <p className="text-xs sm:text-sm text-white/70 font-medium">Track</p>
            </div>
            <div className="text-center">
              <div className="bg-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-2 hover:bg-white/20 transition-all">
                <PieChart className="w-5 h-5 sm:w-6 sm:h-6 text-white mx-auto" />
              </div>
              <p className="text-xs sm:text-sm text-white/70 font-medium">Analyze</p>
            </div>
            <div className="text-center">
              <div className="bg-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-2 hover:bg-white/20 transition-all">
                <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-white mx-auto" />
              </div>
              <p className="text-xs sm:text-sm text-white/70 font-medium">Budget</p>
            </div>
          </div>

          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-4 sm:py-5 px-6 rounded-xl sm:rounded-2xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-sm sm:text-base cursor-pointer"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-white/60 text-xs sm:text-sm mt-6">
            Your data is stored securely and synced across devices
          </p>
        </div>
      </div>
    </div>
  );
}
