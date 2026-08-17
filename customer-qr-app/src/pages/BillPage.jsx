import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/Header';
import BottomNavigation from '../components/BottomNavigation';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const BillPage = () => {
  const navigate = useNavigate();
  const { currentOrderId, cart, name, phone, email } = useSelector((state) => state.customer);

  const [selectedMethod, setSelectedMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Calculate total from cart (in case currentOrder not loaded)
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handleSendBill = async () => {
    if (!selectedMethod) {
      setError('Please select a bill delivery method');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await axios.post(`http://localhost:5000/api/orders/${currentOrderId}/bill`, {
        method: selectedMethod,
        phone: selectedMethod === 'SMS' ? phone : undefined,
        email: selectedMethod === 'Email' ? email : undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/orders');
      }, 3000);
    } catch (err) {
      setError('Failed to send bill request. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Sending your bill request..." />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 pb-20">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">Your Bill</h1>

        {error && <ErrorMessage message={error} />}

        {success ? (
          <div className="text-center py-20">
            <svg className="w-24 h-24 text-green-500 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Bill Request Sent!</h2>
            <p className="text-lg text-gray-600">
              Staff will assist you shortly with your {selectedMethod.toLowerCase()} bill.
            </p>
            <p className="text-sm text-gray-500 mt-6">Redirecting to orders...</p>
          </div>
        ) : (
          <>
            {/* Itemized Bill */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Order Summary</h2>

              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={`${item.id}-${item.customizations}`} className="flex justify-between py-3 border-b border-gray-200">
                    <div>
                      <p className="font-medium text-gray-800">
                        {item.qty} × {item.name}
                      </p>
                      {item.customizations && (
                        <p className="text-sm text-indigo-600 italic">{item.customizations}</p>
                      )}
                    </div>
                    <p className="font-medium text-gray-800">
                      Rs. {item.price * item.qty}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center mt-8 pt-6 border-t-2 border-gray-300">
                <h3 className="text-2xl font-bold text-gray-800">Total</h3>
                <p className="text-3xl font-bold text-green-600">Rs. {total}</p>
              </div>
            </div>

            {/* Bill Delivery Options */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                How would you like your bill?
              </h2>

              <div className="space-y-4">
                {/* SMS Option */}
                <label className="flex items-center p-6 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                  <input
                    type="radio"
                    name="billMethod"
                    value="SMS"
                    checked={selectedMethod === 'SMS'}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="w-6 h-6 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-6">
                    <p className="text-lg font-medium text-gray-800">Via SMS</p>
                    <p className="text-sm text-gray-600">Sent to {phone}</p>
                  </div>
                </label>

                {/* Email Option */}
                <label className="flex items-center p-6 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                  <input
                    type="radio"
                    name="billMethod"
                    value="Email"
                    checked={selectedMethod === 'Email'}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="w-6 h-6 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-6">
                    <p className="text-lg font-medium text-gray-800">Via Email</p>
                    <p className="text-sm text-gray-600">
                      {email ? `Sent to ${email}` : 'Email not provided'}
                    </p>
                  </div>
                </label>

                {/* Printed Option */}
                <label className="flex items-center p-6 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition">
                  <input
                    type="radio"
                    name="billMethod"
                    value="Printed"
                    checked={selectedMethod === 'Printed'}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="w-6 h-6 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-6">
                    <p className="text-lg font-medium text-gray-800">Printed Bill</p>
                    <p className="text-sm text-gray-600">Staff will bring it to your table</p>
                  </div>
                </label>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSendBill}
                disabled={!selectedMethod}
                className={`w-full mt-8 py-4 rounded-xl font-bold text-xl transition shadow-lg ${
                  selectedMethod
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Send Bill Request
              </button>
            </div>
          </>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};

export default BillPage;