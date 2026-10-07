/* ==========================================================================
   Virtual Jewellery Wearable System
   Jewellery Positioning & Transformation Engine
   ========================================================================== */

/*
 * MediaPipe FaceMesh landmark indices
 *
 * 152  = Chin
 * 10   = Forehead
 * 9    = Between eyebrows / Bindi area
 * 1    = Nose tip
 * 168  = Nose bridge
 * 240  = Left nostril area
 * 460  = Right nostril area
 * 127  = Left side of face (temple)
 * 356  = Right side of face (temple)
 * 172  = Left jaw
 * 397  = Right jaw
 * 33   = Left eye (outer corner)
 * 263  = Right eye (outer corner)
 */

const LANDMARKS = {
  CHIN: 152,
  FOREHEAD: 10,
  GLABELLA: 9,

  NOSE_TIP: 1,
  NOSE_BRIDGE: 168,

  LEFT_NOSTRIL: 240,
  RIGHT_NOSTRIL: 460,

  LEFT_EAR: 127,
  RIGHT_EAR: 356,

  JAW_LEFT: 172,
  JAW_RIGHT: 397,

  LEFT_EYE: 33,
  RIGHT_EYE: 263
};


/* ==========================================================================
   SAFETY HELPERS
   ========================================================================== */

/**
 * Check whether a landmark exists and has valid coordinates.
 */
function isValidLandmark(point) {
  return (
    point &&
    typeof point.x === "number" &&
    typeof point.y === "number" &&
    Number.isFinite(point.x) &&
    Number.isFinite(point.y)
  );
}


/**
 * Get a landmark safely.
 */
function getLandmark(landmarks, index) {
  if (!landmarks || !landmarks[index]) {
    return null;
  }

  return landmarks[index];
}


/**
 * Convert MediaPipe normalized coordinates to canvas coordinates.
 */
function toCanvasCoords(landmark, canvasWidth, canvasHeight) {
  if (!isValidLandmark(landmark)) {
    return {
      x: canvasWidth / 2,
      y: canvasHeight / 2
    };
  }

  return {
    x: landmark.x * canvasWidth,
    y: landmark.y * canvasHeight
  };
}


/**
 * Calculate Euclidean distance between two landmarks.
 */
function getDistance(p1, p2, width = 1, height = 1) {

  if (!isValidLandmark(p1) || !isValidLandmark(p2)) {
    return 0;
  }

  const dx = (p1.x - p2.x) * width;
  const dy = (p1.y - p2.y) * height;

  return Math.sqrt((dx * dx) + (dy * dy));
}


/**
 * Calculate head roll angle.
 */
function getHeadRollAngle(landmarks) {

  const leftEye = getLandmark(
    landmarks,
    LANDMARKS.LEFT_EYE
  );

  const rightEye = getLandmark(
    landmarks,
    LANDMARKS.RIGHT_EYE
  );

  if (!isValidLandmark(leftEye) || !isValidLandmark(rightEye)) {
    return 0;
  }

  return Math.atan2(
    rightEye.y - leftEye.y,
    rightEye.x - leftEye.x
  );
}


/* ==========================================================================
   BINDI
   ========================================================================== */

function calculateBindiPosition(
  landmarks,
  width,
  height,
  itemConfig = {}
) {

  const glabella = getLandmark(
    landmarks,
    LANDMARKS.GLABELLA
  );

  const leftEye = getLandmark(
    landmarks,
    LANDMARKS.LEFT_EYE
  );

  const rightEye = getLandmark(
    landmarks,
    LANDMARKS.RIGHT_EYE
  );

  const glabellaPoint = toCanvasCoords(
    glabella,
    width,
    height
  );

  const eyeDistance = getDistance(
    leftEye,
    rightEye,
    width,
    height
  );

  const scale =
    eyeDistance * (itemConfig.scaleFactor || 0.16);

  const angle = getHeadRollAngle(landmarks);

  return {
    x:
      glabellaPoint.x +
      (itemConfig.offsetX || 0) * eyeDistance,

    y:
      glabellaPoint.y +
      (itemConfig.offsetY || 0) * eyeDistance,

    width: scale,
    height: scale,
    angle: angle
  };
}


/* ==========================================================================
   TIKKA
   ========================================================================== */

function calculateTikkaPosition(
  landmarks,
  width,
  height,
  itemConfig = {}
) {

  const forehead = getLandmark(
    landmarks,
    LANDMARKS.FOREHEAD
  );

  const glabella = getLandmark(
    landmarks,
    LANDMARKS.GLABELLA
  );

  const chin = getLandmark(
    landmarks,
    LANDMARKS.CHIN
  );

  const foreheadPoint = toCanvasCoords(
    forehead,
    width,
    height
  );

  const glabellaPoint = toCanvasCoords(
    glabella,
    width,
    height
  );

  const faceHeight = getDistance(
    forehead,
    chin,
    width,
    height
  );

  const scale =
    faceHeight * (itemConfig.scaleFactor || 0.5);

  const angle = getHeadRollAngle(landmarks);

  const centerX =
    (foreheadPoint.x + glabellaPoint.x) / 2;

  const centerY =
    (foreheadPoint.y + glabellaPoint.y) / 2;

  return {
    x: centerX,

    y:
      centerY +
      (itemConfig.offsetY || 0) * faceHeight,

    width: scale * 0.55,
    height: scale,

    angle: angle
  };
}


/* ==========================================================================
   NOSE RING
   ========================================================================== */

function calculateNoseRingPosition(
  landmarks,
  width,
  height,
  itemConfig = {}
) {

  /*
   * Use the NOSE TIP as the main anchor.
   *
   * This is more reliable than using only one nostril because
   * the nose tip stays near the center of the nose.
   */

  const noseTip = getLandmark(
    landmarks,
    LANDMARKS.NOSE_TIP
  );

  const noseBridge = getLandmark(
    landmarks,
    LANDMARKS.NOSE_BRIDGE
  );

  const leftNostril = getLandmark(
    landmarks,
    LANDMARKS.LEFT_NOSTRIL
  );

  const rightNostril = getLandmark(
    landmarks,
    LANDMARKS.RIGHT_NOSTRIL
  );

  const leftEar = getLandmark(
    landmarks,
    LANDMARKS.LEFT_EAR
  );

  const rightEar = getLandmark(
    landmarks,
    LANDMARKS.RIGHT_EAR
  );


  /*
   * Prefer nose tip.
   * If unavailable, use the midpoint between nostrils.
   */

  let anchor;

  if (isValidLandmark(noseTip)) {

    anchor = noseTip;

  } else if (
    isValidLandmark(leftNostril) &&
    isValidLandmark(rightNostril)
  ) {

    anchor = {
      x: (leftNostril.x + rightNostril.x) / 2,
      y: (leftNostril.y + rightNostril.y) / 2
    };

  } else if (isValidLandmark(noseBridge)) {

    anchor = noseBridge;

  } else {

    anchor = {
      x: 0.5,
      y: 0.5
    };
  }


  const nosePoint = toCanvasCoords(
    anchor,
    width,
    height
  );


  /*
   * Face width is used only to determine jewellery size.
   */

  const faceWidth = getDistance(
    leftEar,
    rightEar,
    width,
    height
  );


  const safeFaceWidth =
    faceWidth > 0 ? faceWidth : width * 0.3;


  const scale =
    safeFaceWidth *
    (itemConfig.scaleFactor || 0.18);


  const angle = getHeadRollAngle(landmarks);


  return {

    x:
      nosePoint.x +
      (itemConfig.offsetX || 0) * safeFaceWidth,

    y:
      nosePoint.y +
      (itemConfig.offsetY || 0.05) * safeFaceWidth,

    width: scale,
    height: scale,

    angle: angle
  };
}


/* ==========================================================================
   EARRINGS

   Placed relative to the eyes, so they scale with distance from the camera
   and follow head tilt. All values are fractions of the eye-to-eye distance.

   Starting values were measured from three webcam screenshots of a face
   looking straight at the camera. If they need adjusting, change them in
   small steps (about 0.02), one at a time, or pass them per item in
   itemConfig:

     outward : higher = earrings move away from the face
     drop    : higher = earrings move down
     size    : higher = bigger earrings

   Returned x / y is the CENTRE of the earring image.
   ========================================================================== */

function calculateEarringPosition(landmarks, width, height, itemConfig = {}) {

  const outward = itemConfig.outward ?? 0.10;  // outside the outer eye corner
  const drop    = itemConfig.drop    ?? 0.30;  // below the eye line (to the lobe)
  const size    = itemConfig.size    ?? 0.20;  // earring width

  const leftEye  = getLandmark(landmarks, LANDMARKS.LEFT_EYE);
  const rightEye = getLandmark(landmarks, LANDMARKS.RIGHT_EYE);
  const nose     = getLandmark(landmarks, LANDMARKS.NOSE_TIP);

  if (
    !isValidLandmark(leftEye) ||
    !isValidLandmark(rightEye) ||
    !isValidLandmark(nose)
  ) {
    return null;
  }

  const eyeDist = getDistance(leftEye, rightEye, width, height);
  const leftPx  = toCanvasCoords(leftEye,  width, height);
  const rightPx = toCanvasCoords(rightEye, width, height);

  // Directions that rotate with head tilt
  const angle    = getHeadRollAngle(landmarks);
  const rightDir = { x: Math.cos(angle),  y: Math.sin(angle) };
  const downDir  = { x: -Math.sin(angle), y: Math.cos(angle) };

  const earringWidth  = eyeDist * size;
  const earringHeight = earringWidth * 1.6;

  // Eye line -> lobe, plus part of the earring height so the top of the
  // earring (stud) sits on the lobe when the image is drawn from its centre.
  const downPx    = eyeDist * drop + earringHeight * 0.38;
  const outwardPx = eyeDist * outward;

  // Hide the far-side earring when the head is turned
  const turn = (nose.x - leftEye.x) / ((rightEye.x - nose.x) || 0.0001);

  return {
    left: {
      x: leftPx.x - rightDir.x * outwardPx + downDir.x * downPx,
      y: leftPx.y - rightDir.y * outwardPx + downDir.y * downPx,
      width: earringWidth,
      height: earringHeight,
      angle: angle,
      flipHorizontal: false,
      visible: turn > 0.55
    },

    right: {
      x: rightPx.x + rightDir.x * outwardPx + downDir.x * downPx,
      y: rightPx.y + rightDir.y * outwardPx + downDir.y * downPx,
      width: earringWidth,
      height: earringHeight,
      angle: angle,
      flipHorizontal: true,
      visible: turn < 1.8
    }
  };
}

/* ==========================================================================
   NECKLACE
   ========================================================================== */

function calculateNecklacePosition(
  landmarks,
  width,
  height,
  itemConfig = {}
) {

  const chin = getLandmark(
    landmarks,
    LANDMARKS.CHIN
  );

  const jawLeft = getLandmark(
    landmarks,
    LANDMARKS.JAW_LEFT
  );

  const jawRight = getLandmark(
    landmarks,
    LANDMARKS.JAW_RIGHT
  );

  const forehead = getLandmark(
    landmarks,
    LANDMARKS.FOREHEAD
  );


  const chinPoint = toCanvasCoords(
    chin,
    width,
    height
  );


  const jawWidth = getDistance(
    jawLeft,
    jawRight,
    width,
    height
  );


  const faceHeight = getDistance(
    forehead,
    chin,
    width,
    height
  );


  const safeJawWidth =
    jawWidth > 0
      ? jawWidth
      : width * 0.25;


  const safeFaceHeight =
    faceHeight > 0
      ? faceHeight
      : height * 0.5;


  const scaleWidth =
    safeJawWidth *
    (itemConfig.scaleFactor || 1.6);


  const scaleHeight =
    scaleWidth * 0.62;


  const angle =
    getHeadRollAngle(landmarks);


  const necklaceCenterY =
    chinPoint.y +
    (itemConfig.offsetY || 0.5) *
    safeFaceHeight;


  return {

    x: chinPoint.x,

    y: necklaceCenterY,

    width: scaleWidth,

    height: scaleHeight,

    angle: angle
  };
}