<準備>
ffmpegをダウンロードしMediaRecorderUtilsディレクトリにおく
https://ffmpeg.org/download.html

<機能・使い方>

・Util_AddDurationInfoToWebm.bat，Util_AddDurationInfoToMp4.bat
空道電話で録画した動画・音声にはduration情報が抜けているので再生した際にシークができない．再エンコーディングせずにメディアにduration情報を付加するスクリプト．
メディアファイルをUtil_AddDurationInfoTo***.batにドラッグ・アンド・ドロップすればOK，ただし拡張子があっている方を選ぶこと．
ファイルは一度に複数選択してドラッグ・アンド・ドロップできる．

・Util_ExtractOpusFromWebm.bat
空道電話では音声のみ録音もwebm形式で保存してしまうので，音声opusのみを抽出するスクリプト．
メディアファイルをUtil_ExtractOpusFromWebm.batにドラッグ・アンド・ドロップすればOK．
ファイルは一度に複数選択してドラッグ・アンド・ドロップできる．