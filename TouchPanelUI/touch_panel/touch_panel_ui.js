var connection;

var current_language = 'jp';
var description_jp;
var choices_jp;
var description_en;
var choices_en;

var url;

const choice_buttons_panel_margin_height = 40;

/*
	入力ダイアログを表示して接続先urlを取得
*/
function getIshikiUrlFromUser(){
	const searchParams = new URLSearchParams(window.location.search)
	let host = 'localhost';
	if (searchParams.has('host')) {
		host = searchParams.get('host');
	}
	// 入力ダイアログを表示
	// url = window.prompt("ISHIKIサーバurlを指定してください", "ws://localhost:8800/");
	let url = window.prompt("ISHIKIサーバurlを指定してください", 'ws://' + host + ':8800/');
	return url;
}


/*
	ISHIKIのWebSocketサーバに接続
*/
function connectToIshiki(){
	// urlをユーザから取得
	url = getIshikiUrlFromUser();

	// 空の場合やキャンセルした場合
	if(url == null) {
		// window.alert('キャンセルされました');
		return;
	}

	//WebSocket接続
	connection = new WebSocket(url);

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
		window.alert('接続できませんでした');
		connectToIshiki();
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


/*
	ISHIKIからのメッセージパース
*/
function processReceivedMessage(event) {
	console.log("processReceivedMessage");
	const receivedCommand = JSON.parse(event.data);
	console.log(receivedCommand.op);
	console.log(receivedCommand.choices);
	console.log(receivedCommand.description);
	console.log(receivedCommand.choices_en);
	console.log(receivedCommand.description_en);

	// 全データをグローバルに入れておく
	description_jp = receivedCommand.description;
	description_en = receivedCommand.description_en;
	choices_jp = receivedCommand.choices;
	choices_en = receivedCommand.choices_en;

	// 現在の言語設定で使用するデータを選択
	if (current_language === 'jp') {
		target_description = description_jp;
		target_choices = choices_jp;
	}
	else if (current_language === 'en') {
		target_description = description_en;
		target_choices = choices_en;
	}

	// コマンドごとに処理
	if (receivedCommand.op == 'set_choices') {
		// description
		clearDescriptionContent();
		// そもそもdescriptionがなければ、選択肢だけ表示する
		if (receivedCommand.description !== undefined) {
			console.log("description not undefined");
			// createDescriptionAndChoiceButtonsScreen();
			createDescriptionContent(target_description);
		}
		else{
			createChoiceButtonsOnlyScreen();
		}

		// choices
		clearChoiceButtons();
		for (var i = 0; i < target_choices.length; i++) {
			let choice = target_choices[i];
			console.log(choice);
			createChoiceButton(choice, i);
		}
		createDescriptionAndChoiceButtonsScreen();
		adjustChoiceButtonsSize();
	}
	else if (receivedCommand.op == 'set_description') {
		clearDescriptionContent();
		createDescriptionOnlyScreen();
		createDescriptionContent(target_description);
	}
}

/*
	言語切替
*/
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


/*
	説明文オブジェクトを削除
*/
function clearDescriptionContent() {
	let target = document.getElementById("description_panel");
	while(target.firstChild){
		target.removeChild(target.firstChild);
	}
}
/*
	選択肢ボタンオブジェクトを削除
*/
function clearChoiceButtons() {
	let target = document.getElementById("choice_buttons_panel");
	while(target.firstChild){
		target.removeChild(target.firstChild);
	}
}

/*
	説明文オブジェクトをフェードアウト
*/
function fadeOutDescriptionContent() {
	let target = document.getElementById("description_panel");
	for (var i = 0; i < target.children.length; i++) {
		// console.log(target.children[i]);
		target.children[i].classList.add('is-hide');
		// target.children[i].firstChild.disabled = true;
	}
}
/*
	選択肢ボタンオブジェクトをフェードアウト
*/
function fadeOutChoiceButtons() {
	let target = document.getElementById("choice_buttons_panel");
	for (var i = 0; i < target.children.length; i++) {
		if (i == 0) {
			target.children[i].addEventListener('transitionend', () => {
				// アニメーション終了後にボタンを消す
				console.log("animation end");
				clearChoiceButtons();
			})
		}
		// console.log(target.children[i]);
		target.children[i].classList.add('is-hide');
		// target.children[i].firstChild.disabled = true;
	}
}

/*
	説明文オブジェクトを生成
*/
function createDescriptionContent(description) {
	var div = document.createElement('div');
	div.className = 'description_content';
	div.classList.add('fade_animation');
	div.id = "description_content";
	div.innerHTML = description;

	// let text = document.createElement('div');
	// text.className = 'description_text';
	// text.innerHTML = description;

	// div.appendChild(text);
	let target = document.getElementById("description_panel");
	target.appendChild(div);
}
/*
	選択肢ボタンオブジェクトを生成
*/
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
	button.classList.add('fade_animation');
	button.innerHTML = choice_text;
	button.id = "choice_button_" + choice_index;

	// button.addEventListener("click", onButtonClicked);
	// button.classList.toggle('is-show');

	// div.appendChild(button);
	// div_text.appendChild(button);
	button.addEventListener('animationend', () => {
		// アニメーション終了後にクリックイベントを追加する
		// console.log('animationend');
		button.addEventListener("click", onButtonClicked);
	})

	let target = document.getElementById("choice_buttons_panel");
	target.appendChild(button);
	// button.classList.add('is-show');
}


/*
	選択肢ボタンクリックイベント
*/
function onButtonClicked(e) {
	// console.log("e is : " + e.target);
	var target = e.target;
	if (target instanceof HTMLFontElement) {
		// console.log("e is : " + e.target.parentNode);
		target = target.parentNode;
	}
	let choice_index = parseInt(target.id.replace("choice_button_", ""), 10);
	let returnCommandData = {op: 'selected', selected: choice_index};
	let returnCommand = JSON.stringify(returnCommandData);
	console.log(returnCommand);
	connection.send(returnCommand);
	// clearChoiceButtons();
	fadeOutChoiceButtons();
	fadeOutDescriptionContent();
	// e.target.classList.add('is-hide');
	// createChoiceButtonsOnlyScreen();
}

/*
	言語ボタンクリックイベント
*/
function onLanguageButtonClicked(e) {
	toggleLanguage();
}


/*
	選択肢ボタンのサイズをボタンの数に応じて調整
*/
function adjustChoiceButtonsSize() {
	const target = document.getElementById("choice_buttons_panel");
	let row_num = getChoiceButtonsRawNum(target.children.length);
	let column_num = getChoiceButtonsColumnNum(target.children.length, row_num);
	console.log("row_num : " + row_num);
	console.log("column_num : " + column_num);
	for (let button of target.children) {
		console.log("button");
		button.style.width = `calc(100% / ${column_num} - 20px)`;
		button.style.height = `calc(100% / ${row_num} - 20px)`;
	}
}
/*
	選択肢ボタン配置の行の数を取得
*/
function getChoiceButtonsRawNum(choice_num) {
	if (choice_num <= 2) {
		return 1;
	}
	if (choice_num <= 8) {
		return 2;
	}
	return 3;
}
/*
	選択肢ボタン配置の列の数を取得
*/
function getChoiceButtonsColumnNum(choice_num, row_num) {
	if (choice_num == 1) {
		return 1;
	}
	let column_num = parseInt(choice_num / row_num);
	if (choice_num % 2 != 0) {
		column_num++;
	}
	return column_num;
}

/*
	画面を説明と選択肢に分割
*/
function createDescriptionAndChoiceButtonsScreen() {
	let description_panel = document.getElementById("description_panel");
	let choice_buttons_panel = document.getElementById("choice_buttons_panel");
	let choice_num = choice_buttons_panel.children.length;
	if (choice_num == 1) {
		description_panel.style.height = 'calc(100% * 2 / 3 - 0px)';
		// choice_buttons_panel.style.height = 'calc(100% / 3 - 0px)';
		choice_buttons_panel.style.height = `calc(100% / 3 - ${choice_buttons_panel_margin_height}px)`;
	}
	else if (choice_num < 6) {
		description_panel.style.height = '50%';
		// choice_buttons_panel.style.height = 'calc(50% - 0px)';
		choice_buttons_panel.style.height = `calc(50% - ${choice_buttons_panel_margin_height}px)`;
	}
	else {
		description_panel.style.height = 'calc(100% / 3 - 0px)';
		// choice_buttons_panel.style.height = 'calc(100% * 2 / 3 - 0px)';
		choice_buttons_panel.style.height = `calc(100% * 2 / 3 - ${choice_buttons_panel_margin_height}px)`;
	}
}
/*
	画面を説明表示のみに
*/
function createDescriptionOnlyScreen() {
	let description_panel = document.getElementById("description_panel");
	description_panel.style.height = '100%';
	clearChoiceButtons();
	let choice_buttons_panel = document.getElementById("choice_buttons_panel");
	choice_buttons_panel.style.height = '0%';
}
/*
	画面を選択肢表示のみに
*/
function createChoiceButtonsOnlyScreen() {
	clearDescriptionContent();
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
	createChoiceButton("こんにちは1", 1);
	createChoiceButton("hoge2", 2);
	createChoiceButton("hoge3", 3);
	// createChoiceButton("hoge4", 4);
	// createChoiceButton("hoge4", 4);

	adjustChoiceButtonsSize();
	
	// createDescriptionOnlyScreen();
	createDescriptionAndChoiceButtonsScreen();
	// createChoiceButtonsOnlyScreen();
});