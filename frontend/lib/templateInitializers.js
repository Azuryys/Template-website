import { Rect, Textbox, FabricImage } from 'fabric';

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

/**
 * Initialize card template - creates front and back sides with actual card images
 * @param {Object} template - Template configuration from templates.js
 * @returns {Promise<Array>} Promise resolving to array of Fabric objects
 */
export const initializeCard = async (template) => {
  const elements = [];
  const CANVAS_WIDTH = template.width || 609;
  const CANVAS_HEIGHT = template.height || 853;

  // Map card type to image names
  const cardTypeMap = {
    'temporario': 'TEMPORARIO',
    'colaborador': 'COLABORADOR',
    'visitante': 'VISITANTE'
  };

  const cardTypeDisplay = cardTypeMap[template.cardType] || 'TEMPORARIO';
  const frontImageUrl = `/BauerImages/Cards/cartao-BAUER-BMAP-${cardTypeDisplay}-curves-1.png`;
  const backImageUrl = `/BauerImages/Cards/cartao-BAUER-BMAP-${cardTypeDisplay}-curves-2.png`;

  try {
    // Load front side image
    const frontImg = await FabricImage.fromURL(frontImageUrl, { crossOrigin: 'anonymous' });
    const frontScale = CANVAS_WIDTH / frontImg.width;
    frontImg.set({
      left: CANVAS_WIDTH / 2,
      top: CANVAS_HEIGHT / 2,
      originX: 'center',
      originY: 'center',
      scaleX: frontScale,
      scaleY: (CANVAS_HEIGHT / frontImg.height),
      selectable: false,
      evented: false,
      name: 'cardFrontImage',
      cardSide: 'front',
      visible: true
    });
    elements.push(frontImg);

    // Load back side image
    const backImg = await FabricImage.fromURL(backImageUrl, { crossOrigin: 'anonymous' });
    const backScale = CANVAS_WIDTH / backImg.width;
    backImg.set({
      left: CANVAS_WIDTH / 2,
      top: CANVAS_HEIGHT / 2,
      originX: 'center',
      originY: 'center',
      scaleX: backScale,
      scaleY: (CANVAS_HEIGHT / backImg.height),
      selectable: false,
      evented: false,
      name: 'cardBackImage',
      cardSide: 'back',
      visible: false
    });
    elements.push(backImg);

    // Name textbox configuration (ratio-based) — reads from template.nameTextBox
    const nameConfig = template.nameTextBox || {
      leftRatio: 0.08,
      topRatio: 0.35,
      widthRatio: 0.84,
      heightRatio: 0.1,
      fontSize: 36,
      textAlign: 'left'
    };

    // Add editable name field on top of back image using ratio-based positioning
    const nameWidth = CANVAS_WIDTH * nameConfig.widthRatio;
    const centerX = CANVAS_WIDTH * (nameConfig.leftRatio + (nameConfig.widthRatio / 2));
    const centerY = CANVAS_HEIGHT * (nameConfig.topRatio + (nameConfig.heightRatio / 2));

    const backName = new Textbox('Enter Name', {
      left: centerX,
      top: centerY,
      width: nameWidth,
      fontSize: nameConfig.fontSize || 36,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#1F0E7C',
      textAlign: nameConfig.textAlign || 'left',
      selectable: true,
      editable: true,
      evented: true,
      name: 'cardBackName',
      cardSide: 'back',
      visible: false,
      originX: 'center',
      originY: 'top',
      hasControls: false
    });
    backName.set({ top: centerY - (backName.getScaledHeight() / 2) });
    backName.setCoords();
    elements.push(backName);

  } catch (error) {
    console.error('Error loading card images:', error);
    // Fallback to colored rectangles if images fail to load
    const fallbackBg = new Rect({
      left: 0,
      top: 0,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      fill: template.frontBackgroundColor || '#F5A497',
      selectable: false,
      evented: false,
      name: 'cardFallbackBg',
      cardSide: 'front'
    });
    elements.push(fallbackBg);

    const fallbackBackBg = new Rect({
      left: 0,
      top: 0,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      fill: template.backBackgroundColor || '#F5D4C8',
      selectable: false,
      evented: false,
      name: 'cardFallbackBackBg',
      cardSide: 'back',
      visible: false
    });
    elements.push(fallbackBackBg);

    const fbNameCfg = template?.nameTextBox || { leftRatio: 0.08, topRatio: 0.35, widthRatio: 0.84, heightRatio: 0.1, fontSize: 36 };
    const fbWidth = CANVAS_WIDTH * fbNameCfg.widthRatio;
    const fbCenterX = CANVAS_WIDTH * (fbNameCfg.leftRatio + (fbNameCfg.widthRatio / 2));
    const fbCenterY = CANVAS_HEIGHT * (fbNameCfg.topRatio + (fbNameCfg.heightRatio / 2));

    const fallbackName = new Textbox('Enter Name', {
      left: fbCenterX,
      top: fbCenterY,
      width: fbWidth,
      fontSize: (fbNameCfg.fontSize) || 36,
      fontFamily: 'Arial',
      fontWeight: 'bold',
      fill: '#1F0E7C',
      textAlign: fbNameCfg.textAlign || 'left',
      selectable: true,
      editable: true,
      evented: true,
      name: 'cardBackName',
      cardSide: 'back',
      visible: false,
      originX: 'center',
      originY: 'top',
      hasControls: false
    });
    fallbackName.set({ top: fbCenterY - (fallbackName.getScaledHeight() / 2) });
    fallbackName.setCoords();
    elements.push(fallbackName);
  }

  return elements;
};

export const getTemplateInitializer = (templateId) => {
  const initializers = {
    'email-header': initializeEmailHeader,
    'card-temporario': initializeCard,
    'card-colaborador': initializeCard,
    'card-visitante': initializeCard,
  };
  return initializers[templateId] || null;
};