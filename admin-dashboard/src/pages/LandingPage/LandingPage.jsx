import React from 'react';
import { Link } from 'react-router-dom';
import Button from '@/components/common/Button';
import neoImage from '@/assets/Neo4.png'; 
import dashboard from '@/assets/Dashboard11.png' 

const LandingPage = () => {
  return (
    <div className="relative min-h-screen bg-slate-50 overflow-hidden font-sans text-slate-900">
      
      {/* Background Mesh Gradients (Essential for Glassmorphism) */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-sky-200/30 rounded-full blur-[100px] -z-10" />

      {/*  Navigation  */}
      <nav className="sticky top-4 z-50 max-w-7xl mx-auto px-4">
        <div className="bg-white/40 backdrop-blur-md border border-white/20 shadow-lg shadow-slate-200/50 rounded-3xl flex justify-between items-center p-4 px-8">
          <div className="text-2xl font-black tracking-tighter text-brand italic">
            NEO<span className="text-slate-800">DEMETER</span>
          </div>
          <div className="flex items-center space-x-8">
            <Link to="/login">
              <Button variant="primary" className="shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all active:scale-95 px-6 rounded-2xl font-bold">
                Login
              </Button>
            </Link>
            <Link to="/register-restaurant">
              <Button variant="default" className="shadow-lg text-brand shadow-indigo-200 hover:shadow-indigo-300 hover:text-white transition-all active:scale-95 px-6 rounded-2xl font-bold">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/*  Hero Section  */}
      {/* Changed max-w-5xl to max-w-7xl to give the side-by-side layout more room */}
      <header className="relative pt-16 pb-20 max-w-7xl mx-auto px-6">
        
        {/* Split layout grid. Text on left, Image on right. Stacks on mobile. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center text-left">
          
          {/* Left Column: Text content */}
          <div className=' border-white/20 shadow-lg shadow-slate-200/50 rounded-3xl p-4 px-8 pb-10 backdrop-blur-md bg-white/40 h-full flex flex-col justify-center'>
            {/* Floating Glass Badge */}
            <div className="inline-block mb-6 px-4 py-1.5 bg-indigo-50/50 backdrop-blur-sm border border-indigo-100 rounded-full">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-brand">
                Next-Gen Restaurant Tech
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-8 tracking-tighter leading-[1.1]">
              Manage your restaurant <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-sky-500 italic">
                seamlessly.
              </span>
            </h1>

            <p className="text-lg text-slate-500 font-medium mb-12 leading-relaxed max-w-xl">
              A sophisticated, all-in-one ecosystem designed to bridge the gap between 
              <span className="text-slate-800 font-bold"> Admin Control</span>, 
              <span className="text-slate-800 font-bold"> Kitchen Efficiency</span>, and 
              <span className="text-slate-800 font-bold"> Customer Experience</span>.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link to="/register-restaurant">
                <Button variant="primary" size="lg" className="px-8 py-4 text-base font-black uppercase tracking-widest rounded-[2rem] shadow-2xl shadow-indigo-200 hover:-translate-y-1 transition-all">
                  Register Your Restaurant
                </Button>
              </Link>
              
              <button className="px-6 py-4 text-slate-600 font-bold hover:text-brand transition-colors flex items-center gap-2">
                View Live Demo
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right Column: Image */}
          <div className="flex justify-center lg:justify-end">
            <img 
              src={neoImage} 
              alt="Neodemeter Front Image" 
              className="w-full max-w-md md:max-w-xl object-contain shadow-[10px_10px_20px_rgba(0,0,0,0.15)] rounded-2xl" 
            />
          </div>

        </div>

      </header>
    </div>
  );
};

export default LandingPage;