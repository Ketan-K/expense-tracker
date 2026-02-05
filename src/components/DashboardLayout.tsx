"use client";

import {
  Home,
  User,
  Wallet,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Handshake,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { performSync } from "@/lib/syncUtils";
import { t } from "@/lib/terminology";
import { theme } from "@/lib/theme";
import Image from "next/image";

interface DashboardLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export default function DashboardLayout({ children, pageTitle }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  // Perform immediate sync on mount
  useEffect(() => {
    if (user?.id && navigator.onLine) {
      performSync(user.id).catch(console.error);
      setLastSyncTime(new Date());
    }
  }, [user?.id]);

  // Manual sync trigger
  const handleManualSync = async () => {
    if (!user?.id || isSyncing) return;
    setIsSyncing(true);
    try {
      await performSync(user.id);
      setLastSyncTime(new Date());
    } catch (error) {
      console.error("Sync error:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Get sync queue status
  const syncQueue = useLiveQuery(async () => {
    return await db.syncQueue.toArray();
  }, []);

  const syncStats = {
    syncing: syncQueue?.filter(item => item.status === "syncing").length || 0,
    failed: syncQueue?.filter(item => item.status === "failed").length || 0,
    pending: syncQueue?.filter(item => item.status === "pending").length || 0,
  };

  const totalPending = syncStats.syncing + syncStats.pending;
  const hasFailed = syncStats.failed > 0;

  const navItems = [
    { href: "/dashboard", icon: Home, label: t.dashboard },
    { href: "/dashboard/expenses", icon: Wallet, label: t.expenses },
    { href: "/dashboard/income", icon: TrendingUp, label: t.income },
    { href: "/dashboard/loans", icon: Handshake, label: t.loans },
    { href: "/dashboard/contacts", icon: Users, label: t.contacts },
    { href: "/dashboard/profile", icon: User, label: t.profile },
  ];

  // Get page title from pathname if not provided
  const getPageTitle = () => {
    if (pageTitle) return pageTitle;
    if (pathname === "/dashboard") return t.dashboard;
    if (pathname.startsWith("/dashboard/expenses")) return t.expenses;
    if (pathname.startsWith("/dashboard/income")) return t.income;
    if (pathname.startsWith("/dashboard/loans")) return t.loans;
    if (pathname.startsWith("/dashboard/contacts")) return t.contacts;
    if (pathname === "/dashboard/profile") return t.profile;
    return theme.brand.name;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      {/* Animated Money Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.02] overflow-hidden">
        {[
          "₹",
          "$",
          "Budget",
          "Save",
          "₹",
          "$",
          "Track",
          "Spend",
          "₹",
          "$",
          "Invest",
          "Earn",
          "₹",
          "$",
          "Money",
          "Growth",
          "₹",
          "$",
          "Profit",
          "Goals",
        ].map((item, i) => (
          <div
            key={i}
            className="absolute font-mono text-[var(--color-app-gradient-from)] dark:text-purple-400"
            style={{
              left: `${(i * 7) % 100}%`,
              top: `${(i * 13) % 100}%`,
              fontSize: item.length > 2 ? "1.5rem" : "2rem",
              animation: `float ${15 + (i % 5) * 3}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          >
            {item}
          </div>
        ))}
      </div>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 z-50 shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left duration-500">
            <div className="w-8 h-8 bg-gradient-to-br from-app-gradient-from via-app-gradient-via to-app-gradient-to rounded-lg flex items-center justify-center shadow-lg">
              <Image
                src={theme.assets.logo}
                alt={theme.assets.logoText}
                width={20}
                height={20}
                className="w-5 h-5"
              />
            </div>
            <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-app-gradient-from via-app-gradient-via to-app-gradient-to bg-clip-text text-transparent">
              {getPageTitle()}
            </h1>
          </div>

          {/* Sync Status Indicator */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
              title={
                lastSyncTime ? `Last synced: ${lastSyncTime.toLocaleTimeString()}` : "Sync now"
              }
            >
              <RefreshCw
                className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${isSyncing ? "animate-spin" : ""}`}
              />
            </button>
            {(totalPending > 0 || hasFailed) && (
              <button
                onClick={() => router.push("/dashboard/profile")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                title={
                  hasFailed ? `${syncStats.failed} items failed` : `Syncing ${totalPending} items`
                }
              >
                {hasFailed ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-medium text-red-600 dark:text-red-400">
                      {syncStats.failed}
                    </span>
                  </>
                ) : totalPending > 0 ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />
                    <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                      {totalPending}
                    </span>
                  </>
                ) : null}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 lg:pt-0 lg:pb-8" style={{ paddingTop: 'calc(5rem + env(safe-area-inset-top))', paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 lg:!pt-0">{children}</div>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Backdrop with gradient */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white via-white/95 to-transparent dark:from-gray-900 dark:via-gray-900/95 dark:to-transparent"></div>

        {/* Navigation Bar */}
        <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
          <div className="flex items-center justify-around px-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex flex-col items-center py-3 px-4 min-w-[60px] group"
                >
                  <div
                    className={`relative transition-all duration-300 ${
                      isActive ? "scale-110" : "group-active:scale-90"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-br from-app-gradient-from to-app-gradient-to opacity-20 rounded-xl blur-lg"></div>
                    )}
                    <div
                      className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                        isActive
                          ? "bg-gradient-to-br from-app-gradient-from/10 to-app-gradient-to/10 dark:from-app-gradient-from/20 dark:to-app-gradient-to/20"
                          : "group-hover:bg-gray-100 dark:group-hover:bg-gray-800"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 transition-all duration-300 ${
                          isActive
                            ? "text-[var(--color-app-gradient-from)] dark:text-purple-400"
                            : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                        }`}
                        strokeWidth={isActive ? 2.5 : 2}
                      />
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold mt-1 transition-all duration-200 ${
                      isActive
                        ? "text-[var(--color-app-gradient-from)] dark:text-purple-400 scale-105"
                        : "text-gray-500 dark:text-gray-400 scale-95 group-hover:scale-100"
                    }`}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="absolute -top-px left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-transparent via-app-gradient-from to-transparent rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-xl">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-app-gradient-from via-app-gradient-via to-app-gradient-to rounded-lg flex items-center justify-center shadow-lg p-2">
              <Image
                src={theme.assets.logo}
                alt={theme.assets.logoText}
                width={32}
                height={32}
                className="w-full h-full"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {theme.brand.name}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{theme.brand.tagline}</p>
            </div>

            {/* Sync Status Badge (Desktop) */}
            {(totalPending > 0 || hasFailed) && (
              <button
                onClick={() => router.push("/dashboard/profile")}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                title={
                  hasFailed ? `${syncStats.failed} items failed` : `Syncing ${totalPending} items`
                }
              >
                {hasFailed ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-medium text-red-600 dark:text-red-400">
                      {syncStats.failed}
                    </span>
                  </>
                ) : totalPending > 0 ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-orange-500 animate-spin" />
                    <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                      {totalPending}
                    </span>
                  </>
                ) : null}
              </button>
            )}
          </div>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-br from-app-gradient-from to-app-gradient-to text-white shadow-lg shadow-indigo-500/30"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </div>
  );
}
