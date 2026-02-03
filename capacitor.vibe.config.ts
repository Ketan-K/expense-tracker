import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.vibefinance.app",
  appName: "Vibe Finance",
  webDir: "out",
  server: {
    url: "https://vibe-finance-io.vercel.app",
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#8B5CF6",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      spinnerColor: "#ffffff",
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#8B5CF6",
    },
  },
};

export default config;
