# AGENT.md

## Project: Virtual Jewellery Wearable System

## 1. Project Overview

Build a college-level **Virtual Jewellery Wearable System** that allows a user to view their face through a camera and virtually wear jewellery such as:

* Necklace
* Earrings
* Nose ring
* Bindi
* Tikka
* Other simple face/neck jewellery

The system combines:

1. A web application built using **HTML, CSS, and JavaScript**
2. A webcam/camera for capturing the user's face
3. Browser-based face detection/landmark tracking
4. Virtual jewellery images rendered over the detected face
5. An **Arduino Uno R3**
6. A basic LED/LCD display connected to the Arduino

The Arduino acts as a simple hardware controller/display component. The browser handles the computationally intensive face tracking and jewellery rendering.

This is a **college-level prototype**, not a commercial AR jewellery platform.

---

# 2. Primary Objective

Create a working prototype where:

1. The user opens the web application.
2. The application requests camera permission.
3. The user's face appears in a camera preview.
4. The application detects the human face.
5. Facial landmarks are identified.
6. Jewellery is positioned automatically based on facial landmarks.
7. The user can select different jewellery.
8. Jewellery follows the user's face when they move.
9. Arduino communicates with the web application.
10. The Arduino display provides simple system/status information.

Example:

```text
Camera
   |
   v
Web Browser
   |
   +---- Face Detection
   |
   +---- Facial Landmarks
   |
   +---- Jewellery Overlay
   |
   +---- Arduino Communication
             |
             v
       Arduino Uno R3
             |
             v
        LED/LCD Display
```

---

# 3. Technology Requirements

## Frontend

Use only:

* HTML5
* CSS3
* Vanilla JavaScript

Do NOT introduce React, Next.js, Vue, Angular, or other frontend frameworks.

The goal is to keep the project simple and understandable for a college demonstration.

## Hardware

Primary hardware:

* Arduino Uno R3
* Basic display/LED display already purchased
* USB cable
* Webcam/laptop camera
* Required jumper wires
* Breadboard if required
* Resistors/modules required by the purchased display

The Arduino and display have already been tested successfully using a basic Hello World program.

---

# 4. Important Architecture Decision

The browser should perform:

* Camera access
* Face detection
* Facial landmark detection
* Jewellery positioning
* Jewellery rendering
* User interface
* Jewellery selection

Arduino should NOT perform face detection.

Arduino Uno R3 does not have enough computational capability or memory to perform modern browser-style face tracking.

Instead:

```text
Browser
  |
  | Serial/Web Serial
  v
Arduino
  |
  v
Display
```

The Arduino should primarily receive simple commands such as:

```text
READY
FACE_DETECTED
NECKLACE_SELECTED
EARRING_SELECTED
NO_FACE
RESET
```

and display appropriate information.

---

# 5. Face Detection

Use a browser-compatible face detection/landmark solution.

Preferred option:

**MediaPipe Face Landmarker / Face Mesh**

The implementation should preferably use a CDN version so that the project can initially run without a complicated build system.

Do not train a custom machine-learning model.

The system only needs to recognize a **human face**.

The first version should support:

* One face at a time
* Frontal/near-frontal face
* Basic head movement
* Basic facial landmark tracking

Do not attempt:

* Multiple people
* Full-body tracking
* Advanced 3D reconstruction
* Realistic physics
* Photorealistic AR
* Mobile native applications

---

# 6. Face Landmark Requirements

The application should identify landmarks required for jewellery positioning.

Important landmark regions:

### Earrings

Use:

* Left ear region
* Right ear region

Approximate position using appropriate facial landmarks.

### Necklace

Use:

* Chin/jaw landmarks
* Neck estimation based on face position

The first implementation does NOT need perfect anatomical neck detection.

Use a reasonable calculated position below the chin.

### Nose Ring

Use:

* Nose landmarks

Position the nose ring close to the nostril/nose region.

### Bindi

Use:

* Forehead region
* Eye/eyebrow landmarks

Place the bindi approximately in the center of the forehead.

### Tikka

Use:

* Forehead center
* Nose bridge

Position the tikka along the vertical center of the face.

---

# 7. Jewellery Rendering

Jewellery should be rendered as transparent PNG images.

Create a jewellery asset structure:

```text
/assets
    /jewellery
        /necklace
            necklace1.png
            necklace2.png
            necklace3.png

        /earrings
            earrings1.png
            earrings2.png
            earrings3.png

        /nose-rings
            nose-ring1.png
            nose-ring2.png

        /bindi
            bindi1.png
            bindi2.png

        /tikka
            tikka1.png
            tikka2.png
```

Use transparent backgrounds.

Do not hardcode jewellery images directly inside JavaScript.

---

# 8. Jewellery Data Structure

Maintain jewellery information in JavaScript.

Example:

```javascript
const jewelleryItems = [
    {
        id: "necklace-01",
        name: "Traditional Necklace",
        type: "necklace",
        image: "/assets/jewellery/necklace/necklace1.png"
    },
    {
        id: "earring-01",
        name: "Gold Earrings",
        type: "earrings",
        image: "/assets/jewellery/earrings/earrings1.png"
    }
];
```

The rendering engine should use this data instead of hardcoded UI logic.

---

# 9. Camera Interface

Create a camera section containing:

```text
+---------------------------------------+
|                                       |
|          LIVE CAMERA FEED             |
|                                       |
|       [ Face + Jewellery ]            |
|                                       |
+---------------------------------------+
```

Use:

```javascript
navigator.mediaDevices.getUserMedia()
```

The camera should:

* Request permission
* Start automatically after permission
* Display the video
* Overlay a transparent canvas

Recommended structure:

```html
<div class="camera-container">
    <video id="camera" autoplay playsinline></video>
    <canvas id="overlay"></canvas>
</div>
```

The canvas must be aligned exactly with the video.

---

# 10. Canvas Overlay

Use HTML Canvas for jewellery rendering.

Architecture:

```text
Video
  |
  +---- Canvas
          |
          +---- Face landmarks
          |
          +---- Jewellery images
```

The canvas must:

* Match video dimensions
* Clear previous frames
* Draw jewellery at calculated coordinates
* Update continuously

Use:

```javascript
requestAnimationFrame()
```

for continuous rendering.

---

# 11. Face Tracking Loop

The main processing loop should approximately follow:

```text
Start camera
      |
      v
Read video frame
      |
      v
Detect face
      |
      +---- No face ----> Show "Face not detected"
      |
      v
Get landmarks
      |
      v
Calculate jewellery positions
      |
      v
Render jewellery
      |
      v
Send status to Arduino
```

Do not run unnecessary expensive operations every frame.

Avoid repeatedly sending serial commands to Arduino every animation frame.

For example, do NOT do:

```text
FACE_DETECTED
FACE_DETECTED
FACE_DETECTED
FACE_DETECTED
...
```

60 times per second.

Only send the command when the state changes.

---

# 12. Arduino Communication

Use **Web Serial API** where supported.

The browser should communicate directly with the Arduino through USB serial.

Example flow:

```text
Connect Arduino
      |
      v
Request Serial Port
      |
      v
Open Serial Connection
      |
      v
Send Commands
```

Example commands:

```text
READY\n
FACE_DETECTED\n
NO_FACE\n
NECKLACE\n
EARRINGS\n
NOSE_RING\n
BINDI\n
TIKKA\n
RESET\n
```

The Arduino should parse incoming commands.

---

# 13. Arduino Responsibilities

Arduino should:

1. Initialize the display.
2. Display startup information.
3. Wait for serial commands.
4. Parse commands.
5. Update the display.
6. Optionally control simple LEDs if available.

Example:

```text
BOOTING...
```

Then:

```text
VIRTUAL
JEWELLERY
READY
```

After browser connection:

```text
SYSTEM
CONNECTED
```

When face is detected:

```text
FACE
DETECTED
```

When jewellery is selected:

```text
NECKLACE
SELECTED
```

---

# 14. Arduino Code Structure

Keep Arduino code simple.

Recommended structure:

```text
arduino/
    virtual_jewellery.ino
```

The code should contain:

```cpp
setup()
loop()
readSerialCommand()
handleCommand()
updateDisplay()
```

Example architecture:

```cpp
void setup() {
    gin(9600);

    initializeDisplay();

    displayMessage("Virtual Jewellery");
}

void loop() {
    if (Serial.available()) {
        String command = Serial.readStringUntil('\n');
        command.trim();

        handleCommand(command);
    }
}
```

Do not add unnecessary Arduino libraries unless required by the exact display hardware.

---

# 15. Web Serial Module

Create:

```text
/js
    serial.js
```

Responsibilities:

```javascript
connectArduino()
disconnectArduino()
sendArduinoCommand(command)
```

Example:

```javascript
async function sendArduinoCommand(command) {
    if (!writer) return;

    await writer.write(
        new TextEncoder().encode(command + "\n")
    );
}
```

Handle errors gracefully.

If Web Serial is unavailable, the web application should still work without Arduino.

---

# 16. Graceful Hardware Failure

The application must NOT crash if:

* Arduino is disconnected
* Serial connection fails
* Browser does not support Web Serial
* User refuses camera permission
* Camera is unavailable

Display useful messages such as:

```text
Arduino not connected.
Virtual try-on will still work.
```

or:

```text
Camera permission is required.
```

The virtual jewellery functionality should continue independently from Arduino whenever possible.

---

# 17. User Interface

Create a clean, modern jewellery-themed UI.

The interface should contain:

### Header

```text
Virtual Jewellery Wearable
```

Subtitle:

```text
Try jewellery virtually using your camera
```

### Main Area

Two sections:

```text
+-----------------------------+
|                             |
|       CAMERA PREVIEW        |
|                             |
+-----------------------------+

+-----------------------------+
| Jewellery Categories        |
|                             |
| [Necklace] [Earrings]       |
| [Nose Ring] [Bindi]         |
| [Tikka]                     |
+-----------------------------+
```

### Hardware Status

Display:

```text
Arduino: Connected
Camera: Active
Face: Detected
```

Use visual status indicators.

---

# 18. Jewellery Selection

The user should be able to select:

```text
Necklace
Earrings
Nose Ring
Bindi
Tikka
```

When the user selects a category, show available jewellery.

Example:

```text
Necklaces

[ Image 1 ]
Traditional

[ Image 2 ]
Bridal

[ Image 3 ]
Modern
```

Clicking an item should immediately render it on the face.

---

# 19. Multiple Jewellery Items

The user should be able to combine jewellery.

For example:

```text
Bindi
+
Earrings
+
Necklace
```

The application should maintain an active jewellery state:

```javascript
const selectedJewellery = {
    necklace: null,
    earrings: null,
    noseRing: null,
    bindi: null,
    tikka: null
};
```

Selecting a new item replaces the previous item in that category.

Provide a:

```text
Remove All
```

button.

---

# 20. Jewellery Positioning Engine

Create a dedicated JavaScript module:

```text
/js
    jewellery-positioning.js
```

This module should contain functions such as:

```javascript
calculateNecklacePosition()
calculateEarringPosition()
calculateNoseRingPosition()
calculateBindiPosition()
calculateTikkaPosition()
```

Do not mix positioning calculations with UI code.

---

# 21. Scaling and Rotation

Jewellery should respond to basic face movement.

For example:

```text
Face becomes larger
        |
        v
Jewellery becomes larger
```

For earrings:

```text
Head rotates
     |
     v
Earrings shift accordingly
```

Calculate scale using distances between appropriate facial landmarks.

Example:

```javascript
const faceWidth = distance(leftFacePoint, rightFacePoint);
```

Use this to calculate jewellery scale.

The first version does not need perfect 3D rotation.

---

# 22. Coordinate System

Be careful about video mirroring.

If the camera preview is mirrored:

```css
video {
    transform: scaleX(-1);
}
```

the canvas must also be mirrored or the coordinates must be transformed.

The jewellery must remain aligned with the face.

Test:

* Face moves left
* Face moves right
* Face moves up
* Face moves down
* User moves closer
* User moves farther
* User slightly rotates head

---

# 23. Project Structure

Use the following structure:

```text
virtual-jewellery/
│
├── index.html
│
├── css/
│   ├── style.css
│   └── responsive.css
│
├── js/
│   ├── app.js
│   ├── camera.js
│   ├── face-tracking.js
│   ├── jewellery.js
│   ├── jewellery-positioning.js
│   ├── renderer.js
│   └── serial.js
│
├── assets/
│   ├── jewellery/
│   │   ├── necklace/
│   │   ├── earrings/
│   │   ├── nose-rings/
│   │   ├── bindi/
│   │   └── tikka/
│   │
│   └── icons/
│
├── arduino/
│   └── virtual_jewellery.ino
│
├── README.md
└── AGENT.md
```

---

# 24. JavaScript Responsibilities

## app.js

Main application controller.

Responsible for:

* Application initialization
* Connecting modules
* UI events
* Application state

---

## camera.js

Responsible for:

* Camera permission
* Starting camera
* Stopping camera
* Video dimensions

Functions:

```javascript
startCamera()
stopCamera()
```

---

## face-tracking.js

Responsible for:

* Loading face detection model
* Detecting face
* Obtaining landmarks
* Providing landmark data to renderer

Functions:

```javascript
initializeFaceTracking()
detectFace()
getFaceLandmarks()
```

---

## jewellery.js

Responsible for:

* Jewellery catalogue
* Jewellery selection
* Active jewellery state

---

## jewellery-positioning.js

Responsible for:

* Calculating jewellery coordinates
* Scale
* Rotation
* Position

---

## renderer.js

Responsible for:

* Canvas rendering
* Drawing jewellery
* Clearing canvas
* Rendering current frame

---

## serial.js

Responsible for:

* Arduino connection
* Serial communication
* Sending commands
* Connection state

---

# 25. Application State

Use a simple JavaScript state object.

Example:

```javascript
const appState = {
    cameraConnected: false,
    arduinoConnected: false,
    faceDetected: false,

    selectedJewellery: {
        necklace: null,
        earrings: null,
        noseRing: null,
        bindi: null,
        tikka: null
    }
};
```

Do not introduce a state management framework.

---

# 26. Security and Privacy

The camera feed should be processed locally in the browser.

Do not upload camera images to a server.

Do not store:

* Face images
* Camera recordings
* Facial landmarks
* User biometric information

The project should work entirely locally.

---

# 27. Responsive Design

The application should work on:

* Desktop
* Laptop
* Tablet

Primary demonstration target:

```text
Windows laptop/desktop
+ USB webcam
+ Arduino Uno
```

Do not spend significant development time on mobile browser support initially.

---

# 28. Error Handling

Every major module must handle errors.

Examples:

### Camera

```text
Unable to access camera.
Please allow camera permission.
```

### Face Detection

```text
Face not detected.
Please position your face inside the camera.
```

### Arduino

```text
Arduino disconnected.
Try connecting the USB cable.
```

### Web Serial

```text
Web Serial is not supported in this browser.
Use a supported Chromium-based browser.
```

---

# 29. Browser Requirements

Prefer a Chromium-based browser for the demonstration because Web Serial support is required for browser-to-Arduino communication.

Recommended:

```text
Google Chrome
Microsoft Edge
```

The application should clearly show if Web Serial is unavailable.

---

# 30. Development Strategy

Implement the project in stages.

## Stage 1 — Basic Web App

Build:

* HTML
* CSS
* Camera preview
* Basic UI

Verify camera works.

---

## Stage 2 — Face Detection

Add:

* Face detection
* Face landmarks
* Face detected/not detected status

Do not add jewellery yet.

---

## Stage 3 — Canvas Overlay

Add:

* Transparent canvas
* Face coordinate mapping
* Basic test marker

Example:

```text
Draw a red/green circle on the nose.
```

This verifies that landmarks and canvas coordinates are correct.

---

## Stage 4 — First Jewellery

Implement only:

```text
Bindi
```

Verify:

* Position
* Scaling
* Movement

---

## Stage 5 — Earrings

Implement:

```text
Left earring
Right earring
```

Test head movement.

---

## Stage 6 — Necklace

Implement:

```text
Necklace
```

Position below chin.

---

## Stage 7 — Additional Jewellery

Implement:

```text
Nose ring
Tikka
```

---

## Stage 8 — Arduino

Connect browser to Arduino using Web Serial.

Test:

```text
Browser
   |
   | "FACE_DETECTED"
   v
Arduino
   |
   v
Display
```

---

## Stage 9 — Integration

Integrate:

```text
Camera
+
Face Tracking
+
Jewellery
+
Arduino
+
Display
```

---

# 31. Demonstration Flow

The final college demonstration should work like this:

### Step 1

Open:

```text
index.html
```

or run the local development server.

### Step 2

Connect Arduino through USB.

### Step 3

Click:

```text
Connect Arduino
```

Arduino display:

```text
SYSTEM
CONNECTED
```

### Step 4

Click:

```text
Start Camera
```

### Step 5

Face appears.

Arduino:

```text
FACE
DETECTED
```

### Step 6

Select:

```text
Necklace
```

The necklace appears on the user's neck.

Arduino:

```text
NECKLACE
SELECTED
```

### Step 7

Select:

```text
Earrings
```

Earrings appear.

Arduino:

```text
EARRINGS
SELECTED
```

### Step 8

Move the face.

Jewellery should follow the face.

---

# 32. Performance Requirements

Target:

```text
20–30 FPS
```

if hardware/browser allows.

Do not sacrifice stability for maximum FPS.

Avoid:

* Excessive DOM manipulation
* Recreating images every frame
* Reinitializing face detection every frame
* Sending serial commands every frame

Preload jewellery images.

---

# 33. Code Quality Requirements

Keep code:

* Modular
* Simple
* Readable
* Commented
* Beginner-friendly

Avoid overengineering.

Do not introduce:

* TypeScript
* React
* Redux
* Node backend
* Database
* Authentication
* Cloud storage
* Docker
* Microservices

unless explicitly requested later.

This is a local college prototype.

---

# 34. UI Design Guidelines

Visual style:

* Modern
* Clean
* Jewellery/fashion inspired
* Minimal
* Professional enough for college demonstration

Use:

* Cards
* Rounded buttons
* Clean typography
* Subtle shadows
* Clear status indicators

The camera preview should be the primary focus.

Do not overcrowd the interface.

---

# 35. Accessibility

Buttons should have meaningful labels.

Examples:

```text
Start Camera
Connect Arduino
Select Necklace
Remove All
```

Images should have appropriate `alt` text.

Do not rely exclusively on color to communicate status.

---

# 36. Testing Checklist

## Camera

* [ ] Camera permission works
* [ ] Camera starts
* [ ] Camera stops
* [ ] Camera error is handled

## Face Detection

* [ ] Face detected
* [ ] No-face state works
* [ ] Face movement works
* [ ] Face scaling works

## Jewellery

* [ ] Bindi positioning
* [ ] Tikka positioning
* [ ] Nose ring positioning
* [ ] Earring positioning
* [ ] Necklace positioning
* [ ] Jewellery follows face
* [ ] Remove All works

## Arduino

* [ ] Arduino connects
* [ ] Arduino disconnects gracefully
* [ ] Serial commands work
* [ ] Display updates
* [ ] Face detected command works
* [ ] Jewellery selection commands work

## Integration

* [ ] Camera + face tracking
* [ ] Face tracking + jewellery
* [ ] Jewellery + Arduino
* [ ] Full system works together

---

# 37. Important Constraints

Do NOT:

1. Build a backend unless explicitly requested.
2. Upload camera frames to a server.
3. Store biometric information.
4. Implement multi-face tracking.
5. Implement advanced 3D AR.
6. Add unnecessary frameworks.
7. Replace Arduino with another microcontroller.
8. Assume Arduino performs machine learning.
9. Send serial messages continuously every frame.
10. Make the system unnecessarily complex.

The goal is a **working, demonstrable college prototype**.

---

# 38. Expected Final Result

The final application should provide:

```text
┌───────────────────────────────────────────────────┐
│           VIRTUAL JEWELLERY WEARABLE              │
│                                                   │
│  Arduino: ● Connected     Face: ● Detected        │
│                                                   │
│  ┌─────────────────────────────┐                  │
│  │                             │                  │
│  │       CAMERA FEED           │                  │
│  │                             │                  │
│  │       👤 + JEWELLERY        │                  │
│  │                             │                  │
│  └─────────────────────────────┘                  │
│                                                   │
│  Jewellery                                        │
│                                                   │
│  [ Necklace ] [ Earrings ] [ Nose Ring ]          │
│  [ Bindi ]    [ Tikka ]                           │
│                                                   │
│  Selected Items                                   │
│  [ Necklace 1 ] [ Earrings 2 ]                    │
│                                                   │
│              [ Remove All ]                       │
│                                                   │
│  Arduino Display: FACE DETECTED                   │
└───────────────────────────────────────────────────┘
```

The system should successfully demonstrate the concept of:

**Computer Vision + Web Technology + Arduino Hardware + Virtual Jewellery**

---

# 39. Definition of Done

The project is considered complete when:

* [ ] Web application opens successfully.
* [ ] Camera works.
* [ ] Human face is detected.
* [ ] Facial landmarks are available.
* [ ] At least 3 jewellery types can be virtually worn.
* [ ] Jewellery follows basic face movement.
* [ ] Arduino connects through USB.
* [ ] Browser can send commands to Arduino.
* [ ] Arduino display shows system status.
* [ ] Jewellery selection updates Arduino display.
* [ ] System continues working gracefully if Arduino is disconnected.
* [ ] No camera data is uploaded or stored.
* [ ] Code is modular and understandable.
* [ ] README contains setup and demonstration instructions.

---

# 40. Priority Order

When making implementation decisions, follow this priority:

1. **Working camera**
2. **Reliable face detection**
3. **Correct jewellery positioning**
4. **Smooth jewellery tracking**
5. **Arduino communication**
6. **Display status**
7. **UI polish**
8. **Additional jewellery**
9. **Performance optimization**

Do not prioritize visual polish over core functionality.

---

# 41. Development Principle

Always implement and test one feature at a time.

Recommended development sequence:

```text
Camera
   ↓
Face Detection
   ↓
Landmarks
   ↓
Canvas
   ↓
Bindi
   ↓
Earrings
   ↓
Necklace
   ↓
Other Jewellery
   ↓
Arduino Serial
   ↓
Arduino Display
   ↓
Complete Integration
```

Do not attempt to implement the entire system in one step.

---

# 42. Final Instruction to the Coding Agent

You are responsible for implementing this project incrementally.

Before writing large amounts of code:

1. Inspect the existing project.
2. Determine whether files already exist.
3. Preserve working code.
4. Implement one module at a time.
5. Test each module before proceeding.
6. Do not introduce unnecessary technologies.
7. Keep the implementation suitable for a college-level project.
8. Explain significant implementation decisions.
9. When a hardware-specific detail is unknown, do not guess the exact wiring or display library. Inspect the existing Arduino code/hardware configuration first.
10. Keep the browser and Arduino responsibilities clearly separated.

The final goal is a reliable prototype that can be physically demonstrated:

```text
             USER
              │
              ▼
        ┌─────────────┐
        │   CAMERA    │
        └──────┬──────┘
               │
               ▼
        ┌─────────────┐
        │ WEB APP     │
        │ HTML/CSS/JS │
        └──────┬──────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
 Face Tracking    Jewellery Overlay
       │                │
       └───────┬────────┘
               │
               ▼
        Web Serial API
               │
               ▼
        ┌─────────────┐
        │ Arduino Uno │
        └──────┬──────┘
               │
               ▼
        ┌─────────────┐
        │ LED / LCD   │
        │   Display   │
        └─────────────┘
```

**Build for reliability first, visual quality second, and complexity last.**
