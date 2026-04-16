// Template configurations for different banner sizes.
//
// Coordinate-based positioning system for all elements using ratios:
//
// Each element (logo, imagePlaceholder, colorBlock, textBox) can have placement config:
//   widthRatio   — element width as a fraction of canvas width  (e.g. 0.4 = 40%)
//   heightRatio  — element height as a fraction of canvas height (optional)
//   leftRatio    — left edge as a fraction of canvas width
//   topRatio     — top edge as a fraction of canvas height
//
// For email-header template, configure all four header elements:
// - logo: Top-right corner logo image
// - imagePlaceholder: Grey square at top (image upload area)
// - colorBlock: Purple rectangle at bottom (main content area)
// - textBox: Text content inside colorBlock
//
// Single-line positioning: Update ratios to adjust element positions on canvas.
export const templates = {
  // --- Portrait / Tall Formats ---
  'half-page-ad': {
    id: 'half-page-ad',
    name: 'Half Page Ad',
    width: 300,
    height: 600,
    description: 'Standard half-page ad unit',
    logo: { widthRatio: 0.40, leftRatio: 0.24, topRatio: 0.08 }
  },
  'portrait-banner': {
    id: 'portrait-banner',
    name: 'Portrait Banner',
    width: 200,
    height: 700,
    description: 'Tall portrait banner format',
    logo: { widthRatio: 0.40, leftRatio: 0.24, topRatio: 0.05 }
  },
  'wide-skyscraper': {
    id: 'wide-skyscraper',
    name: 'Wide Skyscraper',
    width: 160,
    height: 600,
    description: 'Vertical sidebar banner',
    logo: { widthRatio: 0.40, leftRatio: 0.24, topRatio: 0.04 }
  },
  'skyscraper': {
    id: 'skyscraper',
    name: 'Skyscraper',
    width: 120,
    height: 600,
    description: 'Narrow vertical skyscraper',
    logo: { widthRatio: 0.40, leftRatio: 0.5, topRatio: 0.04 }
  },
  'vertical-banner': {
    id: 'vertical-banner',
    name: 'Vertical Banner',
    width: 120,
    height: 240,
    description: 'Small vertical banner',
    logo: { widthRatio: 0.40, leftRatio: 0.24, topRatio: 0.08 }
  },
  'mobile-fullscreen': {
    id: 'mobile-fullscreen',
    name: 'Mobile Fullscreen',
    width: 1080,
    height: 1920,
    description: 'Mobile full-screen / story format',
    logo: { widthRatio: 0.2, leftRatio: 0.12, topRatio: 0.04 }
  },
  // --- Landscape / Wide Formats ---
  'pop-under': {
    id: 'pop-under',
    name: 'Pop-Under',
    width: 720,
    height: 300,
    description: 'Wide landscape banner',
    logo: { widthRatio: 0.20, leftRatio: 0.12, topRatio: 0.18 }
  },
  '3-1-rectangle': {
    id: '3-1-rectangle',
    name: '3:1 Rectangle',
    width: 300,
    height: 100,
    description: 'Wide 3:1 ratio rectangle',
    logo: { widthRatio: 0.20, leftRatio: 0.12, topRatio: 0.20 }
  },
  // --- Rectangle / Square Formats ---
  'medium-rectangle': {
    id: 'medium-rectangle',
    name: 'Medium Rectangle',
    width: 300,
    height: 250,
    description: 'Common sidebar ad size',
    logo: { widthRatio: 0.20, leftRatio: 0.12, topRatio: 0.1 }
  },
  'large-rectangle': {
    id: 'large-rectangle',
    name: 'Large Rectangle',
    width: 336,
    height: 280,
    description: 'Larger inline content ad',
    logo: { widthRatio: 0.20, leftRatio: 0.5, topRatio: 0.1 }
  },
  'square-pop-up': {
    id: 'square-pop-up',
    name: 'Square Pop-Up',
    width: 250,
    height: 250,
    description: 'Square pop-up banner',
    logo: { widthRatio: 0.20, leftRatio: 0.5, topRatio: 0.08 }
  },
  'small-rectangle': {
    id: 'small-rectangle',
    name: 'Small Rectangle',
    width: 180,
    height: 150,
    description: 'Compact rectangle ad',
    logo: { widthRatio: 0.20, leftRatio: 0.85, topRatio: 0.1 }
  },
  'wide-skyscraper-alt': {
    id: 'wide-skyscraper-alt',
    name: 'Wide Skyscraper Alt',
    width: 240,
    height: 400,
    description: 'Alternative wide skyscraper',
    logo: { widthRatio: 0.40, leftRatio: 0.08, topRatio: 0.05 }
  },
  // --- Print Format ---
  'din-a4': {
    id: 'din-a4',
    name: 'DIN A4',
    width: 595,
    height: 842,
    description: 'Standard A4 print format (72 DPI)',
    logo: { widthRatio: 0.20, leftRatio: 0.06, topRatio: 0.04 }
  },
  // --- Email Header ---
  'email-header': {
    id: 'email-header',
    name: 'Email Header',
    width: 1000,
    height: 630,
    description: 'Email header with image, text, and block',
    logo: { widthRatio: 0.15, leftRatio: 0.80, topRatio: 0.05 },
    audioLogo: { 
    widthRatio: 0.7  , 
    horizontalStretch: 1.2 ,
    verticalStretch: 1.1 ,
    leftRatio: 0.773, 
    topRatio: 0.332 ,
},

    // Image placeholder (grey square at top)
    imagePlaceholder: { 
      leftRatio: 0.5, 
      topRatio: 0.45, 
      widthRatio: 1, 
      heightRatio: 0.9 // 495px / 630px
    },
    // Color block (purple rectangle at bottom)
    colorBlock: { 
      widthRatio: 0.9,     // 900px / 1200px
      heightRatio: 0.3333,  // 210px / 630px
      leftRatio: 0.501,     // 150px / 1200px (centered)
      topRatio: 0.825       // 390px / 630px
    },
    // Text box (content inside color block)
    textBox: { 
      widthRatio: 0.9,     // 900px / 1200px
      heightRatio: 0.3333,  // 210px / 630px
      leftRatio: 0.05,     // 150px / 1200px
      topRatio: 0.75,      // 390px / 630px
      fontSize: 80,
      textAlign: 'center'
    }
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
