/*
//must contain following functions
//log in
logout()
gotoStandby()
callRemoteOne(remoteuserid)
closeRemote(peerID)
publishData(sendText)
sendData(toPeerID, sendText)

*/
var thisPeer;
var remotePeerIDMediaConMap = new Map();
var remotePeerIDDataConMap = new Map();
var checkMemberTimerId;

function logout(){
	console.log("try to log out");
	/*
	//close all connection
	var buttons = document.getElementsByName("remotePeer_commuButton");
	for(var j = 0; j < buttons.length; j++){
		if(buttons[j].innerHTML.indexOf('close') >= 0){
			buttons[j].click();
		}
	}
	*/
	closeAll();
	clearInterval(checkMemberTimerId);	
	//sleep(3000);
	if(thisPeer != null){
		thisPeer.destroy();
	}
}
function gotoStandby() {
	console.log("gotostandby clicked");
	var myuserid = document.getElementById("myuserid");
	var skywaykey = document.getElementById("apiKey").value;
	thisPeer = (window.peer = new Peer(myuserid.value,{
		//key: window.__SKYWAY_KEY__,
		key: skywaykey,
		debug: 1,
	}));
	
	//thisPeer.on('error', console.error);
	thisPeer.on('error', error => {
		console.log("skyway error detected ! = "+error.type+" : "+error.message);
		if(error.type=="list-error" || error.type=="server-error"){
		} else {
			//alert(error.type+" : "+error.message);
			addInformation(error.type+" : "+error.message);
			clearInterval(checkMemberTimerId);
			updateSignalingState(false);
		}
	});
	
	thisPeer.on("close", () => {
		var buttons = document.getElementsByName("remotePeer_commuButton");
		for(var j = 0; j < buttons.length; j++){
			buttons[j].disabled = true;
		}
	});
	
	/*
	for(var[key, value] of remotePeerIDMediaConMap){
		
	}
	if(remotePeerIDMediaConMap.has("")),get ,set
	*/
	thisPeer.once('open', id => {
		updateSignalingState(true);
		let peers = thisPeer.listAllPeers(peers => {
			loginUsers = [];
			for(var i = 0; i< peers.length; i++){
				loginUsers.push(peers[i]);
			}
			updateLoginInfo();
			//console.log(peers);
		});
		
		readyToChat();
		
		//https://techacademy.jp/magazine/5537
		var checkAccessibleMember = function(){
			thisPeer.listAllPeers(peers => {
				loginUsers = [];
				for(var i = 0; i< peers.length; i++){
					loginUsers.push(peers[i]);
				}
				updateLoginInfo();
				//console.log(peers);
			});
		}
		checkMemberTimerId = setInterval(checkAccessibleMember, 5000);
		//clearInterval(checkMemberTimerId);
		
		
		//かかってきたイベント
		// Register callee handler
		thisPeer.on('call', mediaConnection => {
			if(localMixedStream == null){
				makeLocalStream();
			}
			console.log('local stream videotrack = '+localMixedStream.getVideoTracks().length+', audiotrack = '+localMixedStream.getAudioTracks().length);
			mediaConnection.answer(localMixedStream);
			
			updateConnectUI(mediaConnection.remoteId, false);
			
			mediaConnection.on('stream', async stream => {
				console.log("get stream = "+mediaConnection.remoteId +" "+mediaConnection.id);
				openStream(stream, mediaConnection.remoteId, mediaConnection);
				remotePeerIDMediaConMap.set(mediaConnection.remoteId, mediaConnection);
			});
			//切れた
			mediaConnection.once('close', () => {
				console.log("close = "+mediaConnection.remoteId +" "+mediaConnection.id);
				updateConnectUI(mediaConnection.remoteId, true);
				closeRemote(mediaConnection.remoteId);
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

//相手に電話
function callRemoteOne(remotePeerID) {
	// Note that you need to ensure the peer has connected to signaling server
	// before using methods of peer instance.
	if (!thisPeer.open) {
		return false;
	}
	var member = loginUsers.find((v) => v==remotePeerID);
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

//自分で電話
function mediaCall(remotePeerID){
	var mediaConnection = thisPeer.call(remotePeerID, localMixedStream);
	if(mediaConnection == null){
		return false;
	}
	console.log("connected = "+mediaConnection.remoteId +", "+ mediaConnection.id);
	
	updateConnectUI(mediaConnection.remoteId, false);
	
	mediaConnection.on('stream', async stream => {
		console.log("get stream = "+mediaConnection.remoteId +" "+mediaConnection.id);
		//このときのremoteIdがもし複数連続でやったらあとのpeerIdになってしまう
		openStream(stream, mediaConnection.remoteId, mediaConnection);
		remotePeerIDMediaConMap.set(mediaConnection.remoteId, mediaConnection);
		//await stream.paly().catch(console.error);
	});
	//切れた
	mediaConnection.once('close', () => {
		console.log("close = "+mediaConnection.remoteId +" "+mediaConnection.id);
		updateConnectUI(mediaConnection.remoteId, true);
		closeRemote(mediaConnection.remoteId);
	});
}

//自分で切ったイベント
function closeRemote(peerID){	
	//call us.js video audio stop and remove
	console.log("try to close "+peerID);
	removeRemoteVideo(peerID);
	for(var[key, value] of remotePeerIDMediaConMap){
		if(key == peerID){
			console.log("close media connection with "+peerID);
			value.close(true);
		}
	}
	
	//mapからの削除はcloseイベントが発生してから
	for(var[key, value] of remotePeerIDDataConMap){
		if(key == peerID){
			value.close();
		}
	}
	remotePeerIDMediaConMap.delete(peerID);
	remotePeerIDDataConMap.delete(peerID);
	
}

function publishData(sendText){
	for(var[key, value] of remotePeerIDDataConMap){
		value.send(sendText);
	}
	console.log("publishData:"+sendText);
	
}

function sendData(toPeerID, sendText){
	if(remotePeerIDDataConMap.has(toPeerID)){
		remotePeerIDDataConMap.get(toPeerID).send(sendText);
	} else {
		console.error("failed to send, "+toPeerID + " is not connected");
	}
	console.log("sendData:"+sendText+", To:"+toPeerID);
	
}
