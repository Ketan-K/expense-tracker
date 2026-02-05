import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.expensetracker.app",
  appName: "Expense Tracker",
  webDir: "out",
  server: {
    url: "https://expense-tracker-io.vercel.app",
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#6366f1",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      androidSpinnerStyle: "large",
      spinnerColor: "#ffffff",
    },
    StatusBar: {
      style: "light",
      backgroundColor: "#ffffff",
      overlay: false,
    },
  },
};

export default config;
