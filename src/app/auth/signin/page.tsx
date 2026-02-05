"use client";

import { signIn } from "next-auth/react";
import { useAuth } from "@/lib/auth";
import { setAuthToken } from "@/lib/auth/token-storage";
import { TrendingUp, PieChart, BarChart3, Terminal, X } from "lucide-react";
import { theme } from "@/lib/theme";
import Image from "next/image";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App } from "@capacitor/app";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function SignInPage() {
  const { user, isLoading, isAuthenticated, update: updateSession } = useAuth();
  const [debugMode, setDebugMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [tapCount, setTapCount] = useState(0);
  const [tapTimeout, setTapTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // App URL listener for HTTPS deep links (OAuth callbacks)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listenerHandle: { remove: () => void } | null = null;

    const setupListener = async () => {
      listenerHandle = await App.addListener("appUrlOpen", async data => {
        const url = data.url;
        if (debugMode) addLog(`📱 Deep link received: ${url}`);

        try {
          const urlObj = new URL(url);

          // Ignore non-callback deep links
          if (!urlObj.pathname.includes("/api/auth/callback/google")) {
            if (debugMode) addLog(`ℹ️ Ignoring non-callback deep link`);
            return;
          }

          // Check for OAuth errors in callback URL
          if (urlObj.searchParams.get("error")) {
            const error = urlObj.searchParams.get("error") || "Unknown error";
            const errorDesc = urlObj.searchParams.get("error_description") || "";
            const fullError = errorDesc ? `${error}: ${errorDesc}` : error;
            
            if (debugMode) addLog(`❌ OAuth error: ${fullError}`);
            setError(fullError);
            toast.error(`Authentication failed: ${error}`);
            setIsAuthenticating(false);
            setDebugMode(true); // Auto-enable debug mode on error
            return;
          }

          if (debugMode) addLog("✅ OAuth callback detected");
          setIsAuthenticating(true);

          // Close the in-app browser
          try {
            await Browser.close();
            if (debugMode) addLog("🗑️ In-app browser closed");
          } catch {
            if (debugMode) addLog("⚠️ Browser already closed");
          }

          // Exchange OAuth callback for JWT token
          if (debugMode) addLog("🔄 Exchanging session for mobile token...");
          
          // Don't navigate away - fetch the callback URL to establish session
          // This prevents the page from redirecting to error pages
          if (debugMode) addLog("📡 Processing callback URL...");
          
          try {
            const callbackResponse = await fetch(url, {
              credentials: 'include',
              redirect: 'manual'
            });
            
            if (debugMode) addLog(`📊 Callback response: ${callbackResponse.status}`);
            
            // Check if callback failed
            if (callbackResponse.status >= 400) {
              const errorText = await callbackResponse.text();
              if (debugMode) addLog(`❌ Callback failed: ${errorText.substring(0, 200)}`);
              throw new Error(`Callback failed with status ${callbackResponse.status}`);
            }
          } catch (fetchError) {
            const errorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
            if (debugMode) addLog(`⚠️ Callback fetch error: ${errorMsg}`);
            // If fetch fails, try navigating directly (fallback)
            if (debugMode) addLog("🔄 Falling back to direct navigation...");
            window.location.href = url;
            return;
          }
          
          // Give NextAuth time to process callback and set session
          setTimeout(async () => {
            try {
              if (debugMode) addLog("📡 Calling /api/auth/mobile-token...");
              
              const response = await fetch("/api/auth/mobile-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
              });

              if (debugMode) addLog(`📊 Response status: ${response.status}`);

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMsg = errorData.error || `HTTP ${response.status}`;
                if (debugMode) addLog(`❌ Server responded: ${JSON.stringify(errorData)}`);
                throw new Error(errorMsg);
              }

              const data = await response.json();
              
              if (debugMode) {
                addLog("✅ Token received, storing locally");
                addLog(`👤 User: ${data.user?.email || "unknown"}`);
              }
              
              // Store token and user data
              setAuthToken({
                token: data.token,
                user: data.user,
                expiresAt: data.expiresAt,
              });

              if (debugMode) addLog("🎉 Authentication complete!");
              
              // Redirect to dashboard
              window.location.href = "/dashboard";
            } catch (error) {
              const errorMsg = error instanceof Error ? error.message : String(error);
              if (debugMode) addLog(`❌ Token exchange error: ${errorMsg}`);
              setError(`Token exchange failed: ${errorMsg}`);
              toast.error("Failed to complete authentication");
              setIsAuthenticating(false);
              setDebugMode(true); // Auto-enable debug mode on error
            }
          }, 2000); // Wait 2 seconds for session to be established
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error("Failed to parse deep link URL:", error);
          if (debugMode) addLog(`❌ Failed to parse URL: ${errorMsg}`);
          setError(`Deep link parsing failed: ${errorMsg}`);
          setDebugMode(true); // Auto-enable debug mode on error
        }
      });

      if (debugMode) addLog("👂 App URL listener registered");
    };

    setupListener();

    // Cleanup listener on unmount
    return () => {
      if (listenerHandle) {
        listenerHandle.remove();
        if (debugMode) addLog("🗑️ App URL listener removed");
      }
    };
  }, [debugMode]);

  // Monitor authentication state - redirect when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id && !isAuthenticating) {
      if (debugMode) addLog("✅ Already authenticated, redirecting...");
      window.location.href = "/dashboard";
    }
  }, [user, isAuthenticated, isAuthenticating, debugMode]);

  const handleLogoTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);

    // Clear existing timeout
    if (tapTimeout) clearTimeout(tapTimeout);

    // Enable debug mode on 7 taps
    if (newCount >= 7 && !debugMode) {
      setDebugMode(true);
      setTapCount(0);
      // Set initial debug logs
      const timestamp = new Date().toLocaleTimeString();
      setDebugLogs([
        `[${timestamp}] 🐛 Debug mode enabled`,
        `[${timestamp}] Platform: ${Capacitor.isNativePlatform() ? "Native" : "Web"}`,
        `[${timestamp}] Platform: ${Capacitor.getPlatform()}`,
        `[${timestamp}] Origin: ${window.location.origin}`,
      ]);
      return;
    }

    // Reset tap count after 2 seconds
    const timeout = setTimeout(() => setTapCount(0), 2000);
    setTapTimeout(timeout);
  };

  const handleSignIn = async () => {
    if (debugMode) {
      addLog("🔐 Starting OAuth flow...");
      addLog(`Platform: ${Capacitor.isNativePlatform() ? "Native" : "Web"}`);
    }

    setIsAuthenticating(true);

    if (Capacitor.isNativePlatform()) {
      // Mobile: Open NextAuth's signin endpoint in in-app browser
      // This lets NextAuth handle OAuth URL generation with correct redirect_uri
      try {
        if (debugMode) addLog("📱 Opening NextAuth signin in browser...");

        // Try both NextAuth v5 formats
        const callbackUrl = encodeURIComponent("/dashboard");
        const signinUrl = `${window.location.origin}/api/auth/signin?provider=google&callbackUrl=${callbackUrl}`;
        
        if (debugMode) addLog(`🔗 Signin URL: ${signinUrl}`);

        // Open NextAuth's signin endpoint in in-app browser
        // It will redirect to Google OAuth with the correct redirect_uri
        await Browser.open({
          url: signinUrl,
          windowName: "_self",
        });

        if (debugMode) addLog("✅ In-app browser opened");
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        setIsAuthenticating(false);
        setError(`Mobile OAuth failed: ${errorMsg}`);
        toast.error("Failed to start authentication");
        if (debugMode) addLog(`❌ Error: ${errorMsg}`);
        setDebugMode(true); // Auto-enable debug mode on error
        console.error("Mobile OAuth failed:", error);
      }
    } else {
      // Web: Use NextAuth's client signIn (cookies work fine)
      try {
        if (debugMode) addLog("🌐 Using NextAuth flow");
        await signIn("google", { callbackUrl: "/dashboard" });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        setIsAuthenticating(false);
        setError(`Web OAuth failed: ${errorMsg}`);
        toast.error("Failed to start authentication");
        if (debugMode) addLog(`❌ Error: ${errorMsg}`);
        setDebugMode(true); // Auto-enable debug mode on error
        console.error("SignIn failed:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-app-gradient-from via-app-gradient-via to-app-gradient-to flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl border border-white/20 hover:shadow-3xl transition-all relative">
          {/* Platform Badge */}
          <div className="absolute top-4 right-4">
            <div
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                Capacitor.isNativePlatform()
                  ? "bg-green-500/20 text-green-100 border border-green-500/30"
                  : "bg-blue-500/20 text-blue-100 border border-blue-500/30"
              }`}
            >
              {Capacitor.isNativePlatform() ? "📱 Native App" : "🌐 Web Browser"}
            </div>
          </div>

          <div className="text-center mb-6 sm:mb-8">
            <div
              onClick={handleLogoTap}
              className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-full mb-4 shadow-lg cursor-pointer hover:bg-white/30 transition-all active:scale-95"
            >
              <Image
                src={theme.assets.logo}
                alt={theme.assets.logoText}
                width={40}
                height={40}
                className="w-7 h-7 sm:w-10 sm:h-10"
              />
              {tapCount > 0 && tapCount < 7 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-white/90 rounded-full flex items-center justify-center text-xs font-bold text-gray-900">
                  {tapCount}
                </div>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
              {theme.brand.name}
            </h1>
            <p className="text-sm sm:text-base text-white/80">{theme.brand.tagline}</p>
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
            onClick={handleSignIn}
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

          {/* Error Display */}
          {error && !debugMode && (
            <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="text-red-400 text-sm flex-1">
                  <p className="font-semibold mb-1">Authentication Error</p>
                  <p className="text-xs opacity-90">{error}</p>
                </div>
                <button
                  onClick={() => {
                    setDebugMode(true);
                    setError(null);
                  }}
                  className="text-xs bg-red-500/30 hover:bg-red-500/50 px-3 py-1 rounded-lg transition-all"
                >
                  View Logs
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Debug Console */}
        {debugMode && (
          <div className="mt-4 bg-black/80 backdrop-blur-sm rounded-2xl p-4 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-green-400" />
                <h3 className="text-sm font-semibold text-white">Debug Console</h3>
                {error && (
                  <span className="text-xs bg-red-500/30 text-red-300 px-2 py-0.5 rounded">
                    Error Mode
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setDebugMode(false);
                  setError(null);
                }}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Error Summary */}
            {error && (
              <div className="mb-3 bg-red-900/30 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-300 text-xs font-semibold mb-1">❌ Error Details:</p>
                <p className="text-red-200 text-xs font-mono">{error}</p>
              </div>
            )}
            
            <div className="bg-black/50 rounded-lg p-3 max-h-60 overflow-y-auto font-mono text-xs">
              {debugLogs.length === 0 ? (
                <p className="text-gray-500 italic">No logs yet...</p>
              ) : (
                debugLogs.map((log, index) => (
                  <div key={index} className={`mb-1 ${log.includes("❌") ? "text-red-400" : "text-green-400"}`}>
                    {log}
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  setDebugLogs([]);
                  addLog("🗑️ Logs cleared");
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs py-2 px-3 rounded-lg transition-all"
              >
                Clear Logs
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(debugLogs.join("\n"));
                  addLog("📋 Logs copied to clipboard");
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white text-xs py-2 px-3 rounded-lg transition-all"
              >
                Copy Logs
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
