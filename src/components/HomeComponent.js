"use client";

import { useState, useRef, useEffect } from 'react';
import NextImage from 'next/image';
import styles from './HomeComponent.module.css';

export default function HomeComponent() {
  const [darkMode, setDarkMode] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [croppedCanvas, setCroppedCanvas] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [canScroll, setCanScroll] = useState({ up: false, down: false });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const darkOverlayRef = useRef(null);
  const lightOverlayRef = useRef(null);

  // Preload overlay images
  useEffect(() => {
    // Preload dark mode overlay
    const darkOverlay = new window.Image();
    darkOverlay.onload = () => {
      darkOverlayRef.current = darkOverlay;
      // If we're in dark mode, redraw canvas when this image loads
      if (darkMode && selectedImage && canvasRef.current) {
        drawImageToCanvas();
      }
    };
    darkOverlay.src = '/touch-grass-transparent.png';
    
    // Preload light mode overlay
    const lightOverlay = new window.Image();
    lightOverlay.onload = () => {
      lightOverlayRef.current = lightOverlay;
      // If we're in light mode, redraw canvas when this image loads
      if (!darkMode && selectedImage && canvasRef.current) {
        drawImageToCanvas();
      }
    };
    lightOverlay.src = '/touch-grass-black-transparent.png';
  }, []);

  useEffect(() => {
    document.body.className = darkMode ? styles.darkMode : styles.lightMode;
    // Redraw the canvas when theme changes if an image is selected
    if (selectedImage && canvasRef.current) {
      drawImageToCanvas();
    }
  }, [darkMode]);

  useEffect(() => {
    if (selectedImage && canvasRef.current) {
      drawImageToCanvas();
      updateScrollButtons();
    }
  }, [selectedImage, scrollPosition]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const updateScrollButtons = () => {
    if (!selectedImage || !canvasRef.current) return;
    
    const maxScroll = getMaxScroll();
    setCanScroll({
      up: scrollPosition > 0,
      down: scrollPosition < maxScroll
    });
  };

  const getMaxScroll = () => {
    if (!selectedImage || !canvasRef.current) return 0;
    
    const imageAspectRatio = selectedImage.width / selectedImage.height;
    const canvasAspectRatio = canvasRef.current.width / canvasRef.current.height;
    
    if (imageAspectRatio >= canvasAspectRatio) {
      // For wider or exact match images, no vertical scrolling needed
      return 0;
    } else {
      // For taller images, calculate max scroll distance
      const drawWidth = canvasRef.current.width;
      const drawHeight = drawWidth / imageAspectRatio;
      return Math.max(0, drawHeight - canvasRef.current.height);
    }
  };

  const handleImageSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      readAndLoadImage(file);
    }
  };
  
  // Helper function to read and load image
  const readAndLoadImage = (file) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        setSelectedImage(img);
        setScrollPosition(0); // Reset scroll position for new image
        setIsLoading(false);
      };
      img.onerror = () => {
        console.error('Error loading image');
        alert('Error loading image. Please try another image format.');
        setIsLoading(false);
      };
      img.src = event.target.result;
    };
    
    reader.onerror = () => {
      console.error('Error reading file');
      alert('Error reading image file. Please try again.');
      setIsLoading(false);
    };
    
    reader.readAsDataURL(file);
  };

  const drawImageToCanvas = () => {
    if (!selectedImage || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const imageAspectRatio = selectedImage.width / selectedImage.height;
    const canvasAspectRatio = canvasWidth / canvasHeight; // 3:2 = 1.5
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    // Enhanced fill strategy to always maximize canvas usage:
    if (imageAspectRatio > canvasAspectRatio) {
      // Image is wider (landscape) - fill the height and crop sides
      drawHeight = canvasHeight;
      drawWidth = drawHeight * imageAspectRatio;
      // Center the image horizontally
      offsetX = (canvasWidth - drawWidth) / 2;
      offsetY = 0;
    } else if (imageAspectRatio < canvasAspectRatio) {
      // Image is taller (portrait) - fill the width and allow vertical scrolling
      drawWidth = canvasWidth;
      drawHeight = drawWidth / imageAspectRatio;
      offsetX = 0;
      
      // Calculate vertical scroll position with bounds checking
      const maxScroll = Math.max(0, drawHeight - canvasHeight);
      const normalizedScroll = Math.min(scrollPosition, maxScroll);
      const scrollPercentage = maxScroll > 0 ? normalizedScroll / maxScroll : 0;
      offsetY = -scrollPercentage * maxScroll;
    } else {
      // Image has exactly the same aspect ratio as the canvas - perfect fit
      drawWidth = canvasWidth;
      drawHeight = canvasHeight;
      offsetX = 0;
      offsetY = 0;
    }
    
    // Draw the image
    ctx.drawImage(selectedImage, offsetX, offsetY, drawWidth, drawHeight);
    
    // Get the appropriate cached overlay image
    const overlayImg = darkMode ? darkOverlayRef.current : lightOverlayRef.current;
    
    // Only proceed if the overlay image is loaded
    if (overlayImg) {
      const overlayWidth = canvasWidth * 0.7; // 70% of canvas width
      const overlayHeight = (overlayWidth / overlayImg.width) * overlayImg.height;
      const overlayX = (canvasWidth - overlayWidth) / 2;
      const overlayY = (canvasHeight - overlayHeight) / 2;
      
      ctx.drawImage(overlayImg, overlayX, overlayY, overlayWidth, overlayHeight);
    }
    
    // Save the final canvas
    setCroppedCanvas(canvas);
  };

  // Mouse event handlers
  const handleMouseDown = (e) => {
    if (!selectedImage || getMaxScroll() === 0) return;
    
    setIsDragging(true);
    setDragStart(e.clientY);
    e.preventDefault(); // Prevent unwanted selections
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const deltaY = dragStart - e.clientY;
    const maxScroll = getMaxScroll();
    const newScrollPosition = Math.min(Math.max(0, scrollPosition + deltaY), maxScroll);
    
    setScrollPosition(newScrollPosition);
    setDragStart(e.clientY);
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add non-passive touch event handlers using useEffect
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleTouchStart = (e) => {
      if (!selectedImage || getMaxScroll() === 0) return;
      
      setIsDragging(true);
      setDragStart(e.touches[0].clientY);
    };
    
    const handleTouchMove = (e) => {
      if (!isDragging) return;
      
      const deltaY = dragStart - e.touches[0].clientY;
      const maxScroll = getMaxScroll();
      const newScrollPosition = Math.min(Math.max(0, scrollPosition + deltaY), maxScroll);
      
      setScrollPosition(newScrollPosition);
      setDragStart(e.touches[0].clientY);
      e.preventDefault(); // Now this works with passive: false
    };
    
    const handleTouchEnd = () => {
      setIsDragging(false);
    };
    
    // Add event listeners with passive: false option
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Cleanup function to remove event listeners
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [selectedImage, isDragging, dragStart, scrollPosition]);

  // Button handlers
  const handleScrollButton = (direction) => {
    if (!selectedImage) return;
    
    const maxScroll = getMaxScroll();
    const scrollStep = maxScroll / 10; // Divide the total scrollable area into 10 steps
    
    if (direction === 'up' && scrollPosition > 0) {
      setScrollPosition(Math.max(0, scrollPosition - scrollStep));
    } else if (direction === 'down' && scrollPosition < maxScroll) {
      setScrollPosition(Math.min(maxScroll, scrollPosition + scrollStep));
    }
  };

  // Clean up global event listeners
  useEffect(() => {
    const handleMouseUpGlobal = () => setIsDragging(false);
    
    if (typeof window !== 'undefined') {
      window.addEventListener('mouseup', handleMouseUpGlobal);
      
      return () => {
        window.removeEventListener('mouseup', handleMouseUpGlobal);
      };
    }
  }, []);

  const handleShare = async () => {
    if (!croppedCanvas) return;
    
    setIsLoading(true);
    try {
      // Convert canvas to blob
      const blob = await new Promise(resolve => croppedCanvas.toBlob(resolve, 'image/png'));
      
      // Create form data
      const formData = new FormData();
      formData.append('image', blob, 'touch-grass.png');
      
      // Add userFid if available (from Farcaster Frame)
      const userFid = typeof window !== 'undefined' && window.userFid ? window.userFid : '977233';
      formData.append('userFid', userFid);
      
      // Call the API endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Extract the image path from the full URL
          const imageUrl = data.url;
          const imagePath = imageUrl.split('/').pop();
          
          // Create a shareable frame URL using environment variable
          const appBaseUrl = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_BASE_URL
            ? process.env.NEXT_PUBLIC_BASE_URL
            : window.location.origin;
          
          const frameUrl = `${appBaseUrl}/?image=${encodeURIComponent(imagePath)}`;
          
          // Use the frame SDK to create a share intent
          try {
            // Import frame SDK dynamically
            const frame = await import('@farcaster/frame-sdk');
            
            // The text for the share
            const targetText = 'I have touched grass.';
            
            // Use the frame URL for sharing
            const finalUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(targetText)}&embeds[]=${encodeURIComponent(frameUrl)}`;
            
            // Open the share intent
            await frame.sdk.actions.openUrl(finalUrl);
          } catch (frameError) {
            console.error('Error using frame SDK:', frameError);
          }
        } else {
          throw new Error(data.error || 'Failed to upload image');
        }
      } else {
        throw new Error('Failed to share image: Server error');
      }
    } catch (error) {
      console.error('Error sharing image:', error);
      alert('Error sharing image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.themeToggle} onClick={toggleTheme}>
        {darkMode ? (
          <svg xmlns="http://www.w3.org/2000/svg" className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </div>
      
      <h1 className={styles.title}>TOUCH GRASS</h1>
      
      <div className={styles.imageUploadArea} onClick={() => !selectedImage && !isLoading && fileInputRef.current.click()}>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageSelect}
          className={styles.fileInput}
        />
        {!selectedImage && !isLoading && (
          <div className={styles.uploadPrompt}>
            <svg xmlns="http://www.w3.org/2000/svg" className={styles.uploadIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p>Click to select an image</p>
          </div>
        )}
        
        {!selectedImage && isLoading && (
          <div className={styles.loadingPrompt}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`${styles.loadingIcon} ${styles.spin}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <p>Converting image format...</p>
          </div>
        )}
        
        {selectedImage && (
          <div className={styles.canvasWrapper}>
            <div 
              ref={containerRef}
              className={`${styles.canvasContainer} ${isDragging ? styles.dragging : ''} ${getMaxScroll() > 0 ? styles.draggable : ''}`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <canvas 
                ref={canvasRef}
                width={600}
                height={400}
                className={styles.canvas}
              />
            </div>
            {getMaxScroll() > 0 && (
              <div className={styles.adjustmentInstructions}>
                Drag to adjust image position
              </div>
            )}
          </div>
        )}
      </div>
      
      {selectedImage && (
        <div className={styles.actionsContainer}>
          <h2 className={styles.ctaHeading}>Cast Your Proof</h2>
          <div className={styles.buttonContainer}>
            <button 
              className={styles.shareButton}
              onClick={handleShare}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Share'}
            </button>
            <button 
              className={styles.replaceButton}
              onClick={() => fileInputRef.current.click()}
              aria-label="Replace image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.replaceIcon}>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Replace Photo
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 