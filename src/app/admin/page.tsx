"use client";

import { useState } from "react";
import { Shield, Database, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [migrateResult, setMigrateResult] = useState<any>(null);
  const [indexesResult, setIndexesResult] = useState<any>(null);
  const [loading, setLoading] = useState<{ migrate: boolean; indexes: boolean }>({
    migrate: false,
    indexes: false,
  });

  const runMigration = async (dryRun = false) => {
    if (!secret) {
      alert("Please enter admin secret");
      return;
    }

    setLoading({ ...loading, migrate: true });
    setMigrateResult(null);

    try {
      const url = dryRun 
        ? `/api/admin/migrate?secret=${encodeURIComponent(secret)}&dry-run=true`
        : `/api/admin/migrate?secret=${encodeURIComponent(secret)}`;
      
      const response = await fetch(url, { method: "GET" });
      const data = await response.json();
      setMigrateResult(data);
    } catch (error) {
      setMigrateResult({
        error: "Request failed",
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading({ ...loading, migrate: false });
    }
  };

  const createIndexes = async () => {
    if (!secret) {
      alert("Please enter admin secret");
      return;
    }

    setLoading({ ...loading, indexes: true });
    setIndexesResult(null);

    try {
      const response = await fetch(
        `/api/admin/create-indexes?secret=${encodeURIComponent(secret)}`,
        { method: "GET" }
      );
      const data = await response.json();
      setIndexesResult(data);
    } catch (error) {
      setIndexesResult({
        error: "Request failed",
        details: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setLoading({ ...loading, indexes: false });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-red-500" />
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
          </div>
          <p className="text-gray-400">Database Migration & Maintenance</p>
        </div>

        {/* Secret Input */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Admin Secret
          </label>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Enter ADMIN_SECRET from env"
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            Get this from your Vercel environment variables (ADMIN_SECRET)
          </p>
        </div>

        {/* Migration Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-white">Run Migration</h2>
          </div>
          <p className="text-gray-400 mb-4">
            Adds <code className="px-2 py-1 bg-gray-700 rounded text-sm">type: "expense"</code> to all
            existing expenses in MongoDB
          </p>

          <div className="flex gap-3 mb-4">
            <button
              onClick={() => runMigration(true)}
              disabled={loading.migrate}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading.migrate ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertCircle className="w-4 h-4" />}
              Dry Run (Check Only)
            </button>
            <button
              onClick={() => runMigration(false)}
              disabled={loading.migrate}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading.migrate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              Run Migration
            </button>
          </div>

          {migrateResult && (
            <div
              className={`p-4 rounded-lg ${
                migrateResult.error
                  ? "bg-red-900/20 border border-red-800"
                  : "bg-green-900/20 border border-green-800"
              }`}
            >
              <div className="flex items-start gap-3 mb-2">
                {migrateResult.error ? (
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-white mb-1">
                    {migrateResult.message || migrateResult.error}
                  </p>
                  {migrateResult.details && (
                    <p className="text-sm text-gray-400">{migrateResult.details}</p>
                  )}
                </div>
              </div>
              {migrateResult.stats && (
                <pre className="mt-3 p-3 bg-gray-900 rounded text-xs text-gray-300 overflow-auto">
                  {JSON.stringify(migrateResult.stats, null, 2)}
                </pre>
              )}
              {migrateResult.dryRun && (
                <p className="mt-2 text-sm text-yellow-400">
                  ⚠️ This was a dry run. No changes were made.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Create Indexes Section */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-purple-500" />
            <h2 className="text-xl font-semibold text-white">Create Database Indexes</h2>
          </div>
          <p className="text-gray-400 mb-4">
            Creates optimized indexes for faster queries on all collections
          </p>

          <button
            onClick={createIndexes}
            disabled={loading.indexes}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading.indexes ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            Create Indexes
          </button>

          {indexesResult && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                indexesResult.error
                  ? "bg-red-900/20 border border-red-800"
                  : "bg-green-900/20 border border-green-800"
              }`}
            >
              <div className="flex items-start gap-3 mb-2">
                {indexesResult.error ? (
                  <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-white mb-1">
                    {indexesResult.message || indexesResult.error}
                  </p>
                  {indexesResult.details && (
                    <p className="text-sm text-gray-400">{indexesResult.details}</p>
                  )}
                </div>
              </div>
              {indexesResult.results && (
                <div className="mt-3 space-y-2">
                  {indexesResult.results.map((result: any, idx: number) => (
                    <div
                      key={idx}
                      className={`p-2 rounded text-sm ${
                        result.status === "created"
                          ? "bg-green-900/30 text-green-300"
                          : "bg-red-900/30 text-red-300"
                      }`}
                    >
                      <span className="font-mono">
                        {result.collection}.{result.index}
                      </span>
                      <span className="ml-2 opacity-75">
                        - {result.status}
                        {result.error && `: ${result.error}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 p-6 bg-blue-900/20 border border-blue-800 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-400" />
            Setup Instructions
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-300 text-sm">
            <li>Add <code className="px-2 py-1 bg-gray-800 rounded">ADMIN_SECRET</code> to your Vercel environment variables (any random string)</li>
            <li>Redeploy your app to apply the environment variable</li>
            <li>Enter the secret above and run "Dry Run" first to check what will be updated</li>
            <li>Run the migration to update existing expenses</li>
            <li>Create indexes to optimize database performance</li>
          </ol>
        </div>

        {/* Alternative: cURL Commands */}
        <div className="mt-6 p-6 bg-gray-800 border border-gray-700 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-3">Alternative: Use cURL</h3>
          <p className="text-gray-400 mb-3 text-sm">
            You can also run these commands from your terminal:
          </p>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Dry run migration:</p>
              <code className="block p-3 bg-gray-900 text-gray-300 rounded text-xs overflow-x-auto">
                curl "https://your-app.vercel.app/api/admin/migrate?secret=YOUR_SECRET&dry-run=true"
              </code>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Run migration:</p>
              <code className="block p-3 bg-gray-900 text-gray-300 rounded text-xs overflow-x-auto">
                curl "https://your-app.vercel.app/api/admin/migrate?secret=YOUR_SECRET"
              </code>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Create indexes:</p>
              <code className="block p-3 bg-gray-900 text-gray-300 rounded text-xs overflow-x-auto">
                curl "https://your-app.vercel.app/api/admin/create-indexes?secret=YOUR_SECRET"
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
