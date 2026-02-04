"use client";

import { signIn, useSession } from "next-auth/react";
import { TrendingUp, PieChart, BarChart3, Terminal, X } from "lucide-react";
import { theme } from "@/lib/theme";
import Image from "next/image";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App } from "@capacitor/app";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function SignInPage() {
  const { data: session, status, update: updateSession } = useSession();
  const [debugMode, setDebugMode] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [tapCount, setTapCount] = useState(0);
  const [tapTimeout, setTapTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

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

        // Parse URL to check for errors
        try {
          const urlObj = new URL(url);

          // Ignore deep links to the sign-in page itself (prevents loop)
          if (urlObj.pathname.includes("/auth/signin")) {
            if (debugMode) addLog("⚠️ Ignoring deep link to sign-in page (prevents loop)");
            return;
          }

          // Check for error in callback
          if (urlObj.pathname.includes("/api/auth/error")) {
            const error = urlObj.searchParams.get("error") || "Unknown error";
            if (debugMode) addLog(`❌ OAuth error: ${error}`);
            toast.error(`Authentication failed: ${error}`);
            setIsAuthenticating(false);
            return;
          }

          // Check if this is an OAuth callback with authorization code
          if (urlObj.pathname.includes("/api/auth/callback/google")) {
            const code = urlObj.searchParams.get("code");

            if (!code) {
              if (debugMode) addLog("⚠️ OAuth callback without code - ignoring");
              return;
            }

            if (debugMode) addLog("✅ OAuth callback detected with code");
            if (debugMode) addLog("📝 Code parameter present");

            setIsAuthenticating(true);

            // Close the in-app browser
            try {
              await Browser.close();
              if (debugMode) addLog("🗑️ In-app browser closed");
            } catch (e) {
              // Browser might already be closed
              if (debugMode) addLog("⚠️ Browser close attempt (may already be closed)");
            }

            // Navigate WebView to callback URL so NextAuth can process code exchange
            if (debugMode) addLog("🔄 Navigating to callback URL for code exchange...");
            window.location.href = url;
          } else {
            // Log any other deep links for debugging
            if (debugMode) addLog(`ℹ️ Ignoring non-callback deep link: ${urlObj.pathname}`);
          }
        } catch (error) {
          console.error("Failed to parse deep link URL:", error);
          if (debugMode) addLog(`❌ Failed to parse URL: ${url}`);
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
  }, [debugMode, updateSession]);

  // Monitor session changes for successful authentication
  useEffect(() => {
    if (isAuthenticating && status === "authenticated" && session?.user?.id) {
      // Redirect to dashboard - this will unmount the component and cleanup state
      window.location.href = "/dashboard";
    }
  }, [session, status, isAuthenticating, debugMode]);

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
      // Mobile: Get OAuth URL from API and open in in-app browser
      try {
        if (debugMode) addLog("📱 Fetching OAuth URL from server...");

        const response = await fetch("/api/auth/oauth-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: "google" }),
        });

        const data = await response.json();

        if (!data.url) {
          throw new Error("No OAuth URL returned");
        }

        if (debugMode) addLog(`🔗 Got URL: ${data.url}`);

        // Open in in-app browser
        await Browser.open({
          url: data.url,
          windowName: "_self",
        });

        if (debugMode) addLog("✅ In-app browser opened");
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        setIsAuthenticating(false);
        toast.error("Failed to start authentication");
        if (debugMode) addLog(`❌ Error: ${errorMsg}`);
        console.error("Mobile OAuth failed:", error);
      }
    } else {
      // Web: Use NextAuth's client signIn
      try {
        if (debugMode) addLog("🌐 Web: using NextAuth flow");
        await signIn("google", { callbackUrl: "/dashboard" });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        setIsAuthenticating(false);
        toast.error("Failed to start authentication");
        if (debugMode) addLog(`❌ Error: ${errorMsg}`);
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
        </div>

        {/* Debug Console */}
        {debugMode && (
          <div className="mt-4 bg-black/80 backdrop-blur-sm rounded-2xl p-4 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-green-400" />
                <h3 className="text-sm font-semibold text-white">Debug Console</h3>
              </div>
              <button
                onClick={() => setDebugMode(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-black/50 rounded-lg p-3 max-h-60 overflow-y-auto font-mono text-xs">
              {debugLogs.length === 0 ? (
                <p className="text-gray-500 italic">No logs yet...</p>
              ) : (
                debugLogs.map((log, index) => (
                  <div key={index} className="text-green-400 mb-1">
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
