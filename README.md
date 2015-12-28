# sparked
sparked is a remote push-to-deploy system for arduino

---

##Usage:
1. Hook arduino up to slave computer
* Install sparked on computer
* Set up a slack bot for sparked (if integrating with slack, otherwise leave blank)
* Run sparked, and tell it which file to pull, include auth token if needed (for private repos). Also include slack bot info if integrating with slack
* Sparked will automatically download, build, verify, and deploy to arduino if the .ino file passes verification. If not, sparked will send an error through slack
* While running, sparked will stream output from serial output once the command ```start talking``` is used in a private message or in a channel that sparked's bot is in

##Slack Integration:
sparked can send serial output to slack. Type these commands in slack to interact with sparked. Type these commands alone if you're direct messaging the bot, but prefix these commands with an @[bot's name] if in a channel.
* ```help``` to display all of these commands
* ```status``` to output current sparked status
* ```refetch, reupload, upload,``` or ```update``` to manually fetch the file, upload it to the arduino and restart. Also should be used to update after baud and port changes have been finalized, otherwise they will come into play after the next update to and subsequent download from repo. If file cannot be downloaded, sparked will ask if it should use the previously downloaded version instead.
* ```baud [new baud rate]``` to change baud rate
* ```list, ports,``` or ```list ports``` to list serial devices
* ```change port [serialnumber]``` to change port to read serial output from and upload files to
* ```change file [raw github file url]``` to switch to a new file url to monitor and upload
* ```reauth [new github auth token]``` to switch github auth token
* ```serialprint [message to send]``` to input a message into serial input
* ```talk here``` to start outputting serial data in that channel/private message
* ```stop talking``` to stop outputting serial data in that channel/private message
* ```quit``` to quit dosparked

---

##Setup:
* Install avrdude
* ```npm install -g [package name]```
---

##License:
###MIT
