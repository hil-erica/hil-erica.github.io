var captureSize  = 0;
var videoMuteMode = false;
var teleOpeMode = false;
var currenthandgesture = "palmup";
var isReady = false;

var isNode = (typeof process !== "undefined" && typeof require !== "undefined");

function initialize(){
	/*
	addRemoteVideo("Sunny Drop", 0, null);
	addRemoteVideo("Cool_生存本能ヴァルキュリア(限定)", 0, null);
	addRemoteVideo("LiPPS_Tulip", 0, null);
	addRemoteVideo("大槻唯_Snow Wings", 0, null);
	addRemoteVideo("槻唯_Radio Happy!_01", 0, null);
	*/
	/*
	var elements = document.getElementsByName("clickcanvas");
	for (var i = 0; i < elements.length; i++) {
		console.log('addEventListener click to '+elements[i].getAttribute("id")+", class : "+elements[i].getAttribute("class")+ ', style.display = '+elements[i].style.display + ' to \"\"');
		elements[i].addEventListener( "click", canvasClicked);
		elements[i].style.display ="";
	}
	*/
	//changeSubLayout(1);
	initializeJSFrame();
	onSiteLoadOnSkyway();
	console.log("initialize finish, isNode = "+isNode);
}

window.addEventListener('beforeunload', (event) => {
	console.log("beforeunload event");
	//websocket close
	if(wSocket != null && wSocket.readyState == 1){
		wSocket.close();
		console.log("close socket");
		wSocket = null;
	}

	//mediastreaming websocket close
	for (var [key, value] of mapURL2Websocket.entries()) {
		//mediarecorder stop
		value.close();
		console.log("close websocket for streaming : ", key);
	}

	if(sharedWindow != null){
		sharedWindow.close();
	}
	logout();
});

function readyToChat(){
	//画面遷移とかStep
	var recordButton = document.getElementById("recorder_button");
	recordButton.disabled = "";
	var getDeviceButton = document.getElementById("devices_button");
	getDeviceButton.disabled = true;
	var speakerList = document.getElementById("speaker_list");
	speakerList.disabled = false;
	var myuserid = document.getElementById("myuserid");
	myuserid.disabled = true;


	finishTestMode();
	closeSetupModal();
	standbyDevice();
	fadeInBodyImg(2000);
	initializeCommunication();
	initializeInformation();
	initializeOption();
	initializeShareScreen();
	initializeSetting();
	isReady = true;
}

//連想配列
function getQueryParams() {
	CAMERA_RESOLUTION
	const cameraResolution = localStorage.getItem(CAMERA_RESOLUTION) || "";
	if (cameraResolution == "1080") {
		document.getElementById('camera_resolution').options[0].selected = true;
	} else if (cameraResolution == "720") {
		document.getElementById('camera_resolution').options[1].selected = true;
	} else if (cameraResolution == "360") {
		document.getElementById('camera_resolution').options[2].selected = true;
	}

	document.getElementById("teleopemodecheckbox").checked = teleOpeMode;
	if (1 < document.location.search.length) {
		const query = document.location.search.substring(1);
		const params = query.split('&');

		const result = {};
		for(var param of params) {
			const element = param.split('=');
			const key = decodeURIComponent(element[0]);
			const value = decodeURIComponent(element[1]);
			result[key] = value;

			if(key == "myuserid"){
				document.getElementById("myuserid").value = value;
			}
			if(key == "myroomid"){
				document.getElementById("myroomid").value = value;
			}
			if(key == "remoteuserid"){
				var remotePeerIDValue = value;
				remotePeerIDs = remotePeerIDValue.split(";");
				for(var i = 0; i < remotePeerIDs.length; i++){
					if(remotePeerIDs[i] == "" || remotePeerIDs[i] == " ")continue;
					predefinedRemoteUser.push(remotePeerIDs[i]);
				}
			}
			if(key == "capturesize"){
				if (value == "1080") {
					document.getElementById('camera_resolution').options[0].selected = true;
				} else if (value == "720") {
					document.getElementById('camera_resolution').options[1].selected = true;
				} else if (value == "360") {
					document.getElementById('camera_resolution').options[2].selected = true;
				}
			}
			if(key == "skywaykey"){
				if(value != ""){
					document.getElementById("apiKey").value = value;
				} else {

				}
			}if(key == "appid"){
				if(value != ""){
					document.getElementById("appId").value = value;
				} else {

				}
			}
			if(key == "apikey"){
				if(value != ""){
					document.getElementById("apiKey").value = value;
				} else {

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
			if(key == "websocketurl"){
				webSockUrl = value;
			}
			if(key == "speechhistoryurl" || key == "externalwebsiteurl"){
				externalWebSiteUrl = value;
			}
			if(key == "autowebsockconnect"){
				if(value == "true" || value == "TRUE" || value == "True"){
					autoWebSockConnect = true;
				}
			}
			if(key == "streamingwebsocketurl"){
				document.getElementById("mediastream_socket_url").value=value;
			}
			if(key == "streaming2local"){
				if(value == "true" || value == "TRUE" || value == "True"){
					document.getElementById("streaming2local").checked = true;
				} else {
					document.getElementById("streaming2local").checked = false;
				}
			}
			/*
			if(key == "autorosconnect"){
				if(value == "true" || value == "TRUE" || value == "True"){
					autoRosConnect = true;
				}
			}
			if(key == "roswebsocketurl"){
				rosWebSockUrl = value;
			}
			if(key == "sendvideo2ros"){
				if(value == "true" || value == "TRUE" || value == "True"){
					document.getElementById("sendvideo2ros").checked = true;
				} else {
					document.getElementById("sendvideo2ros").checked = false;
				}
			}
			*/
			if(key =="rosframeid"){
				document.getElementById("ros_frameid_header").value = value;
			}
			if(key == "answerrequest"){
				if(value == "true" || value == "TRUE" || value == "True"){
					answerRequest = true;
				}else {
					answerRequest = false;
				}
			}
			if(key == "vcodec"){
				vCodec = value;
			}
		}
		return result;
	}
	return null;
}
