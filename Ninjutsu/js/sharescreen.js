/*https://github.com/riversun/JSFrame.js*/

var blankVideo  ="./videos/teleoperation.mp4";
var shareScreenFrame;
var sharingScreenBgCanvasObj;
var sharingScreenCanvasObj;
var sharedWindow;
var sharedVideo;


var remotePeerIDSharingScreenMediaStreamMap = new Map();//peerid, MediaStream

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
					//speakerSelector.addEventListener("change", speakerSelectEvent);
				} else if(videoObj.src != null){
					videoObj.setSinkId(speakerId)
						.then(function() {
						console.log("setSinkID Success, audio is being played on "+speakerId +" at "+videoObj.id);
					})
					.catch(function(err) {
						console.error("setSinkId Err:", err);
					});
					//speakerSelector.addEventListener("change", speakerSelectEvent);	
				}
				//sharingの方はきかなくてOK 
				//container.appendChild(controller);
				container.appendChild(videocontainer);
				main.appendChild(container);
				
				
				//sharingScreenVideo = shareScreenFrame.$('#gum-local');
				shareScreenFrame.on('#getDisplayMediaBotton', 'click', (_frame, evt) => {
					gdm();
				});
				
				shareScreenFrame.on('#openScreenBotton', 'click', (_frame, evt) => {
					if(remotePeerIDSharingScreenMediaStreamMap.size > 0){
						//動画を別のに切り替える
						for(var[key, value] of remotePeerIDSharingScreenMediaStreamMap){
							addSharedScreen(key, value);
							break;
						}
					} else {
						addSharedScreen("", null);
					}
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
		//media stream closeして一旦接続を切るべし
		for(var i=0;i<sharingScreenStream.getTracks().length; i++){
			sharingScreenStream.getTracks()[i].stop();
		}
	}
	
	sharingScreenStream = null;
	sharingScreenStream = stream;
	sharingScreenVideo.srcObject = stream;
	sharingScreenSelectEvent(true);//device.js
	
	stream.oninactive = function() {
		sharingScreenMap.delete(stream.getVideoTracks()[0].label, stream);
		if(sharingScreenMap.size == 0){
			sharingScreenStream = null;
			sharingScreenSelectEvent(false);//device.js
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

function addSharedScreen(remoteID, videostream){
	if(remoteID != null && videostream != null){
		console.log("show sharedscreen of "+remoteID);
		remotePeerIDSharingScreenMediaStreamMap.set(remoteID, videostream);
	}
	if(sharedWindow != null){
		console.log("sharedscreen is opened");
		sharedVideo.pause();
		sharedVideo.src = null;
		sharedVideo.srcObject = videostream;
		sharedVideo.play();
		sharedVideo.onplaying = (event) => {
		 	console.log('shared video start playing');
		 	//スピーカー選び直し, after shareVideo start
			var speakerSelector = sharedWindow.document.getElementById("sharedscreen_speaker_selector");
			var speakerId = speakerSelector.options[speakerSelector.selectedIndex].value;
			//一旦デフォルトにしないとあかん
			var defaultSpeakerId = speakerSelector.options[0].value;
			(async () => {
				await sharedVideo.setSinkId(defaultSpeakerId)
					.then(function() {
					console.log('setSinkID Success, shared screen audio is being played on '+defaultSpeakerId +' at '+sharedVideo.id);
					(async () => {
						await sharedVideo.setSinkId(speakerId)
							.then(function() {
							console.log('setSinkID Success, shared screen audio is being played on '+speakerId +' at '+sharedVideo.id);
						})
						.catch(function(err) {
							console.error('setSinkId Err:', err);
						});
					})();
				})
				.catch(function(err) {
					console.error('setSinkId Err:', err);
				});
			})();
			/*
			(async () => {
				await sharedVideo.setSinkId(speakerId)
					.then(function() {
					console.log('setSinkID Success, audio is being played on '+speakerId +' at '+sharedVideo.id);
				})
				.catch(function(err) {
					console.error('setSinkId Err:', err);
				});
			})();
			*/
		};
		sharedWindow.document.title = "影分身 共有画面 : "+remoteID;
		
		return;
	}
	console.log("create sharedscreen");
	sharedWindow = window.open("sharedscreen.html",null, "width=300,height=200,scrollbars=no");
	sharedWindow.onload = ()=> {
		console.log("shared window loaded");
		sharedVideo = sharedWindow.document.getElementById("sharedscreen_video");
		if(videostream == null){
			sharedWindow.document.title = "影分身 共有画面";
			sharedVideo.src = blankVideo;
		} else {
			sharedWindow.document.title = "影分身 共有画面 : "+remoteID;
			sharedVideo.srcObject = videostream;
		}
		
		var speakerSelector = sharedWindow.document.getElementById("sharedscreen_speaker_selector");
		var speakerList = document.getElementById("speaker_list");
		for(var i = 0; i <speakerList.length; i++){
			var option = document.createElement("option");
			option.setAttribute("value", speakerList[i].value);
			option.innerHTML = speakerList[i].innerHTML;
			speakerSelector.appendChild(option);
		}
		//メインのスピーカーに設定
		speakerSelector.selectedIndex = speakerList.selectedIndex;
		var speakerId = speakerSelector.options[speakerList.selectedIndex].value;
		if(sharedVideo.srcObject != null && sharedVideo.srcObject.getAudioTracks().length > 0){
			sharedVideo.setSinkId(speakerId)
				.then(function() {
				console.log("setSinkID Success, audio is being played on "+speakerId +" at "+sharedVideo.id);
			})
			.catch(function(err) {
				console.error("setSinkId Err:", err);
			});
			speakerSelector.addEventListener("change", shardSpeakerSelectEvent);
		} else if(sharedVideo.src != null){
			sharedVideo.setSinkId(speakerId)
				.then(function() {
				console.log("setSinkID Success, audio is being played on "+speakerId +" at "+sharedVideo.id);
			})
			.catch(function(err) {
				console.error("setSinkId Err:", err);
			});
			speakerSelector.addEventListener("change", shardSpeakerSelectEvent);	
		}
		
		sharedWindow.onbeforeunload  = ()=> {
			console.log("shared window beforeunload");
			sharedWindow = null;
			sharedVideo = null;
		}
		sharedWindow.onclose = ()=> {
			console.log("shared window closed");
			sharedWindow = null;
			sharedVideo = null;
		}
	}
	
	//window.open("SubWindows.html", "サブ検索画面", "width=300,height=200,scrollbars=yes");
}

function shardSpeakerSelectEvent(event){
	//個別のスピーカー設定
	var speakerSelector = this;
	var speakerId = speakerSelector.options[speakerSelector.selectedIndex].value;
	(async () => {
		await sharedVideo.setSinkId(speakerId)
			.then(function() {
			console.log('setSinkID Success, audio is being played on '+speakerId +' at '+sharedVideo.id);
		})
		.catch(function(err) {
			console.error('setSinkId Err:', err);
		});
	})();
}

function removeSharedScreen(remoteID){
	console.log("finish share screen of "+remoteID);
	if(remotePeerIDSharingScreenMediaStreamMap.has(remoteID)){
		remotePeerIDSharingScreenMediaStreamMap.delete(remoteID);
	}
	if(sharedVideo != null){
		if(remotePeerIDSharingScreenMediaStreamMap.size > 0){
			//動画を別のに切り替える
			for(var[key, value] of remotePeerIDSharingScreenMediaStreamMap){
				console.log("switch shared video to "+key);
				sharedVideo.srcObject = value;
				break;
			}
		} else {
			//背景
			console.log("switch shared video to back ground");
			sharedVideo.srcObject = null;
			sharedVideo.src = blankVideo;
		}
	}
}