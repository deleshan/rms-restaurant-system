import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeft, Ban, Phone, Mail, MapPin, Calendar,
  TrendingUp, ShoppingBag, Award, Sparkles
} from 'lucide-react';

import { fetchCustomerById, toggleCustomerStatus } from '@/features/customer/customerThunks';
import { selectSelectedCustomer, selectCustomersLoading } from '@/features/customer/customerSelector';

import Button from '@/components/common/Button';
import Card from '@/components/common/Card';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const SEGMENT_COLORS = {
  VIP: 'bg-amber-100 text-amber-700 border-amber-200',
  Loyal: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  Regular: 'bg-blue-100 text-blue-700 border-blue-200',
  'At-Risk': 'bg-rose-100 text-rose-700 border-rose-200',
  Inactive: 'bg-slate-100 text-slate-500 border-slate-200',
  New: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const CustomerDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const customer = useSelector(selectSelectedCustomer);
  const loading = useSelector(selectCustomersLoading);

  useEffect(() => {
    if (id) dispatch(fetchCustomerById(id));
  }, [dispatch, id]);

  if (loading || !customer) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleToggleStatus = () => {
    const action = customer.isActive !== false ? 'block' : 'activate';
    if (window.confirm(`Are you sure you want to ${action} this customer?`)) {
      dispatch(toggleCustomerStatus({ id: customer._id, isActive: !(customer.isActive !== false) }));
    }
  };

  const segmentColor = SEGMENT_COLORS[customer.segment] || SEGMENT_COLORS.New;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between bg-white/70 backdrop-blur-xl p-4 rounded-2xl border shadow-sm">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} className="mr-2" /> Back to Customers
        </Button>
        <Button
          variant="outline"
          onClick={handleToggleStatus}
          className={customer.isActive !== false ? 'text-red-500 border-red-200' : 'text-emerald-500 border-emerald-200'}
        >
          <Ban size={16} className="mr-2" />
          {customer.isActive !== false ? 'Block Customer' : 'Activate Customer'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card className="lg:col-span-1 pt-5 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-black text-2xl">
              {customer.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900">{customer.name}</h1>
              <div className={`inline-flex mt-1 px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${segmentColor}`}>
                {customer.segment === 'VIP' && <TrendingUp size={12} className="mr-1" />}
                {customer.segment || 'New'}
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t">
            <InfoRow icon={<Phone size={14} />} label="Phone" value={customer.phone} />
            <InfoRow icon={<Mail size={14} />} label="Email" value={customer.email || 'Not provided'} />
            <InfoRow icon={<MapPin size={14} />} label="Address" value={customer.homeAddress || 'Not provided'} />
            <InfoRow
              icon={<Calendar size={14} />}
              label="Date of Birth"
              value={customer.dateOfBirth ? new Date(customer.dateOfBirth).toLocaleDateString() : 'Not provided'}
            />
            <InfoRow
              icon={<Calendar size={14} />}
              label="Last Visit"
              value={customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : '—'}
            />
          </div>

          <div className="pt-4 border-t">
            <Badge variant={customer.isActive !== false ? 'success' : 'danger'}>
              {customer.isActive !== false ? 'Active' : 'Blocked'}
            </Badge>
          </div>
        </Card>

        {/* Stats + Order History */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard icon={<ShoppingBag className="text-indigo-500" />} label="Total Orders" value={customer.totalOrders || 0} />
            <StatCard icon={<TrendingUp className="text-emerald-500" />} label="Total Spent" value={`Rs. ${(customer.totalSpent || 0).toLocaleString()}`} />
            <StatCard icon={<Award className="text-amber-500" />} label="Loyalty Points" value={customer.loyaltyPoints || 0} />
          </div>

          <Card className="p-8">
            <div className="flex items-center gap-2 mb-6">
              <ShoppingBag size={18} className="text-indigo-600" />
              <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Order History</h3>
            </div>

            {(!customer.recentOrders || customer.recentOrders.length === 0) ? (
              <p className="text-sm text-slate-400 italic">No orders placed yet.</p>
            ) : (
              <div className="space-y-3">
                {customer.recentOrders.map((order) => (
                    <div key={order._id} className="p-4 bg-slate-50 rounded-xl">
                        <div className="flex justify-between items-start mb-3">
                        <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleString()}</p>
                        <div className="text-right">
                            <p className="font-black text-slate-900">Rs. {order.totalPrice?.toLocaleString()}</p>
                            <Badge variant={order.status === 'Completed' ? 'success' : 'outline'} className="text-[10px]">
                            {order.status}
                            </Badge>
                        </div>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-slate-200">
                        {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm">
                            <div className="flex-1">
                                <span className="font-semibold text-slate-700">{item.qty}× {item.name}</span>
                                {item.customizations?.length > 0 && (
                                <p className="text-[11px] text-slate-400 italic mt-0.5">
                                    {item.customizations.join(', ')}
                                </p>
                                )}
                            </div>
                            <span className="font-mono text-slate-600 text-xs">
                                Rs. {(item.price * item.qty).toLocaleString()}
                            </span>
                            </div>
                        ))}
                        {(!order.items || order.items.length === 0) && (
                            <p className="text-xs text-slate-400 italic">No item details available.</p>
                        )}
                        </div>
                    </div>
                    ))}
              </div>
            )}
          </Card>

          {customer.notes && (
            <Card className="p-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={18} className="text-indigo-600" />
                <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Notes</h3>
              </div>
              <p className="text-sm text-slate-600 italic">{customer.notes}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="mt-0.5 text-slate-400">{icon}</div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-slate-800">{value}</p>
    </div>
  </div>
);

const StatCard = ({ icon, label, value }) => (
  <Card className="p-6 flex items-center gap-4">
    <div className="p-3 bg-slate-50 rounded-2xl">{icon}</div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-black text-slate-900">{value}</p>
    </div>
  </Card>
);

export default CustomerDetailPage;