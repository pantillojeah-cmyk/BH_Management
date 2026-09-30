export const peso = (n: number) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n);

export type VacancyState = { label: string; tone: "available" | "limited" | "full" };

export function vacancyState(vacancies: number, rooms: number): VacancyState {
  if (vacancies <= 0) return { label: "Fully Occupied", tone: "full" };
  const ratio = rooms > 0 ? vacancies / rooms : 1;
  if (ratio <= 0.3) return { label: "Limited Slots", tone: "limited" };
  return { label: "Available", tone: "available" };
}

export const toneClass: Record<VacancyState["tone"], string> = {
  available: "bg-emerald-100 text-emerald-700 border-emerald-200",
  limited: "bg-amber-100 text-amber-700 border-amber-200",
  full: "bg-rose-100 text-rose-700 border-rose-200",
};
