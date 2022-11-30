//kagebunshin.htmlでmain subのresizeリスナーで実装
//window.addEventListener('resize', windowResizeListener);

var remotePeerIDVideoContainerMap = new Map();//peerid, Array of div video container, to sort sub container
//var drawJsonObjOnCanvas = null;
var drawJsonObjOnCanvasUsers = new Map();//peerid, jsonobj for canvas draw
var targetSelected = false;
var selectedTargetID = "none";

function addRemoteVideo(peerid, trackid, videotrack){
	var main = document.getElementById("main");
	var sub = document.getElementById("sub");
	
	var contentID = peerid+"_" + trackid+"_container";
	var container = document.createElement("div");
	container.setAttribute("id", peerid+"_" + trackid+"_container");
	container.setAttribute("name", peerid+"_container");
	container.setAttribute("peerid", peerid);
	container.setAttribute("trackid", trackid);
	
	var controller = document.createElement("div");
	controller.setAttribute("class", "controller");
	//controller.setAttribute("class", "row controller");
	
	//紫水晶むらさきすいしょう #e7e7eb R:231 G:231 B:235
	var svgFillColor = "rgba(231,231,235,1)";
	
	var prevButton = document.createElement("button");
	prevButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="'+svgFillColor+'" class="bi bi-arrow-left-square" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm11.5 5.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5z"/></svg>';
	prevButton.setAttribute("class", "btn btn-default btn-sm");
	prevButton.setAttribute("type", "button");
	prevButton.setAttribute("peerid", peerid);
	prevButton.setAttribute("trackid", trackid);
	prevButton.setAttribute("id", peerid+"_" + trackid+"_prevbutton");
	prevButton.addEventListener("click", setVideoOrder);
	controller.appendChild(prevButton);
	
	var mainButton = document.createElement("button");
	//mainButton.innerHTML = "to main";
	//mainButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-in-up" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M3.5 10a.5.5 0 0 1-.5-.5v-8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 0 0 1h2A1.5 1.5 0 0 0 14 9.5v-8A1.5 1.5 0 0 0 12.5 0h-9A1.5 1.5 0 0 0 2 1.5v8A1.5 1.5 0 0 0 3.5 11h2a.5.5 0 0 0 0-1h-2z"/><path fill-rule="evenodd" d="M7.646 4.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V14.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3z"/></svg>';
	mainButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="'+svgFillColor+'" class="bi bi-arrow-up-square" viewBox="0 0 16 16">  <path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm8.5 9.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5z"/></svg>';
	//mainButton.setAttribute("class", "btn btn-default btn-sm col-sm-1");
	mainButton.setAttribute("class", "btn btn-default btn-sm");
	mainButton.setAttribute("type", "button");
	mainButton.setAttribute("peerid", peerid);
	mainButton.setAttribute("trackid", trackid);
	mainButton.setAttribute("id", peerid+"_" + trackid+"_mainbutton");
	mainButton.addEventListener("click", setMainVideo);
	controller.appendChild(mainButton);
	
	var subButton = document.createElement("button");
	//subButton.innerHTML = "to sub";
	//subButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-in-up" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M3.5 10a.5.5 0 0 1-.5-.5v-8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 0 0 1h2A1.5 1.5 0 0 0 14 9.5v-8A1.5 1.5 0 0 0 12.5 0h-9A1.5 1.5 0 0 0 2 1.5v8A1.5 1.5 0 0 0 3.5 11h2a.5.5 0 0 0 0-1h-2z"/><path fill-rule="evenodd" d="M7.646 4.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V14.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3z"/></svg>';
	subButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="'+svgFillColor+'" class="bi bi-arrow-down-square" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm8.5 2.5a.5.5 0 0 0-1 0v5.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V4.5z"/></svg>';
	//subButton.setAttribute("class", "btn btn-default btn-sm col-sm-1");
	subButton.setAttribute("class", "btn btn-default btn-sm");
	subButton.setAttribute("type", "button");
	subButton.setAttribute("peerid", peerid);
	subButton.setAttribute("trackid", trackid);
	subButton.setAttribute("id", peerid+"_" + trackid+"_subbutton");
	subButton.addEventListener("click", setSubVideo);
	controller.appendChild(subButton);
	
	var nextButton = document.createElement("button");
	nextButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="'+svgFillColor+'" class="bi bi-arrow-right-square" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm4.5 5.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z"/></svg>';
	nextButton.setAttribute("class", "btn btn-default btn-sm");
	nextButton.setAttribute("type", "button");
	nextButton.setAttribute("peerid", peerid);
	nextButton.setAttribute("trackid", trackid);
	nextButton.setAttribute("id", peerid+"_" + trackid+"_nextbutton");
	nextButton.addEventListener("click", setVideoOrder);
	controller.appendChild(nextButton);
		
	var speakerDiv = document.createElement("div");
	speakerDiv.setAttribute("class", "form-control");
	var speakerSelector = document.createElement("select");
	//speakerSelector.setAttribute("class", "form-select form-select-sm");
	speakerSelector.setAttribute("size", "1");
	speakerSelector.setAttribute("style", "width:75pt;");
	var speakerList = document.getElementById("speaker_list");
	for(var i = 0; i <speakerList.length; i++){
		option = document.createElement("option");
		option.setAttribute("value", speakerList[i].value);
		option.innerHTML = speakerList[i].innerHTML;
		speakerSelector.appendChild(option);
	}
	//メインのスピーカーに設定
	speakerSelector.selectedIndex = speakerList.selectedIndex;
	
	controller.appendChild(speakerSelector);
	
	//ros send option
	var sendRosInput = document.getElementById("streaming2local");
	if(sendRosInput.checked){
		var checkBoxLabelObj = document.createElement('label');
		checkBoxLabelObj.setAttribute('id',  peerid+"_" + trackid+"_streaming_label");
		checkBoxLabelObj.setAttribute("peerid", peerid);
		checkBoxLabelObj.setAttribute("trackid", trackid);
		checkBoxLabelObj.innerHTML = 'streaming to local';
		var checkBoxObj = document.createElement('input');
		checkBoxObj.setAttribute('id',  peerid+"_" + trackid+"_streaming_checkBox");
		checkBoxObj.setAttribute('type', 'checkbox');
		checkBoxObj.setAttribute("peerid", peerid);
		checkBoxObj.setAttribute("trackid", trackid);
		checkBoxObj.setAttribute('teleopetype', 'operator');
		checkBoxObj.setAttribute('videocontainerid', peerid+"_"+ trackid+"_video");
		
		checkBoxObj.checked = true;
		checkBoxObj.addEventListener('change', streamingLocalCheckBoxChanged);
		controller.appendChild(checkBoxObj);
		controller.appendChild(checkBoxLabelObj);
	}
	/*
	var optionDiv = document.createElement("div");
	optionDiv.setAttribute("class", "col-sm-5");
	var optionSelector = document.createElement("select");
	//optionSelector.setAttribute("class", "form-select form-select-sm");
	optionSelector.setAttribute("size", "1");
	optionSelector.setAttribute("style", "width:50pt;");
	var option = document.createElement("option");
	option.innerHTML = "some thing0";
	optionSelector.appendChild(option);
	option = document.createElement("option");
	option.innerHTML = "some thing1";
	optionSelector.appendChild(option);
	controller.appendChild(optionSelector);
	//optionDiv.appendChild(optionSelector);
	//controller.appendChild(optionDiv);
	*/
	
	var videocontainer = document.createElement("div");
	videocontainer.setAttribute("class", "videocontainer");
	
	var videoObj;
	videoObj = document.createElement("video");
	videoObj.setAttribute("class", "video");
	videoObj.setAttribute("name", peerid+"_video");
	videoObj.setAttribute("id", peerid+"_"+ trackid+"_video");
	videoObj.setAttribute("peerid", peerid);
	videoObj.setAttribute("trackid", trackid);
	videoObj.setAttribute("controls", "1");
	//videoObj.src = "..\\video\\"+peerid+".mp4";
	if(trackid > 0){
		//videoObj.setAttribute("muted", "true");
		videoObj.muted = true;
	}
	//今はテストautoplayのためにmute
	//videoObj.muted = true;
	videoObj.setAttribute("autoplay", "1");
	videoObj.srcObject = videotrack;
	videoObj.playsInline = true;
	
	videocontainer.appendChild(videoObj);
	speakerSelector.setAttribute('speakerid', videoObj.id);
	
	var videoLabel = document.createElement("label");
	videoLabel.setAttribute("for", peerid+"_"+ trackid+"_video");
	videoLabel.innerHTML = peerid;
	videoLabel.setAttribute("class", "videolabel");
	videocontainer.appendChild(videoLabel);
	
	var bgCanvasObj;
	bgCanvasObj = document.createElement("canvas");
	bgCanvasObj.setAttribute("class", "videocanvas");
	bgCanvasObj.setAttribute("name", "backgroundcanvas");
	bgCanvasObj.setAttribute("id", peerid+"_"+ trackid+"_bgcanvas");
	bgCanvasObj.setAttribute("peerid", peerid);
	bgCanvasObj.setAttribute("trackid", trackid);
	videocontainer.appendChild(bgCanvasObj);
	
	var canvasObj;
	canvasObj = document.createElement("canvas");
	canvasObj.setAttribute("class", "videocanvas");
	canvasObj.setAttribute("name", "clickcanvas");
	canvasObj.setAttribute("id", peerid+"_"+ trackid+"_canvas");
	canvasObj.setAttribute("peerid", peerid);
	canvasObj.setAttribute("trackid", trackid);
	videocontainer.appendChild(canvasObj);
	
	//https://qiita.com/sashim1343/items/e3728bea913cadab677d
	console.log("teleOpeMode:"+teleOpeMode);
	if(teleOpeMode){
		canvasObj.addEventListener( "mousedown", canvasMouseDown);
		canvasObj.addEventListener( "mouseup", canvasMouseUp);
		canvasObj.addEventListener( "mousemove", canvasMouseMove);
		canvasObj.addEventListener( "mouseout", canvasMouseOut);
		//canvasObj.addEventListener("click", canvasClicked);
		//canvasObj.addEventListener( "dblclick", canvasDblClicked);
	} else {
		console.log("canvas off");
		canvasObj.style.display ="none";
		bgCanvasObj.style.display ="none";
	}
	
	//スピーカー初期化
	var speakerId = speakerSelector.options[speakerList.selectedIndex].value;
	if(videoObj.srcObject != null && videoObj.srcObject.getAudioTracks().length > 0){
		videoObj.setSinkId(speakerId)
			.then(function() {
			console.log("setSinkID Success, audio is being played on "+speakerId +" at "+videoObj.id);
		})
		.catch(function(err) {
			console.error("setSinkId Err:", err);
		});
		speakerSelector.addEventListener("change", speakerSelectEvent);
	} else if(videoObj.src != null){
		videoObj.setSinkId(speakerId)
			.then(function() {
			console.log("setSinkID Success, audio is being played on "+speakerId +" at "+videoObj.id);
		})
		.catch(function(err) {
			console.error("setSinkId Err:", err);
		});
		speakerSelector.addEventListener("change", speakerSelectEvent);	
	}
	//もし録画中だったらリストに加える
	if(isRecording){
		addVideoRecorder(videoObj, peerid);
	}
	if(isMediaStreaming){
		var remote_mediastream_socket_port_Input = document.getElementById('remote_mediastream_socket_port');
		var remoteVideoFirstPort=remote_mediastream_socket_port_Input.value;
		addVideoStreamer(videoObj, remoteVideoFirstPort, remoteVideosStreamingPorts);
	}
	
	container.appendChild(controller);
	container.appendChild(videocontainer);
	
	if(main.childElementCount == 0){
		//add to main
		container.setAttribute("class", "maincontainer");
		//container.setAttribute("name", "mainvideo");
		mainButton.hidden = true;
		subButton.hidden = false;

		main.appendChild(container);
		
		fadeOutBodyImg();
	} else {
		//add to sub
		container.setAttribute("class", "subcontainer");
		//container.setAttribute("name", "subvideo");
		mainButton.hidden = false;
		subButton.hidden = true;

		sub.appendChild(container);
	}
	if(remotePeerIDVideoContainerMap.has(peerid)){
		
	} else {
		remotePeerIDVideoContainerMap.set(peerid, new Array());
	}
	remotePeerIDVideoContainerMap.get(peerid).push(container);
	
	//新しい映像が加わったのでリサイズ
	//calcMainContainersSize();
	//calcSubContainersSize();
	setSplitMinSize();

	//ros
	onNewUserVideoConnected(videoObj);
	
	return container;
}

function removeRemoteVideo(peerid){
	var elements = document.getElementsByName(peerid+"_video");
	//取得した一覧から全てのvalue値を表示する
	for (var i = 0; i < elements.length; i++) {
		//elements[i].srcObject.getTracks().forEach(track => track.stop());
		if(elements[i].srcObject != null){
			//streaming
			videoSrcRemoved4MediaRecorder(elements[i].id);
			var tracks = elements[i].srcObject.getTracks();
			if(tracks != null){
				for(var j = 0; j < tracks.length; j++){
					tracks[j].stop();
				}
			}
			elements[i].srcObject = null;
		}
	}
	elements = document.getElementsByName(peerid+"_audio");
	//取得した一覧から全てのvalue値を表示する
	for (var i = 0; i < elements.length; i++) {
		//elements[i].srcObject.getTracks().forEach(track => track.stop());
		if(elements[i].srcObject != null){
			var tracks = elements[i].srcObject.getTracks();
			if(tracks != null){
				for(var j = 0; j < tracks.length; j++){
					tracks[j].stop();
				}
			}
			elements[i].srcObject = null;
		}
	}
	//main subから削除してmainも消えたら最初の要素をMainにする
	var main = document.getElementById("main");
	var sub = document.getElementById("sub");
	
	//並び替えてから削除
	var shouldChangeMain = false;
	elements = document.getElementsByName(peerid+"_container");
	for(var i = 0; i < elements.length; i++){
		for(var j = 0; j < main.children.length; j++){
			if(main.children[j] == elements[i]){
				main.removeChild(elements[i]);
				shouldChangeMain = true;
				break;
			}
		}
	}
	
	if(shouldChangeMain){
		var noConnection = true;
		elements = sub.children;
		for(var i = 0; i<elements.length; i++){
			if(elements[i].getAttribute("name") != (peerid+"_container")){
				var mainButtonId = elements[i].getAttribute("peerid")+"_"+elements[i].getAttribute("trackid")+"_mainbutton";
				console.log("click to set main : "+mainButtonId);
				document.getElementById(mainButtonId).click();
				noConnection = false;
				break;
			}
		}
		
		if(noConnection){
			fadeInBodyImg(1000);
		}
	}
	
	while(true){
		elements = document.getElementsByName(peerid+"_container");
		//console.log("remove target size = " +elements.length + ", named = "+peerid+"_container");
		if(elements.length == 0){
			break;
		} else {
			var found = false;
			for(var i = 0; i < main.children.length; i++){
				if(main.children[i] == elements[0]){
					main.removeChild(elements[0]);
					found = true;
					break;
				}
			}
			if(!found){
				for(var i = 0; i < sub.children.length; i++){
					if(sub.children[i] == elements[0]){
						sub.removeChild(elements[0]);
						found = true;
						break;
					}
				}
			}
			if(!found){
				console.log("not found named :" +peerid+"_container");
			}
		}
	}
	/*
	//audio
	var elements = document.getElementsByName('remote_audio_source_'+remotePeerID);
	//取得した一覧から全てのvalue値を表示する
	for (var i = 0; i < elements.length; i++) {
		//elements[i].srcObject.getTracks().forEach(track => track.stop());
		if(elements[i].srcObject != null){
			var tracks = elements[i].srcObject.getTracks();
			if(tracks != null){
				for(var j = 0; j < tracks.length; j++){
					tracks[j].stop();
				}
			}
			elements[i].srcObject = null;
		}
	}
	const remote_audios = document.getElementById("remote_audios");
	elements = document.getElementsByName("remote_audio_"+remotePeerID);
	for (var i = 0; i < elements.length; i++) {
		elements[i].parentNode.removeChild(elements[i]);
	}
	*/
	// remotePeerIDVideoContainerMap = new Map();//peerid, Array of div video container
	remotePeerIDVideoContainerMap.delete(peerid);
	
	//減るのでリサイズ
	//calcMainContainersSize();
	//calcSubContainersSize();
	setSplitMinSize();

	//画面共有から削除
	removeSharedScreen(peerid);
}

function addRemoteSound(peerid, trackid, audiotrack, muteMode){
	var main = document.getElementById("main");
	var sub = document.getElementById("sub");
	
	var contentID = peerid+"_" + trackid+"_container";
	var container = document.createElement("div");
	container.setAttribute("id", peerid+"_" + trackid+"_container");
	container.setAttribute("name", peerid+"_container");
	container.setAttribute("peerid", peerid);
	container.setAttribute("trackid", trackid);
	
	var controller = document.createElement("div");
	controller.setAttribute("class", "controller");
	//controller.setAttribute("class", "row controller");
	
	//紫水晶むらさきすいしょう #e7e7eb R:231 G:231 B:235
	var svgFillColor = "rgba(231,231,235,1)";

	
	var prevButton = document.createElement("button");
	prevButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="'+svgFillColor+'" class="bi bi-arrow-left-square" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm11.5 5.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5z"/></svg>';
	prevButton.setAttribute("class", "btn btn-default btn-sm");
	prevButton.setAttribute("type", "button");
	prevButton.setAttribute("peerid", peerid);
	prevButton.setAttribute("trackid", trackid);
	prevButton.setAttribute("id", peerid+"_" + trackid+"_prevbutton");
	prevButton.addEventListener("click", setVideoOrder);
	controller.appendChild(prevButton);
	
	var mainButton = document.createElement("button");
	//mainButton.innerHTML = "to main";
	//mainButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-arrow-in-up" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M3.5 10a.5.5 0 0 1-.5-.5v-8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 0 0 1h2A1.5 1.5 0 0 0 14 9.5v-8A1.5 1.5 0 0 0 12.5 0h-9A1.5 1.5 0 0 0 2 1.5v8A1.5 1.5 0 0 0 3.5 11h2a.5.5 0 0 0 0-1h-2z"/><path fill-rule="evenodd" d="M7.646 4.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V14.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3z"/></svg>';
	mainButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="'+svgFillColor+'" class="bi bi-arrow-up-square" viewBox="0 0 16 16">  <path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm8.5 9.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V11.5z"/></svg>';
	//mainButton.setAttribute("class", "btn btn-default btn-sm col-sm-1");
	mainButton.setAttribute("class", "btn btn-default btn-sm");
	mainButton.setAttribute("type", "button");
	mainButton.setAttribute("peerid", peerid);
	mainButton.setAttribute("trackid", trackid);
	mainButton.setAttribute("id", peerid+"_" + trackid+"_mainbutton");
	mainButton.addEventListener("click", setMainVideo);
	controller.appendChild(mainButton);
	
	var nextButton = document.createElement("button");
	nextButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="'+svgFillColor+'" class="bi bi-arrow-right-square" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M15 2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V2zM0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2zm4.5 5.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z"/></svg>';
	nextButton.setAttribute("class", "btn btn-default btn-sm");
	nextButton.setAttribute("type", "button");
	nextButton.setAttribute("peerid", peerid);
	nextButton.setAttribute("trackid", trackid);
	nextButton.setAttribute("id", peerid+"_" + trackid+"_nextbutton");
	nextButton.addEventListener("click", setVideoOrder);
	controller.appendChild(nextButton);
	
	
	var speakerDiv = document.createElement("div");
	speakerDiv.setAttribute("class", "col-sm-5");
	var speakerSelector = document.createElement("select");
	//speakerSelector.setAttribute("class", "form-select form-select-sm");
	speakerSelector.setAttribute("size", "1");
	speakerSelector.setAttribute("style", "width:75pt;");
	var speakerList = document.getElementById("speaker_list");
	for(var i = 0; i <speakerList.length; i++){
		option = document.createElement("option");
		option.setAttribute("value", speakerList[i].value);
		option.innerHTML = speakerList[i].innerHTML;
		speakerSelector.appendChild(option);
	}
	//メインのスピーカーに設定
	speakerSelector.selectedIndex = speakerList.selectedIndex;
	controller.appendChild(speakerSelector);
	//speakerDiv.appendChild(speakerSelector);
	//controller.appendChild(speakerDiv);
	
	var videocontainer = document.createElement("div");
	videocontainer.setAttribute("class", "videocontainer");
	
	var imgObj;
	imgObj = document.createElement("img");
	imgObj.setAttribute("class", "video");
	imgObj.setAttribute("name", peerid+"_img");
	imgObj.setAttribute("id", peerid+"_"+ trackid+"_img");
	imgObj.setAttribute("peerid", peerid);
	imgObj.setAttribute("trackid", trackid);
	imgObj.src = "./pics/soundonly.svg";
	videocontainer.appendChild(imgObj);
	
	var imgLabel = document.createElement("label");
	imgLabel.setAttribute("for", peerid+"_"+ trackid+"_img");
	imgLabel.innerHTML = peerid;
	imgLabel.setAttribute("class", "videolabel");
	videocontainer.appendChild(imgLabel);
	
	var audioObj = new Audio();
	audioObj.srcObject = audiotrack;
	//audioObj.src = stream;
	//audioObj.src = "..\\video\\"+peerid+".mp3";
	var speakerId = getSelectedSpeaker();
	//screenObj.volume = 0;
	(async () => {
		await audioObj.setSinkId(speakerId)
			.then(function() {
			console.log('setSinkID Success, audio is being played on '+speakerId);
		})
		.catch(function(err) {
			console.error('setSinkId Err:', err);
		});
		speakerSelector.addEventListener("change", speakerSelectEvent);
	})();
	audioObj.play();
	//var audioObj;
	//audioObj = document.createElement('audio');
	audioObj.setAttribute('id', peerid+'_'+ trackid+"_audio");
	audioObj.setAttribute('class', "soundonly");
	audioObj.setAttribute('name', peerid+"_audio");
	audioObj.setAttribute('peerid', peerid);
	audioObj.setAttribute('trackid', trackid);
	audioObj.setAttribute('mutemode', muteMode);
	audioObj.controls=true;
	speakerSelector.setAttribute('speakerid', audioObj.id);
	if(trackid > 0){
		//screenObj.setAttribute('muted', 'true');
		audioObj.muted = true;
	}
	if(muteMode=="true"){
		audioObj.muted = true;
		audioObj.controls = false;
	}
	audioObj.setAttribute('autoplay', '1');
	videocontainer.appendChild(audioObj);
	
	//録画中ならリストに加える
	if(isRecording){
		addAudioRecorder(audioObj, peerid);
	}
	
	container.appendChild(controller);
	container.appendChild(videocontainer);
	
	if(main.childElementCount == 0){
		fadeOutBodyImg();
		//add to main
		container.setAttribute("class", "maincontainer");
		//container.setAttribute("name", "mainvideo");
		main.appendChild(container);
	} else {
		//add to sub
		container.setAttribute("class", "subcontainer");
		//container.setAttribute("name", "subvideo");
		sub.appendChild(container);
	}
	if(remotePeerIDVideoContainerMap.has(peerid)){
		
	} else {
		remotePeerIDVideoContainerMap.set(peerid, new Array());
	}
	remotePeerIDVideoContainerMap.get(peerid).push(container);
	
	//新しい映像が加わったのでリサイズ
	//calcMainContainersSize();
	//calcSubContainersSize();
	setSplitMinSize();
	return container;
}

//相手の画面共有動画
function addRemoteDisplayMedia(peerid, videotrack){
}

function speakerSelectEvent(event){
	//個別のスピーカー設定
	var speakerSelector = this;
	var speakerId = speakerSelector.options[speakerSelector.selectedIndex].value;
	console.log("selected speaker id = "+speakerId +" for " +speakerSelector.getAttribute("speakerid"));
	var mediaObj = document.getElementById(speakerSelector.getAttribute("speakerid"));
	/*
	screenObj.setSinkId(speakerId)
		.then(function() {
		console.log('setSinkID Success, sub audio is being played on '+speakerId +' at '+screenObj.id);
	})
	.catch(function(err) {
		console.error('setSinkId Err:', err);
	});
	*/
	
	//screenObj.volume = 0;
	(async () => {
		await mediaObj.setSinkId(speakerId)
			.then(function() {
			console.log('setSinkID Success, audio is being played on '+speakerId +' at '+mediaObj.id);
		})
		.catch(function(err) {
			console.error('setSinkId Err:', err);
		});
	})();	
}

function windowResizeListener(event){
	calsSubContainersSize();
}


function calcMainContainersSize(){
	var element = document.getElementById("main");
	var controllerMergin = 31;
	var workspaceHeight = parseInt(window.getComputedStyle(element).height);
	var workspaceWidth = parseInt(window.getComputedStyle(element).width);
	var widthMargin = 10;
	var heightMargin = 20;
	var verticalMoceMargin = 30;
	var bestRowCol = getBestRowCol(workspaceHeight-verticalMoceMargin, workspaceWidth, element.children.length, controllerMergin, widthMargin, heightMargin);
	var bestRow = bestRowCol[0];
	var bestCol = bestRowCol[1];
	var bestWidth = bestRowCol[2];
	var bestHeight = bestRowCol[3];
	//console.log("main "+bestRow +"/"+bestCol);
	var maincontainerElements = document.getElementsByClassName("maincontainer");
	const scrollBar = element.offsetWidth - element.clientWidth;
	for(var i = 0; i<maincontainerElements.length; i++){
		maincontainerElements[i].style.width = bestWidth+"px";
		maincontainerElements[i].style.height = bestHeight+"px";
	}
	
	var elements = document.getElementsByName("clickcanvas");
	for (var i = 0; i < elements.length; i++) {
		canvasSizeChanged(elements[i]);
		//console.log('resize canvas : '+elements[i].getAttribute("id"));
	}
}

function calcSubContainersSize(){
	var element = document.getElementById("sub");
	var controllerMergin = 31;
	var workspaceHeight = parseInt(window.getComputedStyle(element).height);
	var workspaceWidth = parseInt(window.getComputedStyle(element).width);
	var  minWidth = 320;
	var minHeigiht = minWidth*9/16+controllerMergin;
	var subContainers = document.getElementById("sub");
	var subcontainerElements = document.getElementsByClassName("subcontainer");
	const scrollBar = subContainers.offsetWidth - subContainers.clientWidth;
	var widthMargin = 10;
	var heightMargin = 20;
	var bestRowCol = getBestRowCol(workspaceHeight-heightMargin, workspaceWidth, element.children.length, controllerMergin, widthMargin,heightMargin);
	var bestRow = bestRowCol[0];
	var bestCol = bestRowCol[1];
	var bestWidth = bestRowCol[2];
	var bestHeight = bestRowCol[3];
	//console.log("sub " +bestRow +"/"+bestCol);
	if(bestWidth < minWidth){
		subContainers.style.overflowY = "auto";
		//console.log("sub 小さすぎるのでスクロール");
	} else {
		subContainers.style.overflowY = "hidden";
	}
	if(workspaceWidth < minWidth){
		subContainers.style.overflowX = "auto";
		console.log("workspaceが狭すぎるのでサイズ増やしてあげないといけないが放置");
		//subContainers.style.width = minWidth+"px";//これすると横固定でSubがリサイズされなくなるので積む
	} else {
		subContainers.style.overflowX = "hidden";
		//subContainers.style.width = "100%";
	}
	for(var i = 0; i<subcontainerElements.length; i++){
		if(bestWidth < minWidth){
			subcontainerElements[i].style.width = minWidth+"px";
			subcontainerElements[i].style.height = minHeigiht+"px";
		} else {
			subcontainerElements[i].style.width = bestWidth+"px";
			subcontainerElements[i].style.height = bestHeight+"px";
		}
	}
	
	var elements = document.getElementsByName("clickcanvas");
	for (var i = 0; i < elements.length; i++) {
		canvasSizeChanged(elements[i]);
		//console.log('resize canvas : '+elements[i].getAttribute("id"));
	}
}

/*余白が最小になる計算*/
function getBestRowCol(workspaceHeight, workspaceWidth, numVideo, controllerHeight, widthMargin, heightMargin){
	var minMargin = -1;
	var bestRow = 1;
	var bestCol = numVideo;
	var bestHeight = workspaceHeight;
	var bestWidth = workspaceWidth;
	for(var row=1; row<=numVideo; row++){
		var col = Math.ceil(numVideo / row);//切り上げ
		var eachWidth = workspaceWidth/col - widthMargin;
		var eachHeight = eachWidth * 9/16+controllerHeight;
		var totalHeight = (eachHeight+heightMargin) * row;
		if(totalHeight > workspaceHeight){
			//高さ基準で
			eachHeight = workspaceHeight/row-heightMargin;
			eachWidth = (eachHeight-controllerHeight)*16/9;
		} 
		var totalVideoArea = eachWidth * eachHeight * numVideo;
		if(minMargin < 0 || (minMargin >=0 && minMargin > (workspaceHeight*workspaceWidth-totalVideoArea))){
			bestRow = row;
			bestCol = col;
			bestHeight = eachHeight;
			bestWidth = eachWidth;
			minMargin = workspaceHeight*workspaceWidth-totalVideoArea;
		}
	}
	return [bestRow,bestCol, bestWidth, bestHeight];
}

//windowsがリサイズしたり，main subを入れ替えたりしたら呼び出す
function canvasSizeChanged(canvasObj){
	/*
	canvasのサイズを変更する際はcanvasタグの属性で設定しないといけない
	参照https://qiita.com/ShinyaOkazawa/items/9e662bf2121548f79d5f
	*/
	canvasObj.width =canvasObj.offsetWidth;
	canvasObj.height =canvasObj.offsetHeight;
	
	//backgroundcanvasもついでに
	var bgObj = document.getElementById(canvasObj.getAttribute("peerid")+"_"+canvasObj.getAttribute("trackid")+"_bgcanvas");
	if(bgObj != null){
		drawActionPointOnEachCanvas(bgObj);
	}
}

//canvasごとに管理
var singleClickTimerMap = new Map();//ダブルクリックがなかったらシングルクリックイベントを遅延発火
var dragTimerMap = new Map();//ダブルクリックがなかったらドラッグイベントを遅延発火
var drawClerTimerMap = new Map();
//var clicked = false;    // クリック状態を保持するフラグ
var clickMap = new Map();//canvas.id -> [absolute x on the canvas, absolute y on the canvas, x ratio on the canvas, y ratio on the canvas, mouse radian direction from the center of the canvas]
var dblclickMap = new Map();//canvas.id -> [absolute x on the canvas, absolute y on the canvas, x ratio on the canvas, y ratio on the canvas, mouse radian direction from the center of the canvas]
var dragMap = new Map();//canvas.id -> true/false
var gazePics;
gazePics = new Image();
gazePics.src = "./pics/attention.svg";
var handPics;
handPics = new Image();
handPics.src = "./pics/gestures/palmup-oncanvas.svg";
var dblClickDuration = 300;//msec
var dragDuration = 200;//msec
var drawMarkDuration = 1000;//msec
//ダブルクリックイベントとシングルクリックイベントを両方登録するとclick->click->dblclickと3つイベントが発火してしまうので排他処理したい場合はclickイベント内で判別する
function canvasDblClicked(event){
	console.log(this.id+" dblcliecked "+event);
}

//clickイベントとcanvas dragを検出するためのmouseイベントが併用できないのでmouseイベントのみで
function canvasMouseDown(event){
	//console.log(this.id+" canvasMouseDown "+event);
	var canvasObj = this;
	canvasSizeChanged(canvasObj);
	//console.log(clickX +", "+clickY+"/"+canvasObj.width+","+canvasObj.height);
	var myPeerID = document.getElementById("myuserid");
	var points = getMousePointOnCanvas(canvasObj, event); 
	var x = points[0];
	var y = points[1];
	var xRatio = points[2];
	var yRatio = points[3];
	var directionRad = points[4];
	
	if(!clickMap.has(canvasObj.id)){
		clickMap.set(canvasObj.id, [-1,-1,-1,-1,-1]);
	}
	if(!dblclickMap.has(canvasObj.id)){
		dblclickMap.set(canvasObj.id, [-1,-1,-1,-1,-1]);
	}
	if(!dragMap.has(canvasObj.id)){
		dragMap.set(canvasObj.id, false);
	}
	//var imgWidth = handPics.naturalWidth;
	//var imgHeight = handPics.naturalHeight;
	var imgWidth = 100;
	var imgHeight = 100;
	//console.log("distance from previous point = "+getDistanceFromPrevPoint(dblclickMap.get(canvasObj.id), points)+ " "+dblclickMap.get(canvasObj.id));
	if(dblclickMap.get(canvasObj.id)[0]>= 0 && getDistanceFromPrevPoint(dblclickMap.get(canvasObj.id), points) <= (imgHeight+imgWidth)/2){
		if(dragTimerMap.has(canvasObj.id)){
			clearTimeout(dragTimerMap.get(canvasObj.id));
			dragTimerMap.delete(canvasObj.id);
			//console.log("drag timer reset of "+canvasObj.id);
		}
		var dragTimer = setTimeout(function () {
			//console.log("drag dblclick point");
			dragMap.set(canvasObj.id, true);
			if(drawClerTimerMap.has(canvasObj.id)){
				clearTimeout(drawClerTimerMap.get(canvasObj.id));
				drawClerTimerMap.delete(canvasObj.id)
			}
			sendDragMotion(myPeerID, canvasObj, x, y, xRatio, yRatio, directionRad, currenthandgesture)
		}, dragDuration);
		dragTimerMap.set(canvasObj.id, dragTimer);
	} else if (clickMap.get(canvasObj.id)[0] >= 0 && getDistanceFromPrevPoint(clickMap.get(canvasObj.id), points) <= (imgHeight+imgWidth)/2){
		if(singleClickTimerMap.has(canvasObj.id)){
			clearTimeout(singleClickTimerMap.get(canvasObj.id));
			singleClickTimerMap.delete(canvasObj.id)
		}
		if(dragTimerMap.has(canvasObj.id)){
			clearTimeout(dragTimerMap.get(canvasObj.id));
			dragTimerMap.delete(canvasObj.id);
			//console.log("drag timer reset of "+canvasObj.id);
		}
		var dragTimer = setTimeout(function () {
			//console.log("drag dblclick point");
			dragMap.set(canvasObj.id, true);
			if(drawClerTimerMap.has(canvasObj.id)){
				clearTimeout(drawClerTimerMap.get(canvasObj.id));
				drawClerTimerMap.delete(canvasObj.id)
			}
			sendDragMotion(myPeerID, canvasObj, x, y, xRatio, yRatio, directionRad, currenthandgesture)
		}, dragDuration);
		dragTimerMap.set(canvasObj.id, dragTimer);
	}
}
function canvasMouseUp(event){
	//console.log(this.id+" canvasMouseUp "+event);
	var canvasObj = this;
	//時間内に話したらdblclickでそうじゃなかったらDrag終わり判定
	var canvasObj = this;
	//console.log(clickX +", "+clickY+"/"+canvasObj.width+","+canvasObj.height);
	var myPeerID = document.getElementById("myuserid");
	var points = getMousePointOnCanvas(canvasObj, event); 
	var x = points[0];
	var y = points[1];
	var xRatio = points[2];
	var yRatio = points[3];
	var directionRad = points[4];
	
	if(!clickMap.has(canvasObj.id)){
		clickMap.set(canvasObj.id, [-1,-1,-1,-1,-1]);
	}
	if(!dragMap.has(canvasObj.id)){
		dragMap.set(canvasObj.id, false);
	}
	//var imgWidth = handPics.naturalWidth;
	//var imgHeight = handPics.naturalHeight;
	var imgWidth = 100;
	var imgHeight = 100;
	if(dragMap.get(canvasObj.id)) {
		//console.log("end of drag");
		var eventName = "dragendevent";		
		var sendText = "{\"peerid\": \""+myPeerID.value+"\", \""+eventName+"\": {\"remotepeerid\":\""+canvasObj.getAttribute('peerid')+"\", \"trackid\":"+canvasObj.getAttribute('trackid')+",\"x\":"+x+", \"y\": "+y+",\"xratio\":"+xRatio+", \"yratio\": "+yRatio+", \"hand\": \""+currenthandgesture+"\"}}";
		console.log("drag end event "+sendText);
		publishData(sendText);
	} else if (clickMap.get(canvasObj.id)[0] >= 0 && getDistanceFromPrevPoint(clickMap.get(canvasObj.id), points) <= (imgHeight+imgWidth)/2) {
		//clickMap.delete(canvasObj.id);
		//clickMap.set(canvasObj.id, false);
		
		if(singleClickTimerMap.has(canvasObj.id)){
			clearTimeout(singleClickTimerMap.get(canvasObj.id));
			singleClickTimerMap.delete(canvasObj.id)
		}
		if(dragTimerMap.has(canvasObj.id)){
			clearTimeout(dragTimerMap.get(canvasObj.id));
			dragTimerMap.delete(canvasObj.id);
		}
		var eventName = "dblclickevent";		
		var sendText = "{\"peerid\": \""+myPeerID.value+"\", \""+eventName+"\": {\"remotepeerid\":\""+canvasObj.getAttribute('peerid')+"\", \"trackid\":"+canvasObj.getAttribute('trackid')+",\"x\":"+x+", \"y\": "+y+",\"xratio\":"+xRatio+", \"yratio\": "+yRatio+", \"hand\": \""+currenthandgesture+"\"}}";
		console.log("dblclicked event "+sendText);
		publishData(sendText);
		//canvasに描画
		var context = canvasObj.getContext( "2d" ) ;
		context.clearRect(0, 0, canvasObj.offsetWidth, canvasObj.offsetHeight);
		
		context.save();
		context.translate(x, y);
		context.rotate(directionRad+Math.PI);
		if(xRatio >= 0.5){
			//上下反転
			context.scale(1, -1);
			if(yRatio >= 0.5){
				//right down			
			} else {
				//right up
			}
		} else {
			if(yRatio >= 0.5){
				//left down
			} else {
				//left up
			}
		}
		context.drawImage(handPics, 0, -imgHeight/2, imgWidth, imgHeight);
		context.restore();
		dblclickMap.set(canvasObj.id, points);
		//return;
	} else {
		clickMap.delete(canvasObj.id);
		clickMap.set(canvasObj.id, points);
		if(singleClickTimerMap.has(canvasObj.id)){
			clearTimeout(singleClickTimerMap.get(canvasObj.id));
			singleClickTimerMap.delete(canvasObj.id);
			//console.log("single click timer reset of "+canvasObj.id);
		}
		
		if(dragTimerMap.has(canvasObj.id)){
			clearTimeout(dragTimerMap.get(canvasObj.id));
			dragTimerMap.delete(canvasObj.id);
		}
		var singleClickTimer = setTimeout(function () {
			// ダブルクリックによりclickedフラグがリセットされていない
			//     -> シングルクリックだった
			if (clickMap.get(canvasObj.id)[0]>=0) {
				//canvasに描画
				var context = canvasObj.getContext( "2d" ) ;
				context.clearRect(0, 0, canvasObj.offsetWidth, canvasObj.offsetHeight);
				//var imgWidth = gazePics.naturalWidth;
				//var imgHeight = gazePics.naturalHeight;
				var imgWidth = 80;
				var imgHeight = 80;
				context.drawImage(gazePics, x-imgWidth/2, y-imgHeight/2, imgWidth, imgHeight);
				//console.log("natural size : "+imgWidth+"/"+imgHeight);
				var eventName = "clickevent";			
				var sendText = "{\"peerid\": \""+myPeerID.value+"\", \""+eventName+"\": {\"remotepeerid\":\""+canvasObj.getAttribute('peerid')+"\", \"trackid\":"+canvasObj.getAttribute('trackid')+", \"x\":"+x+", \"y\": "+y+",\"xratio\":"+xRatio+", \"yratio\": "+yRatio+"}}";
				console.log("clicked event "+sendText);
				publishData(sendText);
			} else {
				console.log("already clicked ? why ? "+canvasObj.id);
			}
			
			clickMap.delete(canvasObj.id);
			clickMap.set(canvasObj.id, [-1, -1, -1, -1, -1]);
		}, dblClickDuration);
		singleClickTimerMap.set(canvasObj.id, singleClickTimer);
	}
	
	if(drawClerTimerMap.has(canvasObj.id)){
		clearTimeout(drawClerTimerMap.get(canvasObj.id));
		drawClerTimerMap.delete(canvasObj.id)
	}
	var drawClerTimer = setTimeout(function () {
		//canvasに描画 Clear
		var context = canvasObj.getContext( "2d" ) ;
		context.clearRect(0, 0, canvasObj.width, canvasObj.height);
		clicked = false;
		if (clickMap.get(canvasObj.id)) {
			clickMap.delete(canvasObj.id);
			clickMap.set(canvasObj.id, false);
		}
		dblclickMap.set(canvasObj.id, [-1, -1, -1, -1, -1]);
		console.log("clear canvas "+canvasObj.id);
	}, drawMarkDuration);
	drawClerTimerMap.set(canvasObj.id, drawClerTimer);
	
	dragMap.set(canvasObj.id, false);
}
function canvasMouseOut(event){
	//console.log(this.id+" canvasMouseOut "+event);
	event.preventDefault();//not-allowed, https://stackoverflow.com/questions/25149912/cursor-unpleasantly-changes-during-drag-operation-in-nested-elements
	var canvasObj = this;
	var myPeerID = document.getElementById("myuserid");
	if(dragMap.has(canvasObj.id) && dragMap.get(canvasObj.id) && !drawClerTimerMap.has(canvasObj.id)){
		var drawClerTimer = setTimeout(function () {
			var eventName = "dragendevent";		
			var sendText = "{\"peerid\": \""+myPeerID.value+"\", \""+eventName+"\": {\"remotepeerid\":\""+canvasObj.getAttribute('peerid')+"\", \"trackid\":"+canvasObj.getAttribute('trackid')+",\"x\":0, \"y\": 0,\"xratio\":0, \"yratio\": 0, \"hand\": \"none\"}}";
			console.log("drag end event "+sendText);
			publishData(sendText);
			
			//canvasに描画 Clear
			var context = canvasObj.getContext( "2d" ) ;
			context.clearRect(0, 0, canvasObj.width, canvasObj.height);
			clicked = false;
			if (clickMap.get(canvasObj.id)) {
				clickMap.delete(canvasObj.id);
				clickMap.set(canvasObj.id, false);
			}
			dblclickMap.set(canvasObj.id, [-1, -1, -1, -1, -1]);
			console.log("clear canvas "+canvasObj.id);
		}, drawMarkDuration);
		drawClerTimerMap.set(canvasObj.id, drawClerTimer);
	}
	dragMap.set(canvasObj.id, false);
	
}
function canvasMouseMove(event){
	event.preventDefault();//not-allowed, https://stackoverflow.com/questions/25149912/cursor-unpleasantly-changes-during-drag-operation-in-nested-elements
	var canvasObj = this;
	var myPeerID = document.getElementById("myuserid");
	var points = getMousePointOnCanvas(canvasObj, event); 
	var x = points[0];
	var y = points[1];
	var xRatio = points[2];
	var yRatio = points[3];
	var directionRad = points[4];
	if(dragMap.get(canvasObj.id)){
		//console.log(this.id+" dragging "+event);
		sendDragMotion(myPeerID, canvasObj, x, y, xRatio, yRatio, directionRad, currenthandgesture);
	}
}

function sendDragMotion(myPeerID, canvasObj, x, y, xRatio, yRatio, directionRad, currenthandgesture){
	//var imgWidth = handPics.naturalWidth;
	//var imgHeight = handPics.naturalHeight;
	var imgWidth = 100;
	var imgHeight = 100;
	var eventName = "dragevent";		
	var sendText = "{\"peerid\": \""+myPeerID.value+"\", \""+eventName+"\": {\"remotepeerid\":\""+canvasObj.getAttribute('peerid')+"\", \"trackid\":"+canvasObj.getAttribute('trackid')+",\"x\":"+x+", \"y\": "+y+",\"xratio\":"+xRatio+", \"yratio\": "+yRatio+", \"hand\": \""+currenthandgesture+"\"}}";
	console.log("dragevent event "+sendText);
	publishData(sendText);
	//canvasに描画
	var context = canvasObj.getContext( "2d" ) ;
	context.clearRect(0, 0, canvasObj.offsetWidth, canvasObj.offsetHeight);
	
	context.save();
	context.translate(x, y);
	context.rotate(directionRad+Math.PI);
	if(xRatio >= 0.5){
		//上下反転
		context.scale(1, -1);
		if(yRatio >= 0.5){
			//right down			
		} else {
			//right up
		}
	} else {
		if(yRatio >= 0.5){
			//left down
		} else {
			//left up
		}
	}
	context.drawImage(handPics, 0, -imgHeight/2, imgWidth, imgHeight);
	context.restore();
}

function canvasClicked(event){
	console.log(this.id +" cliecked "+event);
	var canvasObj = this;
	canvasSizeChanged(canvasObj);
	//console.log(clickX +", "+clickY+"/"+canvasObj.width+","+canvasObj.height);
	
	var myPeerID = document.getElementById("myuserid");
	var points = getMousePointOnCanvas(canvasObj, event); 
	var x = points[0];
	var y = points[1];
	var xRatio = points[2];
	var yRatio = points[3];
	var directionRad = points[4];
	
	if(!clickMap.has(canvasObj.id)){
		clickMap.set(canvasObj.id, false)
	}
	
	if (clickMap.get(canvasObj.id)) {
		//clickMap.delete(canvasObj.id);
		//clickMap.set(canvasObj.id, false);
		
		if(singleClickTimerMap.has(canvasObj.id)){
			clearTimeout(singleClickTimerMap.get(canvasObj.id));
			singleClickTimerMap.delete(canvasObj.id)
		}
		var eventName = "dblclickevent";		
		var sendText = "{\"peerid\": \""+myPeerID.value+"\", \""+eventName+"\": {\"remotepeerid\":\""+canvasObj.getAttribute('peerid')+"\", \"trackid\":"+canvasObj.getAttribute('trackid')+",\"x\":"+x+", \"y\": "+y+",\"xratio\":"+xRatio+", \"yratio\": "+yRatio+", \"hand\": \""+currenthandgesture+"\"}}";
		console.log("clicked event "+sendText);
		publishData(sendText);
		//canvasに描画
		var context = canvasObj.getContext( "2d" ) ;
		context.clearRect(0, 0, canvasObj.offsetWidth, canvasObj.offsetHeight);
		//var imgWidth = handPics.naturalWidth;
		//var imgHeight = handPics.naturalHeight;
		var imgWidth = 100;
		var imgHeight = 100;
		
		context.save();
		context.translate(x, y);
		context.rotate(directionRad+Math.PI);
		if(xRatio >= 0.5){
			//上下反転
			context.scale(1, -1);
			if(yRatio >= 0.5){
				//right down			
			} else {
				//right up
			}
		} else {
			if(yRatio >= 0.5){
				//left down
			} else {
				//left up
			}
		}
		context.drawImage(handPics, 0, -imgHeight/2, imgWidth, imgHeight);
		context.restore();
		
		//return;
	} else {
		clickMap.delete(canvasObj.id);
		clickMap.set(canvasObj.id, true);
		if(singleClickTimerMap.has(canvasObj.id)){
			clearTimeout(singleClickTimerMap.get(canvasObj.id));
			singleClickTimerMap.delete(canvasObj.id);
			console.log("single click timer reset of "+canvasObj.id);
		}
		var singleClickTimer = setTimeout(function () {
			// ダブルクリックによりclickedフラグがリセットされていない
			//     -> シングルクリックだった
			if (clickMap.get(canvasObj.id)) {
				//canvasに描画
				var context = canvasObj.getContext( "2d" ) ;
				context.clearRect(0, 0, canvasObj.offsetWidth, canvasObj.offsetHeight);
				//var imgWidth = gazePics.naturalWidth;
				//var imgHeight = gazePics.naturalHeight;
				var imgWidth = 80;
				var imgHeight = 80;
				context.drawImage(gazePics, x-imgWidth/2, y-imgHeight/2, imgWidth, imgHeight);
				//console.log("natural size : "+imgWidth+"/"+imgHeight);
				var eventName = "clickevent";			
				var sendText = "{\"peerid\": \""+myPeerID.value+"\", \""+eventName+"\": {\"remotepeerid\":\""+canvasObj.getAttribute('peerid')+"\", \"trackid\":"+canvasObj.getAttribute('trackid')+", \"x\":"+x+", \"y\": "+y+",\"xratio\":"+xRatio+", \"yratio\": "+yRatio+"}}";
				console.log("clicked event "+sendText);
				publishData(sendText);
			} else {
				console.log("already clicked ? why ? "+canvasObj.id);
			}
			clickMap.delete(canvasObj.id);
			clickMap.set(canvasObj.id, false);
		}, dblClickDuration);
		singleClickTimerMap.set(canvasObj.id, singleClickTimer);
	}
	
	if(drawClerTimerMap.has(canvasObj.id)){
		clearTimeout(drawClerTimerMap.get(canvasObj.id));
		drawClerTimerMap.delete(canvasObj.id)
	}
	var drawClerTimer = setTimeout(function () {
		//canvasに描画 Clear
		var context = canvasObj.getContext( "2d" ) ;
		context.clearRect(0, 0, canvasObj.width, canvasObj.height);
		clicked = false;
		if (clickMap.get(canvasObj.id)) {
			clickMap.delete(canvasObj.id);
			clickMap.set(canvasObj.id, false);
		}
		console.log("clear canvas "+canvasObj.id);
	}, drawMarkDuration);
	drawClerTimerMap.set(canvasObj.id, drawClerTimer);
}

// return [absolute x on the canvas, absolute y on the canvas, x ratio on the canvas, y ratio on the canvas, mouse radian direction from the center of the canvas];
function getMousePointOnCanvas(canvasObj, event){
	var clickX = event.pageX ;
	var clickY = event.pageY ;
	//console.log(clickX +", "+clickY+"/"+canvasObj.width+","+canvasObj.height);
	var myPeerID = document.getElementById("myuserid");

	// 要素の位置を取得
	var clientRect = canvasObj.getBoundingClientRect() ;
	var positionX = clientRect.left + window.pageXOffset ;
	var positionY = clientRect.top + window.pageYOffset ;

	// 要素内におけるクリック位置を計算
	var x = clickX - positionX ;
	var y = clickY - positionY ;
	// キャンバス中心座標
	var xC = (x-canvasObj.offsetWidth/2);
	var yC = (y-canvasObj.offsetHeight/2);
	var directionRad = 0;
	if(xC == 0){
		if(yC >= 0) directionRad = Math.PI/2;
		else directionRad = -Math.PI/2;
	} else {
		directionRad = Math.atan2(yC, xC);
	}
	
	var xRatio = x/canvasObj.offsetWidth;
	var yRatio = y/canvasObj.offsetHeight;
	//console.log("click on canvas "+canvasObj.id+":"+x +"/"+y+", click on page:"+clickX +"/"+clickY+", canvas size:"+canvasObj.width+"/"+canvasObj.height+", canvas offset size:"+canvasObj.offsetWidth+"/"+canvasObj.offsetHeight+", ratio:"+xRatio+"/"+yRatio);
	return [x, y, xRatio, yRatio, directionRad];
}

function getDistanceFromPrevPoint(prevPoints, currentPoint){
	return Math.sqrt(Math.pow(prevPoints[0]-currentPoint[0],2)+Math.pow(prevPoints[1]-currentPoint[1],2));
}

function setMainVideo(event){
	var peerid = this.getAttribute("peerid");
	var trackid = this.getAttribute("trackid");
	
	console.log("set main : "+peerid+"_"+trackid+"_container");
	var videoContainerElement = document.getElementById(peerid+"_"+trackid+"_container");
	var videoElement = document.getElementById(peerid+"_"+trackid+"_video");
	// peerid+"_" + trackid+"_mainbutton
	var mainButton = document.getElementById(peerid+"_"+trackid+"_mainbutton");
	var subButton = document.getElementById(peerid+"_"+trackid+"_subbutton");
	mainButton.hidden = true;
	subButton.hidden = false;
	
	//videoElement.play();
	var main = document.getElementById("main");
	var sub = document.getElementById("sub");
	if(main.lastChild == videoContainerElement){
		//mainのmainボタンを間違って押した場合
		return;
	}
	/*
	while (main.lastChild) {
		if(main.lastChild.id != null){
			console.log(main.lastChild.id);
			//sort なしで入れ替え
			var toSubElement = main.lastChild;
			main.removeChild(main.lastChild);
			toSubElement.setAttribute("class", "subcontainer");
			sub.insertBefore(toSubElement, videoContainerElement);
			break;//main要素は1つだけ
		} else {
			break;
		}
		//sort あり
		//main.removeChild(main.lastChild);
	}
	*/
	/*
	//sort あり
	var sub = document.getElementById("sub");
	while (sub.lastChild) {
		sub.removeChild(sub.lastChild);
	}
	*/
	
	videoContainerElement.setAttribute("class", "maincontainer");
	videoContainerElement.style.width ="";
	//videoContainerElement.setAttribute("name", "mainvideo");
	main.appendChild(videoContainerElement);
	
	/*
	//sort あり
	for(var[key, value] of remotePeerIDVideoContainerMap){
		//console.log(key+" has "+value.length+" videos");
		for (let i = 0; i < value.length; i++) {
			if(value[i] == videoContainerElement){
			} else {
				value[i].setAttribute("class", "subcontainer");
				//value[i].setAttribute("name", "subvideo");
				sub.appendChild(value[i]);
			}
		}
	}
	*/
	//calcMainContainersSize();
	//calcSubContainersSize();
	setSplitMinSize();
}

function setSubVideo(event){
	var peerid = this.getAttribute("peerid");
	var trackid = this.getAttribute("trackid");
	
	console.log("set main : "+peerid+"_"+trackid+"_container");
	var videoContainerElement = document.getElementById(peerid+"_"+trackid+"_container");
	var videoElement = document.getElementById(peerid+"_"+trackid+"_video");
	// peerid+"_" + trackid+"_mainbutton
	var mainButton = document.getElementById(peerid+"_"+trackid+"_mainbutton");
	var subButton = document.getElementById(peerid+"_"+trackid+"_subbutton");
	mainButton.hidden = false;
	subButton.hidden = true;

	//videoElement.play();
	var main = document.getElementById("main");
	var sub = document.getElementById("sub");
	
	main.removeChild(videoContainerElement);
	videoContainerElement.setAttribute("class", "subcontainer");
	sub.appendChild(videoContainerElement);
	
	/*
	//sort あり
	var sub = document.getElementById("sub");
	while (sub.lastChild) {
		sub.removeChild(sub.lastChild);
	}
	*/
	/*
	//sort あり
	for(var[key, value] of remotePeerIDVideoContainerMap){
		//console.log(key+" has "+value.length+" videos");
		for (let i = 0; i < value.length; i++) {
			if(value[i] == videoContainerElement){
			} else {
				value[i].setAttribute("class", "subcontainer");
				//value[i].setAttribute("name", "subvideo");
				sub.appendChild(value[i]);
			}
		}
	}
	*/
	
	
	//calcMainContainersSize();
	//calcSubContainersSize();
	setSplitMinSize();
}

function setVideoOrder(event){
	//console.log("change "+this.id);
	var peerid = this.getAttribute("peerid");
	var trackid = this.getAttribute("trackid");
	var videoContainer = document.getElementById(peerid+"_"+trackid+"_container");
	var elementName = "subcontainer";
	var containers = document.getElementById("sub");
	if(videoContainer.getAttribute("class").startsWith("sub")){
		
	} else if(videoContainer.getAttribute("class").startsWith("main")){
		elementName = "maincontainer";
		containers = document.getElementById("main");
	}
	if(this.id.endsWith("_nextbutton")){
		var elements = document.getElementsByClassName(elementName);
		for(var i = 0; i < elements.length-1; i++){
			if(elements[i]==videoContainer){
				//console.log("insert(next) : "+subElements[i+1].id +" " +subVideoContainer.id);
				containers.insertBefore(elements[i+1], videoContainer);
				break;
			}
		}
	} else if(this.id.endsWith("_prevbutton")){
		var elements = document.getElementsByClassName(elementName);
		for(var i = 1; i < elements.length; i++){
			if(elements[i]==videoContainer){
				//console.log("insert(prev) : "+subVideoContainer.id +" " +subElements[i-1].id);
				containers.insertBefore(videoContainer, elements[i-1]);
				break;
			}
		}
	}
}

function teleOpeModeChanged() {
	if (document.getElementById("teleopemodecheckbox").checked) {
		teleOpeMode = true;
		var elements = document.getElementsByClassName("videocanvas");
		for (var i = 0; i < elements.length; i++) {
			if(elements[i].getAttribute("name") == null){
			} else if(elements[i].getAttribute("name") == "clickcanvas"){
				console.log('addEventListener click to '+elements[i].getAttribute("id")+ ', style.display = '+elements[i].style.display + ' to \"\"');
				elements[i].addEventListener( "mousedown", canvasMouseDown);
				elements[i].addEventListener( "mousemove", canvasMouseMove);
				elements[i].addEventListener( "mouseup", canvasMouseUp);
				elements[i].addEventListener( "mouseout", canvasMouseOut);
				//elements[i].addEventListener( "click", canvasClicked);
				//elements[i].addEventListener( "dblclick", canvasDblClicked);
			} else if(elements[i].getAttribute("name") == "backgroundcanvas"){
			} else {
			} 
			elements[i].style.display ="";
		}
		
		sharingScreenCanvasObj.addEventListener( "mousedown", canvasMouseDown);
		sharingScreenCanvasObj.addEventListener( "mousemove", canvasMouseMove);
		sharingScreenCanvasObj.addEventListener( "mouseup", canvasMouseUp);
		sharingScreenCanvasObj.addEventListener( "mouseout", canvasMouseOut);
		sharingScreenCanvasObj.style.display ="";
		sharingScreenBgCanvasObj.style.display ="";
		
		
	} else {
		teleOpeMode = false;
		var elements = document.getElementsByClassName("videocanvas");
		for (var i = 0; i < elements.length; i++) {
			if(elements[i].getAttribute("name") == null){
			} else if(elements[i].getAttribute("name") == "clickcanvas"){
				console.log('removeEventListener click to '+elements[i].getAttribute("id")+ ', style.display = '+elements[i].style.display + ' to none');
				elements[i].removeEventListener( "mousedown", canvasMouseDown);
				elements[i].removeEventListener( "mousemove", canvasMouseMove);
				elements[i].removeEventListener( "mouseup", canvasMouseUp);
				elements[i].removeEventListener( "mouseout", canvasMouseOut);
				//elements[i].removeEventListener( "click", canvasClicked);
				//elements[i].removeEventListener( "dblclick", canvasDblClicked);
			} else if(elements[i].getAttribute("name") == "backgroundcanvas"){
			} else {
			} 
			elements[i].style.display ="none";
		}
		
		sharingScreenCanvasObj.removeEventListener( "mousedown", canvasMouseDown);
		sharingScreenCanvasObj.removeEventListener( "mousemove", canvasMouseMove);
		sharingScreenCanvasObj.removeEventListener( "mouseup", canvasMouseUp);
		sharingScreenCanvasObj.removeEventListener( "mouseout", canvasMouseOut);
		sharingScreenCanvasObj.style.display ="none";
		sharingScreenBgCanvasObj.style.display ="none";
	}
}

function closeSetupModal(){
	var setupModal = document.getElementById("setupModal");
	var myModal = bootstrap.Modal.getInstance(setupModal);
	myModal.hide();
}

function updateActionPointOnCanvas(cmds){
	//console.log(cmds);
	var jsonObj = JSON.parse(cmds);
	if(jsonObj.selected != null && jsonObj.currentpoint != null){
		targetSelected = jsonObj.selected;
		selectedTargetID = jsonObj.currentpoint;
	} else {
		targetSelected = false;
		selectedTargetID = "none";
	}
	if(drawJsonObjOnCanvasUsers.has(jsonObj.userName)){
		drawJsonObjOnCanvasUsers.delete(jsonObj.userName);
	}
	//console.log("set json "+jsonObj.user+" "+jsonObj);
	drawJsonObjOnCanvasUsers.set(jsonObj.user, jsonObj);
	//drawJsonObjOnCanvas = jsonObj;
	drawActionPointOnCanvas(jsonObj);
}

function drawActionPointOnCanvas(jsonObj){
	var userName = jsonObj.user;
	var canvasElements = document.getElementsByName('backgroundcanvas');
	for(var i = 0; i<canvasElements.length; i++){
		if(canvasElements[i].getAttribute("peerid") == userName){
			drawActionPointOnEachCanvas(canvasElements[i]);
		}
	}
	/*
	var canvasElements = document.getElementsByName('clickcanvas');
	for(var i = 0; i<canvasElements.length; i++){
		if(canvasElements[i].getAttribute("peerid") == userName){
			canvasSizeChanged(canvasElements[i]);
		}
	}
	*/
}


function drawActionPointOnEachCanvas(canvasElement){
	canvasElement.width =canvasElement.offsetWidth;
	canvasElement.height =canvasElement.offsetHeight;
	
	var context = canvasElement.getContext( "2d" ) ;
	context.save();
	context.clearRect(0, 0, canvasElement.width, canvasElement.height);
	//backgroundcanvas
	var drawJsonObjOnCanvas = drawJsonObjOnCanvasUsers.get(canvasElement.getAttribute("peerid"));
	if(drawJsonObjOnCanvas == null)return;
	
	var hasBehaviorButtons = false;

	
	//今あるdropdownボタンのうちBehaviorListにないものは削除
	{
		var videoContainerElement = canvasElement.parentNode;
		var currentbevhaiorbuttons = videoContainerElement.getElementsByClassName("dropdown");
		for(var i=currentbevhaiorbuttons.length-1; i>=0;i--){
			var foundBehavior = false;
			//視線エリアごとのビヘイビア
			for(var j = 0; j<drawJsonObjOnCanvas.points.length; j++){
				var behaviordataList = drawJsonObjOnCanvas.points[j].behaviorlist;
				if(behaviordataList != null && behaviordataList.length > 0 && currentbevhaiorbuttons[i].id == "behavior_"+drawJsonObjOnCanvas.points[j].id){
					foundBehavior = true;
					break;
				}
			}
			//トラックウィンドウごとのビヘイビア
			for(var j = 0; j<drawJsonObjOnCanvas.tracks.length; j++){
				var behaviordataList = drawJsonObjOnCanvas.tracks[j].behaviorlist;
				if(behaviordataList != null && behaviordataList.length > 0 && currentbevhaiorbuttons[i].id == "behavior_track_"+drawJsonObjOnCanvas.tracks[j].track){
					foundBehavior = true;
					break;
				}
			}
			if(!foundBehavior){
				videoContainerElement.removeChild(currentbevhaiorbuttons[i]);
			}
		}
	}

	for(var j = 0; j<drawJsonObjOnCanvas.points.length; j++){
		if(drawJsonObjOnCanvas.points[j].trackID == canvasElement.getAttribute("trackid")){
			if(targetSelected && drawJsonObjOnCanvas.points[j].id == selectedTargetID){
				//選択中
				context.strokeStyle = "rgba(255,0,0,0.5)";
			} else if(drawJsonObjOnCanvas.points[j].type == "human"){
				//context.strokeStyle = "green" ;
				context.strokeStyle = "rgba(0,255,0,0.5)";
			} else {
				//context.strokeStyle = "blue" ;
				context.strokeStyle = "rgba(0,0,255,0.5)";
			}
			var textPosOffsetX = 0;
			var textPosOffsetY = 0;
			if(drawJsonObjOnCanvas.points[j].type == "squareobject"){
				context.beginPath () ;
				context.lineWidth = 1.5 ;
				context.strokeRect((drawJsonObjOnCanvas.points[j].xRatio-drawJsonObjOnCanvas.points[j].widthRatio/2)*canvasElement.width, (drawJsonObjOnCanvas.points[j].yRatio-drawJsonObjOnCanvas.points[j].heightRatio/2)*canvasElement.height, drawJsonObjOnCanvas.points[j].widthRatio*canvasElement.width, drawJsonObjOnCanvas.points[j].heightRatio*canvasElement.height) ;
				//context.stroke() ;
				textPosOffsetX = drawJsonObjOnCanvas.points[j].widthRatio/2;
				textPosOffsetY = drawJsonObjOnCanvas.points[j].heightRatio/2;
			} else {
				context.beginPath () ;
				context.lineWidth = 1.5 ;
				context.arc(drawJsonObjOnCanvas.points[j].xRatio*canvasElement.width, drawJsonObjOnCanvas.points[j].yRatio*canvasElement.height, drawJsonObjOnCanvas.points[j].radiusRatio*canvasElement.width/2, 0 * Math.PI / 180, 360 * Math.PI / 180, false ) ;
				context.stroke() ;
				textPosOffsetX = drawJsonObjOnCanvas.points[j].radiusRatio/2;
				textPosOffsetY = drawJsonObjOnCanvas.points[j].radiusRatio/2;
			}
			
			var labelHeightOffset = 0, labelWidthOffset = 0;
			if(drawJsonObjOnCanvas.points[j].label != null && drawJsonObjOnCanvas.points[j].label != ""){
				//console.log("label = "+drawJsonObjOnCanvas.points[j].label);
				context.lineWidth = 0.1 ;
				context.font = "12px keifont";
				var textPosX = drawJsonObjOnCanvas.points[j].xRatio*canvasElement.width;
				var textPosY = drawJsonObjOnCanvas.points[j].yRatio*canvasElement.height;
				//var dirctionFromCenter = Math.atan2()
				// キャンバス中心座標
				var xC = (drawJsonObjOnCanvas.points[j].xRatio-0.5);
				var yC = (drawJsonObjOnCanvas.points[j].yRatio-0.5);
				var directionRad = 0;
				if(xC == 0){
					if(yC >= 0) directionRad = Math.PI/2;
					else directionRad = -Math.PI/2;
				} else {
					directionRad = Math.atan2(yC, xC);
				}
				var offsetRatio = 0.8;
				var metrics = context.measureText(drawJsonObjOnCanvas.points[j].label);
				labelHeightOffset = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
				labelWidthOffset = metrics.width;
				textPosX = (drawJsonObjOnCanvas.points[j].xRatio - Math.cos(directionRad)*textPosOffsetX*offsetRatio)*canvasElement.width-metrics.width/2;
				textPosY = (drawJsonObjOnCanvas.points[j].yRatio - Math.sin(directionRad)*textPosOffsetY*offsetRatio)*canvasElement.height;
				//console.log(directionRad*180/Math.PI +" "+textPosX +" "+textPosY+" "+xC +" "+yC);
				/*
				if(drawJsonObjOnCanvas.points[j].xRatio > 0.5){
					//右にあるので左寄せ
					textPosX = (drawJsonObjOnCanvas.points[j].xRatio - textPosOffsetX*0.8)*canvasElement.width;
				} else {
					//左にあるので右寄せ
					textPosX = (drawJsonObjOnCanvas.points[j].xRatio + textPosOffsetX*0.8)*canvasElement.width;
				}
				if(drawJsonObjOnCanvas.points[j].yRatio > 0.5){
					//下にあるので上寄せ
					textPosY = (drawJsonObjOnCanvas.points[j].yRatio - textPosOffsetY*0.8)*canvasElement.height;
				} else {
					//上にあるので下寄せ
					textPosY = (drawJsonObjOnCanvas.points[j].yRatio + textPosOffsetY*0.8)*canvasElement.height;
				}
				*/
				//console.log(metrics.width+" "+ (metrics.actualBoundingBoxAscent +metrics.actualBoundingBoxDescent));
				// 取得した横幅で Rectangle と Text を描画
				var textMargin = 5;
				if(targetSelected && drawJsonObjOnCanvas.points[j].id == selectedTargetID){
					//選択中
					//context.strokeStyle = "rgba(255,0,0,0.8)";
					context.fillStyle = "rgba(255,200,200,0.5)";
					//context.fillRect(textPosX-textMargin/2, textPosY-(metrics.actualBoundingBoxAscent +metrics.actualBoundingBoxDescent), metrics.width+textMargin, (metrics.actualBoundingBoxAscent +metrics.actualBoundingBoxDescent+textMargin));
					drawsq(textPosX-textMargin/2, textPosY-(metrics.actualBoundingBoxAscent +metrics.actualBoundingBoxDescent), metrics.width+textMargin, (metrics.actualBoundingBoxAscent +metrics.actualBoundingBoxDescent+textMargin), 4, context, "rgba(255,200,200,0.5)");
					context.fillStyle = "rgba(255,0,0,0.8)";
				} else if(drawJsonObjOnCanvas.points[j].type == "human"){
					//context.strokeStyle = "green" ;
					context.fillStyle = "rgba(200,255,200,0.5)";
					//context.fillRect(textPosX-textMargin/2, textPosY-(metrics.actualBoundingBoxAscent +metrics.actualBoundingBoxDescent), metrics.width+textMargin, (metrics.actualBoundingBoxAscent +metrics.actualBoundingBoxDescent+textMargin));
					drawsq(textPosX-textMargin/2, textPosY-(metrics.actualBoundingBoxAscent +metrics.actualBoundingBoxDescent), metrics.width+textMargin, (metrics.actualBoundingBoxAscent +metrics.actualBoundingBoxDescent+textMargin), 4, context, "rgba(200,255,200,0.5)");
					context.fillStyle = "rgba(0,255,0,0.8)";
				} else {
					//context.strokeStyle = "blue" ;
					context.fillStyle = "rgba(200,200,255,0.5)";
					//context.fillRect(textPosX-textMargin/2, textPosY-(metrics.actualBoundingBoxAscent +metrics.actualBoundingBoxDescent), metrics.width+textMargin, (metrics.actualBoundingBoxAscent +metrics.actualBoundingBoxDescent+textMargin));
					drawsq(textPosX-textMargin/2, textPosY-(metrics.actualBoundingBoxAscent +metrics.actualBoundingBoxDescent), metrics.width+textMargin, (metrics.actualBoundingBoxAscent +metrics.actualBoundingBoxDescent+textMargin), 4, context, "rgba(200,200,255,0.5)");
					context.fillStyle = "rgba(0,0,255,0.8)";
				}
				context.fillText(drawJsonObjOnCanvas.points[j].label, textPosX, textPosY);
				//context.strokeText(drawJsonObjOnCanvas.points[j].label, textPosX, textPosY);
				
			}

			//試しにボタン追加 behaviorlist
			//var behaviordataList = JSON.parse('[{"id":"hogehoge_id", "label":"hogehoge"},{"id":"foo_id", "label":"foo"},{"id":"baa_id", "label":"baa"]');
			//behaviorlistautoclose
			//if(true){
			if(drawJsonObjOnCanvas.points[j].behaviorlist != null && drawJsonObjOnCanvas.points[j].behaviorlist.length > 0){
				hasBehaviorButtons = true;
				var behaviordataList = drawJsonObjOnCanvas.points[j].behaviorlist;
				//console.log(behaviordataList);
				//backgroundcanvas上の子ノード全部削除
				var videoContainerElement = canvasElement.parentNode;
				
				var textPosX = drawJsonObjOnCanvas.points[j].xRatio*canvasElement.width;
				var textPosY = drawJsonObjOnCanvas.points[j].yRatio*canvasElement.height;
				//var dirctionFromCenter = Math.atan2()
				// キャンバス中心座標
				var xC = (drawJsonObjOnCanvas.points[j].xRatio-0.5);
				var yC = (drawJsonObjOnCanvas.points[j].yRatio-0.5);
				var directionRad = 0;
				if(xC == 0){
					if(yC >= 0) directionRad = Math.PI/2;
					else directionRad = -Math.PI/2;
				} else {
					directionRad = Math.atan2(yC, xC);
				}
				var offsetRatio = 0.8;
				textPosX = (drawJsonObjOnCanvas.points[j].xRatio - Math.cos(directionRad)*textPosOffsetX*offsetRatio)*canvasElement.width-labelWidthOffset/2;
				textPosY = (drawJsonObjOnCanvas.points[j].yRatio - Math.sin(directionRad)*textPosOffsetY*offsetRatio)*canvasElement.height+labelHeightOffset;
				
				var dropdownDiv = document.getElementById("behavior_"+drawJsonObjOnCanvas.points[j].id);
				
				if(dropdownDiv == null){
					dropdownDiv = document.createElement("div");
					dropdownDiv.setAttribute("id", "behavior_"+drawJsonObjOnCanvas.points[j].id);
					dropdownDiv.setAttribute("class", "dropdown");
					dropdownDiv.setAttribute("buttonid", "behaviorbutton_"+drawJsonObjOnCanvas.points[j].id);
					//buttonを追加すると何故かBodyの横スクロールが出る，このボタン位置からこのボタンを追加するキャンバス分横幅が出るのだが意味不明，Bodyのoverflow-x : hidden;で対処
					var dropdownButton = document.createElement("button");
					dropdownButton.setAttribute("id", "behaviorbutton_"+drawJsonObjOnCanvas.points[j].id);
					//dropdownButton.setAttribute("class", "btn btn-default rounded-circle p-0 bevhaiorselectbutton dropdown-toggle");
					dropdownButton.setAttribute("class", "btn btn-default btn-sm rounded-pill bevhaiorselectbutton dropdown-toggle");
					//dropdownButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-list-stars" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5z"/><path d="M2.242 2.194a.27.27 0 0 1 .516 0l.162.53c.035.115.14.194.258.194h.551c.259 0 .37.333.164.493l-.468.363a.277.277 0 0 0-.094.3l.173.569c.078.256-.213.462-.423.3l-.417-.324a.267.267 0 0 0-.328 0l-.417.323c-.21.163-.5-.043-.423-.299l.173-.57a.277.277 0 0 0-.094-.299l-.468-.363c-.206-.16-.095-.493.164-.493h.55a.271.271 0 0 0 .259-.194l.162-.53zm0 4a.27.27 0 0 1 .516 0l.162.53c.035.115.14.194.258.194h.551c.259 0 .37.333.164.493l-.468.363a.277.277 0 0 0-.094.3l.173.569c.078.255-.213.462-.423.3l-.417-.324a.267.267 0 0 0-.328 0l-.417.323c-.21.163-.5-.043-.423-.299l.173-.57a.277.277 0 0 0-.094-.299l-.468-.363c-.206-.16-.095-.493.164-.493h.55a.271.271 0 0 0 .259-.194l.162-.53zm0 4a.27.27 0 0 1 .516 0l.162.53c.035.115.14.194.258.194h.551c.259 0 .37.333.164.493l-.468.363a.277.277 0 0 0-.094.3l.173.569c.078.255-.213.462-.423.3l-.417-.324a.267.267 0 0 0-.328 0l-.417.323c-.21.163-.5-.043-.423-.299l.173-.57a.277.277 0 0 0-.094-.299l-.468-.363c-.206-.16-.095-.493.164-.493h.55a.271.271 0 0 0 .259-.194l.162-.53z"/></svg>';
					dropdownButton.setAttribute("data-bs-toggle", "dropdown");
					
					if(drawJsonObjOnCanvas.points[j].behaviorlistautoclose != null && drawJsonObjOnCanvas.points[j].behaviorlistautoclose == false){
						dropdownButton.setAttribute("data-bs-auto-close", "false");
						dropdownButton.setAttribute("aria-expanded", "false");	
					}
					
					dropdownButton.setAttribute("style", "width:1.0rem;height:1.0rem;");
					dropdownButton.addEventListener("shown.bs.dropdown", showBevhaiorDropDownList);
					dropdownButton.addEventListener("hidden.bs.dropdown", hideBevhaiorDropDownList);
					dropdownButton.setAttribute("isListShown", false);
					var dropdownUl = document.createElement("ul");
					dropdownUl.setAttribute("class", "dropdown-menu bevhaiordropdown");
					dropdownUl.setAttribute("aria-labelledby", "behaviorbutton_"+drawJsonObjOnCanvas.points[j].id);
					for (i = 0; i < behaviordataList.length; i++) {
						if (behaviordataList[i] != null) {
							//console.log(behaviordataList[i].id +" "+behaviordataList[i].label);
							var liEle = document.createElement("li");
							var aEle = document.createElement("a");
							aEle.setAttribute("class", "dropdown-item bevhaiorbutton");
							aEle.setAttribute("href", "#");
							//aEle.addEventListener("click", clickBevhaiorDropDownButton(aEle, canvasElement));{name: userName, handleEvent: sayHello}
							aEle.addEventListener("click", {buttonObj: aEle, canvasObj: canvasElement, handleEvent: clickBevhaiorDropDownButton});
							aEle.setAttribute("behaviordata", behaviordataList[i].id);
							aEle.setAttribute("peerid", canvasElement.getAttribute("peerid"));
							aEle.setAttribute("pointid", drawJsonObjOnCanvas.points[j].id);
							
							aEle.innerHTML = behaviordataList[i].label;
							liEle.appendChild(aEle);
							dropdownUl.appendChild(liEle);
						}
					}
					dropdownDiv.appendChild(dropdownButton);
					dropdownDiv.appendChild(dropdownUl);
					dropdownDiv.style.left = (textPosX)+"px";
					dropdownDiv.style.top = (textPosY)+"px";
					videoContainerElement.appendChild(dropdownDiv);
					console.log("add behavior button on "+canvasElement.id);
				} else {
					//すでにある場合は閉じてる場合のみ移動
					var dropdownButton = document.getElementById(dropdownDiv.getAttribute("buttonid"));
					//console.log("update position "+ "behavior_"+drawJsonObjOnCanvas.points[j].id+" "+dropdownButton.getAttribute("isListShown"));
					if(dropdownButton.getAttribute("isListShown")=="false"){
						dropdownDiv.style.left = (textPosX)+"px";
						dropdownDiv.style.top = (textPosY)+"px";
					}
				}				
			} else {
				
			}
			//end of drawJsonObjOnCanvas.points[j]
		}
	}
	//end of for(var j = 0; j<drawJsonObjOnCanvas.points.length; j++)

	//トラックウィンドウごとのビヘイビア
	for(var j = 0; j<drawJsonObjOnCanvas.tracks.length; j++){
		if(drawJsonObjOnCanvas.tracks[j].track == canvasElement.getAttribute("trackid")){
			if(drawJsonObjOnCanvas.tracks[j].behaviorlist != null && drawJsonObjOnCanvas.tracks[j].behaviorlist.length > 0){
				hasBehaviorButtons = true;
				var behaviordataList = drawJsonObjOnCanvas.tracks[j].behaviorlist;
				//console.log(behaviordataList);
				//backgroundcanvas上の子ノード全部削除
				var videoContainerElement = canvasElement.parentNode;
				//デフォルトで左上
				//var textPosX = 0.01*canvasElement.width;
				//var textPosY = 0.01*canvasElement.height;
				var textPosX = 5;
				var textPosY = 30;
				var dropdownDiv = document.getElementById("behavior_track_"+drawJsonObjOnCanvas.tracks[j].track);
				
				if(dropdownDiv == null){
					dropdownDiv = document.createElement("div");
					dropdownDiv.setAttribute("id", "behavior_track_"+drawJsonObjOnCanvas.tracks[j].track);
					dropdownDiv.setAttribute("class", "dropdown");
					dropdownDiv.setAttribute("buttonid", "behaviorbutton_track_"+drawJsonObjOnCanvas.tracks[j].track);
					//buttonを追加すると何故かBodyの横スクロールが出る，このボタン位置からこのボタンを追加するキャンバス分横幅が出るのだが意味不明，Bodyのoverflow-x : hidden;で対処
					var dropdownButton = document.createElement("button");
					dropdownButton.setAttribute("id", "behavior_track_"+drawJsonObjOnCanvas.tracks[j].track);
					//dropdownButton.setAttribute("class", "btn btn-default rounded-circle p-0 bevhaiorselectbutton dropdown-toggle");
					dropdownButton.setAttribute("class", "btn btn-info btn-sm rounded-pill bevhaiorselectbutton dropdown-toggle");
					//dropdownButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-list-stars" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5z"/><path d="M2.242 2.194a.27.27 0 0 1 .516 0l.162.53c.035.115.14.194.258.194h.551c.259 0 .37.333.164.493l-.468.363a.277.277 0 0 0-.094.3l.173.569c.078.256-.213.462-.423.3l-.417-.324a.267.267 0 0 0-.328 0l-.417.323c-.21.163-.5-.043-.423-.299l.173-.57a.277.277 0 0 0-.094-.299l-.468-.363c-.206-.16-.095-.493.164-.493h.55a.271.271 0 0 0 .259-.194l.162-.53zm0 4a.27.27 0 0 1 .516 0l.162.53c.035.115.14.194.258.194h.551c.259 0 .37.333.164.493l-.468.363a.277.277 0 0 0-.094.3l.173.569c.078.255-.213.462-.423.3l-.417-.324a.267.267 0 0 0-.328 0l-.417.323c-.21.163-.5-.043-.423-.299l.173-.57a.277.277 0 0 0-.094-.299l-.468-.363c-.206-.16-.095-.493.164-.493h.55a.271.271 0 0 0 .259-.194l.162-.53zm0 4a.27.27 0 0 1 .516 0l.162.53c.035.115.14.194.258.194h.551c.259 0 .37.333.164.493l-.468.363a.277.277 0 0 0-.094.3l.173.569c.078.255-.213.462-.423.3l-.417-.324a.267.267 0 0 0-.328 0l-.417.323c-.21.163-.5-.043-.423-.299l.173-.57a.277.277 0 0 0-.094-.299l-.468-.363c-.206-.16-.095-.493.164-.493h.55a.271.271 0 0 0 .259-.194l.162-.53z"/></svg>';
					dropdownButton.setAttribute("data-bs-toggle", "dropdown");
					
					if(drawJsonObjOnCanvas.tracks[j].behaviorlistautoclose != null && drawJsonObjOnCanvas.tracks[j].behaviorlistautoclose == false){
						dropdownButton.setAttribute("data-bs-auto-close", "false");
						dropdownButton.setAttribute("aria-expanded", "false");	
					}
					
					dropdownButton.setAttribute("style", "width:1.0rem;height:1.0rem;");
					dropdownButton.addEventListener("shown.bs.dropdown", showBevhaiorDropDownList);
					dropdownButton.addEventListener("hidden.bs.dropdown", hideBevhaiorDropDownList);
					dropdownButton.setAttribute("isListShown", false);
					var dropdownUl = document.createElement("ul");
					dropdownUl.setAttribute("class", "dropdown-menu bevhaiordropdown");
					dropdownUl.setAttribute("aria-labelledby", "behaviorbutton_track_"+drawJsonObjOnCanvas.tracks[j].track);
					for (i = 0; i < behaviordataList.length; i++) {
						if (behaviordataList[i] != null) {
							//console.log(behaviordataList[i].id +" "+behaviordataList[i].label);
							var liEle = document.createElement("li");
							var aEle = document.createElement("a");
							aEle.setAttribute("class", "dropdown-item bevhaiorbutton");
							aEle.setAttribute("href", "#");
							//aEle.addEventListener("click", clickBevhaiorDropDownButton(aEle, canvasElement));{name: userName, handleEvent: sayHello}
							aEle.addEventListener("click", {buttonObj: aEle, canvasObj: canvasElement, handleEvent: clickBevhaiorDropDownButton});
							aEle.setAttribute("behaviordata", behaviordataList[i].id);
							aEle.setAttribute("peerid", canvasElement.getAttribute("peerid"));
							aEle.setAttribute("pointid", "");//トラックごとの全体ビヘイビアなので視線エリア選択なし
							aEle.innerHTML = behaviordataList[i].label;
							liEle.appendChild(aEle);
							dropdownUl.appendChild(liEle);
						}
					}
					dropdownDiv.appendChild(dropdownButton);
					dropdownDiv.appendChild(dropdownUl);
					dropdownDiv.style.left = (textPosX)+"px";
					dropdownDiv.style.top = (textPosY)+"px";
					videoContainerElement.appendChild(dropdownDiv);
					console.log("add behavior track button on "+canvasElement.id);
				} else {
					//すでにある場合はなにもしない
				}				
			} else {
				
			}
			//end of drawJsonObjOnCanvas.points[j]
		}
	}

	if(!hasBehaviorButtons){
		//backgroundcanvas上の子ノード全部削除, Point事にあるなしを管理すべきだが面倒なので放置
		var videoContainerElement = canvasElement.parentNode;
		//要素削除は後ろから
		var currentbevhaiorbuttons = videoContainerElement.getElementsByClassName("dropdown");
		for(var i=currentbevhaiorbuttons.length-1; i>=0;i--){
			videoContainerElement.removeChild(currentbevhaiorbuttons[i]);
		}
		console.log("remove behavior buttons from "+canvasElement.id);
	}
	context.restore();
}

function clickBevhaiorDropDownButton(e){
	console.log(this.buttonObj.getAttribute("behaviordata"));
	//send command
	//selectBehavior(this.getAttribute("peerid"), this.getAttribute("behaviordata"));
	var myPeerID = document.getElementById("myuserid");
	var eventName = "selectbehaivorevent";		
	var sendText = "{\"peerid\": \""+myPeerID.value+"\", \""+eventName+"\": {\"remotepeerid\":\""+this.canvasObj.getAttribute('peerid')+"\", \"trackid\":"+this.canvasObj.getAttribute('trackid')+", \"pointid\":\""+this.buttonObj.getAttribute("pointid")+"\", \"behaviordata\":\""+this.buttonObj.getAttribute("behaviordata")+"\"}}";
	publishData(sendText);
	//selectBehavior(this.getAttribute("peerid"), this.getAttribute("behaviordata"));
}
function showBevhaiorDropDownList(){
	//console.log("shown "+this.id);
	this.setAttribute("isListShown", true);
}
function hideBevhaiorDropDownList(){
	//console.log("hidden "+this.id);
	this.setAttribute("isListShown", false);
}
//create a floating behavior list button, そんなにバリエーションだ好きはないので今は使わない
/*
//フローティングウィンドウで選択肢を出す場合
var behaviorCallButton = document.createElement("button");
behaviorCallButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-list-stars" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5z"/><path d="M2.242 2.194a.27.27 0 0 1 .516 0l.162.53c.035.115.14.194.258.194h.551c.259 0 .37.333.164.493l-.468.363a.277.277 0 0 0-.094.3l.173.569c.078.256-.213.462-.423.3l-.417-.324a.267.267 0 0 0-.328 0l-.417.323c-.21.163-.5-.043-.423-.299l.173-.57a.277.277 0 0 0-.094-.299l-.468-.363c-.206-.16-.095-.493.164-.493h.55a.271.271 0 0 0 .259-.194l.162-.53zm0 4a.27.27 0 0 1 .516 0l.162.53c.035.115.14.194.258.194h.551c.259 0 .37.333.164.493l-.468.363a.277.277 0 0 0-.094.3l.173.569c.078.255-.213.462-.423.3l-.417-.324a.267.267 0 0 0-.328 0l-.417.323c-.21.163-.5-.043-.423-.299l.173-.57a.277.277 0 0 0-.094-.299l-.468-.363c-.206-.16-.095-.493.164-.493h.55a.271.271 0 0 0 .259-.194l.162-.53zm0 4a.27.27 0 0 1 .516 0l.162.53c.035.115.14.194.258.194h.551c.259 0 .37.333.164.493l-.468.363a.277.277 0 0 0-.094.3l.173.569c.078.255-.213.462-.423.3l-.417-.324a.267.267 0 0 0-.328 0l-.417.323c-.21.163-.5-.043-.423-.299l.173-.57a.277.277 0 0 0-.094-.299l-.468-.363c-.206-.16-.095-.493.164-.493h.55a.271.271 0 0 0 .259-.194l.162-.53z"/></svg>';
behaviorCallButton.name = "behaviorbutton";
behaviorCallButton.setAttribute("class", "btn btn-default rounded-circle p-0 bevhaiorselectbutton");
behaviorCallButton.setAttribute("style", "width:1.5rem;height:1.5rem;");
behaviorCallButton.setAttribute("type", "button");
behaviorCallButton.setAttribute("id", "behaviorbutton_"+drawJsonObjOnCanvas.points[j].id);
behaviorCallButton.setAttribute("behaviordata", '[{"id":"hogehoge_id", "label":"hogehoge"},{"id":"foo_id", "label":"foo"},{"id":"baa_id", "label":"baa"}]');
var offsetRatio = 0.8;
textPosX = (drawJsonObjOnCanvas.points[j].xRatio - Math.cos(directionRad)*textPosOffsetX*offsetRatio)*canvasElement.width-labelWidthOffset/2;
textPosY = (drawJsonObjOnCanvas.points[j].yRatio - Math.sin(directionRad)*textPosOffsetY*offsetRatio)*canvasElement.height+labelHeightOffset/2;
behaviorCallButton.style.left = (textPosX)+"px";
behaviorCallButton.style.top = (textPosY)+"px";
behaviorCallButton.addEventListener("click", clickBevhaior);
videoContainerElement.appendChild(behaviorCallButton);
*/
function clickBevhaior(){
	console.log(this.id);
	//console.log(this.getAttribute("behaviordata"));
	var behaviordataList = JSON.parse(this.getAttribute("behaviordata"));
	/*
	for (i = 0; i < behaviordataList.length; i++) {
		if (behaviordataList[i] != null) {
			console.log(behaviordataList[i].id +" "+behaviordataList[i].label);
		}
	}
	*/
	loadBehaviorSelectData(behaviordataList, 100, 100);
}

//http://blog.chatlune.jp/2018/02/06/canvas-rounded-rectangle/#i-4
function drawsq(x,y,w,h,r,context, color) {
	context.beginPath();
	context.lineWidth = 1;
	context.strokeStyle = color;
	context.fillStyle = color;
	context.moveTo(x,y + r);  //←①
	context.arc(x+r,y+h-r,r,Math.PI,Math.PI*0.5,true);  //←②
	context.arc(x+w-r,y+h-r,r,Math.PI*0.5,0,1);  //←③
	context.arc(x+w-r,y+r,r,0,Math.PI*1.5,1);  //←④
	context.arc(x+r,y+r,r,Math.PI*1.5,Math.PI,1);  //←⑤
	context.closePath();  //←⑥
	context.stroke();  //←⑦
	context.fill();  //←⑧
}

//動画によってちょっとアスペクト比が違ったりする場合があるからcanvasのアスペクト比をあわせるけど使わなくて良さそう
//<video class="mainvideo" autoplay="1" muted controls id="sunnydrop-video" name="video" peerid="sunnydrop" onloadedmetadata="sourceLoaded(this)">
function sourceLoaded(videoElement){
	var peerid = videoElement.getAttribute("peerid")
	var trackid = videoElement.getAttribute("trackid");
	var ratio = videoElement.clientHeight/videoElement.clientWidth*100;
	//console.log(peerid + " paddingTop : "+ratio+"%, " +videoElement.clientWidth+"/"+videoElement.clientHeight);
	var canvasElement = document.getElementById(peerid+"_"+trackid+"_canvas");
	if(canvasElement != null){
		console.log(peerid + " before ratio : "+(canvasElement.offsetHeight/canvasElement.offsetWidth*100)+"%");
		//canvasElement.style.setProperty("padding-top", ratio+"%");
		//canvasElement.setAttribute("data-paddingTop", ratio+"%");
	}
	canvasElement = document.getElementById(peerid+"_"+trackid+"_bgcanvas");
	if(canvasElement != null){
		//canvasElement.style.setProperty("padding-top", ratio+"%");
		//canvasElement.setAttribute("data-paddingTop", ratio+"%");
	}
}


function showControlPane(){
	//showFlag = document.getElementById("debugcheckbox").checked;
	/*
	//slideToggleで表示中かどうかは自分で補完しないといかんかも
	var showFlag = true;
	if(showFlag){
		//document.getElementById("controlpane").style.display = "";
		$(".controlpane").slideToggle();
	} else {
		//document.getElementById("controlpane").style.display = "none"
		$(".controlpane").slideToggle();
	}
	*/
	//こちらはクラスを使ってるやつ全部
	//$(".controlpane").slideToggle();
	$("#controlpane").slideToggle();
}
