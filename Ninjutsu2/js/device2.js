// device.js (SkyWay v4 / Room SDK でのデバイス取得 & カメラ起動)
//
// 依存: <script src="https://cdn.jsdelivr.net/npm/@skyway-sdk/room/dist/skyway_room-latest.js"></script>
//      window.skyway_room.SkyWayStreamFactory を使用
//
// 既存のUI/関数名/ストレージキーは極力そのまま維持
// - #mic_list, #speaker_list, #local_cameras, #devices_button ... etc
// - USE_CAMERA / USE_MIC / USE_SPEAKER など localStorage キーも維持
//
// 既存のマイク処理(getSelectedMicStream)は WebAudio 連携が多いので基本維持。
// 変更点は「デバイス”取得”とカメラの”起動”」を SkyWay2 API に寄せた点。

//const { SkyWayStreamFactory } = window.skyway_room;

// localStorage keys
const USE_CAMERA = "useCameraList";
const USE_MIC = "useMic";
const USE_SPEAKER = "useSpeaker";
const CAMERA_RESOLUTION = "CameraResolution";

var localVideoStreamMap = new Map(); // <HTMLVideoElement, SkyWayVideoStream>
var localAudioStreamMap = new Map();
var localMicStream = null; // WebAudio出力の MediaStream（従来互換）
var localMicStreamSkyway = null;

var default_width = 1280;
var defualt_heigt = 720;
var numView = 0;

// ===== mic test/speaker test（従来のまま） =====
let bar = null;
let pct = null;
let dbEl = null;
let clipDot = null;

let mic_test_stream = null;
let ac = null;
let srcNode = null,
	analyser = null;
let rafId = null;
let lastClipTime = 0;
let micTestAudio = null;
let speakerTestAudio = null;
const CLIP_HOLD_MS = 250;
function clamp(v, min, max) {
	return Math.max(min, Math.min(max, v));
}

// ---------- UI ヘルパ ----------
function logStream(msg, stream) {
	console.log(msg + ": id=" + stream.id);
	const videoTracks = stream.getVideoTracks();
	if (videoTracks) {
		console.log("videoTracks.length=" + videoTracks.length);
		for (let i = 0; i < videoTracks.length; i++) {
			const track = videoTracks[i];
			const s = track.getSettings?.() ?? {};
			console.log(
				` track.id=${track.id}, ${s.height}*${s.width}, ${s.frameRate} fps`
			);
		}
	}
	const audioTracks = stream.getAudioTracks();
	if (audioTracks) {
		console.log("audioTracks.length=" + audioTracks.length);
		for (let i = 0; i < audioTracks.length; i++) {
			const track = audioTracks[i];
			const s = track.getSettings?.() ?? {};
			console.log(
				` track.id=${track.id}, sampleRate=${s.sampleRate}, echoCancellation=${s.echoCancellation}`
			);
		}
	}
}

async function addCamera(deviceID, deviceLabel) {
	const width = default_width;
	const height = defualt_heigt;
	numView++;

	const contentID = "local_camera_view_" + deviceID;
	const content = document.createElement("div");
	content.setAttribute("id", contentID);
	content.setAttribute("name", "local_camera_view");
	content.setAttribute("class", "item_large");
	content.setAttribute("videoid", deviceID);
	content.setAttribute("deviceLabel", deviceLabel);

	const screenObj = document.createElement("video");
	screenObj.setAttribute("id", "local_camera_video_" + deviceID);
	screenObj.setAttribute("videoid", deviceID);
	screenObj.setAttribute("name", "local_camera_video");
	screenObj.setAttribute("class", "localvideo");
	screenObj.setAttribute("autoplay", "1");
	screenObj.setAttribute("trackid", String(numView - 1));
	screenObj.setAttribute("deviceLabel", deviceLabel);
	screenObj.playsInline = true;
	screenObj.muted = true; // ループバック防止
	// screenObj.controls = true;  // 必要なら有効化

	const checkBoxLabelObj = document.createElement("label");
	checkBoxLabelObj.setAttribute("id", "local_camera_label_" + deviceID);
	checkBoxLabelObj.innerHTML = deviceLabel;

	const checkBoxObj = document.createElement("input");
	checkBoxObj.setAttribute("id", "local_camera_checkBox_" + deviceID);
	checkBoxObj.setAttribute("type", "checkbox");
	checkBoxObj.setAttribute("name", "use-camera");
	checkBoxObj.setAttribute("videoid", deviceID);
	checkBoxObj.checked = true;

	content.appendChild(screenObj);
	content.appendChild(document.createElement("br"));
	content.appendChild(checkBoxObj);
	content.appendChild(checkBoxLabelObj);

	document.getElementById("local_cameras").appendChild(content);

	await startVideo(deviceID, screenObj); // SkyWay2 で起動
}

// SkyWay2 でカメラを起動して <video> に貼り付け
async function startVideo(cameraID, videoEl) {
	const deviceId = cameraID;
	console.log("selected video device id = " + deviceId);

	try {
		// ここで captureSize などの細かい制約を付けたい場合は、ブラウザ制約を
		// SkyWay 側オプションに渡せる範囲で指定してください（最低限 deviceId を指定）
		var vStream = null;
		captureSize = document.getElementById('camera_resolution').value;
		if (captureSize == "1080") {
			vStream = await SkyWayStreamFactory.createCameraVideoStream({
				deviceId: deviceId ? { exact: deviceId } : undefined,
				aspectRatio: { ideal: 1.7777777778 },
				width: { min: 640, ideal: 1920 },
				height: { min: 360, ideal: 1080 },
			});
		} else if (captureSize == "720") {
			vStream = await SkyWayStreamFactory.createCameraVideoStream({
				deviceId: { exact: deviceId },
				aspectRatio: { ideal: 1.7777777778 },
				width: { min: 640, ideal: 1280 },
				height: { min: 360, ideal: 720 },
			});
		} else if (captureSize == "360") {
			vStream = await SkyWayStreamFactory.createCameraVideoStream({
				deviceId: deviceId ? { exact: deviceId } : undefined,
				aspectRatio: { ideal: 1.7777777778 },
				width: { min: 640, ideal: 640 },
				height: { min: 360, ideal: 360 },
			});
		} else {
			vStream = await SkyWayStreamFactory.createCameraVideoStream({
				deviceId: { exact: deviceId },
				aspectRatio: { ideal: 1.7777777778 },
			});
		}

		// SkyWay の attach で element.srcObject に MediaStream が差さる
		vStream.attach(videoEl);
		await videoEl.play();

		// ログ出力用に MediaStream を合成（1トラック）
		const tmp = new MediaStream([vStream.track]);
		
		console.log("try to open camera : "+deviceId+", "+captureSize);
		logStream("selectedVideo", tmp);

		// 管理用に保存
		localVideoStreamMap.set(videoEl, vStream);

		// 失敗時はチェック外す
	} catch (err) {
		console.error("createCameraVideoStream Err:", err);
		const checkBoxObj = document.getElementById(
			"local_camera_checkBox_" + cameraID
		);
		if (checkBoxObj){
			checkBoxObj.checked = false;
			checkBoxObj.disabled = true;
		}
	}
}

// ---- デバイス列挙（SkyWay2 を利用） ----

// 一度だけ権限を取り、デバイスラベルを解決する
async function ensureMicPermission() {
	try {
		const { audio, video } =
			await SkyWayStreamFactory.createMicrophoneAudioAndCameraStream();
		// 速やかに解放（main.js 同様）
		video.release();
		audio.release();
	} catch (e) {
		console.warn("Mic/Camera permission failed on first try:", e);
		try {
			const audio = await SkyWayStreamFactory.createMicrophoneAudioStream();
			audio.release();
		} catch (ee) {
			alert("You need a microphone/camera device: " + ee);
			console.error(ee);
		}
	}
}

function populateEchoSelector(echoSelector, isSupported) {
	echoSelector.replaceChildren();
	echoSelector.disabled = !isSupported;
	if (!isSupported) return;
	for (const [val, label] of [
		["none", "no echo cancel"],
		["system", "system echo cancel"],
		["browser", "browser echo cancel"],
	]) {
		const opt = document.createElement("option");
		opt.value = val;
		opt.textContent = label;
		echoSelector.appendChild(opt);
	}
}

async function getDeviceList() {
	const micList = document.getElementById("mic_list");
	const speakerList = document.getElementById("speaker_list");
	const getDeviceBtn = document.getElementById("devices_button");
	const echoSelector = document.getElementById("echocancelselector");
	const noiseChk = document.getElementById("noisesuppressionchkbox");
	const agcChk = document.getElementById("autogainchkbox");
	const micTestBtn = document.getElementById("mic_test");
	const speakerTestBtn = document.getElementById("speaker_test");
	const stepBtn = document.getElementById("step_button");
	const localCamerasDiv = document.getElementById("local_cameras");

	getDeviceBtn.disabled = true;
	clearDeviceList();

	try {
		// 1) 権限（ラベル解決）
		await ensureMicPermission(); // ← SkyWay2経由（main.js と同じ考え方） :contentReference[oaicite:2]{index=2}

		// 2) SkyWay2 API で列挙
		//const videoInputDevices  = await SkyWayStreamFactory.enumerateInputVideoDevices();

		const devices = await navigator.mediaDevices.enumerateDevices();
		var videoInputDevices = [];
		for (const d of devices) {
			if (d.kind === "videoinput") {
				console.log(`add videoinput: ${d.kind}: ${d.label} id = ${d.deviceId}`);
				videoInputDevices.push({
					id: d.deviceId,
					label: d.label || "camera",
					kind: d.kind,
				});
			}
		}
		//videoInputDevices  = await SkyWayStreamFactory.enumerateInputVideoDevices();

		const audioInputDevices =
			await SkyWayStreamFactory.enumerateInputAudioDevices();
		const audioOutputDevices =
			await SkyWayStreamFactory.enumerateOutputAudioDevices();

		console.log("video in:", videoInputDevices);
		console.log("audio in:", audioInputDevices);
		console.log("audio out:", audioOutputDevices);

		// 3) ブラウザのサポート確認（echo/NS/AGC）
		const sc = navigator.mediaDevices.getSupportedConstraints?.() || {};
		console.log(
			"supported media constraints : echoCancellation =",
			!!sc.echoCancellation
		);
		populateEchoSelector(echoSelector, !!sc.echoCancellation);

		if (sc.noiseSuppression) {
			noiseChk.disabled = false;
		} else {
			noiseChk.checked = false;
			noiseChk.disabled = true;
		}
		if (sc.autoGainControl) {
			agcChk.disabled = false;
		} else {
			agcChk.checked = false;
			agcChk.disabled = true;
		}

		// 4) リスト構築（カメラは即プレビュー作成）
		for (const dev of videoInputDevices) {
			console.log(`add camera: ${dev.label} (${dev.id})`);
			await addCamera(dev.id, dev.label || "camera");
		}

		for (const dev of audioInputDevices) {
			const option = document.createElement("option");
			option.value = dev.id;
			option.setAttribute("label", dev.label || "microphone");
			option.textContent = `${dev.label || "microphone"} (${dev.id})`;
			micList.appendChild(option);
		}

		for (const dev of audioOutputDevices) {
			const option = document.createElement("option");
			option.value = dev.id;
			option.setAttribute("label", dev.label || "speaker");
			option.textContent = `${dev.label || "speaker"} (${dev.id})`;
			speakerList.appendChild(option);
		}

		// 5) 「音声を送らない」オプション
		if (![...micList.options].some((o) => o.value === "none")) {
			const opt = document.createElement("option");
			opt.value = "none";
			opt.textContent = "Don't send audio (none)";
			micList.appendChild(opt);
		}

		// 6) 並び順・選択復元（従来ロジック）
		// --- カメラ順 ---
		const useCameraList = JSON.parse(localStorage.getItem(USE_CAMERA) || "[]");
		const local_cameras = document.getElementById("local_cameras");
		const children = Array.from(local_cameras.children);

		if (useCameraList.length > 0) {
			children.sort((a, b) => {
				const aLabel = a.getAttribute("deviceLabel");
				const bLabel = b.getAttribute("deviceLabel");
				const aIndex = useCameraList.findIndex((item) => item.label === aLabel);
				const bIndex = useCameraList.findIndex((item) => item.label === bLabel);
				return (
					(aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex) -
					(bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex)
				);
			});

			children.forEach((child) => {
				const deviceLabel = child.getAttribute("deviceLabel");
				const videoid = child.getAttribute("videoid");
				const found = useCameraList.find((item) => item.label === deviceLabel);
				const checkBox = document.getElementById(
					"local_camera_checkBox_" + videoid
				);
				if (checkBox){
					if(checkBox.checked){
						//カメラがちゃんと開けている
						checkBox.checked = !!found;
					}
				}
				local_cameras.appendChild(child); // 並べ替え反映
			});
		}

		// --- マイク/スピーカ選択復元 ---
		const useMicLabel = localStorage.getItem(USE_MIC) || "";
		if (useMicLabel !== "") {
			const options = Array.from(micList.options);
			const targetIndex = options.findIndex(
				(opt) => opt.getAttribute("label") === useMicLabel
			);
			micList.selectedIndex = targetIndex !== -1 ? targetIndex : 0;
		}
		const useSpeakerLabel = localStorage.getItem(USE_SPEAKER) || "";
		if (useSpeakerLabel !== "") {
			const options = Array.from(speakerList.options);
			const targetIndex = options.findIndex(
				(opt) => opt.getAttribute("label") === useSpeakerLabel
			);
			speakerList.selectedIndex = targetIndex !== -1 ? targetIndex : 0;
		}

		// 7) イベントを一度だけバインド
		if (!getDeviceList._eventsBound) {
			micList.addEventListener("change", micSelectEvent);
			speakerList.addEventListener("change", mainSpeakerSelectEvent);
			echoSelector.addEventListener("change", micSelectEvent);
			noiseChk.addEventListener("change", micSelectEvent);
			agcChk.addEventListener("change", micSelectEvent);
			getDeviceList._eventsBound = true;
		}

		// 8) 並び替え(Sortable)は一度だけ
		if (window.Sortable && !getDeviceList._sortableInit && localCamerasDiv) {
			Sortable.create(localCamerasDiv);
			getDeviceList._sortableInit = true;
		}

		// 9) テスト系ボタン有効化
		micTestBtn.disabled = false;
		speakerTestBtn.disabled = false;
		stepBtn.disabled = false;
	} catch (err) {
		console.error("enumerateDevices ERROR:", err);
	} finally {
		getDeviceBtn.disabled = false;
	}
}
getDeviceList._eventsBound = false;
getDeviceList._sortableInit = false;

function clearDeviceList() {
	const micList = document.getElementById("mic_list");
	while (micList.lastChild) micList.removeChild(micList.lastChild);

	const speakerList = document.getElementById("speaker_list");
	while (speakerList.lastChild) speakerList.removeChild(speakerList.lastChild);

	const local_cameras = document.getElementById("local_cameras");
	while (local_cameras.lastChild)
		local_cameras.removeChild(local_cameras.lastChild);

	const echoSelector = document.getElementById("echocancelselector");
	while (echoSelector.lastChild)
		echoSelector.removeChild(echoSelector.lastChild);
}

// ===== ここから下は従来ロジックを極力そのまま維持（マイク処理・テスト系など） =====

navigator.mediaDevices.ondevicechange = function (evt) {
	console.log("mediaDevices.ondevicechange() evt:", evt);
};

function micSelectEvent(event) {
	// 既存: isReady/localMixedStream など他ファイル連携はそのまま
	if (isReady) {
		const micId = getSelectedAudio();
		console.log("selected mic id = " + micId);
		getSelectedMicStream()
			.then(() => {
				makeLocalStream();
			})
			.then(() => {
				if (gLocalMicPub) {
					gLocalMicPub.replaceStream(localMicStreamSkyway);
				}
			});
	}
}

function localCameraSelectEvent(event) {
	console.log("local camera checkbox changed " + this.id);
	if (isReady) {
		makeLocalStream();
		for (const [key, value] of remotePeerIDMediaConMap) {
			console.log("replace media stream of " + key);
			value.replaceStream(localMixedStream);
		}
	}
}
function sharingScreenSelectEvent(selected) {
	//selected = true/false
	console.log("sharingScreen changed " + selected);
	if (isReady) {
		//thisPeer4ShareScreenで今つながっている人にかけまくるremotePeerIDMediaConMap->remotePeerIDMediaCon4ShareScreenMap
		if (selected) {
			//call
			
		} else {
			//close
			
		}

		/*
		makeLocalStream();
		//replaceじゃなくてreconnectしないとトラック数変動できない
		callAgainWithScreen();
		*/
	}
}

function finishTestMode() {
	if (micTestAudio != null) {
		micTestAudio.pause();
		micTestAudio.currentTime = 0;
	}
	if (speakerTestAudio != null) {
		speakerTestAudio.pause();
		speakerTestAudio.currentTime = 0;
	}
	var micTestButton = document.getElementById("mic_test");
	micTestButton.innerHTML = "<font size='3'>mic test start</font>";
	micTestButton.disabled = false;
	var speakerTestButton = document.getElementById("speaker_test");
	speakerTestButton.disabled = true;
}

function micTestRecord(event) {
	var micList = document.getElementById("mic_list");
	if (micTestAudio != null) {
		micTestAudio.pause();
		micTestAudio.currentTime = 0;
	}
	if (micTestAudio == null) {
		micTestAudio = document.createElement("audio");
	}
	var micTestButton = document.getElementById("mic_test");

	if (micTestButton.innerHTML.indexOf("mic test start") >= 0) {
		console.log("start mic record test");
		micTestButton.innerHTML = "<font size='3'>mic test finish</font>";
		var micSelector = micList;
		var micId = micSelector.options[micSelector.selectedIndex].value;
		console.log("selected mic id = " + micId);

		if (micId == "don't send audio") {
			return;
		}
		var constraints = {
			audio: {
				//deviceId: micId,
				deviceId: micId === "default" ? undefined : { exact: micId },
				sampleRate: { ideal: 48000 },
				sampleSize: 16,
				echoCancellation: false,
				noiseSuppression: false,
				channelCount: { ideal: 2, min: 1 },
			},
		};
		console.log("mediaDevice.getMedia() constraints:", constraints);
		navigator.mediaDevices
			.getUserMedia(constraints)
			.then(function (stream) {
				const track = stream.getAudioTracks()[0];
				const settings = track.getSettings();
				//console.log("実際に使われた deviceId:", settings.deviceId);
				//console.log("その他の設定:", settings);
				mic_test_stream = stream;
				micTestAudio.srcObject = mic_test_stream;
				micTestAudio.muted = true; // 既定はミュート（ハウリング防止）

				ac = new (window.AudioContext || window.webkitAudioContext)();
				srcNode = ac.createMediaStreamSource(mic_test_stream);
				analyser = ac.createAnalyser();
				analyser.fftSize = 2048;
				srcNode.connect(analyser);

				drawLoop();
				micTestButton.innerHTML = "<font size='3'>mic test stop</font>";
				console.log("start mic test recording");
			})
			.catch(function (err) {
				console.error("getUserMedia Err:", err);
				stopTest(true);
			});
	} else {
		console.log("stop mic record test");
		//micTestButton.innerHTML = "<font size='3'>mic test start</font>";
		stopTest(true);
	}
}

function stopTest(silent = false) {
	if (rafId) {
		cancelAnimationFrame(rafId);
		rafId = null;
	}
	if (srcNode)
		try {
			srcNode.disconnect();
		} catch {}
	srcNode = null;
	analyser = null;

	if (ac) {
		try {
			ac.close();
		} catch {}
		ac = null;
	}
	if (mic_test_stream) {
		mic_test_stream.getTracks().forEach((t) => t.stop());
		mic_test_stream = null;
	}
	var micTestButton = document.getElementById("mic_test");
	micTestButton.innerHTML = "<font size='3'>mic test start</font>";
	if (!silent) log("停止しました。");
}

function drawLoop() {
	if (!analyser) return;

	if (bar == null) bar = document.getElementById("mic_bar");
	if (pct == null) pct = document.getElementById("mic_pct");
	if (dbEl == null) dbEl = document.getElementById("mic_db");
	if (clipDot == null) clipDot = document.getElementById("mic_clip");

	const N = analyser.fftSize;
	const buf = new Float32Array(N);
	analyser.getFloatTimeDomainData(buf);

	// RMS / Peak 計算
	let sumSq = 0,
		peak = 0,
		clipped = false;
	for (let i = 0; i < N; i++) {
		const s = buf[i];
		sumSq += s * s;
		const a = Math.abs(s);
		if (a > peak) peak = a;
		if (a >= 0.98) clipped = true;
	}
	const rms = Math.sqrt(sumSq / N); // 0..1
	const dbfs = 20 * Math.log10(rms || 1e-12); // -∞..0
	const pctVal = clamp(Math.round(rms * 100), 0, 100);

	// メーター表示
	bar.style.width = pctVal + "%";
	pct.textContent = `${pctVal}%`;
	dbEl.textContent = isFinite(dbfs) ? `${dbfs.toFixed(1)} dBFS` : "-∞ dBFS";
	if (clipped) lastClipTime = performance.now();
	clipDot.classList.toggle(
		"on",
		performance.now() - lastClipTime < CLIP_HOLD_MS
	);

	/*
	// オシロ（タイムドメイン）
	ctx2d.clearRect(0,0,scope.width, scope.height);
	ctx2d.strokeStyle = '#666';
	ctx2d.lineWidth = 1;
	ctx2d.beginPath();
	const mid = scope.height / 2;
	for (let x = 0; x < scope.width; x++) {
		const i = Math.floor(x / scope.width * N);
		const y = mid - buf[i] * (scope.height * 0.45);
		if (x === 0) ctx2d.moveTo(x, y); else ctx2d.lineTo(x, y);
	}
	ctx2d.stroke();
*/
	rafId = requestAnimationFrame(drawLoop);
}

function speakerTest(event) {
	var speakerId = getSelectedSpeaker();
	console.log("start speaker test : " + speakerId);
	if (speakerTestAudio != null) {
		speakerTestAudio.pause();
		speakerTestAudio.currentTime = 0;
	} else {
		speakerTestAudio = document.createElement("audio");
		speakerTestAudio.src =
			".\\resources\\そらみち電話のスピーカーのテストです.wav";
		speakerTestAudio.load();
	}

	speakerTestAudio
		.setSinkId(speakerId)
		.then(function () {
			console.log(
				"setSinkID Success, audio is being played on " +
					speakerId +
					" at speaker test"
			);
		})
		.catch(function (err) {
			console.error("setSinkId Err:", err);
		});
	speakerTestAudio.play();
}

var onAudioProcess = function (e) {
	// 音声のバッファを作成
	var input = e.inputBuffer.getChannelData(0);
	var bufferData = new Float32Array(bufferSize);
	for (var i = 0; i < bufferSize; i++) {
		bufferData[i] = input[i];
	}

	// オーディオデータ取得
	var fsDivN = audioContextForMicAnalysis.sampleRate / audioAnalyser.fftSize;
	var spectrums = new Uint8Array(audioAnalyser.frequencyBinCount);
	audioAnalyser.getByteFrequencyData(spectrums);

	//...spectrumsというUint8Arrayデータをあとは解析する
	//例えば、Circular Audio WaveのようなUint8Arrayを扱っているオーディオビジュアライザにわたすとマイクの音声を視覚化できる
	var volume = 0;
	for (var i = 0; i < spectrums.length; i++) {
		volume += spectrums[i];
	}
	var size = 140 + volume / 1000; // 1000は適当(小さくすると円が大きくなる)
	var adj = (128 - size) / 2 - 4; // 4はborderの大きさ
	console.log(volume);
};

function mainSpeakerSelectEvent(event) {
	var mainSpeakerSelector = this;
	var mainSpeakerId =
		mainSpeakerSelector.options[mainSpeakerSelector.selectedIndex].value;
	console.log("selected main speaker id = " + mainSpeakerId);
	//change sound
	requestModalOpenSound
		.setSinkId(mainSpeakerId)
		.then(function () {
			console.log(
				"setSinkID Success, audio is being played on " +
					mainSpeakerId +
					" for requestModalOpenSound"
			);
		})
		.catch(function (err) {
			console.error("setSinkId Err:", err);
		});
	answerRequestSound
		.setSinkId(mainSpeakerId)
		.then(function () {
			console.log(
				"setSinkID Success, audio is being played on " +
					mainSpeakerId +
					" for answerRequestSound"
			);
		})
		.catch(function (err) {
			console.error("setSinkId Err:", err);
		});
	cancelRequestSound
		.setSinkId(mainSpeakerId)
		.then(function () {
			console.log(
				"setSinkID Success, audio is being played on " +
					mainSpeakerId +
					" for cancelRequestSound"
			);
		})
		.catch(function (err) {
			console.error("setSinkId Err:", err);
		});
	stackRequestSound
		.setSinkId(mainSpeakerId)
		.then(function () {
			console.log(
				"setSinkID Success, audio is being played on " +
					mainSpeakerId +
					" for stackRequestSound"
			);
		})
		.catch(function (err) {
			console.error("setSinkId Err:", err);
		});
}

function getSelectedAudio() {
	var micList = document.getElementById("mic_list");
	var id = micList.options[micList.selectedIndex].value;
	console.log("selected mic " + micList.selectedIndex + " " + id);
	return id;
}

function getSelectedAudioLabel() {
	var micList = document.getElementById("mic_list");
	return micList.options[micList.selectedIndex].label;
}

function getSelectedSpeaker() {
	var speakerList = document.getElementById("speaker_list");
	var id = speakerList.options[speakerList.selectedIndex].value;
	console.log("selected speaker " + speakerList.selectedIndex + " " + id);
	return id;
}

function getSelectedSpeakerLabel() {
	var speakerList = document.getElementById("speaker_list");
	return speakerList.options[speakerList.selectedIndex].label;
}

var micGain = 1;
async function getSelectedMicStream() {
	var audioId = getSelectedAudio();
	if (audioId == "don't send audio") {
		console.log(
			audioId +
				", if send no audio track when call, the remote peer can't send audio track too."
		);
		const audioContext = new AudioContext();
		var destination = audioContext.createMediaStreamDestination();
		localMicStream = destination.stream;
		localMicStreamSkyway = null;
		//localMicStream = null;
		return;
	}

	var echocancel = false;
	var noiseSuppressionOnoff = document.getElementById(
		"noisesuppressionchkbox"
	).checked;
	var autogainOnoff = document.getElementById("autogainchkbox").checked;
	var echocancelType = "browser";
	var constraints = null;
	var echocanelValue = document.getElementById("echocancelselector").value;
	console.log(
		"echo cancel selector value = " +
			echocanelValue +
			", noise suppression = " +
			noiseSuppressionOnoff +
			", auto gain = " +
			autogainOnoff
	);
	if (echocanelValue == "none") {
		constraints = {
			audio: {
				//deviceId: audioId,
				deviceId: audioId === "default" ? undefined : { exact: audioId },
				sampleRate: { ideal: 48000 },
				sampleSize: 16,
				autoGainControl: autogainOnoff,
				echoCancellation: echocancel,
				noiseSuppression: noiseSuppressionOnoff,
				channelCount: { ideal: 2, min: 1 },
			},
		};
	} else if (echocanelValue == "system") {
		echocancel = true;
		echocancelType = "system";
		constraints = {
			audio: {
				//deviceId: audioId,
				deviceId: audioId === "default" ? undefined : { exact: audioId },
				sampleRate: { ideal: 48000 },
				sampleSize: 16,
				autoGainControl: autogainOnoff,
				echoCancellation: echocancel,
				echoCancellationType: echocancelType,
				noiseSuppression: noiseSuppressionOnoff,
				channelCount: { ideal: 2, min: 1 },
			},
		};
	} else if (echocanelValue == "browser") {
		echocancel = true;
		echocancelType = "browser";
		constraints = {
			audio: {
				//deviceId: audioId,
				deviceId: audioId === "default" ? undefined : { exact: audioId },
				sampleRate: { ideal: 48000 },
				sampleSize: 16,
				autoGainControl: autogainOnoff,
				echoCancellation: echocancel,
				echoCancellationType: echocancelType,
				noiseSuppression: noiseSuppressionOnoff,
				channelCount: { ideal: 2, min: 1 },
			},
		};
	}
	console.log("mediaDevice.getMedia() constraints:", constraints);

	//ローカル録画用のトラック
	await navigator.mediaDevices
		.getUserMedia(constraints)
		.then(function (stream) {
			//localMicStream = stream;
			if (stream.getAudioTracks().length > 0) {
				console.log("mic setting : ");
				console.log(stream.getAudioTracks()[0].getSettings());
			}
			var delayParam = document.getElementById("micdelayinput").value;
			const audioContext = new AudioContext();
			// for legacy browsers
			audioContext.createDelay =
				audioContext.createDelay || audioContext.createDelayNode;
			// Create the instance of MediaStreamAudioSourceNode
			var source = audioContext.createMediaStreamSource(stream);
			// Create the instance of DelayNode
			var delay = audioContext.createDelay();
			// Set parameters
			delay.delayTime.value = delayParam; // sec
			source.connect(delay);
			var gain = audioContext.createGain();
			delay.connect(gain);
			//delay.connect(audioContext.destination);//これしちゃうとブラウザから音再生されちゃう
			var destination = audioContext.createMediaStreamDestination();
			//delay.connect(destination);
			gain.connect(destination);
			localMicStream = destination.stream;

			document
				.getElementById("micdelayinput")
				.addEventListener("input", function (event) {
					delay.delayTime.value =
						document.getElementById("micdelayinput").value;
					console.log(
						"set mic delay = " +
							document.getElementById("micdelayinput").value +
							" sec"
					);
				});

			if (!document.getElementById("mutecheckbox").checked) {
				gain.gain.value = 0;
			}
			document
				.getElementById("mutecheckbox")
				.addEventListener("change", function (event) {
					console.log(
						"set mic mute = " + !document.getElementById("mutecheckbox").checked
					);
					if (document.getElementById("mutecheckbox").checked) {
						gain.gain.value = micGain;
					} else {
						gain.gain.value = 0;
					}
				});
			document
				.getElementById("micvolumeslider")
				.addEventListener("input", function (event) {
					console.log(
						"set mic gain = " + document.getElementById("micvolumeslider").value
					);
					micGain = document.getElementById("micvolumeslider").value;
					gain.gain.value = micGain;
					if (document.getElementById("mutecheckbox").checked == false) {
						document.getElementById("mutecheckbox").checked = true;
					}
				});
			//document.getElementById("echocancelselector").disabled = true;
		})
		.catch(function (err) {
			console.error("getUserMedia Err:", err);
		});

	//skyway用のトラック
	if (echocanelValue == "none") {
		constraints = {
			//deviceId: audioId,
			deviceId: audioId === "default" ? undefined : { exact: audioId },
			sampleRate: { ideal: 48000 },
			sampleSize: 16,
			autoGainControl: autogainOnoff,
			echoCancellation: echocancel,
			noiseSuppression: noiseSuppressionOnoff,
			channelCount: { ideal: 2, min: 1 },
		};
	} else if (echocanelValue == "system") {
		echocancel = true;
		echocancelType = "system";
		constraints = {
			//deviceId: audioId,
			deviceId: audioId === "default" ? undefined : { exact: audioId },
			sampleRate: { ideal: 48000 },
			sampleSize: 16,
			autoGainControl: autogainOnoff,
			echoCancellation: echocancel,
			echoCancellationType: echocancelType,
			noiseSuppression: noiseSuppressionOnoff,
			channelCount: { ideal: 2, min: 1 },
		};
	} else if (echocanelValue == "browser") {
		echocancel = true;
		echocancelType = "browser";
		constraints = {
			//deviceId: audioId,
			deviceId: audioId === "default" ? undefined : { exact: audioId },
			sampleRate: { ideal: 48000 },
			sampleSize: 16,
			autoGainControl: autogainOnoff,
			echoCancellation: echocancel,
			echoCancellationType: echocancelType,
			noiseSuppression: noiseSuppressionOnoff,
			channelCount: { ideal: 2, min: 1 },
		};
	}
	console.log("mediaDevice.getMedia() constraints:", constraints);
	await SkyWayStreamFactory.createMicrophoneAudioStream(constraints)
		.then(function (stream) {
			//console.log(stream);
			localMicStreamSkyway = stream;
			//document.getElementById("echocancelselector").disabled = true;
		})
		.catch(function (err) {
			console.error("getUserMedia Err:", err);
		});
}

function standbyDevice() {
	var elements = document.getElementsByName("use-camera");
	var navVideoContainer = document.getElementById("local_cameras_onnav");
	while (navVideoContainer.lastChild) {
		navVideoContainer.removeChild(navVideoContainer.lastChild);
	}

	//使うカメラだけ残してあとは削除
	var useCameras = new Array();
	var useCameraList = []; //localStorage
	for (var i = 0; i < elements.length; i++) {
		if (!elements[i].checked) {
			var srcVideo = document.getElementById(
				"local_camera_video_" + elements[i].getAttribute("videoid")
			);
			if (srcVideo.srcObject != null) {
				console.log(
					"close camera : " +
						elements[i].getAttribute("videoid") +
						", " +
						elements[i].id
				);
				srcVideo.srcObject.getTracks().forEach((track) => track.stop());
			}
		} else {
			useCameras.push(
				"local_camera_view_" + elements[i].getAttribute("videoid")
			);
			console.log(
				"append camera : " +
					elements[i].getAttribute("videoid") +
					", " +
					elements[i].id
			);
			elements[i].addEventListener("change", localCameraSelectEvent);
		}
	}
	for (var i = 0; i < useCameras.length; i++) {
		var videoContainer = document.getElementById(useCameras[i]);

		//相手に送るか，ROSに送るかチェックボックスを追加
		var videoid = videoContainer.getAttribute("videoid");
		var checkBoxLabelObj = document.getElementById(
			"local_camera_label_" + videoid
		);
		checkBoxLabelObj.innerHTML = "send to users&nbsp;";

		// 配列に追加
		useCameraList.push({
			index: i,
			label: videoContainer.getAttribute("deviceLabel"),
			videoid: videoid,
		});

		var sendRosInput = document.getElementById("streaming2local");
		if (sendRosInput.checked) {
			var checkBoxLabelObj = document.createElement("label");
			checkBoxLabelObj.setAttribute(
				"id",
				"local_camera_streaming_label_" + videoid
			);
			checkBoxLabelObj.innerHTML = "streaming to local";
			var checkBoxObj = document.createElement("input");
			checkBoxObj.setAttribute(
				"id",
				"local_camera_streaming_checkBox_" + videoid
			);
			checkBoxObj.setAttribute("type", "checkbox");
			checkBoxObj.setAttribute("name", "use-camera");
			checkBoxObj.setAttribute("videoid", videoid);
			checkBoxObj.setAttribute("teleopetype", "avatar");
			checkBoxObj.setAttribute(
				"videocontainerid",
				"local_camera_video_" + videoid
			);
			checkBoxObj.checked = true;
			checkBoxObj.addEventListener("change", streamingLocalCheckBoxChanged);
			videoContainer.appendChild(checkBoxObj);
			videoContainer.appendChild(checkBoxLabelObj);
		}

		// localStorage に保存（名前とインデックスをペアで保存）
		localStorage.setItem(
			"camera_" + i,
			JSON.stringify({
				index: i,
				name: useCameras[i],
			})
		);

		navVideoContainer.appendChild(videoContainer); //これするとelements要素が変わっちゃうっぽい
	}

	// 最後にまとめて localStorage に保存
	localStorage.setItem(USE_CAMERA, JSON.stringify(useCameraList));
	//console.log(JSON.stringify(useCameraList));

	var local_cameras = document.getElementById("local_cameras");
	while (local_cameras != null && local_cameras.lastChild) {
		local_cameras.removeChild(local_cameras.lastChild);
	}

	//マイク・スピーカーセッティングを移動
	var micsettingElement = document.getElementById("micsetting");
	var micsettingOnNavElement = document.getElementById("micsetting_onnav");
	micsettingOnNavElement.appendChild(micsettingElement);

	var speakersettingElement = document.getElementById("speakersetting");
	var speakersettingOnNavElement = document.getElementById(
		"speakersetting_onnav"
	);
	speakersettingOnNavElement.appendChild(speakersettingElement);

	//getSelectedMicStream();
	getSelectedMicStream().then(() => {
		//録画用にローカルカメラにマイクトラックを加える
		var elements = document.getElementsByName("local_camera_video");

		//取得した一覧から全てのvalue値を表示する
		for (var i = 0; i < elements.length; i++) {
			//elements[i].setAttribute('width', String(width)+'px');
			//elements[i].setAttribute('height', String(height)+'px');
			//elements[i].width = width;
			//elements[i].height = height;
			//elements[i].setAttribute('muted', 'true');
			elements[i].muted = true;
			//elements[i].setAttribute('controls', '1');
			//getSelectedMicStreamしてすぐだから間に合わないかもちゃんとasyncせなあかん
			if (
				localMicStream != null &&
				localMicStream.getAudioTracks().length > 0
			) {
				elements[i].srcObject.addTrack(localMicStream.getAudioTracks()[0]);
			} else {
				console.log("local mic stream is null");
			}

			/*
			//check boxとcamera labelを削除
			var removeItem = document.getElementById('local_camera_checkBox_'+elements[i].getAttribute('videoid'));
			if(removeItem != null){
				removeItem.parentNode.removeChild(removeItem);
			}
			removeItem = document.getElementById('local_camera_label_'+elements[i].getAttribute('videoid'));
			if(removeItem != null){
				removeItem.parentNode.removeChild(removeItem);
			}
			*/
		}
	});

	//mic speakerを保存
	localStorage.setItem(USE_MIC, getSelectedAudioLabel());
	localStorage.setItem(USE_SPEAKER, getSelectedSpeakerLabel());
	localStorage.setItem(CAMERA_RESOLUTION, document.getElementById('camera_resolution').value);
	
}

function checkValidCameraNumber(){
	const webrtc_topology = document.getElementById('webrtc_topology').value;
	if(webrtc_topology == 'p2p'){
		var validCameraNum = 0;	
		var elements = document.getElementsByName("use-camera");
		for (var i = 0; i < elements.length; i++) {
			if (elements[i].checked) {
				validCameraNum++;
			}
		}
		if(validCameraNum > 3){
			return false;
		}
	}
	return true;
}