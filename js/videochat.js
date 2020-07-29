var videoContainer = document.getElementById('container');
var micList = document.getElementById("mic_list");
var speakerList = document.getElementById("speaker_list");
var myPeerID = document.getElementById("myPeerID");
var remotePeerID = document.getElementById("remotePeerID");
var stepButton = document.getElementById("step_button");
var localMicStream;
var localMixedStream;
var numView = 1;
var default_width = 320;
var defualt_heigt = 240;
var small_width = 180;
var small_height = 120;
var button_size = 16;
var thisPeer = window.thisPeer;
var MediaConnection = null;

window.onload = ()=> {
	getQueryParams();
}

//連想配列
function getQueryParams() {
	if (1 < document.location.search.length) {
		const query = document.location.search.substring(1);
		const params = query.split('&');

		const result = {};
		for(var param of params) {
			const element = param.split('=');
			const key = decodeURIComponent(element[0]);
			const value = decodeURIComponent(element[1]);
			result[key] = value;

			if(key == "myPeerID"){
				myPeerID.value = value;
			}
			if(key == "remotePeerID"){
				remotePeerID.value = value;
			}
		}
		return result;
	}
return null;
}

function addCamera(deviceID, deviceLabel) {
	var width = default_width;
	var height = defualt_heigt;
	numView++;
	var content;
	var contentID = 'local_camera_view' + deviceID;
	content = document.createElement('div');
	content.setAttribute('id', contentID);
	content.setAttribute('name', 'local_camera_view');
	content.setAttribute('class', 'item_large');
	//content.setAttribute('style', 'padding: 10px; margin-bottom: 10px; border: 1px solid #333333;');
	var screenObj;
	screenObj = document.createElement('video');
	screenObj.setAttribute('id', 'local_camera_video_' + deviceID);
	screenObj.setAttribute('name', 'local_camera_video');
	screenObj.setAttribute('width', String(width) + 'px');
	screenObj.setAttribute('height', String(height) + 'px');
	screenObj.setAttribute('autoplay', '1');
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
	checkBoxLabelObj.innerHTML = deviceLabel;
	var checkBoxObj;
	//<input type="checkbox" name="os" value="win7">Windows7
	checkBoxObj = document.createElement('input');
	checkBoxObj.setAttribute('id', 'local_camera_checkBox_' + deviceID);
	checkBoxObj.setAttribute('type', 'checkbox');
	checkBoxObj.setAttribute('name', 'use-camera');
	checkBoxObj.setAttribute('value', deviceID);
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
	startVideo(deviceID, screenObj);
	//startVideos(deviceID, screenObj, screenObj2);
}

function addView(stream, trackID) {
	var width = default_width;
	var height = defualt_heigt;
	var contentID = 'remote_camera_view_' + trackID;
	numView++;
	var content;
	content = document.createElement('div');
	content.setAttribute('id', contentID);
	content.setAttribute('class', 'grid-item');
	//content.setAttribute('style', 'padding: 10px; margin-bottom: 10px; border: 1px solid #333333;');
	var screenObj;
	screenObj = document.createElement('video');
	screenObj.setAttribute('id', 'remote_camera_video_' + trackID);
	screenObj.setAttribute('name', 'remote_camera_video');
	screenObj.setAttribute('width', String(width) + 'px');
	screenObj.setAttribute('height', String(height) + 'px');
	screenObj.setAttribute('autoplay', '1');
	//controlsを入れるとダブルクリックで最大化したりPictureInPicureモードとかできる
	//screenObj.setAttribute('controls', '1');
	screenObj.setAttribute('style', 'border: 1px solid;');
	
	if(stream.getAudioTracks().length>0){
		var speakerId = getSelectedSpeaker();
		//screenObj.volume = 0;
		screenObj.setSinkId(speakerId)
			.then(function() {
			console.log('setSinkID Success');
		})
		.catch(function(err) {
			console.error('setSinkId Err:', err);
		});
	}
	
	var sizeSelector = document.createElement('select');
	
	var sizeUpButton;
	//sizeUpButton = document.createElement('button');
	sizeUpButton = document.createElement('img');
	sizeUpButton.setAttribute('src', './pics/zoomup.png');
	sizeUpButton.width = button_size;
	sizeUpButton.height = button_size;
	//<img src="sample.png" class="button" onclick="goClick()" width="150" height="217" alt="サンプルボタン">
	sizeUpButton.setAttribute('id', 'remote_camera_sizeup_' + trackID);
	sizeUpButton.setAttribute('name', 'remote_camera_sizeup');
	sizeUpButton.setAttribute('onclick', 'videoSizeScaling(remote_camera_video_' + trackID+', 1.2)');
	sizeUpButton.innerHTML = "+";
	
	var sizeDownButton;
	//sizeDownButton = document.createElement('button');
	sizeDownButton = document.createElement('img');
	sizeDownButton.setAttribute('src', './pics/zoomout.png');
	sizeDownButton.width = button_size;
	sizeDownButton.height = button_size;
	sizeDownButton.setAttribute('id', 'remote_camera_sizedown_' + trackID);
	sizeDownButton.setAttribute('name', 'remote_camera_sizedown');
	sizeDownButton.setAttribute('onclick', 'videoSizeScaling(remote_camera_video_' + trackID+', 0.8)');
	sizeDownButton.innerHTML = "-";
	
	content.appendChild(screenObj);
	content.appendChild(document.createElement('br'));
	content.appendChild(sizeUpButton);
	content.appendChild(sizeDownButton);
	//content.appendChild(screenObj2);
	
	//make jQuery object
	var $content = $( content );
	$grid.append( $content ).masonry( 'appended', $content ).masonry();
	
	const remote_cameras = document.getElementById("remote_cameras");
	//remote_cameras.appendChild(content);
	
	screenObj.srcObject = stream;
	screenObj.playsInline = true;
	//await screenObj.play().catch(console.error);
	return screenObj;
}

var $grid = $('.grid').masonry({
  columnWidth: 340,
  itemSelector: '.grid-item'
});

function videoSizeScaling(videoID, scale){
	console.log(videoID);
	var width = videoID.width;
	var height = videoID.height;
	videoID.width = scale*width;
	videoID.height = scale*height;
}

function clearView() {
	const local_cameras = document.getElementById("local_cameras");
	var contentID = button.getAttribute("contentID");
	//console.log(contentID);
	var removeObj = document.getElementById(contentID);
}

function clearDeviceList() {
	while (micList.lastChild) {
		micList.removeChild(micList.lastChild);
	}
	while (speakerList.lastChild) {
		speakerList.removeChild(speakerList.lastChild);
	}
}

function addDevice(device) {
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
		addCamera(id, label);
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
	clearDeviceList();
	navigator.mediaDevices.enumerateDevices().then(function (devices) {
		devices.forEach(function (device) {
			console.log(device.kind + ": " + device.label + " id = " + device.deviceId);
			addDevice(device);
		});
		stepButton.disabled = false;
	}).catch(function (err) {
		console.error('enumerateDevide ERROR:', err);
	});
}

//こんな感じで映像のトラック数と音のトラック数がわかる，相手から複数映像トラックがある場合は分割しよう
function logStream(msg, stream) {
	console.log(msg + ': id=' + stream.id);
	var videoTracks = stream.getVideoTracks();
	if (videoTracks) {
		console.log('videoTracks.length=' + videoTracks.length);
		for (var i = 0; i < videoTracks.length; i++) {
			var track = videoTracks[i];
			console.log(' track.id=' + track.id);
		}
	}
	var audioTracks = stream.getAudioTracks();
	if (audioTracks) {
		console.log('audioTracks.length=' + audioTracks.length);
		for (var i = 0; i < audioTracks.length; i++) {
			var track = audioTracks[i];
			console.log(' track.id=' + track.id);
		}
	}
}

function startVideo(cameraID, video) {
	//var audioId = getSelectedAudio();
	var deviceId = cameraID;
	console.log('selected video device id=' + deviceId);
	var constraints = {
		video: {
			deviceId: deviceId
		}
	};
	console.log('mediaDevice.getMedia() constraints:', constraints);
	navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
		logStream('selectedVideo', stream);
		video.srcObject = stream;
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

//一つのカメラソースを複数に表示することができることは確認できた
function startVideos(cameraID, video, video2) {
	//var audioId = getSelectedAudio();
	var deviceId = cameraID;
	console.log('selected video device id=' + deviceId);
	var constraints = {
		video: {
			deviceId: deviceId
		}
	};
	console.log('mediaDevice.getMedia() constraints:', constraints);
	navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
		//streamList.push(stream);
		video.srcObject = stream;
		video2.srcObject = stream;
		//videoList.push(video);
	}).catch(function (err) {
		console.error('getUserMedia Err:', err);
		var checkBoxObj = document.getElementById('local_camera_checkBox_' + cameraID);
		if(checkBoxObj != null){
			checkBoxObj.checked = false;
		}
	});
}

function gotoStanby() {
	thisPeer = (window.peer = new Peer(myPeerID.value,{
		key: window.__SKYWAY_KEY__,
		debug: 3,
	}));
	
	thisPeer.on('error', console.error);
	thisPeer.once('open', id => {
		let peers = thisPeer.listAllPeers(peers => {
			console.log(peers);
		});
		
		var width = small_width;
		var height = small_height;
		
		//使うカメラだけ残してあとは削除，画面も小さくす
		var elements = document.getElementsByName('local_camera_view');
		//取得した一覧から全てのvalue値を表示する
		var removeCameraIDs = [];
		for (var i = 0; i < elements.length; i++) {
			for(var j = 0; j < elements[i].children.length; j++){
				if(elements[i].children[j].getAttribute("name") == "use-camera"){
					if(!elements[i].children[j].checked){
						removeCameraIDs.push(elements[i].getAttribute("id"));
						break;
					}
				}
			}
			/*
			var useCheckBox = elements[i].querySelector('checkbox[name="use-camera"]');
			if(!useCheckBox.checked){
				removeCameraIDs.push(element[i].getAttribute("id"));
			}
			*/
		}
		removeCameraIDs.forEach(function(value){
			var removeItem = document.getElementById(value);
			if(removeItem != null){
				removeItem.parentNode.removeChild(removeItem);
			}
		});
		
		var elements = document.getElementsByName('local_camera_video');
		//取得した一覧から全てのvalue値を表示する
		for (var i = 0; i < elements.length; i++) {
			//elements[i].setAttribute('width', String(width)+'px');
			//elements[i].setAttribute('height', String(height)+'px');
			elements[i].width = width;
			elements[i].height = height;
		}
		elements = document.getElementsByName('local_camera_view');
		//取得した一覧から全てのvalue値を表示する
		for (var i = 0; i < elements.length; i++) {
			elements[i].setAttribute('class', 'item_small');
		}
		stepButton.setAttribute('onclick', 'callRemote()');
		stepButton.innerHTML = "<font size='3'>call</font>";
		
		
		//mic
		getSelectedMicStream();
		
		//かかってきたイベント
		// Register callee handler
		thisPeer.on('call', mediaConnection => {
			MediaConnection = mediaConnection;
			makeLocalStream();
			console.log('local stream videtrack = '+localMixedStream.getVideoTracks().length+', audiotrack = '+localMixedStream.getAudioTracks().length);
			mediaConnection.answer(localMixedStream);
			mediaConnection.on('stream', async stream => {
				/*
				// Render remote stream for callee
				remoteVideo.srcObject = stream;
				remoteVideo.playsInline = true;
				await remoteVideo.play().catch(console.error);
				*/
				openConnection(stream);
				//await stream.paly().catch(console.error);
			});
			//切れた
			mediaConnection.once('close', () => {
				closedConnection();
				//remoteVideo.srcObject.getTracks().forEach(track => track.stop());
				//remoteVideo.srcObject = null;
				stepButton.setAttribute('onclick', 'callRemote()');
				stepButton.innerHTML = "<font size='3'>call</font>";
			});
		});
	});
}

function callRemote() {
	// Note that you need to ensure the peer has connected to signaling server
	// before using methods of peer instance.
	if (!thisPeer.open) {
		return;
	}
	makeLocalStream();
	console.log('local stream videtrack = '+localMixedStream.getVideoTracks().length+', audiotrack = '+localMixedStream.getAudioTracks().length);
	MediaConnection = thisPeer.call(remotePeerID.value, localMixedStream);
	
	MediaConnection.on('stream', async stream => {
		/*
		// Render remote stream for caller
		remoteVideo.srcObject = stream;
		remoteVideo.playsInline = true;
		await remoteVideo.play().catch(console.error);
		*/
		openConnection(stream);
		//await stream.paly().catch(console.error);
	});
	//切れた
	MediaConnection.once('close', () => {
		closedConnection();
		/*
		remoteVideo.srcObject.getTracks().forEach(track => track.stop());
		remoteVideo.srcObject = null;
		*/
		stepButton.setAttribute('onclick', 'callRemote()');
		stepButton.innerHTML = "<font size='3'>call</font>";
	});
}

//自分で切ったイベント
function closeRemote(){
	//自分で切った
	MediaConnection.close(true);
	//stepButton.setAttribute('onclick', 'callRemote()');
	//stepButton.innerHTML = "call";
}

function openConnection(stream){
	console.log('remote stream videtrack = '+stream.getVideoTracks().length+', audiotrack = '+stream.getAudioTracks().length);
	for(var i = 0; i<stream.getVideoTracks().length; i++){
		var _remoteVideo = new webkitMediaStream();
		_remoteVideo.addTrack(stream.getVideoTracks()[i]);
		if(stream.getAudioTracks().length > i){
			_remoteVideo.addTrack(stream.getAudioTracks()[i]);
		}
		addView(_remoteVideo, i);
	}
	//ボタンをcloseにする
	stepButton.setAttribute('onclick', 'closeRemote()');
	stepButton.innerHTML = "<font size='3'>close</font>";
	
}

function closedConnection(){
	var elements = document.getElementsByName('remote_camera_video');
	//取得した一覧から全てのvalue値を表示する
	for (var i = 0; i < elements.length; i++) {
		elements[i].srcObject.getTracks().forEach(track => track.stop());
		elements[i].srcObject = null;
	}
	const remote_cameras = document.getElementById("remote_cameras");
	while (remote_cameras.lastChild) {
		remote_cameras.removeChild(remote_cameras.lastChild);
	}
	
	//クエリを編集
	//window.location.search = "myPeerID="+myPeerID.value+"&remotePeerID="+remotePeerID.value ;
}

function getSelectedMicStream(){
	var audioId = getSelectedAudio();
	var constraints = {
		audio: {
			deviceId: audioId
		}
	};
	console.log('mediaDevice.getMedia() constraints:', constraints);
	navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
		localMicStream = stream;
	}).catch(function (err) {
		console.error('getUserMedia Err:', err);
	});
}

function makeLocalStream(){
	localMixedStream = new webkitMediaStream();
	//取得した一覧から全てのvalue値を表示する
	localMixedStream.addTrack(localMicStream.getAudioTracks()[0]);
	var elements = document.getElementsByName('local_camera_video');
	for (var i = 0; i < elements.length; i++) {
		//elements[i].srcObject.getTracks().forEach(track => track.stop());
		//elements[i].srcObject = null;
		localMixedStream.addTrack(elements[i].srcObject.getVideoTracks()[0]);
	}
}


function getSelectedAudio() {
	var id = micList.options[micList.selectedIndex].value;
	return id;
}

function getSelectedSpeaker() {
	var id = speakerList.options[speakerList.selectedIndex].value;
	return id;
}