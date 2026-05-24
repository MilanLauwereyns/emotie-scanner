const URL = "./model/";

let model;
let webcam;

let isScanning = false;

let lastMood = "";
let lastSaved = 0;

let detectionStart = Date.now();

const MIN_CONFIDENCE = 0.35;

async function startScanner() {

  isScanning = true;

  detectionStart = Date.now();

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

  if (!isScanning) return;

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

    if (
      highest.probability >=
      MIN_CONFIDENCE
    ) {

      detectionStart = Date.now();

      showMood(
        highest.className,
        highest.probability
      );

    } else {

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

      const seconds =
        (Date.now() -
          detectionStart) / 1000;

      if (seconds >= 10) {

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

  requestAnimationFrame(loop);
}

function stopScanner() {

  isScanning = false;

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

  const now = Date.now();

  if (
    mood !== lastMood ||
    now - lastSaved > 5000
  ) {

    saveMood(
      mood,
      message,
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
      "Je bent blij vandaag"
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

  renderStats();
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
      .slice(0, 10)
      .map(m => `

        <div class="history-item">

          <strong>
            ${m.mood}
          </strong>

          <br><br>

          ${m.message}

          <br><br>

          ${m.confidence}%

          <br><br>

          <small>
            ${m.date}
          </small>

        </div>

      `)
      .join("");
}

function renderStats() {

  const statsBox =
    document.getElementById(
      "stats"
    );

  const moods =
    JSON.parse(
      localStorage.getItem("moods")
    ) || [];

  const stats = {};

  moods.forEach((m) => {

    stats[m.mood] =
      (stats[m.mood] || 0) + 1;
  });

  statsBox.innerHTML = "";

  for (const mood in stats) {

    statsBox.innerHTML += `

      <div class="stats-item">

        ${mood}: ${stats[mood]} scans

      </div>

    `;
  }
}

function clearHistory() {

  localStorage.removeItem(
    "moods"
  );

  renderHistory();

  renderStats();
}

window.onload = () => {

  renderHistory();

  renderStats();
};