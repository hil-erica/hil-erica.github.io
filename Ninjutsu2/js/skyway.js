/*
//must contain following functions
//log in
logout()
gotoStandby()
callRemoteOne(remoteuserid)
callAgainWithScreen()//途中から画面共有する場合に全員にMediaCallし直す
closeRemote(peerID)
publishData(sendText)
sendData(toPeerID, sendText)

*/
var thisPeer;
var thisPeer4ShareScreen;
var remotePeerIDMediaConMap = new Map();
var remotePeerIDDataConMap = new Map();
var remotePeerIDMediaCon4ShareScreenMap = new Map();
var checkMemberTimerId;
var vCodec="VP9";//H264, VP8, VP9
var shareScreenIDFooter="_sharescreen";
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
	if(thisPeer4ShareScreen != null){
		thisPeer4ShareScreen.destroy();
	}
	
}
function gotoStandby() {
	console.log("gotostandby clicked");
	var myuserid = document.getElementById("myuserid");
	var skywaykey = document.getElementById("apiKey").value;
	if(myuserid.value.endsWith(shareScreenIDFooter)){
		alert("***"+shareScreenIDFooter+" user name is not permitted");
		return;
	}
	
	thisPeer = (window.peer = new Peer(myuserid.value,{
		//key: window.__SKYWAY_KEY__,
		key: skywaykey,
		debug: 1,
	}));
	
	thisPeer4ShareScreen = (window.peer = new Peer(myuserid.value+shareScreenIDFooter,{
		//key: window.__SKYWAY_KEY__,
		key: skywaykey,
		debug: 1,
	}));
	
	thisPeer.on('error', error => {
		console.log("skyway error detected ! = "+error.type+" : "+error.message);
		if(error.type=="list-error" || error.type=="server-error"){
			addInformation(error.type+" : "+error.message);
			clearInterval(checkMemberTimerId);
			updateSignalingState(false);
		} else if(error.type=="unavailable-id"){
			alert(error.type+" : "+error.message);
		}
		else if(error.type=="peer-unavailable"){
		}else {
			//alert(error.type+" : "+error.message);
			addInformation(error.type+" : "+error.message);
			clearInterval(checkMemberTimerId);
			updateSignalingState(false);
		}
	});
	thisPeer4ShareScreen.on('error', console.error);
	
	
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
				if(!peers[i].endsWith(shareScreenIDFooter)){
					loginUsers.push(peers[i]);
				}
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
					if(!peers[i].endsWith(shareScreenIDFooter)){
						loginUsers.push(peers[i]);
					}
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
			if(mediaConnection.remoteId.endsWith(shareScreenIDFooter)){
				const answerOption = {
					videoCodec: vCodec,
				};
				var emptyStream = new webkitMediaStream();
				mediaConnection.answer(emptyStream, answerOption);
				
				mediaConnection.on('stream', async stream => {
					//share screen start
					console.log("get share screen stream = "+mediaConnection.remoteId +" "+mediaConnection.id);
					openSharedScreenStream(stream, mediaConnection.remoteId, mediaConnection);
					remotePeerIDMediaCon4ShareScreenMap.set(mediaConnection.remoteId, mediaConnection);
				});
				//切れた
				mediaConnection.once('close', () => {
					//share screen end
					console.log("close = "+mediaConnection.remoteId +" "+mediaConnection.id);
					closeRemote4ShareScreen(mediaConnection.remoteId);
				});
			} else {
				const answerOption = {
					videoCodec: vCodec,
				};
				if(localMixedStream == null){
					makeLocalStream();
				}
				console.log('local stream videotrack = '+localMixedStream.getVideoTracks().length+', audiotrack = '+localMixedStream.getAudioTracks().length);
				mediaConnection.answer(localMixedStream, answerOption);
				
				updateConnectUI(mediaConnection.remoteId, false);
				
				mediaConnection.on('stream', async stream => {
					console.log("get stream = "+mediaConnection.remoteId +" "+mediaConnection.id);
					openStream(stream, mediaConnection.remoteId, mediaConnection);
					remotePeerIDMediaConMap.set(mediaConnection.remoteId, mediaConnection);
					
					//share screen 中
					if(sharingScreenStream != null){
						var stream = getSharingScreenTrack();
						if(stream != null){
							console.log("start send shared screen track to "+mediaConnection.remoteId);
							mediaCall4ShareScreen(mediaConnection.remoteId, stream);
						}
					}
				});
				//切れた
				mediaConnection.once('close', () => {
					console.log("close = "+mediaConnection.remoteId +" "+mediaConnection.id);
					removeRemoteVideo(mediaConnection.remoteId);
					//updateConnectUI(mediaConnection.remoteId, true);
					//closeRemote(mediaConnection.remoteId);//これはDataconnection closeで呼び出す
				});
			}
		});//end of call media connection
		
		thisPeer.on('connection', dataConnection => {
			console.log(dataConnection.remoteId +" data connection connected" );
			dataConnection.once('open', async () => {
				remotePeerIDDataConMap.set(dataConnection.remoteId, dataConnection);
				console.log(dataConnection.remoteId +" opened" );
				updateConnectUI(dataConnection.remoteId, false);
				//dataConnection.send("how are yor?");
				dataConnection.on('data', data => {
					getData(dataConnection.remoteId, data, dataConnection);
					//console.log(dataConnection.remoteId +" >> "+data );
				});
				dataConnection.once('close', () => {
					//remotePeerIDDataConMap.delete(dataConnection.remoteId);
					console.log(dataConnection.remoteId +" data connection closed" );
					updateConnectUI(dataConnection.remoteId, true);
					closeRemote(dataConnection.remoteId);
				});
			});//end of open dataconnection
		});//end of call dataconnection
	});//end of thisPeer.once('open', id => {
}

//相手に電話, 先にデータチャンネルで互いのVideoTrack数を教え合い多い方からCallする
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
			if(sharingScreenStream != null){
				//こっちはsharescreenしているフラグ
				dataConnection.send("sharingscreen=true");
			} else {
				dataConnection.send("sharingscreen=false");
			}
			dataConnection.send("numvideo="+localMixedStream.getVideoTracks().length);
		}
	});
	
	dataConnection.on('data', data => {
		getData(dataConnection.remoteId, data, dataConnection);
		//console.log(dataConnection.remoteId +" >> "+data );
	});
	
	dataConnection.once('close', () => {
		//remotePeerIDDataConMap.delete(dataConnection.remoteId);
		console.log(dataConnection.remoteId +" data connection closed" );
		updateConnectUI(dataConnection.remoteId, true);
		closeRemote(dataConnection.remoteId);
	});
	return true;
}

//自分で電話
function mediaCall(remotePeerID){
	var mediaConnection = thisPeer.call(remotePeerID, localMixedStream, {
		videoCodec: vCodec,
	});
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
		//share screen 中
		if(sharingScreenStream != null){
			var stream = getSharingScreenTrack();
			if(stream != null){
				console.log("start send shared screen track to "+mediaConnection.remoteId);
				mediaCall4ShareScreen(mediaConnection.remoteId, stream);
			}
		}
	});
	//切れた
	mediaConnection.once('close', () => {
		console.log("close media = "+mediaConnection.remoteId +" "+mediaConnection.id);
		removeRemoteVideo(mediaConnection.remoteId);
		//updateConnectUI(mediaConnection.remoteId, true);
		//closeRemote(mediaConnection.remoteId);//これはDataconnection closeで呼び出す
	});
}

//share screenは自分からコールする場合しかない
function mediaCall4ShareScreen(remotePeerID, stream){
	var mediaConnection = thisPeer4ShareScreen.call(remotePeerID, stream, {
		videoCodec: vCodec,
	});
	if(mediaConnection == null){
		return false;
	}
	console.log("connected for share screen= "+mediaConnection.remoteId +", "+ mediaConnection.id);
	remotePeerIDMediaCon4ShareScreenMap.set(mediaConnection.remoteId, mediaConnection);
	
	mediaConnection.on('stream', async stream => {
		//Video,Audioともに空トラックなので呼び出されない
		console.log("get share screen stream back = "+mediaConnection.remoteId +" "+mediaConnection.id);
		//share screenの相手のストリームは中身が無いので無視
		//このときのremoteIdがもし複数連続でやったらあとのpeerIdになってしまう
		//openStream(stream, mediaConnection.remoteId, mediaConnection);
		//await stream.paly().catch(console.error);
	});
	
	//切れた
	mediaConnection.once('close', () => {
		console.log("close media = "+mediaConnection.remoteId +" "+mediaConnection.id);
		closeRemote4ShareScreen(mediaConnection.remoteId);
		//removeRemoteVideo(mediaConnection.remoteId);
		//updateConnectUI(mediaConnection.remoteId, true);
		//closeRemote(mediaConnection.remoteId);
	});
}
/*
function callAgainWithScreen(){
	if (!thisPeer.open) {
		return false;
	}
	if(localMixedStream == null){
		makeLocalStream();
	}
	
	for(var[key, value] of remotePeerIDMediaConMap){
		//全員メディアを切る
		value.close(true);
		removeRemoteVideo(key);
	}
	
	//mapからの削除はcloseイベントが発生してから
	for(var[key, value] of remotePeerIDDataConMap){
		if(videoMuteMode){
			console.log("call again to "+ key+" with video mute mode");
			//dataConnection.send("numvideo=-1");
			if(localMixedStream == null){
				makeLocalStream();
			}
			mediaCall(key);
		} else {
			if(sharingScreenStream != null){
				//こっちはsharescreenしているフラグ
				value.send("sharingscreen=true");
			} else {
				value.send("sharingscreen=false");
			}
			value.send("numvideo="+localMixedStream.getVideoTracks().length);
		}
	}
	return true;
}
*/

//自分で切ったイベント
function closeRemote(peerID){	
	//call us.js video audio stop and remove
	console.log("try to close stream with "+peerID);
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
	if(remotePeerIDMediaCon4ShareScreenMap.has(peerID)){
		closeRemote4ShareScreen(peerID);
	} else if(remotePeerIDMediaCon4ShareScreenMap.has(peerID+shareScreenIDFooter)){
		closeRemote4ShareScreen(peerID+shareScreenIDFooter);
	}
}

function closeRemote4ShareScreen(peerID){	
	//call us.js video audio stop and remove
	console.log("try to close share screen stream with "+peerID);
	removeSharedScreen(peerID);
	for(var[key, value] of remotePeerIDMediaCon4ShareScreenMap){
		if(key == peerID){
			console.log("close share screen media connection with "+peerID);
			value.close(true);
		}
	}
	remotePeerIDMediaCon4ShareScreenMap.delete(peerID);
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
