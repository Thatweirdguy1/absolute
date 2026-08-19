'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle, AlertTriangle, XCircle, ArrowRight, Save, Loader2, Play } from 'lucide-react';

export default function ImportStudioPage() {
  const [stage, setStage] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  };

  const nextStage = () => setStage(prev => Math.min(prev + 1, 5));
  const prevStage = () => setStage(prev => Math.max(prev - 1, 1));

  const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="min-h-screen bg-ink-900 text-gray-100 font-sans p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-black mb-2 tracking-tight text-white">Import Studio</h1>
        <p className="text-gray-400 mb-8">Bring your cinematic history into Absolute.</p>
        
        {/* Progress Tracker */}
        <div className="flex space-x-2 mb-12">
          {['Upload', 'Preview', 'Matching', 'Confirmation', 'Complete'].map((label, idx) => (
            <div key={label} className="flex-1">
              <div className={`h-2 rounded-full ${stage > idx ? 'bg-purple-500' : 'bg-ink-800'}`} />
              <p className={`text-xs mt-2 ${stage === idx + 1 ? 'text-purple-400 font-bold' : 'text-gray-500'}`}>{label}</p>
            </div>
          ))}
        </div>

        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {stage === 1 && (
              <motion.div key="stage1" variants={variants} initial="initial" animate="animate" exit="exit" className="bg-ink-950 p-8 rounded-xl border border-ink-800 shadow-2xl">
                <h2 className="text-2xl font-bold mb-6 text-white">1. Upload your data</h2>
                <div 
                  className="border-2 border-dashed border-ink-700 hover:border-purple-400 bg-ink-900/50 rounded-lg p-12 flex flex-col items-center justify-center transition-colors cursor-pointer group"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                      const { open } = await import('@tauri-apps/plugin-dialog');
                      const selected = await open({
                        multiple: false,
                        filters: [{ name: 'Letterboxd Export', extensions: ['csv', 'zip'] }]
                      });
                      
                      if (selected) {
                        const filePath = Array.isArray(selected) ? selected[0] : selected;
                        setFiles([{ name: filePath.split(/[\\/]/).pop() || filePath, path: filePath, size: 0 } as any]);
                      }
                    } catch (err) {
                      console.log("Error opening dialog", err);
                      document.getElementById('fileUpload')?.click();
                    }
                  }}
                >
                  <UploadCloud className="w-16 h-16 text-gray-500 group-hover:text-purple-400 transition-colors mb-4" />
                  <p className="text-lg mb-2 text-center">Click to select your Letterboxd export ZIP/CSV here</p>
                  <p className="text-sm text-gray-500">Maximum file size: 25MB</p>
                  <input type="file" id="fileUpload" className="hidden" accept=".zip,.csv" onChange={handleFileSelect} onClick={(e) => e.stopPropagation()} />
                </div>

                {files.length > 0 && (
                  <div className="mt-6 space-y-2">
                    {files.map((f: any, i) => (
                      <div key={i} className="flex items-center justify-between bg-ink-900 p-3 rounded text-sm text-gray-300">
                        <span>{f.name}</span>
                        <span>{f.path ? 'Native Path Ready' : 'Missing Path (Use Dialog)'}</span>
                      </div>
                    ))}
                    <button 
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          const { importLetterboxdCsv } = await import('@/lib/tauri-api');
                          const fileObj = files[files.length - 1] as any; // take latest
                          
                          if (!fileObj.path) {
                            alert("Error: Missing native file path. Please click the upload box to use the native file picker instead of drag & drop.");
                            return;
                          }
                          
                          const count = await importLetterboxdCsv(fileObj.path);
                          alert(`Successfully ingested ${count} records natively! Visit dashboard to see updates.`);
                          nextStage();
                        } catch (err) {
                          alert("Import failed: " + err);
                        }
                      }} 
                      className="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded transition-colors flex items-center justify-center cursor-pointer relative z-50"
                    >
                      Process Native Import <ArrowRight className="ml-2 w-5 h-5" />
                    </button>
                  </div>
                )}

                <div className="mt-8 bg-ink-900 p-6 rounded-lg border border-ink-800">
                  <h3 className="font-bold text-lg mb-4 text-purple-300">How to export from Letterboxd</h3>
                  <ol className="list-decimal list-inside space-y-2 text-gray-400">
                    <li>Go to letterboxd.com/settings/data</li>
                    <li>Click 'Export Your Data'</li>
                    <li>Download the ZIP file</li>
                    <li>Upload it here</li>
                  </ol>
                </div>
              </motion.div>
            )}

            {stage === 2 && (
              <motion.div key="stage2" variants={variants} initial="initial" animate="animate" exit="exit" className="bg-ink-950 p-8 rounded-xl border border-ink-800 shadow-2xl">
                <h2 className="text-2xl font-bold mb-6 text-white">2. Preview Data</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-ink-900 p-4 rounded-lg border border-ink-800 text-center">
                    <p className="text-3xl font-black text-purple-400">342</p>
                    <p className="text-sm text-gray-400 uppercase tracking-wider">Diary Entries</p>
                  </div>
                  <div className="bg-ink-900 p-4 rounded-lg border border-ink-800 text-center">
                    <p className="text-3xl font-black text-purple-400">415</p>
                    <p className="text-sm text-gray-400 uppercase tracking-wider">Ratings</p>
                  </div>
                  <div className="bg-ink-900 p-4 rounded-lg border border-ink-800 text-center">
                    <p className="text-3xl font-black text-purple-400">890</p>
                    <p className="text-sm text-gray-400 uppercase tracking-wider">Watched</p>
                  </div>
                  <div className="bg-ink-900 p-4 rounded-lg border border-ink-800 text-center">
                    <p className="text-3xl font-black text-purple-400">120</p>
                    <p className="text-sm text-gray-400 uppercase tracking-wider">Watchlist</p>
                  </div>
                </div>

                <table className="w-full text-left text-sm text-gray-400 mb-8">
                  <thead className="bg-ink-900 text-xs uppercase text-gray-500 border-b border-ink-800">
                    <tr>
                      <th className="px-4 py-3">File</th>
                      <th className="px-4 py-3">Purpose</th>
                      <th className="px-4 py-3">Rows</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-ink-800/50 hover:bg-ink-900/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-300">diary.csv</td>
                      <td className="px-4 py-3">Watch history & reviews</td>
                      <td className="px-4 py-3">342</td>
                      <td className="px-4 py-3 flex justify-end"><CheckCircle className="w-5 h-5 text-green-400" /></td>
                    </tr>
                    <tr className="border-b border-ink-800/50 hover:bg-ink-900/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-300">ratings.csv</td>
                      <td className="px-4 py-3">User ratings</td>
                      <td className="px-4 py-3">415</td>
                      <td className="px-4 py-3 flex justify-end"><CheckCircle className="w-5 h-5 text-green-400" /></td>
                    </tr>
                    <tr className="border-b border-ink-800/50 hover:bg-ink-900/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-300">watchlist.csv</td>
                      <td className="px-4 py-3">To watch</td>
                      <td className="px-4 py-3">120</td>
                      <td className="px-4 py-3 flex justify-end"><CheckCircle className="w-5 h-5 text-green-400" /></td>
                    </tr>
                  </tbody>
                </table>

                <div className="flex justify-between items-center mt-6">
                  <button onClick={prevStage} className="text-gray-400 hover:text-white px-4 py-2 transition-colors">Back</button>
                  <button onClick={nextStage} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-6 rounded transition-colors flex items-center">
                    Continue to Matching <ArrowRight className="ml-2 w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {stage === 3 && (
              <motion.div key="stage3" variants={variants} initial="initial" animate="animate" exit="exit" className="bg-ink-950 p-8 rounded-xl border border-ink-800 shadow-2xl">
                <h2 className="text-2xl font-bold mb-6 text-white">3. Resolving Titles</h2>
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2 text-gray-400">
                    <span>Matching against TMDB...</span>
                    <span>85%</span>
                  </div>
                  <div className="w-full bg-ink-900 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="p-4 bg-ink-900/50 border border-ink-800 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-bold text-green-400 flex items-center"><CheckCircle className="w-4 h-4 mr-2" /> Auto-matched</p>
                      <p className="text-sm text-gray-500 mt-1">840 titles resolved with high confidence</p>
                    </div>
                  </div>
                  <div className="p-4 bg-ink-900/50 border border-orange-900/30 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-bold text-orange-400 flex items-center"><AlertTriangle className="w-4 h-4 mr-2" /> Needs Review</p>
                      <p className="text-sm text-gray-500 mt-1">12 titles have multiple possible matches</p>
                    </div>
                    <button className="px-3 py-1 bg-ink-800 hover:bg-ink-700 text-sm rounded text-white transition-colors">Review</button>
                  </div>
                  <div className="p-4 bg-ink-900/50 border border-red-900/30 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-bold text-red-400 flex items-center"><XCircle className="w-4 h-4 mr-2" /> Unmatched</p>
                      <p className="text-sm text-gray-500 mt-1">3 titles could not be found</p>
                    </div>
                    <button className="px-3 py-1 bg-ink-800 hover:bg-ink-700 text-sm rounded text-white transition-colors">Search</button>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-6">
                  <button onClick={prevStage} className="text-gray-400 hover:text-white px-4 py-2 transition-colors">Back</button>
                  <div className="space-x-3">
                    <button onClick={nextStage} className="text-gray-400 hover:text-white px-4 py-2 text-sm transition-colors">Skip Matching</button>
                    <button onClick={nextStage} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 px-6 rounded transition-colors flex items-center">
                      Confirm Matches <ArrowRight className="ml-2 w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {stage === 4 && (
              <motion.div key="stage4" variants={variants} initial="initial" animate="animate" exit="exit" className="bg-ink-950 p-8 rounded-xl border border-ink-800 shadow-2xl">
                <h2 className="text-2xl font-bold mb-6 text-white">4. Ready to Import</h2>
                <div className="bg-ink-900 p-6 rounded-lg border border-purple-500/30 mb-8">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <Save className="w-5 h-5 mr-2 text-purple-400" /> Final Summary
                  </h3>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex justify-between"><span>Unique Titles to Import:</span> <span className="font-bold text-white">852</span></li>
                    <li className="flex justify-between"><span>Watch Events:</span> <span className="font-bold text-white">342</span></li>
                    <li className="flex justify-between"><span>Ratings to sync:</span> <span className="font-bold text-white">415</span></li>
                    <li className="flex justify-between"><span>Watchlist Items:</span> <span className="font-bold text-white">120</span></li>
                  </ul>
                  <div className="mt-6 p-3 bg-red-900/20 border border-red-900/50 rounded text-sm text-red-200">
                    <AlertTriangle className="w-4 h-4 inline mr-1" /> 3 unmatched items will be skipped and saved to an error log.
                  </div>
                </div>

                <div className="flex justify-between items-center mt-6">
                  <button onClick={prevStage} className="text-gray-400 hover:text-white px-4 py-2 transition-colors">Back</button>
                  <button onClick={nextStage} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded transition-colors flex items-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
                    Start Import <Play className="ml-2 w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {stage === 5 && (
              <motion.div key="stage5" variants={variants} initial="initial" animate="animate" exit="exit" className="bg-ink-950 p-8 rounded-xl border border-ink-800 shadow-2xl text-center">
                <div className="mb-8 flex justify-center">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-ink-800 border-t-purple-500 animate-spin"></div>
                    <CheckCircle className="w-10 h-10 text-purple-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 animate-[fadeIn_0.5s_ease-out_2s_forwards]" />
                  </div>
                </div>
                <h2 className="text-3xl font-black mb-4 text-white">Import Complete!</h2>
                <p className="text-gray-400 mb-8">Your cinematic history has been successfully loaded into Absolute.</p>
                
                <div className="bg-ink-900 p-6 rounded-lg border border-ink-800 mb-8 text-left grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Watched</p>
                    <p className="text-2xl font-bold text-white">852</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Hours</p>
                    <p className="text-2xl font-bold text-white">1,684 h</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Average Rating</p>
                    <p className="text-2xl font-bold text-white">3.8 / 5</p>
                  </div>
                </div>

                <button className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-8 rounded transition-colors w-full">
                  View Your Stats
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
