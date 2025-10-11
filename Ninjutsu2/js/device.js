//localStorage label
const USE_CAMERA = "useCameraList"
const USE_MIC = "useMic"
const USE_SPEAKER = "useSpeaker"

var localVideoStreamMap = new Map();
var localAudioStreamMap = new Map();
var localMicStream = null;

var default_width = 1280;
var defualt_heigt = 720;
var numView = 0;

//mic mic_test
let bar = null;
let pct = null;
let dbEl = null;
let clipDot = null;

let mic_test_stream = null;
let ac = null;
let srcNode = null, analyser = null;
let rafId = null;
let lastClipTime = 0;
let micTestAudio = null;
let speakerTestAudio = null;
const CLIP_HOLD_MS = 250;
function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }

async function addCamera(deviceID, deviceLabel) {
	var width = default_width;
	var height = defualt_heigt;
	numView++;
	var content;
	var contentID = 'local_camera_view_' + deviceID;
	content = document.createElement('div');
	content.setAttribute('id', contentID);
	content.setAttribute('name', 'local_camera_view');
	content.setAttribute('class', 'item_large');
	content.setAttribute('videoid', deviceID);
	content.setAttribute('deviceLabel', deviceLabel);
	//content.setAttribute('style', 'padding: 10px; margin-bottom: 10px; border: 1px solid #333333;');
	var screenObj;
	screenObj = document.createElement('video');
	screenObj.setAttribute('id', 'local_camera_video_' + deviceID);
	screenObj.setAttribute('videoid', deviceID);
	screenObj.setAttribute('name', 'local_camera_video');
	screenObj.setAttribute('class', "localvideo");
	screenObj.setAttribute('autoplay', '1');
	screenObj.setAttribute('trackid', numView-1);
	screenObj.setAttribute('deviceLabel', deviceLabel);

	//controlsを入れるとダブルクリックで最大化したりPictureInPicureモードとかできる
	//screenObj.setAttribute('controls', '1');
	//screenObj.setAttribute('style', 'border: 1px solid;');
	/*
	var screenObj2;
	screenObj2 = document.createElement('video');
	screenObj2.setAttribute('id', 'local_camera_video_sub' + deviceID);
	screenObj2.setAttribute('name', 'local_camera_video');
	screenObj2.setAttribute('width', String(width) + 'px');
	screenObj2.setAttribute('height', String(height) + 'px');
	screenObj2.setAttribute('autoplay', '1');
	screenObj2.setAttribute('controls', '1');
	screenObj2.setAttribute('style', 'border: 1px solid;');
	*/
	var checkBoxLabelObj = document.createElement('label');
	checkBoxLabelObj.setAttribute('id', 'local_camera_label_' + deviceID);
	checkBoxLabelObj.innerHTML = deviceLabel;
	var checkBoxObj;
	//<input type="checkbox" name="os" value="win7">Windows7
	checkBoxObj = document.createElement('input');
	checkBoxObj.setAttribute('id', 'local_camera_checkBox_' + deviceID);
	checkBoxObj.setAttribute('type', 'checkbox');
	checkBoxObj.setAttribute('name', 'use-camera');
	checkBoxObj.setAttribute('videoid', deviceID);
	//checkBoxObj.setAttribute('class', 'form-check-input');
	checkBoxObj.checked = true;
	//checkBoxObj.setAttribute('disabled');
	//checkBoxObj.setAttribute('checked');
	content.appendChild(screenObj);
	//content.appendChild(screenObj2);
	content.appendChild(document.createElement('br'));
	content.appendChild(checkBoxObj);
	content.appendChild(checkBoxLabelObj);
	const local_cameras = document.getElementById("local_cameras");
	local_cameras.appendChild(content);
	await startVideo(deviceID, screenObj);
	//startVideos(deviceID, screenObj, screenObj2);
}


async function addDevice(device) {
	var micList = document.getElementById("mic_list");
	var speakerList = document.getElementById("speaker_list");
	if (device.kind === 'audioinput') {
		var id = device.deviceId;
		var label = device.label || 'microphone'; // label is available for https
		var option = document.createElement('option');
		option.setAttribute('value', id);
		option.setAttribute('label', label);
		option.innerHTML = label + '(' + id + ')';;
		micList.appendChild(option);
	} else if (device.kind === 'videoinput') {
		var id = device.deviceId;
		var label = device.label || 'camera'; // label is available for https
		/*
		var option = document.createElement('option');
		option.setAttribute('value', id);
		option.innerHTML = label + '(' + id + ')';
		cameraList.appendChild(option);
		*/
		await addCamera(id, label);
	} else if (device.kind === 'audiooutput') {
		var id = device.deviceId;
		var label = device.label || 'speaker'; // label is available for https
		var option = document.createElement('option');
		option.setAttribute('value', id);
		option.setAttribute('label', label);
		option.innerHTML = label + '(' + id + ')';
		speakerList.appendChild(option);
	} else {
		console.error('UNKNOWN Device kind:' + device.kind);
	}
}

// 一度だけ権限を取りに行く（label を出すため）
async function ensureMicPermission() {
  try {
    const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    s.getTracks().forEach(t => t.stop());
  } catch (_) {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      s.getTracks().forEach(t => t.stop());
    } catch (e2) {
      alert("You need a microphone device: " + e2);
      console.error(e2);
    }
  }
}

function populateEchoSelector(echoSelector, isSupported) {
  echoSelector.replaceChildren(); // 重複防止
  echoSelector.disabled = !isSupported;
  if (!isSupported) return;
  for (const [val, label] of [
    ["none",    "no echo cancel"],
    ["system",  "system echo cancel"],
    ["browser", "browser echo cancel"],
  ]) {
    const opt = document.createElement("option");
    opt.value = val;
    opt.textContent = label;
    echoSelector.appendChild(opt);
  }
}

async function getDeviceList() {
  const micList       = document.getElementById("mic_list");
  const speakerList   = document.getElementById("speaker_list");
  const getDeviceBtn  = document.getElementById("devices_button");
  const echoSelector  = document.getElementById("echocancelselector");
  const noiseChk      = document.getElementById("noisesuppressionchkbox");
  const agcChk        = document.getElementById("autogainchkbox");
  const micTestBtn    = document.getElementById("mic_test");
  const speakerTestBtn= document.getElementById("speaker_test");
  const stepBtn       = document.getElementById("step_button");
  const localCamerasDiv = document.getElementById("local_cameras");

  getDeviceBtn.disabled = true;
  clearDeviceList();

  try {
    // 1) 権限（ラベル表示のため）
    await ensureMicPermission();

    // 2) デバイス列挙
    const devices = await navigator.mediaDevices.enumerateDevices();
    const sc = navigator.mediaDevices.getSupportedConstraints();
    console.log("supported media constraints : echoCancellation =", !!sc.echoCancellation);
		// console.log(sc);

    // 3) 機能可否で UI を制御
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

    // 4) デバイスを追加
    for (const d of devices) {
      console.log(`add device: ${d.kind}: ${d.label} id = ${d.deviceId}`);
      // addDevice が async なら await
      await addDevice(d);
    }

    // 5) 「音声を送らない」オプションを最後に（重複防止してから）
    if (![...micList.options].some(o => o.value === "none")) {
      const opt = document.createElement("option");
      opt.value = "none";
      opt.textContent = "Don't send audio (none)";
      micList.appendChild(opt);
    }

		// ソート
		// 保存済みの順序リストを取得
		var useCameraList = JSON.parse(localStorage.getItem(USE_CAMERA) || "[]");
		//console.log(useCameraList);
		// local_cameras の子要素を配列として取得
		const local_cameras = document.getElementById("local_cameras");
		const children = Array.from(local_cameras.children);

		// useCameraList が空ならチェックだけ全部 true
		if (useCameraList.length === 0) {
			//放置
	    children.forEach(child => {
	        const videoid = child.getAttribute("videoid");
	        const checkBox = document.getElementById("local_camera_checkBox_" + videoid);
					//if (checkBox) checkBox.checked = true;
	    });
		} else {
		    // 並び替え
		    children.sort((a, b) => {
		        const aLabel = a.getAttribute("deviceLabel");
		        const bLabel = b.getAttribute("deviceLabel");

		        const aIndex = useCameraList.findIndex(item => item.label === aLabel);
		        const bIndex = useCameraList.findIndex(item => item.label === bLabel);

		        // 見つからなければ末尾扱い
		        return (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex) -
		               (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex);
		    });

		    // 並べ替え＋チェックボックスの更新
		    children.forEach(child => {
		        const deviceLabel = child.getAttribute("deviceLabel");
		        const videoid = child.getAttribute("videoid");

		        const found = useCameraList.find(item => item.label === deviceLabel);

		        const checkBox = document.getElementById("local_camera_checkBox_" + videoid);
		        if (checkBox) {
		            checkBox.checked = !!found; // あれば true, なければ false
		        }

		        // appendChild で再配置（中身は消えない）
		        local_cameras.appendChild(child);
		    });
		}

		var useMicLabel = (localStorage.getItem(USE_MIC) || "");
		if (useMicLabel !== "") {
		    // option一覧を配列化
		    var options = Array.from(micList.options);

		    // 一致するものを探す
		    var targetIndex = options.findIndex(opt => opt.getAttribute("label") === useMicLabel);

		    if (targetIndex !== -1) {
		        micList.selectedIndex = targetIndex;
		    } else {
		        // 見つからなければ先頭を選択するなどフォールバック
		        micList.selectedIndex = 0;
		    }
		}
		var useSpeakerLabel = (localStorage.getItem(USE_SPEAKER) || "");
		if (useSpeakerLabel !== "") {
				// option一覧を配列化
				var options = Array.from(micList.options);

				// 一致するものを探す
				var targetIndex = options.findIndex(opt => opt.getAttribute("label") === useSpeakerLabel);

				if (targetIndex !== -1) {
						speakerList.selectedIndex = targetIndex;
				} else {
						// 見つからなければ先頭を選択するなどフォールバック
						speakerList.selectedIndex = 0;
				}
		}

    // 6) イベントは一度だけバインド
    if (!getDeviceList._eventsBound) {
      micList.addEventListener("change", micSelectEvent);
      speakerList.addEventListener("change", mainSpeakerSelectEvent);
      echoSelector.addEventListener("change", micSelectEvent);
      noiseChk.addEventListener("change", micSelectEvent);
      agcChk.addEventListener("change", micSelectEvent);
      getDeviceList._eventsBound = true;
    }

    // 7) 並び替え（Sortable）は一度だけ作成
    if (window.Sortable && !getDeviceList._sortableInit && localCamerasDiv) {
      Sortable.create(localCamerasDiv);
      getDeviceList._sortableInit = true;
    }

    // 8) ボタン有効化
    micTestBtn.disabled     = false;
    speakerTestBtn.disabled = false;
    stepBtn.disabled        = false;

  } catch (err) {
    console.error("enumerateDevices ERROR:", err);
  } finally {
    // 失敗しても「取得」ボタンは戻す
    getDeviceBtn.disabled = false;
  }
}
// 多重対策フラグ
getDeviceList._eventsBound = false;
getDeviceList._sortableInit = false;


function clearView() {
	const local_cameras = document.getElementById("local_cameras");
	var contentID = button.getAttribute("contentID");
	//console.log(contentID);
	var removeObj = document.getElementById(contentID);
}

function clearDeviceList() {
	var micList = document.getElementById("mic_list");
	while (micList.lastChild) {
		micList.removeChild(micList.lastChild);
	}
	var speakerList = document.getElementById("speaker_list");
	while (speakerList.lastChild) {
		speakerList.removeChild(speakerList.lastChild);
	}
	var local_cameras = document.getElementById("local_cameras");
	while (local_cameras.lastChild) {
		local_cameras.removeChild(local_cameras.lastChild);
	}
	var echoSelector = document.getElementById("echocancelselector");
	while (echoSelector.lastChild) {
		echoSelector.removeChild(echoSelector.lastChild);
	}
}

async function startVideo(cameraID, video) {
	//var audioId = getSelectedAudio();
	var deviceId = cameraID;
	console.log('selected video device id=' + deviceId);


	//default camera はID指定するとうまくconstraintが反映されない
	var constraints;
	if(captureSize == "720"){
		constraints = {
			video: {
				deviceId: {exact: deviceId},
				aspectRatio: {ideal: 1.7777777778},
				width: { min: 640, ideal: 1280 },
				height: { min: 360, ideal: 720 }
			}
		};
	}  else if(captureSize == "1080"){
		constraints = {
			video: {
				deviceId: deviceId ? {exact: deviceId} : undefined,
				aspectRatio: {ideal: 1.7777777778},
				width: { min: 640, ideal: 1920 },
				height: { min: 360, ideal: 1080 }
			}
		};
	} else {
		constraints = {
			video: {
				deviceId: {exact: deviceId},
				aspectRatio: {ideal: 1.7777777778}
			}
		};
	}

	console.log('mediaDevice.getMedia() constraints:', constraints);
	await navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
		logStream('selectedVideo', stream);
		video.srcObject = stream;
		localVideoStreamMap.set(video, stream);
		console.log('got camera stream of '+stream.getVideoTracks()[0].getSettings().deviceId);
	}).catch(function (err) {
		console.error('getUserMedia Err:', err);
		var checkBoxObj = document.getElementById('local_camera_checkBox_' + cameraID);
		if(checkBoxObj != null){
			checkBoxObj.checked = false;
		}
	});
}

navigator.mediaDevices.ondevicechange = function (evt) {
	console.log('mediaDevices.ondevicechange() evt:', evt);
};

//こんな感じで映像のトラック数と音のトラック数がわかる，相手から複数映像トラックがある場合は分割しよう
function logStream(msg, stream) {
	console.log(msg + ': id=' + stream.id);
	var videoTracks = stream.getVideoTracks();
	if (videoTracks) {
		console.log('videoTracks.length=' + videoTracks.length);
		for (var i = 0; i < videoTracks.length; i++) {
			var track = videoTracks[i];
			console.log(' track.id=' + track.id+', '+track.getSettings().height+'*'+track.getSettings().width+', '+track.getSettings().frameRate+' fps');
		}
	}
	var audioTracks = stream.getAudioTracks();
	if (audioTracks) {
		console.log('audioTracks.length=' + audioTracks.length);
		for (var i = 0; i < audioTracks.length; i++) {
			var track = audioTracks[i];
			console.log(' track.id=' + track.id+', '+track.getSettings().sampleRate+' echo cancel = '+track.getSettings().echoCancellation);
		}
	}
}

function micSelectEvent(event){
	//setMicAnalysis(this);
	if(isReady){
		var micId = getSelectedAudio();
		console.log("selected mic id = "+micId);
		getSelectedMicStream().then(() => {
			makeLocalStream();
		}).then(() => {
			for(var[key, value] of remotePeerIDMediaConMap){
				console.log("replace media stream of "+key);
				value.replaceStream(localMixedStream);
			}
		});
	}
}

function localCameraSelectEvent(event){
	console.log("local camera checkbox changed "+this.id);
	if(isReady){
		makeLocalStream();
		for(var[key, value] of remotePeerIDMediaConMap){
			console.log("replace media stream of "+key);
			value.replaceStream(localMixedStream);
		}
	}
}

function sharingScreenSelectEvent(selected){
	//selected = true/false
	console.log("sharingScreen changed "+selected);
	if(isReady && thisPeer4ShareScreen != null){
		//thisPeer4ShareScreenで今つながっている人にかけまくるremotePeerIDMediaConMap->remotePeerIDMediaCon4ShareScreenMap
		if(selected){
			//call
			var stream = getSharingScreenTrack();
			for(var[key, value] of remotePeerIDMediaConMap){
				console.log("start send shared screen track to "+key);
				mediaCall4ShareScreen(key, stream);
				//value.replaceStream(localMixedStream);
			}
		} else {
			//close
			for(var[key, value] of remotePeerIDMediaCon4ShareScreenMap){
				console.log("stop shared screen track to "+key);
				closeRemote4ShareScreen(key);
				//value.replaceStream(localMixedStream);
			}
		}

		/*
		makeLocalStream();
		//replaceじゃなくてreconnectしないとトラック数変動できない
		callAgainWithScreen();
		*/

	}
}

function finishTestMode(){
	if(micTestAudio != null){
		micTestAudio.pause();
		micTestAudio.currentTime = 0;
	}
	if(speakerTestAudio != null){
		speakerTestAudio.pause();
		speakerTestAudio.currentTime = 0;
	}
	var micTestButton = document.getElementById("mic_test");
	micTestButton.innerHTML = "<font size='3'>mic test start</font>";
	micTestButton.disabled = false;
	var speakerTestButton = document.getElementById("speaker_test");
	speakerTestButton.disabled = true;
}

function micTestRecord(event){
	var micList = document.getElementById("mic_list");
	if(micTestAudio != null){
		micTestAudio.pause();
		micTestAudio.currentTime = 0;
	}
	if(micTestAudio == null){
		micTestAudio = document.createElement('audio');
	}
	var micTestButton = document.getElementById("mic_test");

	if(micTestButton.innerHTML.indexOf('mic test start') >= 0){
		console.log("start mic record test");
		micTestButton.innerHTML = "<font size='3'>mic test finish</font>";
		var micSelector = micList;
		var micId = micSelector.options[micSelector.selectedIndex].value;
		console.log("selected mic id = "+micId);

		if(micId == "don't send audio"){
			return;
		}
		var constraints = {
			audio: {
				//deviceId: micId,
				deviceId: micId === 'default' ? undefined : { exact: micId },
				sampleRate: {ideal: 48000},
				sampleSize: 16,
				echoCancellation: false,
				noiseSuppression: false,
				channelCount: {ideal: 2, min: 1}
			}
		};
		console.log('mediaDevice.getMedia() constraints:', constraints);
		navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
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
		}).catch(function (err) {
				console.error('getUserMedia Err:', err);
				stopTest(true);
		});
	} else {
		console.log("stop mic record test");
		//micTestButton.innerHTML = "<font size='3'>mic test start</font>";
		stopTest(true);
	}
}

function stopTest(silent = false) {
	if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
	if (srcNode) try { srcNode.disconnect(); } catch {}
	srcNode = null;
	analyser = null;

	if (ac) { try { ac.close(); } catch {} ac = null; }
	if (mic_test_stream) {
		mic_test_stream.getTracks().forEach(t => t.stop());
		mic_test_stream = null;
	}
	var micTestButton = document.getElementById("mic_test");
	micTestButton.innerHTML = "<font size='3'>mic test start</font>";
	if (!silent) log('停止しました。');
}

function drawLoop() {
	if (!analyser) return;

	if(bar == null)
		bar = document.getElementById('mic_bar');
	if(pct == null)
		pct = document.getElementById('mic_pct');
	if(dbEl == null)
		dbEl = document.getElementById('mic_db');
	if(clipDot == null)
		clipDot = document.getElementById('mic_clip');

	const N = analyser.fftSize;
	const buf = new Float32Array(N);
	analyser.getFloatTimeDomainData(buf);

	// RMS / Peak 計算
	let sumSq = 0, peak = 0, clipped = false;
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
	bar.style.width = pctVal + '%';
	pct.textContent = `${pctVal}%`;
	dbEl.textContent = isFinite(dbfs) ? `${dbfs.toFixed(1)} dBFS` : '-∞ dBFS';
	if (clipped) lastClipTime = performance.now();
	clipDot.classList.toggle('on', performance.now() - lastClipTime < CLIP_HOLD_MS);

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

function speakerTest(event){
	var speakerId = getSelectedSpeaker();
	console.log("start speaker test : "+speakerId);
	if(speakerTestAudio != null){
		speakerTestAudio.pause();
		speakerTestAudio.currentTime = 0;
	} else {
		speakerTestAudio = document.createElement('audio');
		speakerTestAudio.src = ".\\resources\\そらみち電話のスピーカーのテストです.wav";
		speakerTestAudio.load();
	}

	speakerTestAudio.setSinkId(speakerId)
		.then(function() {
		console.log('setSinkID Success, audio is being played on '+speakerId +' at speaker test');
	})
	.catch(function(err) {
		console.error('setSinkId Err:', err);
	});
	speakerTestAudio.play();
}

var onAudioProcess = function(e) {
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
	for(var i = 0; i<spectrums.length; i++){
		volume += spectrums[i];
	}
	var size = (140 + volume/1000); // 1000は適当(小さくすると円が大きくなる)
	var adj = (128-size)/2 - 4; // 4はborderの大きさ
	console.log(volume);

}


function mainSpeakerSelectEvent(event){
	var mainSpeakerSelector = this;
	var mainSpeakerId = mainSpeakerSelector.options[mainSpeakerSelector.selectedIndex].value;
	console.log("selected main speaker id = "+mainSpeakerId);
	//change sound
	requestModalOpenSound.setSinkId(mainSpeakerId)
		.then(function() {
		console.log('setSinkID Success, audio is being played on '+mainSpeakerId +' for requestModalOpenSound');
	})
	.catch(function(err) {
		console.error('setSinkId Err:', err);
	});
	answerRequestSound.setSinkId(mainSpeakerId)
		.then(function() {
		console.log('setSinkID Success, audio is being played on '+mainSpeakerId +' for answerRequestSound');
	})
	.catch(function(err) {
		console.error('setSinkId Err:', err);
	});
	cancelRequestSound.setSinkId(mainSpeakerId)
		.then(function() {
		console.log('setSinkID Success, audio is being played on '+mainSpeakerId +' for cancelRequestSound');
	})
	.catch(function(err) {
		console.error('setSinkId Err:', err);
	});
	stackRequestSound.setSinkId(mainSpeakerId)
		.then(function() {
		console.log('setSinkID Success, audio is being played on '+mainSpeakerId +' for stackRequestSound');
	})
	.catch(function(err) {
		console.error('setSinkId Err:', err);
	});
}

function getSelectedAudio() {
	var micList = document.getElementById("mic_list");
	var id = micList.options[micList.selectedIndex].value;
	console.log('selected mic '+micList.selectedIndex+' '+id);
	return id;
}

function getSelectedAudioLabel() {
	var micList = document.getElementById("mic_list");
	return micList.options[micList.selectedIndex].label;
}

function getSelectedSpeaker() {
	var speakerList = document.getElementById("speaker_list");
	var id = speakerList.options[speakerList.selectedIndex].value;
	console.log('selected speaker '+speakerList.selectedIndex+' '+id);
	return id;
}

function getSelectedSpeakerLabel() {
	var speakerList = document.getElementById("speaker_list");
	return speakerList.options[speakerList.selectedIndex].label;;
}

var micGain = 1;
async function getSelectedMicStream(){
	var audioId = getSelectedAudio();
	if(audioId == "don't send audio"){
		console.log(audioId+", if send no audio track when call, the remote peer can't send audio track too.");
		const audioContext = new AudioContext();
		var destination = audioContext.createMediaStreamDestination();
		localMicStream = destination.stream;
		//localMicStream = null;
		return;
	}

	var echocancel = false;
	var noiseSuppressionOnoff = document.getElementById("noisesuppressionchkbox").checked;
	var autogainOnoff = document.getElementById("autogainchkbox").checked;
	var echocancelType = "browser";
	var constraints = null;
	var echocanelValue = document.getElementById("echocancelselector").value;
	console.log("echo cancel selector value = "+echocanelValue+", noise suppression = "+noiseSuppressionOnoff+ ", auto gain = "+autogainOnoff);
	if(echocanelValue == "none"){
		constraints = {
			audio: {
				//deviceId: audioId,
				deviceId: audioId === 'default' ? undefined : { exact: audioId },
				sampleRate: {ideal: 48000},
				sampleSize: 16,
				autoGainControl: autogainOnoff,
				echoCancellation: echocancel,
				noiseSuppression: noiseSuppressionOnoff,
				channelCount: {ideal: 2, min: 1}
			}
		};
	} else if(echocanelValue == "system"){
		echocancel = true;
		echocancelType = "system";
		constraints = {
			audio: {
				//deviceId: audioId,
				deviceId: audioId === 'default' ? undefined : { exact: audioId },
				sampleRate: {ideal: 48000},
				sampleSize: 16,
				autoGainControl: autogainOnoff,
				echoCancellation: echocancel,
				echoCancellationType: echocancelType,
				noiseSuppression: noiseSuppressionOnoff,
				channelCount: {ideal: 2, min: 1}
			}
		};
	}  else if(echocanelValue == "browser"){
		echocancel = true;
		echocancelType = "browser";
		constraints = {
			audio: {
				//deviceId: audioId,
				deviceId: audioId === 'default' ? undefined : { exact: audioId },
				sampleRate: {ideal: 48000},
				sampleSize: 16,
				autoGainControl: autogainOnoff,
				echoCancellation: echocancel,
				echoCancellationType: echocancelType,
				noiseSuppression: noiseSuppressionOnoff,
				channelCount: {ideal: 2, min: 1}
			}
		};
	}
	console.log('mediaDevice.getMedia() constraints:', constraints);
	await navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
		//localMicStream = stream;
		if(stream.getAudioTracks().length > 0){
			console.log("mic setting : ");
			console.log(stream.getAudioTracks()[0].getSettings());
		}
		var delayParam = document.getElementById("micdelayinput").value;
		const audioContext = new AudioContext();
		// for legacy browsers
		audioContext.createDelay = audioContext.createDelay || audioContext.createDelayNode;
		// Create the instance of MediaStreamAudioSourceNode
		var source = audioContext.createMediaStreamSource(stream);
		// Create the instance of DelayNode
		var delay = audioContext.createDelay();
		// Set parameters
		delay.delayTime.value = delayParam;  // sec
		source.connect(delay);
		var gain = audioContext.createGain();
		delay.connect(gain);
		//delay.connect(audioContext.destination);//これしちゃうとブラウザから音再生されちゃう
		var destination = audioContext.createMediaStreamDestination();
		//delay.connect(destination);
		gain.connect(destination);
		localMicStream = destination.stream;

		document.getElementById("micdelayinput").addEventListener('input', function( event ) {
			delay.delayTime.value = document.getElementById("micdelayinput").value;
			console.log("set mic delay = "+document.getElementById("micdelayinput").value +" sec");
		} ) ;

		if(!document.getElementById("mutecheckbox").checked){
			gain.gain.value=0;
		}
		document.getElementById("mutecheckbox").addEventListener('change', function( event ) {
			console.log("set mic mute = "+!document.getElementById("mutecheckbox").checked);
			if(document.getElementById("mutecheckbox").checked){
				gain.gain.value=micGain;
			} else {
				gain.gain.value=0;
			}
		} ) ;
		document.getElementById("micvolumeslider").addEventListener('input', function( event ) {
			console.log("set mic gain = "+document.getElementById("micvolumeslider").value);
			micGain = document.getElementById("micvolumeslider").value;
			gain.gain.value = micGain;
			if(document.getElementById("mutecheckbox").checked == false){
				document.getElementById("mutecheckbox").checked = true;
			}
		} ) ;
		//document.getElementById("echocancelselector").disabled = true;
	}).catch(function (err) {
		console.error('getUserMedia Err:', err);
	});
}

function standbyDevice(){
	var elements = document.getElementsByName('use-camera');
	var navVideoContainer = document.getElementById("local_cameras_onnav");
	while (navVideoContainer.lastChild) {
		navVideoContainer.removeChild(navVideoContainer.lastChild);
	}

	//使うカメラだけ残してあとは削除
	var useCameras = new Array();
	var useCameraList = [];//localStorage
	for (var i = 0; i < elements.length; i++) {
		if(!elements[i].checked){
			var srcVideo = document.getElementById("local_camera_video_"+elements[i].getAttribute("videoid"));
			if(srcVideo.srcObject != null){
				console.log("close camera : "+elements[i].getAttribute("videoid")+", "+elements[i].id);
				srcVideo.srcObject.getTracks().forEach(track => track.stop());
			}
		} else {
			useCameras.push("local_camera_view_"+elements[i].getAttribute("videoid"));
			console.log("append camera : "+elements[i].getAttribute("videoid")+", "+elements[i].id);
			elements[i].addEventListener('change', localCameraSelectEvent);
		}
	}
	for(var i = 0; i< useCameras.length; i++){
		var videoContainer = document.getElementById(useCameras[i]);

		//相手に送るか，ROSに送るかチェックボックスを追加
		var videoid = videoContainer.getAttribute("videoid");
		var checkBoxLabelObj = document.getElementById("local_camera_label_" + videoid);
		checkBoxLabelObj.innerHTML = "send to users&nbsp;";

		// 配列に追加
    useCameraList.push({
        index: i,
				label: videoContainer.getAttribute("deviceLabel"),
        videoid: videoid
    });

		var sendRosInput = document.getElementById("streaming2local");
		if(sendRosInput.checked){
			var checkBoxLabelObj = document.createElement('label');
			checkBoxLabelObj.setAttribute('id', 'local_camera_streaming_label_' + videoid);
			checkBoxLabelObj.innerHTML = 'streaming to local';
			var checkBoxObj = document.createElement('input');
			checkBoxObj.setAttribute('id', 'local_camera_streaming_checkBox_' + videoid);
			checkBoxObj.setAttribute('type', 'checkbox');
			checkBoxObj.setAttribute('name', 'use-camera');
			checkBoxObj.setAttribute('videoid', videoid);
			checkBoxObj.setAttribute('teleopetype', 'avatar');
			checkBoxObj.setAttribute('videocontainerid', "local_camera_video_"+videoid);
			checkBoxObj.checked = true;
			checkBoxObj.addEventListener('change', streamingLocalCheckBoxChanged);
			videoContainer.appendChild(checkBoxObj);
			videoContainer.appendChild(checkBoxLabelObj);
		}

		// localStorage に保存（名前とインデックスをペアで保存）
    localStorage.setItem("camera_" + i, JSON.stringify({
        index: i,
        name: useCameras[i]
    }));

		navVideoContainer.appendChild(videoContainer);//これするとelements要素が変わっちゃうっぽい
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
	var speakersettingOnNavElement = document.getElementById("speakersetting_onnav");
	speakersettingOnNavElement.appendChild(speakersettingElement);

	//getSelectedMicStream();
	getSelectedMicStream().then(() => {
		var elements = document.getElementsByName('local_camera_video');

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
			if(localMicStream != null && localMicStream.getAudioTracks().length > 0){
				elements[i].srcObject.addTrack(localMicStream.getAudioTracks()[0]);
			} else {
				console.log('local mic stream is null');
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

}
