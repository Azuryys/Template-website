import { useState, useEffect, useMemo } from 'react';
import { buildApiUrl } from '../lib/api';

export function useLogos() {
  const [logoLibrary, setLogoLibrary] = useState([]);

  useEffect(() => {
    const loadLogoLibrary = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/logos'), {
          credentials: 'include',
        });

        if (!response.ok) {
          let errorMessage = `HTTP ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData?.error || errorMessage;
          } catch (e) {
            try {
              errorMessage = await response.text();
            } catch (textError) {
              // Use default error message
            }
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        setLogoLibrary(Array.isArray(data.logos) ? data.logos : []);
      } catch (error) {
        console.error('Error loading logo library:', error);
        setLogoLibrary([]);
      }
    };
    loadLogoLibrary();
  }, []);

  const logoImages = useMemo(
    () => logoLibrary.filter((item) => item.category === 'logo'),
    [logoLibrary]
  );

  const audioLogoImages = useMemo(
    () => logoLibrary.filter((item) => item.category === 'audio'),
    [logoLibrary]
  );

  return { logoImages, audioLogoImages };
}