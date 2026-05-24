
const URL = "./model/";

let model;
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

    model = await tmImage.load(
      URL + "model.json",
      URL + "metadata.json"
    );

    const stream =
      await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

    webcam.srcObject = stream;

    webcam.onloadedmetadata = () => {

      webcam.play();

      loop();
    };

  } catch (err) {

    console.error(err);

    alert(
      "Camera werkt niet"
    );
  }
}

async function loop() {

  try {

    const prediction =
      await model.predict(webcam);

    let highest =
      prediction[0];

    prediction.forEach((p) => {

      if (
        p.probability >
        highest.probability
      ) {

        highest = p;
      }
    });

    showMood(
      highest.className,
      highest.probability
    );

  } catch (err) {

    console.error(err);
  }

  requestAnimationFrame(loop);
}

function showMood(
  mood,
  confidence
) {

  let emoji = "🙂";
  let message = "";

  switch (
    mood.toLowerCase()
  ) {

    case "blij":

      emoji = "😎";

      message =
        "Je bent blij vandaag";

      break;

    case "moe":

      emoji = "😴";

      message =
        "Je lijkt moe";

      break;

    case "gestrest":

      emoji = "😵";

      message =
        "Je lijkt gestrest";

      break;

    case "verdrietig":

      emoji = "🥺";

      message =
        "Kop op 💛";

      break;

    default:

      emoji = "🙂";

      message =
        "Mood gevonden";
  }

  /* UI */

  document
    .getElementById("emoji")
    .innerText = emoji;

  document
    .getElementById("result")
    .innerText = message;

  document
    .getElementById("confidence")
    .innerText =
      "Confidence: " +
      Math.round(
        confidence * 100
      ) + "%";
}