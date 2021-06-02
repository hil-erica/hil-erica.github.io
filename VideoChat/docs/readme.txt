https://***/SoraMichiChat_MultiP2P.html?myPeerID=hoge&remotePeerID=bar;foo;&viewersize=VGA
myPeerID = ;
remotePeerID = ;
viewersize = 144/240/360/720/1080
capturesize = 720/1080



<chromeでカメラのパラメータ一覧を得る>
chrome://media-internals/
映像は16:9のアス比を仮定している
144p → 256×144 のピクセルで表示される動画
240p → 427×240
360p → 640×360
480p → 720×480（DVDと同等な画面解像度）
720p → 1280×720（ハイビジョン画質 = HD）
1080p → 1920×1080（フルハイビジョン画質 = フルHD）
1440p → 2560×1440
2160p → 3840×2160（4K）


datachannnel example
<ダブルクリックイベントは連続して300msecのタイミングを検知したら Ratioは縦横の比率なので従来のサイズがわからなくてもいいかな>
{"peerid": "hoge", "clickevent": {"objectname":"remote_camera_video_bar_0", "x":572.6666870117188, "y": 273.0625305175781,"xRatio":0.8947916984558105, "yRatio": 0.7585070292154948}}
{"peerid": "hoge", "dblclickevent": {"objectname":"remote_camera_video_bar_0", "x":572.6666870117188, "y": 273.0625305175781,"xRatio":0.8947916984558105, "yRatio": 0.7585070292154948}}


optinal commandsで使える記号は_のみ

