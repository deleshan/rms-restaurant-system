import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchTables, 
  bulkCreateTables, 
  updateTableStatus, 
  deleteTable 
} from '@/features/table/tableThunks';
import { 
  selectAllTables, 
  selectTablesLoading, 
  selectTablesError 
} from '@/features/table/tableSelectors';
import { QrCode, Plus, Trash2, Power, Users, Settings2, Download, X } from 'lucide-react';
import { QRCode } from 'react-qrcode-logo';
import Button from '@/components/common/Button';

const TableManagementPage = ({ restaurantId }) => {
  const dispatch = useDispatch();
  const tables = useSelector(selectAllTables);
  const loading = useSelector(selectTablesLoading);
  const error = useSelector(selectTablesError);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkData, setBulkData] = useState({ start: 1, end: 10, capacity: 4 });
  const [selectedTable, setSelectedTable] = useState(null);

  const customerBaseUrl = import.meta.env.VITE_CUSTOMER_URL;

  useEffect(() => {
    if (restaurantId) {
      dispatch(fetchTables(restaurantId));
    }
  }, [dispatch, restaurantId]);

  const handleBulkSubmit = (e) => {
    e.preventDefault();
    dispatch(bulkCreateTables({
      restaurantId,
      startNumber: bulkData.start,
      endNumber: bulkData.end,
      capacity: bulkData.capacity
    }));
    setShowBulkModal(false);
  };

  const handleToggleStatus = (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    dispatch(updateTableStatus({ id, status: newStatus }));
  };

  // Function to download the QR as a PNG
  const downloadQR = () => {
    const canvas = document.getElementById("rt-table-qr");
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `Table-${selectedTable.tableNumber}-QR.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto animate-glass-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Floor Management</h1>
          <p className="text-slate-500 font-medium">Manage physical tables and digital QR access</p>
        </div>
        <Button 
          variant="primary" 
          onClick={() => setShowBulkModal(true)}
          leftIcon={<Plus size={18} />}
        >
          Bulk Generate Tables
        </Button>
      </div>

      {/* Tables Grid */}
      {loading && tables.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tables.map((table) => (
            <div 
              key={table._id}
              className={`bg-white/70 backdrop-blur-xl border-2 rounded-[2.5rem] p-6 transition-all hover:shadow-xl group ${
                table.status === 'Inactive' ? 'border-slate-100 opacity-75' : 'border-white shadow-lg'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${table.status === 'Active' ? 'bg-brand/10 text-brand' : 'bg-slate-100 text-slate-400'}`}>
                  <QrCode size={24} />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleToggleStatus(table._id, table.status)}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                    title="Toggle Status"
                  >
                    <Power size={18} className={table.status === 'Active' ? 'text-emerald-500' : 'text-rose-500'} />
                  </button>
                  <button 
                    onClick={() => dispatch(deleteTable(table._id))}
                    className="p-2 hover:bg-rose-50 rounded-lg text-rose-500"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-black text-slate-900">Table {table.tableNumber}</h3>
                <div className="flex items-center gap-2 text-slate-500 text-sm font-bold uppercase tracking-wider mt-1">
                  <Users size={14} /> {table.capacity} Seats
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  table.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  {table.status}
                </span>
                <button 
                  onClick={() => setSelectedTable(table)}
                  className="text-brand font-black text-xs uppercase hover:underline"
                >
                  View QR
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bulk Create Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 relative">
            <button onClick={() => setShowBulkModal(false)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600">
                <X size={20} />
            </button>
            <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
              <Settings2 className="text-brand" /> Bulk Setup
            </h2>
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Start No</label>
                  <input type="number" value={bulkData.start} onChange={e => setBulkData({...bulkData, start: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">End No</label>
                  <input type="number" value={bulkData.end} onChange={e => setBulkData({...bulkData, end: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Default Capacity</label>
                <input type="number" value={bulkData.capacity} onChange={e => setBulkData({...bulkData, capacity: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" />
              </div>
              <div className="flex gap-3 pt-4">
                <Button fullWidth variant="outline" onClick={() => setShowBulkModal(false)}>Cancel</Button>
                <Button fullWidth type="submit">Create Tables</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Preview Modal */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-10 flex flex-col items-center shadow-2xl animate-in zoom-in-95 relative">
            <button onClick={() => setSelectedTable(null)} className="absolute right-6 top-6 text-slate-400 hover:text-slate-600">
                <X size={20} />
            </button>
            <h3 className="text-xl font-black mb-6 uppercase tracking-tight">QR Code: Table {selectedTable.tableNumber}</h3>
            
            <div className="p-6 bg-white rounded-[2rem] shadow-brand-glow border border-slate-100 mb-8">
              <QRCode
                id="rt-table-qr"
                value={`${customerBaseUrl}?rid=${restaurantId}&t=${selectedTable.tableNumber}`}
                size={250} 
                qrStyle="squares" 
                ecLevel="H" 
                eyeRadius={8} 
                eyeColor="#000000" 
                fgColor="#000000" 
                bgColor="#ffffff"
                quietZone={10} 
                removeQrCodeBehindLogo={true}
                />
            </div>

            <div className="flex gap-4 w-full">
               <Button 
                fullWidth 
                variant="outline" 
                onClick={downloadQR} 
                leftIcon={<Download size={18} />}
               >
                 Download
               </Button>
               <Button 
               variant="primary" 
                fullWidth 
                onClick={() => window.print()}
                
               >
                 Print
               </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableManagementPage;