import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Roof, RainEntry } from './types';
import RoofMeasurer from './components/RoofMeasurer';
import RainGauge from './components/RainGauge';
import Results from './components/Results';
import DataSheets from './components/DataSheets';
import { cn } from './lib/utils';
import { 
  Maximize2, 
  CloudRain, 
  Droplets, 
  FileSpreadsheet, 
  Globe,
  Waves
} from 'lucide-react';

type Tab = 'map' | 'rain' | 'results' | 'sheets';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('map');
  const [roofs, setRoofs] = useState<Roof[]>([]);
  const [rainEntries, setRainEntries] = useState<RainEntry[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const savedRoofs = localStorage.getItem('roof_tracker_roofs');
    const savedRain = localStorage.getItem('roof_tracker_rain');
    if (savedRoofs) setRoofs(JSON.parse(savedRoofs));
    if (savedRain) setRainEntries(JSON.parse(savedRain));
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('roof_tracker_roofs', JSON.stringify(roofs));
  }, [roofs]);

  useEffect(() => {
    localStorage.setItem('roof_tracker_rain', JSON.stringify(rainEntries));
  }, [rainEntries]);

  const handleSaveRoof = (roof: Roof) => {
    setRoofs(prev => [...prev, roof]);
  };

  const handleSaveRain = (entry: RainEntry) => {
    setRainEntries(prev => [...prev, entry].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  const handleDeleteRain = (id: string) => {
    setRainEntries(prev => prev.filter(e => e.id !== id));
  };

  const tabs = [
    { id: 'map', label: '1. Roof Measurer', icon: Maximize2, color: 'bg-orange-500', ring: 'ring-orange-300' },
    { id: 'rain', label: '2. Rain Gauge', icon: CloudRain, color: 'bg-blue-500', ring: 'ring-blue-300' },
    { id: 'results', label: '3. Toilet Flushes!', icon: Droplets, color: 'bg-green-500', ring: 'ring-green-300' },
    { id: 'sheets', label: 'Data & Sheets', icon: FileSpreadsheet, color: 'bg-purple-500', ring: 'ring-purple-300' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4 md:px-8 font-sans">
      
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-6xl bg-white rounded-[3rem] shadow-2xl p-8 mb-10 text-center border-b-[12px] border-blue-400 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 via-green-400 to-orange-400" />
        <div className="flex items-center justify-center gap-4 mb-2">
          <Globe className="w-10 h-10 text-blue-500 animate-pulse" />
          <h1 className="text-4xl md:text-6xl font-black text-slate-800 tracking-tighter">
            Rain <span className="text-blue-500">&</span> Roof <span className="text-orange-500">Tracker</span>
          </h1>
        </div>
        <p className="text-xl text-slate-500 font-bold max-w-2xl mx-auto leading-relaxed">
          Measure your school's roof, record the rain, and see how many <span className="text-blue-600 underline decoration-wavy decoration-blue-200">toilet flushes</span> you can save!
        </p>
      </motion.header>

      {/* Navigation Bar */}
      <nav className="w-full max-w-6xl flex flex-wrap justify-center gap-2 md:gap-3 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm md:text-base transition-all transform hover:scale-105 shadow-md",
                isActive 
                  ? cn(tab.color, "text-white ring-2 ring-offset-2", tab.ring)
                  : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"
              )}
            >
              <Icon className={cn("w-4 h-4 md:w-5 md:h-5", isActive ? "text-white" : "text-slate-400")} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Main Content Area */}
      <main className="w-full max-w-7xl bg-white rounded-[2.5rem] shadow-2xl p-4 md:p-8 border-4 border-slate-50 min-h-[75vh] relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'map' && (
              <RoofMeasurer onSave={handleSaveRoof} savedRoofs={roofs} />
            )}
            {activeTab === 'rain' && (
              <RainGauge onSave={handleSaveRain} onDelete={handleDeleteRain} entries={rainEntries} />
            )}
            {activeTab === 'results' && (
              <Results roofs={roofs} rain={rainEntries} />
            )}
            {activeTab === 'sheets' && (
              <DataSheets roofs={roofs} rain={rainEntries} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Floating Water Decoration */}
        <div className="absolute bottom-6 right-10 opacity-10 pointer-events-none">
          <Waves className="w-32 h-32 text-blue-500" />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 text-slate-400 font-bold text-center">
        <p>🌍 A Primary School Science Project • Metric Edition • 12L per Flush</p>
      </footer>
    </div>
  );
}
