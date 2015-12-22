"use strict";
var inquirer = require("inquirer");
var Slack = require('node-slack');
var localtunnel = require('localtunnel');


var questions = [
	{
		type: "input",
		name: "filepath",
		message: "Please enter the url to the raw file",
		validate: function( value ) {
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
		validate: function( value ) {
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
		message: "If you would like to have serial output streamed over slack, please enter the hook url",
		validate: function( value ) {
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
		validate: function( value ) {
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
		validate: function( value ) {
			return true;
			if (String(value).length === 4) {
				return true;
			} else {
				return "Please enter a valid port number, or leave blank to default to 8080";
			}
		},
		when: getValue("slackAuth")
	}
];

var questionsAfterSlack = [
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
]

function getValue(key) {
	return function(answers){
		return answers[key];
	}
}

inquirer.prompt( questions, function(answers) {
	if(getValue("slackAuth")){
		var tunnel = localtunnel(port, function(err, tunnel) {
			if(err){
				console.error("Error connecting to localtunnel...")
			}
			else{
				inquirer.prompt( questionsAfterSlack, function(answersAfterSlack) {
					answers += answersAfterSlack;
					console.log( JSON.stringify(answers, null, "  ") );
				});
			}
		});
	}
	else{

	}
});

/*

slack.send({
	text: data,
	channel: getValue(slackChannel),
	username: 'sparkedbot',
	icon_emoji: ':electric_plug:',
});
*/
