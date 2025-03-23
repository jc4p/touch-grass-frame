"use client";

import { useState, useRef, useEffect } from 'react';
import styles from './HomeComponent.module.css';
import * as frame from '@farcaster/frame-sdk';
export default function HomeComponent() {
  const [darkMode, setDarkMode] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [croppedCanvas, setCroppedCanvas] = useState(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [canScroll, setCanScroll] = useState({ up: false, down: false });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitFormOpen, setIsSubmitFormOpen] = useState(false);
  const [darkModePreview, setDarkModePreview] = useState(null);
  const [lightModePreview, setLightModePreview] = useState(null);
  const [currentOverlay, setCurrentOverlay] = useState({
    id: 1,
    name: "TOUCH GRASS",
    darkModeImage: "/touch-grass-transparent.png",
    lightModeImage: "/touch-grass-black-transparent.png",
    shareText: "I have touched grass."
  });
  const [overlays, setOverlays] = useState([]);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const darkOverlayRef = useRef(null);
  const lightOverlayRef = useRef(null);
  const darkFileInputRef = useRef(null);
  const lightFileInputRef = useRef(null);

  // Fetch overlays from API
  useEffect(() => {
    const fetchOverlays = async () => {
      try {
        const response = await fetch('/api/overlays', {
          // Add credentials to ensure cookies are sent
          credentials: 'same-origin',
          // Ensure mode is appropriate for iframe context
          mode: 'same-origin'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.overlays)) {
            // Map DB overlays to component structure
            const mappedOverlays = data.overlays.map(overlay => {
              // Handle relative URLs by converting them to absolute URLs
              const darkModeImage = overlay.dark_mode_image_url.startsWith('http')
                ? overlay.dark_mode_image_url
                : `https://images.kasra.codes/touch-grass${overlay.dark_mode_image_url}`;
              
              const lightModeImage = overlay.light_mode_image_url
                ? (overlay.light_mode_image_url.startsWith('http')
                    ? overlay.light_mode_image_url
                    : `https://images.kasra.codes/touch-grass${overlay.light_mode_image_url}`)
                : darkModeImage;
                
              return {
                id: overlay.id,
                name: overlay.name,
                darkModeImage,
                lightModeImage,
                shareText: overlay.share_text
              };
            });
            
            setOverlays(mappedOverlays);
            
            // Set the first overlay as current if available and if we don't have a selected one
            if (mappedOverlays.length > 0) {
              setCurrentOverlay(mappedOverlays[0]);

              await frame.sdk.actions.ready();
            }
          }
        }
      } catch (error) {
        console.error('Error fetching overlays:', error);
      }
    };
    
    fetchOverlays();
  }, []);

  // Preload overlay images
  useEffect(() => {
    // Preload dark mode overlay
    const darkOverlay = new window.Image();
    darkOverlay.crossOrigin = "anonymous";
    darkOverlay.onload = () => {
      darkOverlayRef.current = darkOverlay;
      // If we're in dark mode, redraw canvas when this image loads
      if (darkMode && selectedImage && canvasRef.current) {
        drawImageToCanvas();
      }
    };
    darkOverlay.onerror = () => {
      console.error("Error loading dark overlay image:", currentOverlay.darkModeImage);
    };
    darkOverlay.src = currentOverlay.darkModeImage;
    
    // Preload light mode overlay
    const lightOverlay = new window.Image();
    lightOverlay.crossOrigin = "anonymous";
    lightOverlay.onload = () => {
      lightOverlayRef.current = lightOverlay;
      // If we're in light mode, redraw canvas when this image loads
      if (!darkMode && selectedImage && canvasRef.current) {
        drawImageToCanvas();
      }
    };
    lightOverlay.onerror = () => {
      console.error("Error loading light overlay image:", currentOverlay.lightModeImage);
    };
    lightOverlay.src = currentOverlay.lightModeImage;
  }, [currentOverlay]);

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
      img.crossOrigin = "anonymous";
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
      // Calculate aspect ratio of the overlay
      const overlayAspectRatio = overlayImg.width / overlayImg.height;
      
      // Calculate maximum dimensions based on canvas size
      const maxWidth = canvasWidth * 0.8; // Max 80% of canvas width
      const maxHeight = canvasHeight * 0.4; // Max 40% of canvas height
      
      // Calculate initial dimensions respecting max width constraint
      let overlayWidth = maxWidth;
      let overlayHeight = overlayWidth / overlayAspectRatio;
      
      // If height exceeds max height, recalculate based on height constraint
      if (overlayHeight > maxHeight) {
        overlayHeight = maxHeight;
        overlayWidth = overlayHeight * overlayAspectRatio;
      }
      
      // If the image is portrait (taller than wide), make sure it doesn't exceed max height
      if (overlayAspectRatio < 1) {
        overlayHeight = Math.min(overlayHeight, maxHeight);
        overlayWidth = overlayHeight * overlayAspectRatio;
      }
      
      // Center the overlay
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
      // Convert canvas to blob with proper settings for iframe
      const blob = await new Promise(resolve => {
        try {
          croppedCanvas.toBlob(resolve, 'image/png');
        } catch (error) {
          console.error("Canvas toBlob error:", error);
          throw new Error("Failed to convert canvas to image. This may be due to security restrictions in iframes.");
        }
      });
      
      // Create form data
      const formData = new FormData();
      const fileName = `${currentOverlay.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      formData.append('image', blob, fileName);
      
      // Add userFid if available (from Farcaster Frame)
      const userFid = typeof window !== 'undefined' && window.userFid ? window.userFid : '977233';
      formData.append('userFid', userFid);
      
      // Call the API endpoint with appropriate CORS settings
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin',
        mode: 'same-origin'
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
          
          const frameUrl = `${appBaseUrl}/?image=${encodeURIComponent(imagePath)}&overlay=${currentOverlay.id}`;
          
          // Use the frame SDK to create a share intent
          try {
            // Import frame SDK dynamically
            const frame = await import('@farcaster/frame-sdk');
            
            // The text for the share
            const targetText = currentOverlay.shareText;
            
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

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsSubmitFormOpen(false);
  };

  const handleOverlaySelect = async (overlay) => {
    // Set the current overlay directly
    setCurrentOverlay(overlay);
    closeModal();
    
    // Note: The useEffect hook will handle loading the images when currentOverlay changes
    
    // Increment usage count if this is an explicit selection (not the initial default)
    if (overlay.id && isModalOpen) {
      try {
        await fetch('/api/overlays/increment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
          mode: 'same-origin',
          body: JSON.stringify({ id: overlay.id }),
        });
      } catch (error) {
        console.error('Error incrementing overlay usage:', error);
      }
    }
  };

  const openSubmitForm = () => {
    setIsSubmitFormOpen(true);
    setDarkModePreview(null);
    setLightModePreview(null);
  };
  
  const handleDarkModeFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      
      // Create image with crossOrigin to prevent tainting
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setDarkModePreview(imageUrl);
      };
      img.src = imageUrl;
    }
  };
  
  const handleLightModeFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      
      // Create image with crossOrigin to prevent tainting
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setLightModePreview(imageUrl);
      };
      img.src = imageUrl;
    }
  };

  const handleSubmitNewOverlay = async (e) => {
    e.preventDefault();
    const name = e.target.overlayName.value;
    const shareText = e.target.shareText.value;
    const darkModeFile = darkFileInputRef.current.files[0];
    const lightModeFile = lightFileInputRef.current.files[0];

    if (!name || !shareText || !darkModeFile) {
      alert('Please provide a name, share text, and dark mode image');
      return;
    }

    // Show loading state
    setIsLoading(true);

    try {
      // Create form data for API request
      const formData = new FormData();
      formData.append('name', name);
      formData.append('shareText', shareText);
      formData.append('darkModeImage', darkModeFile);
      if (lightModeFile) {
        formData.append('lightModeImage', lightModeFile);
      }
      
      // Add userFid if available (from Farcaster Frame)
      const userFid = typeof window !== 'undefined' && window.userFid ? window.userFid : '977233';
      formData.append('userFid', userFid);
      
      // Submit to API
      const response = await fetch('/api/overlays/create', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Add the new overlay to the list
          setOverlays(prevOverlays => [data.overlay, ...prevOverlays]);
          
          // Set as current overlay
          setCurrentOverlay({
            id: data.overlay.id,
            name: data.overlay.name,
            darkModeImage: data.overlay.dark_mode_image_url,
            lightModeImage: data.overlay.light_mode_image_url || data.overlay.dark_mode_image_url,
            shareText: data.overlay.share_text
          });
          
          closeModal();
        } else {
          throw new Error(data.error || 'Failed to create overlay');
        }
      } else {
        throw new Error('Failed to create overlay: Server error');
      }
    } catch (error) {
      console.error('Error creating overlay:', error);
      alert('Error creating overlay. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.topControls}>
        <div className={styles.switchButton} onClick={openModal}>
          <svg xmlns="http://www.w3.org/2000/svg" className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
        </div>
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
      </div>
      
      <h1 className={styles.title}>{currentOverlay.name}</h1>
      
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            {!isSubmitFormOpen ? (
              <>
                <h2 className={styles.modalTitle}>Choose an Overlay</h2>
                <div className={styles.overlayOptions}>
                  {overlays.length > 0 ? (
                    overlays.map(overlay => (
                      <div 
                        key={overlay.id}
                        className={`${styles.overlayOption} ${currentOverlay.id === overlay.id ? styles.selectedOverlay : ''}`}
                        onClick={() => handleOverlaySelect(overlay)}
                      >
                        <h3>{overlay.name}</h3>
                        <div className={styles.overlayPreview}>
                          <img 
                            src={overlay.darkModeImage} 
                            alt={overlay.name} 
                            className={styles.previewImage}
                            crossOrigin="anonymous"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.overlayOption} 
                      onClick={() => handleOverlaySelect({
                        id: 1,
                        name: "TOUCH GRASS",
                        darkModeImage: "/touch-grass-transparent.png",
                        lightModeImage: "/touch-grass-black-transparent.png",
                        shareText: "I have touched grass."
                      })}
                    >
                      <h3>TOUCH GRASS</h3>
                      <div className={styles.overlayPreview}>
                        <img src="/touch-grass-transparent.png" alt="Touch Grass" className={styles.previewImage} />
                      </div>
                    </div>
                  )}
                </div>
                <div className={styles.modalButtonsContainer}>
                  <button className={styles.closeModalBtn} onClick={closeModal}>Close</button>
                  <button className={styles.submitOptionBtn} onClick={openSubmitForm}>New Overlay</button>
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmitNewOverlay} className={styles.submitForm}>
                <h2 className={styles.modalTitle}>Submit New Overlay</h2>
                
                <div className={styles.formField}>
                  <label htmlFor="overlayName">Name:</label>
                  <input 
                    type="text" 
                    id="overlayName" 
                    name="overlayName" 
                    placeholder="Touch Grass" 
                    required 
                  />
                </div>
                
                <div className={styles.formField}>
                  <label htmlFor="shareText">Share Text:</label>
                  <input 
                    type="text" 
                    id="shareText" 
                    name="shareText" 
                    placeholder="I have touched grass" 
                    required 
                  />
                </div>
                
                <div className={styles.formField}>
                  <label>Dark Mode:</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={darkFileInputRef} 
                    onChange={handleDarkModeFileChange}
                    required 
                    className={styles.fileInput}
                  />
                  <div className={styles.uploadHint}>Transparent PNG recommended</div>
                  {darkModePreview && (
                    <div className={styles.imagePreview}>
                      <img src={darkModePreview} alt="Dark mode preview" />
                    </div>
                  )}
                </div>
                
                <div className={styles.formField}>
                  <label>Light Mode (Optional):</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={lightFileInputRef}
                    onChange={handleLightModeFileChange}
                    className={styles.fileInput}
                  />
                  {lightModePreview && (
                    <div className={`${styles.imagePreview} ${styles.lightModePreview}`}>
                      <img src={lightModePreview} alt="Light mode preview" />
                    </div>
                  )}
                </div>
                
                <div className={styles.formButtons}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setIsSubmitFormOpen(false)}>Back</button>
                  <button type="submit" className={styles.submitBtn}>Submit</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      
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