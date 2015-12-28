'use strict';
var Promise = require('bluebird');

var inquirer = require('inquirer');
var Botkit = require('botkit');
var serialPort = require('serialport');

Promise.promisifyAll(inquirer);
Promise.promisifyAll(Botkit);
Promise.promisifyAll(serialPort);


serialPort.listAsync().then(ports => ports)
    .then(ports => {
    return new Promise(resolve => {
        inquirer.prompt(getQuestions(ports), answers => {
            resolve(answers);
        });
    });
})

    .then(answers => {
    var data = {
        answers: answers
    };
    if (answers.slackToken) {
        return new Promise(resolve => {

            console.log('\n\nYour sparkedbot is being created!\nType "dosparked help" in slack to get a list of commands in slack\n');

            var Botkit = require('botkit');

            data.sparkedbot = Botkit.slackbot({
                debug: false,
                log: false
            });

            data.sparkedbot.spawn({
                token: data.answers.slackToken,
            }).startRTM(err => {
                if (err) {
                    throw new Error(err);
                }
            });

            resolve(data);
        });
    }
    return data;
})

    .then(data => {
    if (data.sparkedbot) {
        data.sparkedbot.hears(['status', 'current'], 'direct_message, direct_mention, mention', (bot, message) => {
            var attachments = [];
            var attachment = {
                title: 'Status:',
                color: '#FDD835',
                fields: [],
            }

            attachment.fields.push({
                label: 'Field',
                value: 'Current port: ' + data.answers.port,
                short: false,
            })

            attachment.fields.push({
                label: 'Field',
                value: 'Current baud rate: ' + data.answers.baud,
                short: false,
            })

            attachment.fields.push({
                label: 'Field',
                value: 'File being monitored: ' + data.answers.filepath,
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

        data.sparkedbot.hears(['refetch', 'reupload', 'upload', 'update'], 'direct_message, direct_mention, mention', (bot, message) => {
            bot.reply(message, 'Refetching and uploading ' + data.answers.filepath);
            upload(data.answers.filepath);
        });

        data.sparkedbot.hears(['baud', 'rebaud'], 'direct_message, direct_mention, mention', (bot, message) => {
            var baud = message.text.split(' ')[1];
            var baudrates = getQuestions()[1].choices;

            if (baudrates.indexOf(baud) != -1) {
                bot.reply(message, 'Setting baud rate to ' + baud + '. Use "update" to finalize changes to settings');
                data.answers.baud = baud;
            } else {
                bot.reply(message, baud + ' is an invalid baud rate, the following baud rates are supported:');
                bot.reply(message, baudrates.join(', '));
            }
        });
        data.sparkedbot.hears(['list', 'ports'], 'direct_message, direct_mention, mention', (bot, message) => {
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
                        short: false,
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
        data.sparkedbot.hears(['change device', 'change port', 'switch port'], 'direct_message, direct_mention, mention', (bot, message) => {
            var desiredPort = message.text.split(' ')[1];
            var found = false;
            serialPort.listAsync().then(ports => ports)
                .then(ports => {
                for (port in ports) {
                    if(port.comName === desiredPort){
                        found = true;
                        break;
                    }
                };
                if (found === false) {
                    bot.reply(message, 'Sorry, but no serial port exists with the name ' + desiredPort);
                } else {
                    data.answers.port = desiredPort;
                    bot.reply(message, desiredPort + ' is now the desired port. Use "update" to finalize changes to settings');
                }
            })
            bot.reply(message,"Hello.");
        });
        data.sparkedbot.hears(['change file'], 'direct_message, direct_mention, mention', (bot, message) => {
            bot.reply(message,"Hello.");
        });
        data.sparkedbot.hears(['reauth'], 'direct_message, direct_mention, mention', (bot, message) => {
            bot.reply(message,"Hello.");
        });
        data.sparkedbot.hears(['serialprint'], 'direct_message, direct_mention, mention', (bot, message) => {
            bot.reply(message,"Hello.");
        });
        data.sparkedbot.hears(['talk here'], 'direct_message, direct_mention, mention', (bot, message) => {
            bot.reply(message,"Hello.");
        });
        data.sparkedbot.hears(['stop talking'], 'direct_message, direct_mention, mention', (bot, message) => {
            bot.reply(message,"Hello.");
        });
        data.sparkedbot.hears(['quit'], 'direct_message, direct_mention, mention', (bot, message) => {
            bot.reply(message,"Hello.");
        });
    }
    return data;
})

    .then(data => {

})



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
            message: 'Please enter the url to the raw file',
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
            name: 'auth',
            message: 'If this is a private repo, please enter an auth code to view it',
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
            message: 'If integrating with slack, please slack bot token',
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
