export interface Task {
  id: string;
  title: string;
  notes: string;
  dueDate: string; // ISO String or YYYY-MM-DD HH:mm
  estimatedMinutes: number;
  importance: number; // 1 to 5
  tags: string[];
  subtasks: { id: string; text: string; completed: boolean }[];
  completed: boolean;
}

export interface Habit {
  id: string;
  name: string;
  streak: number;
  completedDays: string[]; // array of YYYY-MM-DD
}

export interface BusyBlock {
  id: string;
  label: string;
  start: string; // ISO or YYYY-MM-DDTHH:mm
  end: string;
}

export interface ScheduleBlock {
  start_iso: string;
  end_iso: string;
  label: string;
}

export interface RiskOfMissing {
  probability_0_to_1: number;
  why: string;
}

export interface PlanPriority {
  task_local_id: string;
  priority_score: number;
  reason: string;
  next_action: string;
  estimated_minutes: number;
  schedule_blocks: ScheduleBlock[];
  risk_of_missing: RiskOfMissing;
}

export interface PlanNudge {
  fire_at_iso: string;
  title: string;
  body: string;
  type: "CHECK_IN" | "START_NOW" | "DEADLINE_SOON";
  triggered?: boolean;
}

export interface PlanningResponse {
  date: string;
  timezone: string;
  model_used_label: string;
  priorities: PlanPriority[];
  nudges: PlanNudge[];
}

export interface SavedPrefs {
  nvidia_key: string;
  ollama_key: string;
  gemini_key?: string;
  auto_fallback: boolean;
  working_hours_start: string;
  working_hours_end: string;
  timezone: string;
  selected_model?: string;
}

export function sanitizeApiKey(key: string | undefined): string {
  if (!key) return "";
  const trimmed = key.trim();
  const blacklisted = [
    "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",
    "30980567d66e4e4daee28951c3c7dd61.arAY7BW--sI5vAT9OTpnk1dR",
    "AIzaSyABYinJ0rbpnE7QbHe8C5WZLKADRMrGbsw"
  ];
  if (blacklisted.includes(trimmed)) {
    return "";
  }
  return trimmed;
}

