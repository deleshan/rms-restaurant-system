import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  QrCode, 
  UtensilsCrossed, 
  Star, 
  Heart,
  ArrowRight
} from 'lucide-react';



const ThankYouPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
  localStorage.clear();
  sessionStorage.clear();
}, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full">
        
        {/* Main Card */}
        <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-white text-center relative overflow-hidden animate-in fade-in zoom-in duration-700">
          
          {/* Decorative background element */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-50 rounded-full blur-3xl opacity-50" />
          
          {/* Success Icon */}
          <div className="relative">
            <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl animate-bounce duration-[2000ms]">
              <CheckCircle2 size={48} />
            </div>
            {/* Floating stars decoration */}
            <Star className="absolute top-0 right-1/4 text-yellow-400 fill-yellow-400 animate-pulse" size={20} />
            <Heart className="absolute bottom-4 left-1/4 text-pink-400 fill-pink-400 animate-pulse delay-700" size={18} />
          </div>

          <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">
            You're All Set!
          </h1>
          
          <p className="text-slate-500 font-bold text-sm mb-8 uppercase tracking-widest leading-relaxed">
            Thank you for dining with us. <br/>
            Your receipt has been sent and your session is now <span className="text-emerald-600">closed</span>.
          </p>

          {/* QR Re-scan Instructions */}
          <div className="bg-slate-50 rounded-[2.5rem] p-8 border-2 border-dashed border-slate-200 group transition-colors hover:border-emerald-200">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <QrCode size={32} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
            </div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2">
              Want to order more?
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">
              Please scan the QR code on your table again to start a new session.
            </p>
          </div>

          {/* Social / Branding Footer */}
          <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-center gap-2">
            <UtensilsCrossed size={16} className="text-emerald-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
              The Grand Bistro
            </span>
          </div>
        </div>

        {/* Subtle Bottom Message */}
        <p className="text-center mt-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">
          Have a wonderful day!
        </p>
      </div>
    </div>
  );
};

export default ThankYouPage;