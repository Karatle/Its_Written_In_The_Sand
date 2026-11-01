const webcamFeed = document.getElementById("camera")

navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
    webcamFeed.srcObject = stream
}).catch((error) => {
    console.error(error)
})