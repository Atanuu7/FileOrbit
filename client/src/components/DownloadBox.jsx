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

  const handleDownload = async () => {
    if (!fileData) return;
    
    setLoading(true);
    const toastId = toast.loading('Preparing download...');

    try {
      // Fetching as blob is the most reliable way to force download for all file types (PDF, etc)
      const response = await axios.get(fileData.url, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileData.originalName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Download started!', { id: toastId });
    } catch (err) {
      console.error('Download error:', err);
      // Fallback for CORS or other issues
      let downloadUrl = fileData.url;
      if (downloadUrl.includes('cloudinary.com')) {
        downloadUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
      }
      window.open(downloadUrl, '_blank');
      toast.error('Download failed. Trying alternative method...', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col animate-fade-in font-mono">
      {!fileData ? (
        <form onSubmit={handleFetch} className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label htmlFor="code" className="text-[10px] text-primary/60 uppercase tracking-[0.2em]">Input Access Code</label>
              <div className="text-[8px] text-primary/40 animate-pulse">Waiting for signal...</div>
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
                <Lock size={12} className="text-primary" /> Security Override Required
              </label>
              <input
                id="password"
                type="password"
                className="w-full bg-input border border-primary/20 rounded-xl px-4 py-4 text-primary font-mono text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="ENTER PASSWORD"
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
              <><Loader2 size={18} className="animate-spin" /> SCANNING NODE...</>
            ) : (
              <>ESTABLISH LINK <ChevronRight size={18} className="group-hover:translate-x-2 transition-transform" /></>
            )}
          </button>
        </form>
      ) : (
        <div className="flex flex-col animate-fade-in">
          <div className="flex flex-col items-center gap-4 p-6 bg-input border border-primary/30 rounded-xl mb-6 relative overflow-hidden group text-center shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
            <div className="absolute top-0 left-0 w-full h-1 bg-primary shadow-[0_0_15px_rgba(99,102,241,1)]"></div>
            
            {fileData.originalName.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
              <div className="w-full h-48 md:h-64 rounded-lg overflow-hidden border border-primary/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <img src={fileData.url} alt="Preview" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            ) : (
              <div className="w-full h-48 md:h-64 rounded-lg bg-primary/5 flex items-center justify-center border border-primary/20 shadow-inner">
                <FileIcon className="w-24 h-24 text-primary drop-shadow-[0_0_15px_rgba(99,102,241,0.4)]" />
              </div>
            )}
            
            <div className="w-full flex flex-col items-center mt-2 px-2 min-w-0">
              <p className="text-[10px] text-primary/60 uppercase tracking-widest mb-2 font-mono">Resource Preview</p>
              <p className="text-lg font-bold text-white truncate w-full font-sans" title={fileData.originalName}>{fileData.originalName}</p>
              <p className="text-xs text-gray-400 font-mono mt-1">{(fileData.size / (1024 * 1024)).toFixed(2)} MB // Ready</p>
            </div>
          </div>

          <button 
            className="flex items-center justify-center gap-3 w-full py-5 rounded-xl font-bold bg-white text-black hover:bg-primary hover:text-white transition-all duration-500 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:-translate-y-1 uppercase tracking-widest text-sm group"
            onClick={handleDownload}
          >
            <Download size={18} className="group-hover:translate-y-0.5 transition-transform" /> Download File
          </button>

          <button 
            className="text-[10px] text-gray-500 hover:text-primary mt-8 uppercase tracking-[0.4em] transition-all text-center"
            onClick={() => { setFileData(null); setPassword(''); setRequirePassword(false); }}
          >
            [ Reset Link ]
          </button>
        </div>
      )}
    </div>
  );
};

export default DownloadBox;
