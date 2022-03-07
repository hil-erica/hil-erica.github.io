/*https://github.com/riversun/JSFrame.js*/


var shareScreenFrame;
var sharingScreenBgCanvasObj;
var sharingScreenCanvasObj;

var isShareScreenShow = false;

//'use strict';
var errorElement;
var sharingScreenVideo;
var sharingScreenStream;

function initializeShareScreen() {
	openShareScreen();
	shareScreenFrame.hide();
	isShareScreenShow = false;
}
function openShareScreen(){
	if(shareScreenFrame == null){
		//const appearance = jsFrame.createFrameAppearance();
		shareScreenFrame = jsFrame.create({
			title: "Share Screen",
			left: 120,
			top: 120,
			//width: window.innerWidth*0.5,
			//height: window.innerHeight*0.4,
			width: 500,
			height: 350,
			appearance: populateOriginalStyle(appearance),
			style: {
				backgroundColor: 'rgba(180,180,180,0.1)',
				overflow: 'hidden'
			},
			//html: userElement.innerHTML
			//html: '<div style="padding:10px;height:100%">Createa appearance object from scratch</div>'
			url: 'sharingscreen.html',//iframe内に表示するURL
			urlLoaded: (_frame) => {
				console.log("loaded sharescreen.html");
				shareScreenFrame.$("body").style.background = 'rgba(180,180,180,0.1)';
				var myPeerID = document.getElementById("myuserid");
				
				errorElement = shareScreenFrame.$('#errorMsg');
				var main = shareScreenFrame.$('#main');
				
				var contentID = "local_sharingscreen_container";
				var container = document.createElement("div");
				container.setAttribute("id", "local_sharingscreen_container");
				container.setAttribute("class", "maincontainer");
								
				//紫水晶むらさきすいしょう #e7e7eb R:231 G:231 B:235
				var svgFillColor = "rgba(231,231,235,1)";
				
				var videocontainer = document.createElement("div");
				videocontainer.setAttribute("class", "videocontainer");
				
				var videoObj;
				videoObj = document.createElement("video");
				videoObj.setAttribute("class", "video");
				videoObj.setAttribute("name", "sharingscreen_video");
				videoObj.setAttribute("id", "local_sharingscreen_video");
				videoObj.setAttribute("controls", "1");
				videoObj.style.opacity = 0.8;//動画の背景透かし
				
				videoObj.muted = true;
				//今はテストautoplayのためにmute
				//videoObj.muted = true;
				videoObj.setAttribute("autoplay", "1");
				videoObj.playsInline = true;
				videocontainer.appendChild(videoObj);
				sharingScreenVideo = videoObj;
								
				var videoLabel = document.createElement("label");
				videoLabel.innerHTML = "sharing screen";
				videoLabel.setAttribute("class", "videolabel");
				//videocontainer.appendChild(videoLabel);
				
				sharingScreenBgCanvasObj = document.createElement("canvas");
				sharingScreenBgCanvasObj.setAttribute("class", "videocanvas");
				sharingScreenBgCanvasObj.setAttribute("name", "backgroundcanvas");
				sharingScreenBgCanvasObj.setAttribute("id", "local_sharingscreen_bgcanvas");
				sharingScreenBgCanvasObj.setAttribute("peerid", myPeerID.value);
				sharingScreenBgCanvasObj.setAttribute("trackid", -1);
				videocontainer.appendChild(sharingScreenBgCanvasObj);
				
				sharingScreenCanvasObj = document.createElement("canvas");
				sharingScreenCanvasObj.setAttribute("class", "videocanvas");
				//sharingScreenCanvasObj.setAttribute("name", "clickcanvas");
				sharingScreenCanvasObj.setAttribute("id", "local_sharingscreen_canvas");
				sharingScreenCanvasObj.setAttribute("peerid", myPeerID.value);
				sharingScreenCanvasObj.setAttribute("trackid", -1);
				videocontainer.appendChild(sharingScreenCanvasObj);
				
				//https://qiita.com/sashim1343/items/e3728bea913cadab677d
				console.log("teleOpeMode:"+teleOpeMode);
				if(teleOpeMode){
					sharingScreenCanvasObj.addEventListener( "mousedown", canvasMouseDown);
					sharingScreenCanvasObj.addEventListener( "mouseup", canvasMouseUp);
					sharingScreenCanvasObj.addEventListener( "mousemove", canvasMouseMove);
					sharingScreenCanvasObj.addEventListener( "mouseout", canvasMouseOut);
					//sharingScreenCanvasObj.addEventListener("click", canvasClicked);
					//sharingScreenCanvasObj.addEventListener( "dblclick", canvasDblClicked);
				} else {
					console.log("canvas off");
					sharingScreenCanvasObj.style.display ="none";
					sharingScreenBgCanvasObj.style.display ="none";
				}
				
				//スピーカー初期化
				var controller = document.createElement("div");
				controller.setAttribute("class", "controller");
				//controller.setAttribute("class", "row controller");
				var speakerDiv = document.createElement("div");
				speakerDiv.setAttribute("class", "form-control");
				var speakerSelector = document.createElement("select");
				//speakerSelector.setAttribute("class", "form-select form-select-sm");
				speakerSelector.setAttribute("size", "1");
				speakerSelector.setAttribute("style", "width:75pt;");
				speakerSelector.setAttribute('speakerid', videoObj.id);
				var speakerList = document.getElementById("speaker_list");
				for(var i = 0; i <speakerList.length; i++){
					option = document.createElement("option");
					option.setAttribute("value", speakerList[i].value);
					option.innerHTML = speakerList[i].innerHTML;
					speakerSelector.appendChild(option);
				}
				//メインのスピーカーに設定
				speakerSelector.selectedIndex = speakerList.selectedIndex;
				controller.appendChild(speakerSelector);
				
				var speakerId = speakerSelector.options[speakerList.selectedIndex].value;
				if(videoObj.srcObject != null && videoObj.srcObject.getAudioTracks().length > 0){
					videoObj.setSinkId(speakerId)
						.then(function() {
						console.log("setSinkID Success, audio is being played on "+speakerId +" at "+videoObj.id);
					})
					.catch(function(err) {
						console.error("setSinkId Err:", err);
					});
					speakerSelector.addEventListener("change", speakerSelectEvent);
				} else if(videoObj.src != null){
					videoObj.setSinkId(speakerId)
						.then(function() {
						console.log("setSinkID Success, audio is being played on "+speakerId +" at "+videoObj.id);
					})
					.catch(function(err) {
						console.error("setSinkId Err:", err);
					});
					speakerSelector.addEventListener("change", speakerSelectEvent);	
				}
				//sharingの方はきかなくてOK 
				//container.appendChild(controller);
				container.appendChild(videocontainer);
				main.appendChild(container);
				
				
				//sharingScreenVideo = shareScreenFrame.$('#gum-local');
				shareScreenFrame.on('#getDisplayMediaBotton', 'click', (_frame, evt) => {
					gdm();
				});
			}
			
		});
		
		console.log("frame id:"+shareScreenFrame.id);//windowManager_***
		shareScreenFrame.show();
		isShareScreenShow = true;
		shareScreenFrame.on('closeButton', 'click', (_frame, evt) => {
		});
		
		shareScreenFrame.on('minimizeButton', 'click', (_frame, evt) => {
			console.log("click minimize");
			shareScreenFrame.hide();
			isShareScreenShow = false;
		});
		
		const eventListener = (data) => {
			const box = document.querySelector('#message');
			const frame = data.target;
			const eventType = data.eventType;
			const size = data.size;
			const position = data.pos;
			const windowName = frame.getName();
			//console.log("windowName:"+windowName+", eventType"+eventType+", "+position.anchor+", position:("+position.x+","+position.y+")size=("+size.width+"x"+size.height+")");
			var main = shareScreenFrame.$('#main');
			canvasSizeChanged(sharingScreenBgCanvasObj);
			canvasSizeChanged(sharingScreenCanvasObj);
		};

		// register resize event
		shareScreenFrame.on('frame', 'resize', eventListener);

		// register move event
		shareScreenFrame.on('frame', 'move', eventListener);

		// Multiple listeners can be registered for a single eventType
		shareScreenFrame.on('frame', 'move', (data) => {
			//console.log(`pos=${JSON.stringify(data.pos)} size=${JSON.stringify(data.size)}`)
		});
		
	} else {
		if(isShareScreenShow){
			shareScreenFrame.hide();
			isShareScreenShow = false;
		} else {
			shareScreenFrame.show();
			isShareScreenShow = true;
		}
	}
}


// Put variables in global scope to make them available to the browser console.
var constraints = window.constraints = {
  audio: true,
  video: true
};


var sharingScreenMap = new Map();
function handleSuccess(stream) {
	var videoTracks = stream.getVideoTracks();
	//console.log('Got stream with constraints:', constraints);
	console.log('Using video device: ' + videoTracks[0].label);
	sharingScreenMap.set(videoTracks[0].label, stream);
	if(sharingScreenStream != null){
		for(var i=0;i<sharingScreenStream.getTracks().length; i++){
			sharingScreenStream.getTracks()[i].stop();
		}
	}
	
	sharingScreenStream = null;
	sharingScreenStream = stream;
	sharingScreenVideo.srcObject = stream;
	sharingScreenSelectEvent(true);//communication.js
	
	stream.oninactive = function() {
		sharingScreenMap.delete(stream.getVideoTracks()[0].label, stream);
		if(sharingScreenMap.size == 0){
			sharingScreenStream = null;
			sharingScreenSelectEvent(false);//communication.js
		}
		console.log('screen  stream inactive '+stream.getVideoTracks()[0].label);
	};
	//send start of sharing screen
}

function handleError(error) {
	if (error.name === 'ConstraintNotSatisfiedError') {
		errorMsg('The resolution ' + constraints.video.width.exact + 'x' +
		constraints.video.width.exact + ' px is not supported by your device.');
	} else if (error.name === 'PermissionDeniedError') {
		errorMsg('Permissions have not been granted to use your camera and ' +
		'microphone, you need to allow the page access to your devices in ' +
		'order for the demo to work.');
	}
	errorMsg('getDisplayMedia error: ' + error.name, error);
}

function errorMsg(msg, error) {
	errorElement.innerHTML += '<p>' + msg + '</p>';
	if (typeof error !== 'undefined') {
		console.error(error);
	}
}

function gdm() {
	//console.log(shareScreenFrame);
	navigator.mediaDevices.getDisplayMedia(constraints)
	.then(handleSuccess)
	.catch(handleError);
}


 /* exported trace */

// Logging utility function.
function trace(arg) {
	var now = (window.performance.now() / 1000).toFixed(3);
	console.log(now + ': ', arg);
}
