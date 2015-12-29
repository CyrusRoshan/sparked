void setup() {
    Serial.begin(9600);
    pinMode(13, OUTPUT);
}

void loop() {
    Serial.print("test");
    Serial.println("LINE");
    delay(500);
}

void serialEvent() {
    while (Serial.available()) {

        char ch = (char)Serial.read();

        Serial.print(ch);
        Serial.println(ch);

        if (ch == '\n') {
            Serial.print("Line detected");
        } else if (ch == '1') {
            digitalWrite(13, HIGH);
        } else if (ch == '0') {
            digitalWrite(13, LOW);
        }
    }
}
