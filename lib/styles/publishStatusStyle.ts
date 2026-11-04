export const statusStyles: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  draft: "bg-amber-50 text-amber-700 border border-amber-200",
  //   draft: "bg-slate-100 text-slate-600 border border-slate-200",
  rejected: "bg-rose-50 text-rose-700 border border-rose-200",
};

export const statusDotStyles: Record<string, string> = {
  published: "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]",
  draft: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.7)] animate-pulse",
  //   draft: "bg-slate-400",
  rejected: "bg-rose-500",
};
