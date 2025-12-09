import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith("/");
            const isOnLogin = nextUrl.pathname.startsWith("/login");

            // Simple protection logic
            // Note: Adjust paths as needed based on frontend routing. 
            // For now, protecting everything except login and public assets.

            if (isOnDashboard) {
                if (isOnLogin) return true; // Allow login page
                if (isLoggedIn) return true;
                return false; // Redirect to login
            } else if (isLoggedIn) {
                // If logged in and on login page, redirect to dashboard?
                // Logic handled by UI usually, but middleware can enforce.
                // For API routes, usually authentication is handled per route handler or via middleware.
                // Middleware regex excludes /api currently, so API is checked in route handlers (as I implemented).
                // This middleware mainly protects UI pages.
            }
            return true;
        },
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
