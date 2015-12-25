# sparked
sparked is a remote push-to-deploy system for arduino

---

##Usage:
1. Hook arduino up to slave computer
* Install sparked on computer
* Set up a slack bot (optional)
* Run sparked, and tell it which file to pull, include auth token if needed. Also include slack bot info
* Sparked will automatically download, build, verify, and deploy to arduino if the .ino file passes verification. If not, sparked will send an error through slack
* While running, sparked will stream output from serial output to the slack channel

##Slack Integration:
sparked can send serial output to slack. Type these commands in slack to interact with sparked.
* ```dosparked status``` to output current sparked status
* ```dosparked restart``` to reupload the file to the arduino and restart it
* ```dosparked baud [new baud rate]``` to change baud rate
* ```dosparked list``` to list serial devices
* ```dosparked device [serialnumber]``` to change device to read serial output from and upload files to
* ```dosparked file [raw github file url]``` to switch to a new file url to monitor and upload
* ```dosparked reauth [new github auth token]``` to switch github auth token
* ```dosparked serialprint [message to send]``` to input a message into serial input
* ```dosparked movechat [channel or username to message]``` to move sparked output to another chat (sparked will still accept input across all channels)
* ```dosparked mute``` to mute serial output and ```dosparked unmute``` to unmute serial output
* ```dosparked pause``` to pause dospark execution (but not arduino code), and ```dosparked resume``` to resume

---

##Setup:
1. ```git clone https://github.com/CyrusRoshan/sparked.git```
* ```cd sparked```
* ```wget "http://playground.arduino.cc/uploads/Learning/arduino-core-0005.zip"```
* ```unzip arduino-core-0005.zip```
* ```mv arduino arduino-core```
* ```rm arduino-core/Makefile```

---

##License:
###MIT
