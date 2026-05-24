const URL = "./model/";

let model;
let webcam;

let isScanning = false;

let lastMood = "";
let lastSaved = 0;

let detectionStart = Date.now();

const MIN_CONFIDENCE = 0.35;

navigator.mediaDevices
  .getUserMedia({
    video: true
  })
  .then(stream => {

    const video =
      document.querySelector("video");

    if (video) {

      video.srcObject = stream;
    }

  })
  .catch(err => {

    console.error(err);

  });


async function startScanner() {

  try {

    isScanning = true;

    document
      .getElementById("startScreen")
      .classList.add("hidden");

    document
      .getElementById("scanner")
      .classList.remove("hidden");

    model = await tmImage.load(
      URL + "model.json",
      URL + "metadata.json"
    );

    webcam =
      document.getElementById("webcam");

    const stream =
      await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

    webcam.srcObject = stream;

    webcam.onloadedmetadata = () => {

      webcam.play();

      detectionStart = Date.now();

      loop();
    };

  } catch (err) {

    console.error(err);

    alert("Camera werkt niet");
  }
}

async function loop() {

  if (!isScanning) return;

  try {

    const prediction =
      await model.predict(webcam);

    let highest =
      prediction.reduce((a, b) =>
        a.probability > b.probability
          ? a
          : b
      );

    if (
      highest.probability >=
      MIN_CONFIDENCE
    ) {

      detectionStart = Date.now();

      showMood(
        highest.className,
        highest.probability
      );
    }

    else {

      const seconds =
        (Date.now() -
          detectionStart) / 1000;

      document
        .getElementById("emoji")
        .innerText = "🧐";

      document
        .getElementById("result")
        .innerText =
          "Geen emotie gevonden";

      document
        .getElementById("confidence")
        .innerText =
          Math.round(
            highest.probability * 100
          ) + "%";

      if (seconds >= 10) {

        isScanning = false;

        saveMood(
          "blij",
          "Automatisch blij opgeslagen",
          1
        );

        stopScanner();

        return;
      }
    }

  } catch (err) {

    console.error(err);
  }

  if (isScanning) {

    requestAnimationFrame(loop);
  }
}


function stopScanner() {

  if (
    webcam &&
    webcam.srcObject
  ) {

    webcam.srcObject
      .getTracks()
      .forEach(track =>
        track.stop()
      );
  }

  document
    .getElementById("scanner")
    .classList.add("hidden");

  document
    .getElementById("startScreen")
    .classList.remove("hidden");
}

function showMood(
  mood,
  confidence
) {

  const moods = {

    blij: ["😎", "Blij vandaag"],
    moe: ["😴", "Je lijkt moe"],
    gestrest: ["😵", "Je lijkt gestrest"],
    verdrietig: ["🥺", "Kop op 💛"]

  };

  const data =
    moods[mood.toLowerCase()] ||
    ["🙂", "Mood gevonden"];

  document
    .getElementById("emoji")
    .innerText = data[0];

  document
    .getElementById("result")
    .innerText = data[1];

  document
    .getElementById("confidence")
    .innerText =
      Math.round(
        confidence * 100
      ) + "%";

  const now = Date.now();

  if (
    mood !== lastMood ||
    now - lastSaved > 5000
  ) {

    saveMood(
      mood,
      data[1],
      confidence
    );

    lastMood = mood;

    lastSaved = now;
  }
}

function manualMood(mood) {

  const moods = {

    blij: [
      "😎",
      "Blij vandaag"
    ],

    moe: [
      "😴",
      "Je lijkt moe"
    ],

    gestrest: [
      "😵",
      "Je lijkt gestrest"
    ],

    verdrietig: [
      "🥺",
      "Kop op 💛"
    ]

  };

  const data =
    moods[mood];

  document
    .getElementById("emoji")
    .innerText = data[0];

  document
    .getElementById("result")
    .innerText = data[1];

  document
    .getElementById("confidence")
    .innerText =
      "Handmatig toegevoegd";

  saveMood(
    mood,
    data[1],
    1
  );
}

function saveMood(
  mood,
  message,
  confidence
) {

  const moods =
    JSON.parse(
      localStorage.getItem("moods")
    ) || [];

  moods.push({

    mood,
    message,

    confidence:
      Math.round(
        confidence * 100
      ),

    date:
      new Date()
        .toLocaleString()

  });

  localStorage.setItem(
    "moods",
    JSON.stringify(moods)
  );

  renderHistory();
}

function renderHistory() {

  const history =
    document.getElementById(
      "historyList"
    );

  const moods =
    JSON.parse(
      localStorage.getItem("moods")
    ) || [];

  history.innerHTML =
    moods
      .slice()
      .reverse()
      .map(m => `

        <div class="history-item">

          <strong>${m.mood}</strong>

          <br>

          ${m.message}

          <br>

          ${m.confidence}%

          <br>

          <small>${m.date}</small>

        </div>

      `)
      .join("");
}

function clearHistory() {

  localStorage.removeItem(
    "moods"
  );

  renderHistory();
}

window.onload = () => {

  renderHistory();
};