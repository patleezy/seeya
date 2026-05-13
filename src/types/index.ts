export type EventType = 'coffee' | 'party' | 'meetup' | 'happy_hour' | 'sports' | 'vacation' | 'dinner' | 'other';
export type EventMode = 'times' | 'days';

export interface Event {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  type: EventType;
  mode: EventMode;
  creator_name: string;
  dates: string[];
  time_start: string | null;
  time_end: string | null;
  slot_duration: number | null;
  timezone: string | null;
  host_token: string;
  finalized_slot: string | null;
  finalized_at: string | null;
  response_deadline: string | null;
  anonymous: boolean;
  max_responses: number | null;
  trip_duration: number | null;
  created_at: string;
}

export interface Response {
  id: string;
  event_id: string;
  respondent_name: string;
  email: string | null;
  availability: string[];
  comment: string | null;
  declined: boolean;
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
  location?: string;
  type: EventType;
  mode: EventMode;
  creator_name: string;
  dates: string[];
  time_start?: string;
  time_end?: string;
  slot_duration?: number;
  timezone?: string;
  response_deadline?: string;
  anonymous?: boolean;
  max_responses?: number;
  trip_duration?: number;
}

export interface CreateResponseRequest {
  respondent_name: string;
  email?: string;
  availability: string[];
  comment?: string;
  declined?: boolean;
}
