//not using

function initializeOption() {
	$("#optionapp").hide();
	$('#controller').click(function() {
		//console.log("controller button click");
		openController();
	});
	
	$('#optionalcommandfile').change(function(){
		//console.log("optionalcommandfile loaded : ");
		optionalCommandLoad();
	});

	$('#optionalcommandfile').click(function() {
		//console.log("clicked");
		//リセットすることで同じファイルを再度選択してもChangeリスナーが発火する
		var fileChooser =  $('#optionalcommandfile');
		fileChooser.value = "";
	});
	addGestureButtonsOnPage();
}

function addGestureButtonsOnPage(){
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
		document.getElementById("gesture").appendChild(gestureLink);
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
	document.getElementById(gestureid+'_img').setAttribute("src", "pics/gestures/"+gestureid+"-r.gif");
	gestureResetTimer = setTimeout(function () {
		document.getElementById(gestureid+'_img').setAttribute("src", "pics/gestures/"+gestureid+"-g.gif");
	}, 1000);
}

function optionalCommandLoad(){
	var fileChooser =  document.getElementById("optionalcommandfile");
	var files = fileChooser.files; // FileList object
	console.log(fileChooser+" "+files + " "+fileChooser.value);
	var buttonsDiv = document.getElementById("optionalbuttons");
	while (buttonsDiv.lastChild) {
		buttonsDiv.removeChild(buttonsDiv.lastChild);
	}
	
	for (var i = 0, f; f = files[i]; i++) {
		var f = files[i];
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
					cmdBtn.setAttribute('class', 'btn btn-outline-primary btn-sm optionalcommandbutton');
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


function showOptionAppPane(){
	$("#optionapp").slideToggle();
}

