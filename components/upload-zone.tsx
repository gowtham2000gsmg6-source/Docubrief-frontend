"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { AlertCircle, CheckCircle2, FileText, LoaderCircle, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { uploadDocument } from "@/lib/api";
import { formatBytes } from "@/lib/format";

const MAX_BYTES = 25 * 1024 * 1024;
const ACCEPTED = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "text/plain": [".txt"],
  "text/markdown": [".md"],
};

type UploadItem = {
  id: string;
  name: string;
  size: number;
  progress: number;
  state: "uploading" | "queued" | "failed";
  error?: string;
};

export function UploadZone({ token }: { token: string }) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const router = useRouter();

  const onDrop = useCallback(
    (files: File[]) => {
      files.forEach((file) => {
        const id = crypto.randomUUID();
        const initial: UploadItem = {
          id,
          name: file.name,
          size: file.size,
          progress: 0,
          state: "uploading",
        };
        setItems((current) => [initial, ...current]);
        void uploadDocument(file, token, (progress) => {
          setItems((current) =>
            current.map((item) => (item.id === id ? { ...item, progress } : item)),
          );
        })
          .then((document) => {
            setItems((current) =>
              current.map((item) =>
                item.id === id ? { ...item, progress: 100, state: "queued" } : item,
              ),
            );
            router.refresh();
            window.dispatchEvent(new CustomEvent("docubrief:uploaded", { detail: document.id }));
          })
          .catch((error: unknown) => {
            setItems((current) =>
              current.map((item) =>
                item.id === id
                  ? {
                      ...item,
                      state: "failed",
                      error: error instanceof Error ? error.message : "Upload failed.",
                    }
                  : item,
              ),
            );
          });
      });
    },
    [router, token],
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections, open } =
    useDropzone({
      onDrop,
      accept: ACCEPTED,
      maxSize: MAX_BYTES,
      multiple: true,
      noClick: true,
      noKeyboard: true,
    });

  const rejectedMessage =
    fileRejections.length > 0
      ? fileRejections
          .map(({ file, errors }) =>
            errors.some((error) => error.code === "file-too-large")
              ? `${file.name} is larger than 25 MB.`
              : `${file.name} has an unsupported file type.`,
          )
          .join(" ")
      : null;

  return (
    <section className="space-y-4">
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? "dropzone-active" : ""}`}
      >
        <input {...getInputProps()} aria-label="Choose documents to upload" />
        <span className="drop-icon"><UploadCloud size={25} /></span>
        <div>
          <p className="font-semibold text-ink dark:text-white">
            {isDragActive ? "Drop your files here" : "Drag documents here"}
          </p>
          <p className="mt-1 text-sm text-muted">
            PDF, DOCX, PPTX, TXT or MD · up to 25 MB each
          </p>
        </div>
        <button type="button" onClick={open} className="button-secondary shrink-0">
          Browse files
        </button>
      </div>
      {rejectedMessage && (
        <p className="form-error"><AlertCircle size={16} />{rejectedMessage}</p>
      )}
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="upload-item">
              <span className="file-icon"><FileText size={17} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium text-ink dark:text-white">{item.name}</p>
                  <span className="shrink-0 text-xs text-muted">
                    {item.state === "uploading" ? `${item.progress}%` : formatBytes(item.size)}
                  </span>
                </div>
                {item.state === "uploading" && (
                  <div className="progress-track mt-2">
                    <div className="progress-fill" style={{ width: `${item.progress}%` }} />
                  </div>
                )}
                {item.state === "failed" && <p className="mt-1 text-xs text-red-600">{item.error}</p>}
                {item.state === "queued" && <p className="mt-1 text-xs text-brand-600">Upload complete · queued for processing</p>}
              </div>
              {item.state === "uploading" ? (
                <LoaderCircle size={17} className="animate-spin text-muted" />
              ) : item.state === "queued" ? (
                <CheckCircle2 size={17} className="text-brand-600" />
              ) : (
                <button
                  type="button"
                  className="icon-button h-8 w-8"
                  onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                  aria-label={`Dismiss ${item.name}`}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
