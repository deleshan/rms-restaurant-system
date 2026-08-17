import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  MessageCircle, 
  Printer, 
  CheckCircle2, 
  ChevronLeft, 
  Camera,
  Star,
} from 'lucide-react';

// IMPORT SOCKET instance
import { socket } from '@/socket'; 

import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { logout, updateCustomerEmail, updateCustomerDOB } from '../features/auth/authSlice';


// Selectors & Actions
import { selectCustomer } from '../features/auth/authSelectors';
import { selectReviewFlowState } from '../features/orders/orderSelectors';
import { selectReviewState } from '../features/review/reviewSelector';
import { 
  setServiceRating, 
  setFoodRating,
  setFeedback, 
  setBillingPreference, 
  addReviewPhoto,
  resetReview 
} from '../features/review/reviewSlice';
import { submitReview, requestBillAction, saveCustomerDOB } from '../features/review/reviewThunks';
import { resetAfterReview } from '../features/orders/orderSlice';

const ReviewPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // UI FLOW STATE 
  const [currentStep, setCurrentStep] = useState('billing'); 
  const [inlineEmail, setInlineEmail] = useState('');
  const [inlineEmailError, setInlineEmailError] = useState('');
  const [dob, setDob] = useState('');
  const [dobError, setDobError] = useState('');
  const [dobSaved, setDobSaved] = useState(false);
  const [dobSaving, setDobSaving] = useState(false);

  const customer = useSelector(selectCustomer);
  const { currentOrder, currentOrderId } = useSelector(selectReviewFlowState);
  
  const { 
    ratings, 
    serviceRating, 
    feedback, 
    photos, 
    submitting, 
    success, 
    error,
    billingPreference 
  } = useSelector(selectReviewState);

  // SOCKET EMIT LOGIC 
  const handleBillingSelection = (preferenceId, emailOverride = null) => {
    dispatch(setBillingPreference(preferenceId));

    if (!currentOrderId) {
      alert("Session expired. Please refresh.");
      return;
    }

    dispatch(requestBillAction({ 
      orderId: currentOrderId, 
      billingPreference: preferenceId,
      ...(emailOverride && { email: emailOverride }),  
    })).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {

        if (emailOverride) {
          dispatch(updateCustomerEmail(emailOverride));  
        }
        if (currentOrder?.restaurantId) {
          socket.emit('request-bill', {
            orderId: currentOrderId,
            restaurantId: currentOrder.restaurantId,
            tableId: currentOrder.tableId || "T1",
            billingPreference: preferenceId,
          });
        }

        setTimeout(() => setCurrentStep('feedback'), 400);
      } else {
        alert("Could not notify staff. Please try again.");
      }
    });
  };

  const handleDobSubmit = () => {
    if (!dob) {
      setDobError('Please select your date of birth.');
      return;
    }

    const parsed = new Date(dob);
    if (isNaN(parsed) || parsed >= new Date()) {
      setDobError('Please enter a valid date of birth.');
      return;
    }

    setDobError('');
    setDobSaving(true);

    dispatch(saveCustomerDOB({
      phone: customer.phone,
      restaurantId: currentOrder?.restaurantId,
      dateOfBirth: dob,
    })).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        setDobSaved(true);
      } else {
        setDobError('Could not save. Please try again.');
      }
    }).finally(() => {
      setDobSaving(false);
    });
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      dispatch(addReviewPhoto(e.target.files[0]));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!serviceRating || serviceRating < 1) {
      alert("Please provide a star rating for our service.");
      return;
    }

    if (!currentOrderId) {
      alert("Session expired. Please scan the QR code again.");
      return;
    }

    const foodRatingValues = Object.values(ratings);
    const foodAvg = foodRatingValues.length > 0 
      ? foodRatingValues.reduce((a, b) => a + b, 0) / foodRatingValues.length
      : 0;

    const overallRating = ((foodAvg + serviceRating) / 2).toFixed(1);

    const formData = new FormData();
    formData.append('orderId', currentOrderId);
    formData.append('billingPreference', billingPreference); 
    formData.append('serviceRating', serviceRating);
    formData.append('rating', overallRating); 
    formData.append('foodItemRatings', JSON.stringify(ratings));
    formData.append('customerName', customer?.name || 'Guest');
    formData.append('feedback', feedback);
    
    if (photos && photos.length > 0) {
      photos.forEach((file) => {
        formData.append('photos', file); 
      });
    }

    dispatch(submitReview(formData)).then((result) => {
      if (result.meta.requestStatus === 'fulfilled') {
        dispatch(logout()); 
        dispatch(resetReview()); 
        dispatch(resetAfterReview()); 
        localStorage.clear(); 
      
        setTimeout(() => {
          navigate('/thank-you', { replace: true }); 
        }, 600);
      }
    });
  };

  // Internal Component: Star Rating 
  const StarRating = ({ rating, onChange, label, subLabel, isSmall = false }) => (
    <div className={`text-center bg-white rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-md ${isSmall ? 'p-4 mb-3' : 'p-6 mb-8'}`}>
      <h3 className={`${isSmall ? 'text-[11px]' : 'text-sm'} font-black text-slate-800 uppercase italic tracking-tight`}>
        {label}
      </h3>
      {subLabel && <p className="text-[9px] text-slate-400 font-bold uppercase mb-2">{subLabel}</p>}
      <div className="flex justify-center space-x-1 mt-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none transition-transform active:scale-125"
          >
            <Star
              size={isSmall ? 24 : 36}
              className={`${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'} transition-colors duration-200`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  // BILLING SELECTION 
  const BillingStep = () => {
    const hasEmail = !!(customer?.email);
    const [showEmailInput, setShowEmailInput] = useState(false);
    const [typedEmail, setTypedEmail] = useState('');
    const [emailError, setEmailError] = useState('');

    const validateEmail = (val) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

    const handleEmailConfirm = () => {
      if (!validateEmail(typedEmail)) {
        setEmailError('Please enter a valid email address.');
        return;
      }
      setEmailError('');
      handleBillingSelection('Email', typedEmail);
    };

    const options = [
      { 
        id: 'Email', 
        label: 'E-Receipt via Email', 
        icon: <Mail size={22} />, 
        desc: hasEmail ? customer.email : 'No email on file', 
        color: 'bg-indigo-50 text-indigo-700 border-indigo-100' 
      },
      { 
        id: 'WhatsApp', 
        label: 'WhatsApp Message', 
        icon: <MessageCircle size={22} />, 
        desc: 'Direct to your mobile', 
        color: 'bg-emerald-50 text-emerald-700 border-emerald-100' 
      },
      { 
        id: 'Printed Bill', 
        label: 'Printed Bill', 
        icon: <Printer size={22} />, 
        desc: 'Physical paper copy', 
        color: 'bg-slate-50 text-slate-700 border-slate-100' 
      },
    ];

    return (
      <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
        {/* DATE OF BIRTH - only shown if not on file */}
            {!customer?.dateOfBirth && (
              <div className="mb-10">
                <div className="bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-100 rounded-[2rem] p-6">
                  
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="text-2xl">🎂</div>
                    <div>
                      <p className="font-black text-xs uppercase tracking-wider text-violet-800">
                        Birthday Discount
                      </p>
                      <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wide mt-0.5">
                        Share your birthday to unlock exclusive offers & promotions
                      </p>
                    </div>
                  </div>

                  {dobSaved ? (
                    // Success state
                    <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-3 border border-violet-100">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                      <p className="text-xs font-black uppercase tracking-wider text-emerald-600">
                        Birthday saved — enjoy your special treat!
                      </p>
                    </div>
                  ) : (
                    // Input state
                    <>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={dob}
                          max={new Date().toISOString().split('T')[0]}  
                          onChange={(e) => {
                            setDob(e.target.value);
                            setDobError('');
                          }}
                          className="flex-1 bg-white border border-violet-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-400 transition-all"
                        />
                        <button
                            type="button"
                            onClick={handleDobSubmit}
                            disabled={dobSaving}
                            className="bg-violet-600 text-white text-xs font-black uppercase tracking-wider px-5 py-3 rounded-2xl hover:bg-violet-700 active:scale-95 transition-all whitespace-nowrap disabled:bg-violet-300"
                          >
                            {dobSaving ? 'Saving...' : 'Save'}
                          </button>
                        </div>

                      {dobError && (
                        <p className="text-red-500 text-[10px] font-bold uppercase mt-2 ml-1">
                          {dobError}
                        </p>
                      )}

                      {/* Skip hint */}
                      <p className="text-[9px] font-bold text-violet-300 uppercase tracking-widest mt-3 text-center">
                        Optional — you can skip this
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-white text-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">
            Payment Receipt
          </h2>
          <p className="text-slate-500 font-bold text-xs mb-8 uppercase tracking-widest leading-relaxed">
            Your order is being finalized.<br/>How would you like your receipt?
          </p>

          <div className="space-y-4">
            {options.map((item) => {
              const isEmail = item.id === 'Email';
              const isDisabled = isEmail && !hasEmail;
              const isSelected = billingPreference === item.id;

              // Email option without an address on file 
              if (isDisabled) {
                return (
                  <div key={item.id} className="rounded-[1.5rem] border-2 border-dashed border-indigo-100 bg-indigo-50/50 overflow-hidden">
                    {/* Header row - always visible */}
                    <button
                      type="button"
                      onClick={() => setShowEmailInput((prev) => !prev)}
                      className="w-full flex items-center gap-4 p-5 text-left group"
                    >
                      <div className="p-3 rounded-xl bg-white shadow-sm text-indigo-400">
                        <Mail size={22} />
                      </div>
                      <div className="flex-1">
                        <p className="font-black uppercase text-xs tracking-wider text-indigo-700">
                          E-Receipt via Email
                        </p>
                        <p className="text-[10px] font-bold uppercase text-indigo-400">
                          Add your email to use this option
                        </p>
                      </div>
                      {/* Chevron toggle */}
                      <span className={`text-indigo-300 transition-transform duration-300 ${showEmailInput ? 'rotate-180' : ''}`}>
                        ▾
                      </span>
                    </button>

                    {/* Inline email capture - expands on click */}
                    {showEmailInput && (
                      <div className="px-5 pb-5 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex gap-2">
                          <input
                            type="email"
                            value={typedEmail}
                            onChange={(e) => {
                              setTypedEmail(e.target.value);
                              setEmailError('');
                            }}
                            placeholder="your@email.com"
                            className="flex-1 bg-white border border-indigo-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
                          />
                          <button
                            type="button"
                            onClick={handleEmailConfirm}
                            className="bg-indigo-600 text-white text-xs font-black uppercase tracking-wider px-5 py-3 rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all"
                          >
                            Use
                          </button>
                        </div>
                        {emailError && (
                          <p className="text-red-500 text-[10px] font-bold uppercase mt-2 ml-1">
                            {emailError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              // Normal selectable option
              return (
                <button
                  key={item.id}
                  onClick={() => handleBillingSelection(item.id)}
                  className={`w-full flex items-center gap-4 p-5 rounded-[1.5rem] border-2 transition-all active:scale-95 text-left group 
                    ${isSelected 
                      ? 'border-emerald-500 bg-emerald-50 shadow-md ring-1 ring-emerald-500' 
                      : `border-transparent hover:border-white hover:shadow-lg ${item.color}`
                    }`}
                >
                  <div className={`p-3 rounded-xl shadow-sm group-hover:scale-110 transition-transform ${isSelected ? 'bg-emerald-500 text-white' : 'bg-white'}`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="font-black uppercase text-xs tracking-wider">{item.label}</p>
                    <p className="text-[10px] opacity-70 font-bold uppercase">{item.desc}</p>
                  </div>
                  {isSelected && (
                    <div className="ml-auto">
                      <CheckCircle2 size={20} className="text-emerald-600" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (submitting) return <LoadingSpinner message="Saving your feedback..." />;

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="animate-in zoom-in duration-500">
           <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={40} />
           </div>
           <h2 className="text-2xl font-black uppercase italic">Thank You!</h2>
           <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-2">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <main className="max-w-xl mx-auto px-6 py-10">
        
        {/* Progress Tracker */}
        <div className="flex justify-center gap-3 mb-10">
          <div className={`h-2 rounded-full transition-all duration-500 ${currentStep === 'billing' ? 'bg-emerald-500 w-16' : 'bg-emerald-200 w-8'}`} />
          <div className={`h-2 rounded-full transition-all duration-500 ${currentStep === 'feedback' ? 'bg-emerald-500 w-16' : 'bg-slate-200 w-8'}`} />
        </div>

        {error && <ErrorMessage message={error} />}

        {currentStep === 'billing' ? (
          <BillingStep />
        ) : (
          <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-right-8 duration-700">
            <div className="flex items-center justify-between mb-8">
              <button 
                type="button" 
                onClick={() => setCurrentStep('billing')}
                className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-slate-900 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter text-center flex-1">
                Rate Your <span className="text-emerald-600 ml-2">Experience</span>
              </h1>
            </div>
            
            {/*  FOOD ITEMS RATING */}
            <div className="mb-10">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-4">
                The Cuisine
              </label>
              {currentOrder?.items?.map((item) => {
                const itemId = item.menuItem?._id || item.menuItem;
                return (
                  <StarRating 
                    key={itemId}
                    isSmall={true}
                    label={item.menuItem?.name || item.name || "Menu Item"}
                    subLabel={`Quantity: ${item.quantity ?? 1}`}
                    rating={ratings[itemId] || 0} 
                    onChange={(val) => dispatch(setFoodRating({ itemId, rating: val }))}
                  />
                );
              })}
            </div>

            {/* SERVICE RATING  */}
            <div className="mb-10">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 mb-4">
                The Hospitality
              </label>
              <StarRating 
                label="Staff & Service" 
                subLabel="How was our service today?"
                rating={serviceRating} 
                onChange={(val) => dispatch(setServiceRating(val))} 
              />
            </div>

            {/* TEXT FEEDBACK  */}
            <div className="mb-10">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 ml-2">
                Anything else?
              </label>
              <textarea
                value={feedback}
                onChange={(e) => dispatch(setFeedback(e.target.value))}
                rows={4}
                className="w-full bg-white border border-slate-100 rounded-[2rem] p-6 text-sm outline-none shadow-sm focus:ring-4 focus:ring-emerald-500/10 transition-all resize-none font-medium text-slate-700"
                placeholder="Share your thoughts with us..."
              />
            </div>

            {/* PHOTO UPLOAD */}
            <div className="mb-10">
              <input type="file" id="photo-upload" className="hidden" accept="image/*" onChange={handlePhotoChange} />
              <label htmlFor="photo-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-[2.5rem] cursor-pointer hover:bg-white hover:border-emerald-300 transition-all bg-slate-50/50 group">
                <Camera className="text-slate-300 group-hover:text-emerald-500 mb-2 transition-colors" size={28} />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 text-center group-hover:text-emerald-600">
                  {photos.length > 0 ? photos[0].name : 'Upload a photo of your meal'}
                </p>
              </label>
            </div>
            
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-slate-900 text-white font-black text-xs py-6 rounded-[2rem] shadow-2xl hover:bg-emerald-600 transition-all uppercase tracking-[0.2em] active:scale-95 disabled:bg-slate-300 mb-6"
            >
              {submitting ? 'Sending...' : 'Submit & Close Session'}
            </button>
          </form>
        )}
      </main>
    </div>
  );
};

export default ReviewPage;