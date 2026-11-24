
import express from "express";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv";
import * as oidc from "openid-client";

dotenv.config();

const app = express();

// Environment configuration
const PORT = process.env.PORT || 3001;

const KEYCLOAK_ISSUER = process.env.KEYCLOAK_ISSUER;
const CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID;
const CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET;

const BACKEND_URL =
  process.env.BACKEND_URL || `http://localhost:${PORT}`;

const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";

// OpenID Connect configuration
let oidcConfig;

// Check required environment variables
const requiredEnv = [
  "KEYCLOAK_ISSUER",
  "KEYCLOAK_CLIENT_ID",
  "KEYCLOAK_CLIENT_SECRET",
  "SESSION_SECRET",
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

// Middleware
app.use(express.json());

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// Session configuration
app.use(
  session({
    name: "keycloak.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
    },
  })
);

// Helper: Save session
function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

// Read optional display claims from the access token returned by Keycloak.
function readAccessTokenClaims(accessToken) {
  const parts = accessToken?.split(".");
  if (parts?.length !== 3) return {};

  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) ?? {};
  } catch {
    return {};
  }
}

function keycloakLogoutUrl(idToken) {
  return oidc.buildEndSessionUrl(oidcConfig, {
    id_token_hint: idToken,
    post_logout_redirect_uri: `${BACKEND_URL}/auth/logout/callback`,
  }).href;
}

// Helper: Require authentication
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({
      authenticated: false,
      message: "Please login first",
    });
  }

  next();
}

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Backend server is running",
  });
});

// ==========================================
// 1. LOGIN
// ==========================================

app.get(["/auth/login", "/auth/register"], async (req, res, next) => {
  try {
    const registering = req.path === "/auth/register";
    const codeVerifier = oidc.randomPKCECodeVerifier();
    const codeChallenge =
      await oidc.calculatePKCECodeChallenge(codeVerifier);

    const state = oidc.randomState();
    const nonce = oidc.randomNonce();

    // Store temporary authentication data
    req.session.codeVerifier = codeVerifier;
    req.session.state = state;
    req.session.nonce = nonce;
    req.session.registering = registering;

    await saveSession(req);

    // Create Keycloak login URL
    const loginUrl = oidc.buildAuthorizationUrl(oidcConfig, {
      redirect_uri: `${BACKEND_URL}/auth/callback`,
      response_type: "code",
      scope: "openid profile email",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state,
      nonce,
      ...(registering && { prompt: "create" }),
    });

    // Redirect browser to Keycloak
    res.redirect(loginUrl.href);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 2. KEYCLOAK CALLBACK
// ==========================================

app.get("/auth/callback", async (req, res, next) => {
  try {
    const { codeVerifier, state, nonce, registering } = req.session;

    if (!codeVerifier || !state || !nonce) {
      return res.redirect(`${FRONTEND_URL}/home`);
    }

    // Get callback URL
    const currentUrl = new URL(
      `${BACKEND_URL}${req.originalUrl}`
    );

    // Exchange authorization code for tokens
    const tokens = await oidc.authorizationCodeGrant(
      oidcConfig,
      currentUrl,
      {
        pkceCodeVerifier: codeVerifier,
        expectedState: state,
        expectedNonce: nonce,
      }
    );

    const claims = tokens.claims();

    if (!claims) {
      throw new Error("ID token claims not found");
    }

    // Regenerate session to prevent session fixation
    await new Promise((resolve, reject) => {
      req.session.regenerate((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    if (registering) {
      return res.redirect(keycloakLogoutUrl(tokens.id_token));
    }

    // Keycloak includes realm and client roles in the access token by default.
    const accessClaims = readAccessTokenClaims(tokens.access_token);
    const roles = [claims, accessClaims].flatMap((tokenClaims) => [
      ...(tokenClaims.realm_access?.roles ?? []),
      ...Object.values(tokenClaims.resource_access ?? {}).flatMap(
        (client) => client.roles ?? []
      ),
    ]);

    // Save logged-in user
    req.session.user = {
      id: claims.sub,
      username: claims.preferred_username ?? accessClaims.preferred_username,
      name: claims.name ?? accessClaims.name,
      firstName: claims.given_name ?? accessClaims.given_name,
      lastName: claims.family_name ?? accessClaims.family_name,
      email: claims.email ?? accessClaims.email,
      roles: [...new Set(roles)],
    };

    // Keep ID token for Keycloak logout
    req.session.idToken = tokens.id_token;

    await saveSession(req);

    console.log("User logged in:", req.session.user.username);

    // Redirect to React Home page
    res.redirect(`${FRONTEND_URL}/home`);
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 3. CHECK LOGIN STATUS
// ==========================================

app.get("/api/me", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      authenticated: false,
      message: "Not logged in",
    });
  }

  res.json({
    authenticated: true,
    user: req.session.user,
  });
});

// ==========================================
// 4. PROTECTED HOME API
// ==========================================

app.get("/api/home", requireAuth, (req, res) => {
  res.json({
    message: "Welcome to Home!",
    user: req.session.user,
  });
});

// ==========================================
// 5. LOGOUT
// ==========================================

app.get("/auth/logout", async (req, res, next) => {
  try {
    const idToken = req.session.idToken;

    // Destroy local application session
    req.session.destroy((error) => {
      if (error) {
        return next(error);
      }

      res.clearCookie("keycloak.sid", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      // If no ID token exists, return to login
      if (!idToken) {
        return res.redirect(`${BACKEND_URL}/auth/login`);
      }

      res.redirect(keycloakLogoutUrl(idToken));
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 6. LOGOUT CALLBACK
// ==========================================

app.get("/auth/logout/callback", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("keycloak.sid");

    res.redirect(`${BACKEND_URL}/auth/login`);
  });
});

// ==========================================
// 7. ERROR HANDLER
// ==========================================

app.use((error, req, res, next) => {
  console.error("Server error:", error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    message: "Something went wrong",
  });
});

// ==========================================
// 8. INITIALIZE KEYCLOAK AND START SERVER
// ==========================================

async function startServer() {
  try {
    console.log("Connecting to Keycloak...");

    oidcConfig = await oidc.discovery(
      new URL(KEYCLOAK_ISSUER),
      CLIENT_ID,
      CLIENT_SECRET,
      undefined,
        {
            execute: [oidc.allowInsecureRequests],
        }
    );

    console.log("Successfully connected to Keycloak!");

    app.listen(PORT, () => {
      console.log("--------------------------------");
      console.log(`Backend: ${BACKEND_URL}`);
      console.log(`Frontend: ${FRONTEND_URL}`);
      console.log(`Keycloak: ${KEYCLOAK_ISSUER}`);
      console.log("--------------------------------");
      console.log("Server is ready!");
    });
  } catch (error) {
    console.error("Failed to initialize Keycloak:", error);
    process.exit(1);
  }
}

startServer();
