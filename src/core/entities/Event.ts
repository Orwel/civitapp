export interface ActionEvent {
  id: string;
  action_id: string;
  event_type: string;
  actor_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}
