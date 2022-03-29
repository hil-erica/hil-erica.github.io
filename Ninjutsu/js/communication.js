var localMixedStream;

// accessible users
var loginUsers = new Array();


//WebRTCストリーミングからUI作成
function openStream(stream, remotePeerID, mediaConnection){
	console.log(remotePeerID+ '('+mediaConnection.remoteId+') => remote stream videotrack = '+stream.getVideoTracks().length+', audiotrack = '+stream.getAudioTracks().length);
	//AudioContextを使ってMediaStreamを作り直すとvideo.setSinkIDで別々に出力できるようになった，じゃないとどれか1つのsinkIDを書き換えるとすべてskywayからもらったMediaStreamの音声の出力先が連動して変わってしまう，多分そんなに音質悪化はないかな？
	//もとのAudioStreamを再生しないとそれをソースにしたAudioContextにデータが流れない，AudioContextがStreamするデータはSetSinkIdがちゃんと働くので実際に音を流すのはAudioContext経由にしたい，ってことでMuteでバックグラウンドでskywayでもらったstreamを再生しておく
	
	//もし画面共有を最初のVideoTrackに確保するとここ修正
	if(stream.getVideoTracks().length == 0){
		if(stream.getAudioTracks().length > 0){
			for(var i = 0; i<stream.getAudioTracks().length; i++){
				//_remoteVideo.addTrack(audioStream.getAudioTracks()[i]);//これだとうまくsetSinkIdが働かないけどもとのStream直結だとうまくいくのはなぜ？でもAudioContextを通さないとだめなのもなぜ？
				var _remoteVideo = new MediaStream();
				_remoteVideo.addTrack(stream.getAudioTracks()[i]);
				addRemoteSound(remotePeerID,i, _remoteVideo, "false");
			}
			//2つ目以降は画面共有の音声だから
			/*
			var _remoteVideo = new MediaStream();
			_remoteVideo.addTrack(stream.getAudioTracks()[0]);
			addRemoteSound(remotePeerID,0, _remoteVideo, "false");
			*/
		}
	} else {
		for(var i = 0; i<stream.getVideoTracks().length; i++){
			//var _remoteVideo = new webkitMediaStream();
			var _remoteVideo = new MediaStream();
			_remoteVideo.addTrack(stream.getVideoTracks()[i]);
			if(stream.getAudioTracks().length > i){
				_remoteVideo.addTrack(stream.getAudioTracks()[i]);
			} else if(stream.getAudioTracks().length > 0){			
				_remoteVideo.addTrack(stream.getAudioTracks()[stream.getAudioTracks().length - 1]);
			}
			addRemoteVideo(remotePeerID, i, _remoteVideo);
			/*
			if(remotePeerIDSharingscreenFlagMap.get(remotePeerID)){
				//相手が画面共有中
				if(i==stream.getVideoTracks().length-1){
					//共有画面,最後のAudioトラックを画面共有に
					if(i==0){
						//相手はAudioのみで画面共有
						if(stream.getAudioTracks().length > 0){
							var _remoteAudio = new MediaStream();
							_remoteAudio.addTrack(stream.getAudioTracks()[0]);
							addRemoteSound(remotePeerID,0, _remoteAudio, "false");
						}
					} else {
						//相手はVideoと画面共有						
					}
					if(stream.getAudioTracks().length > 0){			
						_remoteVideo.addTrack(stream.getAudioTracks()[stream.getAudioTracks().length - 1]);
					}
					addSharedScreen(remotePeerID, _remoteVideo);
				} else {
					//遠隔画像,最初ののAudioトラック
					if(stream.getAudioTracks().length > 0){			
						_remoteVideo.addTrack(stream.getAudioTracks()[0]);
					}
					addRemoteVideo(remotePeerID, i, _remoteVideo);
				}
			} else {
				if(stream.getAudioTracks().length > i){
					_remoteVideo.addTrack(stream.getAudioTracks()[i]);
				} else if(stream.getAudioTracks().length > 0){			
					_remoteVideo.addTrack(stream.getAudioTracks()[stream.getAudioTracks().length - 1]);
				}
				addRemoteVideo(remotePeerID, i, _remoteVideo);
			}
			*/
		}
	}
}

function openSharedScreenStream(stream, remotePeerID, mediaConnection){
	console.log(remotePeerID+ '('+mediaConnection.remoteId+') => remote shared stream videotrack = '+stream.getVideoTracks().length+', audiotrack = '+stream.getAudioTracks().length);
	if(stream.getVideoTracks().length == 0){
		console.log(remotePeerID+ ' does not send shared video');
	} else {
		for(var i = 0; i<stream.getVideoTracks().length; i++){
			//var _remoteVideo = new webkitMediaStream();
			var _remoteVideo = new MediaStream();
			_remoteVideo.addTrack(stream.getVideoTracks()[i]);
			if(stream.getAudioTracks().length > i){
				_remoteVideo.addTrack(stream.getAudioTracks()[i]);
			} else if(stream.getAudioTracks().length > 0){			
				_remoteVideo.addTrack(stream.getAudioTracks()[stream.getAudioTracks().length - 1]);
			}
			addSharedScreen(remotePeerID, _remoteVideo);
		}
	}
}

//AudioTrackは画面共有も含めて2トラックで統一
function makeLocalStream(){
	var myPeerID = document.getElementById("myuserid");
	//localMixedStream = null;
	localMixedStream = new webkitMediaStream();
	//取得した一覧から全てのvalue値を表示する
	if(localMicStream != null){
		localMixedStream.addTrack(localMicStream.getAudioTracks()[0]);
	} else {
		console.log("no audio track to send");
	}
	var elements = document.getElementsByName('local_camera_video');
	if(elements.length == 0){
	} else {
		for (var i = 0; i < elements.length; i++) {
			//elements[i].srcObject.getTracks().forEach(track => track.stop());
			//elements[i].srcObject = null;
			var checkBoxObj = document.getElementById('local_camera_checkBox_' + elements[i].getAttribute("videoid"));
			var sendVideoTrack = true;
			if(checkBoxObj != null){
				if(!checkBoxObj.checked){
					console.log("don't send "+elements[i].getAttribute("videoid"));
					sendVideoTrack = false;
				}
			}
			if(elements[i].srcObject.getVideoTracks().length > 0 && sendVideoTrack){
				localMixedStream.addTrack(elements[i].srcObject.getVideoTracks()[0]);
			}
			console.log('remove audio track from local mic stream');
			for(var j = elements[i].srcObject.getAudioTracks().length-1; j>=0; j--){
				elements[i].srcObject.removeTrack(elements[i].srcObject.getAudioTracks()[j]);
			}
			console.log('add audio track to local mic stream');
			if(localMicStream != null){
				elements[i].srcObject.addTrack(localMicStream.getAudioTracks()[0]);
			}
		}
	}
	/*
	//shared screen track
	//localMixedStream = new webkitMediaStream();
	if(sharingScreenStream != null){
		console.log("sharingScreenStream track = "+sharingScreenStream.getVideoTracks().length+" "+sharingScreenStream.getAudioTracks().length);
		if(sharingScreenStream.getVideoTracks().length > 0){
			localMixedStream.addTrack(sharingScreenStream.getVideoTracks()[0]);
		} else {
			//localMixedStream.addTrack(lockscreenStream.getVideoTracks()[0]);
		}
		if(sharingScreenStream.getAudioTracks().length > 0){
			localMixedStream.addTrack(sharingScreenStream.getAudioTracks()[0]);	
		} else {
			//無音トラックを追加
			const audioContext = new AudioContext();
			var destination = audioContext.createMediaStreamDestination();
			localMixedStream.addTrack(destination.stream.getAudioTracks()[0]);
		}
	} else {
		//console.log("sharingScreenStream is null");
		const audioContext = new AudioContext();
		var destination = audioContext.createMediaStreamDestination();
		localMixedStream.addTrack(destination.stream.getAudioTracks()[0]);
	}
	*/
	console.log("local media stream : videos "+localMixedStream.getVideoTracks().length +", audios "+localMixedStream.getAudioTracks().length);
}

function getSharingScreenTrack(){
	var mixedStream = new webkitMediaStream();
	if(sharingScreenStream != null){
		console.log("sharingScreenStream track = "+sharingScreenStream.getVideoTracks().length+" "+sharingScreenStream.getAudioTracks().length);
		if(sharingScreenStream.getVideoTracks().length > 0){
			mixedStream.addTrack(sharingScreenStream.getVideoTracks()[0]);
		} else {
			//mixedStream.addTrack(lockscreenStream.getVideoTracks()[0]);
		}
		if(sharingScreenStream.getAudioTracks().length > 0){
			mixedStream.addTrack(sharingScreenStream.getAudioTracks()[0]);	
		} else {
			//無音トラックを追加
			const audioContext = new AudioContext();
			var destination = audioContext.createMediaStreamDestination();
			mixedStream.addTrack(destination.stream.getAudioTracks()[0]);
		}
	} else {
		//console.log("sharingScreenStream is null");
		const audioContext = new AudioContext();
		var destination = audioContext.createMediaStreamDestination();
		mixedStream.addTrack(destination.stream.getAudioTracks()[0]);
		return null;
	}
	return mixedStream;
}

function forceLogout(){
	logout();
	document.location.reload();
}