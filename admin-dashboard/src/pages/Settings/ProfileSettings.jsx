import React from 'react';
import Card from '@/components/common/Card';
import Input from '@/components/ui/Input';
import { Building2, Mail, Phone, MapPin, Hash } from 'lucide-react';

const ProfileSettings = ({ formData, handleChange }) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/*  Section 1: Core Business Identity */}
      <Card 
        title="Restaurant Identity" 
        subtitle="General business information used for public profiles and internal records."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            label="Restaurant Name" 
            name="restaurantName" 
            value={formData.restaurantName} 
            onChange={handleChange}
            placeholder="e.g. Spice Route Bistro"
            icon={Building2}
          />
          <Input 
            label="Business Registration / TIN" 
            name="taxId" 
            value={formData.taxId} 
            onChange={handleChange}
            placeholder="e.g. 102938475"
            icon={Hash}
          />
          <Input 
            label="Manager/Owner Name" 
            name="ownerName" 
            value={formData.ownerName} 
            onChange={handleChange}
            placeholder="Enter full name"
          />
          <div className="flex flex-col justify-end">
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
               * This data will appear on your official digital receipts.
             </p>
          </div>
        </div>
      </Card>

      {/*  Section 2: Contact & Location  */}
      <Card 
        title="Contact & Location" 
        subtitle="Used for customer support and delivery service coordination."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input 
            label="Business Email" 
            name="email" 
            type="email"
            value={formData.email} 
            onChange={handleChange}
            placeholder="contact@restaurant.com"
            icon={Mail}
          />
          <Input 
            label="Phone Number" 
            name="phone" 
            value={formData.phone} 
            onChange={handleChange}
            placeholder="+94 77 123 4567"
            icon={Phone}
          />
          <div className="md:col-span-2">
            <Input 
              label="Physical Address" 
              name="address" 
              value={formData.address} 
              onChange={handleChange}
              placeholder="123 Galle Road, Colombo 03, Sri Lanka"
              icon={MapPin}
            />
          </div>
        </div>
      </Card>

      {/*  Section 3: Visual Identity (Placeholder for Logo Upload)  */}
      <Card title="Brand Assets">
        <div className="flex items-center gap-6 p-4 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <div className="w-20 h-20 bg-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
            <Building2 size={32} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Restaurant Logo</h4>
            <p className="text-xs text-slate-500 mb-3">PNG or JPG. Max 2MB.</p>
            <button className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors">
              Upload New Logo
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ProfileSettings;