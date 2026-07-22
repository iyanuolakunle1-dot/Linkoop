import { useEffect, useRef } from "react";
import { api } from "../lib/api";

const IDLE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];

export function useIdleStatus(enabled) {
  const currentStatusRef = useRef("online");
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    async function setStatus(status) {
      if (currentStatusRef.current === status) return;
      currentStatusRef.current = status;
      try {
        await api.patch("/profiles/me/status", { status });
      } catch {
        // non-critical, will self-correct on next activity/timeout
      }
    }

    function resetTimer() {
      if (document.hidden) return; // don't fight visibilitychange handling below

      if (currentStatusRef.current === "away") {
        setStatus("online");
      }

      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setStatus("away"), IDLE_THRESHOLD_MS);
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        // Tab backgrounded: let the existing timer keep running (don't reset it),
        // but don't immediately mark away either — switching tabs briefly shouldn't flip status.
      } else {
        resetTimer();
      }
    }

    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, resetTimer, { passive: true }));
    document.addEventListener("visibilitychange", handleVisibilityChange);

    resetTimer(); // start the initial countdown

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, resetTimer));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearTimeout(timeoutRef.current);
    };
  }, [enabled]);
}