"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, FileText, RefreshCw, Sparkles, Trash2 } from "lucide-react";

import { LoadingSkeleton } from "@/components/loading-skeleton";
import { StatusBadge } from "@/components/status-badge";
import { UploadZone } from "@/components/upload-zone";
import { useAuth } from "@/hooks/use-auth";
import { deleteDocument, getDocuments } from "@/lib/api";
import { formatBytes, formatDate } from "@/lib/format";
import type { DocumentRecord } from "@/lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const { session, loading } = useAuth();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    const token = session?.access_token;
    if (!token) return;
    setError(null);
    try {
      setDocuments(await getDocuments(token));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load documents.");
    } finally {
      setFetching(false);
    }
  }, [session?.access_token]);

  async function handleDelete(document: DocumentRecord) {
    const token = session?.access_token;
    if (!token || deletingId) return;
    if (!window.confirm(`Delete "${document.filename}" and its summaries? This cannot be undone.`)) {
      return;
    }
    setDeletingId(document.id);
    setError(null);
    try {
      await deleteDocument(document.id, token);
      setDocuments((current) => current.filter((item) => item.id !== document.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete document.");
    } finally {
      setDeletingId(null);
    }
  }

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [loading, router, session]);

  useEffect(() => {
    if (session) void loadDocuments();
  }, [loadDocuments, session]);

  useEffect(() => {
    const refresh = () => void loadDocuments();
    window.addEventListener("docubrief:uploaded", refresh);
    const interval = window.setInterval(refresh, 5000);
    return () => {
      window.removeEventListener("docubrief:uploaded", refresh);
      window.clearInterval(interval);
    };
  }, [loadDocuments]);

  if (loading || !session) {
    return <main className="page-shell"><LoadingSkeleton /></main>;
  }

  return (
    <main className="page-shell">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-600"><Sparkles size={16} /> Your document workspace</p>
          <h1 className="page-title">Good to see you.</h1>
          <p className="page-subtitle">Turn long documents into clear ideas and useful takeaways.</p>
        </div>
        <button type="button" onClick={() => void loadDocuments()} className="button-secondary">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="space-y-7">
        <section className="section-card">
          <div className="mb-5">
            <h2 className="section-heading">Add documents</h2>
            <p className="section-caption">Upload one or more files to start a summary.</p>
          </div>
          <UploadZone token={session.access_token} />
        </section>

        <section className="section-card">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="section-heading">Your documents</h2>
              <p className="section-caption">{documents.length} {documents.length === 1 ? "document" : "documents"} in your workspace</p>
            </div>
          </div>
          {error && (
            <div className="mb-4 flex items-center justify-between rounded-xl bg-red-50 p-3 text-sm text-red-700">
              <span>{error}</span><button type="button" className="button-quiet" onClick={() => void loadDocuments()}>Retry</button>
            </div>
          )}
          {fetching ? (
            <LoadingSkeleton />
          ) : documents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line py-12 text-center">
              <span className="file-icon mx-auto mb-3"><FileText size={18} /></span>
              <p className="font-semibold text-ink dark:text-white">No documents yet</p>
              <p className="mt-1 text-sm text-muted">Upload a document above to see it here.</p>
            </div>
          ) : (
            <div>
              {documents.map((document) => (
                <div className="document-row" key={document.id}>
                  <span className="file-icon"><FileText size={17} /></span>
                  <Link className="document-link" href={`/documents/${document.id}`}>
                    <p className="document-title">{document.filename}</p>
                    <p className="document-meta">{formatBytes(document.file_size)} · {formatDate(document.created_at)}{document.summary?.title ? ` · ${document.summary.title}` : ""}</p>
                  </Link>
                  <StatusBadge status={document.status} />
                  <Link href={`/documents/${document.id}`} className="icon-button hidden sm:inline-grid" aria-label={`Open ${document.filename}`}><ArrowUpRight size={17} /></Link>
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => void handleDelete(document)}
                    disabled={
                      deletingId !== null ||
                      document.status === "queued" ||
                      document.status === "extracting" ||
                      document.status === "summarizing"
                    }
                    aria-label={`Delete ${document.filename}`}
                    title={
                      document.status === "queued" ||
                      document.status === "extracting" ||
                      document.status === "summarizing"
                        ? "Wait for processing to finish before deleting"
                        : "Delete document"
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
