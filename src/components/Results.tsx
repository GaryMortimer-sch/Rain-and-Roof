import React from 'react';
import { Roof, RainEntry } from '@/src/types';
import { motion } from 'motion/react';
import { Calendar, Droplets } from 'lucide-react';

interface ResultsProps {
  roofs: Roof[];
  rain: RainEntry[];
}

export default function Results({ roofs, rain }: ResultsProps) {
  const totalArea = roofs.reduce((sum, r) => sum + r.area, 0);
  const totalRain = rain.reduce((sum, r) => sum + r.mm, 0);
  
  // Volume = Area (m2) * Rain (mm)
  // 1mm of rain on 1m2 = 1 Liter
  const volumeLiters = totalArea * totalRain;
  const totalFlushes = Math.floor(volumeLiters / 12);
  const totalElephants = (volumeLiters / 6000).toFixed(2);

  const getComedyContent = () => {
    if (totalFlushes === 0) {
      return {
        emoji: "🌵",
        title: "Dry as a Bone!",
        msg: "Zero water! The toilets are very thirsty. We need rain (or roofs)!",
        color: "text-yellow-600 bg-yellow-50 border-yellow-100"
      };
    }
    if (totalFlushes <= 5) {
      return {
        emoji: "🤏",
        title: "A Tiny Teacup!",
        msg: "Enough for a mouse to have a bath, but not much else. Don't eat too much spicy food...",
        color: "text-orange-500 bg-orange-50 border-orange-100"
      };
    }
    if (totalFlushes <= 20) {
      return {
        emoji: "🚽",
        title: "The Emergency Flush!",
        msg: "You've saved enough for a few emergencies. Use them wisely, young water-warrior!",
        color: "text-blue-400 bg-blue-50 border-blue-100"
      };
    }
    if (totalFlushes <= 100) {
      return {
        emoji: "🏊",
        title: "Puddle Power!",
        msg: "A decent splash! You're officially an honorary bathroom water saver.",
        color: "text-green-500 bg-green-50 border-green-100"
      };
    }
    if (totalFlushes <= 500) {
      return {
        emoji: "🌊",
        title: "Whoa, Tsunami!",
        msg: "That's a lot of flushes! The school plumber is terrified of your water-saving power.",
        color: "text-blue-600 bg-blue-50 border-blue-200"
      };
    }
    if (totalFlushes <= 2000) {
      return {
        emoji: "🐳",
        title: "Whale of a Time!",
        msg: "You've collected enough to keep a blue whale's bathroom running for a week!",
        color: "text-cyan-600 bg-cyan-50 border-cyan-200"
      };
    }
    return {
      emoji: "🦖",
      title: "MEGA FLUSH!",
      msg: "UNLIMITED POWER! You have collected enough water to flush a T-Rex's toilet 10 times!",
      color: "text-purple-600 bg-purple-50 border-purple-100"
    };
  };

  const comedy = getComedyContent();

  return (
    <div className="flex flex-col items-center max-w-5xl mx-auto">
      <h2 className="text-4xl font-black text-slate-800 mb-8 text-center">The Grand Calculation!</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full mb-12">
        {/* Left: Summary Stats */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-orange-50 p-6 rounded-3xl border-2 border-orange-100 shadow-sm">
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest mb-1">Total Roof Area</p>
            <p className="text-3xl font-black text-orange-500">{totalArea} <span className="text-lg">m²</span></p>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-3xl border-2 border-blue-100 shadow-sm">
            <p className="text-slate-400 font-black uppercase text-xs tracking-widest mb-1">Total Rainfall</p>
            <p className="text-3xl font-black text-blue-500">{totalRain.toFixed(1)} <span className="text-lg">mm</span></p>
          </div>

          <motion.div 
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ repeat: Infinity, duration: 2, repeatType: "reverse" }}
            className="bg-blue-600 p-8 rounded-[2rem] shadow-xl border-4 border-blue-700 text-center"
          >
            <p className="text-blue-100 font-black uppercase text-xs tracking-widest mb-1">Grand Total Volume</p>
            <p className="text-4xl font-black text-white">{volumeLiters.toFixed(0)} <span className="text-xl">Liters</span></p>
          </motion.div>
        </div>

        {/* Middle: Daily Breakdown */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-xl overflow-hidden flex flex-col">
          <h3 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" /> Daily Flush Breakdown
          </h3>
          
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar max-h-[300px]">
            {rain.length === 0 ? (
              <p className="text-slate-400 font-bold text-center py-10">No rain data to calculate!</p>
            ) : (
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-slate-400 uppercase text-[10px] font-black tracking-widest">
                    <th className="px-4 pb-1">Date</th>
                    <th className="px-4 pb-1 text-right">Rain</th>
                    <th className="px-4 pb-1 text-right">Flushes</th>
                    <th className="px-4 pb-1 text-right">Elephants</th>
                  </tr>
                </thead>
                <tbody>
                  {rain.map((entry) => {
                    const dailyVolume = totalArea * entry.mm;
                    const dailyFlushes = Math.floor(dailyVolume / 12);
                    const dailyElephants = (dailyVolume / 6000).toFixed(3);
                    return (
                      <tr key={entry.id} className="bg-slate-50 rounded-xl">
                        <td className="p-3 rounded-l-xl font-bold text-slate-600 text-sm">
                          {new Date(entry.date).toLocaleDateString()}
                        </td>
                        <td className="p-3 font-bold text-blue-500 text-right text-sm">
                          {entry.mm.toFixed(1)} mm
                        </td>
                        <td className="p-3 font-black text-green-600 text-right text-base">
                          {dailyFlushes} <span className="text-[10px] font-bold text-slate-400">🚽</span>
                        </td>
                        <td className="p-3 rounded-r-xl font-black text-slate-700 text-right text-base">
                          {dailyElephants} <span className="text-[10px] font-bold text-slate-400">🐘</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* The Big Reveal */}
      <div className="w-full bg-white rounded-[3rem] shadow-2xl p-8 md:p-12 border-t-[12px] border-green-400 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 opacity-50" />
        
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <div className="flex flex-col gap-8 text-center">
            <div>
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="text-8xl leading-none mb-4"
              >
                🚽
              </motion.div>
              <h3 className="text-5xl md:text-7xl font-black text-slate-800 tracking-tighter">
                {totalFlushes.toLocaleString()} <span className="text-2xl md:text-3xl text-slate-400 block mt-2">Total Flushes!</span>
              </h3>
            </div>

            <div className="pt-4 border-t-2 border-slate-100 border-dashed">
              <motion.div 
                animate={{ x: [-5, 5, -5] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="text-8xl leading-none mb-4"
              >
                🐘
              </motion.div>
              <h3 className="text-5xl md:text-7xl font-black text-slate-800 tracking-tighter">
                {totalElephants} <span className="text-2xl md:text-3xl text-slate-400 block mt-2">African Elephants!</span>
              </h3>
              <p className="text-xs font-bold text-slate-400 mt-1">(That's {volumeLiters.toLocaleString()}kg of water!)</p>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex-1 p-8 rounded-[2rem] border-4 text-center ${comedy.color}`}
          >
            <span className="text-6xl block mb-3">{comedy.emoji}</span>
            <h4 className="text-2xl font-black mb-2">{comedy.title}</h4>
            <p className="text-lg font-bold opacity-90 leading-relaxed">{comedy.msg}</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
