import { useState, useEffect } from 'react';
import { Upload, Download, Orbit } from 'lucide-react';
import UploadBox from './components/UploadBox';
import DownloadBox from './components/DownloadBox';
import { Toaster } from 'react-hot-toast';

function App() {
  const [activeTab, setActiveTab] = useState('upload');

  useEffect(() => {
    document.documentElement.className = 'dark';
  }, []);

  // Check URL for code parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setActiveTab('download');
    }
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col items-center p-4 overflow-x-visible">
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#171717', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' } }} />
      {/* Futuristic HUD Elements */}
      <div className="absolute top-10 left-10 w-20 h-20 border-t-2 border-l-2 border-primary/30 rounded-tl-3xl pointer-events-none opacity-50"></div>
      <div className="absolute top-10 right-10 w-20 h-20 border-t-2 border-r-2 border-primary/30 rounded-tr-3xl pointer-events-none opacity-50"></div>
      <div className="absolute bottom-10 left-10 w-20 h-20 border-b-2 border-l-2 border-primary/30 rounded-bl-3xl pointer-events-none opacity-50"></div>
      <div className="absolute bottom-10 right-10 w-20 h-20 border-b-2 border-r-2 border-primary/30 rounded-br-3xl pointer-events-none opacity-50"></div>
      
      <div className="absolute top-1/2 left-4 -translate-y-1/2 vertical-text hidden lg:block">
        <span className="text-[10px] font-mono tracking-[0.5em] text-primary/40 uppercase rotate-180" style={{ writingMode: 'vertical-rl' }}>
          System.status: Operational // Syncing.Data
        </span>
      </div>

      {/* Animated Background blobs */}
      <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] bg-primary/20 blur-[120px] rounded-full animate-pulse-slow"></div>
      <div className="absolute bottom-[20%] right-[10%] w-[30vw] h-[30vw] bg-accent/20 blur-[120px] rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

      {/* Header */}
      <header className="w-full max-w-5xl flex justify-center items-center py-6 z-10 px-4">
        <div className="flex items-center gap-2 text-2xl font-bold tracking-normal font-mono uppercase">
          <Orbit className="text-primary w-8 h-8 drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
          <span className="text-glow whitespace-nowrap">FileOrbit</span>
          <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded ml-2 border border-primary/20">V2.0</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center w-full z-10 pb-8 overflow-visible">
        <div className="flex flex-col items-center text-center max-w-4xl mb-8 animate-fade-in px-4 overflow-visible">
          <div className="inline-block px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-mono text-primary uppercase tracking-[0.2em] mb-4">
            Encrypted Data Transfer Protocol
          </div>
          <h1 className="text-4xl md:text-7xl font-bold mb-4 tracking-tight font-mono uppercase cursor-default pb-2">
            File<span className="text-gradient">Orbit</span>
          </h1>
          <p className="text-sm md:text-base text-gray-400 font-light max-w-lg mx-auto leading-relaxed py-2">
            Secure, ephemeral file sharing. <span className="text-primary font-bold">No login required.</span> Absolute privacy.
          </p>
        </div>

        <div className="glass-card w-full max-w-md p-6 animate-slide-up shadow-2xl">
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-input rounded-xl mb-6 border border-white/10 shadow-inner">
            <button 
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-300 ${activeTab === 'upload' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 dark:text-gray-500 hover:text-primary'}`}
              onClick={() => setActiveTab('upload')}
            >
              <Upload size={16} /> <span className="uppercase tracking-widest">Send</span>
            </button>
            <button 
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-300 ${activeTab === 'download' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 dark:text-gray-500 hover:text-primary'}`}
              onClick={() => setActiveTab('download')}
            >
              <Download size={16} /> <span className="uppercase tracking-widest">Receive</span>
            </button>
          </div>

          <div>
            {activeTab === 'upload' ? <UploadBox /> : <DownloadBox />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
