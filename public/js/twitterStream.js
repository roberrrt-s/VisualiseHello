// Functional programming, since OOP is a bit of an overkill for 2 functions on the client side.

// Utility function to generate a random range
function getRandomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Initiate the socket connection on the client side
function initSockets() {
    // Check if we import the socket.io library
    if (io !== undefined) {
        // Connect with the library on '/'
        const socket = io.connect('/');
        // Save a let for sanitation purposes on the client side as well
        let last = null;

        // Apply an event listener to the button (do this now, because we can hook it to the socket connection)
        document.getElementById('submit-button').addEventListener('click', e => {
            // On click, get the new input string and send it to the server
            socket.emit('update string', document.getElementById('input-field').value)
        })

        // Next up are all socket related events

        // As soon as we receive data from the twitter stream, handle it
        socket.on('twitter-stream', data => {
            // We can remove the 'waiting for data' notice now, if it still exists, should be cleaner though.
            if(document.getElementById('waiting')) {
                document.getElementById('waiting').remove();
            }

            // If the last data we previously defined isn't the new data
            if(last !== data.src) {
                // Set it as last
                last = data.src

                // Create a new image with the data as source, and randomly place it on the map between 10%/90%
                // Also add a click event to emit a save image event to the server
                const img = new Image();
                img.src = data.src;
                img.style.left = `${getRandomRange(10, 90)}%`;
                img.style.top = `${getRandomRange(10, 90)}%`;
                img.addEventListener('click', e => {
                    socket.emit('save image', {src: e.target.src});
                });
                document.body.appendChild(img);

                // Check if the maximum amount of images in the body has been reached
                const images = document.querySelectorAll('body > img');

                // If so, remove the oldest entry
                if(images.length > 100) {
                    images[0].remove();
                }
            }

            // Wait 50ms before requesting a new image
            // This isn't mandatory, but should be done for security purposes in case 100 users decide to visit the site at once
            // It also makes debugging really easy
            setTimeout(() => {
                socket.emit('request new image');
            }, 50)
        });

        // Event to handle the updating the saved images list
        socket.on('update list', r => {
            // Define the container to hold the images
            const container = document.getElementById('container-content');
            // Empty it (sanitize)
            while(container.firstChild){
                container.removeChild(container.firstChild);
            }

            // Create a new image, and append it to the container
            // This can probably be improved to only remove the oldest entry if needed, and only add the newest
            // But hey, it works~
            for(let i = 0; i < r.length; i++) {
                const img = new Image();
                img.src= r[i].src;
                container.appendChild(img);
            }
        });

        // Handle erorr event
        socket.on('error', error => {
            console.log(`Error! message: ${error}`)
        });

        // As soon as we're all initiated, we can ask the server for the first image, and start the loop
        socket.emit('request new image')
    }
}

// Let's go
initSockets();