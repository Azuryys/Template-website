// Template configurations for different banner sizes
export const templates = {
  // --- Portrait / Tall Formats ---
  'half-page-ad': {
    id: 'half-page-ad',
    name: 'Half Page Ad',
    width: 300,
    height: 600,
    description: 'Standard half-page ad unit'
  },
  'portrait-banner': {
    id: 'portrait-banner',
    name: 'Portrait Banner',
    width: 200,
    height: 700,
    description: 'Tall portrait banner format'
  },
  'wide-skyscraper': {
    id: 'wide-skyscraper',
    name: 'Wide Skyscraper',
    width: 160,
    height: 600,
    description: 'Vertical sidebar banner'
  },
  'skyscraper': {
    id: 'skyscraper',
    name: 'Skyscraper',
    width: 120,
    height: 600,
    description: 'Narrow vertical skyscraper'
  },
  'vertical-banner': {
    id: 'vertical-banner',
    name: 'Vertical Banner',
    width: 120,
    height: 240,
    description: 'Small vertical banner'
  },
  'mobile-fullscreen': {
    id: 'mobile-fullscreen',
    name: 'Mobile Fullscreen',
    width: 1080,
    height: 1920,
    description: 'Mobile full-screen / story format'
  },
  // --- Landscape / Wide Formats ---
  'pop-under': {
    id: 'pop-under',
    name: 'Pop-Under',
    width: 720,
    height: 300,
    description: 'Wide landscape banner'
  },
  '3-1-rectangle': {
    id: '3-1-rectangle',
    name: '3:1 Rectangle',
    width: 300,
    height: 100,
    description: 'Wide 3:1 ratio rectangle'
  },
  // --- Rectangle / Square Formats ---
  'medium-rectangle': {
    id: 'medium-rectangle',
    name: 'Medium Rectangle',
    width: 300,
    height: 250,
    description: 'Common sidebar ad size'
  },
  'large-rectangle': {
    id: 'large-rectangle',
    name: 'Large Rectangle',
    width: 336,
    height: 280,
    description: 'Larger inline content ad'
  },
  'square-pop-up': {
    id: 'square-pop-up',
    name: 'Square Pop-Up',
    width: 250,
    height: 250,
    description: 'Square pop-up banner'
  },
  'small-rectangle': {
    id: 'small-rectangle',
    name: 'Small Rectangle',
    width: 180,
    height: 150,
    description: 'Compact rectangle ad'
  },
  'wide-skyscraper-alt': {
    id: 'wide-skyscraper-alt',
    name: 'Wide Skyscraper Alt',
    width: 240,
    height: 400,
    description: 'Alternative wide skyscraper'
  },
  // --- Print Format ---
  'din-a4': {
    id: 'din-a4',
    name: 'DIN A4',
    width: 595,
    height: 842,
    description: 'Standard A4 print format (72 DPI)'
  }
};

// Get template by ID
export const getTemplate = (templateId) => {
  return templates[templateId] || templates['email-header'];
};

// Get all templates as array
export const getAllTemplates = () => {
  return Object.values(templates);
};
