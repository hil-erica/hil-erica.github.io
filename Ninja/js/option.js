/*https://github.com/riversun/JSFrame.js*/
var optionFrame;
var isOptionShow = false;

function openOption(){
	if(optionFrame == null){
		//const appearance = jsFrame.createFrameAppearance();
		optionFrame = jsFrame.create({
			title: "Options",
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
			url: 'option.html',//iframe内に表示するURL
			urlLoaded: (_frame) => {
				console.log("loaded option.html");
				optionFrame.on('#controller', 'click', (_frame, evt) => {
					console.log("controller button click");
					openController();
				});
				optionFrame.on('#websocketbutton', 'click', (_frame, evt) => {
					console.log("socket connect button : "+optionFrame.$('#socket_url').value);
					websocketConnect(optionFrame.$('#socket_url').value);
				});
				optionFrame.on('#optionalcommandfile', 'change', (_frame, evt) => {
					console.log("optionalcommandfile loaded : ");
					optionalCommandLoad();
				});
				
				addGestureButtons();
			}
			
		});
		
		console.log("frame id:"+optionFrame.id);//windowManager_***
		optionFrame.show();
		isOptionShow = true;
		
		optionFrame.on('closeButton', 'click', (_frame, evt) => {
		});
		
		optionFrame.on('minimizeButton', 'click', (_frame, evt) => {
			console.log("click minimize");
			optionFrame.hide();
			isOptionShow = false;
		});		
		
	} else {
		if(isOptionShow){
			optionFrame.hide();
			isOptionShow = false;
		} else {
			optionFrame.show();
			isOptionShow = true;
		}
	}
}

function addGestureButtons(){
	/*g,b,r3種類64*64サイズ用意すること，以下に追加するだけでスクリプトの修正は不要
	<a href="#" name="gesture" gesture="nodding" id="nodding">
		<img src="pics/gestures/nodding-g.gif"name="gesture" alt="nodding">
	</a>
	<a href="#" name="gesture" gesture="greeting" id="greeting">
		<img src="pics/gestures/greeting-g.gif"name="gesture" alt="greeting">
	</a>
	*/
	var gestureLink, gestureButton, gestureImg;
	var gestures = ["nodding", "greeting"];
	for(var i = 0; i<gestures.length; i++){
		gestureLink = document.createElement("a");
		gestureLink.setAttribute("href", "#");
		gestureLink.setAttribute("id", gestures[i]+"_a");
		gestureLink.setAttribute("name", "gesture");
		gestureLink.setAttribute("gesture", gestures[i]);
		gestureLink.addEventListener( "click", gestureSelected);
		
		gestureImg = document.createElement("img");
		gestureImg.setAttribute("src", "pics/gestures/"+gestures[i]+"-g.gif");
		gestureImg.setAttribute("id", gestures[i]+"_img");
		gestureImg.setAttribute("alt", gestures[i]);
		gestureLink.appendChild(gestureImg);
		optionFrame.$('#gesture').appendChild(gestureLink);
	}
}


var gestureResetTimer = null;
var selectedGestureButton = null;
function setGestureIconOnRunning(gestureid){
	/*
	if(gestureResetTimer != null){
		clearTimeout(gestureResetTimer);
		gestureResetTimer = null;
	}
	*/
	optionFrame.$('#'+gestureid+'_img').setAttribute("src", "pics/gestures/"+gestureid+"-r.gif");
	gestureResetTimer = setTimeout(function () {
		optionFrame.$('#'+gestureid+'_img').setAttribute("src", "pics/gestures/"+gestureid+"-g.gif");
	}, 1000);
}

function setWebsocketButton(onoff){
	if(onoff){
		optionFrame.$('#websocketbutton').innerHTML = "Connect";
		optionFrame.$('#socket_url').readOnly = false;
	} else {
		optionFrame.$('#websocketbutton').innerHTML = "Disconnect";
		optionFrame.$('#socket_url').readOnly = true;
	}
}

function optionalCommandLoad(){
	var fileChooser =  optionFrame.$('#optionalcommandfile');
	var files = fileChooser.files; // FileList object
	var buttonsDiv = optionFrame.$('#optionalbuttons');
	
	while (buttonsDiv.lastChild) {
		buttonsDiv.removeChild(buttonsDiv.lastChild);
	}
	
	for (var i = 0, f; f = files[i]; i++) {
		//console.log(f);
		var reader = new FileReader();
		reader.readAsText( f );
		reader.addEventListener( 'load', function() {
			var jsonObj = JSON.parse(reader.result);
			//console.log(jsonObj);
			//console.log(JSON.stringify(jsonObj));
			if('buttons' in jsonObj){
				for(var j = 0; j < jsonObj.buttons.length; j++){
					var optionalBtnJson = jsonObj.buttons[j];
					var cmdBtn = document.createElement('button');
					cmdBtn.setAttribute('id', 'optionalbutton_'+optionalBtnJson.id);
					cmdBtn.setAttribute('name', 'optionalbutton');
					cmdBtn.setAttribute('jsondata', JSON.stringify(optionalBtnJson));
					cmdBtn.addEventListener("click", optionalButtonClicked);
					cmdBtn.innerHTML = optionalBtnJson.label;
					cmdBtn.setAttribute('class', 'btn btn-outline-primary');
					cmdBtn.setAttribute('style', 'margin:2px;');
					cmdBtn.setAttribute('type', 'button');
					var txt = document.createTextNode("\u00a0");
					//buttonsDiv.appendChild(txt);
					buttonsDiv.appendChild(cmdBtn);
				}
			}
		});
	}
}

function optionalButtonClicked(){
	var buttonObjId = this;
	//console.log(buttonObjId);
	console.log("optionalcommand="+buttonObjId.getAttribute('jsondata'));
	//command
	var sendText = "optionalcommand="+buttonObjId.getAttribute('jsondata');
	publishData(sendText);
}