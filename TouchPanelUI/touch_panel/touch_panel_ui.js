var connection;

var current_language = 'jp';
var description_jp;
var choices_jp;
var description_en;
var choices_en;

/*
	ISHIKIのWebSocketサーバに接続
*/
function connectToIshiki(){
	// console.log("hogehoghoe");

	//WebSocket接続
	connection = new WebSocket("ws://localhost:8800/");

	//接続通知
	connection.onopen = function(event) {
		// document.getElementById( "eventType" ).value = "通信接続イベント受信";
		// document.getElementById( "dispMsg" ).value = event.data;
		console.log("connected");
	};

	//エラー発生
	connection.onerror = function(error) {
		// document.getElementById( "eventType" ).value = "エラー発生イベント受信";
		// document.getElementById( "dispMsg" ).value = error.data;
	};

	//メッセージ受信
	// connection.onmessage = function(event) {
	// 	// document.getElementById( "eventType" ).value = "メッセージ受信";
	// 	// document.getElementById( "received" ).value = event.data;
	// };
	connection.onmessage = processReceivedMessage;

	//切断
	connection.onclose = function() {
		// document.getElementById( "eventType" ).value = "通信切断イベント受信";
		// document.getElementById( "dispMsg" ).value = "";
	};
}


function processReceivedMessage(event) {
	console.log("processReceivedMessage");
	const receivedCommand = JSON.parse(event.data);
	console.log(receivedCommand.op);
	console.log(receivedCommand.choices);
	console.log(receivedCommand.description);
	console.log(receivedCommand.choices_en);
	console.log(receivedCommand.description_en);

	if (receivedCommand.op == 'set_choices') {
		// description
		description_jp = receivedCommand.description;
		description_en = receivedCommand.description_en;

		clearDescriptionContent();
		if (receivedCommand.description !== undefined) {
			console.log("description not undefined");
			createDescriptionAndChoiceButtonsScreen();
			createDescriptionContent(description_jp);
		}
		else{
			createChoiceButtonsOnlyScreen();
		}

		// choices
		choices_jp = receivedCommand.choices;
		choices_en = receivedCommand.choices_en;
		clearChoiceButtons();
		for (var i = 0; i < receivedCommand.choices.length; i++) {
			let choice = receivedCommand.choices[i];
			console.log(choice);
			createChoiceButton(choice, i);
		}
	}

}

function toggleLanguage() {
	let target_description;
	let target_choices;
	if (current_language === 'jp') {
		current_language = 'en';
		target_description = description_en;
		target_choices = choices_en;
	}
	else if (current_language === 'en') {
		current_language = 'jp';
		target_description = description_jp;
		target_choices = choices_jp;
	}

	// description
	// description_jpがなければ説明文なしなので処理しない
	if (description_jp !== undefined) {
		if (target_description !== undefined) {
			let description_content = document.getElementById("description_content");
			description_content.innerHTML = target_description;
		}
	}

	// choices
	if (target_choices !== undefined) {
		for (var i = 0; i < target_choices.length; i++) {
			let choice = target_choices[i];
			let choice_button = document.getElementById("choice_button_" + i);
			choice_button.innerHTML = choice;
		}
	}
}


function clearDescriptionContent() {
	let target = document.getElementById("description_panel");
	while(target.firstChild){
		target.removeChild(target.firstChild);
	}
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

function createDescriptionContent(description) {
	var div = document.createElement('div');
	div.className = 'description_content';
	div.id = "description_content";
	div.innerHTML = description;

	// let text = document.createElement('div');
	// text.className = 'description_text';
	// text.innerHTML = description;

	// div.appendChild(text);
	let target = document.getElementById("description_panel");
	target.appendChild(div);
}
function createChoiceButton(choice_text, choice_index) {
	// var div = document.createElement('div');
	// div.className = 'choice_button';
	// div.id = "choice_button_" + choice_index;
	// var div_text = document.createElement('div');
	// div_text.className = 'choice_button_text';
	// div_text.innerHTML = "hjge";

	let button = document.createElement("a");
	// button.className = 'choice_button_text';
	button.className = 'choice_button';
	button.innerHTML = choice_text;
	button.id = "choice_button_" + choice_index;

	button.addEventListener("click", onButtonClicked);
	// button.classList.toggle('is-show');

	// div.appendChild(button);
	// div_text.appendChild(button);

	let target = document.getElementById("choice_buttons_panel");
	target.appendChild(button);
	// button.classList.add('is-show');
}

function onButtonClicked(e) {
	// console.log("e is : " + e.target.id);
	let choice_index = parseInt(e.target.id.replace("choice_button_", ""), 10);
	let returnCommandData = {op: 'selected', selected: choice_index};
	let returnCommand = JSON.stringify(returnCommandData);
	console.log(returnCommand);
	connection.send(returnCommand);
	// clearChoiceButtons();
	fadeOutChoiceButtons();
	// e.target.classList.add('is-hide');
	// createChoiceButtonsOnlyScreen();
}

function onLanguageButtonClicked(e) {
	toggleLanguage();
}

/*
	画面を説明と選択肢に分割
*/
function createDescriptionAndChoiceButtonsScreen() {
	let description_panel = document.getElementById("description_panel");
	description_panel.style.height = 'calc(100% / 3 - 0px)';
	let choice_buttons_panel = document.getElementById("choice_buttons_panel");
	choice_buttons_panel.style.height = 'calc(100% * 2 / 3 - 0px)';
}

/*
	画面を選択肢表示のみに
*/
function createChoiceButtonsOnlyScreen() {
	let description_panel = document.getElementById("description_panel");
	description_panel.style.height = '0%';
	let choice_buttons_panel = document.getElementById("choice_buttons_panel");
	choice_buttons_panel.style.height = '100%';
}


window.addEventListener('load', function () {
	let language_button = document.getElementById("language_button");
	language_button.addEventListener("click", onLanguageButtonClicked);

	connectToIshiki();

	createDescriptionContent("これはテスト説明です。");
	createChoiceButton("hoge0", 0);
	createChoiceButton("hoge1", 1);
	createChoiceButton("hoge2", 2);
	createChoiceButton("hoge3", 3);
	createDescriptionAndChoiceButtonsScreen();
	// createChoiceButtonsOnlyScreen();
});