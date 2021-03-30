var remotePeerIDs = [];
var remotePeerIDMediaConMap = new Map();
var remotePeerIDDataConMap = new Map();
var accessibleMembers = [];
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
var videoMuteMode = false;

var micTestMediaRecorder = null;
var micTestAudio = null;
var speakerTestAudio = null;

var isRecording = false;
var recorder =  [];
var blobUrl = null;
var blobUrls = [];
var chunks = [];
var fileNames = [];
var videoBlob =[]
var dataUrls =[];
var recorderMap = new Map();

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
				var myPeerID = document.getElementById("myPeerID");
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
			if(key == "videomutemode"){
				if(value == "true" || value == "TRUE" || value == "True"){
					videoMuteMode = true;
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

window.addEventListener('beforeunload', (event) => {
	logout();
	//event.preventDefault();
	//event.returnValue = '';
});

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
	var remotePeers = document.getElementById("remotePeers");
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
	var removeButton = document.getElementById('remotePeer_removeButton_'+thisPeerCounterNumer);
	var peerIDText = document.getElementById('remotePeer_id_'+thisPeerCounterNumer);
	var chatsendtargetSelector = document.getElementById('chatsendtargetselect');
	
	if(enable){
		//disconnected
		if(commuButton != null)commuButton.innerHTML = "<font size='2'>call</font>";
		if(peerIDText != null)peerIDText.disabled= false;
		if(removeButton != null)removeButton.disabled= false;
		
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
		if(removeButton != null)removeButton.disabled= true;
		
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

function updateCommuButton(){
	var buttons = document.getElementsByName("remotePeer_commuButton");
	for(var j = 0; j < buttons.length; j++){
		if(buttons[j].innerHTML.indexOf('call') >= 0){
			buttons[j].disabled= true;
		}
	}
	for (var i = 0; i < accessibleMembers.length; i++) {
		for(var j = 0; j < buttons.length; j++){
			var thisPeerCounterNumber = buttons[j].getAttribute("thisPeerCounterNumer");
			var peerTextID = document.getElementById('remotePeer_id_'+thisPeerCounterNumber);
			var peerID = peerTextID.value;
			if(accessibleMembers[i] == peerID){
				buttons[j].disabled= false;
			}
		}
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

async function addCamera(deviceID, deviceLabel) {
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
	await startVideo(deviceID, screenObj);
	//startVideos(deviceID, screenObj, screenObj2);
}

var clicked = false;    // クリック状態を保持するフラグ
function videoCanvasClicked(event){
	var drawClerTimer;
	var canvasObj = this;
	var clickX = event.pageX ;
	var clickY = event.pageY ;
	console.log(clickX +", "+clickY+"/"+canvasObj.width+","+canvasObj.height);
	var myPeerID = document.getElementById("myPeerID");

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
	
	var speakerList = document.getElementById("speaker_list");
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
	
	var openWindowButton = document.createElement("button");
	openWindowButton.innerHTML = "<font size='3'>open window</font>";
	openWindowButton.onclick = function() {
		//openWindowButton.innerText = "close window";
		var obj_window = window.open("FloatingVideoWindow.html?contentid="+screenObj.id+"&remoterPeerID="+remoterPeerID+"&trackID="+trackID, "remoterPeerID="+remoterPeerID+"&trackID="+trackID, "width="+screenObj.width+",height="+screenObj.height+",scrollbars=no");
		//obj_window.document.getElementById("hogehoge").srcObject = stream;
		//window.open("SubWindows.html", "サブ検索画面", "width=300,height=200,scrollbars=yes");
	};
	//openWindowButton.setAttribute('style', 'width:50pt;');
	openWindowButton.classList.toggle('small');
	content.appendChild(openWindowButton);
	
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
	
	//もし録画中だったらリストに加える
	if(isRecording){
		recorder.push(new MediaRecorder(screenObj.srcObject));
		recorderMap.set(recorderCount, recorder[recorderCount]);
		chunks.push([]); // 格納場所をクリア
		fileNames.push(remoterPeerID+"_"+screenObj.getAttribute("trackid")+".webm");
		// 録画進行中に、インターバルに合わせて発生するイベント
		console.log(fileNames+":"+screenObj.getAttribute("trackid"));
		recorder[recorderCount].ondataavailable = createCallbackOndataavailable(recorderCount);	
		
		// 録画停止時のイベント
		recorder[recorderCount].onstop = createCallbackOnstop(recorderCount);
		// 録画スタート
		recorder[recorderCount].start(1000); // インターバルは1000ms
		console.log('start recording : '+recorderCount);
		recorderCount++;
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
	
	//録画中ならリストに加える
	if(isRecording){
		if(audioObj.srcObject != null && audioObj.getAttribute("mutemode")=="false"){
			recorder.push(new MediaRecorder(audioObj.srcObject));
			recorderMap.set(recorderCount, recorder[recorderCount]);
			chunks.push([]); // 格納場所をクリア
			fileNames.push(remoterPeerID+"_audioonly_"+audioObj.getAttribute("trackid")+".webm");
			// 録画進行中に、インターバルに合わせて発生するイベント
			console.log(fileNames+":"+audioObj.getAttribute("trackid"));
			recorder[recorderCount].ondataavailable = createCallbackOndataavailable(recorderCount);	
			
			// 録画停止時のイベント
			recorder[recorderCount].onstop = createCallbackOnstop(recorderCount);
			// 録画スタート
			recorder[recorderCount].start(1000); // インターバルは1000ms
			console.log('start recording : '+recorderCount);
			recorderCount++;
		} else {
			//console.log('remote_audio_source_'+key +' srcObjec is null');
		}
	}
	
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
				consol.err(err);
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
				
				var stepButton = document.getElementById("step_button");
				stepButton.disabled = false;
				
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
			})();
		}).catch(function (err) {
			console.error('enumerateDevide ERROR:', err);
				
			getDeviceButton.disabled = false;
		});
	})();
}

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
	console.log("gotostandby clicked");
	var myPeerID = document.getElementById("myPeerID");
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
	
	thisPeer.on("close", () => {
		var buttons = document.getElementsByName("remotePeer_commuButton");
		for(var j = 0; j < buttons.length; j++){
			buttons[j].disabled = true;
		}
		var stepButton = document.getElementById("step_button");
		stepButton.innerHTML = "<font size='2'>go to standby</font>";
		stepButton.disabled = false;
		isReady = false;
	});
	
	/*
	for(var[key, value] of remotePeerIDMediaConMap){
		
	}
	if(remotePeerIDMediaConMap.has("")),get ,set
	*/
	remotePeerIDMediaConMap.clear();
	thisPeer.once('open', id => {
		let peers = thisPeer.listAllPeers(peers => {
			var accessibleList = document.getElementById("accessible_list");
			accessibleList.value = "";
			accessibleMembers = [];
			for(var i = 0; i< peers.length; i++){
				accessibleList.value += peers[i]+";";
				accessibleMembers.push(peers[i]);
			}
			updateCommuButton();
			console.log(peers);
		});
		var recordButton = document.getElementById("recorder_button");
		recordButton.disabled = "";
		var getDeviceButton = document.getElementById("devices_button");
		getDeviceButton.disabled = true;
		var speakerList = document.getElementById("speaker_list");
		speakerList.disabled = false;
		var myPeerID = document.getElementById("myPeerID");
		myPeerID.disabled = false;
		
		finishTestMode();
		
		isReady = true;
		var elements = document.getElementsByName('remotePeer_commuButton');
		for (var i = 0; i < elements.length; i++) {
			elements[i].disabled = false;
		}
		
		
		//https://techacademy.jp/magazine/5537
		var checkAccessibleMember = function(){
			thisPeer.listAllPeers(peers => {
				var accessibleList = document.getElementById("accessible_list");
				accessibleList.value = "";
				accessibleMembers = [];
				for(var i = 0; i< peers.length; i++){
					accessibleList.value += peers[i]+";";
					accessibleMembers.push(peers[i]);
				}
				updateCommuButton();
				//console.log(peers);
			});
		}
		checkMemberTimerId = setInterval(checkAccessibleMember, 5000);
		//clearInterval(checkMemberTimerId);
		
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
							console.log("close camera : "+value);
							removeItem.children[i].srcObject.getTracks().forEach(track => track.stop());
						}
						break;
					} else {
						console.log("close camera : "+removeItem.children[i].getAttribute("name"));							
					}
				}
				removeItem.parentNode.removeChild(removeItem);
			}
		});
		
		
		//mic
		//getSelectedMicStream();
		getSelectedMicStream().then(() => { 
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
		});
		
		
		//stepButton.setAttribute('onclick', 'callRemote()');
		var stepButton = document.getElementById("step_button");
		stepButton.setAttribute('disabled', 'true');
		stepButton.innerHTML = "<font size='3'>connected</font>";
		
		
		
		//かかってきたイベント
		// Register callee handler
		thisPeer.on('call', mediaConnection => {
			if(localMixedStream == null){
				makeLocalStream();
			}
			console.log('local stream videotrack = '+localMixedStream.getVideoTracks().length+', audiotrack = '+localMixedStream.getAudioTracks().length);
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

function logout(){
	console.log("try to log out");
	//close all connection
	var buttons = document.getElementsByName("remotePeer_commuButton");
	for(var j = 0; j < buttons.length; j++){
		if(buttons[j].innerHTML.indexOf('close') >= 0){
			buttons[j].click();
		}
	}
	clearInterval(checkMemberTimerId);	
	//sleep(3000);
	if(thisPeer != null){
		thisPeer.destroy();
	}
}

function sleep(waitMsec) {
	var startMsec = new Date();
	// 指定ミリ秒間だけループさせる（CPUは常にビジー状態）
	while (new Date() - startMsec < waitMsec);
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
	
	console.log('local stream videotrack = '+localMixedStream.getVideoTracks().length+', audiotrack = '+localMixedStream.getAudioTracks().length);
	if(remotePeerID == "" || remotePeerID == " ")return false;
	if(remotePeerIDMediaConMap.has(remotePeerID))return true;
	console.log("remotePeerID = "+ remotePeerID);
	//var mediaConnection = thisPeer.call(remotePeerIDs[i], localMixedStream);
	if(videoMuteMode){
		console.log("call to "+ remotePeerID+" with video mute mode");
		//dataConnection.send("numvideo=-1");
		if(localMixedStream == null){
			makeLocalStream();
		}
		mediaCall(remotePeerID);
	} 
	
	//make data connection
	 const dataConnection = thisPeer.connect(remotePeerID);
	dataConnection.once('open', async () => {
		remotePeerIDDataConMap.set(dataConnection.remoteId, dataConnection);
		console.log(dataConnection.remoteId +" data connection opened" );
		if(videoMuteMode){
			
		} else {
			dataConnection.send("numvideo="+localMixedStream.getVideoTracks().length);
		}
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
	console.log(remotePeerID+ '('+mediaConnection.remoteId+') => remote stream videotrack = '+stream.getVideoTracks().length+', audiotrack = '+stream.getAudioTracks().length);
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
		//elements[i].srcObject.getTracks().forEach(track => track.stop());
		if(elements[i].srcObject != null){
			var tracks = elements[i].srcObject.getTracks();
			if(tracks != null){
				for(var j = 0; j < tracks.length; j++){
					tracks[j].stop();
				}
			}
			elements[i].srcObject = null;
		}
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
		//elements[i].srcObject.getTracks().forEach(track => track.stop());
		if(elements[i].srcObject != null){
			var tracks = elements[i].srcObject.getTracks();
			if(tracks != null){
				for(var j = 0; j < tracks.length; j++){
					tracks[j].stop();
				}
			}
			elements[i].srcObject = null;
		}
	}
	const remote_audios = document.getElementById("remote_audios");
	elements = document.getElementsByName("remote_audio_"+remotePeerID);
	for (var i = 0; i < elements.length; i++) {
		elements[i].parentNode.removeChild(elements[i]);
	}
	
	remotePeerIDMediaConMap.delete(remotePeerID);
}

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
		//document.getElementById("echocancelselector").disabled = true;
	}).catch(function (err) {
		console.error('getUserMedia Err:', err);
	});
}

function makeLocalStream(){
	var myPeerID = document.getElementById("myPeerID");
	localMixedStream = new webkitMediaStream();
	//取得した一覧から全てのvalue値を表示する
	if(localMicStream != null){
		localMixedStream.addTrack(localMicStream.getAudioTracks()[0]);
	} else {
		console.log("no audio track to send");
	}
	var elements = document.getElementsByName('local_camera_video');
	if(elements.length == 0){
		if(isRecording){
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
	} else {
		for (var i = 0; i < elements.length; i++) {
			//elements[i].srcObject.getTracks().forEach(track => track.stop());
			//elements[i].srcObject = null;
			if(elements[i].srcObject.getVideoTracks().length > 0){
				localMixedStream.addTrack(elements[i].srcObject.getVideoTracks()[0]);
			}
			console.log('remove audio track from local mic stream');
			for(var j = elements[i].srcObject.getAudioTracks().length-1; j>=0; j--){
				elements[i].srcObject.removeTrack(elements[i].srcObject.getAudioTracks()[j]);
			}
			console.log('add audio track to local mic stream');
			if(localMicStream != null){
				elements[i].srcObject.addTrack(localMicStream.getAudioTracks()[0]);
			}
			if(isRecording){
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
			/*
			if(elements[i].srcObject.getAudioTracks().length == 0){
				console.log('add audio track to local mic stream');
				if(localMicStream != null){
					elements[i].srcObject.addTrack(localMicStream.getAudioTracks()[0]);
				}
			} else {
				//console.log('local mic stream is null');
			}
			*/
		}
	}
}

function setMicAnalysis(selector){
	var micSelector = selector;
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
		var delayParam = document.getElementById("micdelayinput").value;
		audioContextForMicAnalysis = new AudioContext();
		// for legacy browsers
		audioContextForMicAnalysis.createDelay = audioContextForMicAnalysis.createDelay || audioContextForMicAnalysis.createDelayNode;
		var scriptProcessor = audioContextForMicAnalysis.createScriptProcessor(bufferSize, 1, 1);
		var localScriptProcessor = scriptProcessor;
		var mediastreamsource = audioContextForMicAnalysis.createMediaStreamSource(stream);
		mediastreamsource.connect(scriptProcessor);
		scriptProcessor.onaudioprocess = onAudioProcess;
		scriptProcessor.connect(audioContextForMicAnalysis.destination);

		// 音声解析関連
		audioAnalyser = audioContextForMicAnalysis.createAnalyser();
		audioAnalyser.fftSize = 2048;
		frequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);
		timeDomainData = new Uint8Array(audioAnalyser.frequencyBinCount);
		mediastreamsource.connect(audioAnalyser);
		
	}).catch(function (err) {
		console.error('getUserMedia Err:', err);
	});
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
	var myPeerID = document.getElementById("myPeerID");
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
		if(cmds.startsWith("forcelogout=")){
			var logoutid = cmds.slice(12);
			console.log("force logout command = "+logoutid);
			if(logoutid == myPeerID.value){
				logout();
			}
		} else {
			var comTab = document.getElementById('TAB-Communication');
			console.log("TAB-Communication = "+comTab.checked);
			if(!comTab.checked){
				//alert(fromPeerID+"\n"+cmds);
				comTab.checked = true;
			}
			var chatoutput = document.getElementById('chatoutput');
			chatoutput.value = "<from>"+fromPeerID+"\n"+cmds+"\n"+chatoutput.value
		}
	}
}

function sendchat(){
	var chatsendinput = document.getElementById('chatsendinput');
	var myPeerID = document.getElementById("myPeerID");
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

var recorderCount = 0;
function startstoprecord(){
	var recordButton = document.getElementById("recorder_button");
	if(isRecording){
		for(var i  = 0; i < recorder.length; i++){
			if(recorder[i] != null){
				recorder[i].stop();
			} else {
				console.error('not found recorder index = '+i);
			}
		}
		
		isRecording = false;
		recordButton.innerHTML = "<font size='2'>record</font>";
		
		var recorder_button = document.getElementById('recorder_button');
		recorder_button.disabled = true;
	} else {
		//start
		isRecording = true;
		recorderMap.clear();
		recordButton.innerHTML = "<font size='2'>stop</font>";
		recorder.splice(0);
		chunks.splice(0);
		fileNames.splice(0);
		recorderCount = 0;
		var elements = document.getElementsByName('local_camera_video');
		var myPeerID = document.getElementById("myPeerID");
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
				if(elements[i].srcObject == null){
					console.log('remote_audio_source_'+key +' srcObjec is null');
				} else if(elements[i].getAttribute("mutemode")=="false"){
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
					console.log('remote_audio_source_'+key +' srcObjec is mutemode, not record');
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
			
			//次のレコードを可能にする
			var recorder_button = document.getElementById('recorder_button');
			recorder_button.disabled = false;
			
			/*
			console.log("start zip");			
			zip.generateAsync({ type: "blob" }).then(blob => {
				console.log("zip generated");
				// blob から URL を生成
				const dataUrl = URL.createObjectURL(blob);
				const anchor = document.getElementById('downloadlink');
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