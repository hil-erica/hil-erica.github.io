::drag and drop downloaded webm files

setlocal enabledelayedexpansion

::change current directory to this bat file location
cd /d %~d0%~p0



for %%a in (%*) do (
 set inputfile=%%a
 call FileUtils_getFileName.bat !inputfile!
 set inputfileName=!RESULT_FILENAME!
 set Outputfile= .\!inputfileName!_clean.mp4
 ffmpeg.exe -i !inputfile! -vcodec copy -acodec copy !outputfile!
)

::pause