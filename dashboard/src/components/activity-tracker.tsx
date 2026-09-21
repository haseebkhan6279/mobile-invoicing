"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { pageActivityTitle } from "@/lib/log-analytics";

function sendLog(body: {
  type: "PAGE" | "ERROR";
  path: string;
  title: string;
  message?: string;
  status?: number;
  method?: string;
}) {
  void fetch("/api/activity-logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    keepalive: true,
  }).catch(() => {});
}

export function ActivityTracker() {
  const pathname = usePathname();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === lastPath.current) return;
    lastPath.current = pathname;
    sendLog({
      type: "PAGE",
      path: pathname,
      title: pageActivityTitle(pathname),
      method: "GET",
      status: 200,
    });
  }, [pathname]);

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      sendLog({
        type: "ERROR",
        path: window.location.pathname,
        title: "Browser error",
        message: event.message || "Unknown error",
        status: 500,
      });
    };
    const onRejected = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "Unhandled promise rejection";
      sendLog({
        type: "ERROR",
        path: window.location.pathname,
        title: "Browser error",
        message,
        status: 500,
      });
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejected);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejected);
    };
  }, []);

  return null;
}
