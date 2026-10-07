"use client";

import { useEffect, useState } from "react";

import { getDocumentStatus } from "@/lib/api";
import type { DocumentRecord } from "@/lib/types";

export function useDocumentPolling(
  documentId: string,
  token: string | undefined,
  enabled: boolean,
) {
  const [document, setDocument] = useState<DocumentRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !token) return;
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const result = await getDocumentStatus(documentId, token);
        if (cancelled) return;
        setDocument(result);
        setError(null);
        if (result.status !== "completed" && result.status !== "failed") {
          timeout = setTimeout(poll, 2000);
        }
      } catch (pollError) {
        if (cancelled) return;
        setError(
          pollError instanceof Error
            ? pollError.message
            : "Could not refresh processing status.",
        );
        timeout = setTimeout(poll, 5000);
      }
    };

    void poll();
    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [documentId, token, enabled]);

  return { document, setDocument, error };
}
