/* ==========================================================================
   Virtual Jewellery Wearable System - Jewellery Catalog & State Management
   ========================================================================== */

const jewelleryCatalog = [
  // --- Necklaces ---
  {
    id: "necklace-01",
    name: "Kundan Royal Choker",
    type: "necklace",
    image: "assets/jewellery/necklace/necklace1.svg",
    scaleFactor: 1.65, // Relative to jaw distance
    offsetY: 0.52,     // Fraction of face height below chin
    offsetX: 0
  },
  {
    id: "necklace-02",
    name: "Emerald Diamond Choker",
    type: "necklace",
    image: "assets/jewellery/necklace/necklace2.svg",
    scaleFactor: 1.55,
    offsetY: 0.48,
    offsetX: 0
  },
  {
    id: "necklace-03",
    name: "Temple Gold Haar",
    type: "necklace",
    image: "assets/jewellery/necklace/necklace3.svg",
    scaleFactor: 1.85,
    offsetY: 0.62,
    offsetX: 0
  },

  // --- Earrings ---
  {
    id: "earring-01",
    name: "Royal Gold Jhumkas",
    type: "earrings",
    image: "assets/jewellery/earrings/earrings1.svg",
    scaleFactor: 0.42, // Relative to face width
    offsetY: 0.05,     // Offset relative to earlobe position
    offsetX: 0
  },
  {
    id: "earring-02",
    name: "Sapphire Diamond Drop",
    type: "earrings",
    image: "assets/jewellery/earrings/earrings2.svg",
    scaleFactor: 0.38,
    offsetY: 0.05,
    offsetX: 0
  },
  {
    id: "earring-03",
    name: "Ruby Floral Danglers",
    type: "earrings",
    image: "assets/jewellery/earrings/earrings3.svg",
    scaleFactor: 0.40,
    offsetY: 0.05,
    offsetX: 0
  },

  // --- Nose Rings ---
  {
    id: "nosering-01",
    name: "Maharani Pearl Nath",
    type: "noseRing",
    image: "assets/jewellery/nose-rings/nose-ring1.svg",
    scaleFactor: 0.36, // Relative to nose width
    offsetY: 0.02,
    offsetX: -0.05    // Placed near left nostril
  },
  {
    id: "nosering-02",
    name: "Diamond Stud Ring",
    type: "noseRing",
    image: "assets/jewellery/nose-rings/nose-ring2.svg",
    scaleFactor: 0.22,
    offsetY: 0,
    offsetX: -0.04
  },

  // --- Bindi ---
  {
    id: "bindi-01",
    name: "Crimson Royal Bindi",
    type: "bindi",
    image: "assets/jewellery/bindi/bindi1.svg",
    scaleFactor: 0.16, // Relative to eyebrow distance
    offsetY: -0.02,
    offsetX: 0
  },
  {
    id: "bindi-02",
    name: "Crystal Marquise Bindi",
    type: "bindi",
    image: "assets/jewellery/bindi/bindi2.svg",
    scaleFactor: 0.18,
    offsetY: -0.03,
    offsetX: 0
  },

  // --- Tikka ---
  {
    id: "tikka-01",
    name: "Kundan Maang Tikka",
    type: "tikka",
    image: "assets/jewellery/tikka/tikka1.svg",
    scaleFactor: 0.55, // Relative to forehead size
    offsetY: -0.38,
    offsetX: 0
  },
  {
    id: "tikka-02",
    name: "Emerald Royal Tikka",
    type: "tikka",
    image: "assets/jewellery/tikka/tikka2.svg",
    scaleFactor: 0.52,
    offsetY: -0.36,
    offsetX: 0
  }
];

// Active selection state object as required in Section 19 & 25
const selectedJewelleryState = {
  necklace: null,
  earrings: null,
  noseRing: null,
  bindi: null,
  tikka: null
};

// Image element cache to avoid re-instantiating image objects frame by frame
const loadedImageCache = new Map();

/**
 * Preload all jewellery images in background
 */
function preloadJewelleryImages() {
  jewelleryCatalog.forEach(item => {
    const img = new Image();
    img.src = item.image;
    loadedImageCache.set(item.id, img);
  });
}

/**
 * Select a jewellery item by ID (replaces existing item in same category)
 * @param {string} id 
 * @returns {object|null} newly selected item or null
 */
function selectJewelleryItem(id) {
  const item = jewelleryCatalog.find(j => j.id === id);
  if (!item) return null;

  // Toggle deselect if clicking already selected item
  if (selectedJewelleryState[item.type]?.id === id) {
    selectedJewelleryState[item.type] = null;
    return { item: null, category: item.type, action: 'deselected' };
  }

  selectedJewelleryState[item.type] = item;
  return { item, category: item.type, action: 'selected' };
}

/**
 * Remove selected item from a category
 * @param {string} category 
 */
function removeJewelleryCategory(category) {
  if (selectedJewelleryState.hasOwnProperty(category)) {
    selectedJewelleryState[category] = null;
  }
}

/**
 * Reset all active jewellery selections
 */
function removeAllJewellery() {
  Object.keys(selectedJewelleryState).forEach(cat => {
    selectedJewelleryState[cat] = null;
  });
}

/**
 * Get Image HTML element from cache
 * @param {string} id 
 */
function getJewelleryImage(id) {
  return loadedImageCache.get(id) || null;
}

// Preload assets upon script load
preloadJewelleryImages();
