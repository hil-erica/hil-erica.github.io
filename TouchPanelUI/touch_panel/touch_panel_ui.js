
var previousUpdateTimestamp = '';
var previousQuestionIDList = '';
var doUpdate = false;

var connection;

function connectToIshiki(){
	// console.log("hogehoghoe");

	//WebSocket接続
	connection = new WebSocket("ws://localhost:8000/");

	//接続通知
	connection.onopen = function(event) {
		document.getElementById( "eventType" ).value = "通信接続イベント受信";
		document.getElementById( "dispMsg" ).value = event.data;
	};

	//エラー発生
	connection.onerror = function(error) {
		document.getElementById( "eventType" ).value = "エラー発生イベント受信";
		document.getElementById( "dispMsg" ).value = error.data;
	};

	//メッセージ受信
	connection.onmessage = function(event) {
		document.getElementById( "eventType" ).value = "メッセージ受信";
		document.getElementById( "received" ).value = event.data;
		const receivedCommand = JSON.parse(event.data);
		console.log(receivedCommand.op);
		console.log(receivedCommand.choices);

		for (var i = 0; i < receivedCommand.choices.length; i++) {
			let element = receivedCommand.choices[i];
			console.log(element);
			createChoiceButton(element, i);
		}
	};

	//切断
	connection.onclose = function() {
		document.getElementById( "eventType" ).value = "通信切断イベント受信";
		document.getElementById( "dispMsg" ).value = "";
	};
}

function createChoiceButton(choice_text, choice_index) {
	let button = document.createElement("button");

	button.innerHTML = choice_text;

	button.id = "choice_button_" + choice_index;

	let target = document.getElementById("choice_buttons");
	button.addEventListener("click", callback);

	target.appendChild(button);
}

function callback(e) {
	console.log(e.target.id);

	let choice_index = parseInt(e.target.id.replace("choice_button_", ""), 10);
	let returnCommandData = {op: 'selected', selected: choice_index};
	let returnCommand = JSON.stringify(returnCommandData);
	console.log(returnCommand);
	connection.send(returnCommand);
}


function onClicked(){
	connection.send('サンプルデータ');
}

window.addEventListener('load', function () {
	connectToIshiki();

	// createChoiceButton("hoge", 2);
});