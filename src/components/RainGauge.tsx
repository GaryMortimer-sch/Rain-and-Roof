import React, { useState } from 'react';
import { RainEntry } from '@/src/types';
import { cn } from '@/src/lib/utils';
import { CloudRain, Calendar, Plus, Trash2, Droplets } from 'lucide-react';

interface RainGaugeProps {
  onSave: (entry: RainEntry) => void;
  onDelete: (id: string) => void;
  entries: RainEntry[];
}

export default function RainGauge({ onSave, onDelete, entries }: RainGaugeProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mm, setMm] = useState('');
  const [error, setError] = useState(false);

  const handleSave = () => {
    const amount = parseFloat(mm);
    if (!date || isNaN(amount) || amount < 0) {
      setError(true);
      setTimeout(() => setError(false), 3000);
      return;
    }

    onSave({
      id: typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11),
      date,
      mm: amount
    });

    setMm('');
  };

  const totalRain = entries.reduce((sum, e) => sum + e.mm, 0);

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start">
      {/* Input Form */}
      <div className="w-full md:w-1/2 bg-blue-50 p-8 rounded-[2rem] border-4 border-blue-200 shadow-lg">
        <div className="text-center mb-8">
          <div className="bg-blue-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-lg mb-4">
            <CloudRain className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-black text-blue-700">Rain Log</h2>
          <p className="text-blue-600 font-medium">Check your gauge at the same time every day!</p>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block font-bold text-slate-700 text-lg mb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" /> Date of Reading:
            </label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-4 rounded-2xl border-2 border-blue-200 focus:border-blue-500 focus:outline-none text-lg font-bold text-slate-700 shadow-sm"
            />
          </div>
          
          <div>
            <label className="block font-bold text-slate-700 text-lg mb-2 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-500" /> Amount (mm):
            </label>
            <div className="relative">
              <input 
                type="number" 
                step="0.1" 
                min="0" 
                value={mm}
                onChange={(e) => setMm(e.target.value)}
                placeholder="e.g. 12.5" 
                className={cn(
                  "w-full p-5 rounded-2xl border-2 transition-all focus:outline-none text-3xl font-black pr-20 text-blue-800 shadow-sm",
                  error ? "border-red-400 bg-red-50" : "border-blue-200 focus:border-blue-500"
                )}
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-blue-300 text-2xl">mm</span>
            </div>
            {error && <p className="text-red-500 text-sm font-bold mt-2">Please enter a valid rain amount!</p>}
          </div>
          
          <button 
            onClick={handleSave}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black py-5 rounded-2xl text-2xl shadow-xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
          >
            <Plus className="w-8 h-8" /> Record Rainfall
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="w-full md:w-1/2 bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-xl">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-black text-slate-800">Class Rain Data</h3>
          <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xl shadow-lg">
            Total: {totalRain.toFixed(1)} mm
          </div>
        </div>
        
        {entries.length === 0 ? (
          <div className="text-center py-20 text-slate-300 font-bold border-4 border-dashed border-slate-50 rounded-3xl">
            <CloudRain className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-xl">No rain recorded yet.<br />Go check the gauge!</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            <table className="w-full text-left border-separate border-spacing-y-3">
              <thead>
                <tr className="text-slate-400 uppercase text-xs font-black tracking-widest">
                  <th className="px-4 pb-2">Date</th>
                  <th className="px-4 pb-2 text-right">Rainfall</th>
                  <th className="px-4 pb-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="bg-slate-50 hover:bg-blue-50 transition-colors group">
                    <td className="p-4 rounded-l-2xl font-bold text-slate-700">
                      {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="p-4 font-black text-blue-600 text-right text-xl">
                      {entry.mm.toFixed(1)} <span className="text-xs font-bold text-blue-300">mm</span>
                    </td>
                    <td className="p-4 rounded-r-2xl text-right">
                      <button 
                        onClick={() => onDelete(entry.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
