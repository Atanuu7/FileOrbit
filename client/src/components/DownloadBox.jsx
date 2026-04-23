import { useState, useEffect } from 'react';
import { Download, File as FileIcon, Loader2, Lock, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/files';

const DownloadBox = () => {
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [requirePassword, setRequirePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileData, setFileData] = useState(null);

  // Read URL parameter on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('code');
    if (urlCode) {
      setCode(urlCode);
    }
  }, []);

  const handleFetch = async (e) => {
    e.preventDefault();
    if (!code || code.length < 5) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/${code}`, { password });
      setFileData(response.data);
      setRequirePassword(false);
      toast.success('File found!');
    } catch (err) {
      if (err.response?.data?.requirePassword) {
        setRequirePassword(true);
        const msg = err.response.data.error || 'Password required';
        setError(msg);
        toast.error(msg);
      } else {
        const msg = err.response?.data?.error || 'Invalid code or file expired';
        setError(msg);
        toast.error(msg);
      }
      setFileData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!fileData) return;
    toast.success('Starting download...');
    const link = document.createElement('a');
    link.href = fileData.url;
    link.setAttribute('download', fileData.originalName);
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col animate-fade-in font-mono">
      {!fileData ? (
        <form onSubmit={handleFetch} className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="code" className="text-[10px] text-primary/60 uppercase tracking-[0.2em]">Input_Access_Code</label>
              <div className="text-[8px] text-primary/40 animate-pulse">Waiting.For.Signal...</div>
            </div>
            <input
              id="code"
              type="text"
              className="w-full bg-input border border-primary/20 rounded-xl px-4 py-5 text-center font-mono text-4xl font-bold tracking-[0.3em] text-primary focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-[inset_0_0_20px_rgba(0,0,0,0.1)] placeholder:text-gray-500"
              placeholder="000000"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={loading}
              autoComplete="off"
            />
          </div>

          {requirePassword && (
            <div className="space-y-3 animate-slide-up">
              <label htmlFor="password" className="text-[10px] text-primary/60 uppercase tracking-[0.2em] flex items-center gap-2">
                <Lock size={12} className="text-primary" /> Security_Override_Required
              </label>
              <input
                id="password"
                type="password"
                className="w-full bg-input border border-primary/20 rounded-xl px-4 py-4 text-primary font-mono text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="ENTER_PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          )}

          {error && <div className="text-red-500 text-[10px] uppercase tracking-widest text-center bg-red-500/10 py-3 rounded-lg border border-red-500/20">{error}</div>}

          <button 
            type="submit" 
            className={`group flex items-center justify-center gap-3 w-full py-5 rounded-xl font-mono font-bold uppercase tracking-[0.2em] text-sm transition-all duration-500 border-none ${code.length < 5 || loading ? 'bg-white/5 text-gray-600 cursor-not-allowed' : 'bg-primary text-white hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:-translate-y-1'}`}
            disabled={code.length < 5 || loading}
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> SCANNING_NODE...</>
            ) : (
              <>ESTABLISH_LINK <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" /></>
            )}
          </button>
        </form>
      ) : (
        <div className="flex flex-col animate-fade-in">
          <div className="flex items-center gap-4 p-5 bg-input border border-primary/30 rounded-xl mb-6 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary shadow-[0_0_15px_rgba(16,185,129,1)]"></div>
            {fileData.originalName.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
              <img src={fileData.url} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-primary/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]" />
            ) : (
              <FileIcon className="w-12 h-12 text-primary flex-shrink-0 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-primary/60 uppercase tracking-tighter mb-1 font-mono">Linked_Resource:</p>
              <p className="text-base font-bold text-primary dark:text-white truncate font-sans">{fileData.originalName}</p>
              <p className="text-[10px] text-gray-500 font-mono">{(fileData.size / (1024 * 1024)).toFixed(2)} MB // Verified</p>
            </div>
          </div>

          <button 
            className="flex items-center justify-center gap-3 w-full py-5 rounded-xl font-bold bg-white text-black hover:bg-primary hover:text-white transition-all duration-500 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:-translate-y-1 uppercase tracking-widest text-sm group"
            onClick={handleDownload}
          >
            <Download size={18} className="group-hover:translate-y-0.5 transition-transform" /> Pull_Data_Stream
          </button>

          <button 
            className="text-[10px] text-gray-500 hover:text-primary mt-8 uppercase tracking-[0.4em] transition-all text-center"
            onClick={() => { setFileData(null); setPassword(''); setRequirePassword(false); }}
          >
            [ Reset_Link ]
          </button>
        </div>
      )}
    </div>
  );
};

export default DownloadBox;
