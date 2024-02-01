
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
		// document.getElementById( "eventType" ).value = "通信接続イベント受信";
		// document.getElementById( "dispMsg" ).value = event.data;
	};

	//エラー発生
	connection.onerror = function(error) {
		// document.getElementById( "eventType" ).value = "エラー発生イベント受信";
		// document.getElementById( "dispMsg" ).value = error.data;
	};

	//メッセージ受信
	connection.onmessage = function(event) {
		// document.getElementById( "eventType" ).value = "メッセージ受信";
		// document.getElementById( "received" ).value = event.data;
		const receivedCommand = JSON.parse(event.data);
		console.log(receivedCommand.op);
		console.log(receivedCommand.choices);

		clearChoiceButtons();
		for (var i = 0; i < receivedCommand.choices.length; i++) {
			let element = receivedCommand.choices[i];
			console.log(element);
			createChoiceButton(element, i);
		}
	};

	//切断
	connection.onclose = function() {
		// document.getElementById( "eventType" ).value = "通信切断イベント受信";
		// document.getElementById( "dispMsg" ).value = "";
	};
}

function clearChoiceButtons() {
	let target = document.getElementById("choice_buttons_panel");
	while(target.firstChild){
		target.removeChild(target.firstChild);
	}
}
function fadeOutChoiceButtons() {
	let target = document.getElementById("choice_buttons_panel");
	for (var i = 0; i < target.children.length; i++) {
		console.log(target.children[i]);
		target.children[i].classList.add('is-hide');
		// target.children[i].firstChild.disabled = true;
	}
}

function createChoiceButton(choice_text, choice_index) {
	var div = document.createElement('div');
	div.className = 'choice_button';
	var div_text = document.createElement('div');
	div_text.className = 'choice_button_text';
	// div_text.innerHTML = "hjge";

	// let button = document.createElement("button");
	// button.innerHTML = choice_text;
	// button.id = "choice_button_" + choice_index;

	let button = document.createElement("a");
	// button.className = 'btn btn--orange';
	button.className = 'choice_button_text';
	button.innerHTML = choice_text;
	button.id = "choice_button_" + choice_index;

	let target = document.getElementById("choice_buttons_panel");
	div.addEventListener("click", onButtonClicked);
	// button.classList.toggle('is-show');

	div.appendChild(button);
	// div_text.appendChild(button);
	target.appendChild(div);
	// button.classList.add('is-show');
}

function onButtonClicked(e) {
	console.log(e.target.id);

	let choice_index = parseInt(e.target.id.replace("choice_button_", ""), 10);
	let returnCommandData = {op: 'selected', selected: choice_index};
	let returnCommand = JSON.stringify(returnCommandData);
	console.log(returnCommand);
	connection.send(returnCommand);
	// clearChoiceButtons();
	fadeOutChoiceButtons();
	// e.target.classList.add('is-hide');
}


function onClicked(){
	connection.send('サンプルデータ');
}

window.addEventListener('load', function () {
	connectToIshiki();

	createChoiceButton("hoge0", 0);
	createChoiceButton("hoge1", 1);
	createChoiceButton("hoge2", 2);
});