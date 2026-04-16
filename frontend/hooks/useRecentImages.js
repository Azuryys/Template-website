import { useState, useEffect } from 'react';

export function useRecentImages() {
  const [recentImages, setRecentImages] = useState([]);

  useEffect(() => {
    try {
      const savedRecentImages = JSON.parse(localStorage.getItem('recentImages') || '[]');
      
      // Filter images to only include those from the past 7 days
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const filteredImages = savedRecentImages.filter((img) => {
        // Handle missing or invalid date fields gracefully
        if (!img.uploadedAt) {
          return false;
        }
        try {
          const imgDate = new Date(img.uploadedAt);
          // Check if date is valid and within 7 days
          return !isNaN(imgDate.getTime()) && imgDate >= sevenDaysAgo;
        } catch (e) {
          return false;
        }
      });
      
      // Slice to 20 after filtering by date
      const recentImages20 = filteredImages.slice(0, 20);
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