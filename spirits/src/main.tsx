import React from "react";
import ReactDOM from "react-dom/client";
import { configureSpiritAuth } from "@agave/shared/auth";
import { SpiritAuthProvider } from "@agave/shared/auth";
import App from "./App";
import "./index.css";

// Configure unified Cognito auth for the spirits hub.
// Uses the "wine" client since the hub is a portal — any client works since
// they all share the same user pool. We use a dedicated env var if set.
configureSpiritAuth({
  userPoolId: import.meta.env.VITE_COGNITO_POOL_ID || "us-east-1_JWONaq4Kj",
  userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || "2223u4fnmbamgp2m5l9sdknut7",
  cognitoDomain: import.meta.env.VITE_COGNITO_DOMAIN || undefined,
  oauthProviders: [],
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SpiritAuthProvider>
      <App />
    </SpiritAuthProvider>
  </React.StrictMode>
);
