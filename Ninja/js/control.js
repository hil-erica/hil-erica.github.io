function clickSay(){
	var textEmenent = document.getElementById("saytext");
	if(textEmenent.value  != ""){
		console.log("say : "+textEmenent.value);
		
		var sendText = "tts={\"tts\": \""+textEmenent.value+"\"}";
		publishData(sendText);
		
		textEmenent.value="";
	}
}

function selectBehavior(selectedData){
	console.log("selected behavior: "+selectedData.getAttribute("value"));
}

function canncelBehavior(){
	console.log("no selected behavior");
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
function sendMood(){
	var sendText = "optionalcommand="+"{\"id\":\"autoemotion\",\"label\":\"autoemotion\",\"type\":\"internalstate\",\"internalstatetype\":\"emotion\",\"autoemotion\":true}";
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


var wSocket = null;
function websocketConnect(url){
	//var url = document.getElementById('socket_url').value;
	console.log("clicked "+url);
	if(wSocket == null){
		wSocket = new WebSocket(url);
		//接続通知
		wSocket.onopen = function(event) {
			console.log("open socket "+event.data);
			setWebsocketButton(false);
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
			console.log(error.data);
			setWebsocketButton(true);
		};
		
		//メッセージ受信
		wSocket.onmessage = function(event) {
			//console.log(event.data);
			publishData("socket="+event.data);
			//相手を選べるようにしておくと良いかも？ex, hi=***でユーザ名がログインしているならそいつだけに送るとか
		};
		
		//切断
		wSocket.onclose = function() {
			console.log("closed socket");
			wSocket = null;
			//option.js
			setWebsocketButton(true);
			//document.getElementById('socket_connect_button').innerHTML = "<font size='2'>connect</font>";
		};
		console.log("connected to "+url);
	} else {
		if(wSocket.readyState == 1){
			wSocket.close();
			console.log("close socket");
		}
	}
}

function getData(fromPeerID, receiveText, dataConnection){
	//console.log(fromPeerID+ " : " + receiveText);
	var myPeerID = document.getElementById("myuserid");
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
	} else if(receiveText.startsWith("drawoncanvas=")){
		//draw on canvas
		var cmds = receiveText.slice(13);
		updateActionPointOnCanvas(cmds);
	} else if(receiveText.startsWith("selectbahavior=")){
		//open select behaivor modal
		var cmds = receiveText.slice(15);
		
	}  else if(receiveText.startsWith("socket=")){
		var cmds = receiveText.slice(7);
		if(wSocket != null){
			wSocket.send(cmds);
		}
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
