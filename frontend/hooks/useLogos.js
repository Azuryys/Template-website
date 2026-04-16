import { useState, useEffect, useMemo } from 'react';

export function useLogos() {
  const [logoLibrary, setLogoLibrary] = useState([]);

  useEffect(() => {
    const loadLogoLibrary = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/logos', {
          credentials: 'include',
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || 'Falha ao carregar logos');
        }

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