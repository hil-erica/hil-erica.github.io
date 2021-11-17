/*https://github.com/riversun/JSFrame.js*/
var externalWebSiteFrame;
var isExternalWebSiteShow = false;

function initializeExternalWebSite() {
	openExternalWebSite();
	externalWebSite.hide();
	isExternalWebSiteShow = false;
}
function openExternalWebSite(externalWebSiteURL){
	if(externalWebSiteFrame == null){
		//const appearance = jsFrame.createFrameAppearance();
		externalWebSiteFrame = jsFrame.create({
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
			url: externalWebSiteURL,
			urlLoaded: (_frame) => {
				console.log("loaded "+externalWebSiteURL);
			}
			
		});
		
		console.log("frame id:"+externalWebSiteFrame.id);//windowManager_***
		externalWebSiteFrame.show();
		isExternalWebSiteShow = true;
		
		externalWebSiteFrame.on('closeButton', 'click', (_frame, evt) => {
		});
		
		externalWebSiteFrame.on('minimizeButton', 'click', (_frame, evt) => {
			console.log("click minimize");
			externalWebSiteFrame.closeFrame();
			externalWebSiteFrame = null;
			isExternalWebSiteShow = false;
		});		
		
	} else {
		if(isExternalWebSiteShow){
			externalWebSiteFrame.requestFocus();
			//externalWebSiteFrame.closeFrame();
			//isExternalWebSiteShow = false;
			//externalWebSiteFrame = null;
		} else {
			externalWebSiteFrame.show();
			isexternalWebSiteHistoryShow = true;
		}
	}
}