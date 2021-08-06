/*https://github.com/riversun/JSFrame.js*/
var speechHistoryFrame;
var isSpeechHistoryShow = false;

function initializeSpeechHistory() {
	openSpeechHistory();
	speechHistory.hide();
	isSpeechHistoryShow = false;
}
function openSpeechHistory(speechHistoryURL){
	if(speechHistoryFrame == null){
		//const appearance = jsFrame.createFrameAppearance();
		speechHistoryFrame = jsFrame.create({
			title: "Options",
			left: 120,
			top: 120,
			width: window.innerWidth*0.8,
			height: window.innerHeight*0.4,
			//width: 470,
			//height: 520,
			style: {
				backgroundColor: 'rgba(180,180,180,0.5)',
				overflow: 'hidden'
			},
			appearance: populateOriginalStyle(appearance),
			//html: userElement.innerHTML
			//html: '<div style="padding:10px;height:100%">Createa appearance object from scratch</div>'
			//url: 'https://hil-nuc-03w.irc.atr.jp/erica_database/console/realtime/display_realtime_dialog.php',//iframe内に表示するURL
			url: speechHistoryURL,
			urlLoaded: (_frame) => {
				console.log("loaded "+speechHistoryURL);
			}
			
		});
		
		console.log("frame id:"+speechHistoryFrame.id);//windowManager_***
		speechHistoryFrame.show();
		isSpeechHistoryShow = true;
		
		speechHistoryFrame.on('closeButton', 'click', (_frame, evt) => {
		});
		
		speechHistoryFrame.on('minimizeButton', 'click', (_frame, evt) => {
			console.log("click minimize");
			speechHistoryFrame.closeFrame();
			speechHistoryFrame = null;
			isSpeechHistoryShow = false;
		});		
		
	} else {
		if(isSpeechHistoryShow){
			speechHistoryFrame.requestFocus();
			//speechHistoryFrame.closeFrame();
			//isSpeechHistoryShow = false;
			//speechHistoryFrame = null;
		} else {
			speechHistoryFrame.show();
			isSpeechHistoryShow = true;
		}
	}
}