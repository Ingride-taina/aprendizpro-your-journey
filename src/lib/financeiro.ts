export const brl = (valor: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

/**
 * Valor Futuro = Aporte × [((1 + i)^n - 1) / i]
 * i = taxa de juros mensal em decimal (ex.: 0.005), n = número de meses.
 */
export function valorFuturo(aporte: number, i: number, n: number): number {
  if (!Number.isFinite(aporte) || !Number.isFinite(i) || !Number.isFinite(n)) return 0;
  if (n <= 0) return 0;
  if (i <= 0) return aporte * n;
  return aporte * ((Math.pow(1 + i, n) - 1) / i);
}

export const CATEGORIAS = [
  "Alimentação",
  "Transporte",
  "Estudos",
  "Moradia",
  "Lazer",
  "Saúde",
  "Salário",
  "Outros",
] as const;

export function inicioDoMes(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function isoData(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
