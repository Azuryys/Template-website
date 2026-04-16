import { useState, useEffect } from 'react';

export function useRecentImages() {
  const [recentImages, setRecentImages] = useState([]);

  useEffect(() => {
    try {
      const savedRecentImages = JSON.parse(localStorage.getItem('recentImages') || '[]');
      const recentImages20 = savedRecentImages.slice(0, 20);
      setRecentImages(recentImages20);
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);

  const saveRecentImage = (imageSource) => {
    try {
      const savedRecentImages = JSON.parse(localStorage.getItem('recentImages') || '[]');
      const imageExists = savedRecentImages.some(img => img.src === imageSource);
      
      if (!imageExists) {
        const newImage = {
          src: imageSource,
          uploadedAt: new Date().toISOString(),
          id: Date.now(),
        };
        savedRecentImages.unshift(newImage);
        const trimmedImages = savedRecentImages.slice(0, 50);
        localStorage.setItem('recentImages', JSON.stringify(trimmedImages));
        setRecentImages(trimmedImages.slice(0, 20));
      }
    } catch (error) {
      console.error('Error saving recent image:', error);
    }
  };

  return { recentImages, saveRecentImage };
}