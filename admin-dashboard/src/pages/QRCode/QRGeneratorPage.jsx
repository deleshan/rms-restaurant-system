import React, { useState } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { Download, Printer, QrCode as QrIcon } from 'lucide-react';
import Button from '@/components/common/Button';

const QRGenerator = ({ restaurantId }) => {
  const [tableNo, setTableNo] = useState('');
  const [generated, setGenerated] = useState(false);

  const downloadQR = () => {
    const canvas = document.getElementById("rt-table-qr");
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
      let downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `Table-${tableNo}-QR.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-glass-in">
      {/* Configuration Card */}
      <div className="bg-white/70 backdrop-blur-2xl border border-white p-8 rounded-[2.5rem] shadow-xl">
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 mb-6">
          <QrIcon className="text-brand" /> Generate Table QR
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Table Number</label>
            <input 
              type="number"
              value={tableNo}
              onChange={(e) => setTableNo(e.target.value)}
              className="w-full p-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand/20 outline-none transition-all font-bold"
              placeholder="e.g. 05"
            />
          </div>
          
          <Button 
            fullWidth 
            variant="primary" 
            onClick={() => setGenerated(true)}
            disabled={!tableNo}
          >
            Generate QR Code
          </Button>
        </div>
      </div>

      {/* Preview Card */}
      <div className="bg-white/70 backdrop-blur-2xl border border-white p-8 rounded-[2.5rem] shadow-xl flex flex-col items-center justify-center min-h-[300px]">
        {generated ? (
          <div className="text-center animate-in zoom-in duration-300">
            <div className="p-4 bg-white rounded-3xl shadow-brand-glow mb-6 inline-block">
              <QRCode
                id="rt-table-qr"
                value={`https://order.rms.com/menu?rid=${restaurantId}&t=${tableNo}`}
                size={200}
                logoImage="/logo-sm.png" 
                logoWidth={50}
                qrStyle="dots"
                eyeRadius={10}
                fgColor="oklch(50% 0.134 242.749)" 
              />
            </div>
            <div className="flex gap-3 justify-center">
              <Button size="sm" variant="outline" onClick={downloadQR} leftIcon={<Download size={16}/>}>Download</Button>
              <Button size="sm" variant="outline" onClick={() => window.print()} leftIcon={<Printer size={16}/>}>Print</Button>
            </div>
            <p className="mt-4 text-[10px] font-black text-slate-400 uppercase">Redirects to Table {tableNo}</p>
          </div>
        ) : (
          <div className="text-slate-300 flex flex-col items-center italic">
            <QrIcon size={64} className="opacity-20 mb-2" />
            <p className="text-sm uppercase font-bold tracking-widest">Awaiting Configuration</p>
          </div>
        )}
      </div>
    </div>
  );
};