
var isMediaStreaming = false;

//開始手順	UI start -> getElement video -> Recorder thread, Websocket connect thread -> Record callback
//停止手順　stop videoid-> mediarecorder.stop -> close socket & remove localVideosStreamingPorts, remoteVideosStreamingPorts
//VideoId -> MediaRecorder, VideoSrcごとにMediaRecorderは1つにしておいたほうが安全，複数のMediaRecorderを用意するとパケット落ちが生じる
var mapVideoId2Recorder = new Map();
var mapVideoId2streamingdataqueue = new Map();

//video id -> websocket url
var mapVideoId2Url = new Map();
//url -> websocket
var mapURL2Websocket = new Map();
//url -> send Webm header to socket flag, true, false
var mapURL2SendHeaderFlag = new Map();

// websocket port number : ur, includes関数で検索できる
var localVideosStreamingPorts = new Array();
var remoteVideosStreamingPorts = new Array();


var isRecording = false;
var isInRecordSetup = false;
var mapVideoId2
var mapVideoId2Chunks = new Map();
var mapVideoId2FileNames = new Map();
var mapVideoId2FirstCunks = new Map();//videoid. webm first some blob
var mapVideoId2WebmHeaderCunks = new Map();//videoid. webm header blob

//トラックごとにダウンロードリンクを張るために必要
var videoBlob =[];
var dataUrls = [];
var recordingTimer = null;
var recordingIconBlinking = false;
var recordInterval = 1000;// 録画バッファ インターバル

var bufferInterval = 10;//msec，MediaRecorderでbolbするデータの周期, ストリーミングに合わせ周期は早めに

function getMediaRecorder(videoObj){
	//もし先にStreamingが開始していて途中からRecordingが始まった場合録画にヘッダーを合わせたいからMediaRecorderを再起動
	if(isInRecordSetup){
		if(mapVideoId2Recorder.has(videoObj.getAttribute("id"))){
			//作り直すときにCallbackをはずすことでストリーミングがわに変わったことを悟らせない
			mapVideoId2Recorder.get(videoObj.getAttribute("id")).ondataavailable = null;	
			mapVideoId2Recorder.get(videoObj.getAttribute("id")).onstop = null;
			mapVideoId2Recorder.get(videoObj.getAttribute("id")).stop();
			mapVideoId2Recorder.delete(videoObj.getAttribute("id"));//これはStopイベントでしてくれるかな？でも非同期っぽいからやっておこう
			mapVideoId2streamingdataqueue.delete(videoObj.getAttribute("id"));
		} 
	}
	
	if(mapVideoId2Recorder.has(videoObj.getAttribute("id"))){
		return  mapVideoId2Recorder.get(videoObj.getAttribute("id"));
	} else {
		//webmヘッダー用バッファリセット
		if(mapVideoId2FirstCunks.has(videoObj.getAttribute("id"))){
			mapVideoId2FirstCunks.delete(videoObj.getAttribute("id"));
		}
		if(mapVideoId2WebmHeaderCunks.has(videoObj.getAttribute("id"))){
			mapVideoId2WebmHeaderCunks.delete(videoObj.getAttribute("id"));
		}
		var mediaRecorder = new MediaRecorder(videoObj.srcObject);
		mediaRecorder.ondataavailable = createCallbackOndataavailableMediaRecorder(videoObj.getAttribute("id"));	
		// 録画停止時のイベント
		mediaRecorder.onstop = createCallbackOnstopMediaRecorder(videoObj.getAttribute("id"));
		// Capture スタート
		mediaRecorder.start(bufferInterval); // インターバルは1000ms
		//console.log('start streaming : '+url);
		mapVideoId2Recorder.set(videoObj.getAttribute("id"), mediaRecorder);
	}
}

//when recording off
function stopVideoRecording(videoid){
	if(isMediaStreaming){
		//keep capturing
	} else {
		if(mapVideoId2Recorder.has(videoid)){
			mapVideoId2Recorder.get(videoid).stop();//->mediarecorder stopped->stop websocket, stop storing bolb
			mapVideoId2Recorder.delete(videoid);
			mapVideoId2streamingdataqueue.delete(videoid);
		} else {
			console.log("not found MediaRecorder of "+videoid);
		}
	}
}

//check out video streaming checkbox, socket close
function stopVideoStreaming(videoid){
	if(mapVideoId2Url.has(videoid)){
		var url = mapVideoId2Url.get(videoid);
		createCallbackOnstopForStreaming(url);
		mapVideoId2Url.delete(videoid);
	}
	if(isRecording){
		//keep capturing
	} else {
		if(mapVideoId2Recorder.has(videoid)){
			mapVideoId2Recorder.get(videoid).stop();//->mediarecorder stopped->stop websocket, stop storing bolb
			mapVideoId2Recorder.delete(videoid);
			mapVideoId2streamingdataqueue.delete(videoid);
		}
	}
}


//call when webrtc closed
function videoSrcRemoved4MediaRecorder(videoid){
	if(mapVideoId2Recorder.has(videoid)){
		mapVideoId2Recorder.get(videoid).stop();//->mediarecorder stopped->stop websocket, stop storing bolb
		mapVideoId2Recorder.delete(videoid);
		mapVideoId2streamingdataqueue.delete(videoid);
	}
}

//https://note.kiriukun.com/entry/20181107-passing-arguments-to-callback-function
function createCallbackOndataavailableMediaRecorder(videoid) {
	return function(evt) {
		//console.log("available mediastreaming : " + videoid);
		//evt.data type = Blob
		if(!mapVideoId2streamingdataqueue.has(videoid)){
			mapVideoId2streamingdataqueue.set(videoid, []);
		}
		if(mapVideoId2streamingdataqueue.has(videoid)){
			mapVideoId2streamingdataqueue.get(videoid).push(evt.data);
		}
		//WebMのヘッダー情報保存，本来はMediaRecorderの途中から録画したかったが全体の動画の再生位置（Timecode）がファイルに書き込まれているので途中録画しても全体の再生時間は小さくならないのでいまいち使いづらい
		if(!mapVideoId2FirstCunks.has(videoid)){
			mapVideoId2FirstCunks.set(videoid, []);
		}
		if(mapVideoId2FirstCunks.get(videoid).length < 2){//1st is null to define variable
			mapVideoId2FirstCunks.get(videoid).push(evt.data);
			//console.log(evt.data.type);//video/x-matroska;codecs=avc1,opus
		} else {
			if(!mapVideoId2WebmHeaderCunks.has(videoid)){
				var headerBlb = new Blob(mapVideoId2FirstCunks.get(videoid), { type:mapVideoId2FirstCunks.get(videoid)[0].type });
				console.log("parse webm header : "+videoid);
				var fr = new FileReader()
				fr.onloadend = function() {
					//fr.result //ArrayBuffer
					//fr.result.byteLength
					//fr.result.slice(begin , end)
					const view = new Uint8Array(fr.result);
					getWebmHeader(view, videoid, mapVideoId2FirstCunks.get(videoid)[0].type);
				}
				fr.readAsArrayBuffer(headerBlb);
			}
		}
		
		if(mapVideoId2Url.has(videoid)){
			//streaming
			createCallbackOndataavailableForStreaming(mapVideoId2Url.get(videoid), evt);
		}
		if(isRecording){
			createCallbackOndataavailableForSave(videoid, evt);
		}
	}
}

function createCallbackOnstopMediaRecorder(videoid) {
	return function(evt) {
		console.log("media recorder stopped "+videoid);
		mapVideoId2Recorder.delete(videoid);
		mapVideoId2streamingdataqueue.delete(videoid);
		//MediaStreaming中に録画スタートした際MediaRecorderを再起動するのでその際はソケットはCloseしない
		var checkboxElement = document.getElementById("local_camera_streaming_checkBox_" + videoid);
		if(checkboxElement == null){
			var videoElement = document.getElementById(videoid);
			if(videoElement != null){
				var checkBoxId = videoElement.getAttribute("peerid")+"_" + videoElement.getAttribute("trackid")+"_streaming_checkBox";
				checkboxElement = document.getElementById(checkBoxId);
			}
		}
		if(checkboxElement != null){
			if(checkboxElement.checked){
			} else {
				if(mapVideoId2Url.has(videoid)){
					var url = mapVideoId2Url.get(videoid);
					createCallbackOnstopForStreaming(url);
					mapVideoId2Url.delete(videoid);
				}
			}
		} else {
			if(mapVideoId2Url.has(videoid)){
				var url = mapVideoId2Url.get(videoid);
				createCallbackOnstopForStreaming(url);
				mapVideoId2Url.delete(videoid);
			}
		}
	}
}

////for websocket media streamiing
function mediaStreamingStartStop(){
	console.log("streaming socket num = "+mapURL2Websocket.size);
	
	var mediastream_socket_url = document.getElementById('mediastream_socket_url');
	var mediastreamwebsocketbutton = document.getElementById('mediastreamwebsocketbutton');
	
	if(isMediaStreaming){
		for (var [key, value] of mapURL2Websocket.entries()) {
			//websocket
			value.close();
		}
		setMediastreamButton(true);
		isMediaStreaming = false;
		
	} else {
		//start
		for (var [key, value] of mapURL2Websocket.entries()) {
			//websocket close
			value.close();
		}
		
		var elements = document.getElementsByName('local_camera_video');
		var myPeerID = document.getElementById("myuserid");
		if(elements.length == 0){
			//record sound only
		}
		var local_mediastream_socket_port_Input = document.getElementById('local_mediastream_socket_port');
		
		for (var i = 0; i < elements.length; i++) {
			const videoid = elements[i].getAttribute("videoid");
			const sendCheckBox = document.getElementById('local_camera_streaming_checkBox_' + videoid);
			if(sendCheckBox == null){
			} else if(sendCheckBox.checked){
				var localVideoFirstPort=local_mediastream_socket_port_Input.value;
				addVideoStreamer(elements[i], localVideoFirstPort, localVideosStreamingPorts);
			}
		}
		
		//remote media
		var elements = document.getElementsByClassName('video');
		var remote_mediastream_socket_port_Input = document.getElementById('remote_mediastream_socket_port');
		for (var i = 0; i < elements.length; i++) {
			//console.log("try to streaming "+elements[i].id);
			if(elements[i].srcObject != null){
				const videoid = elements[i].getAttribute("videoid");
				const peerid = elements[i].getAttribute("peerid");
				const trackid = elements[i].getAttribute("trackid");
				const sendCheckBox = document.getElementById(peerid+"_" + trackid+"_streaming_checkBox");
				if(sendCheckBox == null){
				} else if(sendCheckBox.checked){
					var remoteVideoFirstPort=remote_mediastream_socket_port_Input.value;
					addVideoStreamer(elements[i], remoteVideoFirstPort, remoteVideosStreamingPorts);
				}
			} else {
				//not streaming mode
				if(elements[i] != null){
					console.log('video '+elements[i].getAttribute("peerid") +' srcObjec is null');
				}
			}
		}
		/*
		elements = document.getElementsByClassName('soundonly');
		for (var i = 0; i < elements.length; i++) {
			for (var i = 0; i < elements.length; i++) {
				if(elements[i].srcObject == null){
					console.log('audio '+elements[i].getAttribute("peerid") +' srcObjec is null');
				} else if(elements[i].getAttribute("mutemode")=="false"){
					
				} else {
					if(elements[i] != null){
						console.log('audio '+elements[i].getAttribute("peerid") +' srcObjec is mutemode, not record');
					}
				}
			}
		}
		*/
		setMediastreamButton(false);
		isMediaStreaming = true;
	}
}

function addVideoStreamer(videoObj, firstPort, mapPortNum2Recorder){
	if(videoObj.srcObject != null){	
		var mediaRecorder= getMediaRecorder(videoObj);
		
		var freePort = searchUsablePort(firstPort, mapPortNum2Recorder);
		var url  = mediastream_socket_url.value+":"+freePort+"/";
		console.log("streaming target : "+url);
		
		var freeWebsocket = new WebSocket(url);
		//接続通知
		freeWebsocket.onopen = function(event) {
			//ここでfreePortは次のやつに上書きされちゃってるんで注意！
			console.log("mediastream socket established "+this.url+","+freePort);
			mapURL2Websocket.set(this.url.toString(), this);
			mapURL2SendHeaderFlag.set(this.url.toString(), false);
		};
		
		//エラー発生
		freeWebsocket.onerror = function(error) {
			console.log(error);
		};
		
		//メッセージ受信
		freeWebsocket.onmessage = function(event) {
			console.log(event.data);
		};
		
		//切断
		freeWebsocket.onclose = function() {
			console.log("closed mediastream socket "+this.url);
			freeWebsocket = null;
			mapURL2Websocket.delete(this.url.toString());
			for (var [key, value] of mapVideoId2Url.entries()) {
				if(value == this.url){
					stopVideoStreaming(key);
				}
			}
		};
		
		mapVideoId2Url.set(videoObj.getAttribute("id"), url);
		mapPortNum2Recorder.push(freePort);
	} else {
		console.log('local_camera_video'+' srcObjec is null');
	}
}



function createCallbackOndataavailableForStreaming(url, evt) {
	//console.log("available mediastreaming " + url);
	if(mapURL2Websocket.has(url)){
		for (var [key, value] of mapVideoId2Url.entries()) {
			if(value == url){
				if(mapVideoId2streamingdataqueue.has(key)){
					for(var i=0; i<mapVideoId2streamingdataqueue.get(key).length; i++){
						mapURL2Websocket.get(url).send(mapVideoId2streamingdataqueue.get(key)[i]);
					}
					//clear
					mapVideoId2streamingdataqueue.set(key, []);
				}
				break;
			}
		}
		/*
		if(mapURL2Websocket.get(url).readyState == 1){
			//下手するとHeaderが2回送られちゃうけどまあいいか→ダメだった，これがないとVP9はGstreamerがちゃんとパースできない
//			if(!mapURL2SendHeaderFlag.get(url)){
//				for (var [key, value] of mapVideoId2Url.entries()) {
//					if(value == url){
//						if(mapVideoId2WebmHeaderCunks.has(key)){
//							//send header
//							console.log("send webm header : blob length = "+mapVideoId2WebmHeaderCunks.get(key).length+" to " + url);
//							mapURL2SendHeaderFlag.set(url, true);
//							for(var i=0; i<mapVideoId2WebmHeaderCunks.get(key).length; i++){
////								mapURL2Websocket.get(url).send(mapVideoId2WebmHeaderCunks.get(key)[i]);
//							}
//							break;
//						}
//					}
//				}
//			}
			//send recorded data
			mapURL2Websocket.get(url).send(evt.data);
		}
		*/
	} else {
		//console.log("not found websocket " + url);
	}
}

function createCallbackOnstopForStreaming(url) {
	console.log("stop mediastreaming " + url);
	if(mapURL2Websocket.has(url)){
		console.log("close streaming socket " + url);
		var wsock = mapURL2Websocket.get(url);
		if(wsock.readyState == 1){
			wsock.close();//-> mapURL2Websocket.delete(url); called at closed event 
		}
	}
	
	localVideosStreamingPorts = localVideosStreamingPorts.filter(item => (url.indexOf(':'+item) == -1));
	remoteVideosStreamingPorts = remoteVideosStreamingPorts.filter(item => (url.indexOf(':'+item) == -1));
	
	/*
	var removePorts = new Array();
	for(var i=0; i< localVideosStreamingPorts.length; i++){
		if(url.indexOf(':'+localVideosStreamingPorts) != -1){
			removePorts.push(localVideosStreamingPorts[i]);
		}
	}
	for(var i = 0;i<removePorts.length; i++){
		localVideosStreamingPorts.delete(removePorts[i]);
	}
	
	//localVideosStreamingPorts remoteVideosStreamingPorts search from and close
	var removePorts = new Array();
	for (var [key, value] of localVideosStreamingPorts.entries()) {
		if(value == this){
			removePorts.push(key);
			console.log("release port : "+key);
		}
	}
	for(var i = 0;i<removePorts.length; i++){
		localVideosStreamingPorts.delete(removePorts[i]);
	}
	removePorts = new Array();
	for (var [key, value] of remoteVideosStreamingPorts.entries()) {
		if(value == this){
			removePorts.push(key);
			console.log("release port : "+key);
		}
	}
	for(var i = 0;i<removePorts.length; i++){
		remoteVideosStreamingPorts.delete(removePorts[i]);
	}
	removePorts = new Array();
	for (var [key, value] of mapVideoId2Url.entries()) {
		if(value == url){
			removePorts.push(key);
			console.log("release video id : "+key);
		}
	}
	for(var i = 0;i<removePorts.length; i++){
		mapVideoId2Url.delete(removePorts[i]);
	}
	
	*/
}

function searchUsablePort(firstPort, usingPortList){
	var freePort = firstPort;
	while(true){
		if(usingPortList.includes(freePort)){
			freePort++;
		} else {
			return freePort;
		}
	}
}

function streamingLocalCheckBoxChanged(){
	//this はCheckBoxだからその対象のVideoIDがほしい
	var videocontainerid = this.getAttribute("videocontainerid");
	console.log(this.id +"("+videocontainerid+") changed to "+this.checked);
	if(this.checked){
		if(isMediaStreaming){
			var videoElement = document.getElementById(videocontainerid);
			
			if(videoElement.hasAttribute("peerid")){
				//remote
				var remote_mediastream_socket_port_Input = document.getElementById('remote_mediastream_socket_port');
				var remoteVideoFirstPort=remote_mediastream_socket_port_Input.value;
				addVideoStreamer(videoElement, remoteVideoFirstPort, remoteVideosStreamingPorts);
			} else {
				//local
				var local_mediastream_socket_port_Input = document.getElementById('local_mediastream_socket_port');
				var localVideoFirstPort=local_mediastream_socket_port_Input.value;
				addVideoStreamer(videoElement, localVideoFirstPort, localVideosStreamingPorts);
			}
		}
	} else {
		var videoElement = document.getElementById(videocontainerid);
		var videoid = videoObj.getAttribute("id");
		stopVideoStreaming(videoid);
	}
}


////for recording

function startstoprecord(){
	var recordButton = document.getElementById("recorder_button");
	if(isRecording){
		//make download link, download linkでやったほうがいい？
		for (var [key, value] of mapVideoId2FileNames.entries()) {
			stopVideoRecording(key);
		}
		
		isRecording = false;
		
		//lock until download link generated
		var recorder_button = document.getElementById('recorder_button');
		recorder_button.disabled = true;
		makeDownloadLink();
		
		recordButton.innerHTML = "start recording";
		
		
		if(recordingTimer != null){
			clearInterval(recordingTimer);
			recordingTimer = null;
		}
		var recordericonElement = document.getElementById("recordericon");
		recordericonElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-record-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/></svg>';
	} else {
		isInRecordSetup = true;
		recordingTimer = setInterval(function () {
			if(recordingIconBlinking){
				var recordericonElement = document.getElementById("recordericon");
				recordericonElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-record-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/></svg>';
				recordingIconBlinking = false;
			} else {
				var recordericonElement = document.getElementById("recordericon");
				recordericonElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-record-circle-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-8 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg>';
				recordingIconBlinking = true;
			}
		}, 1000);
		
		//clear
		mapVideoId2Chunks=new Map();
		mapVideoId2FileNames=new Map();
		
		//start
		
		var elements = document.getElementsByName('local_camera_video');
		var myPeerID = document.getElementById("myuserid");
		if(elements.length == 0){
			//record sound only
			if(localMicStream != null && localMicStream.getAudioTracks().length > 0){
				addAudioRecorder(localMicStream, myPeerID.value);
			}
		}
		for (var i = 0; i < elements.length; i++) {
			addVideoRecorder(elements[i], myPeerID.value);
		}
		
		var elements = document.getElementsByClassName('video');
		for (var i = 0; i < elements.length; i++) {
			console.log("try to record "+elements[i].id);
			if(elements[i].hasAttribute("peerid")){
				addVideoRecorder(elements[i], elements[i].getAttribute("peerid"));
			}
		}
		elements = document.getElementsByClassName('soundonly');
		for (var i = 0; i < elements.length; i++) {
			for (var i = 0; i < elements.length; i++) {
				if(elements[i].hasAttribute("peerid")){
					addAudioRecorder(elements[i], elements[i].getAttribute("peerid"));
				}
			}
		}
		
		isRecording = true;
		recordButton.innerHTML = "stop recording";
		
		isInRecordSetup = false;
	}
}

function addVideoRecorder(videoObj, peerid){
	if(videoObj.srcObject != null){
		var mediaRecorder= getMediaRecorder(videoObj);
		mapVideoId2Chunks.set(videoObj.getAttribute("id"), []);
		mapVideoId2FileNames.set(videoObj.getAttribute("id"), peerid+"_"+videoObj.getAttribute("trackid")+".webm");
		console.log('start storing : '+videoObj.getAttribute("id")+" -> "+ peerid+"_"+videoObj.getAttribute("trackid")+".webm");
	} else {
		//not streaming mode
		if(videoObj != null){
			console.log('video '+videoObj.getAttribute("peerid") +' srcObjec is null');
		}
	}
}

function addAudioRecorder(audioObj, peerid){
	if(audioObj.srcObject == null){
		console.log('audio '+audioObj.getAttribute("peerid") +' srcObjec is null');
	} else if(audioObj.getAttribute("mutemode")=="false"){
		var mediaRecorder= getMediaRecorder(audioObj);
		mapVideoId2Chunks.set(audioObj.getAttribute("id"), []);
		mapVideoId2FileNames.set(audioObj.getAttribute("id"), peerid+"_audioonly_"+audioObj.getAttribute("trackid")+".webm");
		console.log('start storing : '+audioObj.getAttribute("id")+" -> "+ peerid+"_audioonly_"+audioObj.getAttribute("trackid")+".webm");
	} else {
		if(audioObj != null){
			console.log('audio '+audioObj.getAttribute("peerid") +' srcObjec is mutemode, not record');
		}
	}
}

//https://note.kiriukun.com/entry/20181107-passing-arguments-to-callback-function
function createCallbackOndataavailableForSave(videoid, evt) {
	if(mapVideoId2Chunks.has(videoid)){
		mapVideoId2Chunks.get(videoid).push(evt.data);
	}
}

function makeDownloadLink() {
	console.log('make recorded files download link');
	
	if(mapVideoId2Chunks.size > 0){
		console.log("all recorder stopped, num recorder = "+mapVideoId2Chunks.size);
		videoBlob =[];
		dataUrls = [];
		//zip
		/*
		let zip = new JSZip();
		const folderName = "skywaychat";
		let folder = zip.folder(folderName);
		*/
		
		var downloadLinks = document.getElementById("download_each");
		while (downloadLinks.firstChild) {
			downloadLinks.removeChild(downloadLinks.firstChild);
		}
		var lastIndex = 0;
		for (var [key, value] of mapVideoId2Chunks.entries()) {
			/*
			//下手にヘッダーを加えずともあとでffmpegで追加するか？でも音声が消えちゃうかも
			if(mapVideoId2WebmHeaderCunks.has(key)){
				//array1.concat(array2);
				console.log("add header to "+key+" "+mapVideoId2WebmHeaderCunks.get(key).length);
				
				value = mapVideoId2WebmHeaderCunks.get(key).concat(value);
			} else {
				
			}
			*/
			videoBlob.push(new Blob(value, { type: "video/webm" }));
			var downloadLink = document.createElement('a');
			if(mapVideoId2FileNames.has(key)){
				downloadLink.innerHTML = "<font size='2'>"+mapVideoId2FileNames.get(key)+"</font>";
				downloadLink.setAttribute("href", "#");
				//const dataUrl = URL.createObjectURL(videoBlob[i]);
				dataUrls.push(URL.createObjectURL(videoBlob[lastIndex]));
				downloadLink.download = mapVideoId2FileNames.get(key);
				downloadLink.href = dataUrls[lastIndex];
				setTimeout(function() {
					//console.log("revoke object URL");
					window.URL.revokeObjectURL(dataUrls[lastIndex]);
				}, 1000);
				downloadLinks.appendChild(downloadLink);
				downloadLinks.innerHTML += '&nbsp;';
			} else {
				console.log("not found download file name : "+ key);
			}
			lastIndex ++;
		}
		
		/*
		console.log("start zip");			
		zip.generateAsync({ type: "blob" }).then(blob => {
			console.log("zip generated");
			// blob から URL を生成
			const dataUrl = URL.createObjectURL(blob);
			const anchor = document.getElementById('downloadlink');
			anchor.download = `${folderName}.zip`;
			anchor.href = dataUrl;
			// オブジェクト URL の開放
			setTimeout(function() {
				console.log("revoke object URL");
				window.URL.revokeObjectURL(dataUrl);
			}, 10000);
		});
		*/
	}
	
	//次のレコードを可能にする
	var recorder_button = document.getElementById('recorder_button');
	recorder_button.disabled = false;
}

//Uint8Array
//https://darkcoding.net/software/reading-mediarecorders-webm-opus-output/
function getWebmHeader(byteArrays, videoid, type){
	console.log("loading webm header : "+videoid + " "+type +" "+byteArrays.length);
	
	var headerEndIndex=4;
	var variableLengths = getVariableLength(byteArrays, headerEndIndex);
	var varibaleDataLength = variableLengths[0];
	var EBML_headerLength = variableLengths[1];
	//console.log("EBML_headerLength : "+EBML_headerLength+"("+varibaleDataLength+")");
	headerEndIndex+=varibaleDataLength+EBML_headerLength;
	//skip segment represents duration, 18 53 80 67
	headerEndIndex+=12;
	//segment data length represents header 15 49 A9 66
	headerEndIndex+=4;
	variableLengths = getVariableLength(byteArrays, headerEndIndex);
	headerEndIndex+=variableLengths[0]+variableLengths[1];
	//track length 16 54 AE 6B
	headerEndIndex+=4;
	variableLengths = getVariableLength(byteArrays, headerEndIndex);
	headerEndIndex+=variableLengths[0]+variableLengths[1];
	//1F 43 B6 75 represent duration of a track
	headerEndIndex+=12;
	//E7 represents timecode, E7 81 00 -> 0x81->0b10000001 -> variable length = 0b00000001 = 1, 00 means start pos 0
	headerEndIndex +=1;
	variableLengths = getVariableLength(byteArrays, headerEndIndex);
	headerEndIndex+=variableLengths[0]+variableLengths[1];
	/*
	for(var i = headerEndIndex; i<headerEndIndex+8;i++){
		if(i < byteArrays.byteLength){
			console.log(byteArrays[i].toString(16));
		} else {
			console.log("not enough data "+byteArrays.byteLength);
			break;
		}
	}
	*/
	//headerEndIndex +=1;//start pos
	//a SimpleBlock starts with A3
	//トラック数によるけど少なくとも最初と次のsimpleBlockがないとファイルとして成立しなさそう
	//2トラック分あるから4Black分はヘッダーに入れている
	headerEndIndex +=1;
	//console.log("simple strucker");
	variableLengths = getVariableLength(byteArrays, headerEndIndex);
	//console.log("simple strucker : "+variableLengths[1]+"("+variableLengths[0]+")");
	headerEndIndex+=variableLengths[0]+variableLengths[1];
	
	/*
	for(var i = headerEndIndex; i<headerEndIndex+8;i++){
		if(i < byteArrays.byteLength){
			console.log(byteArrays[i].toString(16));
		} else {
			console.log("not enough data "+byteArrays.byteLength);
			break;
		}
	}
	*/
	if(headerEndIndex > byteArrays.byteLength){
		headerEndIndex = byteArrays.byteLength;
	}
	headerEndIndex +=1;
	variableLengths = getVariableLength(byteArrays, headerEndIndex);
	//console.log("simple strucker 2: "+variableLengths[1]+"("+variableLengths[0]+")");
	headerEndIndex+=variableLengths[0]+variableLengths[1];
	/*
	for(var i = headerEndIndex; i<headerEndIndex+8;i++){
		if(i < byteArrays.byteLength){
			console.log(byteArrays[i].toString(16));
		} else {
			console.log("not enough data "+byteArrays.byteLength);
			break;
		}
	}
	*/
	headerEndIndex +=1;
	//console.log("simple strucker");
	variableLengths = getVariableLength(byteArrays, headerEndIndex);
	//console.log("simple strucker : "+variableLengths[1]+"("+variableLengths[0]+")");
	headerEndIndex+=variableLengths[0]+variableLengths[1];
	headerEndIndex +=1;
	//console.log("simple strucker");
	variableLengths = getVariableLength(byteArrays, headerEndIndex);
	//console.log("simple strucker : "+variableLengths[1]+"("+variableLengths[0]+")");
	headerEndIndex+=variableLengths[0]+variableLengths[1];
	
	if(headerEndIndex > byteArrays.byteLength){
		headerEndIndex = byteArrays.byteLength;
	}
	//ひょっとしたら同期できないかもしれないから再度チェック
	if(!mapVideoId2WebmHeaderCunks.has(videoid)){
		var headerBlob = new Blob([byteArrays.buffer], { type: type });
		//mapVideoId2WebmHeaderCunks.set(videoid, [headerBlob]);
		mapVideoId2WebmHeaderCunks.set(videoid, [headerBlob.slice(0, headerEndIndex, { type:type })]);
	}
}

//https://github.com/Matroska-Org/ebml-specification/blob/master/specification.markdown#vint-examples
//index start with 0
function getVariableLength(byteArrays, index){
	var octetLength=1;
	var firstByte = 0;
	if((byteArrays[index] >>> 7) == 1){
		//0b1*** ****
		octetLength = 1;
		firstByte = (byteArrays[index] & 0b01111111);
	} else if((byteArrays[index] >>> 6) == 1){
		//0b01** ****
		octetLength = 2;
		firstByte = (byteArrays[index] & 0b00111111);
	} else if((byteArrays[index] >>> 5) == 1){
		//0b001* ****
		octetLength = 3;
		firstByte = (byteArrays[index] & 0b00011111);
	} else if((byteArrays[index] >>> 4) == 1){
		//0b0001 ****
		octetLength = 4;
		firstByte = (byteArrays[index] & 0b00001111);
	} else if((byteArrays[index] >>> 3) == 1){
		//0b0000 1***
		octetLength = 5;
		firstByte = (byteArrays[index] & 0b00000111);
	} else if((byteArrays[index] >>> 2) == 1){
		//0b0000 01**
		octetLength = 6;
		firstByte = (byteArrays[index] & 0b00000011);
	} else if((byteArrays[index] >>> 1) == 1){
		//0b0000 001*
		octetLength = 7;
		firstByte = (byteArrays[index] & 0b00000001);
	} else if(byteArrays[index] == 1){
		//0b0000 0001
		octetLength = 8;
		firstByte = (byteArrays[index] & 0b00000000);
	}
	//Unit8Array, 
	//https://ja.javascript.info/arraybuffer-binary-arrays
	var arrayBuffer = new ArrayBuffer(8);//すべて0初期化, 最大64bitsのUint
	var uint8Array = new Uint8Array(arrayBuffer);
	uint8Array[8-octetLength] = firstByte;
	for(var i=1; i<octetLength; i++){
		uint8Array[8-octetLength+i] = byteArrays[index+i];
	}
	/*
	for(var i=0; i<uint8Array.length; i++){
		console.log(i+":"+uint8Array[i].toString(16));
	}
	*/
	var dataView = new DataView( uint8Array.buffer );
	return [octetLength, getUint64(dataView, 0, false)];
	//return new DataView( uint8Array.buffer ).getUint32(0);
}

//https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/DataView
function getUint64(dataview, byteOffset, littleEndian) {
  // 64 ビット数を 2 つの 32 ビット (4 バイト) の部分に分割する
  const left =  dataview.getUint32(byteOffset, littleEndian);
  const right = dataview.getUint32(byteOffset+4, littleEndian);

  // 2 つの 32 ビットの値を結合する
  const combined = littleEndian? left + 2**32*right : 2**32*left + right;

  if (!Number.isSafeInteger(combined))
    console.warn(combined, 'exceeds MAX_SAFE_INTEGER. Precision may be lost');

  return combined;
}
