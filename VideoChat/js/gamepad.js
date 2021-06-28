var haveEvents = 'GamepadEvent' in window;
var controllers = {};
var rAF = window.requestAnimationFrame;

var parantExistanceFlag = true;
var leftTracking = false;
var leftBackTimer = null;
var rightTracking = false;
var rightBackTimer = null;
var defaultX = 0.5;
var defaultY = 0.5;
var incrementX = 0.01;
var incrementY = 0.01;
var currentLeftX = defaultX;
var currentLeftY = defaultY;
var currentRightX = defaultX;
var currentRightY = defaultY;
var  nextHandPose = false;
var  backHandPose = false;

var leftCanvas = null;
var rightCanvas = null;
var leftHandImg = new Image();
var rightHandImg = new Image();
var currentHandType = "handgesture"
leftHandImg.src = "./pics/gestures/"+currentHandType+"-g-left.png";
rightHandImg.src = "./pics/gestures/"+currentHandType+"-g-right.png";
var buttonState=[];//true/false

window.onload = ()=> {
	if (!window.opener || !Object.keys(window.opener).length) {
			//window.alert('親画面が存在しません')
			parantExistanceFlag = false
	}
	currentHandType = window.opener.getHand();
	defaultLeftHand();
	defaultRightHand();
}
function hansSelect(handType){
	currentHandType = handType;
	if(leftTracking){
		leftHandImg.src = "./pics/gestures/"+currentHandType+"-r-left.png";
	} else {
		leftHandImg.src = "./pics/gestures/"+currentHandType+"-g-left.png";
	}
	leftHandImg.onload = function(){
		drawHand(leftCanvas, leftHandImg, currentLeftX, currentLeftX);
	}
	if(rightTracking){
		rightHandImg.src = "./pics/gestures/"+currentHandType+"-r-right.png";
	} else {
		rightHandImg.src = "./pics/gestures/"+currentHandType+"-g-right.png";
	}
	rightHandImg.onload = function(){
		drawHand(rightCanvas, rightHandImg, currentRightX, currentRightX);
	}
	repaintHands();
}

function drawHand(canvasObj, handImg, xRatio, yRatio){
	if(canvasObj != null){
		var x= canvasObj.width*xRatio;
		var y = canvasObj.height*yRatio;
		var context = canvasObj.getContext( "2d" ) ;
		context.clearRect(0, 0, canvasObj.width, canvasObj.height);
		var imgWidth = handImg.naturalWidth;
		var imgHeight = handImg.naturalHeight;
		context.save();
		context.translate(x, y);
		context.drawImage(handImg, -imgWidth/2, -imgHeight/2, imgWidth, imgHeight);
		context.restore();
	}
}

function repaintHands(){
	drawHand(leftCanvas, leftHandImg, currentLeftX, currentLeftY);
	drawHand(rightCanvas, rightHandImg, currentRightX, currentRightY);
}


function connectHandler(e) {
	addGamepad(e.gamepad);
}

function addGamepad(gamepad) {
	// gamepadのArrayを作成
	controllers[gamepad.index] = gamepad;
	// HTMLへ接続されたGamepad毎の要素を追加（複数のgamepadにも対応）
	var d = document.createElement("div");
	d.setAttribute("id", "controller" + gamepad.index); //idはpadの番号がついた形式
	
	var tAnalog = document.createElement("h4");
	tAnalog.appendChild(document.createTextNode("Analog Hand: "));
	d.appendChild(tAnalog);
	var analogDataContent = document.createElement("div");
	analogDataContent.className = "analogData";
	leftCanvas = document.createElement("canvas");
	leftCanvas.id = "left-hand-canvas";
	leftCanvas.className = "hand-canvas";
	rightCanvas = document.createElement("canvas");
	rightCanvas.id = "right-hand-canvas";
	rightCanvas.className = "hand-canvas";
	analogDataContent.appendChild(leftCanvas);
	analogDataContent.appendChild(document.createTextNode(" "));
	analogDataContent.appendChild(rightCanvas);
	d.appendChild(analogDataContent);
	
	var img = new Image();   // 新たな img 要素を作成
	img.src = "pics/xboxcontroller.png";
	var t = document.createElement("h4");
	t.appendChild(document.createTextNode("接続Gamepad情報: "));
	d.appendChild(t);
	d.appendChild(img);
	var info = document.createElement("h3");
	info.appendChild(document.createTextNode(gamepad.id));
	d.appendChild(info);
	//Gamepadコントロール要素（ボタンなど）表示部分
	var b = document.createElement("div");
	b.className = "buttons";
	var t = document.createElement("h4");
	t.appendChild(document.createTextNode("ボタンコントロール情報: "));
	b.appendChild(t);
	buttonState = [];
	for (var i = 0; i < gamepad.buttons.length; i++) {
		var e = document.createElement("span");
		e.className = "button";
		//e.id = "b" + i;
		e.innerHTML = i;
		b.appendChild(e);
		buttonState.push(false);
	}
	d.appendChild(b);
	//Gamepadコントロール要素（アナログジョイなど）表示部分
	var a = document.createElement("div");
	a.className = "axes";
	var t = document.createElement("h4");
	t.appendChild(document.createTextNode("アナログコントロール情報: "));
	a.appendChild(t);
	var as = document.createElement("div");
	as.className = "axisContainer";
	a.appendChild(as);
	for (i = 0; i < gamepad.axes.length; i++) {
		var axisD = document.createElement("div");
		var c = document.createElement("h5");
		c.appendChild(document.createTextNode("axis" + i));
		var e = document.createElement("meter");
		e.className = "axis";
		//e.id = "a" + i;
		e.setAttribute("min", "-1");
		e.setAttribute("max", "1");
		e.setAttribute("value", "0");
		e.innerHTML = i;
		axisD.appendChild(c);
		axisD.appendChild(e);
		as.appendChild(axisD);
		//c.appendChild(e);
		//a.appendChild(c);
	}
	d.appendChild(a);
	document.getElementById("start").style.display = "none";
	document.body.appendChild(d);
	rAF(updateStatus);
}

function disconnectHandler(e) {
	removeGamepad(e.gamepad);
}

function removeGamepad(gamepad) {
	var d = document.getElementById("controller" + gamepad.index);
	document.body.removeChild(d);
	delete controllers[gamepad.index];
}

function updateStatus() {
	scanGamepads();
	
	for (j in controllers) {
		var moveLeft = false;
		var moveRight = false;
		var updateLeft = false;
		var updateRight = false;
		var leftX = 0, leftY = 0, rightX = 0, rightY = 0;
		
		var controller = controllers[j];
		var d = document.getElementById("controller" + j);
		var buttons = d.getElementsByClassName("button");
		//ボタン情報の状態取得
		for (var i = 0; i < controller.buttons.length; i++) {
			var b = buttons[i];
			var val = controller.buttons[i];
			var pressed = val == 1.0;
			if (typeof (val) == "object") {
				pressed = val.pressed;
				val = val.value;
			}
			var pct = Math.round(val * 100) + "%";
			b.style.backgroundSize = pct + " " + pct;
			if (pressed) {
				if(buttonState[i] != pressed){
					//console.log("button "+i+" : pressed");
					if(i==0){
						if(parantExistanceFlag){
							window.opener.sendMood();
						}
					} else if(i==2){
						if(parantExistanceFlag){
							window.opener.sendEmotionBad();
						}
					} else if(i==3){
						if(parantExistanceFlag){
							window.opener.sendEmotionHappy();
						}
					} else if(i==12){
						if(parantExistanceFlag){
							window.opener.sendAttractivenessIncrease();
						}
					} else if(i==13){
						if(parantExistanceFlag){
							window.opener.sendAttractivenessDecrease();
						}
					}
				}
				if(i == 6){
					//left
					moveLeft = true;
				} else if(i == 7){
					//right
					moveRight = true;
				} else if(i == 5){
					//next hand pose
					if(!nextHandPose){
						if(parantExistanceFlag){
							window.opener.handChange(+1);
						}
					}
					nextHandPose = true;
				} else if(i == 4){
					//back hand pose
					if(!backHandPose){
						if(parantExistanceFlag){
							window.opener.handChange(-1);
						}	
					}
					backHandPose = true;
				}
				b.className = "button pressed";
			} else {
				if(buttonState[i] != pressed){
					//console.log("button "+i+" : released");
				}
				if(i == 5){
					//next hand pose
					nextHandPose = false;
				} else if(i == 4){
					//back hand pose
					backHandPose = false;
				}
				b.className = "button";
			}
			buttonState[i] = pressed;
		}
		//アナログコントロール情報の状態取得
		var axesZeroThreshold = 0.05;
		var axes = d.getElementsByClassName("axis");
		for (var i = 0; i < controller.axes.length; i++) {
			var a = axes[i];
			//console.log(controller.axes[i]+" "+Math.abs(controller.axes[i]));
			if (i == 0) {
				//left x 右倒し+1
				if (Math.abs(controller.axes[i]) < axesZeroThreshold) {
					//leftX = 0.5;
					leftX = 0;
				} else {
					//leftX = (1+controller.axes[i])/2;
					if(Math.sign(controller.axes[i])>0){
						leftX = incrementX;
					} else {
						leftX = -incrementX;
					}
					updateLeft = true;
				}
			} else if (i == 1) {
				//left y 上倒し-1
				if (Math.abs(controller.axes[i]) < axesZeroThreshold) {
					//leftY = 0.5;
					leftY = 0;
				} else {
					//leftY = (1+controller.axes[i])/2;
					if(Math.sign(controller.axes[i])>0){
						leftY = incrementY;
					} else {
						leftY = -incrementY;
					}
					updateLeft = true;
				}
			} else if (i == 2) {
				//right x 右倒し+1
				if (Math.abs(controller.axes[i]) < axesZeroThreshold) {
					//rightX = 0.5;
					rightX = 0;
				} else {
					//rightX = (1+controller.axes[i])/2;
					if(Math.sign(controller.axes[i])>0){
						rightX = incrementX;
					} else {
						rightX = -incrementX;
					}
					updateRight = true;
				}
			} else if (i == 3) {
				//right y 上倒し-1
				if (Math.abs(controller.axes[i]) < axesZeroThreshold) {
					//rightY = 0.5;
					rightY = 0;
				} else {
					//rightY = (1+controller.axes[i])/2;
					if(Math.sign(controller.axes[i])>0){
						rightY = incrementY;
					} else {
						rightY = -incrementY;
					}
					updateRight = true;
				}
			} else {}
			a.innerHTML = i + ": " + controller.axes[i].toFixed(4);
			a.setAttribute("value", controller.axes[i]);
			//console.log(updateLeft+" "+controller.axes[i]+" "+Math.abs(controller.axes[i]));
		}
		
		//console.log(updateLeft +"  "+updateRight);
		if(moveLeft){
			if(updateLeft){
				currentLeftX += leftX;
				currentLeftY += leftY;
			}
			if(currentLeftX < 0){
				currentLeftX = 0;
			} else if(currentLeftX > 1){
				currentLeftX = 1;
			}
			if(currentLeftY < 0){
				currentLeftY = 0;
			} else if(currentLeftY > 1){
				currentLeftY = 1;
			}
			if(!leftTracking){
				setLeftHand(currentLeftX, currentLeftY);
			} else if(updateLeft){
				moveLeftHand(currentLeftX, currentLeftY);
			}
			leftTracking = true;
		}else if(leftTracking){
			//中央
			defaultLeftHand();
			/*
			if(leftBackTimer == null){
				leftBackTimer = setTimeout(function () {
					defaultLeftHand();
				}, 1000);
			}
			*/
		}
		
		if(moveRight){
			if(updateRight){
				currentRightX += rightX;
				currentRightY += rightY;
			}
			if(currentRightX < 0){
				currentRightX = 0;
			} else if(currentRightX > 1){
				currentRightX = 1;
			}
			if(currentRightY < 0){
				currentRightY = 0;
			} else if(currentRightY > 1){
				currentRightY = 1;
			}
			if(!rightTracking){
				setRightHand(currentRightX, currentRightY);
			} else if(updateRight){
				moveRightHand(currentRightX, currentRightY);
			}
			rightTracking = true;
		}else if(rightTracking){
			//中央
			defaultRightHand();
			/*
			if(rightBackTimer == null){
				rightBackTimer = setTimeout(function () {
					defaultRightHand();
				}, 1000);
			}
			*/
		}
	}//end of j controller
	
	
	rAF(updateStatus);
}

function setLeftHand(xRatio, yRatio){
	//start
	if(leftBackTimer != null){
		clearTimeout(leftBackTimer);
		leftBackTimer = null;
	}
	//console.log("setLeftHand "+xRatio +"/"+yRatio);
	leftHandImg.src = "./pics/gestures/"+currentHandType+"-r-left.png";
	leftHandImg.onload = function(){
		drawHand(leftCanvas, leftHandImg, xRatio, yRatio);
	}
	//command
	if(parantExistanceFlag){
		window.opener.leftHandAnalogGestureStart(xRatio, yRatio);
	}
}
function moveLeftHand(xRatio, yRatio){
	if(leftBackTimer != null){
		clearTimeout(leftBackTimer);
		leftBackTimer = null;
	}
	//command
	//console.log("moveLeftHand "+xRatio +"/"+yRatio);
	//leftHandImg.src = "./pics/gestures/hand-r-left.png";
	drawHand(leftCanvas, leftHandImg, xRatio, yRatio);
	if(parantExistanceFlag){
		window.opener.leftHandAnalogGestureMove(xRatio, yRatio);
	}
}

function defaultLeftHand() {
	currentLeftX = defaultX;
	currentLeftY = defaultY;
	leftTracking = false;
	leftBackTimer = null;
	//console.log("defaultLeftHand");
	leftHandImg.src = "./pics/gestures/"+currentHandType+"-g-left.png";
	leftHandImg.onload = function(){
		drawHand(leftCanvas, leftHandImg, currentLeftX, currentLeftY);
	}
	//command
	if (parantExistanceFlag) {
		window.opener.leftHandAnalogGestureEnd();
	}
}

function setRightHand(xRatio, yRatio){
	//start
	if(rightBackTimer != null){
		clearTimeout(rightBackTimer);
		rightBackTimer = null;
	}
	rightHandImg.src = "./pics/gestures/"+currentHandType+"-r-right.png";
	rightHandImg.onload = function(){
		drawHand(rightCanvas, rightHandImg, xRatio, yRatio);
	}
	//command
	if(parantExistanceFlag){
		window.opener.rightHandAnalogGestureStart(xRatio, yRatio);
	}
}
function moveRightHand(xRatio, yRatio){
	//console.log("moveRightHand "+xRatio +"/"+yRatio);
	//rightHandImg.src = "./pics/gestures/hand-r-right.png";
	drawHand(rightCanvas, rightHandImg, xRatio, yRatio);
	if(rightBackTimer != null){
		clearTimeout(rightBackTimer);
		rightBackTimer = null;
	}
	//command
	if(parantExistanceFlag){
		window.opener.rightHandAnalogGestureMove(xRatio, yRatio);
	}
}

function defaultRightHand() {
	currentRightX = defaultX;
	currentRightY = defaultY;
	rightTracking = false;
	rightBackTimer = null;
	rightHandImg.src = "./pics/gestures/"+currentHandType+"-g-right.png";
	rightHandImg.onload = function(){
		drawHand(rightCanvas, rightHandImg, currentRightX, currentRightY);
	}
	//command
	if (parantExistanceFlag) {
		window.opener.rightHandAnalogGestureEnd();
	}
}

function scanGamepads() {
	var gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
	for (var i = 0; i < gamepads.length; i++) {
		if (gamepads[i]) {
			if (!(gamepads[i].index in controllers)) {
				addGamepad(gamepads[i]);
				console.log("a");
			} else {
				controllers[gamepads[i].index] = gamepads[i];
				//console.log("b");
			}
		}
	}
}


if (haveEvents) {
	window.addEventListener("gamepadconnected", connectHandler);
	window.addEventListener("gamepaddisconnected", disconnectHandler);
} else {
	setInterval(scanGamepads, 500);
}