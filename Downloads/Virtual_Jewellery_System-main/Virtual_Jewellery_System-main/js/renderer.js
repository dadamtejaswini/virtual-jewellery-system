/* ==========================================================================
   Virtual Jewellery Wearable System - Canvas Renderer Module
   ========================================================================== */

class JewelleryRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement ? canvasElement.getContext('2d') : null;
    this.showLandmarkDebug = false;
  }

  /**
   * Bind canvas element
   */
  setCanvas(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
  }

  /**
   * Sync canvas dimensions to match video source
   */
  resizeCanvas(width, height) {
    if (!this.canvas) return;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  /**
   * Clear canvas frame
   */
  clear() {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Render continuous frame overlay
   * @param {Array|null} landmarks 
   * @param {object} selectedItems 
   */
  renderFrame(landmarks, selectedItems) {
    this.clear();
    if (!this.ctx || !this.canvas) return;

    const width = this.canvas.width;
    const height = this.canvas.height;

    // Set canvas transformation to mirror video feed (since video uses scaleX(-1))
    this.ctx.save();
    this.ctx.translate(width, 0);
    this.ctx.scale(-1, 1);

    if (landmarks) {
      // 1. Render active jewellery items on top of detected face
      this.renderJewelleryLayer(landmarks, selectedItems, width, height);

      // 2. Render debug landmarks if enabled
      if (this.showLandmarkDebug) {
        this.renderLandmarksDebug(landmarks, width, height);
      }
    }

    this.ctx.restore();
  }

  /**
   * Draw selected jewellery items onto canvas using calculated positioning
   */
  renderJewelleryLayer(landmarks, selectedItems, width, height) {
    // 1. Render Necklace
    if (selectedItems.necklace) {
      const pos = calculateNecklacePosition(landmarks, width, height, selectedItems.necklace);
      const img = getJewelleryImage(selectedItems.necklace.id);
      this.drawTransformedImage(img, pos);
    }

    // 2. Render Earrings (Pair: Left & Right)
    if (selectedItems.earrings) {
      const posPair = calculateEarringPosition(landmarks, width, height, selectedItems.earrings);
      const img = getJewelleryImage(selectedItems.earrings.id);

      if (img) {
        this.drawTransformedImage(img, posPair.left);
        this.drawTransformedImage(img, posPair.right);
      }
    }

    // 3. Render Nose Ring
    if (selectedItems.noseRing) {
      const pos = calculateNoseRingPosition(landmarks, width, height, selectedItems.noseRing);
      const img = getJewelleryImage(selectedItems.noseRing.id);
      this.drawTransformedImage(img, pos);
    }

    // 4. Render Bindi
    if (selectedItems.bindi) {
      const pos = calculateBindiPosition(landmarks, width, height, selectedItems.bindi);
      const img = getJewelleryImage(selectedItems.bindi.id);
      this.drawTransformedImage(img, pos);
    }

    // 5. Render Tikka
    if (selectedItems.tikka) {
      const pos = calculateTikkaPosition(landmarks, width, height, selectedItems.tikka);
      const img = getJewelleryImage(selectedItems.tikka.id);
      this.drawTransformedImage(img, pos);
    }
  }

  /**
   * Helper function to draw an image on canvas with center translation, rotation, and scaling
   */
  drawTransformedImage(img, transform) {
    if (!img || !img.complete || !transform) return;

    this.ctx.save();
    this.ctx.translate(transform.x, transform.y);
    this.ctx.rotate(transform.angle);

    if (transform.flipHorizontal) {
      this.ctx.scale(-1, 1);
    }

    // Draw centered on (0,0)
    this.ctx.drawImage(
      img,
      -transform.width / 2,
      -transform.height / 2,
      transform.width,
      transform.height
    );

    this.ctx.restore();
  }

  /**
   * Render landmark mesh points for verification
   */
  renderLandmarksDebug(landmarks, width, height) {
    this.ctx.fillStyle = "#10b981";

    // Key facial anchor points (Nose, Eyes, Forehead, Chin, Ears, Jaw)
    const keyIndices = [1, 9, 10, 33, 152, 234, 263, 454];

    keyIndices.forEach(idx => {
      const lm = landmarks[idx];
      if (lm) {
        const x = lm.x * width;
        const y = lm.y * height;

        this.ctx.beginPath();
        this.ctx.arc(x, y, 4, 0, 2 * Math.PI);
        this.ctx.fill();

        // Highlight nose in bright gold
        if (idx === 1) {
          this.ctx.fillStyle = "#ffd700";
          this.ctx.beginPath();
          this.ctx.arc(x, y, 6, 0, 2 * Math.PI);
          this.ctx.fill();
          this.ctx.fillStyle = "#10b981";
        }
      }
    });
  }
}

// Global renderer instance
const jewelleryRenderer = new JewelleryRenderer();
