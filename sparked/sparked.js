"use strict";
var inquirer = require("inquirer");


var questions = [
	{
		type: "input",
		name: "filepath",
		message: "Please enter the url to the raw file",
		validate: function( value ) {
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
		message: "If you would like to have serial output streamed over slack, please enter an auth code",
		validate: function( value ) {
			if (value.length === 41 || value.length === 0) {
				return true;
			} else {
				return "Please enter a valid auth code";
			}
		}
	},
	{
		type: "input",
		name: "slackChannel",
		message: "For slack integration, please include the channel, group, or DM channel ID to use",
		validate: function( value ) {
			if (value.length === 9) {
				return true;
			} else {
				return "Please enter a valid channel ID, e.g. ";
			}
		},
		when: getValue("slackAuth")
	}
];

function getValue(key) {
	return function (answers) {
		return answers[key];
	}
}

inquirer.prompt( questions, function( answers ) {
	console.log( JSON.stringify(answers, null, "  ") );
});
