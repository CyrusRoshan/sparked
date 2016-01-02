'use strict';
var Promise = require('bluebird');
Promise.longStackTraces();

var inquirer = require('inquirer');
var Botkit = require('botkit');
var serialPort = require('serialport');
var SerialPort = serialPort.SerialPort;
var http = require('http');
var https = require('https');
var fs = require('fs');
var exec = require('child_process').exec;

Promise.promisifyAll(inquirer);
Promise.promisifyAll(Botkit);
Promise.promisifyAll(serialPort);
Promise.promisifyAll(SerialPort);
Promise.promisifyAll(http);
Promise.promisifyAll(https);
Promise.promisifyAll(fs);
Promise.promisifyAll(exec);


serialPort.listAsync()
.then(ports => {
    return new Promise(resolve => {
        inquirer.prompt(getQuestions(ports), answers => {
            resolve(answers);
        });
    });
})
.then(answers => {
    var data = {
        answers: answers,
        forcedUpdate: false
    };


    if (data.answers.slackToken) {
        new Promise(resolve => {

            console.log('\n\nYour sparkedbot is being created!\nType "dosparked help" in slack to get a list of commands in slack\n\n');

            var Botkit = require('botkit');

            data.sparkedbot = Botkit.slackbot({
                debug: false,
                log: true
            });

            data.connect = function() {
                data.sparkedbot.spawn({
                    token: data.answers.slackToken,
                }).startRTM(err => {
                    if (err) {
                        if (!data.reconnects) {
                            data.reconnects = 1;
                        } else if (data.reconnects < 3) {

                        }
                        console.log(`Could not connect to slack, retrying (${data.reconnects})`);
                    }
                });
            }

            data.connect();

            resolve(data);
        });
    }
    data.serialPort = new SerialPort(data.answers.port, {
        baudrate: 9600,//data.answers.baud,
        parser: serialPort.parsers.readline('\n')
    }, true);
    data.serialPort.on('open', () => {
        data.serialOpen = true;
    });

    return data;
})
.then(data => {
    if (data.sparkedbot) {

        data.sparkedbot.hears(['^help'], ['direct_message', 'direct_mention'], (bot, message) => {
            bot.reply(message, 'Hello.');
        });

        data.sparkedbot.hears(['^example'], ['direct_message', 'direct_mention'], (bot, message) => {
            bot.reply(message, 'Hello.');
        });

        data.sparkedbot.hears(['^status', '^current'], ['direct_message', 'direct_mention'], (bot, message) => {
            var attachments = [];
            var attachment = {
                title: 'Status:',
                color: '#FDD835',
                fields: [],
            }

            attachment.fields.push({
                label: 'Field',
                value: `Current port: ${data.answers.port}`,
                short: false,
            })

            attachment.fields.push({
                label: 'Field',
                value: `Current baud rate: ${data.answers.baud}`,
                short: false,
            })

            attachment.fields.push({
                label: 'Field',
                value: `File being monitored: ${data.answers.filepath}`,
                short: false,
            })

            attachments.push(attachment);

            bot.reply(message, {
                text: '',
                attachments: attachments,
            }, (err,resp) => {
                //do nothing for now
            });
        });

        data.sparkedbot.hears(['^refetch', '^reupload', '^upload', '^update'], ['direct_message', 'direct_mention'], (bot, message) => {
            bot.reply(message, `Refetching and uploading "${data.answers.filepath}"`);
            data.forcedUpdate = true;
            upload(data)
            .then(cliOutput => {
                bot.reply(message, 'CLI output after uploading: ');
                bot.reply(message, '```' + cliOutput + '```');
            })
        });

        data.sparkedbot.hears(['^baud (.*)'], ['direct_message', 'direct_mention'], (bot, message) => {
            var baud = message.match[1];
            var baudrates = getQuestions()[1].choices;

            if (baudrates.indexOf(baud) != -1) {
                data.answers.baud = baud;
                bot.reply(message, `Setting baud rate to ${baud}. Use "update" to finalize changes to settings`);
            } else {
                bot.reply(message, `${baud} is an invalid baud rate, the following baud rates are supported:`);
                bot.reply(message, baudrates.join(', '));
            }
        });

        data.sparkedbot.hears(['^list'], ['direct_message', 'direct_mention'], (bot, message) => {
            serialPort.listAsync().then(ports => ports)
            .then(ports => {

                var attachments = [];
                var attachment = {
                    title: 'Available Ports:',
                    color: '#FDD835',
                    fields: [],
                }

                ports.forEach(port => {
                    attachment.fields.push({
                        label: 'Field',
                        value: port.comName,
                        short: false
                    })
                });

                attachments.push(attachment);

                bot.reply(message, {
                    text: '',
                    attachments: attachments,
                }, (err,resp) => {
                    //do nothing for now
                });
            })
        });

        data.sparkedbot.hears(['^port (.*)'], ['direct_message', 'direct_mention'], (bot, message) => {
            var desiredPort = message.match[1];
            var found = false;
            serialPort.listAsync().then(ports => {
                ports.forEach( port => {
                    if(port.comName === desiredPort){
                        found = true;
                    }
                });
                if (found === false) {
                    bot.reply(message, `Sorry, but no serial port exists with the name "${desiredPort}"`);
                } else {
                    data.answers.port = desiredPort;
                    bot.reply(message, `The port "${desiredPort}" is now the desired port. Use "update" to finalize changes to settings`);
                }
            })
        });

        data.sparkedbot.hears(['^file (.*)'], ['direct_message', 'direct_mention'], (bot, message) => {
            var filepath = message.match[1].slice(1, -1);
            if (filepath.match(/https:\/\/raw\.githubusercontent\.com\/.*\.ino/g)){
                data.answers.filepath = filepath;
                bot.reply(message, `Now watching the file ${filepath}`);
                bot.reply(message, 'Make sure to add or change the github auth token by dm\'ing me with reauth [token] if the file is in a private repo that requires new permissions')
            } else {
                bot.reply(message, `Sorry, but the url "${filepath}" does not seem like a valid raw github-hosted .ino file`);
            }
        });

        data.sparkedbot.hears(['^auth (.*)'], ['direct_message', 'direct_mention'], (bot, message) => {
            if (message.event === 'direct_mention') {
                bot.reply(message, 'Well, if you\'re fine giving private repo privelage to everyone who can read this...');
            }
            var githubToken = message.match[1];
            data.answers.githubToken = githubToken;
            bot.reply(message, `Setting GitHub auth token to "${githubToken}"`);

        });

        data.sparkedbot.hears(['^print (.*)', '^print\(\"(.*)\"\)'], ['direct_message', 'direct_mention'], (bot, message) => {
            // using print\(([\'\"])(.*)\1\) leads to an octal literal error in strict mode, and arduino uses double quotes instead of single quotes for printing string literals anyway
            var serialData = message.match[1];
            if (data.serialOpen) {
                bot.reply(message, `Sent the following over serial: *${serialData}*`);
                data.serialPort.write(serialData);
            } else {
                bot.reply(message, 'Sorry, the serial port has not opened yet. Data cannot be transferred until it is open');
                bot.reply(message, 'Do you have another application accessing this port? For example, the Arduino IDE\'s serial monitor will interfere with accessing the serial port');
            }
        });

        data.sparkedbot.hears(['^start'], ['direct_message', 'direct_mention'], (bot, message) => {
            data.talk = true;
            if (data.serialOpen) {
                bot.reply(message, 'Ok, I\'ll write serial output here');
                data.serialPort.on('data', serialData => {
                    if (data.talk) {
                        bot.reply(message, `*Serial Output:* ${serialData}`);
                        console.log(serialData);
                    }
                });
            } else {
                bot.reply(message, 'Sorry, the serial port has not opened yet. Data cannot be transferred until it is open');
                bot.reply(message, 'Do you have another application accessing this port? For example, the Arduino IDE\'s serial monitor will interfere with accessing the serial port');
            }
        });

        data.sparkedbot.hears(['^stop'], ['direct_message', 'direct_mention'], (bot, message) => {
            data.talk = false;
            bot.reply(message, 'Ok. I\'ll stop writing serial output here.');
        });

        data.sparkedbot.hears(['^quit', '^shut down'], ['direct_message', 'direct_mention'], (bot, message) => {
            bot.reply(message, 'If you say so. Quitting the node process...');
            console.log('\n\nThe quit command was executed from slack, quitting...\n\n')
            process.exit(1);
        });
    }
    return data;
})
.then(data => {

})
.catch(e => {
    console.log(`Error while starting sparked: ${e}`);
})



function upload(data) {

    if (data.forcedUpdate) {
        data.serialPort = new SerialPort(data.answers.port, {
            baudrate: data.answers.baud,
            parser: serialPort.parsers.readline("\n")
        }, true);
    }

    var fileUploadProcess = new Promise( (resolve, reject) => {
        if (data.serialOpen) {
            https.get(data.answers.filepath, res => {
                res.on('data', fileData => {
                    resolve(fileData);
                });
            });
        } else {
            reject('Serial port is not yet open, cannot upload data');
        }
    })
    .then(fileData => {
        return new Promise((resolve, reject) => {
            fileData = fileData.toString('utf8');
            fs.writeFileAsync(`${__dirname}downloadedFile.ino`, fileData)
            .done(content => {
                resolve();
            }, error => {
                reject(error);
            });
        });
    })
    .then(() => {
        return new Promise((resolve, reject) => {
            var cmd = `cat ${__dirname}downloadedFile.ino`;
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else if (stderr) {
                    reject(stderr);
                }
                resolve(stdout);
            });
        });
    })
    .catch(e => {
        console.log(`Error while uploading: [${e}]`);
    })

    return fileUploadProcess.then().then().then(data => { return data });
}



function getQuestions(ports) {
    if(ports){
        var portNames = ports.map(port => port.comName);
    }

    function getValue(value) {
        return answers => answers[ value ];
    }

    return [
        {
            type: 'list',
            name: 'port',
            message: 'Which serial port is the arduino connected to?',
            choices: portNames,
        },
        {
            type: 'list',
            name: 'baud',
            message: 'What baud rate should serial begin at?',
            choices: [
                '115200',
                '57600',
                '38400',
                '28800',
                '19200',
                '14400',
                '9600',
                '4800',
                '2400',
                '1200',
                '600',
                '300',
            ]
        },
        {
            type: 'input',
            name: 'filepath',
            message: 'Please enter the url to the raw file:\n',
            validate: value => {
                return true;
                if (value.match(/https:\/\/raw\.githubusercontent\.com\/.*\.ino/g)) {
                    return true;
                } else {
                    return 'Please enter a valid file path, e.g. https://raw.githubusercontent.com/USERNAME/REPO/BRANCH/FOLDER/FILE.ino';
                }
            }
        },
        {
            type: 'input',
            name: 'githubToken',
            message: 'If this is a private repo, please enter an auth code to view it:\n',
            validate: value => {
                return true;
                if (value.length === 40 || value.length === 0) {
                    return true;
                } else {
                    return 'Please enter a valid auth code';
                }
            }
        },
        {
            type: 'input',
            name: 'slackToken',
            message: 'If integrating with slack, please slack bot token:\n',
            validate: value => {
                return true;
                if (value.length === 41 || value.length === 0) {
                    return true;
                } else {
                    return 'Please enter a valid slack bot token';
                }
            }
        }
    ]
};
