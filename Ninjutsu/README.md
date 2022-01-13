# 忍術シリーズの概要
WebRTCツールSkyWayを使ってアバタの遠隔操作を行うサイト

https://webrtc.ecl.ntt.com/

サポートしているのはChromeのみ(Windows, Android)

## ブラウザの設定
### SSL認証の設定
WebsocketやChat Historyを開く際SSL認証が必要になるのでChromeの起動オプションで--ignore-certificate-errorsをつけると警告が出なくて楽

---batファイル例---

start "C:\Program Files\Google\Chrome\Application\chrome.exe" "https://hil-erica.github.io/Ninjutsu/kagebunshin.html?skywaykey=***&&myuserid=hoge&remoteuserid=foo&capturesize=720&autowebsockconnect=true&websocketurl=wss://127.0.0.1:8000&teleopemode=true"  --ignore-certificate-errors

またはChromeの設定で

chrome://flags/#allow-insecure-localhost

を有効にする

### websocketでROSに動画をPublishする場合の設定
MediaStreamTrackProcessorを使用するために（Chrome 88以降で、次のフラグを有効にする必要がある）

chrome://flags/#enable-experimental-web-platform-features

### Firefox
Firefoxではアドレスバーに about:config とうち，media.setsinkid.enabled をtrueにすること（じゃないとSpeakerデバイスにアクセスできない）

## 影分身
### 使い方
https://hil-erica.github.io/Ninjutsu/kagebunshin.html?apikey=***&myuserid=erica&remoteuserid=ericaope&capturesize=720

- myuserid : 自身のID
- remoteuserid : 相手のID，';'区切りで複数可
- capturesize : 自身のカメラのキャプチャサイズ　720/1080
- apikey : SkyWay API Key
- teleopemode : true/false, trueだと映像のクリックイベントが転送される，デフォルトではfalse，false時はメディアのコントロールができる
- micdelay : float，送信する音声を遅延させるパラメータ，主にLipSyncさせるため．0で遅延なし
- videomutemode : true/false, trueだと映像のトラック数をCallする側に合わせるようにするため，Call側が自分の映像トラックを０にすれば映像のやり取りは生じない
- websocketurl : websocket url
- autowebsockconnect : true/false
- ~~speechhistoryurl : リアルタイム対話コンソールを表示する~~
- externalwebsiteurl : 外部サイトを表示する
- answerrequest : requestコマンドを表示するかどうか
- roswebsocketurl : ROS websocket url
- rosframeid : ros mjpeg header
- sendvideo2ros : true/false
- autorosconnect : true/false
- vcodec: video codec option = VP8, VP9, H264, default=VP9

### datachannelについて

#### ブラウザからの送信

##### 一般ジェスチャ
###### 種類
nodding, greeting
###### プロトコル
"{"peerid": "bar", "playgesture": {"gesture":"nodding"}}"

##### ハンドジェスチャの種類
handgesture, pointing, handshake，handraise

##### 映像のダブルクリックイベント
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

#### ~~websocketデータのトンネリングプロトコル~~
~~"socket="をヘッダーに利用~~
#### chatデータ
"chat="をヘッダーに利用
#### TTSプロトコル
"tts="をヘッダーに利用 （例）"tts={"tts":"セリフ"}"


#### その他
##### 強制退出させるコマンド
誰かがログインしっぱなしで別のユーザが入れない場合現在のログインユーザをログアウトさせるコマンド

forcelogout=peerid

をチャットで送りつける

##### Sayに"debug="をつけるとコマンド受信と同じ処理をする

#### ブラウザへの送信

##### drawoncanvas　遠隔地映像にタッチエリアを表示する
- 送信コマンド drawoncanvas=json
  - user : だれの画面の設定か
  - points : 画面に表示される円のリスト
   - label : なんのタッチエリアかの説明文，円の中心の表示される，必須ではない
   - type : human/object，人か物かで表示の色が変わる
   - trackID : userのどのvideo trackかを指定する
   - xRatio : videoの横向きの相対座標（原点は左上）
   - yRatio :videoの縦向きの相対座標（原点は左上）
   - radiusRation : 半径
   
  drawoncanvas={"user":"erica", "points":[{"xRatio":0.84375,"yRatio":0.7453703703703703,"radiusRatio":0.4166666666666667, "trackID":0, "label":"","type":"human"}, {"xRatio":0.4817708333333333,"yRatio":0.2962962962962963,"radiusRatio":0.4166666666666667, "trackID":0, "label":"","type":"human"}, {"xRatio":0.18229166666666666,"yRatio":0.8287037037037037,"radiusRatio":0.4166666666666667, "trackID":0, "label":"","type":"human"}, {"xRatio":0.296875,"yRatio":0.6157407407407407,"radiusRatio":0.2604166666666667, "trackID":1, "label":"desk","type":"object"}]}


##### request システムから操作者に遠隔操作を要求する
###### 選択リクエスト
- 送信コマンド request=json
  - description : モーダルのタイトル表示，何を選ぶかの指示を書く
  - timeout : 選択するまでのタイムアウト，負の数または未設定でタイムアウトなし[sec]
  - selectobjs : 選択候補リスト
   - id : 選択された際のid
   - type : button/input, デフォルトはボタン
   - label : ボタンに表示する内容
   - description : ボタン横の詳細内容
    - infolevel : primary, secondary, success, danger, warning, info　でボタンの色が変わる，デフォルトはinfo
  
    request={"timeout":-1,"description":"全体説明選んでねとか選択してね","selectobjs":[{"id":"hoge.seq","type":"button","label":"hogeだよ","infolevel":"primary","description":"詳細説明"},{"id":"foo.seq","type":"input","label":"fooだよ","description":"詳細説明"}]}


- 受信コマンド
  - 正常に選択された場合 : answerrequest={"selectdata":"selected selectobj id"}
  - タイムアウトまたは選択拒否された場合 : cancelrequest
  
  answerrequest={"selectdata":"hoge.seq"}


###### 入力リクエスト
- 送信コマンド request=json
  - description : モーダルのタイトル表示，何を選ぶかの指示を書く
  - timeout : 選択するまでのタイムアウト，負の数または未設定でタイムアウトなし[sec]
  - selectobjs : 選択候補リスト
   - id : 格納する変数名
   - description : 入力内容の説明
   - type : string/int/float, 変数の型チェック（未実装）
   - necessary : true/false, 必須項目かどうか（未実装）
   
   request={"timeout":10,"description":"相手の名前をひらがなで入力してください","inputobjs":[{"id":"姓","type":"string","description":"相手の名字ををひらがなで入力","necessary":true},{"id":"名","type":"string","description":"相手の名前をひらがなで入力","necessary":false}]}

- 受信コマンド
  - 正常に入力された場合 : answerrequest={"answerdata":[]}
  - タイムアウトまたは選択拒否された場合 : cancelrequest
  
  answerrequest={"answerdata":[{"姓":"さとう"},{"名":"ひろのぶ"}]}
