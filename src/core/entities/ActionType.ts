export interface ActionType {
  id: string;
  name: string;
  slug: string;
  competent_entity_hint: string | null;
  order_index: number;
  created_at: string;
}
