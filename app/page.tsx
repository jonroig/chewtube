'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, AlertTriangle, Film, MonitorPlay, Youtube, Video } from 'lucide-react';
import Script from 'next/script';

const SAFE_PRESETS = [
  { name: "Big Buck Bunny", id: "aqz-KE-bpKQ" },
  { name: "Minions Clip", id: "P9-FCC6I7u0" },
  { name: "Nature 4K", id: "L_jWHffIx5E" }, 
  { name: "Lofi Girl (Live)", id: "jfKfPfyJRdk" }
];

const LOCAL_VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

// Helper: Load Scripts Dynamically
const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
};

export default function ChewTubePage() {
  const [isStarted, setIsStarted] = useState(false);
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=aqz-KE-bpKQ'); 
  const [videoId, setVideoId] = useState('aqz-KE-bpKQ');
  const [status, setStatus] = useState<'waiting' | 'eating' | 'paused'>('waiting');
  const [fuel, setFuel] = useState(0);
  const [debugMode, setDebugMode] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playerMode, setPlayerMode] = useState<'youtube' | 'local'>('local');
  const [videoError, setVideoError] = useState<string | null>(null);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);
  
  // Configuration
  const [sensitivity, setSensitivity] = useState(5);
  const [decayRate, setDecayRate] = useState(1.5);
  const [fuelPerBite, setFuelPerBite] = useState(30);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const fuelRef = useRef(0);
  const lastMouthOpenRef = useRef(false);
  const cameraRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [useDirectIframe, setUseDirectIframe] = useState(false);

  const handleScriptsLoad = () => {
    setScriptsLoaded(true);
  };

  useEffect(() => {
    if (!scriptsLoaded) return;

    window.onYouTubeIframeAPIReady = () => {
      if (playerMode === 'youtube') createPlayer(videoId);
    };

    const init = async () => {
      try {
        if (playerMode === 'youtube') {
          if (!window.YT) {
            await loadScript('https://www.youtube.com/iframe_api');
          } else {
            createPlayer(videoId);
          }
        }
        await initializeFaceMesh();
      } catch (err) {
        console.error("Initialization error:", err);
        setError("Failed to load libraries. Check internet connection.");
      }
    };
    init();

    return () => {
      if (cameraRef.current && cameraRef.current.stop) {
        // Optional cleanup
      }
      if (youtubePlayerRef.current && youtubePlayerRef.current.destroy) {
        try { youtubePlayerRef.current.destroy(); youtubePlayerRef.current = null; } catch(e) {}
      }
    };
  }, [playerMode, scriptsLoaded]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setVideoUrl(url);
    setVideoError(null); 
    setPlayerMode('youtube');

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      loadVideoById(match[2]);
    }
  };

  const loadVideoById = (id: string) => {
    setVideoId(id);
    setVideoError(null);
    if (useDirectIframe && iframeRef.current) {
      iframeRef.current.src = `https://www.youtube.com/embed/${id}?enablejsapi=1&playsinline=1&controls=1&rel=0&modestbranding=1`;
    } else if (youtubePlayerRef.current && youtubePlayerRef.current.loadVideoById) {
      youtubePlayerRef.current.loadVideoById(id);
      youtubePlayerRef.current.pauseVideo();
    }
  };

  const createPlayer = (id: string) => {
    if (playerMode !== 'youtube') return;
    if (youtubePlayerRef.current) return;

    const rawOrigin = window.location.origin;
    const hasValidOrigin = rawOrigin && rawOrigin !== 'null' && rawOrigin !== 'file://' && !rawOrigin.startsWith('file://');
    
    if (!hasValidOrigin) {
      setUseDirectIframe(true);
      return;
    }

    if (window.YT && window.YT.Player) {
      try {
        const playerVars = {
          'playsinline': 1,
          'controls': 1,
          'host': 'https://www.youtube.com',
          'enablejsapi': 1,
          'rel': 0,
          'modestbranding': 1,
          'origin': rawOrigin
        };
        
        youtubePlayerRef.current = new window.YT.Player('youtube-player', {
          height: '100%',
          width: '100%',
          videoId: id,
          playerVars: playerVars,
          events: {
            'onReady': onPlayerReady,
            'onError': (e: any) => {
              if (e.data === 150 || e.data === 101 || e.data === 153) {
                setPlayerMode('local');
                setVideoError("YouTube blocked playback. Switched to Safe Mode.");
                setTimeout(() => setVideoError(null), 3000);
              } else {
                setVideoError(`Playback Error (${e.data}). Try another video.`);
              }
            }
          }
        });
      } catch (e) {
        console.error("Failed to create player instance", e);
        setUseDirectIframe(true);
      }
    }
  };

  const onPlayerReady = () => setVideoError(null);

  const initializeFaceMesh = async () => {
    if (!window.FaceMesh) return;

    const faceMesh = new window.FaceMesh({locateFile: (file: string) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    }});

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    faceMesh.onResults(onResults);

    if (typeof window.Camera !== 'undefined' && videoRef.current) {
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (videoRef.current) {
            try { await faceMesh.send({image: videoRef.current}); } catch (e) {}
          }
        },
        width: 640,
        height: 480
      });
      cameraRef.current = camera;
      try { await camera.start(); } catch (err) {
        setError("Camera access denied. Please allow permissions.");
      }
    }
  };

  const onResults = (results: any) => {
    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
    
    const landmarks = results.multiFaceLandmarks[0];
    
    if (canvasRef.current && debugMode) {
      const canvasCtx = canvasRef.current.getContext('2d');
      if (canvasCtx) {
        canvasCtx.save();
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        if(window.drawConnectors) {
          canvasCtx.globalAlpha = 0.3;
          window.drawConnectors(canvasCtx, landmarks, window.FACEMESH_TESSELATION, {color: '#C0C0C070', lineWidth: 1});
          window.drawConnectors(canvasCtx, landmarks, window.FACEMESH_LIPS, {color: '#FF3030', lineWidth: 2});
        }
        canvasCtx.restore();
      }
    }

    const upperLip = landmarks[13];
    const lowerLip = landmarks[14];
    const forehead = landmarks[10];
    const chin = landmarks[152];
    
    const mouthDist = Math.abs(upperLip.y - lowerLip.y);
    const faceHeight = Math.abs(chin.y - forehead.y);
    const ratio = mouthDist / faceHeight;
    const threshold = 0.01 + (sensitivity * 0.005); 

    if (ratio > threshold) {
      if (!lastMouthOpenRef.current) {
        fuelRef.current = Math.min(fuelRef.current + fuelPerBite, 100);
      }
      lastMouthOpenRef.current = true;
    } else {
      lastMouthOpenRef.current = false;
    }
  };

  useEffect(() => {
    if (!isStarted) {
      setStatus('waiting');
      setFuel(0);
      fuelRef.current = 0;
      
      if (useDirectIframe && iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      } else if (youtubePlayerRef.current && youtubePlayerRef.current.pauseVideo && youtubePlayerRef.current.getPlayerState) {
        if (youtubePlayerRef.current.getPlayerState() === 1) youtubePlayerRef.current.pauseVideo();
      }
      if (localVideoRef.current) localVideoRef.current.pause();
    }
  }, [isStarted, useDirectIframe]);

  useEffect(() => {
    if (!isStarted) return;

    const interval = setInterval(() => {
      if (fuelRef.current > 0) {
        fuelRef.current = Math.max(fuelRef.current - (decayRate * 0.5), 0);
        setFuel(fuelRef.current);
        setStatus('eating');
        
        if (!videoError) {
          if (playerMode === 'youtube' && useDirectIframe && iframeRef.current) {
            iframeRef.current.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
          } else if (playerMode === 'youtube' && youtubePlayerRef.current && youtubePlayerRef.current.playVideo) {
            if (youtubePlayerRef.current.getPlayerState && youtubePlayerRef.current.getPlayerState() !== 1) {
              youtubePlayerRef.current.playVideo();
            }
          }
          if (playerMode === 'local' && localVideoRef.current) {
            localVideoRef.current.play().catch(e => {});
          }
        }
      } else {
        setFuel(0);
        setStatus('paused');
        
        if (playerMode === 'youtube' && useDirectIframe && iframeRef.current) {
          iframeRef.current.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        } else if (playerMode === 'youtube' && youtubePlayerRef.current && youtubePlayerRef.current.pauseVideo) {
          if (youtubePlayerRef.current.getPlayerState && youtubePlayerRef.current.getPlayerState() === 1) {
            youtubePlayerRef.current.pauseVideo();
          }
        }
        if (playerMode === 'local' && localVideoRef.current) {
          localVideoRef.current.pause();
        }
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isStarted, decayRate, videoError, playerMode, useDirectIframe]);

  return (
    <>
      {/* Load MediaPipe Scripts */}
      <Script 
        src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"
        strategy="afterInteractive"
      />
      <Script 
        src="https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js"
        strategy="afterInteractive"
      />
      <Script 
        src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"
        strategy="afterInteractive"
      />
      <Script 
        src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"
        strategy="afterInteractive"
        onLoad={handleScriptsLoad}
      />

      <div className="min-h-screen p-4 font-sans flex flex-col">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-6 p-4 bg-slate-800 rounded-xl shadow-lg gap-4">
          <div>
            <h1 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
              🍿 ChewTube
            </h1>
            <p className="text-slate-400 text-sm">Video plays only while chewing is detected.</p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto items-center">
            <div className="relative flex-1 min-w-[200px]">
              <input 
                type="text" 
                value={playerMode === 'youtube' ? videoUrl : 'Using Local Video File'}
                onChange={handleUrlChange}
                disabled={playerMode === 'local'}
                placeholder="Paste YouTube Link Here"
                className="px-4 py-2 rounded bg-slate-700 border border-slate-600 w-full text-sm focus:outline-none focus:border-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-white"
              />
            </div>
            <button 
              onClick={() => setIsStarted(!isStarted)}
              className={`px-6 py-2 rounded font-bold transition-all text-white ${isStarted ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {isStarted ? 'Stop' : 'Start'}
            </button>
          </div>
        </header>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded relative mb-4 flex items-center gap-3" role="alert">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        <main className="flex-1 flex flex-col lg:flex-row gap-6">
          {/* Left: Video Player Area */}
          <div className="flex-1 bg-black rounded-2xl overflow-hidden shadow-2xl relative aspect-video lg:aspect-auto flex flex-col justify-center group">
            {playerMode === 'youtube' && useDirectIframe && (
              <iframe
                ref={iframeRef}
                id="youtube-iframe-direct"
                src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&playsinline=1&controls=1&rel=0&modestbranding=1`}
                className="w-full h-full absolute inset-0"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
            <div id="youtube-player" className={`w-full h-full absolute inset-0 ${playerMode === 'youtube' && !useDirectIframe ? 'block' : 'hidden'}`}></div>
            {playerMode === 'local' && (
              <video ref={localVideoRef} src={LOCAL_VIDEO_URL} className="w-full h-full absolute inset-0 object-contain bg-black" loop playsInline />
            )}
            {videoError && (
              <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center z-30 p-6 text-center animate-in fade-in">
                <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Unable to play this video</h3>
                <p className="text-slate-300 mb-6 max-w-md">{videoError}</p>
              </div>
            )}
            {status === 'paused' && isStarted && !videoError && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10 animate-in fade-in duration-300 pointer-events-none">
                <div className="text-6xl mb-4">🤐</div>
                <h2 className="text-3xl font-bold text-white">Take a bite to play!</h2>
                <p className="text-slate-300 mt-2">Fuel tank is empty.</p>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-slate-800 z-20">
              <div className={`h-full transition-all duration-200 ${fuel > 30 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${fuel}%` }} />
            </div>
          </div>

          {/* Right: Controls & Camera */}
          <div className="w-full lg:w-80 flex flex-col gap-4">
            <div className={`p-6 rounded-xl border-2 transition-colors text-center ${status === 'eating' ? 'bg-green-900/30 border-green-500' : 'bg-red-900/30 border-red-500'}`}>
              <div className="text-lg font-bold uppercase tracking-wider mb-2">Status</div>
              <div className={`text-3xl font-black ${status === 'eating' ? 'text-green-400' : 'text-red-400'}`}>
                {isStarted ? (status === 'eating' ? 'PLAYING' : 'PAUSED') : 'READY'}
              </div>
              <div className="mt-2 text-sm text-slate-400">Fuel Level: {Math.round(fuel)}%</div>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col gap-2">
              <h3 className="font-bold text-slate-300 text-sm uppercase tracking-wider flex items-center gap-2"><MonitorPlay size={16} /> Player Source</h3>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { setPlayerMode('youtube'); setVideoUrl('https://www.youtube.com/watch?v=aqz-KE-bpKQ'); }} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 ${playerMode === 'youtube' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}><Youtube size={14} /> YouTube</button>
                <button onClick={() => setPlayerMode('local')} className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 ${playerMode === 'local' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}><Video size={14} /> Local Video</button>
              </div>
            </div>

            {playerMode === 'youtube' && (
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                <h3 className="font-bold text-slate-300 mb-3 text-sm uppercase tracking-wider flex items-center gap-2"><Film size={16} /> Quick Picks (YouTube)</h3>
                <div className="grid grid-cols-2 gap-2">
                  {SAFE_PRESETS.map(preset => (
                    <button key={preset.id} onClick={() => { loadVideoById(preset.id); setVideoUrl(`https://www.youtube.com/watch?v=${preset.id}`); }} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-medium transition-colors text-left truncate">{preset.name}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative bg-slate-800 rounded-xl overflow-hidden aspect-video border border-slate-700 group">
              <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover opacity-50" playsInline muted style={{ transform: 'scaleX(-1)' }} />
              <canvas ref={canvasRef} width="640" height="480" className="absolute inset-0 w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} />
              <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white flex items-center gap-2"><Camera size={12} /> Camera Feed</div>
              <button onClick={() => setDebugMode(!debugMode)} className="absolute top-2 right-2 bg-slate-700/80 p-1 rounded text-xs hover:bg-slate-600 text-white">{debugMode ? 'Hide Mesh' : 'Show Mesh'}</button>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex-1">
              <h3 className="font-bold text-yellow-400 mb-4 border-b border-slate-700 pb-2">Parent Settings</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-1"><label className="text-sm font-medium text-slate-300">Mouth Sensitivity</label><span className="text-xs text-slate-500">{sensitivity}</span></div>
                  <input type="range" min="1" max="10" value={sensitivity} onChange={(e) => setSensitivity(parseInt(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-400" />
                </div>
                <div>
                  <div className="flex justify-between mb-1"><label className="text-sm font-medium text-slate-300">Playback Duration</label><span className="text-xs text-slate-500">{fuelPerBite} fuel/bite</span></div>
                  <input type="range" min="10" max="100" value={fuelPerBite} onChange={(e) => setFuelPerBite(parseInt(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-400" />
                </div>
                <div>
                  <div className="flex justify-between mb-1"><label className="text-sm font-medium text-slate-300">Pause Speed</label><span className="text-xs text-slate-500">{decayRate}x</span></div>
                  <input type="range" min="0.5" max="5" step="0.5" value={decayRate} onChange={(e) => setDecayRate(parseFloat(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-400" />
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-8 py-4 text-center text-slate-400 text-sm border-t border-slate-700">
          <p>
            Made with 🌵 in Scottsdale, AZ.
            <br />
            Copyright 2025 <a href="https://jonroig.com" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:text-yellow-300 transition-colors">Jon Roig</a>
          </p>
        </footer>
      </div>
    </>
  );
}

