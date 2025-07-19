import React, { useRef, useEffect } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import "@videojs/themes/dist/forest/index.css";

function VideoPlayer({ src, thumbnail, title, duration, autoPlay = true }) {
  const videoRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    if (!playerRef.current) {
      playerRef.current = videojs(videoRef.current, {
        controls: true,
        autoplay: autoPlay,
        preload: 'auto',
        poster: thumbnail,
        fluid: true,
        sources: [{
          src,
          type: src.endsWith('.m3u8') ? 'application/x-mpegURL' : undefined, // HLS support
        }],
      });
    }
    else {
      playerRef.current.src({ src, type: src.endsWith('.m3u8') ? 'application/x-mpegURL' : undefined });
    }

    return () => {
      if(playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, thumbnail, autoPlay]);

  return (
    <div className="w-full h-full">
      <video
        ref={videoRef}
        className="video-js vjs-theme-forest w-full h-full"
        data-setup='{}'
        title={title}
      />
      {/* Optionally display duration/title outside video */}
      {/* <div>{title}</div>
      <div>{duration}</div> */}
    </div>
  );
}

export default VideoPlayer;
