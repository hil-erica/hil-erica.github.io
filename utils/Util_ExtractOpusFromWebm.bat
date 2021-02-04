::drag and drop downloaded webm files

setlocal enabledelayedexpansion

::change current directory to this bat file location
cd /d %~d0%~p0



for %%a in (%*) do (
 set inputfile=%%a
 call FileUtils_getFileName.bat !inputfile!
 set inputfileName=!RESULT_FILENAME!
 set Outputfile= .\!inputfileName!.opus
 ffmpeg.exe -i !inputfile! -vn -acodec copy !outputfile!
)

::pause