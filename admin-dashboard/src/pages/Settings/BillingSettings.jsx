import React from 'react';
import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import Badge from '@/components/ui/Badge';
import { 
  CreditCard, 
  Receipt, 
  ExternalLink, 
  CheckCircle2, 
  Zap, 
  Download,
  CalendarDays
} from 'lucide-react';

const BillingSettings = ({ formData }) => {
  const invoices = [
    { id: 'INV-2026-003', date: 'Mar 01, 2026', amount: 'Rs. 12,500', status: 'Paid' },
    { id: 'INV-2026-002', date: 'Feb 01, 2026', amount: 'Rs. 12,500', status: 'Paid' },
    { id: 'INV-2026-001', date: 'Jan 01, 2026', amount: 'Rs. 12,500', status: 'Paid' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/*  Section 1: Current Plan Status  */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-full border-none bg-slate-900 text-white overflow-hidden relative">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <Badge className="bg-indigo-500 text-white border-none mb-2 px-3 py-1">
                    PRO PLAN
                  </Badge>
                  <h3 className="text-3xl font-black italic tracking-tighter">
                    {formData.currency} 12,500 <span className="text-sm font-normal text-slate-400">/ month</span>
                  </h3>
                </div>
                <div className="p-3 bg-slate-800 rounded-2xl">
                  <Zap className="text-yellow-400" size={24} fill="currentColor" />
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {[
                  'Unlimited Kitchen Display Terminals',
                  'Advanced Inventory & 86-List Sync',
                  'Financial Analytics & Tax Reporting',
                  '24/7 Priority Support'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 size={16} className="text-indigo-400" />
                    {feature}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" className="bg-white text-slate-900 hover:bg-slate-100 border-none">
                  Upgrade Plan
                </Button>
                <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800">
                  Cancel Subscription
                </Button>
              </div>
            </div>
            
            {/* Background Decoration */}
            <CreditCard size={180} className="absolute -right-10 -bottom-10 text-white opacity-5 rotate-12" />
          </Card>
        </div>

        <Card title="Payment Method" className="flex flex-col justify-between">
          <div className="space-y-4">
            <div className="p-4 border border-slate-200 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-8 bg-slate-100 rounded flex items-center justify-center">
                <span className="font-bold text-[10px]">VISA</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">•••• 4242</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold">Expires 12/28</p>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full mt-4 text-indigo-600 font-bold" icon={ExternalLink}>
            Update Card
          </Button>
        </Card>
      </div>

      {/*  Section 2: Next Payment Information  */}
      <Card>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-50 rounded-2xl">
            <CalendarDays className="text-orange-600" size={24} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Next Billing Cycle</h4>
            <p className="text-xs text-slate-500">
              Your next payment of <span className="font-bold text-slate-700">{formData.currency} 12,500</span> will be automatically processed on <span className="font-bold text-slate-700">April 01, 2026</span>.
            </p>
          </div>
        </div>
      </Card>

      {/*  Section 3: Billing History  */}
      <Card title="Billing History" subtitle="Download and view your previous monthly invoices.">
        <div className="mt-4 overflow-hidden border border-slate-100 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Invoice ID</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Date</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Amount</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Receipt size={14} className="text-slate-400" />
                      <span className="text-sm font-bold text-slate-700">{invoice.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{invoice.date}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{invoice.amount}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Download size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default BillingSettings;