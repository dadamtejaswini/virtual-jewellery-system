/* ==========================================================================
   Virtual Jewellery Wearable System - Camera Controller Module
   ========================================================================== */

class CameraController {
  constructor() {
    this.videoElement = null;
    this.stream = null;
    this.isActive = false;
    this.width = 640;
    this.height = 480;
    this.onFrameCallback = null;
  }

  /**
   * Request webcam access and start playing video feed in specified <video> element
   * @param {HTMLVideoElement} videoElement 
   * @returns {Promise<boolean>}
   */
  async startCamera(videoElement) {
    if (!videoElement) {
      throw new Error("Video element is required to start camera");
    }

    this.videoElement = videoElement;

    // Check mediaDevices support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Camera API is not supported in this browser.");
    }

    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = this.stream;

      return new Promise((resolve, reject) => {
        this.videoElement.onloadedmetadata = () => {
          this.videoElement.play();
          this.isActive = true;
          this.width = this.videoElement.videoWidth;
          this.height = this.videoElement.videoHeight;
          resolve(true);
        };
        this.videoElement.onerror = (err) => {
          reject(err);
        };
      });

    } catch (error) {
      this.isActive = false;
      let errorMsg = "Unable to access camera.";

      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorMsg = "Camera access denied. Please grant camera permissions in browser settings.";
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        errorMsg = "No webcam device detected on your system.";
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        errorMsg = "Webcam is already in use by another application.";
      }

      throw new Error(errorMsg);
    }
  }

  /**
   * Stop active camera stream tracks
   */
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.isActive = false;
  }

  /**
   * Get actual video dimensions
   */
  getDimensions() {
    return {
      width: this.width || 640,
      height: this.height || 480
    };
  }
}

// Global camera instance
const cameraController = new CameraController();
