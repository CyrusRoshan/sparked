'use strict';
var Promise = require( 'bluebird' );

var inquirer = require( 'inquirer' );
var Slack = require( 'node-slack' );
var localtunnel = require( 'localtunnel' );
var serialPort = require( 'serialport' );
var koa = require( 'koa' );
var bodyParser = require( 'koa-bodyparser');

Promise.promisifyAll( inquirer );
Promise.promisifyAll( Slack );
Promise.promisifyAll( localtunnel );
Promise.promisifyAll( serialPort );
Promise.promisifyAll( koa );

var app = koa();
app.use( bodyParser() );

serialPort.listAsync().then( ports => ports )

    .then( ports => {
    return new Promise( resolve => {
        inquirer.prompt( getQuestions( ports ), answers => {
            resolve( answers );
        });
    });
})

    .then( answers => {
    var data = {
        answers: answers
    };
    if ( answers.slackLink ) {
        console.log( '\nConnecting to localtunnel, please wait...\n' );
        return new Promise( resolve => {
            var tunnel = localtunnel( answers.port, (err, tunnel) => {
                if( err ) {
                    console.error( 'Error connecting to localtunnel, exiting...' );
                    process.exit( 1 );
                } else {
                    data.tunnel = tunnel;
                    resolve( data );
                }
            });
        })
    } else {
        return data;
    }
})

    .then( data => {
    if ( data.tunnel ) {
        return new Promise( resolve => {
            inquirer.prompt(
                [
                    {
                        type: 'input',
                        name: 'slackToken',
                        message: 'Add a outgoing webhook in slack to send notifications to the URL: ' + data.tunnel.url + ' and set "dosparked" as the trigger word. Then, enter the token slack has given for the recieved data to be validated',
                        validate: function( value ) {
                            return true;
                            if ( value.length === 24 ) {
                                return true;
                            } else {
                                return 'Please enter a valid token';
                            }
                        }
                    }
                ], answers => {
                    data.answers.slackToken = answers.slackToken;
                    data.slack = new Slack( data.answers.slackLink );
                    resolve( data );
                });
        });
    }
    return data;
})

    .then( data => {
    if ( data.answers.slackToken ) {
        console.log( '\nSetting up server on port ' + data.answers.port + ', which is forwarded to the URL ' +
                    data.tunnel.url + ', which is sent messages by slack, which are verified with the token ' +
                    data.answers.slackToken + '...\n' );

        app.use(function *() {
            console.log( this.request.body );
            if( this.request.body.token === data.answers.slackToken ) {
                switch ( this.request.body.text.split(' ')[1] ) {
                    case 'status':
                        slackPush( data, currentStatus() );
                        break;
                    case 'reupload':
                        slackPush( data, 'Reuploading ' + data.answers.filepath.split('/').slice(-1)[0] );
                        reupload( data );
                        break;
                    case 'baud':
                        data.answers.baud = this.request.body.text.split(' ')[2];
                        slackPush( data, 'Changing serial read baud rate to ' + data.answers.baud)
                        rebaud( data )
                        break;
                    case 'list':
                        serialPort.listAsync().then( ports => {
                            for( port in ports ) {
                                slackPush( data, 'Port ' + port + ': ' + ports[port].comName );
                            }
                        });
                        break;
                    case 'device':
                        data.answers.port = this.request.body.text.split(' ')[2];
                        slackPush( data, 'New port is ' + data.answers.port + '. Use "dosparked reupload" to stop current program execution and reaupload to this port');
                        break;
                    case 'changefile':
                        data.answers.filepath = this.request.body.text.split(' ')[2];
                        //should probably verify this, and all other things (e.g. baud rate)
                        slackPush( data, 'New file link is ' + data.answers.filepath + '. Use "dosparked reupload" to stop current program execution and reaupload to this port');
                        break;
                    case 'reauth':
                        console.log('a');
                        break;
                    case 'serialprint':
                        console.log('a');
                        break;
                    case 'movechat':
                        console.log('a');
                        break;
                    case 'mute':
                        console.log('a');
                        break;
                    case 'unmute':
                        console.log('a');
                        break;
                    case 'quit':
                        console.log('a');
                        break;
                    default:
                        new Error ( 'Slack command not recognized' );
                        slackPush( data, 'Error, slack command not recognized');
                }
                slackPush( data.slack, 'I will' + this.request.body.text.slice(9), '@creator');
            } else {
                new Error( 'Recieved slack request with invalid token, ignoring' );
            }
        });
        app.listen( data.answers.port );
    }
    return data;
})

    .then( data => {

})

function slackPush(data, message){
    data.slack.send({
        text: message,
        channel: data.answers.slackChannel,
        username: 'sparkedbot',
        icon_emoji: ':electric_plug:',
    });
}

function getQuestions( ports ) {
    var portNames = ports.map( port => port.comName );

    function getValue( value ) {
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
                if ( value.match( /https:\/\/raw\.githubusercontent\.com\/.*\.ino/g ) ) {
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
                if ( value.length === 40 || value.length === 0 ) {
                    return true;
                } else {
                    return 'Please enter a valid auth code';
                }
            }
        },
        {
            type: 'input',
            name: 'slackLink',
            message: 'If integrating with slack, please enter slack hook url',
            validate: value => {
                return true;
                if ( value.match( /https:\/\/hooks\.slack\.com\/.{9}\/.{9}\/.{24}/g )[0].length === value.length || value.length == 0 ) {
                    return true;
                } else {
                    return 'Please enter a valid slack url, e.g. https://hooks.slack.com/services/AAAAAAAAA/BBBBBBBBB/CCCCCCCCCCCCCCCCCCCCCCCC';
                }
            }
        },
        {
            type: 'input',
            name: 'slackChannel',
            message: 'For slack integration, please include the channel or user to send data to',
            validate: value => {
                return true;
                if ( value[0] === '@' || value[0] === '#' ) {
                    return true;
                } else {
                    return 'Please enter a valid channel/user, e.g. #channel or @user';
                }
            },
            when: getValue( 'slackLink' )
        },
        {
            type: 'input',
            name: 'port',
            message: 'Please include the port to run the server on',
            default: 8080,
            validate: value => {
                return true;
                if ( String(value).length === 4 ) {
                    return true;
                } else {
                    return 'Please enter a valid port number, or leave blank to default to 8080';
                }
            },
            when: getValue( 'slackLink' )
        }
    ]
};
