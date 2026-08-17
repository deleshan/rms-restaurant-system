export const getStockStatus = (item) => {
  if (item.currentStock <= 0) return 'out';
  if (item.currentStock <= item.minimumStock) return 'low';
  return 'healthy';
};

export const stockStatusConfig = {
  out:     { label: 'OUT OF STOCK', dot: 'bg-rose-500',   text: 'text-rose-400',   border: 'border-rose-900/40',   bg: 'bg-rose-950/10' },
  low:     { label: 'LOW STOCK',    dot: 'bg-amber-500',  text: 'text-amber-400',  border: 'border-amber-900/30',  bg: 'bg-amber-950/5' },
  healthy: { label: 'IN STOCK',     dot: 'bg-emerald-500',text: 'text-slate-300',  border: 'border-slate-800',      bg: 'bg-slate-900/50' },
};
