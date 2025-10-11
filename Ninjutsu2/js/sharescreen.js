/*https://github.com/riversun/JSFrame.js*/

var blankVideo  ="./videos/teleoperation.mp4";
var shareScreenFrame;
var sharingScreenBgCanvasObj;
var sharingScreenCanvasObj;
var sharedWindow;
var sharedVideo;


var remotePeerIDSharingScreenMediaStreamMap = new Map();//peerid, MediaStream

var isShareScreenShow = false;

//'use strict';
var errorElement;
var sharingScreenVideo;
var sharingScreenStream;

function initializeShareScreen() {
	openShareScreen();
	shareScreenFrame.hide();
	isShareScreenShow = false;
}
function openShareScreen(){
	if(shareScreenFrame == null){
		//const appearance = jsFrame.createFrameAppearance();
		shareScreenFrame = jsFrame.create({
			title: "Share Screen",
			left: 120,
			top: 120,
			//width: window.innerWidth*0.5,
			//height: window.innerHeight*0.4,
			width: 500,
			height: 350,
			appearance: populateOriginalStyle(appearance),
			style: {
				backgroundColor: 'rgba(180,180,180,0.1)',
				overflow: 'hidden'
			},
			//html: userElement.innerHTML
			//html: '<div style="padding:10px;height:100%">Createa appearance object from scratch</div>'
			url: 'sharingscreen.html',//iframe内に表示するURL
			urlLoaded: (_frame) => {
				console.log("loaded sharescreen.html");
				shareScreenFrame.$("body").style.background = 'rgba(180,180,180,0.1)';
				var myPeerID = document.getElementById("myuserid");
				
				errorElement = shareScreenFrame.$('#errorMsg');
				var main = shareScreenFrame.$('#main');
				
				var contentID = "local_sharingscreen_container";
				var container = document.createElement("div");
				container.setAttribute("id", "local_sharingscreen_container");
				container.setAttribute("class", "maincontainer");
								
				//紫水晶むらさきすいしょう #e7e7eb R:231 G:231 B:235
				var svgFillColor = "rgba(231,231,235,1)";
				
				var videocontainer = document.createElement("div");
				videocontainer.setAttribute("class", "videocontainer");
				
				var videoObj;
				videoObj = document.createElement("video");
				videoObj.setAttribute("class", "video");
				videoObj.setAttribute("name", "sharingscreen_video");
				videoObj.setAttribute("id", "local_sharingscreen_video");
				videoObj.setAttribute("controls", "1");
				videoObj.style.opacity = 0.8;//動画の背景透かし
				
				videoObj.muted = true;
				//今はテストautoplayのためにmute
				//videoObj.muted = true;
				videoObj.setAttribute("autoplay", "1");
				videoObj.playsInline = true;
				videocontainer.appendChild(videoObj);
				sharingScreenVideo = videoObj;
								
				var videoLabel = document.createElement("label");
				videoLabel.innerHTML = "sharing screen";
				videoLabel.setAttribute("class", "videolabel");
				//videocontainer.appendChild(videoLabel);
				
				sharingScreenBgCanvasObj = document.createElement("canvas");
				sharingScreenBgCanvasObj.setAttribute("class", "videocanvas");
				sharingScreenBgCanvasObj.setAttribute("name", "backgroundcanvas");
				sharingScreenBgCanvasObj.setAttribute("id", "local_sharingscreen_bgcanvas");
				sharingScreenBgCanvasObj.setAttribute("peerid", myPeerID.value);
				sharingScreenBgCanvasObj.setAttribute("trackid", -1);
				videocontainer.appendChild(sharingScreenBgCanvasObj);
				
				sharingScreenCanvasObj = document.createElement("canvas");
				sharingScreenCanvasObj.setAttribute("class", "videocanvas");
				//sharingScreenCanvasObj.setAttribute("name", "clickcanvas");
				sharingScreenCanvasObj.setAttribute("id", "local_sharingscreen_canvas");
				sharingScreenCanvasObj.setAttribute("peerid", myPeerID.value);
				sharingScreenCanvasObj.setAttribute("trackid", -1);
				videocontainer.appendChild(sharingScreenCanvasObj);
				
				//https://qiita.com/sashim1343/items/e3728bea913cadab677d
				console.log("teleOpeMode:"+teleOpeMode);
				if(teleOpeMode){
					sharingScreenCanvasObj.addEventListener( "mousedown", canvasMouseDown);
					sharingScreenCanvasObj.addEventListener( "mouseup", canvasMouseUp);
					sharingScreenCanvasObj.addEventListener( "mousemove", canvasMouseMove);
					sharingScreenCanvasObj.addEventListener( "mouseout", canvasMouseOut);
					//sharingScreenCanvasObj.addEventListener("click", canvasClicked);
					//sharingScreenCanvasObj.addEventListener( "dblclick", canvasDblClicked);
				} else {
					console.log("canvas off");
					sharingScreenCanvasObj.style.display ="none";
					sharingScreenBgCanvasObj.style.display ="none";
				}
				
				//スピーカー初期化
				var controller = document.createElement("div");
				controller.setAttribute("class", "controller");
				//controller.setAttribute("class", "row controller");
				var speakerDiv = document.createElement("div");
				speakerDiv.setAttribute("class", "form-control");
				var speakerSelector = document.createElement("select");
				//speakerSelector.setAttribute("class", "form-select form-select-sm");
				speakerSelector.setAttribute("size", "1");
				speakerSelector.setAttribute("style", "width:75pt;");
				speakerSelector.setAttribute('speakerid', videoObj.id);
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
				
				var speakerId = speakerSelector.options[speakerList.selectedIndex].value;
				if(videoObj.srcObject != null && videoObj.srcObject.getAudioTracks().length > 0){
					videoObj.setSinkId(speakerId)
						.then(function() {
						console.log("setSinkID Success, audio is being played on "+speakerId +" at "+videoObj.id);
					})
					.catch(function(err) {
						console.error("setSinkId Err:", err);
					});
					//speakerSelector.addEventListener("change", speakerSelectEvent);
				} else if(videoObj.src != null){
					videoObj.setSinkId(speakerId)
						.then(function() {
						console.log("setSinkID Success, audio is being played on "+speakerId +" at "+videoObj.id);
					})
					.catch(function(err) {
						console.error("setSinkId Err:", err);
					});
					//speakerSelector.addEventListener("change", speakerSelectEvent);	
				}
				//sharingの方はきかなくてOK 
				//container.appendChild(controller);
				container.appendChild(videocontainer);
				main.appendChild(container);
				
				
				//sharingScreenVideo = shareScreenFrame.$('#gum-local');
				shareScreenFrame.on('#getDisplayMediaBotton', 'click', (_frame, evt) => {
					gdm();
				});
				
				shareScreenFrame.on('#openScreenBotton', 'click', (_frame, evt) => {
					if(remotePeerIDSharingScreenMediaStreamMap.size > 0){
						//動画を別のに切り替える
						for(var[key, value] of remotePeerIDSharingScreenMediaStreamMap){
							addSharedScreen(key, value);
							break;
						}
					} else {
						addSharedScreen("", null);
					}
				});
			}
			
		});
		
		console.log("frame id:"+shareScreenFrame.id);//windowManager_***
		shareScreenFrame.show();
		isShareScreenShow = true;
		shareScreenFrame.on('closeButton', 'click', (_frame, evt) => {
		});
		
		shareScreenFrame.on('minimizeButton', 'click', (_frame, evt) => {
			console.log("click minimize");
			shareScreenFrame.hide();
			isShareScreenShow = false;
		});
		
		const eventListener = (data) => {
			const box = document.querySelector('#message');
			const frame = data.target;
			const eventType = data.eventType;
			const size = data.size;
			const position = data.pos;
			const windowName = frame.getName();
			//console.log("windowName:"+windowName+", eventType"+eventType+", "+position.anchor+", position:("+position.x+","+position.y+")size=("+size.width+"x"+size.height+")");
			var main = shareScreenFrame.$('#main');
			canvasSizeChanged(sharingScreenBgCanvasObj);
			canvasSizeChanged(sharingScreenCanvasObj);
		};

		// register resize event
		shareScreenFrame.on('frame', 'resize', eventListener);

		// register move event
		shareScreenFrame.on('frame', 'move', eventListener);

		// Multiple listeners can be registered for a single eventType
		shareScreenFrame.on('frame', 'move', (data) => {
			//console.log(`pos=${JSON.stringify(data.pos)} size=${JSON.stringify(data.size)}`)
		});
		
	} else {
		if(isShareScreenShow){
			shareScreenFrame.hide();
			isShareScreenShow = false;
		} else {
			shareScreenFrame.show();
			isShareScreenShow = true;
		}
	}
}

var sharingScreenMap = new Map();
function handleSuccess(stream) {
	var videoTracks = stream.getVideoTracks();
	//console.log('Got stream with constraints:', constraints);
	console.log('Using video device: ' + videoTracks[0].label);
	sharingScreenMap.set(videoTracks[0].label, stream);
	if(sharingScreenStream != null){
		//media stream closeして一旦接続を切るべし
		for(var i=0;i<sharingScreenStream.getTracks().length; i++){
			sharingScreenStream.getTracks()[i].stop();
		}
	}
	
	sharingScreenStream = null;
	sharingScreenStream = stream;
	sharingScreenVideo.srcObject = stream;
	sharingScreenSelectEvent(true);//device.js
	
	stream.oninactive = function() {
		sharingScreenMap.delete(stream.getVideoTracks()[0].label, stream);
		if(sharingScreenMap.size == 0){
			sharingScreenStream = null;
			sharingScreenSelectEvent(false);//device.js
		}
		console.log('screen  stream inactive '+stream.getVideoTracks()[0].label);
	};
	//send start of sharing screen
}

// Put variables in global scope to make them available to the browser console.
var constraints = window.constraints = {
  audio: true,
  video: true
};
function handleError(error) {
	if (error.name === 'ConstraintNotSatisfiedError') {
		errorMsg('The resolution ' + constraints.video.width.exact + 'x' +
		constraints.video.width.exact + ' px is not supported by your device.');
	} else if (error.name === 'PermissionDeniedError') {
		errorMsg('Permissions have not been granted to use your camera and ' +
		'microphone, you need to allow the page access to your devices in ' +
		'order for the demo to work.');
	}
	errorMsg('getDisplayMedia error: ' + error.name, error);
}

function errorMsg(msg, error) {
	errorElement.innerHTML += '<p>' + msg + '</p>';
	if (typeof error !== 'undefined') {
		console.error(error);
	}
}

async function gdm() {
	//console.log(shareScreenFrame);
	//navigator.mediaDevices.getDisplayMedia(constraints).then(handleSuccess).catch(handleError);
	await getShareDisplay();
	
	var videoTrack = gShareVideoStream.track;
	//console.log('Got stream with constraints:', constraints);
	console.log('Using video device: ' + videoTrack.label);
	sharingScreenMap.set(videoTrack.label, gShareVideoStream);
	const ms = new MediaStream();
	sharingScreenVideo.srcObject = ms;
	ms.addTrack(videoTrack);
	sharingScreenSelectEvent(true);//device.js start
	
	gShareVideoStream.oninactive = function() {
		sharingScreenMap.delete(videoTrack.label, gShareVideoStream);
		if(sharingScreenMap.size == 0){
			sharingScreenSelectEvent(false);//device.js end
		}
		console.log('screen  stream inactive '+videoTrack.label);
	};
}


 /* exported trace */

// Logging utility function.
function trace(arg) {
	var now = (window.performance.now() / 1000).toFixed(3);
	console.log(now + ': ', arg);
}

//リモートから共有された映像表示
// ====== 共有ウィンドウ関連のグローバル（未定義なら用意） ======
window.remotePeerIDSharingScreenMediaStreamMap ||= new Map();
window.sharedWindow ||= null;
window.sharedVideo  ||= null;
window.blankVideo   ||= "";

// ====== sinkId 変更（共有ウィンドウ内の <select> 用） ======
function sharedSpeakerSelectEvent() {
  if (!sharedWindow || sharedWindow.closed || !sharedVideo) return;
  const sel = sharedWindow.document.getElementById("sharedscreen_speaker_selector");
  if (!sel) return;
  const sinkId = sel.options[sel.selectedIndex]?.value ?? "";
  if (!("setSinkId" in HTMLMediaElement.prototype)) {
    console.warn("setSinkId is not supported on this browser.");
    return;
  }
  if (!sharedVideo.srcObject || sharedVideo.srcObject.getAudioTracks().length === 0) {
    console.log("no audio tracks on shared video");
    return;
  }
  (async () => {
    try {
      // 一度 default にしてから目的のデバイスへ（安定化）
      const defId = sel.options[0]?.value ?? "";
      await sharedVideo.setSinkId(defId);
      await sharedVideo.setSinkId(sinkId);
      console.log(`setSinkID Success -> ${sinkId} at ${sharedVideo.id}`);
    } catch (err) {
      console.error("setSinkId Err:", err);
    }
  })();
}

// ====== ユーティリティ：videostream から映像トラックを取り出す ======
function pickVideoTrack(v) {
  try {
    if (!v) return null;
    if ("track" in v && v.track && v.track.kind === "video") return v.track; // SkyWay RemoteVideoStream など
    if (v instanceof MediaStream) return v.getVideoTracks?.()[0] || null;
    if (v instanceof MediaStreamTrack && v.kind === "video") return v;
  } catch {}
  return null;
}

// ====== メインの #speaker_list を共有ウィンドウへコピー ======
function populateSpeakerSelectorAndBind(win) {
  const speakerSelector = win.document.getElementById("sharedscreen_speaker_selector");
  const speakerList = document.getElementById("speaker_list");
  if (!speakerSelector || !speakerList) return;

  while (speakerSelector.firstChild) speakerSelector.removeChild(speakerSelector.firstChild);

  for (let i = 0; i < speakerList.length; i++) {
    const opt = document.createElement("option");
    opt.value = speakerList[i].value;
    opt.textContent = speakerList[i].textContent;
    speakerSelector.appendChild(opt);
  }
  speakerSelector.selectedIndex = speakerList.selectedIndex;

  speakerSelector.removeEventListener("change", sharedSpeakerSelectEvent);
  speakerSelector.addEventListener("change", sharedSpeakerSelectEvent);
}

// ====== 共有ウィンドウの <video> にトラックを貼る ======
async function attachTrackToSharedVideo({ win, videoTrack, remoteID, videostream }) {
  sharedVideo = win.document.getElementById("sharedscreen_video");
  if (!sharedVideo) {
    console.warn("sharedscreen_video element not found");
    return;
  }
  win.document.title = (videoTrack || videostream) ? `影分身 共有画面 : ${remoteID}` : "影分身 共有画面";

  try { sharedVideo.pause(); } catch {}
  try { sharedVideo.srcObject = null; sharedVideo.removeAttribute("src"); sharedVideo.load?.(); } catch {}

  if (!videoTrack && !videostream) {
    if (blankVideo) sharedVideo.src = blankVideo;
    return;
  }

  const ms = new MediaStream();
  if (videoTrack) ms.addTrack(videoTrack);

  // videostream に音声があれば同じ MediaStream へ同梱（再生先のスピーカー選択に活きる）
  try {
    if (videostream instanceof MediaStream) {
      const as = videostream.getAudioTracks?.();
      if (as && as.length > 0) ms.addTrack(as[0]);
    }
  } catch {}

  sharedVideo.srcObject = ms;
  try { await sharedVideo.play(); }
  catch {
    sharedVideo.muted = true;
    try { await sharedVideo.play(); } catch {}
  }

  // 再生開始後に sinkId を反映
  sharedVideo.onplaying = () => {
    if (!sharedVideo.srcObject || sharedVideo.srcObject.getAudioTracks().length === 0) return;
    const sel = win.document.getElementById("sharedscreen_speaker_selector");
    if (!sel || !("setSinkId" in HTMLMediaElement.prototype)) return;
    const defId = sel.options[0]?.value ?? "";
    const sinkId = sel.options[sel.selectedIndex]?.value ?? "";
    (async () => {
      try {
        await sharedVideo.setSinkId(defId);
        await sharedVideo.setSinkId(sinkId);
        console.log(`setSinkID Success -> ${sinkId} at ${sharedVideo.id}`);
      } catch (err) { console.error("setSinkId Err:", err); }
    })();
  };
}

// ポップアップブロック時に表示するモーダル（Promiseで完了を待てる版）
// resolve(window|null) … 開けたら Window、諦めた/閉じたら null
function showPopupPermissionModalAsync({ url, name, features }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.cssText =
      'position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:9999;';
    const modal = document.createElement('div');
    modal.style.cssText =
      'background:#fff;max-width:520px;width:92%;padding:20px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.2);font-family:sans-serif;';
    modal.innerHTML = `
      <h3 style="margin:0 0 10px">ポップアップがブロックされました</h3>
      <p style="margin:0 0 12px;font-size:14px;line-height:1.6">
        共有ウィンドウを開くには、クリック直後の操作として開く必要があります。<br>
        下の「再試行」を押してください。
      </p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 12px">
        <button id="pp-retry" style="padding:8px 14px;border:0;border-radius:8px;background:#0d6efd;color:#fff;cursor:pointer">
          再試行
        </button>
				<button id="pp-close" style="padding:8px 14px;border:0;border-radius:8px;background:#e5e5e5;cursor:pointer">
          閉じる
        </button>
      </div>
      <details>
        <summary style="cursor:pointer">ブラウザ設定で常に許可する手順</summary>
        <div style="font-size:13px;margin-top:8px;line-height:1.6">
          <b>Chrome / Edge</b>：アドレスバー右のポップアップアイコン →「常に許可」<br>
          または 🔒→ サイトの設定 →「ポップアップとリダイレクト」を許可。<br>
          <b>Safari</b>：設定(環境設定) → Webサイト →「ポップアップウインドウ」→ このサイトを「許可」。<br>
          <b>iOS Safari</b>：設定アプリ → Safari →「ポップアップブロック」をオフ。
        </div>
      </details>
    `;
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // 共通：開けたら resolve & close modal
    const resolveWith = (w) => {
      try { document.body.removeChild(overlay); } catch {}
      resolve(w || null);
    };

    // A) 再試行（このクリックはユーザー操作に同期 → open が通りやすい）
    modal.querySelector('#pp-retry').addEventListener('click', () => {
      const w = window.open(url, name, features);
      if (w) resolveWith(w);
      // まだブロックされる場合はモーダルを残してユーザーに別手段を促す
    });

    // B) 「リンクで開く」：ここでも programmatic に open して試す（成功率高）
    modal.querySelector('#pp-anchor').addEventListener('click', () => {
      const w = window.open(url, name, features);
      if (w) resolveWith(w);
    });

    // C) 諦める
    modal.querySelector('#pp-close').addEventListener('click', () => resolveWith(null));
  });
}

// ====== addSharedScreen（ポップアップ許可モーダル内蔵版） ======
async function addSharedScreen(remoteID, videostream) {
  if (remoteID != null && videostream != null) {
    console.log("show sharedscreen of " + remoteID);
    remotePeerIDSharingScreenMediaStreamMap.set(remoteID, videostream);
  }
  const videoTrack = pickVideoTrack(videostream);

  // 既に共有ウィンドウが開いている → メディア差し替え
  if (sharedWindow && !sharedWindow.closed) {
    console.log("sharedscreen is opened");
    try {
      await attachTrackToSharedVideo({ win: sharedWindow, videoTrack, remoteID, videostream });
      populateSpeakerSelectorAndBind(sharedWindow);
      return;
    } catch (e) {
      console.warn("attach to opened shared window failed, reopen", e);
      try { sharedWindow.close(); } catch {}
      sharedWindow = null;
      sharedVideo  = null;
    }
  }

  // 新規で開く（ここがポップアップブロックされる可能性あり）
  console.log("create sharedscreen");
  const url = "sharedscreen.html";
  const name = "shared_screen";
  const features = "width=300,height=200,scrollbars=no,resizable=yes";
  let win = null;
  try {
    // ※ ここがユーザークリック直後なら通りやすい
    win = window.open(url, name, features);
  } catch {}

  // ブロックされた → 自前モーダルで誘導（再試行/リンク）
  if (!win) {
    win = await showPopupPermissionModalAsync({ url, name, features });
    if (!win) return; // ユーザーが閉じた場合は終了
  }
  sharedWindow = win;

  // ロード完了待ち（同一オリジン前提）
  const waitReady = () => new Promise((resolve) => {
    const poll = setInterval(() => {
      if (win.closed) { clearInterval(poll); resolve(false); return; }
      try {
        if (win.document && win.document.readyState === "complete") {
          clearInterval(poll);
          resolve(true);
        }
      } catch (_) { /* 読み込み中は触れない → 継続 */ }
    }, 100);
  });

  const ok = await waitReady();
  if (!ok) return;

  // 要素アタッチ & スピーカーリスト反映
  await attachTrackToSharedVideo({ win, videoTrack, remoteID, videostream });
  populateSpeakerSelectorAndBind(win);

  // 閉じる/リロード時の掃除
  win.onbeforeunload = () => {
    console.log("shared window beforeunload");
    sharedWindow = null;
    sharedVideo  = null;
  };
  win.onclose = () => {
    console.log("shared window closed");
    sharedWindow = null;
    sharedVideo  = null;
  };
}


function removeSharedScreen(remoteID){
	console.log("finish share screen of "+remoteID);
	if(remotePeerIDSharingScreenMediaStreamMap.has(remoteID)){
		remotePeerIDSharingScreenMediaStreamMap.delete(remoteID);
	}
	if(sharedVideo != null){
		if(remotePeerIDSharingScreenMediaStreamMap.size > 0){
			//動画を別のに切り替える
			for(var[key, value] of remotePeerIDSharingScreenMediaStreamMap){
				console.log("switch shared video to "+key);
				sharedVideo.srcObject = value.track;
				break;
			}
		} else {
			//背景
			console.log("switch shared video to back ground");
			sharedVideo.srcObject = null;
			sharedVideo.src = blankVideo;
		}
	}
}