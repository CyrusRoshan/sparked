"use strict";
var inquirer = require("inquirer");


var questions = [
	{
		type: "input",
		name: "username",
		message: "Please enter the github username of the owner of the repo with the file"
	},
	{
		type: "input",
		name: "repo",
		message: "Please enter the github repo that contains the file"
	},
	{
		type: "input",
		name: "filepath",
		message: "Please enter the filepath from the repo root to the file",
		validate: function( value ) {
			if (value.match(/.*\.ino/g)) {
				return true;
			} else {
				return "Please enter a valid file path (e.g. /exampletest1/testfile.ino)";
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
	}
];

inquirer.prompt( questions, function( answers ) {
	console.log( JSON.stringify(answers, null, "  ") );
});
