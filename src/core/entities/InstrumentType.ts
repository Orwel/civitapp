export interface InstrumentCategory {
  id: string;
  name: string;
  slug: string;
  order_index: number;
  created_at: string;
}

export interface InstrumentType {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  requires_signatures: boolean;
  order_index: number;
  created_at: string;
  category?: InstrumentCategory;
}

/** Instrument type con categoría para UI (join) */
export interface InstrumentTypeWithCategory extends InstrumentType {
  category: InstrumentCategory;
}
