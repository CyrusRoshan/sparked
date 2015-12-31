String inputWord = "";
boolean wordComplete = false;
int i = 0;

void setup() {
    Serial.begin(9600);
    inputWord.reserve(200);
}

void loop() {
    Serial.println(i++);
    delay(100);
}


void serialEvent() {
    while (Serial.available()) {
        int test;
        char inChar = (char)Serial.read();

        if (inChar == ' ' || inChar == '.') {
            wordComplete = true;
        } else {
            inputWord += inChar;
        }
    }
    if (wordComplete) {
        if (inputWord.equalsIgnoreCase("ON")) {
            digitalWrite(13, HIGH);
        } else if (inputWord.equalsIgnoreCase("OFF")) {
            digitalWrite(13, LOW);
        } else if (inputWord.equalsIgnoreCase("PRINT")) {
            Serial.println(inputWord);
        }
        inputWord = "";
        wordComplete = false;
    }
}
