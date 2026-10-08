import type {
  DocumentDetail,
  DocumentRecord,
  SummaryStyle,
} from "@/lib/types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ??
  (process.env.NODE_ENV === "development"
    ? "http://localhost:8000/api/v1"
    : "");

async function apiRequest<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured for this deployment.");
  }
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const detail =
      typeof body === "object" &&
      body !== null &&
      "detail" in body &&
      typeof body.detail === "string"
        ? body.detail
        : `Request failed (${response.status}).`;
    throw new Error(detail);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function getDocuments(token: string): Promise<DocumentRecord[]> {
  const result = await apiRequest<{ documents: DocumentRecord[]; total: number }>(
    "/documents",
    token,
  );
  return result.documents;
}

export function getDocument(
  id: string,
  token: string,
): Promise<DocumentDetail> {
  return apiRequest(`/documents/${id}`, token);
}

export function getDocumentStatus(
  id: string,
  token: string,
): Promise<DocumentRecord> {
  return apiRequest(`/documents/${id}/status`, token);
}

export function regenerateSummary(
  id: string,
  token: string,
  style: SummaryStyle,
): Promise<{ id: string; status: string }> {
  return apiRequest(`/documents/${id}/summaries`, token, {
    method: "POST",
    body: JSON.stringify({ style }),
  });
}

export function uploadDocument(
  file: File,
  token: string,
  onProgress: (percentage: number) => void,
): Promise<{ id: string; status: string }> {
  return (async () => {
    const preparation = await apiRequest<{
      id: string;
      status: string;
      storage_path: string;
      upload_url: string;
    }>("/documents", token, {
      method: "POST",
      body: JSON.stringify({
        filename: file.name,
        file_type: file.name.split(".").pop()?.toLowerCase(),
        file_size: file.size,
      }),
    });

    try {
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseAnonKey) {
        throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured.");
      }

      await new Promise<void>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("PUT", preparation.upload_url);
        request.setRequestHeader("apikey", supabaseAnonKey);
        request.setRequestHeader("Authorization", `Bearer ${token}`);
        request.setRequestHeader(
          "Content-Type",
          file.type || "application/octet-stream",
        );
        request.setRequestHeader("x-upsert", "false");
        request.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        request.onerror = () => reject(new Error("Network error while uploading to storage."));
        request.onload = () => {
          if (request.status >= 200 && request.status < 300) {
            resolve();
            return;
          }
          let storageMessage: string | undefined;
          try {
            const response = JSON.parse(request.responseText) as {
              message?: unknown;
              error?: unknown;
            };
            if (typeof response.message === "string") {
              storageMessage = response.message;
            } else if (typeof response.error === "string") {
              storageMessage = response.error;
            }
          } catch {
            // Use the HTTP status when Storage does not return a JSON error.
          }
          reject(
            new Error(
              storageMessage
                ? `Storage upload failed (${request.status}): ${storageMessage}`
                : `Storage upload failed (${request.status}${request.statusText ? ` ${request.statusText}` : ""}).`,
            ),
          );
        };
        request.send(file);
      });
    } catch (error) {
      try {
        await apiRequest<void>(
          `/documents/${preparation.id}/upload-failed`,
          token,
          {
            method: "POST",
            body: JSON.stringify({
              message: error instanceof Error ? error.message : "File upload did not complete.",
            }),
          },
        );
      } catch (cleanupError) {
        console.error("Could not persist failed upload state:", cleanupError);
      }
      throw error;
    }

    onProgress(100);
    return apiRequest<{ id: string; status: string }>(
      `/documents/${preparation.id}/process`,
      token,
      { method: "POST" },
    );
  })();
}
