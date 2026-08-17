import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  History, 
  Search, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink,
  Filter
} from 'lucide-react';
import { fetchOrderHistory } from '@/features/orders/orderThunks';
import { selectAllOrders, selectFilteredHistory, selectHistoryMeta } from '@/features/orders/orderSelectors';
import Badge from '@/components/ui/Badge';
import Loading from '@/components/common/Loading';
import Button from '@/components/common/Button';
import { formatPrepDuration } from '@/utils/formatPrepTime';

const OrderHistory = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stationFilter, setStationFilter] = useState('All');
  const [page, setPage] = useState(1);
  const limit = 10;
  const historyMeta = useSelector(selectHistoryMeta);
  const filteredHistory = useSelector((state) => selectFilteredHistory(state, searchTerm));

  useEffect(() => {
    dispatch(fetchOrderHistory({ page, limit, station: stationFilter })).finally(() => setLoading(false));
  }, [dispatch, page, stationFilter]);

  useEffect(() => {
    setPage(1);
  }, [stationFilter]);

  const totalPages = Math.max(1, Math.ceil(historyMeta.total / limit));

  

  if (loading) return <Loading message="Retrieving Archives..." fullScreen />;

  return (
    <div className="space-y-6">
      {/* --- Header & Search --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 p-2 rounded-lg border border-slate-700">
            <History className="text-orange-500 w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">ORDER HISTORY</h1>
            <p className="text-slate-500 text-xs font-bold uppercase">Archive of completed services</p>
          </div>
        </div>

        <div className="relative group max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-orange-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Search Table or Order #"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-orange-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <select
          value={stationFilter}
          onChange={(e) => setStationFilter(e.target.value)}
          className="bg-slate-900 border border-slate-700 rounded-xl py-2 px-4 text-sm text-white focus:outline-none focus:border-orange-500 cursor-pointer"
        >
          <option value="All">All Stations</option>
          <option value="Hot Station">Hot Station</option>
          <option value="Cold Station">Cold Station</option>
          <option value="Bar / Drinks">Bar / Drinks</option>
      </select>

      {/* Table Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Order Info</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Items</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Station</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Prep Time</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white text-base">Table {order.tableId}</div>
                      <div className="text-[10px] text-slate-500 font-mono">#{order._id.slice(-6).toUpperCase()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {order.items.map((item, i) => (
                          <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-md border border-slate-700">
                            {item.qty}x {item.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(order.stations || []).map((station) => (
                          <Badge key={station} variant="outline">
                            {station}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-emerald-500 font-mono font-bold text-sm">
                        {formatPrepDuration(order.prepDurationSeconds)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" icon={ExternalLink}>
                        Details
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <Calendar size={48} className="text-slate-400 mb-2" />
                      <p className="text-slate-400 font-bold uppercase tracking-widest">No completed orders found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-800/20 border-t border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-bold uppercase">
            Page {historyMeta.page} of {totalPages} · {historyMeta.total} total
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm" className="p-2"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="outline" size="sm" className="p-2"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;