
// Tests for equality any JavaScript type and structure without unexpected results.
// Discussions and reference: http://philrathe.com/articles/equiv
// Test suites: http://philrathe.com/tests/equiv
// Author: Philippe Rathé <prathe@gmail.com>
var equiv = function () {

	var innerEquiv; // the real equiv function
	var callers = []; // stack to decide between skip/abort functions

	// Determine what is o.
	function hoozit(o) {
		if (typeof o === "string") {
			return "string";

		} else if (typeof o === "boolean") {
			return "boolean";

		} else if (typeof o === "number") {

			if (isNaN(o)) {
				return "nan";
			} else {
				return "number";
			}

		} else if (typeof o === "undefined") {
			return "undefined";

		// consider: typeof null === object
		} else if (o === null) {
			return "null";

		// consider: typeof [] === object
		} else if (o instanceof Array) {
			return "array";
		
		// consider: typeof new Date() === object
		} else if (o instanceof Date) {
			return "date";

		// consider: /./ instanceof Object;
		//           /./ instanceof RegExp;
		//           typeof /./ === "function"; // => false in IE and Opera,
		//                                            true in FF and Safari
		} else if (o instanceof RegExp) {
			return "regexp";

		} else if (typeof o === "object") {
			return "object";

		} else if (o instanceof Function) {
			return "function";
		}
	}

	// Call the o related callback with the given arguments.
	function bindCallbacks(o, callbacks, args) {
		var prop = hoozit(o);
		if (prop) {
			if (hoozit(callbacks[prop]) === "function") {
				return callbacks[prop].apply(callbacks, args);
			} else {
				return callbacks[prop]; // or undefined
			}
		}
	}

	var callbacks = function () {

		// for string, boolean, number and null
		function useStrictEquality(b, a) {
			return a === b;
		}

		return {
			"string": useStrictEquality,
			"boolean": useStrictEquality,
			"number": useStrictEquality,
			"null": useStrictEquality,
			"undefined": useStrictEquality,

			"nan": function (b) {
				return isNaN(b);
			},

			"date": function (b, a) {
				return hoozit(b) === "date" && a.valueOf() === b.valueOf();
			},

			"regexp": function (b, a) {
				return hoozit(b) === "regexp" &&
					a.source === b.source && // the regex itself
					a.global === b.global && // and its modifers (gmi) ...
					a.ignoreCase === b.ignoreCase &&
					a.multiline === b.multiline;
			},

			// - skip when the property is a method of an instance (OOP)
			// - abort otherwise,
			//   initial === would have catch identical references anyway
			"function": function () {
				var caller = callers[callers.length - 1];
				return caller !== Object &&
						typeof caller !== "undefined";
			},

			"array": function (b, a) {
				var i;
				var len;

				// b could be an object literal here
				if ( ! (hoozit(b) === "array")) {
					return false;
				}

				len = a.length;
				if (len !== b.length) { // safe and faster
					return false;
				}
				for (i = 0; i < len; i++) {
					if( ! innerEquiv(a[i], b[i])) {
						return false;
					}
				}
				return true;
			},

			"object": function (b, a) {
				var i;
				var eq = true; // unless we can proove it
				var aProperties = [], bProperties = []; // collection of strings

				// comparing constructors is more strict than using instanceof
				if ( a.constructor !== b.constructor) {
					return false;
				}

				// stack constructor before traversing properties
				callers.push(a.constructor);

				for (i in a) { // be strict: don't ensures hasOwnProperty and go deep

					aProperties.push(i); // collect a's properties

					if ( ! innerEquiv(a[i], b[i])) {
						eq = false;
					}
				}

				callers.pop(); // unstack, we are done

				for (i in b) {
					bProperties.push(i); // collect b's properties
				}

				// Ensures identical properties name
				return eq && innerEquiv(aProperties.sort(), bProperties.sort());
			}
		};
	}();

	innerEquiv = function () { // can take multiple arguments
		var args = Array.prototype.slice.apply(arguments);
		if (args.length < 2) {
			return true; // end transition
		}

		return (function (a, b) {
			if (a === b) {
				return true; // catch the most you can

			} else if (typeof a !== typeof b || a === null || b === null || typeof a === "undefined" || typeof b === "undefined") {
				return false; // don't lose time with error prone cases

			} else {
				return bindCallbacks(a, callbacks, [b, a]);
			}

		// apply transition with (1..n) arguments
		})(args[0], args[1]) && arguments.callee.apply(this, args.splice(1, args.length -1));
	};

	return innerEquiv;
}(); // equiv

var same = equiv;

var config = {
	stats: {
		all: 0,
		bad: 0,
		modules: {}
	},
	queue: [],
	blocking: true,
	isLocal: true,
	defaultLifecycle: {
		setup: function() {},
		teardown: function() {}
	},
	moduleLifecycle: {}
};
window.isLocal = config.isLocal;

function synchronize(callback) {
	config.queue.push(callback);
	process();
}

function process() {
	while(config.queue.length && !config.blocking) {
		config.queue.shift()();
	}
}

function stop(timeout) {
	config.blocking = true;
	if(timeout)
		config.timeout = setTimeout(function() {
			ok(false, "Test timed out");
			start();
		}, timeout);
}

function start() {
	// A slight delay, to avoid any current callbacks
	setTimeout(function() {
		if(config.timeout)
			clearTimeout(config.timeout);
		config.blocking = false;
		process();
	}, 13);
}

function validTest( name ) {
	var i = config.filters.length,
		run = false;

	if( !i )
		return true;
	
	while( i-- ){
		var filter = config.filters[i],
			not = filter.charAt(0) == '!';
		if( not ) 
			filter = filter.slice(1);
		if( name.indexOf(filter) != -1 )
			return !not;
		if( not )
			run = true;
	}
	return run;
}

function test(name, fn){
	synchronize(function() {
		var fn =  "setup" in config.moduleLifecycle ? 
			config.moduleLifecycle.setup :
			config.defaultLifecycle.setup;
		config.expected = null;
		config.numTests = 0;
		
		echo ((config.currentModule ? "  " : "") + name + ":");
		try {
			fn();
		} catch(e) {
			log( false, "exception raised during setup: " + e );
		}
	});
	synchronize(function() {
		try {
			fn();
		} catch(e) {
			log( false, "exception raised: " + e );
		}
	});
	synchronize(function() {
			var fn =  "teardown" in config.moduleLifecycle ? 
			config.moduleLifecycle.teardown :
			config.defaultLifecycle.teardown;
		try {
			fn();
		} catch(e) {
			log( false, "exception raised during teardown: " + e );
		}
	});
	synchronize(function() {
		reset();
		
		if ( config.expected && config.expected != config.numTests )
			log( false, "Wrong number of tests run. " + config.numTests + " ran, expected " + config.expected );
	});
}

var orig = document.getElementById('main').innerHTML;

/**
 * Resets the test setup. Useful for tests that modify the DOM.
 */
function reset() {
	document.getElementById('main').innerHTML = orig;
}

// call on start of module test to prepend name to all tests
function module(moduleName, lifecycle) {
	synchronize(function() {
		var now = +new Date,
			stats = config.stats.modules[moduleName];
			oldModuleName = stats.old;
		
		if ( oldModuleName ) {
			config.stats.modules[oldModuleName].ended = now;
		}
		delete stats.old;
		stats.started = now;
		
		config.currentModule = moduleName;
		config.moduleLifecycle = lifecycle || {};
		
		echo("[" + moduleName + "]");
	});
	
	var oldModuleName = config.currentModule;
	config.currentModule = moduleName;

	config.stats.modules[moduleName] = {
		old: oldModuleName,
		all: 0,
		bad: 0
	};
}

var expected = -1;

/**
 * Specify the number of expected assertions to gurantee that failed test (no assertions are run at all) don't slip through.
 */
function expect(asserts) {
	config.expected = asserts;
}

/**
 * Asserts true.
 * @example ok( $("a").size() > 5, "There must be at least 5 anchors" );
 */
function ok(a, msg) {
	log( !!a, msg );
}

/**
 * Asserts that two arrays are the same
 */
function isSet(a, b, msg) {
	var ret = true;
	if ( a && b && a.length != undefined && a.length == b.length ) {
		for ( var i = 0; i < a.length; i++ ) {
			if ( a[i] != b[i] )
				ret = false;
		}
	} else
		ret = false;
	if ( !ret )
		log( ret, msg + " expected: " + serialArray(b) + " result: " + serialArray(a) );
	else 
		log( ret, msg );
}

/**
 * Asserts that two objects are equivalent
 */
function isObj(a, b, msg) {
	var ret = true;
	
	if ( a && b ) {
		for ( var i in a )
			if ( a[i] != b[i] )
				ret = false;

		for ( i in b )
			if ( a[i] != b[i] )
				ret = false;
	} else
		ret = false;

	log( ret, msg );
}

function serialArray( a ) {
	var r = [];
	
	if ( a && a.length )
		for ( var i = 0; i < a.length; i++ ) {
			var str = a[i] ? a[i].nodeName : "";
			if ( str ) {
				str = str.toLowerCase();
				if ( a[i].id )
					str += "#" + a[i].id;
			} else
				str = a[i];
			r.push( str );
		}

	return "[ " + r.join(", ") + " ]"
}

/**
 * Returns an array of elements with the given IDs, eg.
 * @example q("main", "foo", "bar")
 * @result [<div id="main">, <span id="foo">, <input id="bar">]
 */
function q() {
	var r = [];
	for ( var i = 0; i < arguments.length; i++ )
		r.push( document.getElementById( arguments[i] ) );
	return r;
}

/**
 * Asserts that a select matches the given IDs
 * @example t("Check for something", "//[a]", ["foo", "baar"]);
 * @result returns true if "//[a]" return two elements with the IDs 'foo' and 'baar'
 */
function t(a,b,c) {
	var f = jQuery(b);
	var s = "";
	for ( var i = 0; i < f.length; i++ )
		s += (s && ",") + '"' + f[i].id + '"';
	isSet(f, q.apply(q,c), a + " (" + b + ")");
}

/**
 * Checks that the first two arguments are equal, with an optional message.
 * Prints out both expected and actual values on failure.
 *
 * Prefered to ok( expected == actual, message )
 *
 * @example equals( "Expected 2 characters.", v.formatMessage("Expected {0} characters.", 2) );
 *
 * @param Object expected
 * @param Object actual
 * @param String message (optional)
 */
function equals(expected, actual, message) {
	var result = expected == actual;
	message = message || (result ? "okay" : "failed");
	log( result, result ? message + ": " + expected : message + " actual: " + expected + " expected: " + actual );
}

var colors = {
	red: "\\033[91m",
	green: "\\033[92m",
	blue: "\\033[94m",
	nc: "\\033[0m"
};

function log(state, msg){
	config.stats.all++;
	config.numTests++;
	
	if ( !state )
		config.stats.bad++;
	
	if(config.currentModule) {
		config.stats.modules[config.currentModule].all++;
		if ( !state )
			config.stats.modules[config.currentModule].bad++;
	}
 
	echo( (config.currentModule ? "	" : "") +
		(state ? colors.green + "PASS" : colors.red + "FAIL") +
		colors.nc + ": " + msg );
}

function results(){
	config.blocking = false;
	var started = +new Date;
	
	synchronize(function() {
		if(config.currentModule) {
			config.stats.modules[config.currentModule].ended = +new Date;
			echo ("");
			echo ("Modules:");
		}
		
		for(var moduleName in config.stats.modules) {
			var stats = config.stats.modules[moduleName];
			echo("  " + moduleName + ": " +
				(stats.bad > 0 || stats.all == 0 ?
					colors.red : colors.green ) +
				(stats.all - stats.bad) + " Passed, " +
				stats.bad + " Failed" +
				colors.nc + " in " +
				(stats.ended - stats.started) + "ms");
		}
		echo ("");
		echo((config.stats.bad > 0 || config.stats.all == 0 ?
				colors.red : colors.green ) +
			(config.stats.all - config.stats.bad) + " Passed, " +
			config.stats.bad + " Failed" +
			colors.nc + " in " +
			(+new Date - started) + "ms");
	});
}

function echo(msg) {
	if(environment["os.name"].toLowerCase() === "linux") {
		runCommand("echo", "-e", msg);
	} else {
		// removing the colors
		print(msg.replace(/\\033[^m]+m/g, ''));
	}
}

/**
 * Trigger an event on an element.
 *
 * @example triggerEvent( document.body, "click" );
 *
 * @param DOMElement elem
 * @param String type
 */
function triggerEvent( elem, type, event ) {
	if ( jQuery.browser.mozilla || jQuery.browser.opera ) {
		event = document.createEvent("MouseEvents");
		event.initMouseEvent(type, true, true, elem.ownerDocument.defaultView,
			0, 0, 0, 0, 0, false, false, false, false, 0, null);
		elem.dispatchEvent( event );
	} else if ( jQuery.browser.msie ) {
		elem.fireEvent("on"+type);
	}
}

/**
 * Add random number to url to stop IE from caching
 *
 * @example url("data/test.html")
 * @result "data/test.html?10538358428943"
 *
 * @example url("data/test.php?foo=bar")
 * @result "data/test.php?foo=bar&10538358345554"
 */
function url(value) {
	return value + (/\?/.test(value) ? "&" : "?") + new Date().getTime() + "" + parseInt(Math.random()*100000);
}
