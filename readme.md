# VisualiseHello

Visualise Hello is a Twitter-based visualisation tool to read realtime streaming 'tweets' that come in via the `statuses/filter` method of the Twitter API.

## Requirements:

 - Node.js (using 7.9.0)
 - NPM (using 4.0.1)

## Installation

 - Fork this repository to your PC
 - Retrieve your personal Twitter credentials & keys
 - Create a config.json file in the root folder, like this:

 ```json
	{
		"port" : "YOUR PORT OF CHOICE (INT)",
		"consumer_key" : "YOUR CONSUMER KEY (STRING)",
		"consumer_secret" : "YOUR CONSUMER SECRET (STRING)",
		"access_token_key" : "YOUR ACCESS TOKEN KEY (STRING)",
		"access_token_secret" : "YOUR ACCESS TOKEN SECRET (STRING)"
	}
 ```
 
 - Run `npm install` in your root folder and install the required packages.
 - Run `npm start` to start up the application
 - The application should be running on `localhost:<port>`

## How does it work

Visualise Hello opens up a live feed from Twitter using their Streaming API. It has the default parameters of the query 'hi' and the filter set to 'low' to minimise the amount of traffic the application receives. Upon connecting clients, a socket connection is established to serve twitter data to the client. Clients request live profile pictures of tweeting users whenever they are ready.

Clients receive a constant refreshing page with a maximum of 100 images at once to see who is behind active tweets. Clients can adjust the stream by changing the query. The stream is only initiated once, so all clients receive the changes made by one client. Clients can click on images to save them into a small selection on the right side of the screen. This is being saved to the server as well, and the server serves this feed to all clients in real time.

## How to use

Visualise Hello accepts custom search queries to adjust the live twitter stream. It destroys the current stream as soon as a client hits the 'submit' button and opens up a new stream by that query. If a stream doesn't provide the users with any new images, the query is either faulty or nobody is tweeting about a certain query.

Users can save images they like by clicking on them. They are being transferred to a local variable at the servers endpoint and can hold a maximum of 15 images at once. As soon as the 16th image is being saved, a FIFO (first-in first-out) principle removes the oldest entry to make room for the new image.

## Credits

The following resources were used frequently while building this application:

 - http://stackoverflow.com/questions/17287330/socket-io-handling-disconnect-event
 - http://stackoverflow.com/questions/7352164/update-all-clients-using-socket-io
 - https://dev.twitter.com/streaming/overview
 - https://socket.io/docs/emit-cheatsheet/
