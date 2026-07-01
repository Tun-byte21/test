const tabs = document.querySelectorAll(".nav-btn");
const panels = document.querySelectorAll(".panel");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(item => item.classList.remove("active"));
    panels.forEach(panel => panel.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
    if (tab.dataset.tab === "touch") buildTouchGrid();
  });
});

const displayOverlay = document.getElementById("displayOverlay");
const displayModes = ["#ffffff", "#000000", "#ff0000", "#00ff00", "#0000ff", "#808080", "linear-gradient(90deg, red, yellow, lime, cyan, blue, magenta, red)"];
let displayIndex = 0;
let displayRunning = false;

async function startDisplay(index = 0) {
  displayIndex = index;
  displayRunning = true;
  displayOverlay.classList.add("active");
  displayOverlay.style.background = displayModes[displayIndex];
  try {
    await document.documentElement.requestFullscreen();
  } catch (error) {}
}

function nextDisplay() {
  if (!displayRunning) return;
  displayIndex = (displayIndex + 1) % displayModes.length;
  displayOverlay.style.background = displayModes[displayIndex];
}

function stopDisplay() {
  displayRunning = false;
  displayOverlay.classList.remove("active");
}

document.getElementById("startDisplay").addEventListener("click", () => startDisplay(0));
document.querySelectorAll(".color-btn").forEach(button => {
  button.addEventListener("click", () => startDisplay(Number(button.dataset.color)));
});
displayOverlay.addEventListener("click", nextDisplay);

document.addEventListener("keydown", event => {
  if (displayRunning && event.code === "Space") {
    event.preventDefault();
    nextDisplay();
  }
});

document.addEventListener("fullscreenchange", () => {
  if (!document.fullscreenElement && displayRunning) stopDisplay();
  if (document.getElementById("touch").classList.contains("active")) setTimeout(buildTouchGrid, 80);
});

const touchGrid = document.getElementById("touchGrid");
const touchCount = document.getElementById("touchCount");
const touchResult = document.getElementById("touchResult");
let totalTouchCells = 0;
let activeTouchCells = 0;
let lastTouchBuild = 0;

function buildTouchGrid() {
  const now = Date.now();
  if (now - lastTouchBuild < 100) return;
  lastTouchBuild = now;

  const rect = touchGrid.getBoundingClientRect();
  const cellSize = document.fullscreenElement === touchGrid ? 68 : 54;
  const columns = Math.max(8, Math.floor(rect.width / cellSize));
  const rows = Math.max(6, Math.floor(rect.height / cellSize));

  totalTouchCells = columns * rows;
  activeTouchCells = 0;
  touchGrid.innerHTML = "";
  touchGrid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  touchGrid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

  for (let i = 0; i < totalTouchCells; i++) {
    const cell = document.createElement("div");
    cell.className = "touch-cell";
    cell.dataset.index = i;
    touchGrid.appendChild(cell);
  }

  updateTouchStatus();
}

function updateTouchStatus() {
  touchCount.textContent = `${activeTouchCells} / ${totalTouchCells}`;
  touchResult.textContent = activeTouchCells === totalTouchCells && totalTouchCells > 0 ? "Passed" : "Ready";
}

function activateTouchCellFromPoint(x, y) {
  const element = document.elementFromPoint(x, y);
  if (!element || !element.classList.contains("touch-cell") || element.classList.contains("active")) return;
  element.classList.add("active");
  activeTouchCells++;
  updateTouchStatus();
}

function handleTouchMove(event) {
  event.preventDefault();

  if (event.touches && event.touches.length) {
    const touch = event.touches[0];
    activateTouchCellFromPoint(touch.clientX, touch.clientY);
    return;
  }

  if (event.buttons === 1 || event.type === "pointerdown") {
    activateTouchCellFromPoint(event.clientX, event.clientY);
  }
}

touchGrid.addEventListener("pointerdown", handleTouchMove);
touchGrid.addEventListener("pointermove", handleTouchMove);
touchGrid.addEventListener("touchstart", handleTouchMove, { passive: false });
touchGrid.addEventListener("touchmove", handleTouchMove, { passive: false });

document.getElementById("resetTouch").addEventListener("click", buildTouchGrid);

document.getElementById("touchFullscreen").addEventListener("click", async () => {
  try {
    await touchGrid.requestFullscreen();
  } catch (error) {}
  setTimeout(buildTouchGrid, 120);
});

window.addEventListener("resize", () => {
  if (document.getElementById("touch").classList.contains("active")) buildTouchGrid();
});

const keyboardLayout = document.getElementById("keyboardLayout");
const keyCount = document.getElementById("keyCount");
const lastKey = document.getElementById("lastKey");
const testedKeys = new Set();

const jpRows = [
  [["Escape","Esc"],["F1","F1"],["F2","F2"],["F3","F3"],["F4","F4"],["F5","F5"],["F6","F6"],["F7","F7"],["F8","F8"],["F9","F9"],["F10","F10"],["F11","F11"],["F12","F12"]],
  [["IntlYen","半角\n全角"],["Digit1","1\n!"],["Digit2","2\n\""],["Digit3","3\n#"],["Digit4","4\n$"],["Digit5","5\n%"],["Digit6","6\n&"],["Digit7","7\n'"],["Digit8","8\n("],["Digit9","9\n)"],["Digit0","0"],["Minus","-\n="],["Equal","^\n~"],["IntlRo","¥\n|"],["Backspace","Backspace","xwide"]],
  [["Tab","Tab","wide"],["KeyQ","Q"],["KeyW","W"],["KeyE","E"],["KeyR","R"],["KeyT","T"],["KeyY","Y"],["KeyU","U"],["KeyI","I"],["KeyO","O"],["KeyP","P"],["BracketLeft","@\n`"],["BracketRight","[\n{"],["Enter","Enter","xwide"]],
  [["CapsLock","Caps","wide"],["KeyA","A"],["KeyS","S"],["KeyD","D"],["KeyF","F"],["KeyG","G"],["KeyH","H"],["KeyJ","J"],["KeyK","K"],["KeyL","L"],["Semicolon",";\n+"],["Quote",":\n*"],["Backslash","]\n}"],["Enter","Enter","xwide"]],
  [["ShiftLeft","Shift","xwide"],["KeyZ","Z"],["KeyX","X"],["KeyC","C"],["KeyV","V"],["KeyB","B"],["KeyN","N"],["KeyM","M"],["Comma",",\n<"],["Period",".\n>"],["Slash","/\n?"],["IntlBackslash","\\\n_"],["ShiftRight","Shift","xwide"]],
  [["ControlLeft","Ctrl","wide"],["MetaLeft","Win","wide"],["AltLeft","Alt","wide"],["NonConvert","無変換","jp"],["Space","Space","space"],["Convert","変換","jp"],["KanaMode","カタカナ\nひらがな","jp"],["AltRight","Alt","wide"],["ControlRight","Ctrl","wide"]],
  [["ArrowLeft","←"],["ArrowUp","↑"],["ArrowDown","↓"],["ArrowRight","→"]]
];

jpRows.forEach(row => {
  const rowDiv = document.createElement("div");
  rowDiv.className = "key-row";
  row.forEach(([code, label, size]) => {
    const key = document.createElement("div");
    key.className = "key";
    if (size) key.classList.add(size);
    key.dataset.code = code;
    key.textContent = label;
    rowDiv.appendChild(key);
  });
  keyboardLayout.appendChild(rowDiv);
});

document.addEventListener("keydown", event => {
  if (!document.getElementById("keyboard").classList.contains("active")) return;
  event.preventDefault();
  testedKeys.add(event.code);
  document.querySelectorAll(`.key[data-code="${event.code}"]`).forEach(key => key.classList.add("pressed"));
  keyCount.textContent = testedKeys.size;
  lastKey.textContent = `${event.code} (${event.key})`;
});

document.getElementById("resetKeyboard").addEventListener("click", () => {
  testedKeys.clear();
  keyCount.textContent = "0";
  lastKey.textContent = "-";
  document.querySelectorAll(".key").forEach(key => key.classList.remove("pressed"));
});

const musicAudio = document.getElementById("musicAudio");
const volume = document.getElementById("volume");
const seekBar = document.getElementById("seekBar");
const musicStatus = document.getElementById("musicStatus");
const timeLabel = document.getElementById("timeLabel");
let audioContext = null;
let audioSource = null;
let audioGain = null;
let audioPanner = null;
let audioReady = false;

function formatTime(value) {
  if (!Number.isFinite(value)) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function setupAudio() {
  if (audioReady) return;
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  audioSource = audioContext.createMediaElementSource(musicAudio);
  audioGain = audioContext.createGain();
  audioPanner = audioContext.createStereoPanner();
  audioSource.connect(audioGain);
  audioGain.connect(audioPanner);
  audioPanner.connect(audioContext.destination);
  audioReady = true;
}

async function playMusic(pan, label) {
  setupAudio();
  if (audioContext.state === "suspended") await audioContext.resume();
  audioGain.gain.value = Number(volume.value);
  audioPanner.pan.value = pan;
  musicStatus.textContent = label;
  try {
    await musicAudio.play();
  } catch (error) {
    musicStatus.textContent = "Missing assets/speaker-test.mp3";
  }
}

document.getElementById("playLeft").addEventListener("click", () => playMusic(-1, "Playing Left"));
document.getElementById("playRight").addEventListener("click", () => playMusic(1, "Playing Right"));
document.getElementById("playStereo").addEventListener("click", () => playMusic(0, "Playing Stereo"));
document.getElementById("pauseMusic").addEventListener("click", () => {
  musicAudio.pause();
  musicStatus.textContent = "Paused";
});
document.getElementById("stopMusic").addEventListener("click", () => {
  musicAudio.pause();
  musicAudio.currentTime = 0;
  musicStatus.textContent = "Stopped";
});
volume.addEventListener("input", () => {
  musicAudio.volume = Number(volume.value);
  if (audioGain) audioGain.gain.value = Number(volume.value);
});
musicAudio.addEventListener("timeupdate", () => {
  const duration = musicAudio.duration || 0;
  seekBar.value = duration ? (musicAudio.currentTime / duration) * 100 : 0;
  timeLabel.textContent = `${formatTime(musicAudio.currentTime)} / ${formatTime(duration)}`;
});
seekBar.addEventListener("input", () => {
  const duration = musicAudio.duration || 0;
  if (duration) musicAudio.currentTime = (Number(seekBar.value) / 100) * duration;
});

let micStream = null;
let micContext = null;
let micAnimation = null;

async function startMic() {
  try {
    stopMic();
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    micContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = micContext.createMediaStreamSource(micStream);
    const analyser = micContext.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    const data = new Uint8Array(analyser.fftSize);
    const meter = document.getElementById("micMeter");
    const percentText = document.getElementById("micPercent");

    function update() {
      analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const sample = (data[i] - 128) / 128;
        sum += sample * sample;
      }
      const rms = Math.sqrt(sum / data.length);
      const percent = Math.min(100, Math.round(rms * 420));
      meter.style.width = percent + "%";
      percentText.textContent = percent + "%";
      micAnimation = requestAnimationFrame(update);
    }

    update();
  } catch (error) {}
}

function stopMic() {
  if (micAnimation) cancelAnimationFrame(micAnimation);
  if (micStream) micStream.getTracks().forEach(track => track.stop());
  if (micContext && micContext.state !== "closed") micContext.close();
  micAnimation = null;
  micStream = null;
  micContext = null;
  document.getElementById("micMeter").style.width = "0%";
  document.getElementById("micPercent").textContent = "0%";
}

document.getElementById("startMic").addEventListener("click", startMic);
document.getElementById("stopMic").addEventListener("click", stopMic);

let cameraStream = null;

async function loadCameras() {
  if (!navigator.mediaDevices?.enumerateDevices) return;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter(device => device.kind === "videoinput");
    const select = document.getElementById("cameraSelect");
    select.innerHTML = "";
    cameras.forEach((camera, index) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.textContent = camera.label || `Camera ${index + 1}`;
      select.appendChild(option);
    });
  } catch (error) {}
}

async function startCamera() {
  try {
    stopCamera();
    const selectedCamera = document.getElementById("cameraSelect").value;
    const video = selectedCamera ? { deviceId: { exact: selectedCamera } } : true;
    cameraStream = await navigator.mediaDevices.getUserMedia({ video, audio: false });
    document.getElementById("video").srcObject = cameraStream;
    await loadCameras();
  } catch (error) {
    alert("Camera permission denied or camera not available.");
  }
}

function stopCamera() {
  if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
  cameraStream = null;
  document.getElementById("video").srcObject = null;
}

function capturePhoto() {
  const video = document.getElementById("video");
  const canvas = document.getElementById("photoCanvas");
  if (!video.videoWidth) return;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);
}

document.getElementById("startCamera").addEventListener("click", startCamera);
document.getElementById("stopCamera").addEventListener("click", stopCamera);
document.getElementById("capture").addEventListener("click", capturePhoto);
document.getElementById("cameraSelect").addEventListener("change", startCamera);
loadCameras();

document.getElementById("copyBattery").addEventListener("click", async () => {
  const button = document.getElementById("copyBattery");
  try {
    await navigator.clipboard.writeText("powercfg /batteryreport");
    button.textContent = "Copied";
  } catch (error) {
    button.textContent = "Copy Failed";
  }
  setTimeout(() => {
    button.textContent = "Copy";
  }, 1200);
});
