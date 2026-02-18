import { CapacitorConfig } from "@capacitor/core";

const config: CapacitorConfig = {
  appId: "app.lovable.22e67a7dbd2f47c9b9a1ee044a39c66b",
  appName: "faenet-school-link",
  webDir: "dist",
  server: {
    url: "https://22e67a7d-bd2f-47c9-b9a1-ee044a39c66b.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#1B3A5C",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
  },
};

export default config;
