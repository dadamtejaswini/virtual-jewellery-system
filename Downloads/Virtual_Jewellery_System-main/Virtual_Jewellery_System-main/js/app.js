/* ==========================================================================
   Virtual Jewellery Wearable System - Main Application Orchestrator
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Element References ---
  const videoElement = document.getElementById("camera-video");
  const overlayCanvas = document.getElementById("overlay-canvas");
  const cameraPlaceholder = document.getElementById("camera-placeholder");
  const targetIndicator = document.getElementById("target-indicator");

  const btnStartCamera = document.getElementById("btn-start-camera");
  const btnConnectArduino = document.getElementById("btn-connect-arduino");
  const btnRemoveAll = document.getElementById("btn-remove-all");
  const chkDebugLandmarks = document.getElementById("chk-debug-landmarks");

  const dotCameraStatus = document.getElementById("dot-camera-status");
  const txtCameraStatus = document.getElementById("txt-camera-status");
  const dotFaceStatus = document.getElementById("dot-face-status");
  const txtFaceStatus = document.getElementById("txt-face-status");
  const dotArduinoStatus = document.getElementById("dot-arduino-status");
  const txtArduinoStatus = document.getElementById("txt-arduino-status");

  const serialLogContainer = document.getElementById("serial-log-container");
  const jewelleryGrid = document.getElementById("jewellery-grid");
  const categoryTabs = document.querySelectorAll(".category-tab");
  const activePillsContainer = document.getElementById("active-pills-container");

  let activeCategoryFilter = "all";
  let isAnimationLoopRunning = false;

  // Index into the currently filtered catalog, used only by the hardware
  // Previous/Next buttons so they know which item to move to next.
  let browseIndex = -1;

  // Very simple in-memory list of "saved" designs, built by the hardware
  // Save button. Each entry is what would eventually become one line on
  // the printed ticket.
  const savedDesigns = [];

  // Global App State
  const appState = {
    cameraConnected: false,
    arduinoConnected: false,
    faceDetected: false,
    selectedJewellery: selectedJewelleryState
  };

  // Bind Canvas to Renderer
  jewelleryRenderer.setCanvas(overlayCanvas);

  // --- Toast Notification Helper ---
  function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // --- Serial Logging Callback ---
  serialController.onLogCallback = (message, type) => {
    if (!serialLogContainer) return;
    const line = document.createElement("div");
    line.className = `serial-log-line ${type}`;
    line.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    serialLogContainer.appendChild(line);
    serialLogContainer.scrollTop = serialLogContainer.scrollHeight;
  };

  // --- Serial Connection Status Handler ---
  serialController.onStatusChangeCallback = (isConnected) => {
    appState.arduinoConnected = isConnected;
    if (isConnected) {
      dotArduinoStatus.className = "status-dot active";
      txtArduinoStatus.textContent = "Arduino: Connected";
      btnConnectArduino.textContent = "Disconnect Arduino";
      btnConnectArduino.className = "btn btn-danger";
      showToast("Arduino connected via USB Serial!", "success");
    } else {
      dotArduinoStatus.className = "status-dot";
      txtArduinoStatus.textContent = "Arduino: Disconnected";
      btnConnectArduino.textContent = "Connect Arduino";
      btnConnectArduino.className = "btn btn-secondary";
    }
  };

  // --- Hardware Button Command Handler (Previous / Next / Save) ---
  // This is the piece that was missing: serial.js now actually listens to
  // the Arduino, and this callback decides what PREV / NEXT / SAVE do.
  serialController.onDataReceivedCallback = (line) => {
    const cmd = line.trim().toUpperCase();

    if (cmd === "PREV") {
      browseCatalog(-1);
    } else if (cmd === "NEXT") {
      browseCatalog(1);
    } else if (cmd === "SAVE") {
      saveCurrentDesignFromHardware();
    }
    // Anything else (status echoes, ACKs) is just shown in the hardware
    // console by serialController's own logger — nothing to do here.
  };

  // --- Face Detection Status Change Handler ---
  faceTracker.onStatusChangeCallback = (faceDetected) => {
    appState.faceDetected = faceDetected;
    if (faceDetected) {
      dotFaceStatus.className = "status-dot active";
      txtFaceStatus.textContent = "Face: Detected";
      targetIndicator.classList.add("detected");

      // Notify Arduino of face detection state (deduplicated)
      if (appState.arduinoConnected) {
        serialController.sendCommand("FACE_DETECTED");
      }
    } else {
      dotFaceStatus.className = "status-dot warning";
      txtFaceStatus.textContent = "Face: Looking for face...";
      targetIndicator.classList.remove("detected");

      if (appState.arduinoConnected) {
        serialController.sendCommand("NO_FACE");
      }
    }
  };

  /**
   * The catalog items currently visible in the grid (respects the active
   * category tab). Used by both the on-screen render and the hardware
   * Previous/Next buttons, so they always agree on what "next" means.
   */
  function getFilteredCatalog() {
    return activeCategoryFilter === "all"
      ? jewelleryCatalog
      : jewelleryCatalog.filter(item => item.type === activeCategoryFilter);
  }

  /**
   * Select (or deselect) one catalog item and update everything that
   * depends on it: the grid UI, the active-items pills, a toast, and the
   * Arduino display. Shared by mouse clicks and the hardware buttons so
   * both behave identically.
   */
  function applyItemSelection(itemId) {
    const result = selectJewelleryItem(itemId);
    renderJewelleryCatalogUI();
    renderActiveItemsPills();

    if (result && result.action === "selected") {
      showToast(`Selected ${result.item.name}`, "success");
      if (appState.arduinoConnected) {
        const cmd = `${result.item.type.toUpperCase()}_SELECTED`;
        serialController.sendCommand(cmd, true);
      }
    } else if (result && result.action === "deselected") {
      showToast(`Deselected item`, "info");
    }

    return result;
  }

  /**
   * Move to the previous/next item in the current category and try it on,
   * triggered by the hardware Previous/Next buttons.
   * @param {number} direction -1 for Previous, +1 for Next
   */
  function browseCatalog(direction) {
    const list = getFilteredCatalog();
    if (list.length === 0) {
      showToast("No items in this category", "error");
      return;
    }

    browseIndex = (browseIndex + direction + list.length) % list.length;
    const item = list[browseIndex];

    applyItemSelection(item.id);

    // Bring the highlighted card into view since the user is browsing
    // with physical buttons, not the mouse.
    const card = jewelleryGrid.querySelector(`[data-id="${item.id}"]`);
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  /**
   * Save whatever is currently being worn as one "design" — this is the
   * software side of the ticket concept: each hardware Save press adds
   * one entry here.
   */
  function saveCurrentDesignFromHardware() {
    const activeItems = Object.entries(selectedJewelleryState)
      .filter(([_, item]) => item !== null);

    if (activeItems.length === 0) {
      showToast("Wear at least one item before saving", "error");
      return;
    }

    const ticketNumber = savedDesigns.length + 1;
    const itemNames = activeItems.map(([, item]) => item.name);

    savedDesigns.push({ ticketNumber, items: itemNames });

    showToast(`Saved! Ticket #${ticketNumber}`, "success");

    if (serialLogContainer) {
      const line = document.createElement("div");
      line.className = "serial-log-line info";
      line.textContent = `[Saved] Ticket #${ticketNumber}: ${itemNames.join(", ")}`;
      serialLogContainer.appendChild(line);
      serialLogContainer.scrollTop = serialLogContainer.scrollHeight;
    }

    if (appState.arduinoConnected) {
      serialController.sendCommand("SAVED", true);
    }
  }

  // --- Render Jewellery Selection UI Grid ---
  function renderJewelleryCatalogUI() {
    jewelleryGrid.innerHTML = "";

    const filteredCatalog = getFilteredCatalog();

    filteredCatalog.forEach(item => {
      const isSelected = selectedJewelleryState[item.type]?.id === item.id;
      const card = document.createElement("div");
      card.className = `jewellery-item-card ${isSelected ? 'selected' : ''}`;
      card.dataset.id = item.id;

      card.innerHTML = `
        <div class="item-thumb-wrapper">
          <img src="${item.image}" alt="${item.name}" loading="lazy" />
        </div>
        <div class="item-info">
          <div class="item-name">${item.name}</div>
          <div class="item-type">${item.type}</div>
        </div>
      `;

      card.addEventListener("click", () => {
        // Keep the hardware browse cursor in sync with manual clicks too.
        browseIndex = getFilteredCatalog().findIndex(i => i.id === item.id);
        applyItemSelection(item.id);
      });

      jewelleryGrid.appendChild(card);
    });
  }

  // --- Render Active Selection Pills ---
  function renderActiveItemsPills() {
    activePillsContainer.innerHTML = "";

    const activeItems = Object.entries(selectedJewelleryState)
      .filter(([_, item]) => item !== null);

    if (activeItems.length === 0) {
      activePillsContainer.innerHTML = `<span class="no-selection-text">No jewellery selected. Pick items from the catalog.</span>`;
      return;
    }

    activeItems.forEach(([category, item]) => {
      const pill = document.createElement("div");
      pill.className = "active-pill";
      pill.innerHTML = `
        <span>${item.name}</span>
        <span class="active-pill-remove" data-category="${category}">×</span>
      `;

      pill.querySelector(".active-pill-remove").addEventListener("click", (e) => {
        e.stopPropagation();
        removeJewelleryCategory(category);
        renderJewelleryCatalogUI();
        renderActiveItemsPills();
      });

      activePillsContainer.appendChild(pill);
    });
  }

  // --- Category Filter Tabs Listener ---
  categoryTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      categoryTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      activeCategoryFilter = tab.dataset.category;
      browseIndex = -1; // start browsing fresh in the new category
      renderJewelleryCatalogUI();
    });
  });

  // --- Camera Toggle Handler ---
  btnStartCamera.addEventListener("click", async () => {
    if (!appState.cameraConnected) {
      btnStartCamera.disabled = true;
      btnStartCamera.textContent = "Starting Camera...";

      try {
        // 1. Initialize Face Tracker Model
        await faceTracker.initialize();

        // 2. Start Camera Feed
        await cameraController.startCamera(videoElement);

        appState.cameraConnected = true;
        dotCameraStatus.className = "status-dot active";
        txtCameraStatus.textContent = "Camera: Active";
        cameraPlaceholder.classList.add("hidden");

        btnStartCamera.textContent = "Stop Camera";
        btnStartCamera.className = "btn btn-danger";
        btnStartCamera.disabled = false;

        showToast("Camera started successfully!", "success");

        // 3. Start Animation Processing Loop
        if (!isAnimationLoopRunning) {
          isAnimationLoopRunning = true;
          requestAnimationFrame(animationLoop);
        }

      } catch (err) {
        showToast(err.message, "error");
        btnStartCamera.textContent = "Start Camera";
        btnStartCamera.className = "btn btn-primary";
        btnStartCamera.disabled = false;
        dotCameraStatus.className = "status-dot";
        txtCameraStatus.textContent = "Camera: Error";
      }

    } else {
      // Stop Camera
      cameraController.stopCamera();
      appState.cameraConnected = false;
      appState.faceDetected = false;
      isAnimationLoopRunning = false;

      dotCameraStatus.className = "status-dot";
      txtCameraStatus.textContent = "Camera: Off";
      dotFaceStatus.className = "status-dot";
      txtFaceStatus.textContent = "Face: Off";
      cameraPlaceholder.classList.remove("hidden");
      targetIndicator.classList.remove("detected");

      btnStartCamera.textContent = "Start Camera";
      btnStartCamera.className = "btn btn-primary";

      jewelleryRenderer.clear();
      showToast("Camera stopped", "info");
    }
  });

  // --- Arduino Connection Button Handler ---
  btnConnectArduino.addEventListener("click", async () => {
    if (!appState.arduinoConnected) {
      try {
        await serialController.connectArduino();
      } catch (err) {
        // Error logging handled by serialController
      }
    } else {
      await serialController.disconnectArduino();
    }
  });

  // --- Remove All Button Handler ---
  btnRemoveAll.addEventListener("click", () => {
    removeAllJewellery();
    renderJewelleryCatalogUI();
    renderActiveItemsPills();
    showToast("Cleared all selected jewellery", "info");
    if (appState.arduinoConnected) {
      serialController.sendCommand("RESET");
    }
  });

  // --- Debug Landmarks Checkbox ---
  chkDebugLandmarks.addEventListener("change", (e) => {
    jewelleryRenderer.showLandmarkDebug = e.target.checked;
  });

  // --- Main Animation Frame Loop (requestAnimationFrame) ---
  async function animationLoop() {
    if (!isAnimationLoopRunning || !appState.cameraConnected) {
      return;
    }

    // 1. Resize canvas to match video dimensions
    const { width, height } = cameraController.getDimensions();
    jewelleryRenderer.resizeCanvas(width, height);

    // 2. Process video frame through face tracker
    await faceTracker.processFrame(videoElement);

    // 3. Render jewellery overlay
    const landmarks = faceTracker.getLandmarks();
    jewelleryRenderer.renderFrame(landmarks, selectedJewelleryState);

    // 4. Schedule next frame
    requestAnimationFrame(animationLoop);
  }

  // Initial UI Render
  renderJewelleryCatalogUI();
  renderActiveItemsPills();
});