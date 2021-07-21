# 忍者シリーズの概要
WebRTCツールSkyWayを使ってアバタの遠隔操作を行うサイト

https://webrtc.ecl.ntt.com/

サポートしているのはChromeのみ(Windows, Android)

Firefoxではアドレスバーに about:config とうち，media.setsinkid.enabled をtrueにすること（じゃないとSpeakerデバイスにアクセスできない）

## 忍者
### 使い方
https://hil-erica.github.io/Ninja/ninja.html?apikey=***&myPeerID=erica&remoteuserid=ericaope&capturesize=720

- myPeerID : 自身のID
- remoteuserid : 相手のID，';'区切りで複数可
- capturesize : 自身のカメラのキャプチャサイズ　720/1080
- apikey : SkyWay API Key
- teleopemode : true/false, trueだと映像のクリックイベントが転送される，デフォルトではfalse，false時はメディアのコントロールができる
- micdelay : float，送信する音声を遅延させるパラメータ，主にLipSyncさせるため．0で遅延なし
- videomutemode : true/false, trueだと映像のトラック数をCallする側に合わせるようにするため，Call側が自分の映像トラックを０にすれば映像のやり取りは生じない

### datachannelについて

#### ジェスチャ

##### 一般ジェスチャ
###### 種類
nodding, greeting
###### プロトコル
"{"peerid": "bar", "playgesture": {"gesture":"nodding"}}"

##### ハンドジェスチャ 
###### ハンドジェスチャの種類
handgesture, pointing, handshake
###### 映像のダブルクリックイベント
<ダブルクリックイベントは連続して300msecのタイミングを検知したら Ratioは縦横の比率なので従来のサイズがわからなくてもいいかな>  
###### プロトコルサンプル
{"peerid": "bar", "clickevent": {"remotepeerid":"hoge", "trackid":0, "x":614, "y": 27.75,"xRatio":0.959375, "yRatio": 0.07708333333333334, "hand": "pointing"}}  
{"peerid": "bar", "dblclickevent": {"remotepeerid":"hoge", "trackid":0,"x":614, "y": 27.75,"xRatio":0.959375, "yRatio": 0.07708333333333334, "hand": "pointing"}}  
###### アナログジェスチャプトロコル
左右ごとに以下のコマンド，動き始めと動き中と終わりがある

{"peerid": "ericaope", "rightHandAnalogGestureStart": {"xratio":0.5890736342042755, "yratio": 0.46096654275092935, "hand": "pointing"}}

{"peerid": "ericaope", "rightHandAnalogGestureMove": {"xratio":0.5866983372921615, "yratio": 0.5408921933085502, "hand": "pointing"}}

・・・

{"peerid": "ericaope", "rightHandAnalogGestureMove": {"xratio":0.5843230403800475, "yratio": 0.5446096654275093, "hand": "pointing"}}

{"peerid": "ericaope", "rightHandAnalogGestureEnd": {"hand": "pointing"}}

#### Jsonによるコマンドボタンの追加
jsonファイルにはJson配列buttonsを定義し，buttonsの要素は必ずidとlabelを持つこと．

このボタンがクリックされると"otpionalcommand=buttons要素のjson"がpublishされる．

（例：Jsonファイル）
{"buttons":[{"id":"dooropen","label":"解錠"},{"id":"sayhello","label":"こんにちは""}]}

（例：送信コマンド）
otpionalcommand={"id":"dooropen","label":"解錠"}

#### websocketデータのトンネリングプロトコル
"socket="をヘッダーに利用
#### chatデータのトンネリングプロトコル
"chat="をヘッダーに利用
#### TTSプロトコル
"tts="をヘッダーに利用 （例）"tts={"tts":"セリフ"}"


### その他
#### 強制退出させるコマンド
誰かがログインしっぱなしで別のユーザが入れない場合現在のログインユーザをログアウトさせるコマンド

forcelogout=peerid

をチャットで送りつける
