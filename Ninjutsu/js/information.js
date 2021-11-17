/*https://github.com/riversun/JSFrame.js*/
var infoFrame;
var isInfoShow = false;
var logText = "";

function initializeInformation() {
	openInformation();
	infoFrame.hide();
	isInfoShow = false;
}
function openInformation(){
	if(infoFrame == null){
		//const appearance = jsFrame.createFrameAppearance();
		infoFrame = jsFrame.create({
			title: "Information",
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
			url: 'information.html',//iframe内に表示するURL
			urlLoaded: (_frame) => {
				console.log("loaded information.html");
				infoFrame.$('#information-console').value = logText;
			}
		});
		
		console.log("frame id:"+infoFrame.id);//windowManager_***
		infoFrame.show();
		isInfoShow = true;
		
		infoFrame.on('closeButton', 'click', (_frame, evt) => {
		});
		
		infoFrame.on('minimizeButton', 'click', (_frame, evt) => {
			console.log("click minimize");
			infoFrame.hide();
			isInfoShow = false;
		});		
		
	} else {
		if(isInfoShow){
			infoFrame.hide();
			isInfoShow = false;
		} else {
			infoFrame.show();
			isInfoShow = true;
		}
	}
	var infoiconElement = document.getElementById("infoicon");
	infoiconElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M8.93 6.588l-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg>';
}

function addInformation(message){
	let nowTime = new Date(); //  現在日時を得る
	let nowHour = ( '00' + nowTime.getHours() ).slice( -2); // 時間を抜き出す
	let nowMin  = ( '00' + nowTime.getMinutes() ).slice( -2); // 分数を抜き出す
	let nowSec  = ( '00' + nowTime.getSeconds() ).slice( -2); // 秒数を抜き出す
	//logText = nowHour + ":" + nowMin+":"+nowSec+" "+message+"\n"+logText;
	logText += nowHour + ":" + nowMin+":"+nowSec+" "+message+"\n";
	
	if(infoFrame != null && infoFrame.$('#information-console') != null){
		infoFrame.$('#information-console').value = logText;
	}
	if(isInfoShow){
		//var infoiconElement = document.getElementById("infoicon");
		//infoiconElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M8.93 6.588l-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg>';
	} else {
		var infoiconElement = document.getElementById("infoicon");
		infoiconElement.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-info-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M8.93 6.588l-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/></svg>';
	}
}