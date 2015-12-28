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
            var Botkit = require('botkit');

            data.sparkedbot = Botkit.slackbot({
                debug: false
            });

            sparkedbot.spawn({
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
        console.log('\n\n Your sparkedbot has been created!\nType "dosparked help" to get a list of commands in slack\n');

        data.sparkedbot.hears(['hello','hi'],'direct_message,direct_mention,mention',function(bot,message) {
            bot.reply(message,"Hello.");
        })
    }
    return data;
})

    .then(data => {

})



function getQuestions(ports) {
    var portNames = ports.map(port => port.comName);

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
