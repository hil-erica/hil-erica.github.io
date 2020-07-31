# 空道電話の概要
WebRTCツールSkyWayを使ってビデオチャットを行うサイト
https://webrtc.ecl.ntt.com/

## 使い方
https://hil-erica.github.io/SoraMichiChat_MultiP2P.html
1. devicesタブの'get devices'ボタンをクリックし自身のカメラとオーディオデバイスを取得
2. communicationタブに移り自身のIDを入力し 'go to standby'ボダンをクリック
3. 'add remote'ボタンをクリックし通話したい相手を入力し'call'ボタンで接続する

### デフォルトのパラメータを指定
https://hil-erica.github.io/SoraMichiChat_MultiP2P.html?myPeerID=hoge&remotePeerID=foo;bar;&viewersize=240&capturesize=720
- myPeerID : 自身のID
- remotePeerID : 相手のID，';'区切りで複数可
- viewersize : 相手の映像のデフォルトサイズ　144/240/360/720/1080
- capturesize : 自身のカメラのキャプチャサイズ　720/1080

## datachannelについて
### 映像のダブルクリックイベント
<ダブルクリックイベントは連続して300msecのタイミングを検知したら Ratioは縦横の比率なので従来のサイズがわからなくてもいいかな>  
#### プロトコルサンプル
{"peerid": "hoge", "clickevent": {"objectname":"remote_camera_video_bar_0", "x":572.6666870117188, "y": 273.0625305175781,"xRatio":0.8947916984558105, "yRatio": 0.7585070292154948}}  
{"peerid": "hoge", "dblclickevent": {"objectname":"remote_camera_video_bar_0", "x":572.6666870117188, "y": 273.0625305175781,"xRatio":0.8947916984558105, "yRatio": 0.7585070292154948}}  

## カメラについて
### <chromeでカメラのパラメータ一覧を得る>
chrome://media-internals/  
映像は16:9のアス比を仮定している
### 解像度一覧
- 144p → 256×144 のピクセルで表示される動画
- 240p → 427×240
- 360p → 640×360
- 480p → 720×480（DVDと同等な画面解像度）
- 720p → 1280×720（ハイビジョン画質 = HD）
- 1080p → 1920×1080（フルハイビジョン画質 = フルHD）
- 1440p → 2560×1440
- 2160p → 3840×2160（4K）


