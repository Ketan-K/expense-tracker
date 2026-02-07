"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, Chrome } from "lucide-react";
import { theme } from "@/lib/theme";
import { Capacitor } from "@capacitor/core";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAInstallPromptProps {
  onClose: () => void;
  onInstall: () => void;
}

export default function PWAInstallPrompt({ onClose, onInstall }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iOS = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iOS);

    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      Capacitor.isNativePlatform();
    setIsStandalone(standalone);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt && !isIOS) {
      onClose();
      return;
    }

    if (deferredPrompt) {
      // Show native install prompt for Chrome/Edge
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === "accepted") {
        onInstall();
      }
      setDeferredPrompt(null);
    }
    
    // For iOS, keep the modal open to show instructions
    if (!isIOS) {
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  // Don't show if already installed
  if (isStandalone) {
    onClose();
    return null;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header */}
          <div 
            className="p-6 text-white relative overflow-hidden"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent" />
            </div>
            <div className="relative flex items-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <Smartphone className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Install {theme.brand.name}</h2>
                <p className="text-white/90 text-sm mt-1">Get the best experience</p>
              </div>
            </div>
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {isIOS ? (
              // iOS Installation Instructions
              <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">
                  To install this app on your iPhone or iPad:
                </p>
                <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-semibold text-xs">
                      1
                    </span>
                    <span>Tap the <strong>Share</strong> button in Safari</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-semibold text-xs">
                      2
                    </span>
                    <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-semibold text-xs">
                      3
                    </span>
                    <span>Tap <strong>Add</strong> to confirm</span>
                  </li>
                </ol>
              </div>
            ) : deferredPrompt ? (
              // Chrome/Edge Installation
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Chrome className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Install this app for quick access, offline support, and a better experience!
                  </p>
                </div>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Fast loading and smooth performance
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Works offline after installation
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Easy access from your home screen
                  </li>
                </ul>
              </div>
            ) : (
              // Fallback message
              <div className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">
                  For the best experience, use Chrome or Edge browser to install this app.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 pt-0 flex gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Maybe Later
            </button>
            {(deferredPrompt || isIOS) && (
              <button
                onClick={handleInstallClick}
                className="flex-1 px-4 py-3 rounded-lg font-medium text-white transition-all hover:shadow-lg flex items-center justify-center gap-2"
                style={{ 
                  backgroundColor: theme.colors.primary,
                  boxShadow: `0 4px 14px 0 ${theme.colors.primary}40`
                }}
              >
                <Download className="w-4 h-4" />
                {isIOS ? "Got it" : "Install Now"}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
