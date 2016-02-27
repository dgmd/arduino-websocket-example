var five = require("johnny-five"); // Load the node library that lets us talk JS to the Arduino
var board = new five.Board(); // Connect to the Arduino using that library

board.on("ready", function() { // Once the computer is connected to the Arduino

    var app = require('express')(); // Start up our express server

    app.get('/', function(req, res) { // what happens when we go to `/`
        res.sendFile('index.html', { root: '.' }); // Send back the file `index.html` located in the current directory (`root`)
    });

    app.get('/socket.io.js', function(req, res) { // what happens when we go to `/socket.io.js`
        res.sendFile('socket.io-1.4.5.js', { root: '.' }); // send back the socket.io JS library we downloaded
    });

    var server = app.listen(3000, function() {
        console.log("Server's up at http://localhost:3000!");
    }); // start up our server on port 3000

    var io = require('socket.io')(server); // Connect our Socket.io library to our server

    // Grab our analog and LED pins
    var analogPin = new five.Pin('A0');
    var LEDpin = new five.Pin(13);

    // Once the WebSocket library (represented by the `io` variable) connects to our server
    io.on('connection', function(socket) {
        socket.on('toggleLED', function(data) { // When our socket receives a `toggleLED` event
            console.log("Toggling the LED pin…");
            LEDpin.query(function(pinData) { // ask `LEDpin` for its pinData
            	// And grab its state, which should be 0/1
                if (pinData.state == 0) { // If it's 0, set the pin high (on)
                    LEDpin.high();
                } else if (pinData.state == 1) { // If it's 1, set the pin low (off)
                    LEDpin.low();
                }
            });
        });

        // Set up a function to run every 100ms which sends the `value` of the analog pin on the socket _via_ an `analogUpdate` event
        var analogUpdate = setInterval(function() {
            analogPin.query(function(state) { // Ask our analog pin for its state, and when we receive it
            	// Send an analogUpdate event
                socket.emit('analogUpdate', { 'value': state.value }); // packaged up with a dictionary which has `value` has a key and the measured value of the analog pin (in `state.value`) as a value…
            });
        }, 100);
    });
});
