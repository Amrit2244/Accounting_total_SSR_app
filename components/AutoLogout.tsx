"use client";

import { useEffect } from "react";
import { logout } from "@/app/actions/auth";

const TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes idle time

export default function AutoLogout() {
  useEffect(() => {
    let logoutTimer: NodeJS.Timeout;

    const performAutoLogout = async () => {
      console.log("User inactive. Logging out...");
      await logout();
    };

    const resetTimer = () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      logoutTimer = setTimeout(performAutoLogout, TIMEOUT_MS);
    };

    const events = ["click", "mousemove", "keypress", "scroll", "touchstart"];

    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      if (logoutTimer) clearTimeout(logoutTimer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, []);

  return null;
}
