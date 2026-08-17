import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Search, Star, Reply, Flag, CheckCircle, RefreshCw, XCircle, 
  BrainCircuit, Sparkles, Download, Calendar, MessageSquare, UtensilsCrossed 
} from 'lucide-react';

// Redux Actions & Selectors
import { fetchReviews, toggleReviewFlag, analyzeReviewSentiment } from '@/features/reviews/reviewThunks';
import { clearReviewSuccess } from '@/features/reviews/reviewSlice';
import {
  selectReviewsLoading,
  selectReviewsError,
  selectAverageRating,
  selectAllReviews, 
  selectFilteredReviews,
  selectResponseRate,
  selectReviewStats,
  selectPagination,
} from '@/features/reviews/reviewSelector';

// UI Components
import Button from '@/components/common/Button';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import ErrorMessage from '@/components/common/ErrorBoundary';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { cn } from '@/utils/cn';

const PAGE_SIZE = 20;

const ReviewPage = () => {
  const dispatch = useDispatch();

  // Local State
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [page, setPage] = useState(1);

  // Selectors
  const loading = useSelector(selectReviewsLoading);
  const error = useSelector(selectReviewsError);
  const avgRating = useSelector(selectAverageRating);
  const stats = useSelector(selectReviewStats);
  const responseRate = useSelector(selectResponseRate);
  const filteredReviews = useSelector((state) => 
    selectFilteredReviews(state, searchTerm, ratingFilter, statusFilter)
  );
  const reviews = useSelector(selectAllReviews);
  const { totalPages, totalCount } = useSelector(selectPagination);

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearchTerm(searchInput);
      setPage(1); 
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [ratingFilter, statusFilter]);

  useEffect(() => {
    dispatch(fetchReviews({
      page,
      limit: PAGE_SIZE,
      search: searchTerm,
      rating: ratingFilter,
      status: statusFilter,
    }));
  }, [dispatch, page, searchTerm, ratingFilter, statusFilter]);

  useEffect(() => {
    return () => dispatch(clearReviewSuccess());
  }, [dispatch]);

  const handleRunAISentiment = async () => {
    await dispatch(analyzeReviewSentiment());
    dispatch(fetchReviews({ page, limit: PAGE_SIZE, search: searchTerm, rating: ratingFilter, status: statusFilter }));
  };

  const handleToggleFlag = (reviewId, currentFlagStatus) => {
    dispatch(toggleReviewFlag({ reviewId, isFlagged: !currentFlagStatus }));
  };

  const resetFilters = () => {
    setSearchInput('');
    setSearchTerm('');
    setRatingFilter('all');
    setStatusFilter('all');
    setPage(1);
  };

  return (
    <div className="max-w-full mx-auto py-10 px-6 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/*  HEADER  */}
      <div className="sticky rounded-[2rem] top-0 z-40 -mx-6 px-6 py-4 bg-white/[0.25] backdrop-blur-xl border-b border-slate-200/50 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
            Review Intelligence
          </h1>
          <p className="text-slate-500 font-medium flex items-center gap-2 text-sm md:text-base">
            <BrainCircuit size={16} className="text-indigo-500" />
            Analyzing customer sentiment at the dish level.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="primary" 
            onClick={handleRunAISentiment} 
            disabled={isAnalyzing || loading}
            icon={isAnalyzing ? RefreshCw : Sparkles}
            className={cn(
              "shadow-xl rounded-2xl font-bold py-4 px-6 md:py-6 md:px-8 bg-gradient-to-r from-indigo-600 to-violet-600 border-none",
              isAnalyzing && "animate-pulse"
            )}
          >
            {isAnalyzing ? 'Processing NLP...' : 'Run AI Analysis'}
          </Button>
          <Button variant="white" icon={Download} className="shadow-lg border-white/60 rounded-2xl font-bold h-12">
            Export
          </Button>
        </div>
      </div>

      {/*  KPI STATS  */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Feedback" value={stats.totalReviews} color="bg-indigo-500" />
        <StatCard label="Avg Rating" value={avgRating} subValue="/ 5.0" color="bg-amber-500" isRating />
        <StatCard label="Flagged Issues" value={stats.flagged} color="bg-rose-500" />
        <StatCard label="Response Rate" value={`${responseRate}%`} color="bg-emerald-500" />
      </div>

      {/*  FILTER PANE  */}
      <div className="relative z-30 bg-white/40 backdrop-blur-xl border border-white/60 p-6 rounded-[2.5rem] shadow-2xl shadow-slate-200/40 flex flex-col gap-5">
        <div className="w-full flex gap-3">
          <Input
            placeholder="Search by customer, dish name, or keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
            className="bg-white/60 border-white shadow-inner rounded-2xl h-12"
            fullWidth
          />
          {(searchTerm || ratingFilter !== 'all' || statusFilter !== 'all') && (
              <Button variant="ghost" onClick={resetFilters} className="text-slate-400 hover:text-rose-500">
                  <XCircle size={20} />
              </Button>
          )}
        </div>

        <div className="flex flex-row items-center justify-between gap-4">
          <div className="flex flex-1 gap-4">
            <Select
              value={ratingFilter}
              onChange={setRatingFilter}
              className="bg-white/60 border-white rounded-xl flex-1 shadow-sm h-11"
              options={[
                { value: 'all', label: 'All Ratings' },
                { value: '5', label: '5 Stars' },
                { value: '1', label: 'Critical (1-2 Star)' },
              ]}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              className="bg-white/60 border-white rounded-xl flex-1 shadow-sm h-11"
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'flagged', label: 'High Priority' },
              ]}
            />
          </div>
          <Button 
            variant="secondary" 
            className="bg-white/80 rounded-xl shadow-lg h-11 px-4"
            onClick={() => dispatch(fetchReviews())}
          >
            <RefreshCw size={18} className={cn("mr-2", loading && "animate-spin")} />
            Sync
          </Button>
        </div>
      </div>

      {/* AI CARD FEED  */}
      <div className="space-y-6">
        {error && <ErrorMessage message={error} />}

        {loading && reviews.length === 0 ? (
          <div className="py-32 flex flex-col items-center gap-4">
            <LoadingSpinner />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
              Processing Sentiment Segments...
            </p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white/50 rounded-3xl p-20 text-center border-2 border-dashed border-slate-200">
            <MessageSquare size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-500 font-medium text-lg">No matching reviews found.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {reviews.map((review) => (
                <ReviewIntelligenceCard
                  key={review._id}
                  review={review}
                  onFlag={handleToggleFlag}
                />
              ))}
            </div>

            <PaginationBar
              page={page}
              totalPages={totalPages}
              totalCount={totalCount}
              onPageChange={setPage}
              loading={loading}
            />
          </>
        )}
      </div>
    </div>
  );
};

const PaginationBar = ({ page, totalPages, totalCount, onPageChange, loading }) => (
  <div className="flex items-center justify-between pt-6">
    <p className="text-xs font-bold text-slate-400">
      Page {page} of {totalPages} · {totalCount} total reviews
    </p>
    <div className="flex gap-2">
      <button
        disabled={page <= 1 || loading}
        onClick={() => onPageChange(page - 1)}
        className="px-4 py-2 rounded-xl border disabled:opacity-40"
      >
        Prev
      </button>
      <button
        disabled={page >= totalPages || loading}
        onClick={() => onPageChange(page + 1)}
        className="px-4 py-2 rounded-xl border disabled:opacity-40"
      >
        Next
      </button>
    </div>
  </div>
);

/* ENHANCED INTELLIGENCE CARD */

const ReviewIntelligenceCard = ({ review, onFlag }) => {
  // Logic to handle sentiment styling
  const sentiment = review.sentimentLabel || 'Not Analyzed';
  const score = review.sentimentScore || 0;
  
  const sentimentConfig = {
    Positive: "border-emerald-200 bg-emerald-50/30 text-emerald-700",
    Negative: "border-rose-200 bg-rose-50/30 text-rose-700",
    Neutral: "border-slate-200 bg-slate-50/30 text-slate-600",
    'Not Analyzed': "border-slate-100 bg-slate-50/30 text-slate-400"
  };

  return (
    <div className={cn(
      "group relative bg-white/[0.30] backdrop-blur-md rounded-[2rem] border-2 p-6 transition-all hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1",
      review.isFlagged ? "border-rose-400" : "border-white"
    )}>
      
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl shadow-inner">
            {review.customer?.name?.[0] || review.customerName?.[0] || 'C'}
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-lg leading-tight">
              {review.customer?.name || review.customerName}
            </h3>
            <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
              <Calendar size={10} />
              {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              <span className="text-slate-200">|</span>
              <span className={review.orderId ? "text-indigo-400" : ""}>
                {review.orderId ? `#ORD-${review.orderId.slice(-6).toUpperCase()}` : 'WALK-IN'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100 shadow-sm">
          <Star size={14} className="fill-amber-400 text-amber-400 mr-1.5" />
          <span className="font-black text-amber-700 text-sm">{review.rating}</span>
        </div>
      </div>

      {/* Main Feedback Content */}
      <div className="mb-3">
         <p className="text-slate-600 font-medium leading-relaxed italic">
           "{review.feedback || review.comment || "No written feedback provided."}"
         </p>
      </div>

      {/* AI INSIGHTS SECTION (Specific Foods) */}
      <div className="space-y-3 bg-white/50 rounded-2xl p-4 border border-slate-100 shadow-inner">
         <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
            <Sparkles size={12} className="text-indigo-500" />
            AI Dish-Level Analysis
         </div>
         
         {/* If your backend/Python service returns split insights, map them here */}
         {review.foodAnalysis?.length > 0 ? (
           review.foodAnalysis.map((item, idx) => (
             <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-50 shadow-sm">
               <div className="flex items-center gap-2">
                  <UtensilsCrossed size={12} className="text-slate-400" />
                  <span className="text-sm font-bold text-slate-700">{item.foodName}</span>
               </div>
               <Badge className={cn("text-[10px] py-0 px-2 rounded-lg", 
                  item.sentiment === 'Positive' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700")}>
                  {item.sentiment}
               </Badge>
             </div>
           ))
         ) : (
           <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Overall Sentiment</span>
              <Badge className={cn("text-[10px] font-black uppercase tracking-tighter", sentimentConfig[sentiment])}>
                {sentiment}
              </Badge>
           </div>
         )}

         {/* AI Confidence Bar */}
         {score !== 0 && (
            <div className="mt-2">
              <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-1 px-1 uppercase tracking-tighter">
                <span>
                  Sentiment Intensity
                  <span className={cn(
                    "ml-1 font-black",
                    score > 0 ? "text-emerald-500" : "text-rose-500"
                  )}>
                    ({score > 0 ? '▲ Positive' : '▼ Negative'})
                  </span>
                </span>
                <span>{Math.round(Math.abs(score * 100))}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn("h-full transition-all duration-1000", score > 0 ? "bg-emerald-400" : "bg-rose-400")}
                  style={{ width: `${Math.abs(score * 100)}%` }}
                />
              </div>
            </div>
          )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="flex gap-2">
           {review.repliedAt ? (
             <div className="flex items-center text-emerald-600 text-[10px] font-black uppercase tracking-widest">
               <CheckCircle size={14} className="mr-1" /> Replied
             </div>
           ) : (
             <Button variant="ghost" size="sm" className="text-indigo-600 font-bold text-xs hover:bg-indigo-50 rounded-xl">
               <Reply size={14} className="mr-2" /> Send Reply
             </Button>
           )}
        </div>

        <button 
          onClick={() => onFlag(review._id, review.isFlagged)}
          className={cn(
            "p-2.5 rounded-xl transition-all shadow-sm border",
            review.isFlagged 
              ? "bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100" 
              : "bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-100"
          )}
        >
          {review.isFlagged ? <CheckCircle size={18} /> : <Flag size={18} />}
        </button>
      </div>
    </div>
  );
};

/* KPI SUB-COMPONENT */
const StatCard = ({ label, value, subValue, color, isRating }) => (
  <div className="relative overflow-hidden bg-black/[0.65] backdrop-blur-md border border-white rounded-[1.3rem] p-6 shadow-xl shadow-slate-200/50 group transition-all hover:-translate-y-1">
    <div className={cn("absolute top-0 left-0 w-1.5 h-full", color)} />
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{label}</p>
    <div className="flex items-baseline gap-1">
      <p className={cn("text-4xl font-black tracking-tighter", isRating ? "text-amber-300" : "text-white")}>
        {value}
      </p>
      {subValue && <span className="text-slate-400 font-bold text-sm">{subValue}</span>}
    </div>
    <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.1] transition-opacity">
      <BrainCircuit size={100} className='text-white' />
    </div>
  </div>
);

export default ReviewPage;