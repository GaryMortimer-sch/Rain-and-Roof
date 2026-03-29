import React, { useState } from 'react';
import { Roof, RainEntry } from '@/src/types';
import { FileSpreadsheet, Download, Copy, AlertTriangle, CheckCircle2, Maximize2, CloudRain } from 'lucide-react';
import { motion } from 'motion/react';

interface DataSheetsProps {
  roofs: Roof[];
  rain: RainEntry[];
}

export default function DataSheets({ roofs, rain }: DataSheetsProps) {
  const [showCopyMsg, setShowCopyMsg] = useState(false);

  const downloadCSV = (csvStr: string, filename: string) => {
    const blob = new Blob([csvStr], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadRoofCSV = () => {
    let csv = "Building Name,Area (m2),Shape\n";
    roofs.forEach(r => csv += `"${r.name}",${r.area},${r.shape}\n`);
    downloadCSV(csv, "roof_data.csv");
  };

  const downloadRainCSV = () => {
    const totalArea = roofs.reduce((sum, r) => sum + r.area, 0);
    let csv = "Date,Rainfall (mm),Volume (L),Flushes,Elephants\n";
    rain.forEach(r => {
      const volume = totalArea * r.mm;
      const flushes = Math.floor(volume / 12);
      const elephants = (volume / 6000).toFixed(3);
      csv += `${r.date},${r.mm},${volume.toFixed(1)},${flushes},${elephants}\n`;
    });
    downloadCSV(csv, "rainfall_data.csv");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="bg-purple-50 p-10 rounded-[2.5rem] border-4 border-purple-200 shadow-sm">
        <div className="flex items-center gap-5 mb-8">
          <div className="bg-purple-500 p-4 rounded-2xl shadow-lg">
            <FileSpreadsheet className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-black text-purple-800">Google Sheets Master Data</h2>
        </div>
        
        <div className="bg-white p-8 rounded-3xl shadow-sm mb-8 border-l-[12px] border-purple-500">
          <h3 className="text-2xl font-black text-slate-800 mb-4">Teacher & Student Instructions:</h3>
          <p className="text-lg text-slate-600 leading-relaxed font-medium">
            This app calculates data on your device. To combine data from the whole class, you need to use the <b>Master Google Sheets</b>!
          </p>
          
          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-3 bg-red-50 p-4 rounded-2xl border-2 border-red-100">
              <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
              <p className="text-red-700 font-bold">
                REMINDER: Always make a COPY of the master sheet so you don't overwrite others!
              </p>
            </div>
            
            <ul className="space-y-3 text-slate-600 font-bold ml-2">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-purple-400" /> 
                Go to "File &gt; Make a copy" in Google Sheets.
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-purple-400" /> 
                Download your data below and paste it into your copied sheet.
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button 
            onClick={() => setShowCopyMsg(true)}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black py-5 px-8 rounded-2xl text-xl shadow-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3"
          >
            <Copy className="w-6 h-6" /> Open Master Sheet Template
          </button>
        </div>
        
        {showCopyMsg && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-6 bg-yellow-100 border-l-8 border-yellow-500 text-yellow-800 font-bold rounded-2xl shadow-inner"
          >
            Teacher: Add your actual Google Sheet link in the code here!
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[2.5rem] border-2 border-orange-100 shadow-xl text-center group hover:border-orange-300 transition-colors">
          <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
            <Maximize2 className="w-10 h-10 text-orange-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-3">Export Roof Data</h3>
          <p className="text-slate-500 font-medium mb-8">Download a CSV file of the roofs you measured to paste into Google Sheets.</p>
          <button 
            onClick={downloadRoofCSV}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" /> Download Roof CSV
          </button>
        </div>
        
        <div className="bg-white p-10 rounded-[2.5rem] border-2 border-blue-100 shadow-xl text-center group hover:border-blue-300 transition-colors">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
            <CloudRain className="w-10 h-10 text-blue-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 mb-3">Export Rain Data</h3>
          <p className="text-slate-500 font-medium mb-8">Download a CSV file of your recorded rainfall to paste into Google Sheets.</p>
          <button 
            onClick={downloadRainCSV}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" /> Download Rain CSV
          </button>
        </div>
      </div>
    </div>
  );
}
