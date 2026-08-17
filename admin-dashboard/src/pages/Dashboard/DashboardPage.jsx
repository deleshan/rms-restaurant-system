import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  TrendingUp, ShoppingCart, DollarSign, Users, BrainCircuit,
  Sparkles, Zap, LayoutGrid, AlertTriangle, CheckCircle2, Activity,
  Cpu, RefreshCw
} from 'lucide-react';

// Socket 
import { socket } from '@/socket';

// UI Components
import Chart from '@/components/ui/Chart';
import Card from '@/components/common/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorBoundary';
import { cn } from '@/utils/cn';

// Selectors & Thunks
import {
  selectDashboardStats,
  selectDashboardLoading,
  selectDashboardError,
  selectActiveTables,
  selectInventoryAlerts
} from '@/features/dashboard/dashboardSelector';
import { fetchDashboardStats } from '@/features/dashboard/dashboardThunks';
import { triggerSegmentation } from '@/features/customer/customerThunks';
import { selectUser } from '@/features/auth/authSelectors';
import { toast } from '@/components/common/Toast';

// ANIMATION VARIANTS 
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } }
};

const itemVariants = {
  hidden: { y: 24, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 280, damping: 22 } }
};

// TABLE STATUS CONFIG
const TABLE_STATUS_CONFIG = {
  Occupied: {
    card:  'bg-brand/10 border-brand/30',
    pill:  'bg-brand/10',
    dot:   'bg-brand animate-pulse',
    text:  'text-brand',
    label: 'text-brand',
    ping:  true,
  },
  Reserved: {
    card:  'bg-amber-500/10 border-amber-500/30',
    pill:  'bg-amber-500/10',
    dot:   'bg-amber-500',
    text:  'text-amber-500',
    label: 'text-amber-500',
    ping:  false,
  },
  Available: {
    card:  'bg-white/60 dark:bg-white/5 border-white/40 dark:border-white/10',
    pill:  'bg-slate-100 dark:bg-white/5',
    dot:   'bg-slate-300 dark:bg-slate-600',
    text:  'text-slate-400',
    label: 'text-slate-400',
    ping:  false,
  },
  default: {
    card:  'bg-white/60 dark:bg-white/5 border-white/40 dark:border-white/10',
    pill:  'bg-slate-100 dark:bg-white/5',
    dot:   'bg-slate-300 dark:bg-slate-600',
    text:  'text-slate-400',
    label: 'text-slate-400',
    ping:  false,
  },
};

// DASHBOARD PAGE 
const DashboardPage = () => {
  const dispatch = useDispatch();

  const user            = useSelector(selectUser);
  const restaurantId    = user?.restaurantId;
  const stats           = useSelector(selectDashboardStats);
  const loading         = useSelector(selectDashboardLoading);
  const error           = useSelector(selectDashboardError);
  const allTables       = useSelector(selectActiveTables)    || [];
  const inventoryAlerts = useSelector(selectInventoryAlerts) || [];

  // Tracks last sync time for the live indicator
  const [lastSynced, setLastSynced]     = useState(null);
  const [justRefreshed, setJustRefreshed] = useState(false);

  // INITIAL FETCH 
  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  // SOCKET — real-time dashboard refresh 
  useEffect(() => {
    if (!restaurantId) return;

    // Backend emits to both kitchen_X and admin_X rooms
    socket.emit('join-kitchen-room', restaurantId);

    const triggerRefresh = (eventName) => (data) => {
      console.log(`[Dashboard] socket "${eventName}" received → refreshing stats`);
      dispatch(fetchDashboardStats());
      setLastSynced(new Date());
      setJustRefreshed(true);
      setTimeout(() => setJustRefreshed(false), 2500);
    };

    // Events your backend already emits 
    // createOrder controller  → req.io.to(kitchenRoom).emit('new-order', ...)
    // createOrder controller  → req.io.to(adminRoom).emit('order-created', ...)
    const handleNewOrder      = triggerRefresh('new-order');
    const handleOrderCreated  = triggerRefresh('order-created');
    const handleStatusUpdated = triggerRefresh('ORDER_STATUS_UPDATED');

    socket.on('new-order',            handleNewOrder);
    socket.on('order-created',        handleOrderCreated);
    socket.on('ORDER_STATUS_UPDATED', handleStatusUpdated);

    return () => {
      socket.off('new-order',            handleNewOrder);
      socket.off('order-created',        handleOrderCreated);
      socket.off('ORDER_STATUS_UPDATED', handleStatusUpdated);
    };
  }, [restaurantId, dispatch]);

  // AI CAMPAIGN
  const handleRunAiCampaign = async () => {
    try {
      await dispatch(triggerSegmentation()).unwrap();
      toast.success('AI Customer Segments Updated!');
      dispatch(fetchDashboardStats());
    } catch (err) {
      toast.error(err || 'AI Analysis failed');
    }
  };

  // DERIVED DATA
  const salesTrendRaw = stats?.salesTrend?.length > 0
  ? stats.salesTrend
  : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(name => ({ name, sales: 0 }));

  const salesChartData = {
    labels: salesTrendRaw.map(d => d.name),
    datasets: [
      {
        label: 'Revenue',
        data: salesTrendRaw.map(d => d.sales),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: '#6366f1',
      },
    ],
  };

  const segmentationData = {
    labels: ['New', 'VIP', 'Regular', 'At-Risk'],
    datasets: [{
      data: [
        stats?.segments?.New || 0,
        stats?.segments?.vips || 0,
        stats?.segments?.regulars || 0,
        stats?.segments?.atRisk || 0,
      ],
      backgroundColor: ['#10b981', '#6366f1', '#f43f5e', '#f97316'],
      hoverOffset: 15,
      borderWidth: 0,
    }],
  };

  const occupiedCount  = allTables.filter(t => t.status === 'Occupied').length;
  const reservedCount  = allTables.filter(t => t.status === 'Reserved').length;
  const availableCount = allTables.filter(t => t.status === 'Available').length;

  // Format last synced time as "12:34:56"
  const lastSyncedLabel = lastSynced
    ? lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  // LOADING / ERROR
  if (loading && !stats?.activeOrders) return (
    <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand animate-pulse">
        Syncing Neural Data...
      </p>
    </div>
  );

  if (error) return <ErrorMessage message={error} />;

  // RENDER 
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="pb-10 space-y-8 max-w-[1600px] mx-auto"
    >

      {/* HEADER */}
      <motion.header
        variants={itemVariants}
        className="relative overflow-hidden bg-white/40 dark:bg-white/5 backdrop-blur-2xl
                   border border-white/40 dark:border-white/10 rounded-[2.5rem] p-8 shadow-glass"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Admin RMS
              </h1>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/10
                              border border-brand/20 text-brand text-[10px] font-black uppercase tracking-widest">
                <Sparkles size={12} className="animate-pulse" />
                AI Analysis Active
              </div>
            </div>

            {/* Live sync status line */}
            <div className="flex items-center gap-2 mt-2">
              <Activity size={13} className="text-emerald-500 animate-pulse" />
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                System performance is{' '}
                <span className="text-emerald-500 font-bold italic">optimized</span>.
              </p>
              {lastSyncedLabel && (
                <span className={cn(
                  'text-[9px] font-black uppercase tracking-widest transition-all duration-500',
                  justRefreshed ? 'text-emerald-500' : 'text-slate-400'
                )}>
                  · Last synced {lastSyncedLabel}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleRunAiCampaign}
              className="flex items-center gap-2 rounded-2xl bg-brand shadow-brand-glow hover:scale-105 transition-transform duration-300 h-full"
            >
              <RefreshCw className="h-4 w-4 fill-current"/>
              <span>Refresh Dashboard</span>
            </Button>
          </div>
        </div>
      </motion.header>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title:  'Net Revenue',
            value:  `LKR ${stats?.todayRevenue?.toLocaleString() || '0'}`,
            trend:  stats?.revenueTrend || 'Today',
            icon:   DollarSign,
            color:  'text-emerald-500',
            detail: "Today's Earnings",
          },
          {
            title:  'Active Orders',
            value:  stats?.activeOrders ?? 0,
            trend:  'Live',
            icon:   ShoppingCart,
            color:  'text-brand',
            detail: 'Orders in Kitchen',
          },
          {
            title:  'VADER Sentiment',
            value:  stats?.sentimentScore != null ? `${stats.sentimentScore}%` : 'N/A',
            trend:  'Feedback',
            icon:   BrainCircuit,
            color:  'text-indigo-400',
            detail: 'Customer Mood',
          },
          {
            title:  'VIP Clusters',
            value:  stats?.segments?.vips ?? 'N/A',
            trend:  'AI Cluster',
            icon:   Users,
            color:  'text-blue-400',
            detail: 'High Value Leads',
          },
        ].map((item, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className={cn(
              'group relative overflow-hidden p-6 hover:shadow-2xl transition-all duration-500',
              'border-white/40 dark:border-white/5 bg-white/40 dark:bg-white/5 backdrop-blur-lg',
              justRefreshed && 'ring-1 ring-emerald-400/30'
            )}>
              <div className="flex justify-between items-start mb-4">
                <div className={cn(
                  'p-3 rounded-2xl bg-slate-100 dark:bg-white/10',
                  'group-hover:scale-110 transition-transform duration-500',
                  item.color
                )}>
                  <item.icon size={20} />
                </div>
                <Badge className="rounded-lg font-black tracking-widest text-[10px] bg-brand/10 text-brand border-brand/20">
                  {item.trend}
                </Badge>
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                {item.title}
              </h3>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {item.value}
              </div>
              <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-wide">
                {item.detail}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* TABLE OVERVIEW + STOCK ALERTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* TABLE OVERVIEW */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="p-6 h-full bg-white/40 dark:bg-white/5 backdrop-blur-lg
                           border-white/40 dark:border-white/10">

            {/* Header */}
            <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
              <div className="flex items-center gap-2">
                <LayoutGrid size={18} className="text-brand" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  Table Overview
                </h3>
                {/* Live sync badge — flashes green when socket fires */}
                {justRefreshed ? (
                  <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-500 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Live Synced
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                    Live
                  </span>
                )}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-brand">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
                  </span>
                  {occupiedCount} Occupied
                </span>

                <span className="text-slate-200 dark:text-slate-700 select-none">|</span>

                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-amber-500">
                  <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                  {reservedCount} Reserved
                </span>

                <span className="text-slate-200 dark:text-slate-700 select-none">|</span>

                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 flex-shrink-0" />
                  {availableCount} Available
                </span>

                <Badge
                  variant="outline"
                  className="border-slate-200 dark:border-white/10 text-slate-500 text-[10px] font-black"
                >
                  {allTables.length} Total
                </Badge>
              </div>
            </div>

            {/* Empty state */}
            {allTables.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 ">
                <LayoutGrid size={32} className="text-slate-200 dark:text-slate-700" />
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  No Tables Configured
                </p>
                <p className="text-[10px] text-slate-300 dark:text-slate-600 font-medium">
                  Add tables via the Table Management section
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                {allTables.map((table) => {
                  const cfg = TABLE_STATUS_CONFIG[table.status] ?? TABLE_STATUS_CONFIG.default;

                  return (
                    <motion.div
                      key={table._id}
                      whileHover={{ scale: 1.04, transition: { duration: 0.18 } }}
                      className={cn(
                        'relative p-4 rounded-3xl border transition-all duration-300 cursor-default',
                        cfg.card
                      )}
                    >
                      {/* Animated ping — Occupied only */}
                      {cfg.ping && (
                        <span className="absolute top-3 right-3 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-brand" />
                        </span>
                      )}

                      {/* Static dot - Reserved only */}
                      {table.status === 'Reserved' && (
                        <span className="absolute top-3 right-3 flex h-2 w-2">
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                        </span>
                      )}

                      {/* Table number */}
                      <div className="mb-3 pr-4">
                        <span className={cn('text-xl font-black leading-none', cfg.text)}>
                          T‑{table.tableNumber}
                        </span>
                      </div>

                      {/* Status pill */}
                      <div className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-full', cfg.pill)}>
                        <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />
                        <span className={cn('text-[9px] font-black uppercase tracking-widest', cfg.label)}>
                          {table.status}
                        </span>
                      </div>

                      {/* Capacity */}
                      <div className="mt-3">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide flex items-center gap-1">
                          <Users size={9} />
                          {table.capacity ?? '—'}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>

        {/* STOCK ALERTS */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 h-full bg-rose-500/5 border-rose-500/20 backdrop-blur-lg">
            <div className="flex items-center gap-2 mb-6 text-rose-500">
              <AlertTriangle size={18} />
              <h3 className="text-sm font-black uppercase tracking-widest">Stock Alerts</h3>
            </div>

            <div className="space-y-3">
              {inventoryAlerts.length > 0
                ? inventoryAlerts.map((alert, i) => (
                  <div
                    key={i}
                    className={cn(
                      'p-4 rounded-2xl border',
                      alert.isExpired
                        ? 'bg-rose-500/10 border-rose-500/20'
                        : 'bg-white/40 dark:bg-white/5 border-rose-500/10'
                    )}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase leading-tight">
                        {alert.name}
                      </h4>
                      {alert.isExpired && (
                        <Badge className="text-[8px] bg-rose-500/20 text-rose-500 border-rose-500/20 shrink-0">
                          EXPIRED
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-[10px] font-bold text-rose-500 uppercase">
                        Qty: {alert.currentStock}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500">
                        Min: {alert.minThreshold}
                      </span>
                    </div>
                    <div className="mt-2 h-1 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-rose-500 transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            alert.minThreshold > 0
                              ? (alert.currentStock / alert.minThreshold) * 100
                              : 0
                          )}%`
                        }}
                      />
                    </div>
                  </div>
                ))
                : (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <CheckCircle2 size={28} className="text-emerald-400" />
                    <p className="text-[10px] text-slate-400 text-center font-black uppercase tracking-widest">
                      Inventory Levels Stable
                    </p>
                  </div>
                )
              }
            </div>
          </Card>
        </motion.div>
      </div>

      {/* AI ANALYTICS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* REVENUE TREND */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="p-6 h-full bg-white/40 dark:bg-white/5 backdrop-blur-lg
                           border-white/40 dark:border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-brand" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                  Revenue Trend
                </h3>
              </div>
              <Badge className="text-[10px] bg-brand/10 text-brand border-brand/20 font-black">
                Last 7 Days
              </Badge>
            </div>
            <div className="h-80 w-full mb-20">
              <Chart type="line" height={320} data={salesChartData} />
            </div>
          </Card>
        </motion.div>

        {/* CUSTOMER SEGMENTS */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 h-full flex flex-col justify-between bg-white/40 dark:bg-white/5
                           backdrop-blur-lg border-white/40 dark:border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} className="text-brand" />
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
                Customer Segments
              </h3>
            </div>

            <div className="h-64 relative flex items-center justify-center mt-20 mb-20">
              <Chart
                type="doughnut"
                data={segmentationData}
                options={{ cutout: '80%', plugins: { legend: { display: false } } }}
              />
              <div className="absolute flex flex-col items-center pointer-events-none">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {stats?.totalCustomers || 0}
                </span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                  Total Clients
                </span>
              </div>
            </div>

            <div className="space-y-3 mt-6">
              {[
                { label: 'New',     value: stats?.segments?.New     || 0, color: '#10b981' },
                { label: 'VIP',     value: stats?.segments?.vips     || 0, color: '#6366f1' },
                { label: 'Regular', value: stats?.segments?.regulars || 0, color: '#f43f5e' },
                { label: 'At-Risk', value: stats?.segments?.atRisk   || 0, color: '#f97316' },
              ].map((seg) => (
                <div
                  key={seg.label}
                  className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="text-slate-500 dark:text-slate-400">{seg.label}</span>
                  </div>
                  <span className="text-slate-900 dark:text-white">{seg.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

    </motion.div>
  );
};

export default DashboardPage;