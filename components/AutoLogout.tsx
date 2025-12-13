"use client";

import { useEffect } from "react";
import { logout } from "@/app/actions/auth";

// 5 Minutes in milliseconds
// 5 * 60 * 1000 = 300,000 ms
const TIMEOUT_MS = 5 * 60 * 1000;

export default function AutoLogout() {
  useEffect(() => {
    // Variable to hold the timer
    let logoutTimer: NodeJS.Timeout;

    // The function that actually logs the user out
    const performAutoLogout = async () => {
      // Optional: Add a console log or toast message here
      console.log("User inactive. Logging out...");
      await logout();
    };

    // The function to reset the timer when user is active
    const resetTimer = () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      logoutTimer = setTimeout(performAutoLogout, TIMEOUT_MS);
    };

    // Events that constitute "working" or "activity"
    const events = [
      "click",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart", // for mobile
    ];

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Start the timer immediately on mount
    resetTimer();

    // Cleanup: Remove event listeners when component unmounts
    return () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, []);

  // This component renders nothing visually
  return null;
}
