import { Rect, Textbox } from 'fabric';

export const initializeEmailHeader = () => {
  const elements = [];

  // Canvas dimensions
  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 630;

  // Block dimensions & position (centered, near bottom)
  const blockWidth = 900;
  const blockHeight = 210;
  const blockLeft = (CANVAS_WIDTH - blockWidth) / 2; // 150
  const blockBottomMargin = 30;
  const blockTop = CANVAS_HEIGHT - blockHeight - blockBottomMargin; // 390

  // Image placeholder: full width, top=0, ends at vertical midpoint of block
  const blockMidY = blockTop + blockHeight / 2; // 495
  const imagePlaceholder = new Rect({
    left: 0,
    top: 0,
    width: CANVAS_WIDTH,
    height: blockMidY, // reaches halfway into the block
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

  // Color block: centered, near bottom (added after image so it renders on top)
  const colorBlock = new Rect({
    left: blockLeft,
    top: blockTop,
    width: blockWidth,
    height: blockHeight,
    fill: '#4700a3',
    rx: 10,
    ry: 10,
    hasControls: true,
    selectable: true,
    name: 'colorBlock',
  });
  elements.push(colorBlock);

  // Text: centered over the block, added last so it's in front
  const textBox = new Textbox('Coloque Texto', {
    left: blockLeft,
    top: blockTop + (blockHeight / 2) - 20, // vertically centered in block
    width: blockWidth,
    fontSize: 32,
    fontFamily: 'BauerMediaSans',
    fontWeight: 400,
    fill: '#ffffff', // white text over purple block
    textAlign: 'center',
    hasControls: true,
    selectable: true,
    editable: true,
    name: 'textBox',
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