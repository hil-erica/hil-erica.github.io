# 空道電話の概要
WebRTCツールSkyWayを使ってビデオチャットを行うサイト

https://webrtc.ecl.ntt.com/

サポートしているのはChromeのみ
その他ブラウザではスピーカーデバイスを取得できない（改良すればできる）

## 使い方
https://hil-erica.github.io/SoraMichiChat_MultiP2P.html
1. devicesタブの'get devices'ボタンをクリックし自身のカメラとオーディオデバイスを取得  
   使わないVideoのチェックを外す
2. communicationタブに移り自身のIDを入力し 'go to standby'ボダンをクリック
3. 'add remote'ボタンをクリックし通話したい相手を入力し'call'ボタンで接続する

### デフォルトのパラメータを指定
https://hil-erica.github.io/SoraMichiChat_MultiP2P.html?myPeerID=hoge&remotePeerID=foo;bar;&viewersize=240&capturesize=720
- myPeerID : 自身のID
- remotePeerID : 相手のID，';'区切りで複数可
- viewersize : 相手の映像のデフォルトサイズ　144/240/360/720/1080
- capturesize : 自身のカメラのキャプチャサイズ　720/1080
- skywaykey : SkyWay API Key
- teleopemode : true/false, trueだと映像のクリックイベントが転送される，デフォルトではfalse，false時はメディアのコントロールができる

### 複数映像をおくる際の注意点
- 映像のトラック数はCallする側に決定権があるため送信する映像トラックが多いほうがCallすること  
少ないほうがCallすると少ない方に合わせた映像トラック数になる
- 映像を送らず音声のみは非対応

## datachannelについて
### 映像のダブルクリックイベント
<ダブルクリックイベントは連続して300msecのタイミングを検知したら Ratioは縦横の比率なので従来のサイズがわからなくてもいいかな>  
#### プロトコルサンプル
{"peerid": "bar", "clickevent": {"remotepeerid":"hoge", "trackid":0, "x":614, "y": 27.75,"xRatio":0.959375, "yRatio": 0.07708333333333334}}  
{"peerid": "bar", "dblclickevent": {"remotepeerid":"hoge", "trackid":0,"x":614, "y": 27.75,"xRatio":0.959375, "yRatio": 0.07708333333333334}}  

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

## スピーカーについて
### 選択したスピーカーから音が出ない
HTMLMediaElement.sinkId関数を使い音声出力デバイスを変更しているが2021/01/18現在Chromeでもサポートしていない
Windowsの場合は設定→サウンド→サウンドの詳細オプション→アプリの音量とデバイスの設定→Chromeでアプリごとにスピーカーを選択することができる
