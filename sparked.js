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

        data.sparkedbot.hears(['help'], 'direct_message,direct_mention', (bot, message) => {
            bot.reply(message,"Hello.");
        });

        data.sparkedbot.hears(['example'], 'direct_message,direct_mention', (bot, message) => {
            bot.reply(message,"Hello.");
        });

        data.sparkedbot.hears(['status', 'current'], 'direct_message,direct_mention', (bot, message) => {
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

        data.sparkedbot.hears(['refetch', 'reupload', 'upload', 'update'], 'direct_message,direct_mention', (bot, message) => {
            bot.reply(message, 'Refetching and uploading "' + data.answers.filepath + '"');
            //upload(data);
        });

        data.sparkedbot.hears(['baud', 'rebaud'], 'direct_message,direct_mention', (bot, message) => {
            var baud = message.text.trim().slice(message.text.indexOf('baud') + 5);
            var baudrates = getQuestions()[1].choices;

            if (baudrates.indexOf(baud) != -1) {
                data.answers.baud = baud;
                bot.reply(message, 'Setting baud rate to ' + baud + '. Use "update" to finalize changes to settings');
            } else {
                bot.reply(message, baud + ' is an invalid baud rate, the following baud rates are supported:');
                bot.reply(message, baudrates.join(', '));
            }
        });

        data.sparkedbot.hears(['list', 'ports'], 'direct_message,direct_mention', (bot, message) => {
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

        data.sparkedbot.hears(['change device', 'change port', 'switch port'], 'direct_message,direct_mention', (bot, message) => {
            var desiredPort = message.text.trim().split(' ')[2];
            var found = false;
            serialPort.listAsync().then(ports => {
                ports.forEach( port => {
                    if(port.comName === desiredPort){
                        found = true;
                    }
                });
                if (found === false) {
                    bot.reply(message, 'Sorry, but no serial port exists with the name "' + desiredPort + '"');
                } else {
                    data.answers.port = desiredPort;
                    bot.reply(message, 'The port "' + desiredPort + '" is now the desired port. Use "update" to finalize changes to settings');
                }
            })
        });

        data.sparkedbot.hears(['change file', 'switch file'], 'direct_message,direct_mention', (bot, message) => {
            var filepath = message.text.trim().slice(12);
            if (filepath.match(/https:\/\/raw\.githubusercontent\.com\/.*\.ino/g)){
                data.answers.filepath = filepath;
                bot.reply(message, 'Now watching the file ' + filepath);
                bot.reply(message, 'Make sure to add or change the github auth token by dm\'ing me with reauth [token] if the file is in a private repo that requires new permissions')
            } else {
                bot.reply(message, 'Sorry, but the url "' + filepath + '" does not seem like a valid raw github-hosted .ino file');
            }
        });

        data.sparkedbot.hears(['reauth'], 'direct_message,direct_mention', (bot, message) => {
            if (message.event === 'direct_mention') {
                bot.reply(message, 'Well, if you\'re fine giving private repo privelage to everyone who can read this...');
            }
            var githubToken = message.text.trim().slice(7);
            data.answers.githubToken = githubToken;
            bot.reply(message, 'Setting GitHub auth token to "' + githubToken + '"');

        });

        data.sparkedbot.hears(['serialprint', 'serial print'], 'direct_message,direct_mention', (bot, message) => {
            var serialData = message.text.slice(message.text.indexOf('print') + 6);
            bot.reply(message, 'Sending the following over serial:');
            bot.reply(message, '```' + serialData + '```');
            //serialPrint(data, serialData);
        });

        data.sparkedbot.hears(['talk here'], 'direct_message,direct_mention', (bot, message) => {
            bot.reply(message, 'Hello.');
        });

        data.sparkedbot.hears(['stop talking'], 'direct_message,direct_mention', (bot, message) => {
            bot.reply(message, 'Hello.');
        });

        data.sparkedbot.hears(['quit'], 'direct_message,direct_mention', (bot, message) => {
            bot.reply(message, 'If you say so. Quitting the node process...');
            console.log('\n\nThe quit command was executed from slack, quitting...\n\n')
            process.exit(1);
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
            name: 'githubToken',
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
