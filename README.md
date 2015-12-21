# sparked
deploy .ino files to gh from one computer and have them deployed to an arduino on another computer, with the results streamed back to the first

---

##Usage:
1. Hook arduino up to slave computer
* Install sparked on computer
* Set up a slack bot (optional)
* Run sparked, and tell it which file to pull, include auth token if needed. Also include slack bot info
* Sparked will automatically download, build, verify, and deploy to arduino if the .ino file passes verification. If not, sparked will send an error through slack
* While running, sparked will stream output from serial output to the slack channel. An optional delay is recommended to be set, otherwise it will default to 1000 ms (will aggregate data from the past 1000 ms and post as one message)

<br>

##Setup:
1. ```git clone https://github.com/CyrusRoshan/sparked.git```
* ```cd sparked```
* ```wget "http://playground.arduino.cc/uploads/Learning/arduino-core-0005.zip"```
* ```unzip arduino-core-0005.zip```
* ```mv arduino arduino-core```

---

##License:
###MIT
