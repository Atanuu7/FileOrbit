import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, File as FileIcon, Copy, CheckCircle2, Loader2, Lock, X, ChevronRight } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/files';

const UploadBox = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [password, setPassword] = useState('');
  const [maxDownloads, setMaxDownloads] = useState(3);
  const [showSettings, setShowSettings] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [shortCode, setShortCode] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setError('');
      setShortCode(null);

      if (selectedFile.type.startsWith('image/')) {
        const objectUrl = URL.createObjectURL(selectedFile);
        setPreview(objectUrl);
      } else {
        setPreview(null);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    maxSize: 50 * 1024 * 1024,
    multiple: false
  });

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    if (password) {
      formData.append('password', password);
    }
    formData.append('maxDownloads', maxDownloads);
    formData.append('expiresIn', 10);

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setShortCode(response.data.code);
      setExpiresAt(response.data.expiresAt);
      setFile(null);
      setPreview(null);
      setPassword('');
      setMaxDownloads(3);
      setShowSettings(false);
      toast.success('File uploaded successfully!');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to upload file';
      setError(msg);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortCode);
    setCopied(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareUrl = `${window.location.origin}?code=${shortCode}`;

  if (shortCode) {
    return (
      <div className="flex flex-col items-center animate-fade-in text-center font-mono">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>
          <CheckCircle2 className="relative w-16 h-16 text-primary drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
        </div>
        
        <h2 className="text-xl font-bold mb-1 uppercase tracking-widest text-glow">Relay Established</h2>
        <p className="text-[10px] text-primary/60 mb-6 uppercase tracking-[0.3em]">Temporal link active until {new Date(expiresAt).toLocaleTimeString()}</p>

        <div className="bg-white p-4 rounded-lg mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)] group transition-transform hover:scale-105">
          <QRCodeCanvas value={shareUrl} size={120} />
        </div>

        <div className="bg-black/60 border border-primary/30 p-5 rounded-xl w-full mb-6 relative overflow-hidden group">
            <div className="flex-1 text-center py-6 bg-input rounded-xl border border-primary/20 shadow-inner">
              <p className="text-[10px] text-primary/60 uppercase tracking-widest mb-2 font-mono">Uplink_Identity_Code</p>
              <p className="text-4xl md:text-5xl font-bold text-primary dark:text-white tracking-[0.2em] font-mono">{shortCode}</p>
            </div>
            
            <button 
              className="flex items-center justify-center gap-3 w-full py-5 mt-4 rounded-xl bg-primary text-white transition-all duration-500 font-bold uppercase tracking-widest text-sm group shadow-lg hover:shadow-primary/20"
              onClick={copyToClipboard}
            >
              <span className="group-hover:scale-110 transition-transform">{copied ? 'Code_Copied' : 'Clone_Link_To_Clipboard'}</span>
            </button>
        </div>

        <button 
          className="text-[10px] text-gray-500 hover:text-primary mt-8 uppercase tracking-[0.4em] transition-all"
          onClick={() => setShortCode(null)}
        >
          [ New_Session ]
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col animate-fade-in font-sans">
      {!file ? (
        <div 
          {...getRootProps()} 
          className={`relative border border-primary/20 rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-500 overflow-hidden ${isDragActive ? 'bg-primary/10 border-primary scale-[1.02]' : 'bg-input hover:border-primary/40'}`}
        >
          <div className="absolute top-2 left-2 text-[8px] font-mono text-primary/40 uppercase tracking-tighter">Node.Relay_Ready</div>
          <div className="absolute bottom-2 right-2 text-[8px] font-mono text-primary/40 uppercase tracking-tighter">Encryption.AES_256</div>
          
          <input {...getInputProps()} />
          <div className="relative group">
            <div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/40 transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
            <UploadCloud className={`relative w-12 h-12 mb-4 transition-all duration-500 ${isDragActive ? 'text-primary scale-110' : 'text-primary/60'}`} />
          </div>
          <h3 className="text-lg font-mono font-bold text-white mb-1 uppercase tracking-tight">Initialize Upload</h3>
          <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">Select file or stream data</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-input border border-primary/30 rounded-xl group relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
            {preview ? (
              <img src={preview} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-white/10 shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
            ) : (
              <FileIcon className="w-10 h-10 text-primary flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-primary/60 uppercase tracking-tighter mb-1">Source_Data:</p>
              <p className="text-sm font-bold text-primary dark:text-white truncate">{file.name}</p>
              <p className="text-[10px] font-mono text-gray-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
            <button 
              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
              onClick={() => { setFile(null); setPreview(null); }}
              disabled={uploading}
            >
              <X size={18} />
            </button>
          </div>

          {/* Max Downloads Selector - Moved out of settings */}
          <div className="p-4 bg-input border border-white/10 rounded-xl space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-primary/60 uppercase tracking-widest font-mono">Max_Downloads</label>
              <span className="text-sm font-mono text-primary">{maxDownloads} / 10</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="10" 
              step="1"
              className="w-full cursor-pointer accent-primary"
              value={maxDownloads}
              onChange={(e) => setMaxDownloads(e.target.value)}
            />
            <div className="flex justify-between text-[8px] text-gray-500 font-mono uppercase tracking-tighter pt-1">
              <span>Auto-Destruct Policy</span>
              <span>Fixed Expiry: 10m</span>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="p-4 bg-input border border-white/10 rounded-xl">
            <button 
              className="flex items-center justify-between text-sm text-gray-300 hover:text-primary transition-colors w-full"
              onClick={() => setShowSettings(!showSettings)}
            >
              <div className="flex items-center gap-2">
                <Lock size={14} className={password ? "text-primary" : ""} />
                <span className="font-mono text-xs uppercase tracking-wider">Security Settings</span>
              </div>
              <ChevronRight size={14} className={`transition-transform ${showSettings ? 'rotate-90' : ''}`} />
            </button>
            
            {showSettings && (
              <div className="space-y-4 pt-4 border-t border-white/5 animate-slide-up mt-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-primary/60 uppercase tracking-widest font-mono">Encryption_Passkey</label>
                    <span className="text-[8px] text-gray-500 font-mono italic">Optional</span>
                  </div>
                  <input 
                    type="password" 
                    placeholder="ENTER_PASSWORD" 
                    className="w-full bg-input border border-primary/20 rounded-lg px-4 py-3 text-sm text-primary dark:text-white font-mono focus:outline-none focus:border-primary transition-all placeholder:text-gray-500"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {error && <div className="text-red-500 text-[10px] font-mono uppercase mt-4 text-center bg-red-500/10 py-3 rounded-lg border border-red-500/20 tracking-widest">{error}</div>}

      <button 
        className={`group flex items-center justify-center gap-3 w-full py-5 mt-6 rounded-xl font-mono font-bold uppercase tracking-[0.2em] text-sm transition-all duration-500 border-none ${!file || uploading ? 'bg-white/5 text-gray-600 cursor-not-allowed' : 'bg-primary text-white hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] hover:-translate-y-1'}`}
        onClick={handleUpload} 
        disabled={!file || uploading}
      >
        {uploading ? (
          <><Loader2 size={18} className="animate-spin" /> Uplinking...</>
        ) : (
          <><UploadCloud size={18} className="group-hover:scale-110 transition-transform" /> Start_Transfer</>
        )}
      </button>
    </div>
  );
};

export default UploadBox;
