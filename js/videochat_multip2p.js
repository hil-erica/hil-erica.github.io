var micList = document.getElementById("mic_list");
var speakerList = document.getElementById("speaker_list");
var myPeerID = document.getElementById("myPeerID");
var remotePeers = document.getElementById("remotePeers");
//var remotePeerID = document.getElementById("remotePeerID");
var remotePeerIDs = [];
var remotePeerIDMediaConMap = new Map();
var remotePeerIDDataConMap = new Map();
var accessibleList = document.getElementById("accessible_list");
var accessibleMembers = [];
var getDeviceButton = document.getElementById("devices_button");
var tabCommunication = document.getElementById("TAB-Communication");
var stepButton = document.getElementById("step_button");
var recordButton = document.getElementById("recorder_button");
var localMicStream;
var localMixedStream;
var numView = 1;
var viewersize = '360';
var captureSize = "none";
var default_width = 320;
var defualt_heigt = 240;
var small_width = 180;
var small_height = 120;
var button_size = 16;
var thisPeer = window.thisPeer;
var checkMemberTimerId;
var remotePeerCounter = 0;
var isReady = false;
var skywaykey = null;

var isRecording = false;
let recorder =  [];
let blobUrl = null;
let chunks = [];
let fileNames = [];
var recorderMap = new Map();
const anchor = document.getElementById('downloadlink');

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
				for(var i = 0; i < remotePeerIDs.length; i++){
					if(remotePeerIDs[i] == "" || remotePeerIDs[i] == " ")continue;
					addRemotePeerId(remotePeerIDs[i]);
				}
			}
			if(key == "viewersize"){
				if(value == '144' || value == '240' || value == '360' || value == '720' || value == '1080'){
					viewersize = value;
				}else{
					console.error("wrong viewersize = "+value);
				}
			}
			if(key == "capturesize"){
				if(value == '720' || value == '1080'){
					captureSize = value;
				}
			}
			if(key == "skywaykey"){
				if(value != ""){
					skywaykey = value;
				} else {
					inputKeyDialogue();
				}
			}
		}
		return result;
	}
	if(skywaykey == null || value == ""){
		inputKeyDialogue();
	}
	return null;
}

function inputKeyDialogue(){
	while(true){
		// 入力ダイアログを表示 ＋ 入力内容を user に代入
		skywaykey = window.prompt("SkyWayのKeyを入力してください", "");
		if(skywaykey != "" && skywaykey != null){
			break;
		}
		// 空の場合やキャンセルした場合は警告ダイアログを表示
		else{
			window.alert('キャンセルされました');
		}
	}
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

var clicked = false;    // クリック状態を保持するフラグ
//var drawClerTimer;
function addView(stream, remoterPeerID, trackID) {
var drawClerTimer;
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
	screenObj.setAttribute('remotePeerId', remoterPeerID);
	screenObj.setAttribute('trackID', trackID);
	//screenObj.setAttribute('width', String(width) + 'px');
	//screenObj.setAttribute('height', String(height) + 'px');
	screenObj.setAttribute('autoplay', '1');
	
	var canvasObj;
	canvasObj = document.createElement('canvas');
	canvasObj.setAttribute('class', 'canvas');
	canvasObj.setAttribute('id', 'remote_camera_canvas_' +remoterPeerID+'_'+ trackID);
	canvasObj.setAttribute('name', 'remote_camera_canvas_'+remoterPeerID);
	canvasObj.setAttribute('remotePeerId', remoterPeerID);
	canvasObj.setAttribute('trackID', trackID);
	
	
	//https://qiita.com/sashim1343/items/e3728bea913cadab677d
	canvasObj.addEventListener( "click", function( event ) {
		var clickX = event.pageX ;
		var clickY = event.pageY ;

		// 要素の位置を取得
		var clientRect = this.getBoundingClientRect() ;
		var positionX = clientRect.left + window.pageXOffset ;
		var positionY = clientRect.top + window.pageYOffset ;

		// 要素内におけるクリック位置を計算
		var x = clickX - positionX ;
		var y = clickY - positionY ;
		var xRatio = x/canvasObj.width;
		var yRatio = y/canvasObj.height;
		var dblClickDuration = 300;//msec
		var drawMarkDuration = 1000;//msec
		
		if (clicked) {
			clicked = false;
			var eventName = "dblclickevent";			
			var sendText = "{\"peerid\": \""+myPeerID.value+"\", \""+eventName+"\": {\"remotepeerid\":\""+canvasObj.getAttribute('remotePeerId')+"\", \"trackid\":"+canvasObj.getAttribute('trackID')+",\"x\":"+x+", \"y\": "+y+",\"xratio\":"+xRatio+", \"yratio\": "+yRatio+"}}";
			console.log("clicked event "+sendText);
			publishData(sendText);

			//canvasに描画
			var context = canvasObj.getContext( "2d" ) ;
			context.clearRect(0, 0, canvasObj.width, canvasObj.height);
			context.beginPath () ;
			context.arc( x, y, 20, 0 * Math.PI / 180, 360 * Math.PI / 180, false ) ;
			context.strokeStyle = "red" ;
			context.lineWidth = 1 ;
			context.stroke() ;
			//return;
		} else {
			clicked = true;
			setTimeout(function () {
				// ダブルクリックによりclickedフラグがリセットされていない
				//     -> シングルクリックだった
				if (clicked) {
					//canvasに描画
					var context = canvasObj.getContext( "2d" ) ;
					context.clearRect(0, 0, canvasObj.width, canvasObj.height);
					context.beginPath () ;
					context.arc( x, y, 20, 0 * Math.PI / 180, 360 * Math.PI / 180, false ) ;
					context.strokeStyle = "blue" ;
					context.lineWidth = 1 ;
					context.stroke() ;
					
					var eventName = "clickevent";			
					var sendText = "{\"peerid\": \""+myPeerID.value+"\", \""+eventName+"\": {\"remotepeerid\":\""+canvasObj.getAttribute('remotePeerId')+"\", \"trackid\":"+canvasObj.getAttribute('trackID')+", \"x\":"+x+", \"y\": "+y+",\"xratio\":"+xRatio+", \"yratio\": "+yRatio+"}}";
					console.log("clicked event "+sendText);
					publishData(sendText);
				}
				clicked = false;
				
			}, dblClickDuration);
		}
		
		if(drawClerTimer != null){
			clearTimeout(drawClerTimer);
		}
		drawClerTimer = setTimeout(function () {
			//canvasに描画
			var context = canvasObj.getContext( "2d" ) ;
			context.clearRect(0, 0, canvasObj.width, canvasObj.height);
		}, drawMarkDuration);
	} ) ;
	
	/*どうやら働かないです
	screenObj.addEventListener( "dblclick ", function( event ) {
		var clickX = event.pageX ;
		var clickY = event.pageY ;

		// 要素の位置を取得
		var clientRect = this.getBoundingClientRect() ;
		var positionX = clientRect.left + window.pageXOffset ;
		var positionY = clientRect.top + window.pageYOffset ;

		// 要素内におけるクリック位置を計算
		var x = clickX - positionX ;
		var y = clickY - positionY ;
		var xRatio = x/screenObj.width;
		var yRatio = y/screenObj.height;
		var sendText = "{\"peerid\": \""+myPeerID.value+"\", \"dblclickevent\": {\"objectname\":\""+screenObj.getAttribute('id')+"\", \"x\":"+x+", \"y\": "+y+",\"xRatio\":"+xRatio+", \"yRatio\": "+yRatio+"}}";
		
		console.log("clicked event "+sendText);
		for(var[key, value] of remotePeerIDDataConMap){
			value.send(sendText);
		}
	} ) ;
	*/
	
	//controlsを入れるとダブルクリックで最大化したりPictureInPicureモードとかできる
	//screenObj.setAttribute('controls', '1');
	//screenObj.setAttribute('style', 'border: 1px solid;');
	
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
	option.setAttribute('value', '144');
	option.innerHTML = '256x144px';
	sizeSelector.appendChild(option);
	option = document.createElement('option');
	option.setAttribute('value', '240');
	option.innerHTML = '427x240px';
	sizeSelector.appendChild(option);
	option = document.createElement('option');
	option.setAttribute('value', '360');
	option.innerHTML = '640x360px';
	sizeSelector.appendChild(option);
	/*
	option = document.createElement('option');
	option.setAttribute('value', '480');
	option.innerHTML = '720x480px';
	sizeSelector.appendChild(option);
	*/
	option = document.createElement('option');
	option.setAttribute('value', '720');
	option.innerHTML = '1280x720px';
	sizeSelector.appendChild(option);
	option = document.createElement('option');
	option.setAttribute('value', '1080');
	option.innerHTML = '1920x1080px';
	sizeSelector.appendChild(option);
	
	content.appendChild(sizeSelector);
	content.appendChild(screenObj);
	content.appendChild(canvasObj);
	
	sizeSelector.addEventListener('change', (event) => {
		var changedValue = event.target.value;
		if(changedValue == '144'){
			screenObj.width = 256;
			screenObj.height = 144;
			canvasObj.width = 256;
			canvasObj.height = 144;
			content.setAttribute('class', 'viwer_grid-item viwer_grid-item--144');
		} else if(changedValue == '240'){
			screenObj.width = 427;
			screenObj.height = 240;
			canvasObj.width = 427;
			canvasObj.height = 240;
			content.setAttribute('class', 'viwer_grid-item viwer_grid-item--240');
		} else if(changedValue == '360'){
			screenObj.width = 640;
			screenObj.height = 360;
			canvasObj.width = 640;
			canvasObj.height = 360;
			content.setAttribute('class', 'viwer_grid-item viwer_grid-item--360');
		} else if(changedValue == '480'){
			screenObj.width = 720;
			screenObj.height = 480;
			canvasObj.width = 720;
			canvasObj.height = 480;
			content.setAttribute('class', 'viwer_grid-item viwer_grid-item--480');
		}  else if(changedValue == '720'){
			screenObj.width = 1280;
			screenObj.height = 720;
			canvasObj.width = 1280;
			canvasObj.height = 720;
			content.setAttribute('class', 'viwer_grid-item viwer_grid-item--720');
		} else if(changedValue == '1080'){
			screenObj.width = 1920;
			screenObj.height = 1080;
			canvasObj.width = 1920;
			canvasObj.height = 1080;
			content.setAttribute('class', 'viwer_grid-item viwer_grid-item--1080');
		}
		$grid.masonry();
		//console.log(`You like ${event.target.value}`);
	});
	
	if(viewersize == '144'){
		screenObj.width = 256;
		screenObj.height = 144;
		canvasObj.width = 256;
		canvasObj.height = 144;
		sizeSelector.value = '144';
		content.setAttribute('class', 'viwer_grid-item viwer_grid-item--144');
	}  else if(viewersize == '240'){
		screenObj.width = 427;
		screenObj.height = 240;
		canvasObj.width = 427;
		canvasObj.height = 240;
		sizeSelector.value = '240';
		content.setAttribute('class', 'viwer_grid-item viwer_grid-item--240');
	} else if(viewersize == '360'){
		screenObj.width = 640;
		screenObj.height = 360;
		canvasObj.width = 640;
		canvasObj.height = 360;
		sizeSelector.value = '360';
		content.setAttribute('class', 'viwer_grid-item viwer_grid-item--360');
	}  else if(viewersize == '480'){
		screenObj.width = 720;
		screenObj.height = 480;
		canvasObj.width = 720;
		canvasObj.height = 480;
		sizeSelector.value = '480';
		content.setAttribute('class', 'viwer_grid-item viwer_grid-item--480');
	} else if(viewersize == '720'){
		screenObj.width = 1280;
		screenObj.height = 720;
		canvasObj.width = 1280;
		canvasObj.height = 720;
		sizeSelector.value = '720';
		content.setAttribute('class', 'viwer_grid-item viwer_grid-item--720');
	} else if(viewersize == '1080'){
		screenObj.width = 1920;
		screenObj.height = 1080;
		canvasObj.width = 1920;
		canvasObj.height = 1080;
		sizeSelector.value = '1080';
		content.setAttribute('class', 'viwer_grid-item viwer_grid-item--1080');
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
	/*
	var constraints = {
		video: {
			aspectRatio: {exact: 1.7777777778},
                  	deviceId: deviceId
		}
	};
	*/
	/*
	var constraints = {
		video: {
			deviceId: deviceId
		}
	};
	*/
	var constraints;
	if(captureSize == "720"){
		constraints = {
			video: {
				width:1280,
				height: 720,
	                  	deviceId: deviceId
			}
		};
	}  else if(captureSize == "1080"){
		constraints = {
			video: {
				width:1920,
				height: 1080,
	                  	deviceId: deviceId
			}
		};
	} else {
		constraints = {
			video: {
				aspectRatio: {exact: 1.7777777778},
	                  	deviceId: deviceId
			}
		};
	}
	
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

function gotoStandby() {
	thisPeer = (window.peer = new Peer(myPeerID.value,{
		//key: window.__SKYWAY_KEY__,
		key: skywaykey,
		debug: 1,
	}));
	
	thisPeer.on('error', console.error);
	
	recordButton.disabled = "";
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
			accessibleMembers = [];
			for(var i = 0; i< peers.length; i++){
				accessibleList.value += peers[i]+";";
				accessibleMembers.push(peers[i]);
			}
			console.log(peers);
		});
		
		//https://techacademy.jp/magazine/5537
		var checkAccessibleMember = function(){
			thisPeer.listAllPeers(peers => {
				accessibleList.value = "";
				accessibleMembers = [];
				for(var i = 0; i< peers.length; i++){
					accessibleList.value += peers[i]+";";
					accessibleMembers.push(peers[i]);
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
				for(var i = 0; i < removeItem.children.length; i++){
					if(removeItem.children[i].getAttribute("name") == "local_camera_video"){
						if(removeItem.children[i].srcObject != null){
							removeItem.children[i].srcObject.getTracks().forEach(track => track.stop());
						}
						break;
					}
				}
				
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
			openConnection(mediaConnection.remoteId, mediaConnection);
			updatePeerUI(thisPeerCounterNumer, false);
			mediaConnection.on('stream', async stream => {
				/*
				// Render remote stream for callee
				remoteVideo.srcObject = stream;
				remoteVideo.playsInline = true;
				await remoteVideo.play().catch(console.error);
				*/
				openStream(stream, mediaConnection.remoteId, mediaConnection);
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
		});//end of call media connection
		
		thisPeer.on('connection', dataConnection => {
			console.log(dataConnection.remoteId +" data connection connected" );
			dataConnection.once('open', async () => {
				remotePeerIDDataConMap.set(dataConnection.remoteId, dataConnection);
				console.log(dataConnection.remoteId +" opened" );
				//dataConnection.send("how are yor?");
				dataConnection.on('data', data => {
					getData(dataConnection.remoteId, data);
					//console.log(dataConnection.remoteId +" >> "+data );
				});
				dataConnection.once('close', () => {
					remotePeerIDDataConMap.delete(dataConnection.remoteId);
					console.log(dataConnection.remoteId +" data connection closed" );
				});
			});//end of open dataconnection
		});//end of call dataconnection
	});//end of thisPeer.once('open', id => {
}

function callRemoteOne(remotePeerID) {
	// Note that you need to ensure the peer has connected to signaling server
	// before using methods of peer instance.
	if (!thisPeer.open) {
		return false;
	}
	var member = accessibleMembers.find((v) => v==remotePeerID);
	if(member == null){
		alert(remotePeerID+" doesn't login")
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
	if(mediaConnection == null){
		return false;
	}
	console.log("connected = "+mediaConnection.remoteId +", "+ mediaConnection.id);
	var thisPeerCounterNumer = getThisPeerCounterNumer(mediaConnection.remoteId);
	openConnection(mediaConnection.remoteId, mediaConnection);
	updatePeerUI(thisPeerCounterNumer, false);
	mediaConnection.on('stream', async stream => {
		var thisPeerCounterNumer = getThisPeerCounterNumer(mediaConnection.remoteId);
		//updatePeerUI(thisPeerCounterNumer, false);
		console.log("get stream = "+mediaConnection.remoteId +" "+mediaConnection.id);
		//このときのremoteIdがもし複数連続でやったらあとのpeerIdになってしまう
		openStream(stream, mediaConnection.remoteId, mediaConnection);
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
	
	//make data connection
	 const dataConnection = thisPeer.connect(remotePeerID);
	dataConnection.once('open', async () => {
		remotePeerIDDataConMap.set(dataConnection.remoteId, dataConnection);
		console.log(dataConnection.remoteId +" data connection opened" );
		//dataConnection.send("hello I'm "+myPeerID.value);
	});
	
	dataConnection.on('data', data => {
		getData(dataConnection.remoteId, data);
		//console.log(dataConnection.remoteId +" >> "+data );
	});
	
	dataConnection.once('close', () => {
		remotePeerIDDataConMap.delete(dataConnection.remoteId);
		console.log(dataConnection.remoteId +" data connection closed" );
	});
	
	return true;
}

//自分で切ったイベント
function closeRemote(peerID){
	//自分で切った
	//mediaConnection.close(true);
	//stepButton.setAttribute('onclick', 'callRemote()');
	//stepButton.innerHTML = "call";
	
	//mapからの削除はcloseイベントが発生してから
	for(var[key, value] of remotePeerIDMediaConMap){
		if(key == peerID){
			value.close(true);
		}
	}
	//mapからの削除はcloseイベントが発生してから
	for(var[key, value] of remotePeerIDDataConMap){
		if(key == peerID){
			value.close();
		}
	}
}
function openConnection(remotePeerID, mediaConnection){
	remotePeerIDMediaConMap.set(remotePeerID, mediaConnection);
}
function openStream(stream, remotePeerID, mediaConnection){
	console.log(remotePeerID+ '('+mediaConnection.remoteId+') => remote stream videtrack = '+stream.getVideoTracks().length+', audiotrack = '+stream.getAudioTracks().length);
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
			deviceId: audioId,
			sampleRate: {ideal: 48000},
			sampleSize: 16,
			echoCancellation: false,
			noiseSuppression: false,
			channelCount: {ideal: 2, min: 1}
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

function publishData(sendText){
	for(var[key, value] of remotePeerIDDataConMap){
		value.send(sendText);
	}
}

function sendData(toPeerID, sendText){
	if(remotePeerIDDataConMap.has(toPeerID)){
		remotePeerIDDataConMap.get(toPeerID).send(sendText);
	} else {
		console.error("failed to send, "+toPeerID + " is not connected");
	}
}

function getData(fromPeerID, receiveText){
	console.log(fromPeerID+ " : " + receiveText);
}

function startstoprecord(){
	if(isRecording){
		for(var i  = 0; i < recorder.length; i++){
			recorder[i].stop();
		}
		
		isRecording = false;
		recordButton.innerHTML = "<font size='2'>record</font>";
	} else {
		//start
		isRecording = true;
		recorderMap.clear();
		recordButton.innerHTML = "<font size='2'>stop</font>";
		recorder.splice(0);
		chunks.splice(0);
		fileNames.splice(0);
		var recorderCount = 0;
		var elements = document.getElementsByName('local_camera_video');
		for (var i = 0; i < elements.length; i++) {
			if(elements[i].srcObject != null){
				recorder.push(new MediaRecorder(elements[i].srcObject));
				recorderMap.set(recorderCount, recorder[recorderCount]);
				chunks.push([]); // 格納場所をクリア
				fileNames.push(myPeerID.value+"_"+i+".webm");
				// 録画進行中に、インターバルに合わせて発生するイベント
				console.log(fileNames+":"+recorderCount);
				recorder[recorderCount].ondataavailable = createCallbackOndataavailable(recorderCount);	
				/*
				recorder[recorderCount].ondataavailable = function(evt) {
					console.log(fileNamesp[recorderCount]+":"+recorderCount);
					console.log("data available: evt.data.type=" + evt.data.type + " size=" + evt.data.size);
					chunks[recorderCount].push(evt.data);
				};
				*/

				// 録画停止時のイベント
				recorder[recorderCount].onstop = createCallbackOnstop(recorderCount);
				/*
				recorder[recorder.length-1].onstop = function(evt) {
					console.log('recorder.onstop()');
					recorder[recorderCount] = null;
				};
				*/
				// 録画スタート
				recorder[recorderCount].start(1000); // インターバルは1000ms
				console.log('start recording : '+recorderCount);
				recorderCount++;
			}
		}
		
		for(var[key, value] of remotePeerIDMediaConMap){
			var elements = document.getElementsByName('remote_camera_video_'+key);
			for (var i = 0; i < elements.length; i++) {
				if(elements[i].srcObject != null){
					recorder.push(new MediaRecorder(elements[i].srcObject));
					recorderMap.set(recorderCount, recorder[recorderCount]);
					chunks.push([]); // 格納場所をクリア
					fileNames.push(key+"_"+elements[i].getAttribute("trackid")+".webm");
					// 録画進行中に、インターバルに合わせて発生するイベント
					console.log(fileNames+":"+elements[i].getAttribute("trackid"));
					recorder[recorderCount].ondataavailable = createCallbackOndataavailable(recorderCount);	
					
					// 録画停止時のイベント
					recorder[recorderCount].onstop = createCallbackOnstop(recorderCount);
					// 録画スタート
					recorder[recorderCount].start(1000); // インターバルは1000ms
					console.log('start recording : '+recorderCount);
					recorderCount++;
				}
			}
		}
		
	}
}

//https://note.kiriukun.com/entry/20181107-passing-arguments-to-callback-function
function createCallbackOndataavailable(recorderCount) {
	return function(evt) {
		//console.log(fileNames[recorderCount]+":"+recorderCount);
		//console.log("data available: evt.data.type=" + evt.data.type + " size=" + evt.data.size);
		chunks[recorderCount].push(evt.data);
	}
}

function createCallbackOnstop(recorderCount) {
	return function(evt) {
		console.log('recorder '+recorderCount+'.onstop()');
		recorder[recorderCount] = null;
		
		
		//stop
		if (! blobUrl) {
			window.URL.revokeObjectURL(blobUrl);
			blobUrl = null;
		}
		
		if(recorderMap.has(recorderCount)){
			recorderMap.delete(recorderCount);
		}
		
		if(recorderMap.size == 0){
			console.log("all recorder stopped, num recorder = "+recorder.length+ ", " + chunks.length);
			var videoBlob =[];
			for(var i  = 0; i < recorder.length; i++){
				// Blob
				//const videoBlob = new Blob(chunks[i], { type: "video/webm" });
				videoBlob.push(new Blob(chunks[i], { type: "video/webm" }));
				// 再生できるようにURLを生成
				//blobUrl.push(window.URL.createObjectURL(videoBlob));			
			}
			
			//zip
			let zip = new JSZip();
			const folderName = "skywaycaht";
			let folder = zip.folder(folderName);
			
			for(var i  = 0; i < videoBlob.length; i++){
				folder.file(fileNames[i], videoBlob[i]);
			}
			
			zip.generateAsync({ type: "blob" }).then(blob => {
				// blob から URL を生成
				const dataUrl = URL.createObjectURL(blob);
				anchor.download = `${folderName}.zip`;
				anchor.href = dataUrl;
				// オブジェクト URL の開放
				setTimeout(function() {
					window.URL.revokeObjectURL(dataUrl);
				}, 10000);
			});
		}
	}
}