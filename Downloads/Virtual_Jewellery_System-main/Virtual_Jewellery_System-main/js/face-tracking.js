/* ==========================================================================
   Virtual Jewellery Wearable System - MediaPipe Face Tracking Module
   ========================================================================== */

class FaceTracker {
  constructor() {
    this.faceMesh = null;
    this.isInitialized = false;
    this.isProcessing = false;
    this.faceDetected = false;
    this.currentLandmarks = null;
    this.onResultsCallback = null;
    this.onStatusChangeCallback = null;
  }

  /**
   * Initialize MediaPipe Face Mesh model via CDN dependencies
   * @returns {Promise<boolean>}
   */
  async initialize() {
    if (this.isInitialized) return true;

    try {
      if (typeof window.FaceMesh === 'undefined') {
        throw new Error("MediaPipe FaceMesh library not loaded. Ensure CDN scripts are included.");
      }

      this.faceMesh = new window.FaceMesh({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`;
        }
      });

      this.faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.faceMesh.onResults((results) => {
        this.handleResults(results);
      });

      await this.faceMesh.initialize();
      this.isInitialized = true;
      return true;

    } catch (error) {
      console.error("FaceTracker initialization error:", error);
      throw error;
    }
  }

  /**
   * Send video frame to MediaPipe detector
   * @param {HTMLVideoElement} videoElement 
   */
  async processFrame(videoElement) {
    if (!this.isInitialized || !videoElement || this.isProcessing) return;
    if (videoElement.paused || videoElement.ended || videoElement.readyState < 2) return;

    try {
      this.isProcessing = true;
      await this.faceMesh.send({ image: videoElement });
    } catch (err) {
      console.warn("Error processing face tracking frame:", err);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Internal MediaPipe result handler
   */
  handleResults(results) {
    const hasFace = results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0;
    const previousState = this.faceDetected;

    this.faceDetected = hasFace;

    if (hasFace) {
      this.currentLandmarks = results.multiFaceLandmarks[0];
    } else {
      this.currentLandmarks = null;
    }

    // Trigger state change callback if detection status toggles
    if (previousState !== this.faceDetected && this.onStatusChangeCallback) {
      this.onStatusChangeCallback(this.faceDetected);
    }

    // Trigger frame results callback
    if (this.onResultsCallback) {
      this.onResultsCallback({
        faceDetected: this.faceDetected,
        landmarks: this.currentLandmarks,
        image: results.image
      });
    }
  }

  /**
   * Get latest landmark array
   */
  getLandmarks() {
    return this.currentLandmarks;
  }
}

// Global face tracker instance
const faceTracker = new FaceTracker();
