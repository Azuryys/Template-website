# Coordinate-Based Positioning System for Email Header Elements

## Overview

The email header template now uses a unified coordinate-based positioning system that allows precise placement of all four header elements (logo, image placeholder, color block, and textbox) via a single line of configuration in `lib/templates.js`.

## System Architecture

### Positioning Configuration Structure

Each element is positioned using **ratio-based coordinates** that are calculated relative to canvas dimensions:

```javascript
{
  widthRatio: 0.75,      // Element width as fraction of canvas width
  heightRatio: 0.3333,   // Element height as fraction of canvas height
  leftRatio: 0.125,      // Left edge as fraction of canvas width
  topRatio: 0.619        // Top edge as fraction of canvas height
}
```

**Calculation Formula:**
```
absoluteLeft = canvasWidth × leftRatio
absoluteTop = canvasHeight × topRatio
absoluteWidth = canvasWidth × widthRatio
absoluteHeight = canvasHeight × heightRatio
```

### Benefits of Ratio-Based Positioning

- **Responsive Design**: Elements scale proportionally with canvas dimensions
- **Template Reusability**: Same ratios work across different custom canvas sizes
- **Consistency**: All elements use identical positioning logic
- **Single-Line Configuration**: One object per element defines complete positioning

## Email Header Template Configuration

Located in `frontend/lib/templates.js`:

```javascript
'email-header': {
  id: 'email-header',
  name: 'Email Header',
  width: 1200,
  height: 630,
  description: 'Email header with image, text, and block',
  
  // Logo at top-right
  logo: { widthRatio: 0.15, leftRatio: 0.80, topRatio: 0.05 },
  
  // Grey square (image upload area) at top
  imagePlaceholder: { 
    leftRatio: 0, 
    topRatio: 0, 
    widthRatio: 1, 
    heightRatio: 0.7857
  },
  
  // Purple rectangle at bottom
  colorBlock: { 
    widthRatio: 0.75,
    heightRatio: 0.3333,
    leftRatio: 0.125,
    topRatio: 0.619
  },
  
  // Text content inside color block
  textBox: { 
    widthRatio: 0.75,
    heightRatio: 0.3333,
    leftRatio: 0.125,
    topRatio: 0.619,
    fontSize: 32,
    textAlign: 'center'
  }
}
```

## How It Works

### Implementation Flow

1. **Template Definition** (`templates.js`)
   - User defines positioning ratios for each element

2. **Initialization** (`templateInitializers.js`)
   - `initializeEmailHeader(template)` receives the template object
   - Converts ratios to absolute pixels using canvas dimensions
   - Creates Fabric.js objects with calculated positions

3. **Canvas Rendering** (`editor/[templateId]/page.js`)
   - Calls `getTemplateInitializer(templateId)` to get initializer function
   - Passes template object to initializer
   - Adds initialized elements to Fabric.js canvas

### Code Example: How Positioning Works

```javascript
// In templateInitializers.js
const imagePlaceholderWidth = CANVAS_WIDTH * imagePlaceholderConfig.widthRatio;
const imagePlaceholderHeight = CANVAS_HEIGHT * imagePlaceholderConfig.heightRatio;

const imagePlaceholder = new Rect({
  left: CANVAS_WIDTH * imagePlaceholderConfig.leftRatio,      // 0
  top: CANVAS_HEIGHT * imagePlaceholderConfig.topRatio,       // 0
  width: imagePlaceholderWidth,                                 // 1200px
  height: imagePlaceholderHeight,                               // ~495px
  fill: '#f3f4f6',
  // ... other properties
});
```

## Customization Guide

### Adjusting Element Positions

To reposition any element, modify the corresponding configuration object in `templates.js`:

#### Example 1: Move Color Block Upward
```javascript
colorBlock: { 
  widthRatio: 0.75,
  heightRatio: 0.3333,
  leftRatio: 0.125,
  topRatio: 0.500  // Changed from 0.619 (moved up ~41px)
}
```

#### Example 2: Make Text Box Wider
```javascript
textBox: { 
  widthRatio: 0.90,  // Changed from 0.75 (now 1080px instead of 900px)
  heightRatio: 0.3333,
  leftRatio: 0.05,   // Adjust to keep centered: (1 - 0.90) / 2 = 0.05
  topRatio: 0.619,
  fontSize: 32,
  textAlign: 'center'
}
```

#### Example 3: Reposition Logo to Top-Left
```javascript
logo: { 
  widthRatio: 0.15, 
  leftRatio: 0.05,   // Changed from 0.80 (move to left)
  topRatio: 0.05 
}
```

### Computing Ratios from Pixel Values

If you know pixel dimensions and want to convert to ratios:

```javascript
// Formula: ratio = pixelValue / canvasDimension
// For canvas 1200×630:

// Example: Logo at pixel position (960, 30) with 180px width
logoWidthRatio = 180 / 1200 = 0.15
logoLeftRatio = 960 / 1200 = 0.80
logoTopRatio = 30 / 630 = 0.0476

// Result: logo: { widthRatio: 0.15, leftRatio: 0.80, topRatio: 0.0476 }
```

## Configuration Reference

### For Logo
```javascript
logo: {
  widthRatio: number,  // Logo width
  leftRatio: number,   // Horizontal position
  topRatio: number     // Vertical position
  // heightRatio: not used (height auto-scales with width)
}
```

### For Image Placeholder (Grey Square)
```javascript
imagePlaceholder: {
  widthRatio: number,   // Usually 1.0 (full width)
  heightRatio: number,  // Typically 0.7857 (495px / 630px)
  leftRatio: number,    // Usually 0 (starts at left)
  topRatio: number      // Usually 0 (starts at top)
}
```

### For Color Block (Purple Rectangle)
```javascript
colorBlock: {
  widthRatio: number,   // Usually 0.75 (900px / 1200px)
  heightRatio: number,  // Usually 0.3333 (210px / 630px)
  leftRatio: number,    // Horizontally center: (1 - widthRatio) / 2
  topRatio: number      // Vertical position (default: 0.619)
}
```

### For Text Box
```javascript
textBox: {
  widthRatio: number,   // Should match colorBlock widthRatio
  heightRatio: number,  // Should match colorBlock heightRatio
  leftRatio: number,    // Should match colorBlock leftRatio
  topRatio: number,     // Should match colorBlock topRatio
  fontSize: number,     // Default: 32
  textAlign: string     // 'center', 'left', 'right', etc.
}
```

## File References

### Key Files Modified
- **[templates.js](lib/templates.js)** - Template configurations with ratio-based positioning
- **[templateInitializers.js](lib/templateInitializers.js)** - Converts ratios to canvas objects
- **[editor/[templateId]/page.js](app/editor/[templateId]/page.js)** - Passes template to initializer

### Data Flow
```
templates.js (configuration)
    ↓
getTemplate(templateId) returns template object with all positioning configs
    ↓
editor/[templateId]/page.js calls getTemplateInitializer(templateId)
    ↓
templateInitializers.js receives template and creates Fabric.js objects
    ↓
Elements are added to canvas with ratio-based positioning
```

## Default Email Header Dimensions

For reference when calculating ratios:

| Element | Pixel Dimensions | Canvas Ratios |
|---------|------------------|---------------|
| Canvas | 1200×630 | — |
| Logo | ~180×60 | widthRatio: 0.15 |
| Image Placeholder | 1200×495 | widthRatio: 1, heightRatio: 0.7857 |
| Color Block | 900×210 | widthRatio: 0.75, heightRatio: 0.3333 |
| Textbox | 900×210 | widthRatio: 0.75, heightRatio: 0.3333 |

## Quick Start: Adding a New Element

To add a fifth element with coordinate-based positioning:

1. **Add to templates.js:**
```javascript
'email-header': {
  // ... existing configs
  myNewElement: {
    widthRatio: 0.5,
    heightRatio: 0.2,
    leftRatio: 0.25,
    topRatio: 0.8
  }
}
```

2. **Update templateInitializers.js:**
```javascript
const myNewElementConfig = template.myNewElement || { /* defaults */ };
const myNewElement = new Rect({
  left: CANVAS_WIDTH * myNewElementConfig.leftRatio,
  top: CANVAS_HEIGHT * myNewElementConfig.topRatio,
  width: CANVAS_WIDTH * myNewElementConfig.widthRatio,
  height: CANVAS_HEIGHT * myNewElementConfig.heightRatio,
  // ... other properties
});
elements.push(myNewElement);
```

## Testing Your Configuration

1. Navigate to `/editor/email-header`
2. Verify all four elements appear and are positioned correctly:
   - Grey square at top (image placeholder)
   - Purple rectangle at bottom (color block)
   - White text centered in purple box (textbox)
   - Logo at top-right corner
3. Modify ratios in `templates.js` and refresh to see changes instantly

## Troubleshooting

### Elements Not Appearing
- Check that temperature configuration includes all required ratio properties
- Verify canvas dimensions match expected values (1200×630 for email-header)

### Elements Overlapping Incorrectly
- Ensure z-index ordering in `templateInitializers.js` matches desired stacking
- Image placeholder should render first, then color block, then textbox

### Positioning Doesn't Match Expected Pixels
- Verify ratio calculations: `pixel_value / canvas_dimension = ratio`
- Example: 300px width on 1200px canvas = 0.25 ratio
