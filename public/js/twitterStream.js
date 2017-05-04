function getRandomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function initSockets() {
    if (io !== undefined) {
        const socket = io.connect('/');
        let last = null;

        document.getElementById('submit-button').addEventListener('click', e => {
            socket.emit('update string', document.getElementById('input-field').value)
        })

        document.getElementById('waiting').remove();

        socket.on('twitter-stream', data => {
            console.log('received data')
            if(last !== data.src) {
                last = data.src
                const img = new Image();
                img.src = data.src;
                img.style.left = `${getRandomRange(10, 90)}%`;
                img.style.top = `${getRandomRange(10, 90)}%`;
                img.addEventListener('click', e => {
                    socket.emit('save image', {src: e.target.src});
                });

                document.body.appendChild(img);
                const images = document.querySelectorAll('body > img');
                if(images.length > 100) {
                    images[0].remove();
                }
            }
            setTimeout(() => {
                socket.emit('request new image');
            }, 50)
        });

        socket.on('update list', r => {
            const container = document.getElementById('container-content');
            while(container.firstChild){
                container.removeChild(container.firstChild);
            }
            for(let i = 0; i < r.length; i++) {
                const img = new Image();
                img.src= r[i].src;
                container.appendChild(img);
            }
        });

        socket.on('error', error => {
            console.log(`Error! message: ${error}`)
        });

        socket.emit('request new image')
    }
}

initSockets();