var requestModalOpenSound = new Audio("./sounds/決定、ボタン押下39.mp3");
var answerRequestSound = new Audio("./sounds/決定、ボタン押下22.mp3");
var cancelRequestSound = new Audio("./sounds/キャンセル4.mp3");
var stackRequestSound = new Audio("./sounds/警告音2.mp3");
var newtypeSound = new Audio("./sounds/ひらめく1.mp3");
var infoSound = new Audio("./sounds/チリン.mp3");
var warningSound = new Audio("./sounds/間抜け1.mp3");
var currentTeleopeMode = "auto";


//sharedscreenを使っているかどうか
//var remotePeerIDSharingscreenFlagMap = new Map();//peerid, true/false

function clickSay(){
	var textEmenent = document.getElementById("saytext");
	if(textEmenent.value.startsWith("debug=")){
		var cmds = textEmenent.value.slice(6);
		getData("localdebug", cmds, null);
		textEmenent.value="";
	}else if(textEmenent.value  != ""){
		console.log("say : "+textEmenent.value);
		
		var sendText = "tts={\"tts\": \""+textEmenent.value+"\"}";
		publishData(sendText);
		
		textEmenent.value="";
	}
}

function sleep(waitMsec) {
	var startMsec = new Date();
	// 指定ミリ秒間だけループさせる（CPUは常にビジー状態）
	while (new Date() - startMsec < waitMsec);
}


/* gestureの結果 */
function gestureSelected() {
	var id = this.getAttribute("gesture");
	setGestureIconOnRunning(id);
	//command
	var eventName = "playgesture";		
	var sendText = "{\"peerid\": \""+document.getElementById("myuserid").value+"\", \""+eventName+"\": {\"gesture\": \""+id+"\"}}";
	//console.log("clicked event "+sendText);
	publishData(sendText);
	//console.log("gesture selected : "+id);
}

/* hand selectorの結果、画像を変える */
function handSelected(id) {
	console.log("hand select : "+currenthandgesture +" to "+id);
	currenthandgesture = id;
	var handImg = document.getElementById("handImg");
	handImg.src = "./pics/gestures/"+id+"-right.svg";
	
	//ui.jas
	handPics.src = "./pics/gestures/"+id+"-oncanvas.svg";
		
	//gamecontroller ui
	hansSelect(currenthandgesture);
}

function getHand(){
	return currenthandgesture;
}

//handButtonsのindex+nextCountに移動
function handChange(nextCount){
	var handImgs = document.getElementsByName("handgesture");
	var currentIndex = 0;
	for(var i = 0; i<handImgs.length; i++){
		if(handImgs[i].getAttribute("handpose") == currenthandgesture){
			currentIndex = i;
		}
	}
	var nextIndex = currentIndex+nextCount;
	if(nextIndex >= handImgs.length){
		nextIndex = 0;
	} else if(nextIndex < 0){
		nextIndex = handImgs.length-1;
	}
	handSelected(handImgs[nextIndex].getAttribute("handpose"));
}

function faceSelected(id) {
	console.log("face select : "+id);
	var faceImg = document.getElementById("faceImg");
	if(id == "auto"){
		faceImg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-emoji-neutral" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M4 10.5a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 0-1h-7a.5.5 0 0 0-.5.5zm3-4C7 5.672 6.552 5 6 5s-1 .672-1 1.5S5.448 8 6 8s1-.672 1-1.5zm4 0c0-.828-.448-1.5-1-1.5s-1 .672-1 1.5S9.448 8 10 8s1-.672 1-1.5z"/></svg>';
		sendMood();
	} else if(id == "positive"){
		faceImg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-emoji-smile" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M4.285 9.567a.5.5 0 0 1 .683.183A3.498 3.498 0 0 0 8 11.5a3.498 3.498 0 0 0 3.032-1.75.5.5 0 1 1 .866.5A4.498 4.498 0 0 1 8 12.5a4.498 4.498 0 0 1-3.898-2.25.5.5 0 0 1 .183-.683zM7 6.5C7 7.328 6.552 8 6 8s-1-.672-1-1.5S5.448 5 6 5s1 .672 1 1.5zm4 0c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S9.448 5 10 5s1 .672 1 1.5z"/></svg>';
		sendEmotionHappy();
	} else if(id == "negative"){
		faceImg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-emoji-frown" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M4.285 12.433a.5.5 0 0 0 .683-.183A3.498 3.498 0 0 1 8 10.5c1.295 0 2.426.703 3.032 1.75a.5.5 0 0 0 .866-.5A4.498 4.498 0 0 0 8 9.5a4.5 4.5 0 0 0-3.898 2.25.5.5 0 0 0 .183.683zM7 6.5C7 7.328 6.552 8 6 8s-1-.672-1-1.5S5.448 5 6 5s1 .672 1 1.5zm4 0c0 .828-.448 1.5-1 1.5s-1-.672-1-1.5S9.448 5 10 5s1 .672 1 1.5z"/></svg>';
		sendEmotionBad();
	} else {
		console.log("unknown face type : "+id);
	}
}

function teleopeModeSelected(id){
	console.log("teleopemode select : "+id);
	var teleopeImg = document.getElementById("teleopeImg");
	if(id == "auto"){
		teleopeImg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-robot" viewBox="0 0 16 16"><path d="M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5ZM3 8.062C3 6.76 4.235 5.765 5.53 5.886a26.58 26.58 0 0 0 4.94 0C11.765 5.765 13 6.76 13 8.062v1.157a.933.933 0 0 1-.765.935c-.845.147-2.34.346-4.235.346-1.895 0-3.39-.2-4.235-.346A.933.933 0 0 1 3 9.219V8.062Zm4.542-.827a.25.25 0 0 0-.217.068l-.92.9a24.767 24.767 0 0 1-1.871-.183.25.25 0 0 0-.068.495c.55.076 1.232.149 2.02.193a.25.25 0 0 0 .189-.071l.754-.736.847 1.71a.25.25 0 0 0 .404.062l.932-.97a25.286 25.286 0 0 0 1.922-.188.25.25 0 0 0-.068-.495c-.538.074-1.207.145-1.98.189a.25.25 0 0 0-.166.076l-.754.785-.842-1.7a.25.25 0 0 0-.182-.135Z"/><path d="M8.5 1.866a1 1 0 1 0-1 0V3h-2A4.5 4.5 0 0 0 1 7.5V8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1v-.5A4.5 4.5 0 0 0 10.5 3h-2V1.866ZM14 7.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.5A3.5 3.5 0 0 1 5.5 4h5A3.5 3.5 0 0 1 14 7.5Z"/></svg>';
		sendAutoTeleopeMode();
		currentTeleopeMode = "auto";
	} else if(id == "semi-auto"){
		teleopeImg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person-fill-gear" viewBox="0 0 16 16"><path d="M11 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-9 8c0 1 1 1 1 1h5.256A4.493 4.493 0 0 1 8 12.5a4.49 4.49 0 0 1 1.544-3.393C9.077 9.038 8.564 9 8 9c-5 0-6 3-6 4Zm9.886-3.54c.18-.613 1.048-.613 1.229 0l.043.148a.64.64 0 0 0 .921.382l.136-.074c.561-.306 1.175.308.87.869l-.075.136a.64.64 0 0 0 .382.92l.149.045c.612.18.612 1.048 0 1.229l-.15.043a.64.64 0 0 0-.38.921l.074.136c.305.561-.309 1.175-.87.87l-.136-.075a.64.64 0 0 0-.92.382l-.045.149c-.18.612-1.048.612-1.229 0l-.043-.15a.64.64 0 0 0-.921-.38l-.136.074c-.561.305-1.175-.309-.87-.87l.075-.136a.64.64 0 0 0-.382-.92l-.148-.045c-.613-.18-.613-1.048 0-1.229l.148-.043a.64.64 0 0 0 .382-.921l-.074-.136c-.306-.561.308-1.175.869-.87l.136.075a.64.64 0 0 0 .92-.382l.045-.148ZM14 12.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z"/></svg>';
		sendSemiAutoTeleopeMode();
		currentTeleopeMode = "semi-auto";
	} else if(id == "manual"){
		teleopeImg.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person-hearts" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M11.5 1.246c.832-.855 2.913.642 0 2.566-2.913-1.924-.832-3.421 0-2.566ZM9 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-9 8c0 1 1 1 1 1h10s1 0 1-1-1-4-6-4-6 3-6 4Zm13.5-8.09c1.387-1.425 4.855 1.07 0 4.277-4.854-3.207-1.387-5.702 0-4.276ZM15 2.165c.555-.57 1.942.428 0 1.711-1.942-1.283-.555-2.281 0-1.71Z"/></svg>';
		sendManualTeleopeMode();
		currentTeleopeMode = "manual";
	} else {
		console.log("unknown teleope type : "+id);
	}
}

function openAnalogGestureWindow(){
	var obj_window = window.open("AnalogGestureWindow.html","","width="+600+",height="+300+"scrollbars=no");
	subWindows.push(obj_window);
}

function leftHandAnalogGestureStart(xRatio, yRatio){
	//console.log("leftHandAnalogGestureStart @"+xRatio+"/"+yRatio);
	var eventName = "leftHandAnalogGestureStart";		
	var sendText = "{\"peerid\": \""+document.getElementById("myuserid").value+"\", \""+eventName+"\": {\"xratio\":"+xRatio+", \"yratio\": "+yRatio+", \"hand\": \""+currenthandgesture+"\"}}";
	//console.log("clicked event "+sendText);
	publishData(sendText);
}
function leftHandAnalogGestureMove(xRatio, yRatio){
	//console.log("leftHandAnalogGestureMove @"+xRatio+"/"+yRatio);
	var eventName = "leftHandAnalogGestureMove";		
	var sendText = "{\"peerid\": \""+document.getElementById("myuserid").value+"\", \""+eventName+"\": {\"xratio\":"+xRatio+", \"yratio\": "+yRatio+", \"hand\": \""+currenthandgesture+"\"}}";
	//console.log("clicked event "+sendText);
	publishData(sendText);
}
function leftHandAnalogGestureEnd(){
	//console.log("leftHandAnalogGestureEnd");
	var eventName = "leftHandAnalogGestureEnd";		
	var sendText = "{\"peerid\": \""+document.getElementById("myuserid").value+"\", \""+eventName+"\": {\"hand\": \""+currenthandgesture+"\"}}";
	//console.log("clicked event "+sendText);
	publishData(sendText);
}
function rightHandAnalogGestureStart(xRatio, yRatio){
	//console.log("rightHandAnalogGestureStart @"+xRatio+"/"+yRatio);
	var eventName = "rightHandAnalogGestureStart";		
	var sendText = "{\"peerid\": \""+document.getElementById("myuserid").value+"\", \""+eventName+"\": {\"xratio\":"+xRatio+", \"yratio\": "+yRatio+", \"hand\": \""+currenthandgesture+"\"}}";
	//console.log("clicked event "+sendText);
	publishData(sendText);
}
function rightHandAnalogGestureMove(xRatio, yRatio){
	//console.log("rightHandAnalogGestureMove @"+xRatio+"/"+yRatio);
	var eventName = "rightHandAnalogGestureMove";		
	var sendText = "{\"peerid\": \""+document.getElementById("myuserid").value+"\", \""+eventName+"\": {\"xratio\":"+xRatio+", \"yratio\": "+yRatio+", \"hand\": \""+currenthandgesture+"\"}}";
	//console.log("clicked event "+sendText);
	publishData(sendText);
}
function rightHandAnalogGestureEnd(){
	//console.log("rightHandAnalogGestureEnd");
	var eventName = "rightHandAnalogGestureEnd";		
	var sendText = "{\"peerid\": \""+document.getElementById("myuserid").value+"\", \""+eventName+"\": {\"hand\": \""+currenthandgesture+"\"}}";
	//console.log("clicked event "+sendText);
	publishData(sendText);
}

function optionalButtonClicked(buttonObjId){
	//console.log(buttonObjId);
	console.log("optionalcommand="+buttonObjId.getAttribute('jsondata'));
	//command
	var sendText = "optionalcommand="+buttonObjId.getAttribute('jsondata');
	publishData(sendText);
}

function sendEmotionHappy(){
	var sendText = "optionalcommand="+"{\"id\":\"emotion_happy\",\"label\":\"emotion_happy\",\"type\":\"internalstate\",\"internalstatetype\":\"emotion\",\"isrelative\":false,\"arousal\":0.5,\"valence\":0.5,\"dominance\":0,\"changeduration\":0}";
	publishData(sendText);
}
function sendEmotionBad(){
	var sendText = "optionalcommand="+"{\"id\":\"emotion_bad\",\"label\":\"emotion_bad\",\"type\":\"internalstate\",\"internalstatetype\":\"emotion\",\"isrelative\":false,\"arousal\":-0.3,\"valence\":-0.2,\"dominance\":0,\"changeduration\":500}";
	publishData(sendText);
}
function sendEmotion(arousal, valence){
	var sendText = "optionalcommand="+"{\"id\":\"emotion_manual\",\"label\":\"emotion_manual\",\"type\":\"internalstate\",\"internalstatetype\":\"emotion\",\"isrelative\":false,\"arousal\":"+arousal+",\"valence\":"+valence+",\"dominance\":0,\"changeduration\":500}";
	publishData(sendText);
}
function sendMood(){
	var sendText = "optionalcommand="+"{\"id\":\"autoemotion\",\"label\":\"autoemotion\",\"type\":\"internalstate\",\"internalstatetype\":\"emotion\",\"autoemotion\":true}";
	publishData(sendText);
}

function sendAttractiveness(attractiveness){
	var sendText = "optionalcommand="+"{\"id\":\"attractiveness_manual\",\"label\":\"attractiveness_manual\",\"type\":\"internalstate\",\"internalstatetype\":\"attractiveness\",\"isrelative\":false,\"attractiveness\":"+attractiveness+",\"changeduration\":500}";
	publishData(sendText);
}

function sendAttractivenessIncrease(){
	var sendText = "optionalcommand="+"{\"id\":\"attractiveness_increase\",\"label\":\"attractiveness_increase\",\"type\":\"internalstate\",\"internalstatetype\":\"attractiveness\",\"isrelative\":true,\"attractiveness\":0.2,\"changeduration\":500}";
	publishData(sendText);
}
function sendAttractivenessDecrease(){
	var sendText = "optionalcommand="+"{\"id\":\"attractiveness_decrease\",\"label\":\"attractiveness_decrease\",\"type\":\"internalstate\",\"internalstatetype\":\"attractiveness\",\"isrelative\":true,\"attractiveness\":-0.2,\"changeduration\":1000}";
	publishData(sendText);
}

function sendAutoTeleopeMode(){
	//ic制御のため
	var sendText = "optionalcommand="+"{\"id\":\"teleoperation_end\",\"label\":\"teleoperation_end\",\"type\":\"workingmemory\",\"scope\":\"interaction\",\"name\":\"teleoperation_end\",\"string\":\"end\"}";
	publishData(sendText);
	//teleexistance appで状態制御のため
	sendText = "optionalcommand="+"{\"id\":\"teleopemode\",\"label\":\"teleopemode\",\"type\":\"workingmemory\",\"scope\":\"interaction\",\"name\":\"teleopemode\",\"string\":\"auto\"}";
	publishData(sendText);
}
function sendManualTeleopeMode(){
	//ic制御のため
	var sendText = "optionalcommand="+"{\"id\":\"teleoperation_start\",\"label\":\"teleoperation_start\",\"type\":\"workingmemory\",\"scope\":\"interaction\",\"name\":\"teleoperation_start\",\"string\":\"start\"}";
	publishData(sendText);
	//teleexistance appで状態制御のため
	sendText = "optionalcommand="+"{\"id\":\"teleopemode\",\"label\":\"teleopemode\",\"type\":\"workingmemory\",\"scope\":\"interaction\",\"name\":\"teleopemode\",\"string\":\"manual\"}";
	publishData(sendText);
}

function sendSemiAutoTeleopeMode(){
	//teleexistance appで状態制御のため
	var sendText = "optionalcommand="+"{\"id\":\"teleopemode\",\"label\":\"teleopemode\",\"type\":\"workingmemory\",\"scope\":\"interaction\",\"name\":\"teleopemode\",\"string\":\"semi-auto\"}";
	publishData(sendText);
}

//繋がったときに現状を送る
function sendCurrentTeleopeMode(){
	if(currentTeleopeMode == "auto"){
		sendAutoTeleopeMode();
	} else if(id == "semi-auto"){
		sendSemiAutoTeleopeMode();
	} else if(id == "manual"){
		sendManualTeleopeMode();
	} else {
	}
}

var wSocket = null;
var wSocketIsConnected = false;
function websocketConnect(url){
	//var url = document.getElementById('socket_url').value;
	console.log("clicked "+url);
	if(wSocket == null){
		wSocket = new WebSocket(url);
		//接続通知
		wSocket.onopen = function(event) {
			console.log("socket established");
			wSocketIsConnected = true;
			setWebsocketButton(false);
			if(autoconnectFlag){
				if(autoconnectTimer != null){
					clearInterval(autoconnectTimer);
					autoconnectTimer = null;
				}
			}
			//document.getElementById('socket_connect_button').innerHTML = "<font size='2'>disconnect</font>";
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
			console.log(error);
			setWebsocketButton(true);
			//wSocketIsConnected = false;
		};
		
		//メッセージ受信
		wSocket.onmessage = function(event) {
			//console.log(event.data);
			//publishData("socket="+event.data);
			publishData(event.data);
			//相手を選べるようにしておくと良いかも？ex, hi=***でユーザ名がログインしているならそいつだけに送るとか
		};
		
		//切断
		wSocket.onclose = function() {
			console.log("closed socket");
			wSocket = null;
			wSocketIsConnected = false;
			//option.js
			setWebsocketButton(true);
			if(autoconnectFlag){
				if(autoconnectTimer == null){//try to connect後失敗してもここに来るから
					autoconnectTimer = setInterval(function () {
						clickWebsocketButton();
					}, 10000);
				}
			}
			//document.getElementById('socket_connect_button').innerHTML = "<font size='2'>connect</font>";
		};
		console.log("connected to "+url);
	} else {
		if(wSocket.readyState == 1){
			wSocket.close();
			console.log("close socket");
			wSocket = null;
			wSocketIsConnected = false;
		}
	}
}

var autoconnectTimer = null;
var autoconnectFlag = false;
function autoConnect(onoff){
	autoconnectFlag = onoff;
	if(onoff){
		if(!wSocketIsConnected){
			if(autoconnectTimer == null){
				autoconnectTimer = setInterval(function () {
					clickWebsocketButton();
				}, 10000);
			}
		}
	} else {
		if(autoconnectTimer != null){
			clearInterval(autoconnectTimer);
			autoconnectTimer = null;
		}
	}
}

//selectbehavior
//排他処理ってどうなるの？
var requestQueu = new Array();
var requestTimeout = null;
var timeoutCounter = 0;
//clearTimeout(requestTimeout);
var currentRequest = null;
var requestModal = null;

function requestBehavor(){
	if(requestQueu.length == 0){
		return;
	}
	currentRequest = requestQueu[0];
	if(currentRequest.selectobjs != null){
		var operateModal = document.getElementById("requestSelectModal");
		if(operateModal != null){
			var requestModalLabel = document.getElementById("requestSelectModalLabel");
			if(currentRequest.description != null){
				requestModalLabel.innerHTML = currentRequest.description;
			} else {
				requestModalLabel.innerHTML = "Select";
			}
			var canncelButton = document.getElementById("canncelButtonSelectRequest");
			canncelButton.innerHTML = "Cancel";
			
			var bodyDiv = document.getElementById("requestSelectModalBody");
			while(bodyDiv.lastChild){
				bodyDiv.removeChild(bodyDiv.lastChild);
			}
			
			for(var i = 0; i<currentRequest.selectobjs.length; i++){
				var container = document.createElement("div");
				container.setAttribute("class", "mb-3");
				
				if(currentRequest.selectobjs[i].type != null && currentRequest.selectobjs[i].type == "input"){
					var selectButton = document.createElement("button");
					selectButton.setAttribute("type", "button");
					if(currentRequest.selectobjs[i].infolevel != null){
						selectButton.setAttribute("class", "btn btn-"+currentRequest.selectobjs[i].infolevel);
					} else {
						selectButton.setAttribute("class", "btn btn-info");
					}
					//selectButton.setAttribute("data-bs-dismiss", "modal");
					selectButton.setAttribute("name", "operatorselect");
					//selectButton.setAttribute("onclick", "selectBehavior(this)");
					selectButton.setAttribute("id", "selectrequestbutton-"+currentRequest.selectobjs[i].id);
					selectButton.setAttribute("requestid", currentRequest.selectobjs[i].id);
					selectButton.innerHTML = currentRequest.selectobjs[i].label;
					//selectButton.disabled = true;
					
					var selectLabel = document.createElement("label");
					selectLabel.setAttribute("class", "form-label");
					selectLabel.innerHTML = currentRequest.selectobjs[i].description;
					
					var inputReq = document.createElement("input");
					inputReq.setAttribute("type", "text");
					inputReq.setAttribute("class", "form-control");
					inputReq.setAttribute("autocomplete", "off");
					
					inputReq.setAttribute("name", "operatorinput");
					inputReq.setAttribute("requestid", currentRequest.selectobjs[i].id);
					//inputReq.innerHTML = currentRequest.selectobjs[i].label;
					inputReq.onkeypress = (e) => {
						const key = e.keyCode || e.charCode || 0;
						//console.log(key+" "+inputReq.value);
						// 13はEnterキーのキーコード
						if (key == 13) {
							var buttonElement = document.getElementById("selectrequestbutton-"+inputReq.getAttribute("requestid"));
							if(buttonElement != null){
								buttonElement.click();
							}
						}
						/*
						if(inputReq.value == ""){
							selectButton.disabled = true;
						} else {
							selectButton.disabled = false;
						}
						*/
						//selectButton.disabled = false;
					}
					
					container.appendChild(selectButton);
					container.appendChild(selectLabel);
					container.appendChild(inputReq);
					selectButton.addEventListener("click", function() {
						//console.log(this.innerHTML +" clicked");
						if(inputReq.value != ""){
							var myModal = bootstrap.Modal.getInstance(operateModal);
							myModal.hide();
							this.setAttribute("inputvalue", inputReq.value);
							selectBehavior(this);
						} else {
							alert("input : "+this.innerHTML);
						}
					});
					bodyDiv.appendChild(container);
				} else {
					var selectButton = document.createElement("button");
					selectButton.setAttribute("type", "button");
					if(currentRequest.selectobjs[i].infolevel != null){
						selectButton.setAttribute("class", "btn btn-"+currentRequest.selectobjs[i].infolevel);
					} else {
						selectButton.setAttribute("class", "btn btn-info");
					}
					selectButton.setAttribute("data-bs-dismiss", "modal");
					selectButton.setAttribute("name", "operatorselect");
					selectButton.setAttribute("onclick", "selectBehavior(this)");
					selectButton.setAttribute("requestid", currentRequest.selectobjs[i].id);
					selectButton.innerHTML = currentRequest.selectobjs[i].label;
					
					var selectLabel = document.createElement("label");
					selectLabel.setAttribute("class", "form-label");
					selectLabel.innerHTML = currentRequest.selectobjs[i].description;
					
					container.appendChild(selectButton);
					container.appendChild(selectLabel);
					bodyDiv.appendChild(container);
				}
				
			}
			
			requestModal = new bootstrap.Modal(operateModal, {backdrop: "static"});
			requestModalOpenSound.currentTime = 0;
			requestModalOpenSound.play();
			requestModal.show();
			
			if(currentRequest.timeout != null){
				timeoutCounter = 0;
				if(currentRequest.timeout < 0){
				} else {
					requestTimeout = setInterval(function () {
						timeoutCounter ++;
						if(timeoutCounter >= currentRequest.timeout){
							canncelButton.click();
						} else {
							canncelButton.innerHTML = "Cancel(timeout:"+(currentRequest.timeout-timeoutCounter)+" sec)";
						}
					}, 1000);
				}
			}
		}
	} else if(currentRequest.inputobjs != null){
		var operateModal = document.getElementById("requestInputModal");
		if(operateModal != null){
			var requestModalLabel = document.getElementById("requestInputModalLabel");
			if(currentRequest.description != null){
				requestModalLabel.innerHTML = currentRequest.description;
			} else {
				requestModalLabel.innerHTML = "Input";
			}
			var canncelButton = document.getElementById("canncelButtonInputRequest");
			canncelButton.innerHTML = "Cancel";
			
			var bodyDiv = document.getElementById("requestInputModalBody");
			while(bodyDiv.lastChild){
				bodyDiv.removeChild(bodyDiv.lastChild);
			}
			
			for(var i = 0; i<currentRequest.inputobjs.length; i++){
				var container = document.createElement("div");
				container.setAttribute("class", "mb-3");
				
				var inputReq = document.createElement("input");
				inputReq.setAttribute("type", "text");
				inputReq.setAttribute("class", "form-control");
				inputReq.setAttribute("autocomplete", "off");
					
				inputReq.setAttribute("name", "operatorinput");
				inputReq.setAttribute("requestid", currentRequest.inputobjs[i].id);
				inputReq.innerHTML = currentRequest.inputobjs[i].label;
				
				var inputLabel = document.createElement("label");
				inputLabel.setAttribute("class", "form-label");
				inputLabel.innerHTML = currentRequest.inputobjs[i].description;
				
				container.appendChild(inputLabel);
				container.appendChild(inputReq);
				bodyDiv.appendChild(container);
				
			}
			
			requestModal = new bootstrap.Modal(operateModal, {backdrop: "static"});
			requestModalOpenSound.currentTime = 0;
			requestModalOpenSound.play();
			requestModal.show();
			
			if(currentRequest.timeout != null){
				timeoutCounter = 0;
				if(currentRequest.timeout < 0){
				} else {
					requestTimeout = setInterval(function () {
						timeoutCounter ++;
						if(timeoutCounter >= currentRequest.timeout){
							canncelButton.click();
						} else {
							canncelButton.innerHTML = "Cancel(timeout:"+(currentRequest.timeout-timeoutCounter)+" sec)";
						}
					}, 1000);
				}
			}
		}
	} else {
		console.log("wrong request : "+currentRequest);
		doneRequest();
	}
}

function doneRequest(){
	requestModal = null;
	requestQueu.shift();
	if(requestQueu.length > 0){
		requestBehavor();
	}
}

function selectBehavior(selectedButton){
	//console.log(currentRequest.userid + " " + selectedButton.getAttribute("requestid"));
	//var jsonObj = JSON.parse(cmds);
	answerRequestSound.currentTime = 0;
	answerRequestSound.play();
			
	if(requestTimeout != null){
		clearTimeout(requestTimeout);
		requestTimeout = null;
	}
	var answerData = {selectdata:selectedButton.getAttribute("requestid")};
	if(selectedButton.hasAttribute("inputvalue")){
		answerData.inputvalue = selectedButton.getAttribute("inputvalue");
	}
	sendData(currentRequest.userid, "answerrequest="+JSON.stringify(answerData));
	//操作者陪席アバタにも送信
	if(wSocketIsConnected){
		wSocket.send("answerrequest="+JSON.stringify(answerData));
	}
	doneRequest();
}

function canncelSelectRequest(){
	//console.log("canncelSelectRequest "+currentRequest.userid);
	cancelRequestSound.currentTime = 0;
	cancelRequestSound.play();
	
	if(requestTimeout != null){
		clearTimeout(requestTimeout);
		requestTimeout = null;
	}
	sendData(currentRequest.userid, "cancelrequest");
	//操作者陪席アバタにも送信
	if(wSocketIsConnected){
		wSocket.send("cancelrequest");
	}
	doneRequest();
	/*
	var operateModal = document.getElementById("operateModal");
	var myModal = bootstrap.Modal.getInstance(operateModal);
	myModal.hide();
	*/
}

//close modal and if has more request open nect
function skipBehavor(){
	if(requestModal != null){
		requestModal.hide();
	}
	cancelRequestSound.currentTime = 0;
	cancelRequestSound.play();
	
	if(requestTimeout != null){
		clearTimeout(requestTimeout);
		requestTimeout = null;
	}
	doneRequest();
}

function answerRequest(){
	answerRequestSound.currentTime = 0;
	answerRequestSound.play();
	
	var operatorInputElements = document.getElementsByName("operatorinput");
	var answerData = {"answerdata":[]};
	for(var i = 0; i<operatorInputElements.length; i++){
		console.log("input : "+operatorInputElements[i].value + " " +currentRequest.userid);
		var key = operatorInputElements[i].getAttribute("requestid");
		var value = operatorInputElements[i].value;
		console.log(key + " " +value);
		var inputElement = JSON.parse('{"'+key+'" : "'+value+'"}');
		answerData.answerdata.push(inputElement);
	}
	console.log(answerData);
	sendData(currentRequest.userid, "answerrequest="+JSON.stringify(answerData));
	//操作者陪席アバタにも送信
	if(wSocketIsConnected){
		wSocket.send("answerrequest="+JSON.stringify(answerData));
	}
	//var jsonObj = JSON.parse(cmds);
	var operateModal = document.getElementById("requestInputModal");
	var myModal = bootstrap.Modal.getInstance(operateModal);
	myModal.hide();
	if(requestTimeout != null){
		clearTimeout(requestTimeout);
		requestTimeout = null;
	}
	doneRequest();
}

function canncelInputRequest(){
	//console.log("canncelInputRequest "+currentRequest.userid);
	cancelRequestSound.currentTime = 0;
	cancelRequestSound.play();
	
	if(requestTimeout != null){
		clearTimeout(requestTimeout);
		requestTimeout = null;
	}
	sendData(currentRequest.userid, "cancelrequest");
	//操作者陪席アバタにも送信
	if(wSocketIsConnected){
		wSocket.send("cancelrequest");
	}
	doneRequest();
	/*
	var operateModal = document.getElementById("operateModal");
	var myModal = bootstrap.Modal.getInstance(operateModal);
	myModal.hide();
	*/
}

//call on ui.js, selectbehaviordata on peerid's video
/*
//not used
function selectBehavior(peerid, behaviordata){
	sendData(peerid, "selectbehavior="+behaviordata);
	//操作者陪席アバタにも送信
	if(wSocketIsConnected){
		wSocket.send("selectbehavior="+behaviordata);
	}
}
*/

function soundInfo(soundType, volume){
	//volume 0-1を対数
	volume = Math.pow(10, (volume*2-1))/10;
	//console.log(volume);
	if(soundType == "newtype"){
		newtypeSound.currentTime = 0;
		newtypeSound.volume = volume;
		newtypeSound.play();
	} else if(soundType == "info"){
		infoSound.currentTime = 0;
		infoSound.volume = volume;
		infoSound.play();
	} else if(soundType == "warning"){
		warningSound.currentTime = 0;
		warningSound.volume = volume;
		warningSound.play();
	} else{
		console.warn("not found sound type : "+soundType);
	}
}

function getData(fromPeerID, receiveText, dataConnection){
	//console.log(fromPeerID+ " : " + receiveText);
	if(wSocketIsConnected){
		wSocket.send(receiveText);
	}
	var myPeerID = document.getElementById("myuserid");
	if(receiveText.startsWith("numvideo")){
		/*
		if(sharingScreenStream != null){
			//こっちはsharescreenしているフラグ
			sendData(fromPeerID, "sharingscreen=true");
		} else {
			sendData(fromPeerID, "sharingscreen=false");
		}
		*/
		if(localMixedStream == null){
			makeLocalStream();
		}
		var cmds = receiveText.split('=');
		var remotenumvideo = parseInt(cmds[1]);
		if(localMixedStream.getVideoTracks().length >= remotenumvideo){
			mediaCall(fromPeerID);
		} else {
			//dataConnection.send("numvideo="+localMixedStream.getVideoTracks().length);
			sendData(fromPeerID, "numvideo="+localMixedStream.getVideoTracks().length);
		}
	}
	/* else if(receiveText.startsWith("sharingscreen=")){
		//console.log(receiveText);
		var cmds = receiveText.slice(14);
		if(cmds.toLowerCase() == "true"){
			remotePeerIDSharingscreenFlagMap.set(fromPeerID, true);
		} else {
			remotePeerIDSharingscreenFlagMap.set(fromPeerID, false);
		}
		//console.log(cmds.toLowerCase()+" "+remotePeerIDSharingscreenFlagMap.get(fromPeerID));
	} */
	else if(receiveText.startsWith("drawoncanvas=")){
		//draw on canvas
		var cmds = receiveText.slice(13);
		updateActionPointOnCanvas(cmds);
	} else if(receiveText.startsWith("request=")){
		//open select behaivor modal
		var cmds = receiveText.slice(8);
		console.log("request "+cmds);
		if(answerRequest){
			var requestElement = JSON.parse(cmds);
			requestElement.userid =  fromPeerID;
			console.log(requestElement);
			requestQueu.push(requestElement);
			if(requestQueu.length == 1){
				if(answerRequest){
					requestBehavor();
				}
			} else {
				stackRequestSound.currentTime = 0;
				stackRequestSound.play();
				alert(requestElement.userid +" requests teleoperation!");
				console.log("stack request at "+requestQueu.length+" : "+requestElement);
			}
		} else {
			console.log("ignore request "+cmds);
		}
	} else if(receiveText.startsWith("answerrequest=")){
		//requestの答えを受信, cancelrequest, answerrequest
		//複数人で1台のアバタを操作したときに他の人が答えたらその他の入力待ちを解除する
		var cmds = receiveText.slice(14);
		console.log("someoneanswered="+receiveText);
		publishData("someoneanswered="+receiveText);
	} else if(receiveText.startsWith("cancelrequest")){
		//requestの答えを受信, cancelrequest
		//複数人で1台のアバタを操作したときに他の人が答えたらその他の入力待ちを解除する
		console.log("someoneanswered=cancelrequest");
		publishData("someoneanswered=cancelrequest");
	} else if(receiveText.startsWith("someoneanswered=")){
		//複数人で1台のアバタを操作したときに他の人が答えたらその他の入力待ちを解除する
		var cmds = receiveText.slice(16);
		//console.log("request "+cmds);
		if(requestQueu.length > 0){
			//誰かが答えたので次のリクへストへ
			if(answerRequest){
				skipBehavor();
			}
		} else {
		}
	} else if(receiveText.startsWith("sound=")){
		//音を鳴らす
		var cmds = receiveText.slice(6);
		console.log("sound="+cmds);
		var soundCmd = JSON.parse(cmds);
		var soundVolume = 1;
		if(soundCmd.soundVolume != null){
			if(soundCmd.soundVolume >=0 && soundCmd.soundVolume <= 1){
				soundVolume = soundCmd.soundVolume;
			}
		}
		if(soundCmd.soundType != null){
			soundInfo(soundCmd.soundType, soundVolume);
		} else {
			console.warn(cmds +" does not have soundType node");
		}
	} else if(receiveText.startsWith("socket=")){
		//not used
		/*
		var cmds = receiveText.slice(7);
		if(wSocket != null){
			wSocket.send(cmds);
		}
		*/
	} else if(receiveText.startsWith("tts=")){
		//for external system
	} else if(receiveText.startsWith("optionalcommand=")){
		//for external system
	} else if(receiveText.startsWith("chat=")){
		var cmds = receiveText.slice(5);
		if(cmds.startsWith("forcelogout=")){
			var logoutid = cmds.slice(12);
			console.log("force logout command = "+logoutid);
			if(logoutid == myPeerID.value){
				forceLogout();
			}
		} else {
			openChatView();
			recvChatMessage(cmds, fromPeerID);
		}
	}
}
