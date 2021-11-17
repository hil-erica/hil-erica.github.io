var webSockUrl = "wss://127.0.0.1:8000";
var autoWebSockConnect = false;
var externalWebSiteUrl = "https://127.0.0.1/erica_database/console/realtime/display_realtime_dialog.php";
var answerRequest=true;
var rosWebSockUrl = "wss://127.0.0.1:10090";
var autoRosConnect = false;

function initializeSetting() {
	//websocket
	var wsockautoBtn = document.getElementById('wsockautoconnect');
	wsockautoBtn.checked = autoWebSockConnect;
	wsockautoBtn.addEventListener('change', function(){
		autoConnect(this.checked);
	});
	if(autoWebSockConnect == true){
		autoConnect(wsockautoBtn.checked);
	}
	
	var socket_url_Input = document.getElementById('socket_url');
	socket_url_Input.value = webSockUrl;
	socket_url_Input.addEventListener('keypress', function(){
		var wsURL = socket_url_Input.value;
		var indexURL = wsURL.indexOf("://");
		var httpsURL = "https://"+wsURL.substring(indexURL+3, wsURL.length);
		document.getElementById('installcertificateLink').setAttribute("href", httpsURL);
		document.getElementById('installcertificateLink').innerHTML = httpsURL;
	});
	
	var wsockBtn = document.getElementById('websocketbutton');
	wsockBtn.addEventListener('click', function(){
		console.log("socket connect button : "+document.getElementById('socket_url').value);
		websocketConnect(document.getElementById('socket_url').value);
	});
	
	//ros
	var rosautoBtn = document.getElementById('rosautoconnect');
	rosautoBtn.checked = autoRosConnect;
	rosautoBtn.addEventListener('change', function(){
		autorosConnect(this.checked);
	});
	if(autoRosConnect == true){
		autorosConnect(rosautoBtn.checked);
	}
	
	var ros_socket_url_Input = document.getElementById('ros_socket_url');
	ros_socket_url_Input.value = rosWebSockUrl;
	ros_socket_url_Input.addEventListener('keypress', function(){
		var wsURL = ros_socket_url_Input.value;
		var indexURL = wsURL.indexOf("://");
		var httpsURL = "https://"+wsURL.substring(indexURL+3, wsURL.length);
		document.getElementById('installcertificateLink4ROS').setAttribute("href", httpsURL);
		document.getElementById('installcertificateLink4ROS').innerHTML = httpsURL;
	});
	
	var rossockBtn = document.getElementById('roswebsocketbutton');
	rossockBtn.addEventListener('click', function(){
		console.log("socket connect button : "+document.getElementById('ros_socket_url').value);
		rosWebSocketConnect(document.getElementById('ros_socket_url').value);
	});
	
	//external web site
	var externalweb_url_Input = document.getElementById('externalweb_url');
	externalweb_url_Input.value = externalWebSiteUrl;
	
	var open_externalwebBtn = document.getElementById('open_externalweb');
	open_externalwebBtn.addEventListener('click', function(){
		var externalweb_url_Input = document.getElementById('externalweb_url');
		openExternalWebSite(externalweb_url_Input.value);
	});
	
	//teleope
	var answerRequestBehavorSelectBtn = document.getElementById('answerRequestBehavorSelect');
	answerRequestBehavorSelectBtn.checked = answerRequest;
	answerRequestBehavorSelectBtn.addEventListener('change', function(){
		answerRequest = this.checked;
	});
	
}

function setWebsocketButton(onoff){
	if(onoff){
		document.getElementById('websocketbutton').innerHTML = "Connect";
		document.getElementById('socket_url').readOnly = false;
	} else {
		document.getElementById('websocketbutton').innerHTML = "Disconnect";
		document.getElementById('socket_url').readOnly = true;
	}
}

function clickWebsocketButton(){
	//console.log("try to click");
	document.getElementById('websocketbutton').click();
}

function setROSsocketButton(onoff){
	if(onoff){
		document.getElementById('roswebsocketbutton').innerHTML = "Connect";
		document.getElementById('ros_socket_url').readOnly = false;
	} else {
		document.getElementById('roswebsocketbutton').innerHTML = "Disconnect";
		document.getElementById('ros_socket_url').readOnly = true;
	}
}

function clickROSsocketButton(){
	//console.log("try to click");
	document.getElementById('roswebsocketbutton').click();
}
