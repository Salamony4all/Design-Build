
import React, { useState, useEffect } from 'react';
import Viewer3D from './components/Viewer3D';
import { SceneData, SceneConfig } from './types';
import { transformLayoutTo3D, editLayoutImage } from './services/geminiService';
import { Layout, Box, Settings, Image as ImageIcon, Cpu, Edit3, AlertCircle, RefreshCcw } from 'lucide-react';

const getAiStudio = () => (window as any).aistudio;

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'3d' | 'edit'>('3d');
  const [sceneData, setSceneData] = useState<SceneData | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  
  const [config, setConfig] = useState<SceneConfig>({
    ambientIntensity: 0.5,
    pointLightIntensity: 1,
    pointLightPosition: [5, 5, 5],
    cameraPosition: [15, 15, 15],
    showGrid: true,
  });

  useEffect(() => {
    const checkKey = async () => {
      try {
        const aistudio = getAiStudio();
        if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
          const selected = await aistudio.hasSelectedApiKey();
          setHasApiKey(selected);
        } else {
          setHasApiKey(true);
        }
      } catch (e) {
        setHasApiKey(true);
      }
    };
    checkKey();
  }, []);

  const handleOpenKeySelector = async () => {
    const aistudio = getAiStudio();
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      await aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const b64 = event.target?.result as string;
      setOriginalImage(b64);
      const mimeType = file.type;
      const base64Data = b64.split(',')[1];
      
      setIsLoading(true);
      setError(null);
      try {
        const data = await transformLayoutTo3D(base64Data, mimeType);
        setSceneData(data);
      } catch (err: any) {
        console.error("Upload Error:", err);
        if (err.message?.includes("Requested entity was not found") || err.status === 404) {
          setHasApiKey(false);
          setError("Session expired or key invalid. Please select a valid API key from a paid GCP project.");
        } else {
          // Safety: ensure error is a string to prevent Error #31
          setError(String(err.message || "Failed to process image. The model might be busy, please try again."));
        }
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEditImage = async () => {
    if (!originalImage || !editPrompt) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const mimeType = originalImage.split(';')[0].split(':')[1];
      const base64Data = originalImage.split(',')[1];
      const result = await editLayoutImage(base64Data, mimeType, editPrompt);
      setOriginalImage(result);
      
      const resultBase64 = result.split(',')[1];
      const data = await transformLayoutTo3D(resultBase64, "image/png");
      setSceneData(data);
    } catch (err: any) {
      console.error("Edit Error:", err);
      setError(String(err.message || "Failed to edit image."));
    } finally {
      setIsLoading(false);
    }
  };

  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
          <Cpu className="w-16 h-16 text-blue-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-4">Gemini 3D Architect</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Architectural analysis requires Gemini 3 series models. Please select a paid API key to continue.
            <br />
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-sm block mt-2">
              Billing Docs
            </a>
          </p>
          <button
            onClick={handleOpenKeySelector}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <Settings className="w-5 h-5" />
            Select API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <div className="w-80 border-r border-slate-800 flex flex-col bg-slate-900 shadow-xl z-20">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-1">
            <Layout className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-bold text-white tracking-tight">3D Architect</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium tracking-widest uppercase">AI Layout Engine</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-bold text-slate-500 mb-2 block tracking-widest uppercase">Upload Plan</span>
              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={isLoading}
                />
                <label
                  htmlFor="file-upload"
                  className={`flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-xl p-6 cursor-pointer hover:border-blue-500 hover:bg-slate-800/50 transition-all ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <ImageIcon className="w-8 h-8 text-slate-500 mb-2 group-hover:text-blue-400 transition-colors" />
                  <span className="text-sm text-slate-400 group-hover:text-slate-300">Choose layout image</span>
                </label>
              </div>
            </label>

            {originalImage && (
              <div className="space-y-3">
                 <span className="text-xs font-bold text-slate-500 block tracking-widest uppercase">Current Reference</span>
                 <div className="rounded-lg overflow-hidden border border-slate-700 bg-slate-800/50 p-2">
                   <img src={originalImage} alt="Layout" className="w-full h-auto max-h-40 object-contain rounded" />
                 </div>
              </div>
            )}
          </div>

          {activeTab === 'edit' && (
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-slate-500 mb-2 block tracking-widest uppercase">Modify with AI</span>
                <textarea
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="e.g. Add a kitchen island"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none shadow-inner"
                />
              </label>
              <button
                onClick={handleEditImage}
                disabled={isLoading || !editPrompt}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Edit3 className="w-4 h-4" />}
                REGENERATE
              </button>
            </div>
          )}

          <div className="space-y-4">
             <span className="text-xs font-bold text-slate-500 block border-b border-slate-800 pb-2 tracking-widest uppercase">Rendering</span>
             <div className="space-y-4">
               <div>
                 <div className="flex justify-between text-xs text-slate-500 mb-2 font-medium">
                   <span>Exposure</span>
                   <span>{(config.ambientIntensity * 100).toFixed(0)}%</span>
                 </div>
                 <input
                   type="range" min="0" max="1" step="0.1"
                   value={config.ambientIntensity}
                   onChange={(e) => setConfig({ ...config, ambientIntensity: parseFloat(e.target.value) })}
                   className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                 />
               </div>
               <div className="flex items-center justify-between">
                 <span className="text-xs font-medium text-slate-400">Environment Grid</span>
                 <button
                   onClick={() => setConfig({ ...config, showGrid: !config.showGrid })}
                   className={`w-10 h-5 rounded-full transition-colors relative ${config.showGrid ? 'bg-blue-600' : 'bg-slate-700'}`}
                 >
                   <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${config.showGrid ? 'left-6' : 'left-1'}`} />
                 </button>
               </div>
             </div>
          </div>
        </div>

        {error && (
          <div className="m-4 p-4 bg-red-950/40 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
            <div className="text-xs">
              <p className="font-bold mb-1 uppercase">Analysis Failed</p>
              {String(error)}
            </div>
          </div>
        )}

        <div className="p-4 border-t border-slate-800 flex gap-2 bg-slate-900/80 backdrop-blur-sm">
          <button
             onClick={() => setActiveTab('3d')}
             className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === '3d' ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-500'}`}
          >
            <Box className="w-4 h-4" /> 3D VIEW
          </button>
          <button
             onClick={() => setActiveTab('edit')}
             className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'edit' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-800 text-slate-500'}`}
          >
            <ImageIcon className="w-4 h-4" /> EDITING
          </button>
        </div>
      </div>

      <div className="flex-1 relative bg-[#0a0a0f]">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-lg">
            <div className="flex flex-col items-center gap-6 p-10 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl animate-pulse">
              <div className="w-24 h-24 border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-xl font-bold text-white tracking-tight">Architectural Deep Analysis...</p>
                <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest">Constructing 3D Geometry</p>
              </div>
            </div>
          </div>
        )}
        <Viewer3D sceneData={sceneData} config={config} />
      </div>
    </div>
  );
};

export default App;
