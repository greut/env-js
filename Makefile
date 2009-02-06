
ENV = src/env.js
TEST = test/test.js

CLASSPATH = xalan/xercesImpl.jar:xalan/xml-apis.jar:xalan/xalan.jar:rhino/js.jar
JAR = java -cp ${CLASSPATH} org.mozilla.javascript.tools.shell.Main

test-rhino:
	@@${JAR} ${TEST}

run-rhino:
	echo "load('src/env.js');window.location='test/index.html';" | ${JAR}
