import { useState, useEffect } from 'react';

export function useTemplates(templateId) {
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [selectedLoadTemplate, setSelectedLoadTemplate] = useState(null);

  const fetchSavedTemplates = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/templates', { credentials: 'include' });
      const data = await response.json();

      if (!response.ok) throw new Error(data?.error || 'Falha ao carregar templates guardados');

      const templates = Array.isArray(data.templates) ? data.templates : [];
      setSavedTemplates(templates);

      try {
        localStorage.setItem('savedTemplates', JSON.stringify(templates));
      } catch (storageError) {
        console.error('Error caching backup locally:', storageError);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      try {
        const fallback = JSON.parse(localStorage.getItem('savedTemplates') || '[]');
        setSavedTemplates(fallback);
      } catch (e) {}
    }
  };

  useEffect(() => {
    fetchSavedTemplates();
  }, [templateId]);

  return {
    savedTemplates,
    showSaveModal,
    setShowSaveModal,
    templateName,
    setTemplateName,
    showLoadModal,
    setShowLoadModal,
    selectedLoadTemplate,
    setSelectedLoadTemplate,
    fetchSavedTemplates,
  };
}