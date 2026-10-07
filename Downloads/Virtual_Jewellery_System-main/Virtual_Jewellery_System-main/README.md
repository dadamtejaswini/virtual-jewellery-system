# Virtual Jewellery Wearable System

A real-time **Virtual Jewellery Try-On System** combining browser-based computer vision face tracking, HTML5 Canvas overlay rendering, and **Arduino Uno R3** hardware serial communication.

Built as a college-level engineering prototype demonstrating the integration of **Web Computer Vision + Interactive UI + Embedded Systems**.

---

## 🌟 Key Features

1. **Real-Time Webcam Face Tracking**: Uses MediaPipe 468 3D landmark mesh to track head rotation, scaling, and movement smoothly.
2. **5 Virtual Jewellery Categories**:
   - **Necklaces**: Kundan Royal Choker, Emerald Diamond Choker, Temple Gold Haar
   - **Earrings**: Royal Gold Jhumkas, Sapphire Diamond Drop, Ruby Floral Danglers
   - **Nose Rings**: Maharani Pearl Nath, Diamond Stud Ring
   - **Bindi**: Crimson Royal Bindi, Crystal Marquise Bindi
   - **Tikka**: Kundan Maang Tikka, Emerald Royal Tikka
3. **Multi-Jewellery Stacking**: Wear multiple items simultaneously (e.g. Bindi + Earrings + Necklace).
4. **Web Serial Hardware Link**: Communicates with Arduino Uno R3 via USB Web Serial API in Chromium browsers.
5. **Deduplicated Command Dispatch**: Optimized state sender prevents flooding the microcontroller.
6. **Graceful Degradation**: Application works standalone if camera or Arduino hardware is unavailable.
7. **Privacy Preserved**: 100% client-side execution — zero video frames or facial biometric data uploaded to any server.

---

## 📁 Project Structure

```text
virtual_jewellery_system/
│
├── index.html                  # Main Web Application Page
│
├── css/
│   ├── style.css               # Obsidian Dark & Luxury Gold Aesthetics
│   └── responsive.css          # Mobile & Laptop Responsive Layout
│
├── js/
│   ├── app.js                  # Main Application Orchestrator & Loop
│   ├── camera.js               # getUserMedia Stream Lifecycle Controller
│   ├── face-tracking.js        # MediaPipe Face Mesh Landmark Detector
│   ├── jewellery.js           # Jewellery Catalog Data & Selection State
│   ├── jewellery-positioning.js# Landmark-to-Canvas Position Engine
│   ├── renderer.js             # HTML5 Canvas Overlay & Mirror Renderer
│   └── serial.js               # Web Serial API Arduino Communication
│
├── assets/
│   └── jewellery/
│       ├── necklace/           # Vector SVG Assets for Necklaces
│       ├── earrings/           # Vector SVG Assets for Earrings
│       ├── nose-rings/         # Vector SVG Assets for Nose Rings
│       ├── bindi/              # Vector SVG Assets for Bindi
│       └── tikka/              # Vector SVG Assets for Maang Tikka
│
├── arduino/
│   └── virtual_jewellery.ino   # Arduino Uno R3 C++ Sketch
│
├── AGENT.md                    # System Specification & Architecture Specs
└── README.md                   # Setup & Demonstration Guide
```

---

## 🚀 How to Run the Web Application

### Option 1: Using Node / Python Local Server (Recommended)

1. Open PowerShell or Terminal in the project folder:
   ```bash
   # Using Python:
   python -m http.server 8000

   # OR using npx http-server:
   npx http-server . -p 8000
   ```
2. Open your Chromium browser (Google Chrome or Microsoft Edge):
   `http://localhost:8000`

### Option 2: Direct File Access
Double-click `index.html` to open directly in Google Chrome or Microsoft Edge.

---

## 🔌 Setting Up Arduino Uno R3 Hardware

### Hardware Required:
- Arduino Uno R3
- USB Type-A to Type-B Cable
- (Optional) 16x2 LCD Display (I2C) or LEDs on Pins 12 & 13

### Step-by-Step Setup:
1. Open `arduino/virtual_jewellery.ino` in **Arduino IDE**.
2. Select Board: `Arduino Uno`.
3. Select COM Port for your connected Arduino.
4. Click **Upload**.
5. Once uploaded, open the web app in Google Chrome / Edge.
6. Click **Connect Arduino** in the web app, select your Arduino COM Port, and click **Connect**.
7. The status bar will show **Arduino: Connected** and the hardware console will display incoming commands:
   - `READY`
   - `FACE_DETECTED`
   - `NECKLACE_SELECTED`
   - `EARRINGS_SELECTED`
   - `NOSE_RING_SELECTED`
   - `BINDI_SELECTED`
   - `TIKKA_SELECTED`
   - `RESET`

---

## 🎮 College Demonstration Guide

1. Launch web application in Chrome/Edge.
2. Click **Connect Arduino** -> Select Arduino COM Port -> Verify LCD/Serial log updates.
3. Click **Start Camera** -> Grant camera permission when prompted.
4. Position your face in front of the camera -> Notice status pill changes to **Face: Detected**.
5. Click **Necklaces** tab -> Select **Kundan Royal Choker** -> Watch it snap below your chin and follow head movements.
6. Click **Earrings** tab -> Select **Royal Gold Jhumkas** -> Observe dual-ear placement and roll rotation.
7. Click **Tikka** or **Bindi** -> Observe forehead positioning.
8. Turn/tilt head left and right -> Verify jewellery scales and rotates in real-time.
9. Click **Remove All** -> System resets state and sends `RESET` to Arduino display.

---

## 🔒 Security & Privacy Notice
This system runs 100% locally inside the web browser. No camera video streams, images, or facial biometric data are stored or uploaded over the internet.
