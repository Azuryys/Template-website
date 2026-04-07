// Template configurations for different banner sizes
export const templates = {
  'email-header': {
    id: 'email-header',
    name: 'Email Header',
    width: 600,
    height: 200,
    description: 'Perfect for email newsletters and headers'
  },
  'website-header': {
    id: 'website-header',
    name: 'Website Header',
    width: 1920,
    height: 400,
    description: 'Full-width website banner'
  },
  'leaderboard': {
    id: 'leaderboard',
    name: 'Leaderboard',
    width: 728,
    height: 90,
    description: 'Standard leaderboard banner ad'
  },
  'medium-rectangle': {
    id: 'medium-rectangle',
    name: 'Medium Rectangle',
    width: 300,
    height: 250,
    description: 'Common sidebar ad size'
  },
  'wide-skyscraper': {
    id: 'wide-skyscraper',
    name: 'Wide Skyscraper',
    width: 160,
    height: 600,
    description: 'Vertical sidebar banner'
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
