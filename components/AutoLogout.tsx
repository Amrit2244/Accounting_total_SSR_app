"use client";

import { useEffect, useRef } from "react";
import { logout } from "@/app/actions/auth";

const TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes
const THROTTLE_MS = 1000; // Only reset timer max once per second

export default function AutoLogout() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivity = useRef<number>(Date.now());

  useEffect(() => {
    // 1. The Logout Execution
    const performAutoLogout = async () => {
      try {
        await logout();
      } catch (error) {
        console.error("Auto-logout server action failed:", error);
      } finally {
        // Hard redirect ensures client-side state is completely flushed
        window.location.href = "/login";
      }
    };

    // 2. Timer Logic
    const startTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(performAutoLogout, TIMEOUT_MS);
    };

    // 3. Event Handler (Throttled for Performance)
    const handleActivity = () => {
      const now = Date.now();
      // Optimization: Don't reset on every single pixel of mouse movement
      if (now - lastActivity.current > THROTTLE_MS) {
        lastActivity.current = now;
        startTimer();
      }
    };

    // 4. Setup Listeners
    // 'passive: true' improves scrolling performance
    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
    ];

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial Start
    startTimer();

    // 5. Cleanup
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, []);

  // This component is purely functional and renders nothing
  return null;
}
