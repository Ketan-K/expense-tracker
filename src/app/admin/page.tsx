"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { Shield, Database, CheckCircle, XCircle, AlertCircle, Loader2, Users, TrendingUp, Wallet, FileText } from "lucide-react";

export default function AdminPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'indexes' | 'migrations'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [migrateExpenseTypeResult, setMigrateExpenseTypeResult] = useState<any>(null);
  const [indexesResult, setIndexesResult] = useState<any>(null);
  const [contactsMigrateResult, setContactsMigrateResult] = useState<any>(null);
  const [loading, setLoading] = useState<{ 
    stats: boolean;
    migrateExpenseType: boolean; 
    indexes: boolean; 
    contactsMigrate: boolean;
  }>({
    stats: false,
    migrateExpenseType: false,
    indexes: false,
    contactsMigrate: false,
  });

  // Check admin authorization
  useEffect(() => {
    if (isLoading) return;
    
    if (!isAuthenticated) {
      router.push("/auth/signin?callbackUrl=/admin");
      return;
    }

    // Check if user is admin
    fetch("/api/admin/check-access")
      .then(res => res.json())
      .then(data => {
        if (data.isAdmin) {
          setIsAuthorized(true);
          // Fetch stats
          fetchStats();
        } else {
          router.push("/dashboard");
        }
      })
      .catch(() => {
        router.push("/dashboard");
      });
  }, [isLoading, isAuthenticated, router]);

  const fetchStats = async () => {
    setLoading({ ...loading, stats: true });
    try {
      const response = await fetch("/api/admin/stats");
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  };

  const migrateExpenseType = async (dryRun = false) => {
    setLoading({ ...loading, migrateExpenseType: true });
    setMigrateExpenseTypeResult(null);

    try {
      const response = await fetch("/api/admin/migrate-expense-type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const data = await response.json();
      setMigrateExpenseTypeResult(data);
    } catch (error) {
      setMigrateExpenseTypeResult({
        success: false,
        error: "Request failed",
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading({ ...loading, migrateExpenseType: false });
    }
  };

  const ensureIndexes = async () => {
    setLoading({ ...loading, indexes: true });
    setIndexesResult(null);

    try {
      const response = await fetch("/api/admin/ensure-indexes", { method: "POST" });
      const data = await response.json();
      setIndexesResult(data);
    } catch (error) {
      setIndexesResult({ 
        error: "Request failed", 
        details: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading({ ...loading, indexes: false });
    }
  };

  const migrateContacts = async () => {
    setLoading({ ...loading, contactsMigrate: true });
    setContactsMigrateResult(null);

    try {
      const response = await fetch("/api/admin/migrate-contacts", { method: "POST" });
      const data = await response.json();
      setContactsMigrateResult(data);
    } catch (error) {
      setContactsMigrateResult({ 
        error: "Request failed", 
        details: error instanceof Error ? error.message : String(error) 
      });
    } finally {
      setLoading({ ...loading, contactsMigrate: false });
    }
  };

  // Show loading while checking authorization
  if (isLoading || isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Checking authorization...</p>
        </div>
      </div>
    );
  }

  // Only render admin page if authorized
  if (!isAuthorized) {
    return null;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'indexes', label: 'Database Indexes', icon: Database },
    { id: 'migrations', label: 'Migrations', icon: Shield },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-app-contacts to-app-contacts-end rounded-2xl shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Database migrations and system maintenance</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex gap-2 -mb-px overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                      isActive
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid gap-6">
            {/* System Statistics Section */}
            <div className="bg-gradient-to-br from-app-budgets-light to-app-budgets-light-end rounded-2xl p-6 shadow-lg border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">System Statistics</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Real-time platform metrics
                  </p>
                </div>
              </div>
              <button
                onClick={fetchStats}
                disabled={loading.stats}
                className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh stats"
              >
                <Loader2 className={`w-5 h-5 text-indigo-600 dark:text-indigo-400 ${loading.stats ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading.stats && !stats ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400 text-sm">Loading statistics...</p>
              </div>
            ) : stats ? (
              <div className="space-y-6">
                {/* User Statistics */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    User Statistics
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Users</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.users.total}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Users</div>
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{stats.users.active}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">With linked accounts</div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Users with Data</div>
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.users.withData}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">Created expenses</div>
                    </div>
                  </div>
                </div>

                {/* Data Statistics */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Database Statistics
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="w-4 h-4 text-red-500" />
                        <div className="text-xs text-gray-600 dark:text-gray-400">Expenses</div>
                      </div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.data.expenses.count.toLocaleString()}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        +{stats.data.expenses.recent} this week
                      </div>
                      <div className="text-xs font-medium text-red-600 dark:text-red-400 mt-1">
                        ₹{(stats.data.expenses.totalAmount / 1000).toFixed(1)}K
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <div className="text-xs text-gray-600 dark:text-gray-400">Incomes</div>
                      </div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.data.incomes.count.toLocaleString()}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        +{stats.data.incomes.recent} this week
                      </div>
                      <div className="text-xs font-medium text-green-600 dark:text-green-400 mt-1">
                        ₹{(stats.data.incomes.totalAmount / 1000).toFixed(1)}K
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-orange-500" />
                        <div className="text-xs text-gray-600 dark:text-gray-400">Loans</div>
                      </div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.data.loans.count.toLocaleString()}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        +{stats.data.loans.recent} this week
                      </div>
                      <div className="text-xs font-medium text-orange-600 dark:text-orange-400 mt-1">
                        ₹{(stats.data.loans.totalAmount / 1000).toFixed(1)}K
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        <div className="text-xs text-gray-600 dark:text-gray-400">Contacts</div>
                      </div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.data.contacts.toLocaleString()}</div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-purple-500" />
                        <div className="text-xs text-gray-600 dark:text-gray-400">Categories</div>
                      </div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.data.categories.toLocaleString()}</div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="w-4 h-4 text-cyan-500" />
                        <div className="text-xs text-gray-600 dark:text-gray-400">Budgets</div>
                      </div>
                      <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.data.budgets.toLocaleString()}</div>
                    </div>
                  </div>
                </div>

                {/* Last Updated */}
                <div className="text-xs text-gray-500 dark:text-gray-500 text-right">
                  Last updated: {new Date(stats.timestamp).toLocaleString('en-IN')}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400 text-sm">Failed to load statistics</p>
              </div>
            )}
          </div>
        </div>
        )}

          {/* Database Indexes Tab */}
          {activeTab === 'indexes' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Database Indexes</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ensure optimal query performance
                </p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              Automatically checks and creates missing indexes for all collections. Safe to run multiple times.
            </p>

            <button
              onClick={ensureIndexes}
              disabled={loading.indexes}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              {loading.indexes ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              {loading.indexes ? "Checking..." : "Ensure Indexes"}
            </button>

            {indexesResult && (
              <div
                className={`mt-4 p-4 rounded-lg ${
                  indexesResult.error
                    ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                    : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                }`}
              >
                <div className="flex items-start gap-3 mb-2">
                  {indexesResult.error ? (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white mb-1">
                      {indexesResult.message || indexesResult.error}
                    </p>
                    {indexesResult.details && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{indexesResult.details}</p>
                    )}
                    {indexesResult.created !== undefined && (
                      <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 space-y-1">
                        <p>✅ Created: {indexesResult.created}</p>
                        <p>ℹ️ Already existed: {indexesResult.existing}</p>
                      </div>
                    )}
                  </div>
                </div>
                {indexesResult.errors && indexesResult.errors.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">Errors:</p>
                    {indexesResult.errors.map((error: string, idx: number) => (
                      <div key={idx} className="p-2 rounded text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                        {error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

          {/* Migrations Tab */}
          {activeTab === 'migrations' && (
            <div className="grid gap-6">
              {/* Migrate Expense Type Section */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Database className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Expense Type Migration</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Add type field to legacy expenses
                </p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              Adds <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">type: "expense"</code> to all existing expenses without this field.
            </p>

            <div className="flex gap-3 mb-4">
              <button
                onClick={() => migrateExpenseType(true)}
                disabled={loading.migrateExpenseType}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading.migrateExpenseType ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
                Dry Run
              </button>
              <button
                onClick={() => migrateExpenseType(false)}
                disabled={loading.migrateExpenseType}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {loading.migrateExpenseType ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                Run Migration
              </button>
            </div>

            {migrateExpenseTypeResult && (
              <div
                className={`p-4 rounded-lg ${
                  migrateExpenseTypeResult.success
                    ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                }`}
              >
                <div className="flex items-start gap-3 mb-2">
                  {migrateExpenseTypeResult.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white mb-1">
                      {migrateExpenseTypeResult.message || migrateExpenseTypeResult.error}
                    </p>
                    {migrateExpenseTypeResult.details && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{migrateExpenseTypeResult.details}</p>
                    )}
                  </div>
                </div>
                {migrateExpenseTypeResult.stats && (
                  <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs text-gray-700 dark:text-gray-300">
                    <p>Found: {migrateExpenseTypeResult.stats.found}</p>
                    <p>Migrated: {migrateExpenseTypeResult.stats.migrated}</p>
                    {migrateExpenseTypeResult.stats.remaining !== undefined && (
                      <p>Remaining: {migrateExpenseTypeResult.stats.remaining}</p>
                    )}
                  </div>
                )}
                {migrateExpenseTypeResult.dryRun && (
                  <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400">
                    ⚠️ This was a dry run. No changes were made.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Contacts Migration Section */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Contacts Array Migration</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Convert phone/email to arrays
                </p>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              Converts contact <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">phone</code> and{" "}
              <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">email</code> from strings to
              arrays with primary field markers.
            </p>

            <button
              onClick={migrateContacts}
              disabled={loading.contactsMigrate}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
            >
              {loading.contactsMigrate ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              {loading.contactsMigrate ? "Migrating..." : "Migrate Contacts"}
            </button>

            {contactsMigrateResult && (
              <div
                className={`mt-4 p-4 rounded-lg ${
                  contactsMigrateResult.error || !contactsMigrateResult.success
                    ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                    : "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  {contactsMigrateResult.error || !contactsMigrateResult.success ? (
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {contactsMigrateResult.success ? contactsMigrateResult.message : "Migration Failed"}
                    </p>
                    {contactsMigrateResult.error ? (
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">{contactsMigrateResult.error}</p>
                    ) : (
                      <>
                        {contactsMigrateResult.migrated !== undefined && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                            Migrated {contactsMigrateResult.migrated} of {contactsMigrateResult.total} contacts
                          </p>
                        )}
                        {contactsMigrateResult.remaining > 0 && (
                          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                            Warning: {contactsMigrateResult.remaining} contacts still have string fields
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* PWA Install Prompt Testing */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">PWA Install Prompt</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Test and reset PWA installation prompt
                  </p>
                </div>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
              Reset the PWA install prompt to test the first-time user experience. This clears the local storage flags.
            </p>

            <button
              onClick={() => {
                localStorage.removeItem("pwa_install_prompt_dismissed");
                localStorage.removeItem("pwa_install_installed");
                alert("PWA install prompt has been reset. Refresh the dashboard to see it again.");
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium"
            >
              <Shield className="w-4 h-4" />
              Reset PWA Install Prompt
            </button>
          </div>

              {/* Instructions */}
              <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Usage Guide
          </h3>
          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <div className="flex gap-2">
              <span className="font-semibold min-w-[140px]">Database Indexes:</span>
              <span>Run first after deployment to ensure optimal performance</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold min-w-[140px]">Expense Type:</span>
              <span>Run if upgrading from old version without expense types</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold min-w-[140px]">Contacts Arrays:</span>
              <span>Run if upgrading to support multiple phone/email fields</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold min-w-[140px]">PWA Prompt:</span>
              <span>Reset the install prompt to test first-time user experience</span>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                💡 Tip: Use "Dry Run" buttons to preview changes before applying migrations. All operations are safe to run multiple times.
              </p>
            </div>
          </div>
        </div>
            </div>
          )}
      </div>
    </div>
  );
}
