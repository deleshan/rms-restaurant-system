import React from 'react';
import { Clock, DollarSign, Percent, ArrowLeft, ArrowRight } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/common/Button';

const OperationalForm = ({ data, update, onNext, onBack }) => {
  // Common currency options
  const currencies = [
    { code: 'USD', symbol: '$' },
    { code: 'EUR', symbol: '€' },
    { code: 'GBP', symbol: '£' },
    { code: 'LKR', symbol: 'Rs' },
    { code: 'INR', symbol: '₹' },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
          <Clock size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Operational Details</h2>
          <p className="text-sm text-gray-500">Set your currency, taxes, and timing.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Currency and Tax Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Base Currency</label>
            <div className="relative">
              <select
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                value={data.currency}
                onChange={(e) => update({ currency: e.target.value })}
              >
                {currencies.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} ({curr.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Default Tax Rate (%)"
            type="number"
            name="taxRate"
            value={data.taxRate}
            onChange={(e) => update({ taxRate: e.target.value })}
            placeholder="e.g. 15"
            leftIcon={<Percent className="text-gray-400" size={18} />}
          />
        </div>

        {/* Business Hours Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-dashed border-gray-200">
          <Input
            label="Opening Time"
            type="time"
            name="openingTime"
            value={data.openingTime}
            onChange={(e) => update({ openingTime: e.target.value })}
          />
          <Input
            label="Closing Time"
            type="time"
            name="closingTime"
            value={data.closingTime}
            onChange={(e) => update({ closingTime: e.target.value })}
          />
        </div>

        <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-lg text-xs italic">
          <DollarSign size={14} />
          Note: Currency and Tax settings will apply to all menu items by default.
        </div>
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
            Kitchen Access
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Kitchen Display Username"
              name="kitchenUsername"
              placeholder="e.g. main_kitchen"
              value={data.kitchenUsername}
              onChange={(e) => update({ kitchenUsername: e.target.value })}
              autoComplete="one-time-code"
            />
            <Input 
              label="4-Digit Kitchen PIN"
              name="kitchenPin"
              type="password"
              maxLength={4}
              placeholder="e.g. 1234"
              value={data.kitchenPin}
              onChange={(e) => {
                // Only allow numbers and limit to 4 digits
                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                update({ kitchenPin: val });
              }}
              autoComplete="new-password"
            />
          </div>
          <p className="text-[10px] text-slate-400 italic">
            * This PIN will be used by staff to access the Kitchen Display System (KDS).
          </p>
        </div>

        <div className="flex gap-4 mt-8">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} /> Back
          </Button>
          <Button
            onClick={onNext}
            className="flex-1 flex items-center justify-center gap-2  text-brand hover:text-white"
          >
            Next: Admin Account <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OperationalForm;