import { Rect, Textbox } from 'fabric';

/**
 * Initialize email header template with coordinate-based positioning
 * @param {Object} template - Template configuration from templates.js
 * @returns {Array} Array of Fabric objects
 */
export const initializeEmailHeader = (template) => {
  const elements = [];

  // Canvas dimensions
  const CANVAS_WIDTH = template.width || 1200;
  const CANVAS_HEIGHT = template.height || 630;

  // Get positioning configurations from template
  const imagePlaceholderConfig = template.imagePlaceholder || {
    leftRatio: 0,
    topRatio: 0,
    widthRatio: 1,
    heightRatio: 0.7857
  };
  const colorBlockConfig = template.colorBlock || {
    widthRatio: 0.75,
    heightRatio: 0.3333,
    leftRatio: 0.125,
    topRatio: 0.619
  };
  const textBoxConfig = template.textBox || {
    widthRatio: 0.75,
    heightRatio: 0.3333,
    leftRatio: 0.125,
    topRatio: 0.619,
    fontSize: 32,
    textAlign: 'center'
  };

  // Create image placeholder (grey square) using ratio-based positioning
  const imagePlaceholderWidth = CANVAS_WIDTH * imagePlaceholderConfig.widthRatio;
  const imagePlaceholderHeight = CANVAS_HEIGHT * imagePlaceholderConfig.heightRatio;
  const imagePlaceholder = new Rect({
    left: CANVAS_WIDTH * imagePlaceholderConfig.leftRatio,
    top: CANVAS_HEIGHT * imagePlaceholderConfig.topRatio,
    width: imagePlaceholderWidth,
    height: imagePlaceholderHeight,
    fill: '#f3f4f6',
    stroke: '#d1d5db',
    strokeWidth: 2,
    hasControls: true,
    selectable: true,
    name: 'imagePlaceholder',
    isPlaceholder: true,
    hoverCursor: 'pointer',
  });
  elements.push(imagePlaceholder);

  // Color block (purple rectangle) using ratio-based positioning
  const colorBlockWidth = CANVAS_WIDTH * colorBlockConfig.widthRatio;
  const colorBlockHeight = CANVAS_HEIGHT * colorBlockConfig.heightRatio;
  const colorBlock = new Rect({
    left: CANVAS_WIDTH * colorBlockConfig.leftRatio,
    top: CANVAS_HEIGHT * colorBlockConfig.topRatio,
    width: colorBlockWidth,
    height: colorBlockHeight,
    fill: '#4700a3',
    rx: 10,
    ry: 10,
    hasControls: true,
    selectable: true,
    name: 'colorBlock',
  });
  elements.push(colorBlock);

  // Text box using ratio-based positioning
  const textBoxWidth = CANVAS_WIDTH * textBoxConfig.widthRatio;
  const textBoxHeight = CANVAS_HEIGHT * textBoxConfig.heightRatio;
const textBox = new Textbox('Coloque Texto', {
  left: CANVAS_WIDTH * textBoxConfig.leftRatio,
  top: CANVAS_HEIGHT * textBoxConfig.topRatio, // ✅ removed the centering offset
  width: textBoxWidth,
  fontSize: textBoxConfig.fontSize || 32,
  fontFamily: 'BauerMediaSans',
  fontWeight: 400,
  fill: '#ffffff',
  textAlign: textBoxConfig.textAlign || 'center',
  hasControls: true,
  selectable: true,
  editable: true,
  name: 'textBox',
  originX: 'left', // ✅ added
  originY: 'top',  // ✅ added
});
  elements.push(textBox);

  return elements;
};

export const getTemplateInitializer = (templateId) => {
  const initializers = {
    'email-header': initializeEmailHeader,
  };
  return initializers[templateId] || null;
};