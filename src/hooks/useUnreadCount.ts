"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api/client";

export function useUnreadCount(intervalMs = 30000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    function fetchCount() {
      apiFetch<{ unreadCount: number }>("/api/notifications/unread-count")
        .then((data) => {
          if (mounted) setCount(data.unreadCount);
        })
        .catch(() => {});
    }

    fetchCount();
    const id = setInterval(fetchCount, intervalMs);

    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [intervalMs]);

  return count;
}
