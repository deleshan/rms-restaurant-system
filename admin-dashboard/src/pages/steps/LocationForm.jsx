import React, { useMemo } from 'react';
import { MapPin, Phone, Globe, ArrowLeft, ArrowRight, Flag } from 'lucide-react';
import { Country, City } from 'country-state-city';
import Input from '@/components/ui/Input';
import Button from '@/components/common/Button';

const LocationForm = ({ data, update, onNext, onBack }) => {
  const countries = useMemo(() => Country.getAllCountries(), []);
  

  const cities = useMemo(() => {
    return data.country ? City.getCitiesOfCountry(data.country) : [];
  }, [data.country]);

  // Find current country data to get the phone code for the visual prefix
  const selectedCountryData = useMemo(() => {
    return countries.find(c => c.isoCode === data.country);
  }, [data.country, countries]);

  const handleCountryChange = (e) => {
    const countryCode = e.target.value;
    update({
      country: countryCode,
      city: '', 
      phone: '' 
    });
  };

  const handlePhoneChange = (e) => {
    // Remove all non-numeric characters
    const value = e.target.value.replace(/\D/g, '');
    
    // Limit to maximum 9 characters
    if (value.length <= 9) {
      update({ phone: value });
    }
  };

  // Validation: Phone must be exactly 9 digits (standard for many regions)
  const isFormValid = data.address && data.country && data.city && data.phone?.length === 9;

  const selectClasses = "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400";

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
          <MapPin size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Location & Contact</h2>
          <p className="text-sm text-gray-500">Where can customers find you?</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Country Selection */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Flag size={16} className="text-gray-400" /> Country
          </label>
          <select
            className={selectClasses}
            value={data.country || ''}
            onChange={handleCountryChange}
          >
            <option value="">Select Country</option>
            {countries.map((country) => (
              <option key={country.isoCode} value={country.isoCode}>
                {country.name} (+{country.phonecode})
              </option>
            ))}
          </select>
        </div>

        <Input
          label="Street Address"
          name="address"
          value={data.address}
          onChange={(e) => update({ address: e.target.value })}
          placeholder="e.g. 123 Business Ave, Suite 100"
          leftIcon={<MapPin className="text-gray-400" size={18} />}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* City Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">City</label>
            <select
              className={selectClasses}
              value={data.city}
              onChange={(e) => update({ city: e.target.value })}
              disabled={!data.country}
            >
              <option value="">{data.country ? "Select City" : "Select country first"}</option>
              {cities.map((city) => (
                <option key={`${city.name}-${city.latitude}`} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>

          {/* Phone Number with Uneditable Country Code */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Phone Number</label>
            <div className="relative flex items-center">
              {/* This is the uneditable visual prefix */}
              <div className="absolute left-3 flex items-center gap-2 pointer-events-none border-r pr-2 border-gray-200">
                <Phone className="text-gray-400" size={16} />
                <span className="text-sm font-semibold text-gray-600">
                  {selectedCountryData ? `+${selectedCountryData.phonecode}` : '+'}
                </span>
              </div>
              
              <input
                type="text"
                className={`${selectClasses} pl-20`}
                placeholder="712345678"
                value={data.phone || ''}
                onChange={handlePhoneChange}
              />
            </div>
            <p className="text-[10px] text-gray-400">Enter 9 digits without country code</p>
          </div>
        </div>

        <Input
          label="Google Maps URL (Optional)"
          name="mapsUrl"
          value={data.mapsUrl || ''}
          onChange={(e) => update({ mapsUrl: e.target.value })}
          placeholder="https://goo.gl/maps/..."
          leftIcon={<Globe className="text-gray-400" size={18} />}
        />

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
            disabled={!isFormValid}
            className="flex-1 flex items-center justify-center gap-2 text-brand hover:text-white"
          >
            Next: Operations <ArrowRight size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LocationForm;