var micList = document.getElementById("mic_list");
var speakerList = document.getElementById("speaker_list");
var myPeerID = document.getElementById("myPeerID");
var remotePeers = document.getElementById("remotePeers");
//var remotePeerID = document.getElementById("remotePeerID");
var remotePeerIDs = [];
var remotePeerIDMediaConMap = new Map();
var accessibleList = document.getElementById("accessible_list");
var getDeviceButton = document.getElementById("devices_button");
var tabCommunication = document.getElementById("TAB-Communication");
var stepButton = document.getElementById("step_button");
var localMicStream;
var localMixedStream;
var numView = 1;
var viewersize = 'QVGA';
var default_width = 320;
var defualt_heigt = 240;
var small_width = 180;
var small_height = 120;
var button_size = 16;
var thisPeer = window.thisPeer;
var checkMemberTimerId;
var remotePeerCounter = 0;
var isReady = false;

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
				var remotePeerIDValue = value;
				remotePeerIDs = remotePeerIDValue.split(";");
				openStream = true;
				for(var i = 0; i < remotePeerIDs.length; i++){
					if(remotePeerIDs[i] == "" || remotePeerIDs[i] == " ")continue;
					addRemotePeerId(remotePeerIDs[i]);
				}
			}
			if(key == "viewersize"){
				if(value == 'QVGA' || value == 'VGA' || value == 'HD' || value == 'FullHD'){
					viewersize = value;
				}else{
					console.error("wrong viewersize = "+value);
				}
			}
		}
		return result;
	}
	return null;
}



function addRemotePeerId(remotePeer){
	var elements = document.getElementsByName('remotePeer_id');
	for (var i = 0; i < elements.length; i++) {
		if(elements[i].value == remotePeer){
			return elements[i].getAttribute('thisPeerCounterNumer');
		}
	}
	remotePeerCounter++;
	var thisPeerCounterNumer = remotePeerCounter;
	var contentID = 'remotePeer_content_' + remotePeerCounter;
	content = document.createElement('div');
	content.setAttribute('id', contentID);
	content.setAttribute('name', 'remotePeer_content');
	content.setAttribute('thisPeerCounterNumer', thisPeerCounterNumer);
	//content.setAttribute('class', 'item_large');
	
	var peerIDText = document.createElement('input');
	peerIDText.setAttribute('id', 'remotePeer_id_'+thisPeerCounterNumer);
	peerIDText.setAttribute('name', 'remotePeer_id');
	peerIDText.setAttribute('type', 'text');
	peerIDText.setAttribute('size', '10');
	peerIDText.setAttribute('maxlength', '20');
	peerIDText.setAttribute('value', remotePeer);
	peerIDText.setAttribute('thisPeerCounterNumer', thisPeerCounterNumer);
	
	var commuButton = document.createElement('button');
	commuButton.setAttribute('id', 'remotePeer_commuButton_'+thisPeerCounterNumer);
	commuButton.setAttribute('name', 'remotePeer_commuButton');
	commuButton.setAttribute('style', 'width:50pt;');
	commuButton.setAttribute('thisPeerCounterNumer', thisPeerCounterNumer);
	if(!isReady){
		commuButton.setAttribute('disabled', true);
	}
	commuButton.setAttribute('onclick', 'commuButtonClicked('+thisPeerCounterNumer+')');
	commuButton.innerHTML = "<font size='2'>call</font>";
	
	var removeButton = document.createElement('button');
	removeButton.setAttribute('id', 'remotePeer_removeButton_'+thisPeerCounterNumer);
	removeButton.setAttribute('name', 'remotePeer_removeButton');
	removeButton.setAttribute('style', 'width:50pt;');
	removeButton.setAttribute('onclick', 'removePeer('+thisPeerCounterNumer+')');
	removeButton.innerHTML = "<font size='2'>remove</font>";
	
	content.appendChild(peerIDText);
	content.appendChild(commuButton);
	content.appendChild(removeButton);
	remotePeers.appendChild(content);
	
	return thisPeerCounterNumer;
}

function getThisPeerCounterNumer(remotePeer){
	var elements = document.getElementsByName('remotePeer_id');
	for (var i = 0; i < elements.length; i++) {
		if(elements[i].value == remotePeer){
			return elements[i].getAttribute('thisPeerCounterNumer');
		}
	}
	return -1;
}

function updatePeerUI(thisPeerCounterNumer, enable){
	console.log(thisPeerCounterNumer +' to ' + enable);
	var commuButton = document.getElementById('remotePeer_commuButton_'+thisPeerCounterNumer);
	var peerIDText = document.getElementById('remotePeer_id_'+thisPeerCounterNumer);
	if(enable){
		commuButton.innerHTML = "<font size='2'>call</font>";
		peerIDText.disabled= false;
	} else {
		commuButton.innerHTML = "<font size='2'>close</font>";
		peerIDText.disabled= true;
	}
}

function removePeer(thisPeerCounterNumer){
	var contentID = 'remotePeer_content_' + thisPeerCounterNumer;
	console.log("remove "+contentID);
	var removeItem = document.getElementById(contentID);
	if(removeItem != null){
		removeItem.parentNode.removeChild(removeItem);
	}
}

function commuButtonClicked(thisPeerCounterNumer){
	var commuButtonID = document.getElementById('remotePeer_commuButton_'+thisPeerCounterNumer);
	var peerTextID = document.getElementById('remotePeer_id_'+thisPeerCounterNumer);
	var peerID = peerTextID.value;
	if(commuButtonID.innerHTML.indexOf('call') >= 0){
		callRemoteOne(peerID);
	}else {
		closeRemote(peerID);
	}
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

function addView(stream, remoterPeerID, trackID) {
	var width = default_width;
	var height = defualt_heigt;
	var contentID = 'remote_camera_view_'+remoterPeerID+'_' + trackID;
	numView++;
	var content;
	content = document.createElement('div');
	content.setAttribute('id', contentID);
	content.setAttribute('name', 'remote_camera_view_'+remoterPeerID);
	
	//content.setAttribute('style', 'padding: 10px; margin-bottom: 10px; border: 1px solid #333333;');
	var screenObj;
	screenObj = document.createElement('video');
	screenObj.setAttribute('id', 'remote_camera_video_' +remoterPeerID+'_'+ trackID);
	screenObj.setAttribute('name', 'remote_camera_video_'+remoterPeerID);
	//screenObj.setAttribute('width', String(width) + 'px');
	//screenObj.setAttribute('height', String(height) + 'px');
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
	sizeSelector.setAttribute('id', 'remote_camera_sizeselector_' +remoterPeerID+'_'+ trackID);
	sizeSelector.setAttribute('size', '1');
	sizeSelector.setAttribute('style', 'width:100pt;');
	var option = document.createElement('option');
	option.setAttribute('value', 'QVGA');
	option.innerHTML = 'QVGA(320x240px)';
	sizeSelector.appendChild(option);
	option = document.createElement('option');
	option.setAttribute('value', 'VGA');
	option.innerHTML = 'VGA(640x480px)';
	sizeSelector.appendChild(option);
	option = document.createElement('option');
	option.setAttribute('value', 'HD');
	option.innerHTML = 'HD(1280x720px)';
	sizeSelector.appendChild(option);
	option = document.createElement('option');
	option.setAttribute('value', 'FullHD');
	option.innerHTML = 'FullHD(1920x1080px)';
	sizeSelector.appendChild(option);
	
	content.appendChild(sizeSelector);
	content.appendChild(screenObj);
	
	sizeSelector.addEventListener('change', (event) => {
		var changedValue = event.target.value;
		if(changedValue == 'QVGA'){
			screenObj.width = 320;
			screenObj.height = 240;
			content.setAttribute('class', 'viwer_grid-item viwer_grid-item--QVGA');
		} else if(changedValue == 'VGA'){
			screenObj.width = 640;
			screenObj.height = 480;
			content.setAttribute('class', 'viwer_grid-item viwer_grid-item--VGA');
		} else if(changedValue == 'HD'){
			screenObj.width = 1280;
			screenObj.height = 720;
			content.setAttribute('class', 'viwer_grid-item viwer_grid-item--HD');
		} else if(changedValue == 'FullHD'){
			screenObj.width = 1920;
			screenObj.height = 1080;
			content.setAttribute('class', 'viwer_grid-item viwer_grid-item--FullHD');
		}
		$grid.masonry();
		//console.log(`You like ${event.target.value}`);
	});
	
	if(viewersize == 'QVGA'){
		screenObj.width = 320;
		screenObj.height = 240;
		sizeSelector.value = 'QVGA';
		content.setAttribute('class', 'viwer_grid-item viwer_grid-item--QVGA');
	} else if(viewersize == 'VGA'){
		screenObj.width = 640;
		screenObj.height = 480;
		sizeSelector.value = 'VGA';
		content.setAttribute('class', 'viwer_grid-item viwer_grid-item--VGA');
	} else if(viewersize == 'HD'){
		screenObj.width = 1280;
		screenObj.height = 720;
		sizeSelector.value = 'HD';
		content.setAttribute('class', 'viwer_grid-item viwer_grid-item--HD');
	} else if(viewersize == 'FullHD'){
		screenObj.width = 1920;
		screenObj.height = 1080;
		sizeSelector.value = 'FullHD';
		content.setAttribute('class', 'viwer_grid-item viwer_grid-item--FullHD');
	}
	
	//make jQuery object
	var $content = $( content );
	$grid.append( $content ).masonry( 'appended', $content ).masonry();
	const remote_cameras = document.getElementById("remote_cameras");
	//remote_cameras.appendChild(content);
	$grid.masonry();
	screenObj.srcObject = stream;
	screenObj.playsInline = true;
	//await screenObj.play().catch(console.error);
	return screenObj;
}

var $grid = $('.viwer_grid').masonry({
  //columnWidth: 340,
});

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
	var local_cameras = document.getElementById("local_cameras");
	while (local_cameras.lastChild) {
		local_cameras.removeChild(local_cameras.lastChild);
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
		//tabCommunication.setAttribute("disable",false);
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

function gotoStanby() {
	thisPeer = (window.peer = new Peer(myPeerID.value,{
		key: window.__SKYWAY_KEY__,
		debug: 3,
	}));
	
	thisPeer.on('error', console.error);
	
	getDeviceButton.setAttribute("disabled","true");
	micList.setAttribute("disabled","true");
	speakerList.setAttribute("disabled","true");
	myPeerID.setAttribute("disabled","true");
	isReady = true;
	var elements = document.getElementsByName('remotePeer_commuButton');
	for (var i = 0; i < elements.length; i++) {
		elements[i].disabled = false;
	}
	/*
	for(var[key, value] of remotePeerIDMediaConMap){
		
	}
	if(remotePeerIDMediaConMap.has("")),get ,set
	*/
	remotePeerIDMediaConMap.clear();
	thisPeer.once('open', id => {
		let peers = thisPeer.listAllPeers(peers => {
			accessibleList.value = "";
			for(var i = 0; i< peers.length; i++){
				accessibleList.value += peers[i]+";";
			}
			console.log(peers);
		});
		
		//https://techacademy.jp/magazine/5537
		var checkAccessibleMember = function(){
			thisPeer.listAllPeers(peers => {
				accessibleList.value = "";
				for(var i = 0; i< peers.length; i++){
					accessibleList.value += peers[i]+";";
				}
				//console.log(peers);
			});
		}
		checkMemberTimerId = setInterval(checkAccessibleMember, 5000);
		
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
		
		//stepButton.setAttribute('onclick', 'callRemote()');
		stepButton.setAttribute('disabled', 'true');
		stepButton.innerHTML = "<font size='3'>connected</font>";
		
		
		//mic
		getSelectedMicStream();
		
		//かかってきたイベント
		// Register callee handler
		thisPeer.on('call', mediaConnection => {
			if(localMixedStream == null){
				makeLocalStream();
			}
			console.log('local stream videtrack = '+localMixedStream.getVideoTracks().length+', audiotrack = '+localMixedStream.getAudioTracks().length);
			mediaConnection.answer(localMixedStream);
			var thisPeerCounterNumer = addRemotePeerId(mediaConnection.remoteId);
			updatePeerUI(thisPeerCounterNumer, false);
			mediaConnection.on('stream', async stream => {
				/*
				// Render remote stream for callee
				remoteVideo.srcObject = stream;
				remoteVideo.playsInline = true;
				await remoteVideo.play().catch(console.error);
				*/
				openConnection(stream, mediaConnection.remoteId, mediaConnection);
				//await stream.paly().catch(console.error);
			});
			//切れた
			mediaConnection.once('close', () => {
				closedConnection(mediaConnection.remoteId);
				var thisPeerCounterNumer = getThisPeerCounterNumer(mediaConnection.remoteId);
				updatePeerUI(thisPeerCounterNumer, true);
				//remoteVideo.srcObject.getTracks().forEach(track => track.stop());
				//remoteVideo.srcObject = null;
				stepButton.setAttribute('onclick', 'callRemote()');
				stepButton.innerHTML = "<font size='3'>call</font>";
			});
		});
	});
}

function callRemoteOne(remotePeerID) {
	// Note that you need to ensure the peer has connected to signaling server
	// before using methods of peer instance.
	if (!thisPeer.open) {
		return false;
	}
	if(localMixedStream == null){
		makeLocalStream();
	}
	
	console.log('local stream videtrack = '+localMixedStream.getVideoTracks().length+', audiotrack = '+localMixedStream.getAudioTracks().length);
	if(remotePeerID == "" || remotePeerID == " ")return false;
	if(remotePeerIDMediaConMap.has(remotePeerID))return true;
	console.log("remotePeerID = "+ remotePeerID);
	//var mediaConnection = thisPeer.call(remotePeerIDs[i], localMixedStream);
	var mediaConnection = thisPeer.call(remotePeerID, localMixedStream);
	console.log("connected = "+mediaConnection.remoteId +", "+ mediaConnection.id);
	var thisPeerCounterNumer = getThisPeerCounterNumer(mediaConnection.remoteId);
	//updatePeerUI(thisPeerCounterNumer, false);
	mediaConnection.on('stream', async stream => {
		var thisPeerCounterNumer = getThisPeerCounterNumer(mediaConnection.remoteId);
		updatePeerUI(thisPeerCounterNumer, false);
		console.log("get stream = "+mediaConnection.remoteId +" "+mediaConnection.id);
		openStream = true;
		//このときのremoteIdがもし複数連続でやったらあとのpeerIdになってしまう
		openConnection(stream, mediaConnection.remoteId, mediaConnection);
		//await stream.paly().catch(console.error);
	});
	//切れた
	mediaConnection.once('close', () => {
		//このときのremoteIdがもし複数連続でやったらあとのpeerIdになってしまう
		var thisPeerCounterNumer = getThisPeerCounterNumer(mediaConnection.remoteId);
		updatePeerUI(thisPeerCounterNumer, true);
		console.log("close = "+mediaConnection.remoteId +" "+mediaConnection.id);
		closedConnection(mediaConnection.remoteId);
		//stepButton.setAttribute('onclick', 'callRemote()');
		//stepButton.innerHTML = "<font size='3'>call</font>";
	});
	return true;
}

//自分で切ったイベント
function closeRemote(peerID){
	//自分で切った
	//mediaConnection.close(true);
	//stepButton.setAttribute('onclick', 'callRemote()');
	//stepButton.innerHTML = "call";
	for(var[key, value] of remotePeerIDMediaConMap){
		if(key == peerID){
			value.close(true);
		}
	}
}

function openConnection(stream, remotePeerID, mediaConnection){
	console.log(remotePeerID+ '('+mediaConnection.remoteId+') => remote stream videtrack = '+stream.getVideoTracks().length+', audiotrack = '+stream.getAudioTracks().length);
	remotePeerIDMediaConMap.set(remotePeerID, mediaConnection);
	for(var i = 0; i<stream.getVideoTracks().length; i++){
		var _remoteVideo = new webkitMediaStream();
		_remoteVideo.addTrack(stream.getVideoTracks()[i]);
		if(stream.getAudioTracks().length > i){
			_remoteVideo.addTrack(stream.getAudioTracks()[i]);
		}
		addView(_remoteVideo, remotePeerID,i);
	}
}

function closedConnection(remotePeerID){
	var elements = document.getElementsByName('remote_camera_video_'+remotePeerID);
	//取得した一覧から全てのvalue値を表示する
	for (var i = 0; i < elements.length; i++) {
		elements[i].srcObject.getTracks().forEach(track => track.stop());
		elements[i].srcObject = null;
	}
	const remote_cameras = document.getElementById("remote_cameras");
	/*
	while(true){
		elements = document.getElementsByName("remote_camera_view_"+remotePeerID);
		console.log("remove target size = " +elements.length + ", named = remote_camera_view_"+remotePeerID);
		if(elements.length == 0){
			break;
		} else {
			//remote_cameras.removeChild(elements[0]);
			var $content = $( elements[0] );
			$grid.remove( $content ).masonry();
		}
	}
	*/
	elements = document.getElementsByName("remote_camera_view_"+remotePeerID);
	for (var i = 0; i < elements.length; i++) {
		//remote_cameras.removeChild(elements[i]);
		var $content = $( elements[i] );
		$grid.masonry( 'remove', $content );
		console.log("remove "+elements[i].getAttribute("id")+ ", " +elements.length);//removeChildでelement.lengthが減る
	}
	$grid.masonry();
	remotePeerIDMediaConMap.delete(remotePeerID);
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
