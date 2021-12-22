// !!ros!!
//<script src="http://static.robotwebtools.org/EventEmitter2/current/eventemitter2.min.js"></script>
//<script src="http://static.robotwebtools.org/roslibjs/current/roslib.min.js"></script>
// Connecting to ROS 
'use strict';
//
var rosSocket = null;
var rosSocketIsConnected = false;
var rosURL = "";

function rosWebSocketConnect(url){
	//var url = document.getElementById('socket_url').value;
	console.log("clicked "+url);
	rosURL = url;
	if(!rosSocketIsConnected){
		//connect
		rosSocket = new ROSLIB.Ros();

		rosSocket.on('connection', function() {
			console.log('Connected to ros');
			rosSocketIsConnected = true;
			setROSsocketButton(false);
			if(autorosconnectFlag){
				if(autorosconnectTimer != null){
					clearInterval(autorosconnectTimer);
					autorosconnectTimer = null;
				}
			}
			
			onRosConnect();
		});

		rosSocket.on('error', function(error) {
			console.log('Error connecting to ros: ', error);
			rosSocketIsConnected = false;
			setROSsocketButton(true);
		});

		rosSocket.on('close', function() {
			console.log('Connection to ros closed.');
			onRosDisconnect();
			rosSocketIsConnected = false;
			setROSsocketButton(true);
			if(autorosconnectFlag){
				if(autorosconnectTimer == null){//try to connect後失敗してもここに来るから
					autorosconnectTimer = setInterval(function () {
						clickROSsocketButton();
					}, 10000);
				}
			}
			rosSocket = null;
		});
		
		rosSocket.connect(url);
	} else {
		//disconnect
		rosSocket.close();
		console.log("close Connection to ros");
		//rosSocket = null;
		//rosSocketIsConnected = false;
	}
}

var rosVideoStreamerMap = new Map();//video track id, ROSVideoStreamer
var rosVideoStreamers =  [];

//接続中のVideoを送る
function onRosConnect(){
	//localを全部送る
	var elements = document.getElementsByName('local_camera_video');
	for (var i = 0; i < elements.length; i++) {
		const videoid = elements[i].getAttribute("videoid");
		const sendCheckBox = document.getElementById('local_camera_ros_checkBox_' + videoid);
		if(sendCheckBox == null){
		} else if(sendCheckBox.checked){
			if(elements[i].srcObject != null){
				//console.log("try to send "+elements[i].id+", already sent "+rosVideoStreamerMap.size+" videos");
				sendVideoToROS(elements[i].id, "avatar", elements[i].srcObject);
			} else {
				console.log('local_camera_video'+' srcObjec is null');
			}
		}
	}
	
	//接続相手を全部送る
	elements = document.getElementsByClassName('video');
	for (var i = 0; i < elements.length; i++) {
		onNewUserVideoConnected(elements[i]);
	}
	if(useAnimationFrameLoopToSend){
		videoSendLoop();
	}
}

function onNewUserVideoConnected(videoElement){
	const peerid = videoElement.getAttribute("peerid");
	const trackid = videoElement.getAttribute("trackid");
	const sendCheckBox = document.getElementById(peerid+"_" + trackid+"_ros_checkBox");
	if(sendCheckBox == null){
	} else if(sendCheckBox.checked){
		if(videoElement.srcObject != null){
			//console.log("try to send "+elements[i].id+", already sent "+rosVideoStreamerMap.size+" videos");
			sendVideoToROS(videoElement.id, "operator", videoElement.srcObject);
		} else {
			//sound only
			console.log('video(operator video)'+' srcObjec is null');
		}
	}
}

function stopVideoStreamer(videoid){
	if(rosVideoStreamerMap.has(videoid)){
		var rosVideoStreamerSent = rosVideoStreamerMap.get(videoid);
		rosVideoStreamerSent.stop();
		rosVideoStreamerMap.delete(videoid);
	}
}

function rosSendCheckBoxChanged(){
	//this はCheckBoxだからその対象のVideoIDがほしい
	var videocontainerid = this.getAttribute("videocontainerid");
	console.log(this.id +"("+videocontainerid+") changed to "+this.checked);
	if(this.checked){
		var videoElement = document.getElementById(videocontainerid);
		sendVideoToROS(videoElement.id, this.getAttribute("teleopetype"), videoElement.srcObject);
	} else {
		stopVideoStreamer(videocontainerid);
	}
	
}

//接続中の送信を止める
function onRosDisconnect(){
	console.log("close all ROSVideoStreamers");
	if(useAnimationFrameLoopToSend){
		videoSendLoopStop();
	}
	//すべての配信を止める
	for (let sentvideoid of rosVideoStreamerMap.keys()) {
		var rosVideoStreamerSent = rosVideoStreamerMap.get(sentvideoid);
		rosVideoStreamerSent.stop();
	}
	rosVideoStreamerMap.clear();
}

//新しい接続があったとき, videoid=deviceid, userType=operator/avatar, videotrack=video.srcObject
function sendVideoToROS(videoid, userType,videotrack){
	if(rosSocketIsConnected){
		//rosSocket, topicName, videoTrack
		var myPeerID = document.getElementById("myuserid");
		//topicname, /avatar_vision/*envname*/operator or avatar/image_index/compressed, index starts from 1
		var localCameraIndex = 1;
		
		for (let sentvideoid of rosVideoStreamerMap.keys()) {
			var rosVideoStreamerSent = rosVideoStreamerMap.get(sentvideoid);
			//console.log('id:' + sentvideoid + ' topicName:' + rosVideoStreamerSent.getTopicName() );
			if(sentvideoid == videoid){
				console.log(videoid +" is already sent to ROS");
				return;
			}
			if(rosVideoStreamerSent.getTopicName() == ("/avatar_vision/"+myPeerID.value+"/"+userType+"/image_"+localCameraIndex+"/compressed")){
				localCameraIndex ++;
			}
		}
		
		var topicName = "/avatar_vision/"+myPeerID.value+"/"+userType+"/image_"+localCameraIndex+"/compressed";
		console.log(userType+' topic = '+topicName+ ', id='+videoid+', '+rosVideoStreamerMap.size+' videos sent');
		
		var rosVideoStreamer = new ROSVideoStreamer(rosSocket, topicName, videotrack, localCameraIndex);
		rosVideoStreamerMap.set(videoid, rosVideoStreamer);
		rosVideoStreamer.start();
	}
}


var autorosconnectTimer = null;
var autorosconnectFlag = false;
function autorosConnect(onoff){
	autorosconnectFlag = onoff;
	if(onoff){
		if(!rosSocketIsConnected){
			if(autorosconnectTimer == null){
				autorosconnectTimer = setInterval(function () {
					clickROSsocketButton();
				}, 10000);
			}
		}
	} else {
		if(autorosconnectTimer != null){
			clearInterval(autorosconnectTimer);
			autorosconnectTimer = null;
		}
	}
}

//topicname, /avatar_vision/*envname*/operator or avatar/image_index/compressed, index starts from 1
// ex, /avatar_vision/test/operator/image_1/compressed  /avatar_vision/test/avatar/image_1/compressed
var maxWidth = 640;//max full hdと仮定して最大4枚まで送りたいとなると1920/2=960:540, 640, 320
var canvasElement = document.createElement("canvas");
var maxHeight = parseInt(maxWidth*9/16);
canvasElement.style.width = maxWidth+'px';
canvasElement.style.height = maxHeight+'px';
canvasElement.width = maxWidth;
canvasElement.height = maxHeight;
var canvasCtx = canvasElement.getContext('2d', {storage: "discardable"});

var useAnimationFrameLoopToSend = true;
//canvasへのdrawImageを使うので描画よりも頻度が高いのは良くないかもってことで．．．でも20fpsくらいは出るのでPCによっては十分だし，順番にCanvasに書くから行儀良さそう
var startTime = new Date().getTime();　//描画開始時刻を取得
var prevTime =  new Date().getTime();　//描画開始時刻を取得
var requestId; 
async function videoSendLoop(){
	requestId = null;
	requestId = window.requestAnimationFrame(videoSendLoop);
	/*
	var currentTime = new Date().getTime();　//経過時刻を取得
	var status = (currentTime-prevTime) // 描画開始時刻から経過時刻を引く
	prevTime = currentTime;
	console.log(status);
	*/
	for (let sentvideoid of rosVideoStreamerMap.keys()) {
		var rosVideoStreamerSent = rosVideoStreamerMap.get(sentvideoid);
		//console.log("try to start "+rosVideoStreamerSent.topicName);
		//まっても変わらん，4トラック送ると10FPSにまで落ちる
		await rosVideoStreamerSent.readChunkAndWait();//trackごとまつ
		//rosVideoStreamerSent.readChunkAndWait();//trackごとまたない
		//console.log("try to end "+rosVideoStreamerSent.topicName);
	}
}
function videoSendLoopStop(){
	window.cancelAnimationFrame(requestId);
	requestId = null;
}

class ROSVideoStreamer {
	/*
	writableRos = null;
	processor = null;
	topic = null;
	*/
	constructor(rosSocket, topicName, videoTrack, trackNum) {
		//負荷軽減のためにTopicごとにSocketつくる．．．あまり変わらなそう
		if(rosSocketIsConnected){
			//connect
			this.rosSocket = new ROSLIB.Ros();

			this.rosSocket.on('connection', function() {
				console.log('Sub ROS Client Connected to ros');
				//isRosConnected = true;
				//start();
			});

			this.rosSocket.on('error', function(error) {
				console.log('Sub ROS Client Error connecting to ros: ', error);
				
			});

			this.rosSocket.on('close', function() {
				console.log('Sub ROS Client Connection to ros closed.');
				
			});
		
			this.rosSocket.connect(rosURL);
		}
		
		//this.rosSocket = rosSocket;
		this.topicName = topicName;
		this.videoTrack = videoTrack;
		this.trackNum = trackNum;
	}
	
	getTopicName(){
		return this.topicName;
	}
	
	//https://pretagteam.com/question/javascript-extract-video-frames-reliably
	async readChunkAndWait() {
		await this.reader.read().then(async ({done, value
		}) => {
			//ここが複数にするとたまる
			//console.log("start "+this.topicName);
			if (value) {
				//var canvasElement = document.createElement("canvas");
				/*
				canvasElement.style.width = value.codedWidth+'px';
				canvasElement.style.height = value.codedHeight+'px';
				canvasElement.width = value.codedWidth;
				canvasElement.height = value.codedHeight;
				*/
				//小さく
				var maxHeight = parseInt(maxWidth*9/16);
				if(value.codedWidth > maxWidth){
					canvasElement.style.width = maxWidth+'px';
					canvasElement.style.height = maxHeight+'px';
					canvasElement.width = maxWidth;
					canvasElement.height = maxHeight;
				} else {
					canvasElement.style.width = value.codedWidth+'px';
					canvasElement.style.height = value.codedHeight+'px';
					canvasElement.width = value.codedWidth;
					canvasElement.height = value.codedHeight;
				}
				
				//var canvasCtx = canvasElement.getContext('2d', {storage: "discardable"});
				
				//drawImage causes memory leak
				canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
				canvasCtx.drawImage(value, 0, 0, canvasElement.width, canvasElement.height);
				
				// image jpeg publish
				//const bitmap = await createImageBitmap(value, {resizeWidth: maxWidth, resizeHeight: maxHeight, resizeQuality: "high"});
				//console.log(bitmap);
				//bitmap.close();
				
				var data = canvasElement.toDataURL('image/jpeg');
				
				// Canvas を破棄するとき
				//canvasCtx = null;
				//canvasElement.height = 0;
				//canvasElement.width = 0;
				//canvasElement.remove();
				//canvasElement = null;
				
				//console.log(data);
				var ros_frameid_headerElement = document.getElementById("ros_frameid_header");
				var imageMessage = new ROSLIB.Message({
					header : {
						frame_id : ros_frameid_headerElement.value+this.trackNum
					},
					format : "jpeg",
					data : data.replace("data:image/jpeg;base64,", "")
				});
				data = null;
				//ここでそれぞれのTopicにアスセスせにゃならんのだが
				//console.log(this.topic);
				
				if(!this.stopped)this.topic.publish(imageMessage);
				
				//console.log(this.topicName);
				//console.log(imageMessage);
				//this.topic.publish(imageMessage);
				
				//canvasElement = null;
				
				value.close();
			}
			
			//rosSocketIsConnectedのフラグは実際ROSとのコネクションが切れてから変わるのでROSとのコネクションが切れたらエラーが出るのは避けられぬ
			if (!done && !this.stopped) {
				////もしvideoSendLoopを使わないなら
				if(!useAnimationFrameLoopToSend){
					//this.readChunk();
				}
			} else {
				//select.disabled = false;
			}
			//console.log("done "+this.topicName);
		});
	}
	readChunk() {
		this.reader.read().then(async ({done, value
		}) => {
			//ここが複数にするとたまる
			//console.log("start "+this.topicName);
			if (value) {
				//var canvasElement = document.createElement("canvas");
				/*
				canvasElement.style.width = value.codedWidth+'px';
				canvasElement.style.height = value.codedHeight+'px';
				canvasElement.width = value.codedWidth;
				canvasElement.height = value.codedHeight;
				*/
				//小さく
				var maxHeight = parseInt(maxWidth*9/16);
				if(value.codedWidth > maxWidth){
					canvasElement.style.width = maxWidth+'px';
					canvasElement.style.height = maxHeight+'px';
					canvasElement.width = maxWidth;
					canvasElement.height = maxHeight;
				} else {
					canvasElement.style.width = value.codedWidth+'px';
					canvasElement.style.height = value.codedHeight+'px';
					canvasElement.width = value.codedWidth;
					canvasElement.height = value.codedHeight;
				}
				
				//var canvasCtx = canvasElement.getContext('2d', {storage: "discardable"});
				
				//drawImage causes memory leak
				canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
				canvasCtx.drawImage(value, 0, 0, canvasElement.width, canvasElement.height);
				
				// image jpeg publish
				//const bitmap = await createImageBitmap(value, {resizeWidth: maxWidth, resizeHeight: maxHeight, resizeQuality: "high"});
				//console.log(bitmap);
				//bitmap.close();
				var data = canvasElement.toDataURL('image/jpeg');
				
				// Canvas を破棄するとき
				//canvasCtx = null;
				//canvasElement.height = 0;
				//canvasElement.width = 0;
				//canvasElement.remove();
				//canvasElement = null;
				
				//console.log(data);
				var ros_frameid_headerElement = document.getElementById("ros_frameid_header");
				var imageMessage = new ROSLIB.Message({
					header : {
						frame_id : ros_frameid_headerElement.value+this.trackNum
					},
					format : "jpeg",
					data : data.replace("data:image/jpeg;base64,", "")
				});
				data = null;
				//ここでそれぞれのTopicにアスセスせにゃならんのだが
				//console.log(this.topic);
				
				if(!this.stopped)this.topic.publish(imageMessage);
				
				//console.log(this.topicName);
				//console.log(imageMessage);
				//this.topic.publish(imageMessage);
				
				//canvasElement = null;
				
				value.close();
			}
			
			//rosSocketIsConnectedのフラグは実際ROSとのコネクションが切れてから変わるのでROSとのコネクションが切れたらエラーが出るのは避けられぬ
			if (!done && !this.stopped) {
				////もしvideoSendLoopを使わないなら
				if(!useAnimationFrameLoopToSend){
					this.readChunk();
				}
			} else {
				//select.disabled = false;
			}
			//console.log("done "+this.topicName);
		});
	}
	start(){
		this.topic = new ROSLIB.Topic({
			ros : this.rosSocket,
			name : this.topicName,
			messageType : 'sensor_msgs/CompressedImage',
			queue_size : 1
		});
		
		//console.log(this.videoTrack.getVideoTracks().length);
		if(this.videoTrack.getVideoTracks().length > 0){
			this.processor = new MediaStreamTrackProcessor(
				// localMediaStream.getVideoTracks()[0]
				this.videoTrack.getVideoTracks()[0]
			);
			//https://note.com/skyway/n/ned76e8596d9c
			this.reader = this.processor.readable.getReader();
			this.stopped = false;//stop flag
			////もしvideoSendLoopを使わないなら
			if(!useAnimationFrameLoopToSend){
				this.readChunk();
			}
		}
	}
	
	//https://zenn.dev/mganeko/articles/videotrackreader
	stop(){
		console.log("stop publish "+this.topicName);
		this.rosSocket.close();
		this.stopped = true;
		//this.readerをなにかせんでもいいのか？
		//processor.readable.cancel(); // streamがlockされているため、cancel()できない
		this.processor = null;
	}
	
}

/*
ビデオトラックごとにMediaStreamTrackProcessor, WritableStream, Topicが必要
remoteVideo.srcObject.getVideoTracks()[0]
↓create
MediaStreamTrackProcessor
↓pipe
WritableStream
↓
sendRosTopic
*/
