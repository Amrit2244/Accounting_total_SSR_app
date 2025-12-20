"use client";

import { useEffect } from "react";
import { logout } from "@/app/actions/auth";

const TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes idle time

export default function AutoLogout() {
  useEffect(() => {
    let logoutTimer: NodeJS.Timeout;

    const performAutoLogout = async () => {
      console.log("User inactive. Logging out...");
      try {
        // 1. Clear the session on the server
        await logout();
      } catch (error) {
        console.error("Logout failed", error);
      } finally {
        // 2. Force the browser to redirect to the login page
        // This ensures the user is actually moved away from the sensitive data
        window.location.href = "/login";
      }
    };

    const resetTimer = () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      logoutTimer = setTimeout(performAutoLogout, TIMEOUT_MS);
    };

    // Listen for these interactions to consider the user "active"
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];

    events.forEach((event) => window.addEventListener(event, resetTimer));

    // Initial start of the timer
    resetTimer();

    return () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, []);

  return null;
}
