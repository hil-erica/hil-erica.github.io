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
			/*
			const audioContext = new AudioContext();
			var source = audioContext.createMediaStreamSource(stream);
			var destination = audioContext.createMediaStreamDestination();
			source.connect(destination);
			var audioStream = destination.stream;
			
			//var _remoteVideo = new webkitMediaStream();
			var _remoteVideo = new MediaStream();
			for(var i = 0; i<stream.getAudioTracks().length; i++){
				//_remoteVideo.addTrack(audioStream.getAudioTracks()[i]);//これだとうまくsetSinkIdが働かないけどもとのStream直結だとうまくいくのはなぜ？でもAudioContextを通さないとだめなのもなぜ？
				_remoteVideo.addTrack(stream.getAudioTracks()[i]);
			}
			addRemoteSound(remotePeerID,0, _remoteVideo, "false");
			*/
			for(var i = 0; i<stream.getAudioTracks().length; i++){
				//_remoteVideo.addTrack(audioStream.getAudioTracks()[i]);//これだとうまくsetSinkIdが働かないけどもとのStream直結だとうまくいくのはなぜ？でもAudioContextを通さないとだめなのもなぜ？
				var _remoteVideo = new MediaStream();
				_remoteVideo.addTrack(stream.getAudioTracks()[i]);
				addRemoteSound(remotePeerID,i, _remoteVideo, "false");
			}
		}
	} else {
		for(var i = 0; i<stream.getVideoTracks().length; i++){
			//var _remoteVideo = new webkitMediaStream();
			var _remoteVideo = new MediaStream();
			_remoteVideo.addTrack(stream.getVideoTracks()[i]);
			//いつの間にか直った
			if(stream.getAudioTracks().length > i){
				_remoteVideo.addTrack(stream.getAudioTracks()[i]);
			} else if(stream.getAudioTracks().length > 0){			
				_remoteVideo.addTrack(stream.getAudioTracks()[stream.getAudioTracks().length - 1]);
			}
			/*
			if(stream.getAudioTracks().length > i){
				const audioContext = new (window.AudioContext || window.webkitAudioContext)();
				var source = audioContext.createMediaStreamSource(stream);
				var gainNode = audioContext.createGain();
				gainNode.gain.value = 1;
				var destination = audioContext.createMediaStreamDestination();
				source.connect(gainNode);
				gainNode.connect(destination);
				var audioStream = destination.stream;
				console.log("hoge1 " +audioStream.getAudioTracks().length);
				_remoteVideo.addTrack(audioStream.getAudioTracks()[i]);//これだとうまくsetSinkIdが働かないけどもとのStream直結だとうまくいくのはなぜ？でもAudioContextを通さないとだめなのもなぜ？
				//_remoteVideo.addTrack(stream.getAudioTracks()[i]);
				
				//無駄にStreamをそのまま流すAudioを作ってしまう，これはMute
				var _remoteAudio = new MediaStream();
				_remoteAudio.addTrack(stream.getAudioTracks()[i]);
				addRemoteSound(remotePeerID,0, _remoteVideo, "false");
			} else if(stream.getAudioTracks().length > 0){			
				console.log("hoge2");
				const audioContext = new AudioContext();
				var source = audioContext.createMediaStreamSource(stream);
				var destination = audioContext.createMediaStreamDestination();
				source.connect(destination);
				var audioStream = destination.stream;
				_remoteVideo.addTrack(audioStream.getAudioTracks()[audioStream.getAudioTracks().length - 1]);//これだとうまくsetSinkIdが働かないけどもとのStream直結だとうまくいくのはなぜ？でもAudioContextを通さないとだめなのもなぜ？
				//_remoteVideo.addTrack(stream.getAudioTracks()[stream.getAudioTracks().length - 1]);
			}
			*/
			addRemoteVideo(remotePeerID, i, _remoteVideo);
		}
	}
}


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
		/*
		if(isRecording){
			//record sound only
			if(localMicStream != null && localMicStream.getAudioTracks().length > 0){
				addAudioRecorder(localMicStream, myPeerID);
			}
		}
		*/		
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
			/*
			if(isRecording){
				if(elements[i].srcObject != null){
					addAudioRecorder(elements[i].srcObject, myPeerID);
				} else {
					console.log('local_camera_video'+' srcObjec is null');
				}
			}
			*/
			/*
			if(elements[i].srcObject.getAudioTracks().length == 0){
				console.log('add audio track to local mic stream');
				if(localMicStream != null){
					elements[i].srcObject.addTrack(localMicStream.getAudioTracks()[0]);
				}
			} else {
				//console.log('local mic stream is null');
			}
			*/
		}
	}
}

function forceLogout(){
	logout();
	document.location.reload();
}