import React, { useState, useRef } from 'react';

const ScreenCapture = () => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [endX, setEndX] = useState(0);
  const [endY, setEndY] = useState(0);
  const [image, setImage] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const selectionBoxRef = useRef(null);

  const captureScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      });

      const video = videoRef.current;
      video.srcObject = stream;

      video.onloadedmetadata = () => {
        video.play();
      };

      setSelectionMode(true);
    } catch (error) {
      console.error('Error capturing screen:', error);
    }
  };

  const handleMouseDown = (e) => {
    if (!selectionMode) return;
    setIsSelecting(true);
    setStartX(e.clientX);
    setStartY(e.clientY);
  };

  const handleMouseMove = (e) => {
    if (!isSelecting) return;
    setEndX(e.clientX);
    setEndY(e.clientY);
  };

  const handleMouseUp = async () => {
    if (!selectionMode) return;
    setIsSelecting(false);
    setSelectionMode(false);

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const rect = selectionBoxRef.current.getBoundingClientRect();
    const x = startX;
    const y = startY + 80;
    const width = rect.width;
    const height = rect.height;

    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');

    // Temporarily hide the overlay and selection box
    overlayRef.current.style.display = 'none';

    // Allow the video frame to render without the overlay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Draw the selected region from the video onto the canvas
    context.drawImage(video, x, y, width, height, 0, 0, width, height);

    const imageData = canvas.toDataURL('image/png');
    setImage(imageData);

    // Stop the video stream
    const stream = video.srcObject;
    stream.getTracks().forEach((track) => track.stop());
    video.srcObject = null;

    // Restore the overlay display
    overlayRef.current.style.display = 'block';
  };

  return (
    <div>
      <button onClick={captureScreen}>Capture Screen</button>
      <video ref={videoRef} style={{ display: 'none' }}></video>
      {selectionMode && (
        <div
          ref={overlayRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            cursor: 'crosshair',
            zIndex: 999,
          }}
        >
          {isSelecting && (
            <div
              ref={selectionBoxRef}
              style={{
                position: 'absolute',
                top: Math.min(startY, endY),
                left: Math.min(startX, endX),
                width: Math.abs(endX - startX),
                height: Math.abs(endY - startY),
                border: '2px dashed #000',
                backgroundColor: 'rgba(0, 0, 0, 0.2)',
                zIndex: 1000,
              }}
            ></div>
          )}
        </div>
      )}
      {image && (
        <div>
          <h2>Captured Image</h2>
          <img src={image} alt="Captured region" />
        </div>
      )}
    </div>
  );
};

export default ScreenCapture;
