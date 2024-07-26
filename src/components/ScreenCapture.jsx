import { useState, useRef } from 'react';
import Tesseract from 'tesseract.js';

let ScreenCapture = ({ onCapture }) => {
  let [isSelecting, setIsSelecting] = useState(false);
  let [startX, setStartX] = useState(0);
  let [startY, setStartY] = useState(0);
  let [endX, setEndX] = useState(0);
  let [endY, setEndY] = useState(0);
  let [selectionMode, setSelectionMode] = useState(false);
  let videoRef = useRef(null);
  let overlayRef = useRef(null);
  let selectionBoxRef = useRef(null);

  let captureScreen = async () => {
    try {
      let stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'never' },
        audio: false,
        preferCurrentTab: true
      });

      let video = videoRef.current;
      video.srcObject = stream;

      video.onloadedmetadata = () => {
        video.play();
      };

      setSelectionMode(true);
    } catch (error) {
      console.error('Error capturing screen:', error);
    }
  };

  let handleMouseDown = (e) => {
    setStartX(e.clientX);
    setStartY(e.clientY);
    if (!selectionMode) {
      return;
    }
    setIsSelecting(true);
    setStartX(e.clientX);
    setStartY(e.clientY);
  };

  let handleMouseMove = (e) => {
    setEndX(e.clientX);
    setEndY(e.clientY);
    if (!isSelecting) {
      return;
    }
    setEndX(e.clientX);
    setEndY(e.clientY);
  };

  let handleMouseUp = async () => {
    if (!selectionMode) return;
    setIsSelecting(false);
    setSelectionMode(false);

    let video = videoRef.current;
    let canvas = document.createElement('canvas');
    let rect = selectionBoxRef.current.getBoundingClientRect();
    let x = rect.left;
    let y = rect.top + (window.outerHeight - window.innerHeight);
    let width = rect.width;
    let height = rect.height;

    canvas.width = width;
    canvas.height = height;
    let context = canvas.getContext('2d');

    // Temporarily hide the overlay and selection box
    document.documentElement.style.cursor = 'none';
    if (overlayRef.current) {
      overlayRef.current.style.display = 'none';
    }

    // Allow the video frame to render without the overlay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Draw the selected region from the video onto the canvas
    context.drawImage(video, x, y, width, height, 0, 0, width, height);

    let imageData = canvas.toDataURL('image/png');

    // Stop the video stream
    let stream = video.srcObject;
    stream.getTracks().forEach((track) => track.stop());
    video.srcObject = null;

    // Use Tesseract to recognize text from the captured image
    Tesseract.recognize(
      imageData,
      'eng',
      {
        logger: (m) => console.log(m)
      }
    ).then(({ data: { text } }) => {
      console.log('Recognized text:', text);
      let sanitizedText = text.replace(/[\t\n|]/g,' ');
      onCapture(sanitizedText);
    });

    // Restore the overlay display
    document.documentElement.style.cursor = '';
    if (overlayRef.current) {
      overlayRef.current.style.display = 'block';
    }
  };

  return (
    <span>
      <button onClick={captureScreen}>Capture Screen</button>
      <video ref={videoRef} style={{ display: 'none' }}></video>
      {selectionMode && (
        <span
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
            zIndex: 999,
          }}
        >
          {isSelecting && (
            <span
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
            ></span>
          )}
        </span>
      )}
    </span>
  );
};

export default ScreenCapture;

