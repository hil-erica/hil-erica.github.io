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
var numAudio = 1;
var viewersize = '360';
var captureSize = "none";
var default_width = 320;
var defualt_heigt = 191;
var small_width = 180;
var small_height = 101;
var button_size = 16;
var thisPeer = window.thisPeer;
var checkMemberTimerId;
var gazePics;
var gazePicsX;
var gazePicsY;
var pointingPicsRightup;
var pointingPicsRightdown;
var pointingPicsLeftup;
var pointingPicsLeftdown;
var pointingPicsX;
var pointingPicsY;
var pointingPicsMargin;
var remotePeerCounter = 0;
var isReady = false;
var skywaykey = null;
var teleOpeMode = false;

var isRecording = false;
var recorder =  [];
var blobUrl = null;
var blobUrls = [];
var chunks = [];
var fileNames = [];
var videoBlob =[]
var dataUrls =[];
var recorderMap = new Map();
const anchor = document.getElementById('downloadlink');

var wSocket = null;

window.onload = ()=> {
	getQueryParams();
	pointingPicsRightup = new Image();
	pointingPicsRightup.src = "./pics/pointing-right-up.png";
	pointingPicsRightdown = new Image();
	pointingPicsRightdown.src = "./pics/pointing-right-down.png";
	pointingPicsLeftup = new Image();
	pointingPicsLeftup.src = "./pics/pointing-left-up.png";
	pointingPicsLeftdown = new Image();
	pointingPicsLeftdown.src = "./pics/pointing-left-down.png";
	
	pointingPicsX = 126;
	pointingPicsY = 126;
	pointingPicsMargin = 20;
	
	gazePics = new Image();
	gazePics.src = "./pics/eye-free.png";
	gazePicsX = 75;
	gazePicsY = 30;
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
			if(key == "teleopemode"){
				if(value == "true" || value == "TRUE" || value == "True"){
					teleOpeMode = true;
					document.getElementById("teleopemodecheckbox").checked = teleOpeMode;
				}
			}
			if(key == "micdelay"){
				document.getElementById("micdelayinput").value = parseFloat(value);
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
	if(elements != null){
		for (var i = 0; i < elements.length; i++) {
			if(elements[i].value == remotePeer){
				return elements[i].getAttribute('thisPeerCounterNumer');
			}
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
	commuButton.classList.toggle('small');
	
	var removeButton = document.createElement('button');
	removeButton.setAttribute('id', 'remotePeer_removeButton_'+thisPeerCounterNumer);
	removeButton.setAttribute('name', 'remotePeer_removeButton');
	removeButton.setAttribute('style', 'width:50pt;');
	removeButton.setAttribute('onclick', 'removePeer('+thisPeerCounterNumer+')');
	removeButton.innerHTML = "<font size='2'>remove</font>";
	removeButton.classList.toggle('small');
		
	content.appendChild(peerIDText);
	var txt = document.createTextNode("\u00a0");
	content.appendChild(txt);
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

function updatePeerUI(thisPeerCounterNumer, thisPeerID, enable){
	console.log(thisPeerCounterNumer +' to ' + enable);
	var commuButton = document.getElementById('remotePeer_commuButton_'+thisPeerCounterNumer);
	var peerIDText = document.getElementById('remotePeer_id_'+thisPeerCounterNumer);
	var chatsendtargetSelector = document.getElementById('chatsendtargetselect');
	
	if(enable){
		//disconnected
		if(commuButton != null)commuButton.innerHTML = "<font size='2'>call</font>";
		if(peerIDText != null)peerIDText.disabled= false;
		
		//delete chat target
		var options = chatsendtargetSelector.options
		for (var i = options.length - 1; 0 <= i; --i) {
			if(options[i].value == thisPeerID){
				if(options[i].selected) {
					chatsendtargetSelector.selectedIndex = 0;
				}
				chatsendtargetSelector.removeChild(options[i]);
			}
		}
	} else {
		//connected
		if(commuButton != null)commuButton.innerHTML = "<font size='2'>close</font>";
		if(peerIDText != null)peerIDText.disabled= true;
		
		//add chat target
		var options = chatsendtargetSelector.options
		var foundTarget = false;
		for (var i = options.length - 1; 0 <= i; --i) {
			if(options[i].value == thisPeerID){
				foundTarget = true;
			}
		}
		if(!foundTarget){
			var newElement = new Option( thisPeerID, thisPeerID) ;
			chatsendtargetSelector.add(newElement);
		}
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
	screenObj.setAttribute('videoid', deviceID);
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
	checkBoxLabelObj.setAttribute('id', 'local_camera_label_' + deviceID);
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
function videoCanvasClicked(event){
	var drawClerTimer;
	var canvasObj = this;
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
		/*
		context.beginPath () ;
		context.arc( x, y, 20, 0 * Math.PI / 180, 360 * Math.PI / 180, false ) ;
		context.strokeStyle = "red" ;
		context.lineWidth = 1 ;
		context.stroke() ;
		*/
		if(xRatio >= 0.5){
			if(yRatio >= 0.5){
				//right down
				context.drawImage(pointingPicsRightdown, x-pointingPicsX+pointingPicsMargin, y-pointingPicsY+pointingPicsMargin, pointingPicsX, pointingPicsY);
			} else {
				//right up
				context.drawImage(pointingPicsRightup, x-pointingPicsX+pointingPicsMargin, y-pointingPicsMargin, pointingPicsX, pointingPicsY);
			}
		} else {
			if(yRatio >= 0.5){
				//left down
				context.drawImage(pointingPicsLeftdown, x-pointingPicsMargin, y+pointingPicsMargin-pointingPicsY, pointingPicsX, pointingPicsY);
			} else {
				//left up
				context.drawImage(pointingPicsLeftup, x-pointingPicsMargin, y-pointingPicsMargin, pointingPicsX, pointingPicsY);
			}
		}
		
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
				/*
				context.beginPath () ;
				context.arc( x, y, 20, 0 * Math.PI / 180, 360 * Math.PI / 180, false ) ;
				context.strokeStyle = "blue" ;
				context.lineWidth = 1 ;
				context.stroke() ;
				*/
				context.drawImage(gazePics, x-gazePicsX/2, y-gazePicsY/2, gazePicsX, gazePicsY);
				
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
		//canvasに描画 Clear
		var context = canvasObj.getContext( "2d" ) ;
		context.clearRect(0, 0, canvasObj.width, canvasObj.height);
	}, drawMarkDuration);
}

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
	screenObj.setAttribute('controls', '1');
	if(trackID > 0){
		//screenObj.setAttribute('muted', 'true');
		screenObj.muted = true;
	}
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
	if(teleOpeMode){
		canvasObj.addEventListener( "click", videoCanvasClicked);
	} else {
		canvasObj.style.display ="none";
	}
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
	
	/*
	////lip sync用に再生遅延をかける，AudioCotextはVideoの音声制御とは関係ない，あと音質悪化する
	screenObj.onloadedmetadata = function(e) {
		screenObj.play();
		screenObj.muted = 'true';
	};
	const audioContext = new AudioContext();
	// Create the instance of MediaStreamAudioSourceNode
	var source = audioContext.createMediaStreamSource(stream);
	// Create the instance of DelayNode
	var delay = audioContext.createDelay();
	// Set parameters
	delay.delayTime.value = 1.0;  // 0.5 sec
	source.connect(delay);
	delay.connect(audioContext.destination);
	*/
	screenObj.srcObject = stream;
	
	
	screenObj.playsInline = true;
	//await screenObj.play().catch(console.error);
	
	/*
	if(stream.getAudioTracks().length>0){
		var speakerId = getSelectedSpeaker();
		//screenObj.volume = 0;
		(async () => {
			await screenObj.setSinkId(speakerId)
				.then(function() {
				console.log('setSinkID Success, audio is being played on '+speakerId);
			})
			.catch(function(err) {
				console.error('setSinkId Err:', err);
			});
		})();
	}
	*/
	
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
	
	var speakerSelector = document.createElement('select');
	speakerSelector.setAttribute('id', 'remote_camera_speakerselector_' +remoterPeerID+'_'+ trackID);
	speakerSelector.setAttribute('speakerid', screenObj.id);
	speakerSelector.setAttribute('size', '1');
	speakerSelector.setAttribute('style', 'width:100pt;');
	for(var i = 0; i <speakerList.length; i++){
		option = document.createElement('option');
		option.setAttribute('value', speakerList[i].value);
		option.innerHTML = speakerList[i].innerHTML;
		speakerSelector.appendChild(option);
	}
	//メインのスピーカーに設定
	speakerSelector.selectedIndex = speakerList.selectedIndex;
	
	/*
	var openWindowButton = document.createElement("button");
	openWindowButton.innerText = "Open";
	openWindowButton.onclick = function() {
		openWindowButton.innerText += " クリックされました!";
		var obj_window = window.open("SubWindows.html?contentid="+screenObj.id, "サブ検索画面", "width=300,height=200,scrollbars=yes");
		//obj_window.document.getElementById("hogehoge").srcObject = stream;
		//window.open("SubWindows.html", "サブ検索画面", "width=300,height=200,scrollbars=yes");
	};	
	content.appendChild(openWindowButton);
	*/
	content.appendChild(sizeSelector);
	content.appendChild(speakerSelector);
	content.appendChild(screenObj);
	content.appendChild(canvasObj);
	
	//初期化
	var speakerId = speakerSelector.options[speakerList.selectedIndex].value;
	if(screenObj.srcObject.getAudioTracks().length > 0){
		screenObj.setSinkId(speakerId)
			.then(function() {
			console.log('setSinkID Success, audio is being played on '+speakerId +' at '+screenObj.id);
		})
		.catch(function(err) {
			console.error('setSinkId Err:', err);
		});
		speakerSelector.addEventListener('change', speakerSelectEvent);
	}
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
	return screenObj;
}

function speakerSelectEvent(event){
	var speakerSelector = this;
	var speakerId = speakerSelector.options[speakerSelector.selectedIndex].value;
	console.log("selected speaker id = "+speakerId +" for " +speakerSelector.getAttribute("speakerid"));
	var screenObj = document.getElementById(speakerSelector.getAttribute("speakerid"));
	/*
	screenObj.setSinkId(speakerId)
		.then(function() {
		console.log('setSinkID Success, sub audio is being played on '+speakerId +' at '+screenObj.id);
	})
	.catch(function(err) {
		console.error('setSinkId Err:', err);
	});
	*/
	
	//screenObj.volume = 0;
	(async () => {
		await screenObj.setSinkId(speakerId)
			.then(function() {
			console.log('setSinkID Success, audio is being played on '+speakerId +' at '+screenObj.id);
		})
		.catch(function(err) {
			console.error('setSinkId Err:', err);
		});
	})();
	
}
function addSoundOnly(stream, remoterPeerID, trackID, muteMode) {
	var contentID = 'remote_audio_'+remoterPeerID+'_' + trackID;
	numAudio++;
	var content;
	content = document.createElement('div');
	content.setAttribute('id', contentID);
	content.setAttribute('name', 'remote_audio_'+remoterPeerID);
	
	//content.setAttribute('style', 'padding: 10px; margin-bottom: 10px; border: 1px solid #333333;');
	var audioObj = new Audio();
	audioObj.srcObject = stream;
	var speakerId = getSelectedSpeaker();
	//screenObj.volume = 0;
	(async () => {
		await audioObj.setSinkId(speakerId)
			.then(function() {
			console.log('setSinkID Success, audio is being played on '+speakerId);
		})
		.catch(function(err) {
			console.error('setSinkId Err:', err);
		});
	})();
	audioObj.play();
	
	//var audioObj;
	//audioObj = document.createElement('audio');
	audioObj.setAttribute('id', 'remote_audio_source_' +remoterPeerID+'_'+ trackID);
	audioObj.setAttribute('name', 'remote_audio_source_'+remoterPeerID);
	audioObj.setAttribute('remotePeerId', remoterPeerID);
	audioObj.setAttribute('trackID', trackID);
	audioObj.setAttribute('mutemode', muteMode);
	if(!teleOpeMode){
		audioObj.controls=true;
	}
	
	if(trackID > 0){
		//screenObj.setAttribute('muted', 'true');
		audioObj.muted = true;
	}
	if(muteMode=="true"){
		audioObj.muted = true;
		audioObj.controls = false;
	}
	audioObj.setAttribute('autoplay', '1');
	
	content.appendChild(audioObj);
	const remote_audios = document.getElementById("remote_audios");
	remote_audios.appendChild(content);
	return audioObj;
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
	
	//https://stackoverflow.com/questions/60297972/navigator-mediadevices-enumeratedevices-returns-empty-labels
	(async () => {   
		//await navigator.mediaDevices.getUserMedia({audio: true, video: true});
		//let devices = await navigator.mediaDevices.enumerateDevices();   
		//console.log(devices); 
		 try {
			await navigator.mediaDevices.getUserMedia({audio: true, video: true});
			/* ストリームを使用 */
		} catch(err) {
			console.error('enumerateDevide ERROR:', err);
			 try {
			await navigator.mediaDevices.getUserMedia({audio: true, video: false});
				/* ストリームを使用 */
			} catch(err) {
				console.error('enumerateDevide ERROR:', err);
			}
		}
		
		await navigator.mediaDevices.enumerateDevices().then(function (devices) {
			devices.forEach(function (device) {
				console.log(device.kind + ": " + device.label + " id = " + device.deviceId);
				addDevice(device);
			});
			
			//option to not send audio
			var id = "don't send audio";
			var label = "don't send audio"; // label is available for https 
			var option = document.createElement('option');
			option.setAttribute('value', id);
			option.innerHTML = label + '(' + id + ')';;
			micList.appendChild(option);
			
			stepButton.disabled = false;
			//tabCommunication.setAttribute("disable",false);
		}).catch(function (err) {
			console.error('enumerateDevide ERROR:', err);
		});
	})();
	
	/*
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
	*/
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
				width: {exact: 1280},
				height: {exact: 720},
	                  	deviceId: deviceId
			}
		};
	}  else if(captureSize == "1080"){
		constraints = {
			video: {
				width: {exact: 1920},
				height: {exact: 1080},
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

function teleOpeModeChanged() {
	if (document.getElementById("teleopemodecheckbox").checked) {
		teleOpeMode = true;
		for(var[key, value] of remotePeerIDMediaConMap){
			var elements = document.getElementsByName('remote_camera_canvas_'+key);
			for (var i = 0; i < elements.length; i++) {
				console.log('addEventListener click to '+elements[i].getAttribute("id")+ ', style.display = '+elements[i].style.display + ' to \"\"');
				elements[i].addEventListener( "click", videoCanvasClicked);
				elements[i].style.display ="";
			}
			
			elements = document.getElementsByName('remote_audio_source_'+key);
			for (var i = 0; i < elements.length; i++) {
				if(elements[i].getAttribute("mutemode")=="false"){
					elements[i].controls=false;
				}
				//console.log('change '+elements[i].getAttribute("id")+ ' controls to '+elements[i].controls);
			}
		}
	} else {
		teleOpeMode = false;
		for(var[key, value] of remotePeerIDMediaConMap){
			var elements = document.getElementsByName('remote_camera_canvas_'+key);
			for (var i = 0; i < elements.length; i++) {
				console.log('removeEventListener click to '+elements[i].getAttribute("id")+ ', style.display = '+elements[i].style.display + ' to none');
				elements[i].removeEventListener( "click", videoCanvasClicked);
				elements[i].style.display ="none";
			}
			
			elements = document.getElementsByName('remote_audio_source_'+key);
			for (var i = 0; i < elements.length; i++) {
				if(elements[i].getAttribute("mutemode")=="false"){
					elements[i].controls=true;
				}
				//console.log('change '+elements[i].getAttribute("id")+ ' controls to '+elements[i].controls);
			}
		}
	}
}

function gotoStandby() {
	thisPeer = (window.peer = new Peer(myPeerID.value,{
		//key: window.__SKYWAY_KEY__,
		key: skywaykey,
		debug: 1,
	}));
	
	//thisPeer.on('error', console.error);
	thisPeer.on('error', error => {
		//console.log("hoge"+error);
		alert(error);
	});
	
	
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
		
		
		//mic
		getSelectedMicStream();
		
		var elements = document.getElementsByName('local_camera_video');
		//取得した一覧から全てのvalue値を表示する
		for (var i = 0; i < elements.length; i++) {
			//elements[i].setAttribute('width', String(width)+'px');
			//elements[i].setAttribute('height', String(height)+'px');
			elements[i].width = width;
			elements[i].height = height;
			//elements[i].setAttribute('muted', 'true');
			elements[i].muted = true;
			//elements[i].setAttribute('controls', '1');
			//getSelectedMicStreamしてすぐだから間に合わないかもちゃんとasyncせなあかん
			if(localMicStream != null && localMicStream.getAudioTracks().length > 0){
				elements[i].srcObject.addTrack(localMicStream.getAudioTracks()[0]);
			} else {
				console.log('local mic stream is null');
			}
			
			//check boxとcamera labelを削除
			var removeItem = document.getElementById('local_camera_checkBox_'+elements[i].getAttribute('videoid'));
			if(removeItem != null){
				removeItem.parentNode.removeChild(removeItem);
			}
			removeItem = document.getElementById('local_camera_label_'+elements[i].getAttribute('videoid'));
			if(removeItem != null){
				removeItem.parentNode.removeChild(removeItem);
			}
		}
		elements = document.getElementsByName('local_camera_view');
		//取得した一覧から全てのvalue値を表示する
		for (var i = 0; i < elements.length; i++) {
			elements[i].setAttribute('class', 'item_small');
		}
		
		//stepButton.setAttribute('onclick', 'callRemote()');
		stepButton.setAttribute('disabled', 'true');
		stepButton.innerHTML = "<font size='3'>connected</font>";
		
		
		
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
			updatePeerUI(thisPeerCounterNumer, mediaConnection.remoteId, false);
			mediaConnection.on('stream', async stream => {
				console.log("get stream = "+mediaConnection.remoteId +" "+mediaConnection.id);
				openStream(stream, mediaConnection.remoteId, mediaConnection);
			});
			//切れた
			mediaConnection.once('close', () => {
				console.log("close = "+mediaConnection.remoteId +" "+mediaConnection.id);
				var thisPeerCounterNumer = getThisPeerCounterNumer(mediaConnection.remoteId);
				updatePeerUI(thisPeerCounterNumer, mediaConnection.remoteId, true);
				closedConnection(mediaConnection.remoteId);
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
					getData(dataConnection.remoteId, data, dataConnection);
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
		alert(remotePeerID+" doesn't login");
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
	
	//make data connection
	 const dataConnection = thisPeer.connect(remotePeerID);
	dataConnection.once('open', async () => {
		remotePeerIDDataConMap.set(dataConnection.remoteId, dataConnection);
		console.log(dataConnection.remoteId +" data connection opened" );
		//dataConnection.send("hello I'm "+myPeerID.value);
		dataConnection.send("numvideo="+localMixedStream.getVideoTracks().length);
	});
	
	dataConnection.on('data', data => {
		getData(dataConnection.remoteId, data, dataConnection);
		//console.log(dataConnection.remoteId +" >> "+data );
	});
	
	dataConnection.once('close', () => {
		remotePeerIDDataConMap.delete(dataConnection.remoteId);
		console.log(dataConnection.remoteId +" data connection closed" );
	});
	
	return true;
}

function mediaCall(remotePeerID){
	var mediaConnection = thisPeer.call(remotePeerID, localMixedStream);
	if(mediaConnection == null){
		return false;
	}
	console.log("connected = "+mediaConnection.remoteId +", "+ mediaConnection.id);
	//var thisPeerCounterNumer = getThisPeerCounterNumer(mediaConnection.remoteId);
	var thisPeerCounterNumer = addRemotePeerId(mediaConnection.remoteId);
	openConnection(mediaConnection.remoteId, mediaConnection);
	updatePeerUI(thisPeerCounterNumer, mediaConnection.remoteId, false);
	mediaConnection.on('stream', async stream => {
		var thisPeerCounterNumer = getThisPeerCounterNumer(mediaConnection.remoteId);
		console.log("get stream = "+mediaConnection.remoteId +" "+mediaConnection.id);
		//このときのremoteIdがもし複数連続でやったらあとのpeerIdになってしまう
		openStream(stream, mediaConnection.remoteId, mediaConnection);
		//await stream.paly().catch(console.error);
	});
	//切れた
	mediaConnection.once('close', () => {
		console.log("close = "+mediaConnection.remoteId +" "+mediaConnection.id);
		var thisPeerCounterNumer = getThisPeerCounterNumer(mediaConnection.remoteId);
		updatePeerUI(thisPeerCounterNumer, mediaConnection.remoteId, true);
		closedConnection(mediaConnection.remoteId);
	});
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
	//AudioContextを使ってMediaStreamを作り直すとvideo.setSinkIDで別々に出力できるようになった，じゃないとどれか1つのsinkIDを書き換えるとすべてskywayからもらったMediaStreamの音声の出力先が連動して変わってしまう，多分そんなに音質悪化はないかな？
	
	////重要なのはVideoTrack＝２でAudioTrack＝１の場合２つ目のVideoTrackはhoge2の処理に入る，そうすると２つのVideoTrackで別々の音声出力をすることができるが，追加で別と通信した音声が再生できない（hoge1処理で）
	////すべてstreamをそのまま表示するとおんせいはでるけどsetSinkIDが同期してしまう
	////つまり最初以外はすべてAudioContextで作ったトラックにして最初だけそのまま？??stream.getAudioTracks()[i]がメインでないと無理，それ以外はAudioCotextで追加すれば操作可能，でも最初のstreamが切れたらそれまで聞こえているやつも聞こえなくなる
	////違った，もとのAudioStreamを再生しないとそれをソースにしたAudioContextにデータが流れない，AudioContextがStreamするデータはSetSinkIdがちゃんと働くので実際に音を流すのはAudioContext経由にしたい，ってことでMuteでバックグラウンドでskywayでもらったstreamを再生しておく
	//audio onlyは最初に決めたスピーカーデバイスからしかながれない（現状）
	if(stream.getVideoTracks().length == 0){
		if(stream.getAudioTracks().length > 0){
			const audioContext = new AudioContext();
			var source = audioContext.createMediaStreamSource(stream);
			var destination = audioContext.createMediaStreamDestination();
			source.connect(destination);
			var audioStream = destination.stream;
			
			//var _remoteVideo = new webkitMediaStream();
			var _remoteVideo = new MediaStream();
			for(var i = 0; i<stream.getAudioTracks().length; i++){
				//_remoteVideo.addTrack(audioStream.getAudioTracks()[i]);//これだとうまくsetSinkIdが働かないけどもとのStream直結だとうまくいくのはなぜ？でもAudioContextを通さないとだめなのもなぜ？
				_remoteVideo.addTrack(stream.getAudioTracks()[i]);
			}
			
			//var _remoteVideo = new webkitMediaStream();
			//for(var i = 0; i<stream.getAudioTracks().length; i++){
			//	_remoteVideo.addTrack(stream.getAudioTracks()[i]);
			//}
			//addView(_remoteVideo, remotePeerID,0);
			addSoundOnly(_remoteVideo, remotePeerID,0, "false");
		}
	} else {
		for(var i = 0; i<stream.getVideoTracks().length; i++){
			//var _remoteVideo = new webkitMediaStream();
			var _remoteVideo = new MediaStream();
			_remoteVideo.addTrack(stream.getVideoTracks()[i]);
			if(stream.getAudioTracks().length > i){
				const audioContext = new (window.AudioContext || window.webkitAudioContext)();
				var source = audioContext.createMediaStreamSource(stream);
				var gainNode = audioContext.createGain();
				gainNode.gain.value = 1;
				var destination = audioContext.createMediaStreamDestination();
				source.connect(gainNode);
				gainNode.connect(destination);
				var audioStream = destination.stream;
				console.log("hoge1 " +audioStream.getAudioTracks().length);
				_remoteVideo.addTrack(audioStream.getAudioTracks()[i]);//これだとうまくsetSinkIdが働かないけどもとのStream直結だとうまくいくのはなぜ？でもAudioContextを通さないとだめなのもなぜ？
				//_remoteVideo.addTrack(stream.getAudioTracks()[i]);
				
				//無駄にStreamをそのまま流すAudioを作ってしまう，これはMute
				var _remoteAudio = new MediaStream();
				_remoteAudio.addTrack(stream.getAudioTracks()[i]);
				addSoundOnly(_remoteAudio, remotePeerID,0, "true");
			} else if(stream.getAudioTracks().length > 0){			
				console.log("hoge2");
				const audioContext = new AudioContext();
				var source = audioContext.createMediaStreamSource(stream);
				var destination = audioContext.createMediaStreamDestination();
				source.connect(destination);
				var audioStream = destination.stream;
				_remoteVideo.addTrack(audioStream.getAudioTracks()[audioStream.getAudioTracks().length - 1]);//これだとうまくsetSinkIdが働かないけどもとのStream直結だとうまくいくのはなぜ？でもAudioContextを通さないとだめなのもなぜ？
				//_remoteVideo.addTrack(stream.getAudioTracks()[stream.getAudioTracks().length - 1]);
			}
			addView(_remoteVideo, remotePeerID,i);
		}
	}
	/*
	if(stream.getVideoTracks().length == 0){
		if(stream.getAudioTracks().length > 0){	
			var _remoteVideo = new webkitMediaStream();
			for(var i = 0; i<stream.getAudioTracks().length; i++){
				_remoteVideo.addTrack(stream.getAudioTracks()[i]);
			}
			//addView(_remoteVideo, remotePeerID,0);
			addSoundOnly(_remoteVideo, remotePeerID,0);
		}
	} else {
		for(var i = 0; i<stream.getVideoTracks().length; i++){
			var _remoteVideo = new webkitMediaStream();
			_remoteVideo.addTrack(stream.getVideoTracks()[i]);
			if(stream.getAudioTracks().length > i){
				_remoteVideo.addTrack(stream.getAudioTracks()[i]);
			} else if(stream.getAudioTracks().length > 0){			
				_remoteVideo.addTrack(stream.getAudioTracks()[stream.getAudioTracks().length - 1]);
			}
			addView(_remoteVideo, remotePeerID,i);
		}
	}
	*/
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
	
	
	//audio
	var elements = document.getElementsByName('remote_audio_source_'+remotePeerID);
	//取得した一覧から全てのvalue値を表示する
	for (var i = 0; i < elements.length; i++) {
		elements[i].srcObject.getTracks().forEach(track => track.stop());
		elements[i].srcObject = null;
	}
	const remote_audios = document.getElementById("remote_audios");
	elements = document.getElementsByName("remote_audio_"+remotePeerID);
	for (var i = 0; i < elements.length; i++) {
		remote_audios.removeChild(elements[i]);
	}
	
	remotePeerIDMediaConMap.delete(remotePeerID);
	//クエリを編集
	//window.location.search = "myPeerID="+myPeerID.value+"&remotePeerID="+remotePeerID.value ;
	
	
}

function getSelectedMicStream(){
	var audioId = getSelectedAudio();
	if(audioId == "don't send audio"){
		console.log(audioId+", if send no audio track when call, the remote peer can't send audio track too.");
		const audioContext = new AudioContext();
		var destination = audioContext.createMediaStreamDestination();
		localMicStream = destination.stream;
		//localMicStream = null;
		return;
	}
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
		//localMicStream = stream;
		
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
		if(document.getElementById("mutecheckbox").checked){
			gain.gain.value=0; 
		}
		
		document.getElementById("micdelayinput").addEventListener('input', function( event ) {
			delay.delayTime.value = document.getElementById("micdelayinput").value;
			console.log("set mic delay = "+document.getElementById("micdelayinput").value +" sec");
		} ) ;
		document.getElementById("mutecheckbox").addEventListener('change', function( event ) {
			console.log("set mic mute = "+document.getElementById("mutecheckbox").checked);
			if(document.getElementById("mutecheckbox").checked){
				gain.gain.value=0; 
			} else {
				gain.gain.value=1; 
			}
		} ) ;
	}).catch(function (err) {
		console.error('getUserMedia Err:', err);
	});
}

function makeLocalStream(){
	localMixedStream = new webkitMediaStream();
	//取得した一覧から全てのvalue値を表示する
	if(localMicStream != null){
		localMixedStream.addTrack(localMicStream.getAudioTracks()[0]);
	} else {
		console.log("no audio track to send");
	}
	var elements = document.getElementsByName('local_camera_video');
	for (var i = 0; i < elements.length; i++) {
		//elements[i].srcObject.getTracks().forEach(track => track.stop());
		//elements[i].srcObject = null;
		if(elements[i].srcObject.getVideoTracks().length > 0){
			localMixedStream.addTrack(elements[i].srcObject.getVideoTracks()[0]);
		}		
		if(elements[i].srcObject.getAudioTracks().length == 0){
			console.log('add audio track to local mic stream');
			if(localMicStream != null){
				elements[i].srcObject.addTrack(localMicStream.getAudioTracks()[0]);
				/*
				//test: same mediastream can be played at different speakers
				var speakerId = speakerList.options[speakerList.length -1 - i].value;
				//screenObj.volume = 0;
				(async () => {
					await elements[i].setSinkId(speakerId)
						.then(function() {
						console.log('setSinkID Success, audio is being played on '+speakerId);
					})
					.catch(function(err) {
						console.error('setSinkId Err:', err);
					});
				})();
				*/
			}
		} else {
			//console.log('local mic stream is null');
		}
	}
}


function getSelectedAudio() {
	var id = micList.options[micList.selectedIndex].value;
	console.log('selected mic '+micList.selectedIndex+' '+id);
	return id;
}

function getSelectedSpeaker() {
	var id = speakerList.options[speakerList.selectedIndex].value;
	console.log('selected speaker '+speakerList.selectedIndex+' '+id);
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

function getData(fromPeerID, receiveText, dataConnection){
	//console.log(fromPeerID+ " : " + receiveText);
	if(receiveText.startsWith("numvideo")){
		if(localMixedStream == null){
			makeLocalStream();
		}
		var cmds = receiveText.split('=');
		var removenumvideo = parseInt(cmds[1]);
		if(localMixedStream.getVideoTracks().length >= removenumvideo){
			mediaCall(fromPeerID);
		} else {
			dataConnection.send("numvideo="+localMixedStream.getVideoTracks().length);
		}
	} else if(receiveText.startsWith("socket=")){
		var cmds = receiveText.slice(7);
		if(wSocket != null){
			wSocket.send(cmds);
		}
	} else if(receiveText.startsWith("chat=")){
		var cmds = receiveText.slice(5);
		var chatoutput = document.getElementById('chatoutput');
		chatoutput.value = "<from>"+fromPeerID+"\n"+cmds+"\n"+chatoutput.value
	}
}

function sendchat(){
	var chatsendinput = document.getElementById('chatsendinput');
	var sendText = "chat="+chatsendinput.value;
	var sendRawText = chatsendinput.value;
	chatsendinput.value = "";
	var chatsendtargetselect = document.getElementById('chatsendtargetselect');
	var sendTarget = chatsendtargetselect.options[chatsendtargetselect.selectedIndex].value;
	var chatoutput = document.getElementById('chatoutput');
	chatoutput.value = "<from>"+myPeerID.value+"<to>"+sendTarget+"\n"+sendRawText+"\n"+chatoutput.value
	if(sendTarget == "publish"){
		publishData(sendText);
	} else {
		sendData(sendTarget, sendText);
	}
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
		if(elements.length == 0){
			//record sound only
			if(localMicStream != null && localMicStream.getAudioTracks().length > 0){
				recorder.push(new MediaRecorder(localMicStream));
				recorderMap.set(recorderCount, recorder[recorderCount]);
				chunks.push([]); // 格納場所をクリア
				fileNames.push(myPeerID.value+"_audioonly.webm");
				// 録画進行中に、インターバルに合わせて発生するイベント
				console.log(fileNames+":"+"audiolny");
				recorder[recorderCount].ondataavailable = createCallbackOndataavailable(recorderCount);	
				
				// 録画停止時のイベント
				recorder[recorderCount].onstop = createCallbackOnstop(recorderCount);
				// 録画スタート
				recorder[recorderCount].start(1000); // インターバルは1000ms
				console.log('start recording : '+recorderCount);
				recorderCount++;
			}
		}
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
			} else {
				console.log('local_camera_video'+' srcObjec is null');
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
				} else {
					console.log('remote_camera_video_'+key +' srcObjec is null');
				}
			}
			
			elements = document.getElementsByName('remote_audio_source_'+key);
			for (var i = 0; i < elements.length; i++) {
				if(elements[i].srcObject != null && elements[i].getAttribute("mutemode")=="false"){
					recorder.push(new MediaRecorder(elements[i].srcObject));
					recorderMap.set(recorderCount, recorder[recorderCount]);
					chunks.push([]); // 格納場所をクリア
					fileNames.push(key+"_audioonly_"+elements[i].getAttribute("trackid")+".webm");
					// 録画進行中に、インターバルに合わせて発生するイベント
					console.log(fileNames+":"+elements[i].getAttribute("trackid"));
					recorder[recorderCount].ondataavailable = createCallbackOndataavailable(recorderCount);	
					
					// 録画停止時のイベント
					recorder[recorderCount].onstop = createCallbackOnstop(recorderCount);
					// 録画スタート
					recorder[recorderCount].start(1000); // インターバルは1000ms
					console.log('start recording : '+recorderCount);
					recorderCount++;
				} else {
					console.log('remote_audio_source_'+key +' srcObjec is null');
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
			videoBlob =[];
			dataUrls = [];
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
			
			
			var downloadLinks = document.getElementById("download_each");
			while (downloadLinks.firstChild) {
				downloadLinks.removeChild(downloadLinks.firstChild);
			}
			
			for(var i  = 0; i < videoBlob.length; i++){
				var downloadLink = document.createElement('a');
				downloadLink.innerHTML = "<font size='2'>"+fileNames[i]+"</font>";
				downloadLink.setAttribute("href", "#");
				//const dataUrl = URL.createObjectURL(videoBlob[i]);
				dataUrls.push(URL.createObjectURL(videoBlob[i]));
				downloadLink.download = fileNames[i];
				downloadLink.href = dataUrls[i];
				setTimeout(function() {
					//console.log("revoke object URL");
					window.URL.revokeObjectURL(dataUrls[i]);
				}, 1000);
				downloadLinks.appendChild(downloadLink);
				downloadLinks.innerHTML += '&nbsp;';
				/*
				var blanckObj = document.createElement('div');
				blanckObj.innerHTML = " &ensp;";
				downloadLinks.appendChild(blanckObj);
				*/
				folder.file(fileNames[i], videoBlob[i]);
			}
			
			/*
			console.log("start zip");			
			zip.generateAsync({ type: "blob" }).then(blob => {
				console.log("zip generated");
				// blob から URL を生成
				const dataUrl = URL.createObjectURL(blob);
				anchor.download = `${folderName}.zip`;
				anchor.href = dataUrl;
				// オブジェクト URL の開放
				setTimeout(function() {
					console.log("revoke object URL");
					window.URL.revokeObjectURL(dataUrl);
				}, 10000);
			});
			*/
		}
	}
}

function socketconnection(){
	var url = document.getElementById('socket_url').value;
	console.log("clicked "+url);
	if(wSocket == null){
		wSocket = new WebSocket(url);
		//接続通知
		wSocket.onopen = function(event) {
			console.log("open socket "+event.data);
			document.getElementById('socket_connect_button').innerHTML = "<font size='2'>disconnect</font>";
			/*
			var msg = {
				type : "hoge",
				text: "text"
			};
			wSocket.send("thank you\r\n\r\n");
			wSocket.send(JSON.stringify(msg));
			*/
		};
		
		//エラー発生
		wSocket.onerror = function(error) {
			console.log(error.data);
		};
		
		//メッセージ受信
		wSocket.onmessage = function(event) {
			//console.log(event.data);
			publishData("socket="+event.data);
		};
		
		//切断
		wSocket.onclose = function() {
			console.log("closed socket");
			wSocket = null;
			document.getElementById('socket_connect_button').innerHTML = "<font size='2'>connect</font>";
		};
		console.log("connected to "+url);
	} else {
		if(wSocket.readyState == 1){
			wSocket.close();
			console.log("close socket");
		}
	}
}