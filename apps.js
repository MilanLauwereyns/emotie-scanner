
let webcam;

async function startScanner() {

  document
    .getElementById("startScreen")
    .classList.add("hidden");

  document
    .getElementById("scanner")
    .classList.remove("hidden");

  webcam =
    document.getElementById("webcam");

  try {

    const stream =
      await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

    webcam.srcObject = stream;

    webcam.onloadedmetadata = () => {

      webcam.play();
    };

  } catch (err) {

    console.error(err);

    alert(
      "Camera werkt niet"
    );
  }
}