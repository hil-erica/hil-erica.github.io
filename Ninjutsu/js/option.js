/*https://github.com/riversun/JSFrame.js*/
var optionFrame;
var isOptionShow = false;

function initializeOption() {
	//for floating
	openOption();
	optionFrame.hide();
	isOptionShow = false;

	//for top layout
	$("#optionapp").hide();
	$('#controller').click(function() {
		//console.log("controller button click");
		openController();
	});
	
	$('#optionalcommandfile').change(function(){
		//console.log("optionalcommandfile loaded : ");
		optionalCommandLoadOnTop();
	});

	$('#optionalcommandfile').click(function() {
		//console.log("clicked");
		//リセットすることで同じファイルを再度選択してもChangeリスナーが発火する
		var fileChooser =  $('#optionalcommandfile');
		fileChooser.value = "";
	});

}
function openOption(){
	if(optionFrame == null){
		//const appearance = jsFrame.createFrameAppearance();
		optionFrame = jsFrame.create({
			title: "Options",
			left: 120,
			top: 120,
			//width: window.innerWidth*0.5,
			//height: window.innerHeight*0.4,
			width: 470,
			height: 520,
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
					//console.log("controller button click");
					openController();
				});
				
				//optionFrame.on('#optionalcommandfile', 'change', (_frame, evt) => {
				optionFrame.on('#optionalcommandfile', 'change', (_frame, evt) => {
					//console.log("optionalcommandfile loaded : ");
					optionalCommandLoadOnFloating();
				});
				optionFrame.on('#attractiveness-input', 'click', (_frame, evt) => {
					clickAttractiveness(evt);
				});
				optionFrame.on('#emotioncanvas', 'click', (_frame, evt) => {
					clickEmotionSpace(evt);
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
		//for floating
		optionFrame.$('#gesture').appendChild(gestureLink);
		
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
		//for top
		document.getElementById("gesture").appendChild(gestureLink);
	}
}


var gestureResetTimer = null;
var selectedGestureButton = null;
//1つのElementを2箇所に表示できないので複製せにゃならん
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

	document.getElementById(gestureid+'_img').setAttribute("src", "pics/gestures/"+gestureid+"-r.gif");
	gestureResetTimer = setTimeout(function () {
		document.getElementById(gestureid+'_img').setAttribute("src", "pics/gestures/"+gestureid+"-g.gif");
	}, 1000);
}

function optionalCommandLoadOnFloating(){
	optionalCommandLoad(optionFrame.$('#optionalcommandfile'));
}

function optionalCommandLoadOnTop(){
	optionalCommandLoad(document.getElementById("optionalcommandfile"));
}

function optionalCommandLoad(fileChooser){
	//var fileChooser =  optionFrame.$('#optionalcommandfile');
	var files = fileChooser.files; // FileList object
	var buttonsDiv = optionFrame.$('#optionalbuttons');
	while (buttonsDiv.lastChild) {
		buttonsDiv.removeChild(buttonsDiv.lastChild);
	}
	var buttonsOnTopDiv = document.getElementById("optionalbuttons");
	while (buttonsOnTopDiv.lastChild) {
		buttonsOnTopDiv.removeChild(buttonsOnTopDiv.lastChild);
	}
	
	for (var i = 0, f; f = files[i]; i++) {
		console.log(f);
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
					
					cmdBtn = document.createElement('button');
					cmdBtn.setAttribute('id', 'optionalbutton_'+optionalBtnJson.id);
					cmdBtn.setAttribute('name', 'optionalbutton');
					cmdBtn.setAttribute('jsondata', JSON.stringify(optionalBtnJson));
					cmdBtn.addEventListener("click", optionalButtonClicked);
					cmdBtn.innerHTML = optionalBtnJson.label;
					cmdBtn.setAttribute('class', 'btn btn-outline-primary btn-sm');
					cmdBtn.setAttribute('style', 'margin:2px;');
					cmdBtn.setAttribute('type', 'button');
					var txt = document.createTextNode("\u00a0");
					buttonsOnTopDiv.appendChild(cmdBtn);
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

function showOptionAppPane(){
	$("#optionapp").slideToggle();
}

function clickEmotionSpace(event){
	var canvasElement = event.target;
	var points = getMousePointOnCanvas(canvasElement, event); 
	var x = points[0];
	var y = points[1];
	var xRatio = points[2];
	var yRatio = points[3];
	var directionRad = points[4];
	var arousal = (0.5-yRatio)*2;
	var valence = (-0.5+xRatio)*2;

	canvasElement.width =canvasElement.offsetWidth;
	canvasElement.height =canvasElement.offsetHeight;
	
	var context = canvasElement.getContext( "2d" ) ;
	context.save();
	context.clearRect(0, 0, canvasElement.width, canvasElement.height);

	context.fillStyle = "rgba(255,255,255,0.5)";
	context.beginPath () ;
	context.lineWidth = 2.0 ;
	context.arc(xRatio*canvasElement.width, yRatio*canvasElement.height, canvasElement.width/10, 0 * Math.PI / 180, 360 * Math.PI / 180, false ) ;
	context.stroke() ;
	
	console.log("set emotional state arousal = "+arousal+", valence = "+valence);
	sendEmotion(arousal, valence);
}

function emotionChanged(arousal, valence){
	var xRatio = valence/2.0+0.5;
	var yRatio = -arousal/2.0+0.5;
	var canvasElement = document.getElementById("emotioncanvas");
	var context = canvasElement.getContext( "2d" ) ;
	context.save();
	context.clearRect(0, 0, canvasElement.width, canvasElement.height);

	context.fillStyle = "rgba(255,255,255,0.5)";
	context.beginPath () ;
	context.lineWidth = 2.0 ;
	context.arc(xRatio*canvasElement.width, yRatio*canvasElement.height, canvasElement.width/10, 0 * Math.PI / 180, 360 * Math.PI / 180, false ) ;
	context.stroke() ;
}

function clickAttractiveness(event){
	var inputBar = event.target;
	var attractiveness = inputBar.value*0.1;
	//console.log("set attractiveness = "+attractiveness);
	sendAttractiveness(attractiveness);
}

function attractivenessChanged(attractiveness){
	var value = attractiveness*10;
	var inputBar = document.getElementById("attractiveness-input");
	inputBar.value = value;
	
}