import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Wine Roam PWA config.
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          amplify: ["aws-amplify"],
          react: ["react", "react-dom", "react-router-dom"],
          motion: ["framer-motion"],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      includeAssets: ["favicon.svg"],
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        importScripts: ["push-sw.js"],
      },
      manifest: {
        name: "Wine Roam",
        short_name: "Wine Roam",
        description:
          "Learn wine, scan bottles, host live tastings, and take notes.",
        theme_color: "#722F37",
        background_color: "#FBF7F0",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});
