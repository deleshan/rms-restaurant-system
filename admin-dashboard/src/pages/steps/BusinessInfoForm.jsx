import React from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/common/Button';
import { Store } from 'lucide-react';

const BusinessInfoForm = ({ data, update, onNext }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Store size={24}/></div>
        <h2 className="text-xl font-bold">Business Information</h2>
      </div>
      
      <Input 
        label="Restaurant Name" 
        value={data.restaurantName}
        onChange={(e) => update({ restaurantName: e.target.value })}
        placeholder="e.g. The Golden Fork"
      />

      <Input 
        label="Cuisine Type" 
        value={data.cuisineType}
        onChange={(e) => update({ cuisineType: e.target.value })}
        placeholder="e.g. Italian, Japanese, Fusion"
      />

      <Button className=" text-brand hover:text-white" fullWidth onClick={onNext} disabled={!data.restaurantName || !data.cuisineType}>
        Continue to Location
      </Button>
    </div>
  );
};

export default BusinessInfoForm;