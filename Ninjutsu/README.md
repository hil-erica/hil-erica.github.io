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
- streaming2local : true/false, getDevicesで映像音声をローカルにストリーミングするかどうかオプション，デフォルトではfalse
- streamingwebsocketurl : 映像音声をローカルにストリーミングするホスト名，ポートは順々に埋められる
- ~~roswebsocketurl : ROS websocket url~~
- ~~rosframeid : ros mjpeg header~~
- ~~sendvideo2ros : true/false~~
- ~~autorosconnect : true/false~~
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
  "buttonelementsample": {
    "id": "buttonsample",
    "label": "表示されるテキスト",
    "type": "workingmemory",
    "scope": "interaction/robot/human",
    "name": "変数名",
    "string": "値はstring/int/double/booleanどれか",
    "int": 1,
    "double": -1.5,
    "boolean": true
  }
  
（例：Jsonファイル）
{"buttons":[{"id":"dooropen","label":"解錠"},{"id":"sayhello","label":"こんにちは""}]}


（例：送信コマンド）
otpionalcommand={"id":"dooropen","label":"解錠"}

現在サポート中
type
- type:"tts"
  - text:"セリフ"
  - 例：
- type:"workingmemory" 
  - scope:スコープで以下の3種類 INTERACTION, HUMAN, ROBOT
  - name:変数名
  - int:整数の場合
  - double:浮動小数の場合
  - boolean:TRUE/FALSEの場合
  - string:文字の場合
  - 例
    - {"id":"teleoperation_start","label":"遠隔操作開始","type":"workingmemory","scope":"interaction","name":"teleoperation_start","string":"start"}
    - {"id":"gesture_byebye_back","label":"ばいばいして戻す","type":"workingmemory","scope":"robot","name":"miracle_gesture_option","string":"{\"id\":\"right_hand_byebye\", \"delay\":0};{\"id\":\"righthandbaseposition\", \"delay\":3000};"}
- type:"internalstate"
  - internalstatetype: emotion, mood, attractiveness
    - emotion: 自動でEmotionを変えるかどうか
      - autoemotion: true/false，autoemotionが含まれない場合は以下の数値を読みにいく
      - isrelative: true/false
      - arousal: double(-1~+1)
      - valence: double(-1~+1)
      - dominance: double(-1~+1)
      - duration: int(0~[msec])
    - mood: 非対応
    - attractiveness: 対象への興味度合い
      - isrelative: true/false
      - attractiveness: double(-1~+1)
      - duration: int(0~[msec]) 
  - 例： {"id":"attractiveness_increase","label":"興味度合い増加","type":"internalstate","internalstatetype":"attractiveness","isrelative":true,"attractiveness":0.2,"changeduration":500}


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
  
  例：drawoncanvas={"user":"erica", "points":[{"xRatio":0.84375,"yRatio":0.7453703703703703,"radiusRatio":0.4166666666666667, "trackID":0, "label":"","type":"human"}, {"xRatio":0.4817708333333333,"yRatio":0.2962962962962963,"radiusRatio":0.4166666666666667, "trackID":0, "label":"","type":"human"}, {"xRatio":0.18229166666666666,"yRatio":0.8287037037037037,"radiusRatio":0.4166666666666667, "trackID":0, "label":"","type":"human"}, {"xRatio":0.296875,"yRatio":0.6157407407407407,"radiusRatio":0.2604166666666667, "trackID":1, "label":"desk","type":"object", "behaviorlist":[{"id":"hoge.seq", "label":"say hellow"}, {"id":"foo.seq", "label":"bye bye"}, {"id":"bar.seq", "label":"hey wait!"}]}]}
  - user : だれの画面の設定か
  - points : 画面に表示される円のリスト
   - label : なんのタッチエリアかの説明文，円の中心の表示される，必須ではない
   - type : human/object，人か物かで表示の色が変わる
   - trackID : userのどのvideo trackかを指定する
   - xRatio : videoの横向きの相対座標（原点は左上）
   - yRatio :videoの縦向きの相対座標（原点は左上）
   - radiusRation : 半径
   - behaviorlist : []　UIに出す行動選択一覧のJsonArray，[{"id":"hoge.seq", "label":"say hellow"}, ...]
     - 操作者がボタンをクリックすると↓が返信
       
       {"peerid": "testope", "selectbehaivorevent": {"remotepeerid":"test3", "trackid":0, "pointid":"backcam-hid2", "behaviordata":foo.seq}}
       - peerid : 選択したユーザ
       - selectbehaivorevent : イベント名
       - remotepeerid : どのユーザの画面か
       - trackid : トラック番号
       - pointid : 選択エリアのID
       - behaviordata : 選択された内容
  


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


## 画面共有機能
### 注意点・問題点
- Javascriptの画面共有機能で動画をストリーミングするにはFPSが現状でないのでいまいち．代替庵として，OBSでとって仮想カメラで流したほうがきれいだがデスクトップ音声出力を相手に送れないの
  - 代替として，画面共有は2つ目のカメラとマイクを選ぶとか？ただし操作者PCにOBSやVoicemeeterBananaなど入れないといけないので面倒
- 画面共有の音も取る場合は人が逆の人がしゃべると徐々にミュートされる


## websocketで自他のメディアをストリーミングする場合の設定
映像をMediaRecorderで取得し，WebSocketでローカルにストリーミングし，さらにUDPでストリーミングする(SSLWebSocketUDPStreamer.jarを利用)
- ビデオコーデックH264を使う場合
  - Skywayの仕様上送受信される解像度が640*480になる
  - 自分の映像
  - Gstreamerを使用して受信する例) gst-launch-1.0 -v udpsrc port=20000 ! h264parse ! avdec_h264 ! videoconvert ! autovideosink sync=false
- ビデオコーデックVP9を使う場合
  - 自分の映像はH264のまま
  - ストリーミングを受信するアプリをストリーミング開始よりも先に立ち上げておかないとMediaRecorderで取得したトラック情報が取得できずデコードに失敗する可能性がある
  - Gstreamerを使用して受信する例）gst-launch-1.0 udpsrc port=20002 ! matroskademux name=demux demux.video_0 ! queue ! vp9parse ! vp9dec ! videoconvert ! videoscale ! autovideosink sync=false
- 問題点
  - 1つのVideoエレメントに複数のMediaRecorderを適応すると遠隔地の映像が乱れるため，ローカルにストリーミングと録画機能を併用する際1メディアに対す複数のMediaRecorderを起動するのは危険．録画されるWebm形式の動画ではEBML形式でヘッダーがかかれておりそれがないとVLCでも再生できない．ヘッダーだけ抽出して必要な動画部分だけBlobで保存してもメディアの圧縮された各データにはTimecodeが保存されておりMediaRecorderがスタートした時刻からの相対位置が保存されてしまう．そのためデータ容量的には必要な部分しか保存されてないが，再生してみるとMediaRecorderが開始した時刻からずっと録画されている時間シークになる．そのため，先にストリーミングが始まっていた場合は，いったんMediaRecorderを止め，新たにMediaRecorderをスタートする方式にした．しかし，途中でMediaRecorderを止めるとVP9をパースしていたGstreamerが落ちる．また，VP9をパースするにはGstreamerでもWebmのヘッダーが必要となりそれが抜けてもエラーで落ちる．GstreamerのためにMediaRecorderで取得したヘッダーからすべてのデータを送信することもできるがUDPのため順序が入れ替わったりする恐れがありパースに失敗する．
- 解決策・対処
  - VP9を使わずH264なら問題ない，途中からでもパースできる（Gstreamerのvp9parserがが完全じゃないのかな？まあBadpackageだし）
  - ROSがわのGstreamerも落ちたら自動再起動にしてほしい
  - MediaRecorderをRTPプロトコルに変換→そんな面倒なことしてられん
  - すべていったんローカルにストリーミングしてそこでいい感じに録画とUDPStreamingに割り振ってくれればいい→WebSocketBrdgeをGstreamer？を入れてよくする


### websocketでROSに動画をPublishする場合の設定
ROSには従来Canvas描画ビットマップを取得してCanvasにDrawImageしJpegとして取得しWebSocketでMJpegとして送信していたが，DrawImage関数でメモリリークが起きるかつ，コマごとに描画するのでブラウザが重くなるため廃止

~~MediaStreamTrackProcessorを使用するために（Chrome 88以降で、次のフラグを有効にする必要がある）
chrome://flags/#enable-experimental-web-platform-features~~
