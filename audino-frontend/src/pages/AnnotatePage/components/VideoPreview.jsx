import React, { useEffect, useRef, useState } from 'react';

const VideoPreview = ({ 
  jobId, 
  currentTime, 
  totalDuration, 
  isPlaying, 
  isVideoTask = false,
  videoUrl = null,
  videoError = null,
  isVideoLoading = false,
  videoLoadingProgress = 0,
  onProgressUpdate = null
}) => {
  const videoRef = useRef(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [error, setError] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [localVideoLoading, setLocalVideoLoading] = useState(false);
  const [localVideoProgress, setLocalVideoProgress] = useState(0);

  // Sync video with audio timeline
  useEffect(() => {
    if (videoRef.current && isVideoLoaded && currentTime !== null) {
      // Only seek if the difference is more than 0.5 seconds to avoid constant seeking
      const timeDiff = Math.abs(videoRef.current.currentTime - currentTime);
      if (timeDiff > 0.5) {
        videoRef.current.currentTime = currentTime;
      }
    }
  }, [currentTime, isVideoLoaded]);

  // Sync video play/pause with audio
  useEffect(() => {
    if (videoRef.current && isVideoLoaded) {
      if (isPlaying && !isVideoPlaying) {
        videoRef.current.play().catch(err => {
          console.log('Video play failed:', err);
        });
      } else if (!isPlaying && isVideoPlaying) {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, isVideoLoaded, isVideoPlaying]);

  // Handle video loading progress from parent component
  useEffect(() => {
    if (isVideoLoading !== undefined) {
      setLocalVideoLoading(isVideoLoading);
    }
    if (videoLoadingProgress !== undefined) {
      setLocalVideoProgress(videoLoadingProgress);
      // Also notify parent of the progress update for consistency
      if (onProgressUpdate && videoLoadingProgress !== localVideoProgress) {
        onProgressUpdate(videoLoadingProgress);
      }
    }
  }, [isVideoLoading, videoLoadingProgress, onProgressUpdate, localVideoProgress]);

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
    setVideoDuration(videoRef.current.duration);
    setError(null);
    setLocalVideoLoading(false);
    setLocalVideoProgress(100);
    if (onProgressUpdate) {
      onProgressUpdate(100);
    }
  };

  const handleVideoError = (e) => {
    // Try to get more specific error information
    if (videoRef.current?.error) {
      const error = videoRef.current.error;
      
      switch (error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          setError('Video loading was aborted');
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          setError('Network error while loading video');
          break;
        case MediaError.MEDIA_ERR_DECODE:
          setError('Video format not supported by browser');
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          setError('Video source not supported');
          break;
        default:
          setError('Failed to load video');
      }
    } else {
      setError('Failed to load video');
    }
    
    setIsVideoLoaded(false);
    setLocalVideoLoading(false);
    setLocalVideoProgress(0);
    if (onProgressUpdate) {
      onProgressUpdate(0);
    }
  };

  const handleVideoPlay = () => {
    setIsVideoPlaying(true);
  };

  const handleVideoPause = () => {
    setIsVideoPlaying(false);
  };

  const handleVideoSeek = () => {
    // Update current time when user manually seeks in video
    if (videoRef.current && isVideoLoaded) {
      // This could be used to sync audio timeline with video if needed
    }
  };

  // Handle video loading events for progress tracking
  const handleLoadStart = () => {
    console.log('Video load started');
    setLocalVideoLoading(true);
    setLocalVideoProgress(0);
    if (onProgressUpdate) {
      onProgressUpdate(0);
    }
  };

  const handleProgress = () => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      const buffered = videoRef.current.buffered;
      const duration = videoRef.current.duration;
      if (duration > 0) {
        const progress = (buffered.end(buffered.length - 1) / duration) * 100;
        const cappedProgress = Math.min(progress, 99); // Cap at 99% until fully loaded
        setLocalVideoProgress(cappedProgress);
        if (onProgressUpdate) {
          onProgressUpdate(cappedProgress);
        }
      }
    }
  };

  const handleCanPlay = () => {
    console.log('Video can play');
    setLocalVideoProgress(99);
    if (onProgressUpdate) {
      onProgressUpdate(99);
    }
  };

  const handleCanPlayThrough = () => {
    console.log('Video can play through');
    setLocalVideoProgress(100);
    if (onProgressUpdate) {
      onProgressUpdate(100);
    }
  };

  const handleLoadedData = () => {
    console.log('Video loaded data');
  };
  
  // Function to try different MIME types if the current one fails
  const tryDifferentMimeTypes = () => {
    if (!videoUrl) return;
    setError('Video format issue detected. Please try refreshing the page.');
  };
  
  if (!isVideoTask || !videoUrl) {
    return null;
  }

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      {/* Video Loading Progress Bar */}
      {(localVideoLoading || localVideoProgress < 100) && (
        <div className="absolute top-0 left-0 right-0 z-10">
          <div className="bg-gray-200 dark:bg-audino-midnight h-2 w-full">
            <div 
              className="bg-audino-primary h-2 transition-all duration-300 ease-out rounded-r"
              style={{ width: `${localVideoProgress}%` }}
            ></div>
          </div>
          {localVideoLoading && localVideoProgress < 100 && (
            <div className="bg-black bg-opacity-75 text-white text-xs px-3 py-2 text-center flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              <span>
                {localVideoProgress === 0 ? 'Fetching video data...' : `Loading video... ${Math.round(localVideoProgress)}%`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Loading Placeholder */}
      {localVideoLoading && localVideoProgress === 0 && (
        <div className="flex items-center justify-center h-48 bg-gray-200 dark:bg-audino-midnight">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-audino-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Fetching video data...</p>
          </div>
        </div>
      )}
          
      {error ? (
        <div className="flex items-center justify-center h-48 bg-gray-200 dark:bg-audino-midnight">
          <div className="text-center">
            <p className="text-red-500 dark:text-red-400 text-sm mb-2">{error}</p>
            <button
              onClick={tryDifferentMimeTypes}
              className="bg-blue-500 text-white px-3 py-1 text-xs rounded hover:bg-blue-600"
            >
              Try Different Format
            </button>
          </div>
        </div>
      ) : (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-auto max-h-96 object-contain"
          onLoadedMetadata={handleVideoLoad}
          onError={handleVideoError}
          onPlay={handleVideoPlay}
          onPause={handleVideoPause}
          onSeeked={handleVideoSeek}
          onLoadStart={handleLoadStart}
          onProgress={handleProgress}
          onCanPlay={handleCanPlay}
          onCanPlayThrough={handleCanPlayThrough}
          onLoadedData={handleLoadedData}
          preload="metadata"
          crossOrigin="anonymous"
          muted
        />
      )}
          
      {/* Time indicator overlay */}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
        {currentTime ? `${Math.floor(currentTime / 60)}:${(currentTime % 60).toFixed(1).padStart(4, '0')}` : '00:00.0'}
      </div>
          
      {/* Video duration indicator */}
      <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
        {videoDuration ? `${Math.floor(videoDuration / 60)}:${(videoDuration % 60).toFixed(1).padStart(4, '0')}` : '00:00.0'}
      </div>
    </div>
  );
};

export default VideoPreview; 