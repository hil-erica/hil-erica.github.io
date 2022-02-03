var default_width = 1280;
var defualt_heigt = 720;
var numView = 0;

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
	//content.setAttribute('style', 'padding: 10px; margin-bottom: 10px; border: 1px solid #333333;');
	var screenObj;
	screenObj = document.createElement('video');
	screenObj.setAttribute('id', 'local_camera_video_' + deviceID);
	screenObj.setAttribute('videoid', deviceID);
	screenObj.setAttribute('name', 'local_camera_video');
	screenObj.setAttribute('class', "localvideo");
	screenObj.setAttribute('autoplay', '1');
	screenObj.setAttribute('trackid', numView-1);
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
		option.innerHTML = label + '(' + id + ')';
		speakerList.appendChild(option);
	} else {
		console.error('UNKNOWN Device kind:' + device.kind);
	}
}

function getDeviceList() {
	var micList = document.getElementById("mic_list");
	var speakerList = document.getElementById("speaker_list");
	clearDeviceList();
	
	var getDeviceButton = document.getElementById("devices_button");
	getDeviceButton.disabled=true;
	//https://stackoverflow.com/questions/60297972/navigator-mediadevices-enumeratedevices-returns-empty-labels
	(async () => {   
		//await navigator.mediaDevices.getUserMedia({audio: true, video: true});
		//let devices = await navigator.mediaDevices.enumerateDevices();   
		//console.log(devices); 
		await navigator.mediaDevices.getUserMedia({audio: true, video: true}).then(function (stream) {
			stream.getTracks().forEach((track) => {
				track.stop();
			});
		}).catch(function (err) {
			navigator.mediaDevices.getUserMedia({audio: true, video: false}).then(function (stream) {
				stream.getTracks().forEach((track) => {
					track.stop();
				});
			}).catch(function (err) {
				alert('you need mic device:'+err);
				console.err(err);
			});
		});
		
		
		await navigator.mediaDevices.enumerateDevices().then(function (devices) {
			var supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
			console.log("supported media constraints : echoCancellation = "+supportedConstraints.echoCancellation);
			console.log(supportedConstraints);
			if(supportedConstraints.echoCancellation == true){
				// <option value="none">no echo canel</option>          <option value="system">system echo canel</option>          <option value="browser">browser echo canel</option>
				var echoSelector = document.getElementById("echocancelselector");
				echoSelector.disabled = false;
				var echoOption = document.createElement('option');
				echoOption.setAttribute('value', 'none');
				echoOption.innerHTML = 'no echo canel';
				echoSelector.appendChild(echoOption);
				echoOption = document.createElement('option');
				echoOption.setAttribute('value', 'system');
				echoOption.innerHTML = 'system echo canel';
				echoSelector.appendChild(echoOption);
				echoOption = document.createElement('option');
				echoOption.setAttribute('value', 'browser');
				echoOption.innerHTML = 'browser echo canel';
				echoSelector.appendChild(echoOption);
			} else {
				var echoSelector = document.getElementById("echocancelselector");
				echoSelector.disabled = true;
			}
			(async () => {   
				for(var i = 0; i<devices.length; i++){
					console.log("call add device :"+devices[i].kind + ": " + devices[i].label + " id = " + devices[i].deviceId);
					await addDevice(devices[i]);
				}
				//option to not send audio
				var id = "don't send audio";
				var label = "don't send audio"; // label is available for https 
				var option = document.createElement('option');
				option.setAttribute('value', id);
				option.innerHTML = label + '(' + id + ')';;
				micList.appendChild(option);
				
				
				//デバイス選択イベント
				micList.addEventListener('change', micSelectEvent);
				speakerList.addEventListener('change', mainSpeakerSelectEvent);
				var echoCancelInput = document.getElementById("echocancelselector");
				echoCancelInput.addEventListener('change', micSelectEvent);
				var micTestButton = document.getElementById("mic_test");
				micTestButton.disabled = false;
				var speakerTestButton = document.getElementById("speaker_test");
				speakerTestButton.disabled = false;
				getDeviceButton.disabled = false;
				var stepButton = document.getElementById("step_button");
				stepButton.disabled = false;
			})();
			
		}).catch(function (err) {
			console.error('enumerateDevide ERROR:', err);
				
			getDeviceButton.disabled = false;
		});
	})();
	
	//https://yizm.work/sample_code/javascript/sortablejs_howto/
	var local_cameras_div = document.getElementById('local_cameras');
	var local_cameras_sortable = Sortable.create(local_cameras_div);
	
}

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

function finishTestMode(){
	if(micTestMediaRecorder != null){
		micTestMediaRecorder.stop();
	}
	if(micTestAudio != null){
		micTestAudio.pause();
		micTestAudio.currentTime = 0;
	}
	if(speakerTestAudio != null){
		speakerTestAudio.pause();
		speakerTestAudio.currentTime = 0;
	}
	var micTestButton = document.getElementById("mic_test");
	micTestButton.innerHTML = "<font size='3'>mic test(start recording)</font>";
	micTestButton.disabled = true;
	var speakerTestButton = document.getElementById("speaker_test");
	speakerTestButton.disabled = true;
}

function micTestRecord(event){
	var micList = document.getElementById("mic_list");
	if(micTestAudio != null){
		micTestAudio.pause();
		micTestAudio.currentTime = 0;
	}
	var micTestButton = document.getElementById("mic_test");
	
	if(micTestButton.innerHTML.indexOf('mic test(start recording)') >= 0){
		console.log("start mic record test");
		micTestButton.innerHTML = "<font size='3'>stop mic test and play back</font>";
		var micSelector = micList;
		var micId = micSelector.options[micSelector.selectedIndex].value;
		console.log("selected mic id = "+micId);
		
		if(micId == "don't send audio"){
			return;
		}
		var constraints = {
			audio: {
				deviceId: micId,
				sampleRate: {ideal: 48000},
				sampleSize: 16,
				echoCancellation: false,
				noiseSuppression: false,
				channelCount: {ideal: 2, min: 1}
			}
		};
		console.log('mediaDevice.getMedia() constraints:', constraints);
		navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
			
			micTestMediaRecorder = new MediaRecorder(stream, {
				mimeType: 'video/webm;codecs=vp9'
			});

			//音を拾い続けるための配列。chunkは塊という意味
			var chunks = [];

			//集音のイベントを登録する
			micTestMediaRecorder.addEventListener('dataavailable', function(ele) {
				if (ele.data.size > 0) {
					chunks.push(ele.data);
				}
			});

			// recorder.stopが実行された時のイベント
			micTestMediaRecorder.addEventListener('stop', function() {
				console.log("stop record event");
				var url = URL.createObjectURL(new Blob(chunks));
				if(isReady == false){
					micTestAudio = document.createElement('audio');
					micTestAudio.src = url;
					micTestAudio.load();
					var speakerId = getSelectedSpeaker();
					micTestAudio.setSinkId(speakerId)
						.then(function() {
						console.log('setSinkID Success, audio is being played on '+speakerId +' for mic test');
					})
					.catch(function(err) {
						console.error('setSinkId Err:', err);
					});
					micTestAudio.play();
				}
				stream.getTracks().forEach(track => track.stop());
				micTestMediaRecorder = null;
			});

			micTestMediaRecorder.start();
			console.log("start mic test recording");
		}).catch(function (err) {
			console.error('getUserMedia Err:', err);
		});
	} else {
		console.log("stop mic record test");
		micTestButton.innerHTML = "<font size='3'>mic test(start recording)</font>";
		if(micTestMediaRecorder != null){
			micTestMediaRecorder.stop();
		}
	}
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

function getSelectedSpeaker() {
	var speakerList = document.getElementById("speaker_list");
	var id = speakerList.options[speakerList.selectedIndex].value;
	console.log('selected speaker '+speakerList.selectedIndex+' '+id);
	return id;
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
	var echocancelType = "browser";
	var constraints = null;
	var echocanelValue = document.getElementById("echocancelselector").value;
	console.log("echo cancel selector value = "+echocanelValue);
	if(echocanelValue == "none"){
		constraints = {
			audio: {
				deviceId: audioId,
				sampleRate: {ideal: 48000},
				sampleSize: 16,
				echoCancellation: echocancel,
				noiseSuppression: false,
				channelCount: {ideal: 2, min: 1}
			}
		};
	} else if(echocanelValue == "system"){
		echocancel = true; 
		echocancelType = "system";
		constraints = {
			audio: {
				deviceId: audioId,
				sampleRate: {ideal: 48000},
				sampleSize: 16,
				echoCancellation: echocancel,
				echoCancellationType: echocancelType,
				noiseSuppression: false,
				channelCount: {ideal: 2, min: 1}
			}
		};
	}  else if(echocanelValue == "browser"){
		echocancel = true; 
		echocancelType = "browser";
		constraints = {
			audio: {
				deviceId: audioId,
				sampleRate: {ideal: 48000},
				sampleSize: 16,
				echoCancellation: echocancel,
				echoCancellationType: echocancelType,
				noiseSuppression: false,
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

function finishTestMode(){
	/*
	if(micTestMediaRecorder != null){
		micTestMediaRecorder.stop();
	}
	if(micTestAudio != null){
		micTestAudio.pause();
		micTestAudio.currentTime = 0;
	}
	if(speakerTestAudio != null){
		speakerTestAudio.pause();
		speakerTestAudio.currentTime = 0;
	}
	*/
	var micTestButton = document.getElementById("mic_test");
	micTestButton.innerHTML = "<font size='3'>mic test(start recording)</font>";
	micTestButton.disabled = true;
	var speakerTestButton = document.getElementById("speaker_test");
	speakerTestButton.disabled = true;
	
}

function standbyDevice(){
	var elements = document.getElementsByName('use-camera');
	var navVideoContainer = document.getElementById("local_cameras_onnav");
	while (navVideoContainer.lastChild) {
		navVideoContainer.removeChild(navVideoContainer.lastChild);
	}
	
	//使うカメラだけ残してあとは削除
	var useCameras = new Array();
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
		
		navVideoContainer.appendChild(videoContainer);//これするとelements要素が変わっちゃうっぽい
	}
	
	/*
	for (var i = 0; i < elements.length; i++) {
		if(!elements[i].checked){
			var srcVideo = document.getElementById("local_camera_video_"+elements[i].getAttribute("videoid"));
			if(srcVideo.srcObject != null){
				console.log("close camera : "+elements[i].getAttribute("videoid")+", "+elements[i].id);
				srcVideo.srcObject.getTracks().forEach(track => track.stop());
			}
		} else {
			var videoContainer = document.getElementById("local_camera_view_"+elements[i].getAttribute("videoid"));
			console.log("append camera : "+elements[i].getAttribute("videoid")+", "+elements[i].id);
			navVideoContainer.appendChild(videoContainer);//これするとelements要素が変わっちゃうっぽい
		}
	}
	*/
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
	
}