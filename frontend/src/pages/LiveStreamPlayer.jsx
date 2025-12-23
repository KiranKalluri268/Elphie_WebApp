import React, { useState, useEffect } from 'react';
import { ArrowLeft, Wifi, WifiOff, Radio, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../Layouts/Navbar';

const LiveStreamPlayer = () => {
  const [isLive, setIsLive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const navigate = useNavigate();

  // IVS Live Stream URL
  const liveStreamUrl = "https://6bc22ed35c87.ap-south-1.playback.live-video.net/api/video/v1/ap-south-1.710271912806.channel.BjCYxGZktFtM.m3u8";

  // Check if stream is live - using video element events instead of fetch to avoid CORS
  const checkStreamStatus = () => {
    setCheckingStatus(true);
    
    // Create a temporary video element to check if stream is playable
    const testVideo = document.createElement('video');
    testVideo.muted = true;
    testVideo.playsInline = true;
    
    const handleCanPlay = () => {
      console.log('Stream status check: Live');
      setIsLive(true);
      setCheckingStatus(false);
      setIsLoading(false);
      testVideo.remove();
    };
    
    const handleError = () => {
      console.log('Stream status check: Offline');
      setIsLive(false);
      setCheckingStatus(false);
      setIsLoading(false);
      testVideo.remove();
    };
    
    // Set timeout in case video never loads
    const timeout = setTimeout(() => {
      console.log('Stream status check: Timeout');
      setIsLive(false);
      setCheckingStatus(false);
      setIsLoading(false);
      testVideo.remove();
    }, 5000);
    
    testVideo.addEventListener('canplay', () => {
      clearTimeout(timeout);
      handleCanPlay();
    });
    
    testVideo.addEventListener('error', () => {
      clearTimeout(timeout);
      handleError();
    });
    
    testVideo.src = liveStreamUrl;
  };

  // Check stream status on mount and every 30 seconds
  useEffect(() => {
    checkStreamStatus();
    const interval = setInterval(checkStreamStatus, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    checkStreamStatus();
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Video Player Container */}
        <div className="bg-black rounded-lg overflow-hidden shadow-2xl relative" style={{ position: 'relative', paddingTop: '56.25%' }}>
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-white text-center">
              <RefreshCw size={40} className="mx-auto mb-4 animate-spin text-blue-400" />
              <p>Checking stream status...</p>
            </div>
          </div>
        ) : isLive ? (
          <video 
            src={liveStreamUrl}
            controls
            autoPlay
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            className="w-full h-full"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-white text-center p-8">
              <AlertCircle size={64} className="mx-auto mb-6 text-red-500" />
              <h2 className="text-2xl font-bold mb-2">Stream is Offline</h2>
              <p className="text-gray-400 mb-6">The live stream is currently not broadcasting.</p>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw size={20} />
                Check Again
              </button>
            </div>
          </div>
        )}

        {/* Live Indicator */}
        {isLive && (
          <div className="absolute top-4 left-4 z-10">
            <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold animate-pulse">
              <Radio size={16} />
              <span>LIVE</span>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="absolute top-4 right-4 z-10">
          <button 
            onClick={handleRefresh}
            className="inline-flex items-center gap-1 bg-black/70 hover:bg-black/90 text-white px-3 py-2 rounded-full text-sm font-medium transition-all shadow-lg"
            disabled={checkingStatus}
          >
            <RefreshCw size={16} className={checkingStatus ? 'animate-spin' : ''} />
            <span>{checkingStatus ? 'Checking...' : 'Refresh'}</span>
          </button>
        </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamPlayer;
