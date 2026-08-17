import React from 'react';
import Card from '@/components/common/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { 
  DollarSign, 
  Percent, 
  Calculator, 
  Receipt, 
  Globe,
  Info
} from 'lucide-react';

const FinancialSettings = ({ formData, handleChange, setFormData }) => {
  
  
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Section 1: Currency & Locale */}
      <Card 
        className="overflow-visible relative z-50"
        title="Currency & Regional Settings" 
        subtitle="Define how your prices and currency symbols are displayed across all apps."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-visible relative z-50">
          <Select 
            label="Primary Currency"
            name="currency"
            value={formData.currency}
            icon={Globe}
            options={[
              { value: 'LKR', label: 'Sri Lankan Rupee (Rs.)' },
              { value: 'USD', label: 'US Dollar ($)' },
              { value: 'EUR', label: 'Euro (€)' },
              { value: 'GBP', label: 'British Pound (£)' },
            ]}
            onChange={(val) => handleSelectChange('currency', val)}
          />
          
          <div className="flex flex-col justify-center px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl">
            <div className="flex items-start gap-3">
              <Info className="text-indigo-600 mt-0.5" size={16} />
              <p className="text-xs text-indigo-900 leading-relaxed">
                <strong>Format Preview:</strong> Your prices will appear as 
                <span className="font-mono font-bold bg-white px-2 py-0.5 rounded ml-1 border border-indigo-200">
                  {formData.currency} 1,250.00
                </span>
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/*  Section 2: Taxes & Service Charges  */}
      <Card 
        title="Taxes & Service Charges" 
        subtitle="Set global rates applied to every transaction."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            label="Standard VAT / Sales Tax (%)" 
            name="taxRate" 
            type="number"
            step="0.01"
            value={formData.taxRate} 
            onChange={handleChange}
            placeholder="e.g. 15"
            icon={Percent}
          />
          <Input 
            label="Service Charge (%)" 
            name="serviceCharge" 
            type="number"
            step="0.1"
            value={formData.serviceCharge} 
            onChange={handleChange}
            placeholder="e.g. 10"
            icon={Calculator}
          />

          <div className="md:col-span-2 flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center gap-3">
              <Receipt className="text-slate-500" size={20} />
              <div>
                <h4 className="text-sm font-bold text-slate-900">Tax Calculation Logic</h4>
                <p className="text-[11px] text-slate-500 uppercase font-black tracking-tighter">
                  Apply tax on top of service charge?
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                name="isServiceChargeTaxable"
                checked={formData.isServiceChargeTaxable}
                onChange={handleChange}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* Section 3: Billing Breakdown Logic  */}
      <Card title="Order Calculation Summary">
        <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-4">Live Example (Rs. 1,000 Order)</p>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span>1,000.00</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Service Charge ({formData.serviceCharge}%):</span>
              <span>{(1000 * (formData.serviceCharge / 100)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>VAT / Tax ({formData.taxRate}%):</span>
              <span>
                {formData.isServiceChargeTaxable 
                  ? ((1000 + (1000 * (formData.serviceCharge / 100))) * (formData.taxRate / 100)).toFixed(2)
                  : (1000 * (formData.taxRate / 100)).toFixed(2)
                }
              </span>
            </div>
            <div className="pt-2 mt-2 border-t border-slate-800 flex justify-between text-white font-bold text-lg">
              <span>Total:</span>
              <span className="text-orange-500">
                {formData.currency} {(
                  1000 + 
                  (1000 * (formData.serviceCharge / 100)) + 
                  (formData.isServiceChargeTaxable 
                    ? ((1000 + (1000 * (formData.serviceCharge / 100))) * (formData.taxRate / 100))
                    : (1000 * (formData.taxRate / 100))
                  )
                ).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default FinancialSettings;