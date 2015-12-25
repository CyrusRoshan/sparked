"use strict";
var Promise = require("bluebird");

var inquirer = require("inquirer");
var Slack = require('node-slack');
var localtunnel = require('localtunnel');
var serialPort = require("serialport");

Promise.promisifyAll(inquirer);
Promise.promisifyAll(Slack);
Promise.promisifyAll(localtunnel);
Promise.promisifyAll(serialPort);


var listPorts = serialPort.listAsync().then(function(data){
	console.log("a");
	return data;
});

var promptQuestions = listPorts.then(function(ports){
	console.log(ports);
	console.log(getQuestions(ports));
	//console.log(listPorts.value());
	/*inquirer.prompt(questions, function(answers){
		if(getValue("slackAuth")){
			var tunnel = localtunnel(port, function(err, tunnel){
				if(err){
					console.error("Error connecting to localtunnel...")
				}

				else{
					inquirer.prompt([
						{
							type: "input",
							name: "token",
							message: "Add a outgoing webhook in slack to send notifications to the URL: " + tunnel.url + " and set 'dosparked' as the trigger word. Then, enter the slack token for outgoing payload validation",
							default: 8080,
							validate: function( value ) {
								return true;
								if (String(value).length === 24) {
									return true;
								} else {
									return "Please enter a valid token";
								}
							},
							when: getValue("slackAuth")
						}
					], function(answersAfterSlack) {
						answers += answersAfterSlack;
						console.log( JSON.stringify(answers, null, "  ") );
					});
				}
			});
		}
		else{

		}
	})
	*/
});

/*

slack.send({
	text: data,
	channel: getValue(slackChannel),
	username: 'sparkedbot',
	icon_emoji: ':electric_plug:',
});
*/


function getValue(key) {
	return function(answers){
		return answers[key];
	}
}

function getQuestions(ports){
	return [
		{
			type: "list",
			name: "port",
			message: "Which serial port is the arduino connected to?",
			choices: ports,
		},
		{
			type: "list",
			name: "baud",
			message: "What baud rate should serial begin at?",
			choices: [
				"115200",
				"57600",
				"38400",
				"28800",
				"19200",
				"14400",
				"9600",
				"4800",
				"2400",
				"1200",
				"600",
				"300",
			]
		},
		{
			type: "input",
			name: "filepath",
			message: "Please enter the url to the raw file",
			validate: function(value) {
				return true;
				if (value.match(/https:\/\/raw\.githubusercontent\.com\/.*\.ino/g)) {
					return true;
				} else {
					return "Please enter a valid file path, e.g. https://raw.githubusercontent.com/USERNAME/REPO/BRANCH/FOLDER/FILE.ino";
				}
			}
		},
		{
			type: "input",
			name: "auth",
			message: "If this is a private repo, please enter an auth code to view it",
			validate: function(value) {
				return true;
				if (value.length === 40 || value.length === 0) {
					return true;
				} else {
					return "Please enter a valid auth code";
				}
			}
		},
		{
			type: "input",
			name: "slackAuth",
			message: "If integrating with slack, please enter slack hook url",
			validate: function(value) {
				return true;
				if (value.length === 77 || value.length === 0) {
					return true;
				} else {
					return "Please enter a valid auth code";
				}
			}
		},
		{
			type: "input",
			name: "slackChannel",
			message: "For slack integration, please include the channel or user to send data to",
			validate: function(value) {
				return true;
				if (value[0] === '@' || value[0] === '#') {
					return true;
				} else {
					return "Please enter a valid channel/user, e.g. #channel or @user";
				}
			},
			when: getValue("slackAuth")
		},
		{
			type: "input",
			name: "port",
			message: "Please include the port to run the server on",
			default: 8080,
			validate: function(value) {
				return true;
				if (String(value).length === 4) {
					return true;
				} else {
					return "Please enter a valid port number, or leave blank to default to 8080";
				}
			},
			when: getValue("slackAuth")
		}
	]
};
