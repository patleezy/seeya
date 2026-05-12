export type EventType = 'meeting' | 'party' | 'trip' | 'other';
export type EventMode = 'times' | 'days';

export interface Event {
  id: string;
  name: string;
  description: string | null;
  type: EventType;
  mode: EventMode;
  creator_name: string;
  dates: string[];
  time_start: string | null;
  time_end: string | null;
  slot_duration: number | null;
  created_at: string;
}

export interface Response {
  id: string;
  event_id: string;
  respondent_name: string;
  availability: string[];
  created_at: string;
}

export interface AiRecommendation {
  id: string;
  event_id: string;
  recommendation: string;
  best_slots: string[];
  source: 'algorithm' | 'ai';
  generated_at: string;
}

export type SlotDensityMap = Record<string, number>;

export interface CreateEventRequest {
  name: string;
  description?: string;
  type: EventType;
  mode: EventMode;
  creator_name: string;
  dates: string[];
  time_start?: string;
  time_end?: string;
  slot_duration?: 30 | 60;
}

export interface CreateResponseRequest {
  respondent_name: string;
  availability: string[];
}
