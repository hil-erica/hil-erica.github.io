
var previousUpdateTimestamp = '';
var previousQuestionIDList = '';
var doUpdate = false;

var connection;

function test(){

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
	};

	//切断
	connection.onclose = function() {
		document.getElementById( "eventType" ).value = "通信切断イベント受信";
		document.getElementById( "dispMsg" ).value = "";
	};
}


function onClicked(){
	connection.send('サンプルデータ');
}

// ページの一部だけをreloadする方法
// Ajaxを使う方法
// XMLHttpRequestを使ってAjaxで更新
function ajaxUpdate(url, element) {
	//var dt = new Date();
	// urlを加工し、キャッシュされないurlにする。
	url = url + '?ver=' + new Date().getTime();

	// ajaxオブジェクト生成
	var ajax = new XMLHttpRequest;

	// ajax通信open
	ajax.open('GET', url, true);

	// ajax返信時の処理
	ajax.onload = function () {
		// ajax返信から得たHTMLでDOM要素を更新
		element.innerHTML = ajax.responseText;
	};

	// ajax開始
	ajax.send(null);
}

function getUpdateTiming() {
	// var url = "get_special_state_questions.php";
	var url = "get_experiment_state_updated_timestamp.php";
	url = url + '?ver=' + new Date().getTime();

	var ajax = new XMLHttpRequest;
	ajax.open('GET', url, true);
	ajax.onload = function () {
		// console.log(ajax.responseText);
		if(ajax.responseText !== previousUpdateTimestamp){
			previousUpdateTimestamp = ajax.responseText;
			doUpdate = true;
		}
		else
			doUpdate = false;
	};
	ajax.send(null);
}

function update(url, element){
	console.log("update");
	ajaxUpdate(url, element);
	setTimeout(function(){
		//console.log("hoge");
		window.scroll(0, document.documentElement.scrollHeight);
	}, 500);
	// window.scroll(0, document.documentElement.scrollHeight);
}

window.addEventListener('load', function () {
	// var url = "question_visualizer_ajax_reload.php";

	// var div = document.getElementById('ajaxreload');

	// // getUpdateTiming();
	// // update(url, div);

	// setInterval(function(){
	// 	getUpdateTiming();
	// 	// console.log(doUpdate);
	// 	if(doUpdate)
	// 		update(url, div);
	// }, 300);

	test();
});