@REM this builds the soundmanager 2 SWF from source
@REM using mxmlc from the Adobe Flex SDK

bin\mxmlc -use-network=true -o ../elements/audio/soundmanager2_flash9.swf -file-specs ../elements/audio/resources/SoundManager2_AS3.as
