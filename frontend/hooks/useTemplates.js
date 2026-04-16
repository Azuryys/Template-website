import { useState, useEffect } from 'react';
import { buildApiUrl } from '../lib/api';

export function useTemplates(templateId) {
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [selectedLoadTemplate, setSelectedLoadTemplate] = useState(null);

  const fetchSavedTemplates = async () => {
    try {
      const response = await fetch(buildApiUrl('/api/templates'), { credentials: 'include' });

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