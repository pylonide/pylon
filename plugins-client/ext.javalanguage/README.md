# Cloud9 IDE Java Language Features

## Installation

1- Install sun java 1.6 on your machine

2- install ant to build dependency projects from java source code

3- Build the java debug project:

    $ cd node_modules/lib-javadebug && npm install && ant

You may want to change the log file location in bin/log4j.properties instead of log/cloud9-java-debug.log to somewhere else

4- Run the java debug daemon

    $ java -cp bin/:lib/commons-logging-1.1.1.jar:lib/log4j-1.2.16.jar:lib/tools.jar com.cloud9ide.debug.daemon.Cloud9Daemon

The debug is now ready for cloud9 debug connections

5- Build the jvm-run sub projects:

    $ cd node_modules/jvm-run && && ant

5- Download eclipse hellios sr2 for your platform and extract it somewhere

6-

    $ cd node_modules/jvm_features && npm install

7- Initial build and run for the eclipse plugin:

a- Start eclipse into any workspace

b- select File -> Import -> Existing project into workspace

c- Select the project: cloud9/node_modules/jvm_features

d- Wait few seconds for eclipse to import the project (no compile errors should be found)

e- Click Run as -> Eclipse application

f- you should see:

    >>> STARTED

8- Open the init config file is: cloud9/node_modules/jvm_features/js/lib/eclipse/config.js and change paths according to your eclipse installation

a- Change the path of the equinox launcher jar to your eclipse installation equivalent:
${eclipse-installation-path}\plugins\org.eclipse.equinox.launcher_${version}${qualifier}.jar

b- Change the -configuration and -dev attributes according to your last (in or outside eclipse) values

--> for me from inside eclipse, it was:

-configuration file:/Users/eweda/workspace/eclipse-workspace/.metadata/.plugins/org.eclipse.pde.core/CodeCompletePlugin.Cloud9Eclipse/ -dev file:/Users/eweda/workspace/eclipse-workspace/.metadata/.plugins/org.eclipse.pde.core/CodeCompletePlugin.Cloud9Eclipse/dev.properties

Now, the full java stack SHOULD BE ready for testing :)

## Totally headless installaton (production environment) (NOT WORKING YET)

Replace step 7 with

7-

a- build the plugin jar file

    $ java -jar ${eclipse-installation-path}\plugins\org.eclipse.equinox.launcher_${version}${qualifier}.jar -application org.eclipse.ant.core.antRunner -buildfile ${cloud9 absolute path}/node_modules/jvm_features/build.xml

For me it was:

    $ java -jar /media/DATA/COLLEGE/IDEs/eclipse-linux-jee-helios-SR2/plugins/org.eclipse.equinox.launcher_1.1.1.R36x_v20101122_1400.jar -application org.eclipse.ant.core.antRunner -buildfile /home/eweda/cloud9/node_modules/jvm_features/build.xml

Ref: [Eclipse plugin headless build](http://eclipse.dzone.com/articles/headless-build-beginners-part)

b- Copy CodeComplePlugin...jar to ${eclipse-path}/plugins/


## More files to care about
* cloud9/node_modules/jvm-run/build-tools/templates/j2ee-template/build.xml --> absoulte jetty location
* cloud9/node_modules/jvm_features/js/lib/eclipse/config.js --> init command tweaking

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