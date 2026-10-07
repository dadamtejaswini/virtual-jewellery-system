#define USE_LCD_I2C 1

#if USE_LCD_I2C
  #include <Wire.h>
  #include <LiquidCrystal_I2C.h>
  LiquidCrystal_I2C lcd(0x27, 16, 2);
#endif

// ====================================================
// PIN DEFINITIONS
// ====================================================

const int LED_FACE_DETECTED = 13;
const int LED_SYSTEM_READY  = 12;

const int BTN_PREV       = 2;
const int BTN_NEXT       = 3;
const int BTN_SAVE       = 4;
const int BTN_SHOW_SAVED = 5;

// ====================================================
// JEWELLERY CATEGORIES
// ====================================================

String items[5] = {
  "NECKLACE",
  "EARRINGS",
  "NOSE RING",
  "BINDI",
  "TIKKA"
};

int pos = 0;

// ====================================================
// SERIAL
// ====================================================

String inputBuffer = "";
String currentStatus = "BOOTING...";
String selectedJewellery = "NONE";

// ====================================================
// SAVED JEWELLERY
// ====================================================

const int MAX_SAVED = 20;

String savedIDs[MAX_SAVED];

int savedCount = 0;
int savedDisplayPosition = 0;

// ====================================================
// BUTTON STATE
// ====================================================

// Previous button states
int prevState = HIGH;
int nextState = HIGH;
int saveState = HIGH;
int showSavedState = HIGH;

// Last time button was changed
unsigned long lastPrevTime = 0;
unsigned long lastNextTime = 0;
unsigned long lastSaveTime = 0;
unsigned long lastShowSavedTime = 0;

// Debounce time
const unsigned long DEBOUNCE_TIME = 250;

// ====================================================
// SETUP
// ====================================================

void setup() {

  Serial.begin(9600);

  // ---------------- LEDs ----------------

  pinMode(LED_FACE_DETECTED, OUTPUT);
  pinMode(LED_SYSTEM_READY, OUTPUT);

  digitalWrite(LED_FACE_DETECTED, LOW);
  digitalWrite(LED_SYSTEM_READY, HIGH);

  // ---------------- Buttons ----------------

  pinMode(BTN_PREV, INPUT_PULLUP);
  pinMode(BTN_NEXT, INPUT_PULLUP);
  pinMode(BTN_SAVE, INPUT_PULLUP);
  pinMode(BTN_SHOW_SAVED, INPUT_PULLUP);

  // ---------------- LCD ----------------

  #if USE_LCD_I2C

    lcd.init();
    lcd.backlight();

    displayLCD("VIRTUAL JEWELLERY", "SYSTEM READY");

  #endif

  Serial.println("Virtual Jewellery Hardware Controller Ready");
}

// ====================================================
// MAIN LOOP
// ====================================================

void loop() {

  // ==================================================
  // PREVIOUS BUTTON
  // ==================================================

  int currentPrevState = digitalRead(BTN_PREV);

  if (currentPrevState == LOW && prevState == HIGH) {

    if (millis() - lastPrevTime > DEBOUNCE_TIME) {

      pos = (pos + 4) % 5;

      selectedJewellery = items[pos];

      Serial.println("PREV");

      printStatus("PREVIOUS", selectedJewellery);

      lastPrevTime = millis();
    }
  }

  prevState = currentPrevState;


  // ==================================================
  // NEXT BUTTON
  // ==================================================

  int currentNextState = digitalRead(BTN_NEXT);

  if (currentNextState == LOW && nextState == HIGH) {

    if (millis() - lastNextTime > DEBOUNCE_TIME) {

      pos = (pos + 1) % 5;

      selectedJewellery = items[pos];

      Serial.println("NEXT");

      printStatus("NEXT", selectedJewellery);

      lastNextTime = millis();
    }
  }

  nextState = currentNextState;


  // ==================================================
  // SAVE BUTTON
  // ==================================================

  int currentSaveState = digitalRead(BTN_SAVE);

  if (currentSaveState == LOW && saveState == HIGH) {

    if (millis() - lastSaveTime > DEBOUNCE_TIME) {

      Serial.println("SAVE");

      printStatus("SAVE PRESSED", selectedJewellery);

      lastSaveTime = millis();
    }
  }

  saveState = currentSaveState;


  // ==================================================
  // SHOW SAVED BUTTON
  // ==================================================

  int currentShowSavedState = digitalRead(BTN_SHOW_SAVED);

  if (currentShowSavedState == LOW && showSavedState == HIGH) {

    if (millis() - lastShowSavedTime > DEBOUNCE_TIME) {

      Serial.println("SHOW SAVED");

      showNextSavedID();

      lastShowSavedTime = millis();
    }
  }

  showSavedState = currentShowSavedState;


  // ==================================================
  // READ SERIAL FROM LAPTOP
  // ==================================================

  while (Serial.available() > 0) {

    char c = (char)Serial.read();

    if (c == '\n' || c == '\r') {

      inputBuffer.trim();

      if (inputBuffer.length() > 0) {

        handleCommand(inputBuffer);

      }

      inputBuffer = "";

    } else {

      inputBuffer += c;
    }
  }
}

// ====================================================
// HANDLE COMMANDS FROM LAPTOP
// ====================================================

void handleCommand(String command) {

  command.trim();

  String upperCommand = command;

  upperCommand.toUpperCase();


  // ==================================================
  // READY
  // ==================================================

  if (upperCommand == "READY") {

    currentStatus = "CONNECTED";

    digitalWrite(LED_SYSTEM_READY, HIGH);

    printStatus("SYSTEM CONNECTED", "READY");
  }


  // ==================================================
  // FACE DETECTED
  // ==================================================

  else if (upperCommand == "FACE_DETECTED") {

    currentStatus = "FACE DETECTED";

    digitalWrite(LED_FACE_DETECTED, HIGH);

    printStatus("FACE DETECTED", selectedJewellery);
  }


  // ==================================================
  // NO FACE
  // ==================================================

  else if (upperCommand == "NO_FACE") {

    currentStatus = "LOOKING...";

    digitalWrite(LED_FACE_DETECTED, LOW);

    printStatus("NO FACE DETECTED", selectedJewellery);
  }


  // ==================================================
  // CATEGORY SELECTION
  // ==================================================

  else if (upperCommand == "NECKLACE_SELECTED") {

    selectedJewellery = "NECKLACE";

    pos = 0;

    printStatus("CATEGORY", "NECKLACE");
  }


  else if (upperCommand == "EARRINGS_SELECTED") {

    selectedJewellery = "EARRINGS";

    pos = 1;

    printStatus("CATEGORY", "EARRINGS");
  }


  else if (
    upperCommand == "NOSE_RING_SELECTED" ||
    upperCommand == "NOSERING_SELECTED"
  ) {

    selectedJewellery = "NOSE RING";

    pos = 2;

    printStatus("CATEGORY", "NOSE RING");
  }


  else if (upperCommand == "BINDI_SELECTED") {

    selectedJewellery = "BINDI";

    pos = 3;

    printStatus("CATEGORY", "BINDI");
  }


  else if (upperCommand == "TIKKA_SELECTED") {

    selectedJewellery = "TIKKA";

    pos = 4;

    printStatus("CATEGORY", "TIKKA");
  }


  // ==================================================
  // RECEIVE JEWELLERY ID
  // Example: ID:N001
  // ==================================================

  else if (upperCommand.startsWith("ID:")) {

    String jewelleryID = command.substring(3);

    jewelleryID.trim();

    if (jewelleryID.length() > 0) {

      selectedJewellery = jewelleryID;

      printStatus("SELECTED", jewelleryID);
    }
  }


  // ==================================================
  // SAVE JEWELLERY ID
  // Example: SAVE_ID:N001
  // ==================================================

  else if (upperCommand.startsWith("SAVE_ID:")) {

    String jewelleryID = command.substring(8);

    jewelleryID.trim();

    saveJewelleryID(jewelleryID);
  }


  // ==================================================
  // CLEAR SAVED LIST
  // ==================================================

  else if (upperCommand == "CLEAR_SAVED") {

    savedCount = 0;

    savedDisplayPosition = 0;

    printStatus("SAVED LIST", "CLEARED");
  }


  // ==================================================
  // RESET
  // ==================================================

  else if (upperCommand == "RESET") {

    selectedJewellery = "NONE";

    pos = 0;

    digitalWrite(LED_FACE_DETECTED, LOW);

    printStatus("SYSTEM RESET", "READY");
  }


  // ==================================================
  // UNKNOWN COMMAND
  // ==================================================

  else {

    Serial.print("ACK: ");

    Serial.println(command);
  }
}

// ====================================================
// SAVE JEWELLERY ID
// ====================================================

void saveJewelleryID(String jewelleryID) {

  if (jewelleryID.length() == 0) {

    return;
  }


  // ---------------- Check duplicate ----------------

  for (int i = 0; i < savedCount; i++) {

    if (savedIDs[i] == jewelleryID) {

      printStatus("ALREADY SAVED", jewelleryID);

      return;
    }
  }


  // ---------------- Check memory ----------------

  if (savedCount >= MAX_SAVED) {

    printStatus("MEMORY FULL", "20 ITEMS");

    return;
  }


  // ---------------- Save ID ----------------

  savedIDs[savedCount] = jewelleryID;

  savedCount++;


  // Start from newest saved item

  savedDisplayPosition = savedCount - 1;


  Serial.print("SAVED ID: ");

  Serial.println(jewelleryID);


  printStatus("SAVED", jewelleryID);
}

// ====================================================
// SHOW NEXT SAVED JEWELLERY ID
// ====================================================

void showNextSavedID() {

  // No saved designs

  if (savedCount == 0) {

    displayLCD("SAVED JEWELLERY", "NONE");

    Serial.println("NO SAVED DESIGNS");

    return;
  }


  // Get current saved ID

  String id = savedIDs[savedDisplayPosition];


  // Display ONLY the ID

  displayLCD("SAVED JEWELLERY", id);


  Serial.print("SHOW SAVED: ");

  Serial.println(id);


  // Move to next ID

  savedDisplayPosition++;


  if (savedDisplayPosition >= savedCount) {

    savedDisplayPosition = 0;
  }
}

// ====================================================
// PRINT STATUS
// ====================================================

void printStatus(String line1, String line2) {

  Serial.print("[Arduino Display] Line 1: ");

  Serial.print(line1);

  Serial.print(" | Line 2: ");

  Serial.println(line2);


  #if USE_LCD_I2C

    displayLCD(line1, line2);

  #endif
}

// ====================================================
// LCD DISPLAY
// ====================================================

#if USE_LCD_I2C

void displayLCD(String line1, String line2) {

  lcd.clear();

  lcd.setCursor(0, 0);

  lcd.print(line1.substring(0, 16));

  lcd.setCursor(0, 1);

  lcd.print(line2.substring(0, 16));
}

#endif