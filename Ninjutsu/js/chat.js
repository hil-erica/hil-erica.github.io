/*https://github.com/riversun/JSFrame.js*/
var userFrame;
var jsFrame;
var appearance;
var userCounter=0;
var isShow = false;
var predefinedRemoteUser = new Array();

//users on UI
var chatUserList = new Array();

function openChatView(){
	if(!isShow){
		openCommunication();
	}
	userFrame.$('#chattab-tab').click();
}

function initializeJSFrame(){
	jsFrame = new JSFrame();
	appearance = jsFrame.createFrameAppearance();
	//console.log(jsFrame.id+" "+appearance.id);
}

function initializeCommunication() {
	openCommunication();
	userFrame.hide();
	isShow = false;
}

function openCommunication() {
	//const jsFrame = new JSFrame();
	//Create appearacne(style,look and feel) object
	
	//var userElement = document.getElementById("userWindow");
	//var newElement = userElement.children[0].cloneNode(true);
	//userElement.appendChild(newElement);
	
	if(userFrame == null){
		//const appearance = jsFrame.createFrameAppearance();
		userFrame = jsFrame.create({
			title: "Users",
			left: 120,
			top: 120,
			width: window.innerWidth*0.5,
			height: window.innerHeight*0.4,
			style: {
				backgroundColor: 'rgba(180,180,180,0.5)',
				overflow: 'hidden'
			},
			appearance: populateOriginalStyle(appearance),
			//html: userElement.innerHTML
			//html: '<div style="padding:10px;height:100%">Createa appearance object from scratch</div>'
			url: 'usercontact.html',//iframe内に表示するURL
			urlLoaded: (_frame) => {
				console.log("loaded chat.html");
				
				//Event handler for buttons on the title bar.
				userFrame.on('#chatinputbutton', 'click', (_frame, evt) => {
					console.log("message:"+userFrame.$('#chatinputtext').value);
					if(userFrame.$('#chatinputtext').value != ""){
						var message = userFrame.$('#chatinputtext').value;
						userFrame.$('#chatinputtext').value = "";
						sendChatMessage(message);
					}
				});
				
				userFrame.on('#adduser', 'click', (_frame, evt) => {
					console.log("add user");
					addUserInterface(null);
					//userFrame.$('#contacttab').appendChild(addUserInterface());
				});
				
				userFrame.on('#chatinputtext', 'keypress', (_frame, evt) => {
					const key = evt.keyCode || evt.charCode || 0;
					// 13はEnterキーのキーコード
					if (key == 13) {
						console.log("enter key:"+userFrame.$('#chatinputtext').value);
						if(userFrame.$('#chatinputtext').value != ""){
							var message = userFrame.$('#chatinputtext').value;
							userFrame.$('#chatinputtext').value = "";
							sendChatMessage(message);
						}
					}
				});
				
				userFrame.$('#myuserid').innerHTML = "My user id: "+document.getElementById("myuserid").value;
				
				for(var i=0; i<predefinedRemoteUser.length;i++){
					addUserInterface(predefinedRemoteUser[i]);
				}
				updateLoginInfo();
			}
			
		});
		
		console.log("frame id:"+userFrame.id);//windowManager_***
		userFrame.show();
		isShow = true;
		userFrame.on('closeButton', 'click', (_frame, evt) => {
		});
		
		userFrame.on('minimizeButton', 'click', (_frame, evt) => {
			console.log("click minimize");
			userFrame.hide();
			isShow = false;
		});		
		
	} else {
		if(isShow){
			userFrame.hide();
			isShow = false;
		} else {
			userFrame.show();
			isShow = true;
		}
	}
}

function clickWindowClose(){
	console.log("window close click");
}

function clickClose(){
	console.log("close click");
}

function addUserInterface(username){
	userCounter ++;
	var inputGroupDiv = document.createElement("div");
	inputGroupDiv.setAttribute("id", "userinterface_"+userCounter);
	inputGroupDiv.setAttribute("class", "input-group mb-1");
	inputGroupDiv.setAttribute("userCounter", userCounter);
	var textInput = document.createElement("input");
	textInput.setAttribute("id", "username_"+userCounter);
	textInput.setAttribute("class", "form-control");
	textInput.setAttribute("placeholder", "username");
	textInput.setAttribute("aria-label", "username");
	textInput.setAttribute("userCounter", userCounter);
	if(username != null){
		textInput.value = username;
	}
	var callButton = document.createElement("button");
	callButton.setAttribute("id", "call_"+userCounter);
	callButton.setAttribute("class", "btn btn-outline-primary");
	callButton.setAttribute("type", "button");
	callButton.innerHTML="Call";
	callButton.setAttribute("userCounter", userCounter);
	callButton.disabled = true;
	callButton.addEventListener( "click", callButtonClicked);
	var removeButton = document.createElement("button");
	removeButton.setAttribute("id", "remove_"+userCounter);
	removeButton.setAttribute("class", "btn btn-outline-secondary");
	removeButton.setAttribute("type", "button");
	removeButton.innerHTML="Remove";
	removeButton.setAttribute("userCounter", userCounter);
	removeButton.addEventListener( "click", removeButtonClicked);
	inputGroupDiv.appendChild(textInput);
	inputGroupDiv.appendChild(callButton);
	inputGroupDiv.appendChild(removeButton);
	userFrame.$('#contacttab').appendChild(inputGroupDiv);
	chatUserList.push(inputGroupDiv);
	return inputGroupDiv;
}

function callButtonClicked(){
	console.log(this.getAttribute("userCounter") +" : call button clicked");
	var userCounter = this.getAttribute("userCounter");
	var callButton = userFrame.$('#call_'+userCounter);
	var removeButton = userFrame.$('#remove_'+userCounter);
	var userInput = userFrame.$('#username_'+userCounter);
	
	var peerID = userInput.value;
	if(callButton.innerHTML.indexOf('Call') >= 0){
		if(callRemoteOne(peerID)){
			callButton.innerHTML="Close";
		} else {
			//console.log("failed to callRemoteOne");
		}
	}else {
		if(closeRemote(peerID)){
		} else {
			//console.log("failed to closeRemote");
		}
		callButton.innerHTML="Call";
	}
}

function removeButtonClicked(){
	console.log(this.getAttribute("userCounter") +" : remove button clicked");
	var inputGroupDiv = userFrame.$('#userinterface_'+this.getAttribute("userCounter"));
	userFrame.$('#contacttab').removeChild(inputGroupDiv);
	var index = chatUserList.indexOf(inputGroupDiv);
	chatUserList.splice(index, 1);
}


function updateLoginInfo(){
	var accessible_list = userFrame.$('#accessible_list');
	var loginmenbers = "";
	for(var j = 0; j < loginUsers.length; j++){
		loginmenbers +=loginUsers[j]+"; ";
	}
	if(accessible_list != null){
		accessible_list.value = loginmenbers;
	} else {
		console.log("accessible_list not generated");
	}
	
	for(var i= 0; i < chatUserList.length; i++){
		var userCounter = chatUserList[i].getAttribute("userCounter");
		var callButton = userFrame.$('#call_'+userCounter);
		var removeButton = userFrame.$('#remove_'+userCounter);
		var userInput = userFrame.$('#username_'+userCounter);
		
		var userLogins = false;
		for(var j = 0; j < loginUsers.length; j++){
			//console.log("check login "+loginUsers[j] +" vs " +userInput.value);
			if(loginUsers[j] == userInput.value){
				//login
				userLogins = true;
				break;
			} else {
			}
		}
		if(userLogins){
			if(callButton.innerHTML.indexOf('Call') >= 0){
				callButton.disabled = false;
			} else {
				//call中
				callButton.disabled = false;
				removeButton.disabled = true;
			}
		} else {
			if(callButton.innerHTML.indexOf('Call') >= 0){
				callButton.disabled = true;
				removeButton.disabled = false;
			} else {
				//call中なのにいない＝異常
			}
		}
	}
}

function updateUserConnect(userCounter, enable){
	var callButton = userFrame.$('#call_'+userCounter);
	var removeButton = userFrame.$('#remove_'+userCounter);
	var userInput = userFrame.$('#username_'+userCounter);
	
	if(enable){		
		callButton.innerHTML = "Call";
		userInput.readOnly = false;
		removeButton.disabled = false;
		
		//remove from chat list
		var chatsendtargetselect = userFrame.$('#tochatselect');
		var options = chatsendtargetselect.options
		for (var i = options.length - 1; 0 <= i; --i) {
			if(options[i].value == userInput.value){
				if(options[i].selected) {
					chatsendtargetselect.selectedIndex = 0;
				}
				chatsendtargetselect.removeChild(options[i]);
				break;
			}
		}
	} else {
		callButton.innerHTML = "Close";
		userInput.readOnly = true;
		removeButton.disabled = true;
		
		//add chat target
		var chatsendtargetselect = userFrame.$('#tochatselect');
		var options = chatsendtargetselect.options
		var foundTarget = false;
		for (var i = options.length - 1; 0 <= i; --i) {
			if(options[i].value == userInput.value){
				foundTarget = true;
				break;
			}
		}
		if(!foundTarget){
			var newElement = new Option( userInput.value, userInput.value) ;
			chatsendtargetselect.add(newElement);
		}
	}
}

function updateConnectUI(remoteUserId, enable){
	console.log(remoteUserId +' to ' + enable);
	var foundUse = false;
	for(var i= 0; i < chatUserList.length; i++){
		var userCounter = chatUserList[i].getAttribute("userCounter");
		var callButton = userFrame.$('#call_'+userCounter);
		var removeButton = userFrame.$('#remove_'+userCounter);
		var userInput = userFrame.$('#username_'+userCounter);
		
		if(userInput.value == remoteUserId){
			updateUserConnect(userCounter, enable);
			foundUse = true;
			break;
		}
		
	}
	if(!foundUse){
		//ないので追加
		//console.log("not found "+remoteUserId);
		var divElement = addUserInterface(remoteUserId);
		var userCounter = divElement.getAttribute("userCounter");
		updateUserConnect(userCounter, enable);
	}
}

function closeAll(){
	for(var i= 0; i < chatUserList.length; i++){
		var userCounter = chatUserList[i].getAttribute("userCounter");
		var callButton = userFrame.$('#call_'+userCounter);
		var removeButton = userFrame.$('#remove_'+userCounter);
		var userInput = userFrame.$('#username_'+userCounter);
		if(callButton.innerHTML.indexOf('Call') >= 0){
			
		} else {
			//disconnect
			callButton.click();
		}
		
	}
}

function sendChatMessage(message){
	var chatsendtargetselect = userFrame.$('#tochatselect');
	if(chatsendtargetselect.selectedIndex == 0){
		//publish
		publishData("chat="+message);
	} else {
		//send
		sendData(chatsendtargetselect.options[chatsendtargetselect.selectedIndex].value, "chat="+message);
	}
	var sendTarget = chatsendtargetselect.options[chatsendtargetselect.selectedIndex].value;
	
	let nowTime = new Date(); //  現在日時を得る
	let nowHour = nowTime.getHours(); // 時間を抜き出す
	let nowMin  = nowTime.getMinutes(); // 分数を抜き出す
	let nowSec  = nowTime.getSeconds(); // 秒数を抜き出す
	var chatResultElement = userFrame.$('#chatresult');
	var messageContainer = document.createElement("div");
	messageContainer.setAttribute("class", "msg right-msg");
	var bubbleContainer = document.createElement("div");
	bubbleContainer.setAttribute("class", "msg-bubble");
	var infoContainer = document.createElement("div");
	infoContainer.setAttribute("class", "msg-info");
	var userElement = document.createElement("div");
	userElement.setAttribute("class", "msg-info-name");
	userElement.innerHTML = document.getElementById("myuserid").value+" -> "+sendTarget;
	var timeElement = document.createElement("div");
	timeElement.setAttribute("class", "msg-info-time");
	timeElement.innerHTML = nowHour + ":" + nowMin;
	var textElement = document.createElement("div");
	textElement.setAttribute("class", "msg-text");
	textElement.innerHTML = message;
	infoContainer.appendChild(userElement);
	infoContainer.appendChild(timeElement);
	bubbleContainer.appendChild(infoContainer);
	bubbleContainer.appendChild(textElement);
	messageContainer.appendChild(bubbleContainer);
	if(chatResultElement.children.length>0){
		chatResultElement.insertBefore(messageContainer, chatResultElement.children[0]);
	} else {
		chatResultElement.appendChild(messageContainer);
	}
}

function recvChatMessage(message, fromUser){
	let nowTime = new Date(); //  現在日時を得る
	let nowHour = nowTime.getHours(); // 時間を抜き出す
	let nowMin  = nowTime.getMinutes(); // 分数を抜き出す
	let nowSec  = nowTime.getSeconds(); // 秒数を抜き出す
	var chatResultElement = userFrame.$('#chatresult');
	var messageContainer = document.createElement("div");
	messageContainer.setAttribute("class", "msg left-msg");
	var bubbleContainer = document.createElement("div");
	bubbleContainer.setAttribute("class", "msg-bubble");
	var infoContainer = document.createElement("div");
	infoContainer.setAttribute("class", "msg-info");
	var userElement = document.createElement("div");
	userElement.setAttribute("class", "msg-info-name");
	userElement.innerHTML = fromUser;
	var timeElement = document.createElement("div");
	timeElement.setAttribute("class", "msg-info-time");
	timeElement.innerHTML = nowHour + ":" + nowMin;
	var textElement = document.createElement("div");
	textElement.setAttribute("class", "msg-text");
	textElement.innerHTML = message;
	infoContainer.appendChild(userElement);
	infoContainer.appendChild(timeElement);
	bubbleContainer.appendChild(infoContainer);
	bubbleContainer.appendChild(textElement);
	messageContainer.appendChild(bubbleContainer);
	if(chatResultElement.children.length>0){
		chatResultElement.insertBefore(messageContainer, chatResultElement.children[0]);
	} else {
		chatResultElement.appendChild(messageContainer);
	}
	//console.log("recvChatMessage");
}
/**
 * Create an original appearance
 * @param apr
 * @returns {*}
 */
function populateOriginalStyle(apr) {
	apr.titleBarCaptionFontSize = '12px';
	apr.titleBarCaptionFontWeight = 'normal';
	apr.titleBarCaptionLeftMargin = '10px';
	apr.titleBarCaptionColorDefault = '#808080';
	apr.titleBarCaptionColorFocused = '#a9a9a9';
	apr.titleBarHeight = '0px';
	apr.titleBarColorDefault = 'white';
	apr.titleBarColorFocused = 'white';
	apr.titleBarBorderBottomDefault = null;
	apr.titleBarBorderBottomFocused = null;
	apr.frameBorderRadius = '6px';
	apr.frameBorderWidthDefault = '4px';
	apr.frameBorderWidthFocused = '4px';
	apr.frameBorderColorDefault = '#ffffff';
	apr.frameBorderColorFocused = '#c0c0c0';//silver
	apr.frameBorderStyle = 'solid';
	apr.frameBoxShadow = '0px 0px 20px rgba(0, 0, 0, 0.3)';
	apr.frameBorderStyle = 'solid';
	apr.frameBackgroundColor =  'rgba(180,180,180,0.5)';
	apr.frameComponents = [];
	apr.frameHeightAdjust = 1;
	apr.onInitialize = function () {
		var partsBuilder = apr.getPartsBuilder();
		var btApr = partsBuilder.buildTextButtonAppearance();
		btApr.width = 20;
		btApr.height = 20;
		btApr.borderRadius = 10;
		btApr.borderWidth = 1;
		btApr.borderColorDefault = '#cccccc';
		btApr.borderColorFocused = '#cccccc';
		btApr.borderColorHovered = '#dddddd';
		btApr.borderColorPressed = '#eeeeee';
		btApr.borderStyleDefault = 'solid';
		btApr.borderStyleFocused = btApr.borderStyleDefault;
		btApr.borderStyleHovered = btApr.borderStyleDefault;
		btApr.borderStylePressed = btApr.borderStyleDefault;
		btApr.backgroundColorDefault = 'white';
		btApr.backgroundColorFocused = 'white';
		btApr.backgroundColorHovered = '#eeeeee';
		btApr.backgroundColorPressed = '#dddddd';
		btApr.backgroundBoxShadow = '2px 2px 5px  rgba(0, 0, 0, 0.5)';
		btApr.caption = '✖';
		btApr.captionColorDefault = 'black';
		btApr.captionColorFocused = 'black';
		btApr.captionColorHovered = 'white';
		btApr.captionColorPressed = 'white';
		btApr.captionShiftYpx = 1;
		btApr.captionFontRatio = 0.6;
		var btEle = partsBuilder.buildTextButton(btApr);
		var eleLeft = 10;
		var eleTop = -12 - parseInt(apr.titleBarHeight);
		var eleAlign = 'RIGHT_TOP';
		// 'closeButton' is a special name
		//apr.addFrameComponent('closeButton', btEle, eleLeft, eleTop, eleAlign);
		apr.addFrameComponent('minimizeButton', btEle, eleLeft, eleTop, eleAlign);
	};
	return apr;
}
