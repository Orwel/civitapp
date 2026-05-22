/** Enmascara cédula para UI: muestra últimos 3 dígitos. */
export function maskCedula(cedula: string): string {
  const digits = cedula.replace(/\D/g, "");
  if (digits.length <= 3) return "***";
  return `***${digits.slice(-3)}`;
}
