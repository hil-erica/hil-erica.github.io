/*https://github.com/riversun/JSFrame.js*/
var behaviorFrame;
var isBehaviorShow = false;

function initializeSelectBehavior() {
	//for floating
	openSelectBehavior();
	behaviorFrame.hide();
	isBehaviorShow = false;
}

function openSelectBehavior(){
	if(behaviorFrame == null){
		//const appearance = jsFrame.createFrameAppearance();
		behaviorFrame = jsFrame.create({
			title: "Select Behavior",
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
			url: 'selectbehavior.html',//iframe内に表示するURL
			urlLoaded: (_frame) => {
				console.log("loaded selectbehavior.html");
			}
		});
		
		console.log("frame id:"+behaviorFrame.id);//windowManager_***
		behaviorFrame.show();
		isBehaviorShow = true;
		
		behaviorFrame.on('closeButton', 'click', (_frame, evt) => {
		});
		
		behaviorFrame.on('minimizeButton', 'click', (_frame, evt) => {
			console.log("click minimize");
			behaviorFrame.hide();
			isBehaviorShow = false;
		});		
		
	} else {
		if(isBehaviorShow){
			behaviorFrame.hide();
			isBehaviorShow = false;
		} else {
			behaviorFrame.show();
			isBehaviorShow = true;
		}
	}
}

function loadBehaviorSelectData(behaviordataList, top, left){
	var buttonsDiv = behaviorFrame.$('#behaviorbuttons');
	while (buttonsDiv.lastChild) {
		buttonsDiv.removeChild(buttonsDiv.lastChild);
	}
	
	//open and move
	if(!isBehaviorShow){
		behaviorFrame.show();
		isBehaviorShow = true;
	}
	var margin = 20;
	var width = 0;
	var height = 0;
	for (i = 0; i < behaviordataList.length; i++) {
		if (behaviordataList[i] != null) {
			console.log(behaviordataList[i].id +" "+behaviordataList[i].label);
			var cmdBtn = document.createElement('button');
			cmdBtn.setAttribute('id', 'behaviorbutton_'+behaviordataList[i].id);
			cmdBtn.setAttribute('name', 'optionalbutton');
			cmdBtn.setAttribute('behaviorid', behaviordataList[i].id);
			cmdBtn.setAttribute('behaviorlabel', behaviordataList[i].label);
			cmdBtn.addEventListener("click", behaivorButtonClicked);
			cmdBtn.innerHTML = behaviordataList[i].label;
			cmdBtn.setAttribute('class', 'btn btn-outline-primary btn-sm behaviorbutton');
			cmdBtn.setAttribute('style', 'margin:2px;');
			cmdBtn.setAttribute('type', 'button');
			var txt = document.createTextNode("\u00a0");
			//buttonsDiv.appendChild(txt);
			buttonsDiv.appendChild(cmdBtn);
			//var buttonHeight = parseInt(window.getComputedStyle(cmdBtn).height);
			//cmdBtn.clientWidtharseInt(window.getComputedStyle(cmdBtn).width);
			//console.log(behaviordataList[i].label+", "+buttonWidth+", "+buttonHeight+","+cmdBtn.clientWidth);
			console.log(behaviordataList[i].label+", "+cmdBtn.clientWidth+", "+cmdBtn.clientHeight);
			var buttonHeight = cmdBtn.clientHeight;
			var buttonWidth = cmdBtn.clientWidth
			if(width < buttonWidth){
				width = buttonWidth;
			}
			height += buttonHeight;
		}
	}

	const align = 'LEFT_TOP';//アンカー, 'CENTER_TOP''RIGHT_TOP''LEFT_CENTER''CENTER_CENTER''RIGHT_CENTER''LEFT_BOTTOM''CENTER_BOTTOM''RIGHT_BOTTOM'
	behaviorFrame.setSize(width+margin,height+margin, true);
	behaviorFrame.setPosition(top, left, align);
}

function behaivorButtonClicked(){
	var buttonObjId = this;
	//console.log(buttonObjId);
	console.log("behaivor="+buttonObjId.getAttribute('behaviorid'));
	//command
	var sendText = "optionalcommand="+buttonObjId.getAttribute('jsondata');
	//publishData(sendText);
}
