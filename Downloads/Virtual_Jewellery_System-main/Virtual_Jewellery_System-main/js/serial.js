/* ==========================================================================
   Virtual Jewellery Wearable System - Web Serial Arduino Communication Module
   ========================================================================== */

class SerialController {
  constructor() {
    this.port = null;
    this.writer = null;
    this.reader = null;
    this.readableStreamClosed = null;
    this.readLoopActive = false;
    this.isConnected = false;
    this.lastSentCommand = "";
    this.onStatusChangeCallback = null;
    this.onLogCallback = null;
    this.onDataReceivedCallback = null; // fired once per line received FROM Arduino
  }

  /**
   * Check if Web Serial API is supported by the user's browser
   * @returns {boolean}
   */
  isSupported() {
    return "serial" in navigator;
  }

  /**
   * Prompt user to select Arduino COM port and establish serial connection
   * @returns {Promise<boolean>}
   */
  async connectArduino() {
    if (!this.isSupported()) {
      this.log("Web Serial API is not supported in this browser. Please use Chrome/Edge.", "error");
      throw new Error("Web Serial API is not supported in this browser.");
    }

    try {
      this.log("Requesting USB Serial Port...", "info");
      this.port = await navigator.serial.requestPort();

      // Open port at standard Arduino baud rate (9600)
      await this.port.open({ baudRate: 9600 });

      const textEncoder = new TextEncoderStream();
      const writableStreamClosed = textEncoder.readable.pipeTo(this.port.writable);
      this.writer = textEncoder.writable.getWriter();

      this.isConnected = true;
      this.log("Connected to Arduino (9600 baud)", "info");

      if (this.onStatusChangeCallback) {
        this.onStatusChangeCallback(true);
      }

      // Start listening for data coming FROM the Arduino (e.g. button presses).
      // Not awaited on purpose — this runs in the background for as long as
      // the port stays open.
      this.startReading();

      // Send initial connection command to Arduino display
      await this.sendCommand("READY");

      // Handle unexpected disconnection (e.g. unplugging cable)
      this.port.addEventListener("disconnect", () => {
        this.handleDisconnect();
      });

      return true;

    } catch (error) {
      this.handleDisconnect();
      if (error.name === "NotFoundError") {
        this.log("Serial connection cancelled by user.", "info");
      } else {
        this.log(`Serial Connection Error: ${error.message}`, "error");
      }
      throw error;
    }
  }

  /**
   * Continuously read incoming text from the Arduino, split it into lines,
   * and hand each complete line to onDataReceivedCallback.
   *
   * This is what makes the physical Previous/Next/Save buttons work — the
   * Arduino sketch sends "PREV" / "NEXT" / "SAVE" over serial when a button
   * is pressed, and this is the code that actually listens for it.
   */
  async startReading() {
    if (!this.port || !this.port.readable) return;

    const textDecoder = new TextDecoderStream();
    this.readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();
    this.readLoopActive = true;

    let buffer = "";

    try {
      while (this.readLoopActive) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (!value) continue;

        buffer += value;

        // Lines arrive separated by \n (Arduino's Serial.println). Keep any
        // trailing partial line in the buffer for the next chunk.
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (line.length === 0) continue;

          this.log(`RX: ${line}`, "info");

          if (this.onDataReceivedCallback) {
            this.onDataReceivedCallback(line);
          }
        }
      }
    } catch (err) {
      // Expected when the port is closed on purpose (disconnect) — only
      // log it as an error if we were still supposed to be connected.
      if (this.isConnected) {
        this.log(`Serial read error: ${err.message}`, "error");
      }
    }
  }

  /**
   * Stop the read loop and release the reader so the port can close cleanly.
   */
  async stopReading() {
    this.readLoopActive = false;

    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch (e) {
        // Ignore — port may already be gone.
      }
      this.reader = null;
    }

    if (this.readableStreamClosed) {
      try {
        await this.readableStreamClosed.catch(() => {});
      } catch (e) {
        // Ignore
      }
      this.readableStreamClosed = null;
    }
  }

  /**
   * Close active serial port gracefully
   */
  async disconnectArduino() {
    await this.stopReading();

    if (this.writer) {
      try {
        await this.sendCommand("RESET");
        await this.writer.close();
      } catch (e) {
        console.warn("Writer close error:", e);
      }
      this.writer = null;
    }

    if (this.port) {
      try {
        await this.port.close();
      } catch (e) {
        console.warn("Port close error:", e);
      }
      this.port = null;
    }

    this.handleDisconnect();
    this.log("Arduino disconnected.", "info");
  }

  /**
   * Handle cleanup on disconnect
   */
  handleDisconnect() {
    this.isConnected = false;
    this.writer = null;
    this.port = null;
    this.lastSentCommand = "";
    this.readLoopActive = false;

    if (this.onStatusChangeCallback) {
      this.onStatusChangeCallback(false);
    }
  }

  /**
   * Send text command string to Arduino (deduplicated to prevent serial flood)
   * @param {string} command 
   * @param {boolean} force 
   */
  async sendCommand(command, force = false) {
    if (!this.isConnected || !this.writer) {
      return;
    }

    const trimmedCmd = command.trim().toUpperCase();

    // Deduplicate: Don't re-send identical state command 60 times/sec
    if (!force && trimmedCmd === this.lastSentCommand) {
      return;
    }

    try {
      const payload = trimmedCmd + "\n";
      await this.writer.write(payload);
      this.lastSentCommand = trimmedCmd;
      this.log(`TX: ${trimmedCmd}`, "tx");
    } catch (err) {
      this.log(`Failed to send serial command: ${err.message}`, "error");
    }
  }

  /**
   * Dispatch log message to registered UI listener
   */
  log(message, type = "info") {
    console.log(`[Serial ${type.toUpperCase()}] ${message}`);
    if (this.onLogCallback) {
      this.onLogCallback(message, type);
    }
  }
}

// Global serial instance
const serialController = new SerialController();