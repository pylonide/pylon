@REM this builds the Swiff Uploader SWF from source
@REM using mxmlc from the Adobe Flex SDK

bin\mxmlc -static-link-runtime-shared-libraries=true -use-network=true -o ../elements/upload/Swiff.Uploader.swf -file-specs ../elements/upload/resources/Main.as
