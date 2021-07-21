var captureSize  = 0;
var videoMuteMode = false;
var teleOpeMode = false;
var currenthandgesture = "palmup";
var isReady = false;


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
	changeSubLayout(3);
	calsSubContainersSize();
	initializeJSFrame();
	console.log("initialize finish");
}

window.addEventListener('beforeunload', (event) => {
	console.log("beforeunload event");
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
	remotePeerIDMediaConMap.clear();
	closeSetupModal();
	standbyDevice();
	fadeInBodyImg(2000);
	initializeCommunication();
	isReady = true;
}

//連想配列
function getQueryParams() {
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
			if(key == "remoteuserid"){
				var remotePeerIDValue = value;
				remotePeerIDs = remotePeerIDValue.split(";");
				for(var i = 0; i < remotePeerIDs.length; i++){
					if(remotePeerIDs[i] == "" || remotePeerIDs[i] == " ")continue;
					predefinedRemoteUser.push(remotePeerIDs[i]);
				}
			}
			if(key == "capturesize"){
				if(value == '720' || value == '1080'){
					captureSize = value;
				}
			}
			if(key == "skywaykey"){
				if(value != ""){
					document.getElementById("apiKey").value = value;
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
		}
		return result;
	}
	return null;
}
