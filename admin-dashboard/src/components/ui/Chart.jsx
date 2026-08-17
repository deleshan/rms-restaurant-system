import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadarController,
  PolarAreaController,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Pie, Doughnut, Radar, PolarArea } from 'react-chartjs-2';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTheme } from '@/hooks/useTheme';
import LoadingSpinner from '../common/LoadingSpinner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadarController,
  PolarAreaController,
  Title,
  Tooltip,
  Legend,
  Filler
);

const chartComponents = {
  bar: Bar,
  line: Line,
  pie: Pie,
  doughnut: Doughnut,
  radar: Radar,
  polarArea: PolarArea,
};

const Chart = ({
  type = 'bar',
  data,
  options = {},
  title,
  height = 300,
  loading = false,
  error = null,
  className = '',
  containerClassName = '',
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const ChartComponent = chartComponents[type];

  if (!ChartComponent) {
    return <div className="text-rose-600 font-bold p-4 bg-rose-500/10 rounded-xl">Invalid chart type: {type}</div>;
  }

  // Theme-Aware Chart Styling
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const textColor = isDark ? '#94a3b8' : '#64748b'; // slate-400 : slate-500
  const titleColor = isDark ? '#ffffff' : '#0f172a'; // white : slate-900

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: textColor,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20,
          font: { family: 'inherit', weight: '600', size: 12 }
        },
      },
      title: {
        display: !!title,
        text: title,
        color: titleColor,
        font: { size: 16, weight: '900', family: 'inherit' },
        padding: { top: 10, bottom: 25 },
        align: 'start'
      },
      tooltip: {
        backgroundColor: isDark ? '#1e293b' : '#ffffff',
        titleColor: titleColor,
        bodyColor: textColor,
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 12,
        displayColors: true,
        usePointStyle: true,
      },
    },
    scales: (type === 'bar' || type === 'line') ? {
      x: {
        grid: { display: false },
        ticks: { color: textColor, font: { weight: '600' } }
      },
      y: {
        beginAtZero: true,
        grid: { color: gridColor },
        border: { display: false },
        ticks: { color: textColor, font: { weight: '600' } }
      },
    } : undefined,
    animation: {
      duration: 1500,
      easing: 'easeOutQuart',
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
    plugins: {
      ...defaultOptions.plugins,
      ...options.plugins,
    }
  };

  // Render States 

  if (loading) {
    return (
      <div className={cn('w-full flex items-center justify-center p-8', containerClassName)} style={{ height: `${height + 100}px` }}>
        <LoadingSpinner message="Analyzing real-time data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('w-full flex items-center justify-center border-2 border-dashed rounded-[2.5rem]', 
        isDark ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50', 
        containerClassName)} style={{ height: `${height + 100}px` }}>
        <div className="text-center px-6">
          <div className="bg-rose-500/10 p-4 rounded-full w-fit mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-rose-500" />
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Analysis Error</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.labels || !data.datasets) {
    return (
      <div className={cn('w-full flex items-center justify-center border-2 border-dashed rounded-[2.5rem]', 
        isDark ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50', 
        containerClassName)} style={{ height: `${height + 100}px` }}>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">Waiting for data stream...</p>
      </div>
    );
  }

  return (
    <div className={cn('w-full', containerClassName)}>
      <div className={cn(
        'backdrop-blur-xl transition-all duration-300 border p-8 rounded-[2.5rem]',
        isDark 
          ? 'bg-slate-900/40 border-white/5 shadow-2xl shadow-black/40' 
          : 'bg-white/60 border-white shadow-xl shadow-slate-200/50',
        className
      )}>
        <div style={{ height: `${height}px` }}>
          <ChartComponent data={data} options={mergedOptions} />
        </div>
      </div>
    </div>
  );
};

export default Chart;