var isRecording = false;
var recorder =  [];
var blobUrl = null;
var blobUrls = [];
var chunks = [];
var fileNames = [];
var videoBlob =[]
var dataUrls =[];
var recorderMap = new Map();
var recorderCount = 0;

var recordingTimer = null;
var recordingIconBlinking = false;

function startstoprecord(){
	var recordButton = document.getElementById("recorder_button");
	if(isRecording){
		for(var i  = 0; i < recorder.length; i++){
			if(recorder[i] != null){
				recorder[i].stop();
			} else {
				console.error('not found recorder index = '+i);
			}
		}
		
		isRecording = false;
		recordButton.innerHTML = "start recording";
		
		var recorder_button = document.getElementById('recorder_button');
		recorder_button.disabled = true;
		
		if(recordingTimer != null){
			clearTimeout(recordingTimer);
			recordingTimer = null;
		}
		var recordericonElement = document.getElementById("recordericon");
		recordericonElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-record-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0z"/></svg>';
	} else {
		//
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
		
		//start
		isRecording = true;
		recorderMap.clear();
		recordButton.innerHTML = "stop recording";
		recorder.splice(0);
		chunks.splice(0);
		fileNames.splice(0);
		recorderCount = 0;
		var elements = document.getElementsByName('local_camera_video');
		var myPeerID = document.getElementById("myuserid");
		if(elements.length == 0){
			//record sound only
			if(localMicStream != null && localMicStream.getAudioTracks().length > 0){
				recorder.push(new MediaRecorder(localMicStream));
				recorderMap.set(recorderCount, recorder[recorderCount]);
				chunks.push([]); // 格納場所をクリア
				fileNames.push(myPeerID.value+"_audioonly.webm");
				// 録画進行中に、インターバルに合わせて発生するイベント
				console.log(fileNames+":"+"audiolny");
				recorder[recorderCount].ondataavailable = createCallbackOndataavailable(recorderCount);	
				
				// 録画停止時のイベント
				recorder[recorderCount].onstop = createCallbackOnstop(recorderCount);
				// 録画スタート
				recorder[recorderCount].start(1000); // インターバルは1000ms
				console.log('start recording : '+recorderCount);
				recorderCount++;
			}
		}
		for (var i = 0; i < elements.length; i++) {
			if(elements[i].srcObject != null){
				recorder.push(new MediaRecorder(elements[i].srcObject));
				recorderMap.set(recorderCount, recorder[recorderCount]);
				chunks.push([]); // 格納場所をクリア
				fileNames.push(myPeerID.value+"_"+i+".webm");
				// 録画進行中に、インターバルに合わせて発生するイベント
				console.log(fileNames+":"+recorderCount);
				recorder[recorderCount].ondataavailable = createCallbackOndataavailable(recorderCount);	
				/*
				recorder[recorderCount].ondataavailable = function(evt) {
					console.log(fileNamesp[recorderCount]+":"+recorderCount);
					console.log("data available: evt.data.type=" + evt.data.type + " size=" + evt.data.size);
					chunks[recorderCount].push(evt.data);
				};
				*/

				// 録画停止時のイベント
				recorder[recorderCount].onstop = createCallbackOnstop(recorderCount);
				/*
				recorder[recorder.length-1].onstop = function(evt) {
					console.log('recorder.onstop()');
					recorder[recorderCount] = null;
				};
				*/
				// 録画スタート
				recorder[recorderCount].start(1000); // インターバルは1000ms
				console.log('start recording : '+recorderCount);
				recorderCount++;
			} else {
				console.log('local_camera_video'+' srcObjec is null');
			}
		}
		
		/*
		videoObj.setAttribute("class", "video");
		videoObj.setAttribute("name", peerid+"_video");
		videoObj.setAttribute("id", peerid+"_"+ trackid+"_video");
		videoObj.setAttribute("peerid", peerid);
		videoObj.setAttribute("trackid", trackid);
		audioObj.setAttribute('class', "soundonly");
		audioObj.setAttribute('name', peerid+"_audio");
		audioObj.setAttribute('peerid', peerid);
		audioObj.setAttribute('trackid', trackid);
		*/
		
		var elements = document.getElementsByClassName('video');
		for (var i = 0; i < elements.length; i++) {
			console.log("try to record "+elements[i].id);
			if(elements[i].srcObject != null){
				recorder.push(new MediaRecorder(elements[i].srcObject));
				recorderMap.set(recorderCount, recorder[recorderCount]);
				chunks.push([]); // 格納場所をクリア
				fileNames.push(elements[i].getAttribute("peerid")+"_"+elements[i].getAttribute("trackid")+".webm");
				// 録画進行中に、インターバルに合わせて発生するイベント
				console.log(fileNames+":"+elements[i].getAttribute("trackid"));
				recorder[recorderCount].ondataavailable = createCallbackOndataavailable(recorderCount);	
				
				// 録画停止時のイベント
				recorder[recorderCount].onstop = createCallbackOnstop(recorderCount);
				// 録画スタート
				recorder[recorderCount].start(1000); // インターバルは1000ms
				console.log('start recording : '+recorderCount);
				recorderCount++;
			} else {
				//not streaming mode
				if(elements[i] != null){
					console.log('video '+elements[i].getAttribute("peerid") +' srcObjec is null');
				}
			}
		}
		elements = document.getElementsByClassName('soundonly');
		for (var i = 0; i < elements.length; i++) {
			for (var i = 0; i < elements.length; i++) {
				if(elements[i].srcObject == null){
					console.log('audio '+elements[i].getAttribute("peerid") +' srcObjec is null');
				} else if(elements[i].getAttribute("mutemode")=="false"){
					recorder.push(new MediaRecorder(elements[i].srcObject));
					recorderMap.set(recorderCount, recorder[recorderCount]);
					chunks.push([]); // 格納場所をクリア
					fileNames.push(elements[i].getAttribute("peerid")+"_audioonly_"+elements[i].getAttribute("trackid")+".webm");
					// 録画進行中に、インターバルに合わせて発生するイベント
					console.log(fileNames+":"+elements[i].getAttribute("trackid"));
					recorder[recorderCount].ondataavailable = createCallbackOndataavailable(recorderCount);	
					
					// 録画停止時のイベント
					recorder[recorderCount].onstop = createCallbackOnstop(recorderCount);
					// 録画スタート
					recorder[recorderCount].start(1000); // インターバルは1000ms
					console.log('start recording : '+recorderCount);
					recorderCount++;
				} else {
					if(elements[i] != null){
						console.log('audio '+elements[i].getAttribute("peerid") +' srcObjec is mutemode, not record');
					}
				}
			}
		}
	}
}

//https://note.kiriukun.com/entry/20181107-passing-arguments-to-callback-function
function createCallbackOndataavailable(recorderCount) {
	return function(evt) {
		//console.log(fileNames[recorderCount]+":"+recorderCount);
		//console.log("data available: evt.data.type=" + evt.data.type + " size=" + evt.data.size);
		chunks[recorderCount].push(evt.data);
	}
}

function createCallbackOnstop(recorderCount) {
	return function(evt) {
		console.log('recorder '+recorderCount+'.onstop()');
		recorder[recorderCount] = null;
		
		
		//stop
		if (! blobUrl) {
			window.URL.revokeObjectURL(blobUrl);
			blobUrl = null;
		}
		
		if(recorderMap.has(recorderCount)){
			recorderMap.delete(recorderCount);
		}
		
		if(recorderMap.size == 0){
			console.log("all recorder stopped, num recorder = "+recorder.length+ ", " + chunks.length);
			videoBlob =[];
			dataUrls = [];
			for(var i  = 0; i < recorder.length; i++){
				// Blob
				//const videoBlob = new Blob(chunks[i], { type: "video/webm" });
				videoBlob.push(new Blob(chunks[i], { type: "video/webm" }));
				// 再生できるようにURLを生成
				//blobUrl.push(window.URL.createObjectURL(videoBlob));			
			}
			
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
			
			for(var i  = 0; i < videoBlob.length; i++){
				var downloadLink = document.createElement('a');
				downloadLink.innerHTML = "<font size='2'>"+fileNames[i]+"</font>";
				downloadLink.setAttribute("href", "#");
				//const dataUrl = URL.createObjectURL(videoBlob[i]);
				dataUrls.push(URL.createObjectURL(videoBlob[i]));
				downloadLink.download = fileNames[i];
				downloadLink.href = dataUrls[i];
				setTimeout(function() {
					//console.log("revoke object URL");
					window.URL.revokeObjectURL(dataUrls[i]);
				}, 1000);
				downloadLinks.appendChild(downloadLink);
				downloadLinks.innerHTML += '&nbsp;';
				/*
				var blanckObj = document.createElement('div');
				blanckObj.innerHTML = " &ensp;";
				downloadLinks.appendChild(blanckObj);
				*/
				//folder.file(fileNames[i], videoBlob[i]);
			}
			
			//次のレコードを可能にする
			var recorder_button = document.getElementById('recorder_button');
			recorder_button.disabled = false;
			
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
	}
}