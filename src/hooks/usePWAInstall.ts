"use client";

import { useState, useEffect } from "react";

const PROMPT_DISMISSED_KEY = "pwa_install_prompt_dismissed";
const PROMPT_INSTALLED_KEY = "pwa_install_installed";

export function usePWAInstall() {
  const [shouldShowPrompt, setShouldShowPrompt] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed or installed
    const dismissed = localStorage.getItem(PROMPT_DISMISSED_KEY);
    const installed = localStorage.getItem(PROMPT_INSTALLED_KEY);

    if (dismissed || installed) {
      setShouldShowPrompt(false);
      return;
    }

    // Show prompt after a short delay (better UX)
    const timer = setTimeout(() => {
      setShouldShowPrompt(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(PROMPT_DISMISSED_KEY, "true");
    setShouldShowPrompt(false);
  };

  const handleInstall = () => {
    localStorage.setItem(PROMPT_INSTALLED_KEY, "true");
    setShouldShowPrompt(false);
  };

  const resetPrompt = () => {
    localStorage.removeItem(PROMPT_DISMISSED_KEY);
    localStorage.removeItem(PROMPT_INSTALLED_KEY);
    setShouldShowPrompt(true);
  };

  return {
    shouldShowPrompt,
    handleDismiss,
    handleInstall,
    resetPrompt,
  };
}
