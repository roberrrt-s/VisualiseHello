const twitter = require('twitter'),
	  express = require('express'),
  	  app = express(),
	  http = require('http'),
	  server = http.createServer(app),
	  io = require('socket.io').listen(server),
	  CONFIG = require('./config.json');

const twit = new twitter({
	consumer_key: CONFIG.consumer_key,
	consumer_secret: CONFIG.consumer_secret,
	access_token_key: CONFIG.access_token_key,
	access_token_secret: CONFIG.access_token_secret
});

const local = {
	memory: [],
	output: null,
	inputString: 'hi',
	update: false
}

function checkInput() {
	if(local.update) {
		local.update = false;
		return true;
	}
	return false
}

function initServer() {
	server.listen(process.env.PORT || CONFIG.port);
	console.log(`Server is listening on port ${CONFIG.port}, or the local Heroku port`)
	app.use(express.static(__dirname + '/public'));
	initSockets()
}

function startStream() {
	twit.stream('statuses/filter', {'track': local.inputString, 'filter_level':'low'}, stream => {
		let last = null;
		stream.on('data', data => {
			if(data.user){
				if (data.user.profile_image_url !== null) {
					if(data.user.profile_image_url !== last) {
						last = data.user.profile_image_url;
						local.output = data.user.profile_image_url;
					}
				}
			}

			stream.on('error', error => {
				return console.log(error);
			});

			stream.on('limit', limitMessage => {
				return console.log(limitMessage);
			});

			stream.on('warning', warning => {
				return console.log(warning);
			});

			stream.on('disconnect', disconnectMessage => {
				return console.log(disconnectMessage);
			});

			if(checkInput()) {
				stream.destroy();
				startStream();
				console.log(`Restarted stream with query: ${local.inputString}`)
			}
		});
	});
}

function initSockets() {
	io.sockets.on('connection', socket => {
		console.log('A new user connected!')

		socket.on('update string', string => {
			local.inputString = string;
			local.update = true;
		});

		socket.on('request new image', () => {
			if(local.output !== null) {
				socket.emit('twitter-stream', {'src': local.output});
			}
		})

		socket.on('save image', src => {
			local.memory.push(src)
			if(local.memory.length > 15) {
				local.memory.shift();
			}
			socket.emit('update list', local.memory);
			socket.broadcast.emit('update list', local.memory);
		});

		socket.emit('connected');

		if(local.memory.length) {
			socket.emit('update list', local.memory);
		}
			
        socket.on('error', error => {
            console.log('error' + error)
        });

        socket.on('disconnect', () => {
            console.log('A user disconnected')
        });
	});
}

initServer();
startStream();
