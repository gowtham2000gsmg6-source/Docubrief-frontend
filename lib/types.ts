export type DocumentStatus =
  | "queued"
  | "extracting"
  | "summarizing"
  | "completed"
  | "failed";

export type SummaryStyle = "Brief" | "Detailed" | "Bullet points";

export interface Summary {
  id: string;
  document_id: string;
  style: SummaryStyle;
  title: string;
  summary_text: string;
  key_points: string[];
  model_used: string;
  token_count: number | null;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  status: DocumentStatus;
  error_message: string | null;
  page_count: number | null;
  created_at: string;
  updated_at: string;
  summary?: Summary | null;
}

export interface DocumentDetail extends DocumentRecord {
  extracted_text: string | null;
  summaries: Summary[];
}
