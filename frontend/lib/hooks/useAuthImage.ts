"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api/axios";
import { ENDPOINTS } from "@/lib/api/endpoints";

/**
 * Fetches a protected user photo (GET /api/users/:id/photo) using the
 * authenticated axios instance and returns a local blob object URL.
 *
 * We can't just point <img src> at the endpoint directly because the
 * JWT lives in localStorage, not a cookie -- the browser won't attach
 * it to a plain <img> request. So we fetch the bytes ourselves (axios
 * interceptor adds the Authorization header) and hand the browser a
 * blob: URL instead.
 */
export function useAuthImage(userId?: string | null, hasPhoto?: boolean) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    if (!userId || !hasPhoto) {
      setUrl(null);
      return;
    }

    api
      .get(ENDPOINTS.USER_PHOTO(userId), { responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(res.data);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [userId, hasPhoto]);

  return url;
}