"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, Clipboard, Download, FileText, LoaderCircle, RefreshCw, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { LoadingSkeleton } from "@/components/loading-skeleton";
import { StatusBadge } from "@/components/status-badge";
import { useAuth } from "@/hooks/use-auth";
import { useDocumentPolling } from "@/hooks/use-document-polling";
import { getDocument, regenerateSummary } from "@/lib/api";
import { formatBytes } from "@/lib/format";
import type { DocumentDetail, SummaryStyle } from "@/lib/types";

const STYLES: SummaryStyle[] = ["Brief", "Detailed", "Bullet points"];

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { session, loading } = useAuth();
  const [detail, setDetail] = useState<DocumentDetail | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [style, setStyle] = useState<SummaryStyle>("Brief");
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const token = session?.access_token;
  const shouldPoll = Boolean(token && detail && (detail.status === "queued" || detail.status === "extracting" || detail.status === "summarizing" || regenerating));
  const { document: polledDocument, error: pollingError } = useDocumentPolling(id, token, shouldPoll);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const result = await getDocument(id, token);
      setDetail(result);
      if (result.summary) setStyle(result.summary.style);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load this document.");
    } finally {
      setInitialLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    if (!loading && !session) router.replace("/login");
  }, [loading, router, session]);

  useEffect(() => {
    if (token) void load();
  }, [load, token]);

  useEffect(() => {
    if (!polledDocument || !token) return;
    setDetail((current) => current ? { ...current, ...polledDocument } : current);
    if (polledDocument.status === "completed" || polledDocument.status === "failed") {
      setRegenerating(false);
      void load();
    }
  }, [load, polledDocument, token]);

  async function handleRegenerate() {
    if (!token) return;
    setRegenerating(true);
    setError(null);
    try {
      await regenerateSummary(id, token, style);
      setDetail((current) => current ? { ...current, status: "summarizing" } : current);
    } catch (regenerateError) {
      setRegenerating(false);
      setError(regenerateError instanceof Error ? regenerateError.message : "Could not regenerate summary.");
    }
  }

  async function copySummary() {
    if (!detail?.summary) return;
    try {
      await navigator.clipboard.writeText(`# ${detail.summary.title}\n\n${detail.summary.summary_text}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy to clipboard. Check browser clipboard permissions.");
    }
  }

  function downloadSummary() {
    if (!detail?.summary) return;
    const content = `# ${detail.summary.title}\n\n${detail.summary.summary_text}\n\n## Key takeaways\n\n${detail.summary.key_points.map((point) => `- ${point}`).join("\n")}\n`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${detail.filename.replace(/\.[^.]+$/, "")}-summary.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (loading || !session || initialLoading) {
    return <main className="page-shell"><LoadingSkeleton /></main>;
  }
  if (error && !detail) {
    return <main className="page-shell"><div className="section-card"><p className="form-error">{error}</p><Link className="button-secondary mt-5" href="/dashboard"><ArrowLeft size={16} /> Back to documents</Link></div></main>;
  }
  if (!detail) return null;

  return (
    <main className="page-shell">
      <div className="detail-toolbar">
        <div>
          <Link href="/dashboard" className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-ink dark:hover:text-white"><ArrowLeft size={16} /> All documents</Link>
          <h1 className="page-title text-3xl">{detail.summary?.title ?? detail.filename}</h1>
          <p className="page-subtitle">{detail.filename} · {formatBytes(detail.file_size)}{detail.page_count !== null ? ` · ${detail.page_count} ${detail.file_type === "pptx" ? "slides" : "pages"}` : ""}</p>
        </div>
        <StatusBadge status={detail.status} />
      </div>

      {error && <p className="form-error mt-5" role="alert">{error}</p>}
      {pollingError && detail.status !== "completed" && detail.status !== "failed" && <p className="mt-4 text-sm text-amber-700">{pollingError} Retrying status check…</p>}
      {detail.status === "failed" && <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{detail.error_message ?? "Processing failed."}</div>}
      {(detail.status === "queued" || detail.status === "extracting" || detail.status === "summarizing") && (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-line bg-white p-4 text-sm text-muted dark:bg-surface">
          <LoaderCircle className="animate-spin text-brand-600" size={17} />
          {detail.status === "queued" ? "Your document is waiting to be processed." : detail.status === "extracting" ? "Extracting text from your document…" : "Creating your summary…"}
        </div>
      )}

      <div className="detail-grid">
        <section className="detail-panel">
          <div className="panel-header">
            <div className="flex items-center gap-2"><FileText size={17} className="text-muted" /><h2 className="section-heading">Original text</h2></div>
            <span className="text-xs text-muted">{detail.page_count ?? "—"} {detail.file_type === "pptx" ? "slides" : "pages"}</span>
          </div>
          <div className="panel-body">
            {detail.extracted_text ? (
              <pre className="document-text">{detail.extracted_text}</pre>
            ) : (
              <div className="py-16 text-center text-sm text-muted">
                {detail.status === "failed" ? "The text could not be extracted." : "Extracted text will appear here when processing finishes."}
              </div>
            )}
          </div>
        </section>

        <section className="detail-panel">
          <div className="panel-header">
            <div className="flex items-center gap-2"><Sparkles size={17} className="text-brand-600" /><h2 className="section-heading">AI summary</h2></div>
            {detail.summary && (
              <div className="flex gap-1">
                <button type="button" className="icon-button h-8 w-8" onClick={() => void copySummary()} title="Copy summary" aria-label="Copy summary">{copied ? <Check size={15} /> : <Clipboard size={15} />}</button>
                <button type="button" className="icon-button h-8 w-8" onClick={downloadSummary} title="Download Markdown" aria-label="Download summary as Markdown"><Download size={15} /></button>
              </div>
            )}
          </div>
          <div className="panel-body">
            {detail.summary ? (
              <>
                <h2 className="mb-4 text-xl font-bold tracking-tight text-ink dark:text-white">{detail.summary.title}</h2>
                <article className="markdown-body"><ReactMarkdown>{detail.summary.summary_text}</ReactMarkdown></article>
                {detail.summary.key_points.length > 0 && (
                  <div className="takeaways">
                    <h3 className="mb-2 text-sm font-bold text-ink dark:text-white">Key takeaways</h3>
                    {detail.summary.key_points.map((point, index) => <div className="takeaway" key={`${index}-${point}`}><span className="takeaway-bullet" /><span>{point}</span></div>)}
                  </div>
                )}
              </>
            ) : (
              <div className="py-16 text-center text-sm text-muted">
                {detail.status === "failed" ? "A summary isn’t available for this document." : "Your summary will appear here when processing finishes."}
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="section-card mt-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h2 className="section-heading">Summary style</h2><p className="section-caption">Generate a new version without re-uploading the document.</p></div>
          <div className="flex items-center gap-2">
            <select className="select-field" value={style} onChange={(event) => setStyle(event.target.value as SummaryStyle)} aria-label="Summary style">
              {STYLES.map((item) => <option key={item}>{item}</option>)}
            </select>
            <button type="button" className="button-primary" onClick={() => void handleRegenerate()} disabled={regenerating || !detail.extracted_text}>
              {regenerating ? <LoaderCircle size={16} className="animate-spin" /> : <RefreshCw size={15} />}
              {regenerating ? "Generating…" : "Regenerate"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
