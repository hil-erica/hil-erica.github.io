# 概要
本サイトがWebsocketでローカルアプリと通信する

# 設定
chrome://settings/content/microphoneで好きなマイクを入力に設定できる

# 使い方
Websocketのアドレスを入力後connectボタンをクリック

# 送信プロトコル
音声認識スタート　start

音声認識スタート　stop

スタートコマンドは一度送ればずっと音声認識する

# 受信プロトコル
音声認識スタート　startrecog:

音声認識途中結果　interimresult:

音声認識最終結果　result:

最終結果の信頼度　confidence:

[受信サンプル上から下に時系列]
startrecog:

interimresult:今日

interimresult:今日は

interimresult:今日は

result:こんにちは

confidence:0.8813719153404236

# TCPで通信したい場合
https://hil-erica.github.io/GoogleSpeechAPI/WebSocketBridge2.zip
からJavaのWebsocketとTCP通信にブリッジするアプリをダウンロード

TCPサーバにしたい場合はLauncher2-TCPServer.batを使う

TCPクライアントにしたい場合はLauncher2-TCPClinet.batを使う

TCPサーバとなり音声認識結果を送信する

port:8888

文字コードutf-8

フッターは改行コード

音声認識開始をしてからマイク入力があると途中結果を返しながら最終結果と信頼度を返すストリーミング形式
