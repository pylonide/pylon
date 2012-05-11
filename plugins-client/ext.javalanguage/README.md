# Cloud9 IDE Java Language Features

## Installation

1- Install sun java 1.6 on your machine

2- install ant to build the source code

3- Build the java debug project:

    $ cd support/lib-javadebug && npm install && ant

You may want to change the log file location in bin/log4j.properties instead of log/cloud9-java-debug.log to somewhere else

4- Run the java debug daemon

    $ java -cp bin/:lib/commons-logging-1.1.1.jar:lib/log4j-1.2.16.jar:lib/tools.jar com.cloud9ide.debug.daemon.Cloud9Daemon

The debug is now ready for cloud9 debug connections

5- Download eclipse hellios sr2 for your platform and extract it somewhere

6-

    $ cd support/jvm_features && npm install

7- Initial build and run for the eclipse plugin:

a- Start eclipse into any workspace

b- select File -> Import -> Existing project into workspace

c- Select the project: cloud9/support/jvm_features

d- Wait few seconds for eclipse to import the project (no compile errors should be found)

e- Click Run as -> Eclipse application

f- you should see:

    >>> STARTED

8- Open the init config file is: cloud9/support/jvm_features/js/lib/eclipse/config.js and change paths according to your eclipse installation

a- Change the path of the equinox launcher jar to your eclipse installation equivalent:
${eclipse-installation-path}\plugins\org.eclipse.equinox.launcher_${version}${qualifier}.jar

b- Change the -configuration folder to your ${cloud9 absolute path}/support/jvm_features/config/ and -dev file the same with appending dev.properties at the end.

For me, it was:

    $ java -Dosgi.requiredJavaVersion=1.5 -Xms200m -Xmx1024m -XX:MaxPermSize=512m -Dfile.encoding=UTF-8 -classpath /media/DATA/COLLEGE/IDEs/eclipse-linux-jee-helios-SR2/plugins/org.eclipse.equinox.launcher_1.1.1.R36x_v20101122_1400.jar org.eclipse.equinox.launcher.Main -application CodeCompletePlugin.Cloud9Eclipse -data ~/runtime-CodeCompletePlugin.Cloud9Eclipse -configuration file:/home/eweda/cloud9/support/jvm_features/config/ -dev file:/home/eweda/cloud9/support/jvm_features/config/dev.properties -nl en_US -consoleLog

9- test it with running

    $ java ${initCmd} with changing the ${data} to the workspace folder for the user's projects and remove the ${port} part

You should see:

    >>> STARTED

If you ever reach here, then the full java stack is now ready for testing :)

## Totally headless installaton (production environment) (NOT WORKING YET)

Replace step 7 with

7-

a- build the plugin jar file

    $ java -jar ${eclipse-installation-path}\plugins\org.eclipse.equinox.launcher_${version}${qualifier}.jar -application org.eclipse.ant.core.antRunner -buildfile ${cloud9 absolute path}/support/jvm_features/build.xml

For me it was:

    $ java -jar /media/DATA/COLLEGE/IDEs/eclipse-linux-jee-helios-SR2/plugins/org.eclipse.equinox.launcher_1.1.1.R36x_v20101122_1400.jar -application org.eclipse.ant.core.antRunner -buildfile /home/eweda/cloud9/support/jvm_features/build.xml

Ref: [Eclipse plugin headless build](http://eclipse.dzone.com/articles/headless-build-beginners-part)

b- Copy CodeComplePlugin...jar to ${eclipse-path}/plugins/


## More files with absolute paths
* cloud9/support/jvm-run/build-tools/StandAloneWebAppStarter/bin/web_apps.properties
* cloud9/support/jvm_features/src/com/.../CreateProjectCommand.java --> replace static jetty libraries location
* cloud9/support/jvm-run/build-tools/templates/j2ee-template/build.xml --> jetty location
* cloud9/server/cloud9/ext/jvm-features/jvm-features.js --> workspace location
* cloud9/support/jvm_features/js/lib/eclipse/config.js --> init command

## TODOs

* Subtypes hierarchy fix for binary types e.g. (List and Document)
* Restore analyze seamlessness in editing from previous revisions (without the new setInterval way)
* EclipseClient protocol exhaustive testing
* General: Substitute the user's workspace in the EclipseClient creation
* General: Inner classes --> features testing and fixing pass
* Refactor: figure out how to change the refactor import without highlighting it (maybe apply deltas)
* Refactor: changed files must be noted !! --> maybe need a tree reload action
* Better error handling in all features (including worker flows)
* Add something to base_handler to express how frequently a handler should be called
* Some handler methods needn't be called again if the file contents doesn't change (e.g. analyze)

## Major Remaining Tasks
* Call Hierarchy
* Stop continous file saving requests (collaboration feature may help here)