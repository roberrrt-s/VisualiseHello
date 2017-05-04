// Define the packages and requirements for the application to work.
const twitter = require('twitter'),
	  express = require('express'),
  	  app = express(),
	  http = require('http'),
	  server = http.createServer(app),
	  io = require('socket.io').listen(server),
	  CONFIG = require('./config.json');

// Configure a twitter client
const twit = new twitter({
	consumer_key: CONFIG.consumer_key,
	consumer_secret: CONFIG.consumer_secret,
	access_token_key: CONFIG.access_token_key,
	access_token_secret: CONFIG.access_token_secret
});

// Configure the local (but global) variables to use between socket events and the twitter stream
const local = {
	memory: [],
	output: null,
	inputString: 'hi',
	update: false
}

// Validation function to see if the inputString has been changed
function checkInput() {
	if(local.update) {
		local.update = false;
		return true;
	}
	return false
}

// Initiate the server and call the socket connection
function initServer() {
	// Listen to the proccess.env.PORT or the configurated port
	server.listen(process.env.PORT || CONFIG.port);
	console.log(`Server is listening on port ${CONFIG.port}, or the local Heroku port`)
	// Publish the public folder as a static folder to the client
	app.use(express.static(__dirname + '/public'));
	// Call the socket connection
	initSockets()
}

// Initiate the socket connection
function initSockets() {

	// As soon as socket-io finds a new client, connect with it.
	io.sockets.on('connection', socket => {

		// Check if there are saved images in the sidebar, and send them to the new client if there are.
		if(local.memory.length) {
			socket.emit('update list', local.memory);
		}

		// Next up are all socket related events

		// When 'update string' is received. Set the new inputString and change the update value to 'true'
		socket.on('update string', string => {
			local.inputString = string;
			local.update = true;
		});

		// The client is ready to receive a new image, so we send the latest one saved from the stream, if not null
		socket.on('request new image', () => {
			// Check to see if there is any data at all, otherwise void
			if(local.output !== null) {
				socket.emit('twitter-stream', {'src': local.output});
			}
		})

		// User wishes to save an image (click)
		socket.on('save image', src => {
			// Push the image src url to our local memory
			local.memory.push(src)
			// Check if the maximum number of images has been surpassed
			if(local.memory.length > 15) {
				// Remove the first entry from the array if so
				local.memory.shift();
			}
			// Emit to update the list on the local client, broadcast to update for every other client
			socket.emit('update list', local.memory);
			socket.broadcast.emit('update list', local.memory);
		});

		// Handle error event
        socket.on('error', error => {
            console.log('error' + error)
        });

        // Handle disconnect event
        socket.on('disconnect', () => {
            console.log('A user disconnected')
        });

        // As soon as we've set up all events, send the 'connected' event to the client to complete the handshake
		socket.emit('connected');

	});
}

// Initiate the Twitter stream
function initStream() {
	// Hook into the stream API with a custom query and a low filter level (can be none or medium as well)
	twit.stream('statuses/filter', {'track': local.inputString, 'filter_level':'low'}, stream => {
		// Save the last entry for sanitation purposes
		let last = null;

		// As soon as there is new data, handle it
		stream.on('data', data => {
			// Validate if the user object is accesible (locked chars give an error)
			if(data.user){
				// Validate if the user profile image exists
				if (data.user.profile_image_url !== null) {
					// Apply the check if the image is the same one as last entry (duplicate streaming results)
					if(data.user.profile_image_url !== last) {
						// Update the last known image URL
						last = data.user.profile_image_url;
						// Update our output for the socket connection to use
						local.output = data.user.profile_image_url;
					}
				}
			}

			// Handle error event
			stream.on('error', error => {
				return console.log(error);
			});

			// Handle limit event
			stream.on('limit', limitMessage => {
				return console.log(limitMessage);
			});

			// Handle warning event
			stream.on('warning', warning => {
				return console.log(warning);
			});

			// Handle disconnect event
			stream.on('disconnect', disconnectMessage => {
				return console.log(disconnectMessage);
			});

			// Check to see if the inputString has changed, every time there is new data
			if(checkInput()) {
				// If so, destroy the stream
				stream.destroy();
				// And re-init the stream wit the new query
				initStream();
				console.log(`Restarted stream with query: ${local.inputString}`)
			}
		});
	});
}

// Start the socket connection and Twitter stream
initServer();
initStream();
