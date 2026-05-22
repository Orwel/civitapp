-- RLS para tablas de catálogo (tipos de iniciativa e instrumentos): lectura pública

ALTER TABLE initiative_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE instrument_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE instrument_types ENABLE ROW LEVEL SECURITY;

-- Catálogos: solo lectura para todos (son datos de referencia)
CREATE POLICY "initiative_types_select" ON initiative_types FOR SELECT USING (true);
CREATE POLICY "instrument_categories_select" ON instrument_categories FOR SELECT USING (true);
CREATE POLICY "instrument_types_select" ON instrument_types FOR SELECT USING (true);
