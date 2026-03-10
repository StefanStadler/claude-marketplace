export const VALID_CATEGORIES = ['context', 'decision', 'working_style', 'snippet'] as const;
export type Category = typeof VALID_CATEGORIES[number];

export interface Memory {
  id: number;
  category: Category;
  project: string | null;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface MemoryRow {
  id: number;
  category: string;
  project: string | null;
  title: string;
  content: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

export interface SearchParams {
  query?: string;
  category?: string;
  project?: string | null;
  tags?: string[];
  limit: number;
}

export interface InsertParams {
  category: string;
  project?: string | null;
  title: string;
  content: string;
  tags: string[];
}

export interface UpdateParams {
  id: number;
  title?: string;
  content?: string;
  tags?: string[];
}

// Claude Code hook stdin payloads
export interface SessionStartInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: 'SessionStart';
}

export interface StopInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name: 'Stop';
  stop_hook_active: boolean;
}
