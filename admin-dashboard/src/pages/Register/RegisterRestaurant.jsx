import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Store, MapPin, Clock, UserPlus, ArrowRight, ArrowLeft } from 'lucide-react';

import Card from '@/components/common/Card';
import Button from '@/components/common/Button';
import { registerBusiness } from '@/features/registration/registrationThunks';
import { selectIsRegistering } from '@/features/registration/registerSlice';
import { selectRegistrationError, clearRegistrationErrors } from '@/features/registration/registerSlice';

// Import the sub-step components
import BusinessInfoForm from '../steps/BusinessInfoForm';
import LocationForm from '../steps/LocationForm';
import OperationalForm from '../steps/OperationalForm';
import AdminAccountForm from '../steps/AdminAccountForm';

const RegisterRestaurant = () => {
  const [step, setStep] = useState(1);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Selectors for loading and error states
  const isLoading = useSelector(selectIsRegistering);
  const registrationError = useSelector(selectRegistrationError);

  const [formData, setFormData] = useState({
    // Business Info
    restaurantName: '',
    cuisineType: '',
    businessType: 'restaurant',
    
    // Location
    address: '',
    city: '',
    phone: '',
    
    // Operations
    currency: 'LKR', 
    taxRate: 0,
    openingTime: '09:00',
    closingTime: '22:00',
    kitchenUsername: '',  
    kitchenPin: '', 
    
    // Admin Account     
    username: '', 
    password: '', 
  });

  /**
   * Updates global form data from individual step components
   * @param {Object} newData 
   */
  const updateFormData = (newData) => {
    setFormData((prev) => ({ ...prev, ...newData }));
    if (registrationError) dispatch(clearRegistrationErrors());
  };

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  /**
   * Final submission handler
   * Ensures 'username' is populated to prevent 500 Validation Errors
   */
  const handleSubmit = async () => {
    const submissionData = {
      ...formData,
      username: formData.username.trim() !== '' ? formData.username : formData.adminEmail
    };

    const result = await dispatch(registerBusiness(submissionData));
    
    if (registerBusiness.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  /**
   * Renders the current step based on the wizard state
   */
  const renderStep = () => {
    switch (step) {
      case 1: 
        return <BusinessInfoForm data={formData} update={updateFormData} onNext={handleNext} />;
      case 2: 
        return <LocationForm data={formData} update={updateFormData} onNext={handleNext} onBack={handleBack} />;
      case 3: 
        return <OperationalForm data={formData} update={updateFormData} onNext={handleNext} onBack={handleBack} />;
      case 4: 
        return (
          <AdminAccountForm 
            data={formData} 
            update={updateFormData} 
            onBack={handleBack} 
            onSubmit={handleSubmit} 
            isLoading={isLoading} 
          />
        );
      default: 
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Progress Header */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">
            Partner <span className="text-indigo-600">Registration</span>
          </h1>
          <p className="text-slate-500 font-semibold mt-2">
            Build your AI-powered restaurant ecosystem in four simple steps.
          </p>
          
          {/* Enhanced Progress Bar */}
          <div className="flex items-center gap-3 mt-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-1 flex flex-col gap-2">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i <= step ? 'bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.4)]' : 'bg-slate-200'
                  }`} 
                />
                <span className={`text-[10px] font-black uppercase tracking-widest ${
                  i === step ? 'text-indigo-600' : 'text-slate-400'
                }`}>
                  Step 0{i}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Card Container */}
        <Card className="p-8 md:p-12 shadow-2xl border-white/60 bg-white/70 backdrop-blur-xl rounded-[2.5rem]">
          {/* Error Message Display */}
          {registrationError && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 animate-shake">
              <span className="font-bold text-xs uppercase tracking-widest">Error: {registrationError}</span>
            </div>
          )}

          {renderStep()}
        </Card>

        {/* Footer Support */}
        <p className="text-center mt-8 text-slate-400 text-xs font-medium">
          Need help? Contact our technical support team at <span className="text-indigo-500 font-bold underline cursor-pointer">support@neometer.com</span>
        </p>
      </div>
    </div>
  );
};

export default RegisterRestaurant;