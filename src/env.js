/*
 * Pure JavaScript Browser Environment
 *   By John Resig <http://ejohn.org/>
 * Copyright 2008 John Resig, under the MIT License
 */

// The window Object
var window = this;

(function(){

	// Browser Navigator

	window.navigator = {
		get userAgent(){
			return "Mozilla/5.0 (Macintosh; U; Intel Mac OS X; en-US; rv:1.8.1.3) Gecko/20070309 Firefox/2.0.0.3";
		}
	};
	
	var curLocation = (new java.io.File("./")).toURL();
	
	window.__defineSetter__("location", function(url){
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url);
		xhr.onreadystatechange = function(){
			curLocation = new java.net.URL( curLocation, url );
			window.document = xhr.responseXML;
			
			var event = document.createEvent();
			event.initEvent("load");
			window.dispatchEvent( event );
		};
		xhr.send();
	});
	
	window.__defineGetter__("location", function(url){
		return {
			get protocol(){
				return curLocation.getProtocol() + ":";
			},
			get href(){
				return curLocation.toString();
			},
			toString: function(){
				return this.href;
			}
		};
	});
	
	// Timers

	var timers = [];
	
	window.setTimeout = function(fn, time){
		var num;
		return num = setInterval(function(){
			fn();
			clearInterval(num);
		}, time);
	};
	
	window.setInterval = function(fn, time){
		var num = timers.length;
		
		timers[num] = new java.lang.Thread(new java.lang.Runnable({
			run: function(){
				while (true){
					java.lang.Thread.currentThread().sleep(time);
					fn();
				}
			}
		}));
		
		timers[num].start();
	
		return num;
	};
	
	window.clearInterval = function(num){
		if ( timers[num] ) {
			timers[num].stop();
			delete timers[num];
		}
	};
	
	// Window Events
	
	var events = [{}];

	window.addEventListener = function(type, fn){
		if ( !this.uuid || this == window ) {
			this.uuid = events.length;
			events[this.uuid] = {};
		}
	   
		if ( !events[this.uuid][type] )
			events[this.uuid][type] = [];
		
		if ( events[this.uuid][type].indexOf( fn ) < 0 )
			events[this.uuid][type].push( fn );
	};
	
	window.removeEventListener = function(type, fn){
	   if ( !this.uuid || this == window ) {
		   this.uuid = events.length;
		   events[this.uuid] = {};
	   }
	   
	   if ( !events[this.uuid][type] )
			events[this.uuid][type] = [];
			
		events[this.uuid][type] =
			events[this.uuid][type].filter(function(f){
				return f != fn;
			});
	};
	
	window.dispatchEvent = function(event){
		if ( event.type ) {
			if ( this.uuid && events[this.uuid][event.type] ) {
				var self = this;
			
				events[this.uuid][event.type].forEach(function(fn){
					fn.call( self, event );
				});
			}
			if ( this["on" + event.type] )
				this["on" + event.type].call( self, event );
			
			// bubble
			if(this.parentNode && !event._stopped) {
				event._currentTarget = this;
				this.parentNode._dispatchEvent(event);
			}
		}
	};
	
	// Event
	
	function Event() {
		this._type = "";
		this._target
		this._currentTarget;
		this._bubbles = true;
		this._cancelable = true;
		
		this._stopped = false;
		this._cancelled = false;

		this.timeStamp = new Date().valueOf();
	}

	Event.CAPTURING_PHASE = 1;
	Event.AT_TARGET = 2;
	Event.BUBBLING_PHASE = 3;

	Event.prototype = {
		constructor: Event,
		get bubbles() {
			return this._bubbles;
		},
		get cancelable() {
			return this._cancelable;
		},
		get currentTarget() {
			return this._currentTarget;
		},
		get eventPhase() {
			throw("eventPhase is not supported");
			return this._eventPhase;
		},
		get target() {
			return this._target;
		},
		get type() {
			return this._type;
		},
		initEvent: function(type, bubbles, cancelable) {
			this._type = type;
			this._bubbles = bubbles;
			this._cancelable = cancelable;
		},
		preventDefault: function() {
			if(this.cancelable)
				this._cancelled = true;
		},
		stopPropagation: function() {
			this._stopped = true;
		}
	};

	// DOM Document
	
	window.DOMDocument = function(){
		// pass
	};
	
	DOMDocument.prototype = {
		fromFile: function(file) {
			this._file = file;
			var documentBuilderFactory = javax.xml.parsers
			                                      .DocumentBuilderFactory
			                                      .newInstance();
			documentBuilderFactory.setNamespaceAware(true);
			var documentBuilder = documentBuilderFactory.newDocumentBuilder();
			this._dom = documentBuilder.parse(file);
			
			if ( !obj_nodes.containsKey( this._dom ) )
				obj_nodes.put( this._dom, this );

			return this;
		},
		fromDocument: function(root) {
			this._dom = root;

			if ( !obj_nodes.containsKey( this._dom ) )
				obj_nodes.put( this._dom, this );

			return this;
		},
		get nodeType(){
			return 9;
		},
		createTextNode: function(text){
			return makeNode( this._dom.createTextNode(
				text.toString()
				    .replace(/&/g, "&amp;")
				    .replace(/</g, "&lt;")
				    .replace(/>/g, "&gt;")) );
		},
		createElement: function(name){
			return makeNode( this._dom.createElement(name) );
		},
		createElementNS: function(namespace, name){
			return makeNode( this._dom.createElementNS(namespace, name) );
		},
		createComment: function(comment){
			return makeNode( this._dom.createComment(comment) );
		},
        createDocumentFragment: function(){
            return makeNode( this._dom.createDocumentFragment() );
        },
		getElementsByTagName: function(name){
			return new DOMNodeList( this._dom.getElementsByTagName(
				name) );
		},
		getElementsByTagNameNS: function(namespace, name){
			return new DOMNodeList( this._dom.getElementsByTagNameNS(
				namespace, name) );
		},
		getElementsByClassName: function(className) {
			var classes = className.split(" "),
				rules = [],
				nodes = [];
		
			for(var i = 0; i<classes.length; i++) {
				rules.push("contains(concat(' ', @class, ' '),"+
				           "' "+classes[i]+" ')");
			}
		           
			var query = ".//*[" + (rules.join(" and ")) + "]";
            var document = this instanceof DOMDocument ?
                this :
                this.ownerDocument;
			var result = document.evaluate(query,
			                               this,
			                               null,
			                               XPathResult.ANY_TYPE,
			                               null);
			         
			var node;
			while(node = result.iterateNext()) {
				nodes.push(node);
			}
		           
			return nodes;
		},
		getElementsByName: function(name){
			var elems = this._dom.getElementsByTagName("*"), ret = [];
			ret.item = function(i){ return this[i]; };
			ret.getLength = function(){ return this.length; };
			
			for ( var i = 0; i < elems.length; i++ ) {
				var elem = elems.item(i);
				if ( elem.getAttribute("name") == name )
					ret.push( elem );
			}
			
			return new DOMNodeList( ret );
		},
		getElementById: function(id){
			var elems = this._dom.getElementsByTagName("*");
			
			for ( var i = 0; i < elems.length; i++ ) {
				var elem = elems.item(i);
				if ( elem.getAttribute("id") == id )
					return makeNode(elem);
			}
			
			return null;
		},
		get body(){
			return this.getElementsByTagName("body")[0];
		},
		get documentElement(){
			return makeNode( this._dom.getDocumentElement() );
		},
		get ownerDocument(){
			return null;
		},
		addEventListener: function() {
			window.addEventListener.apply(this, arguments)
		},
		removeEventListener: function() {
			window.removeEventListener.apply(this, arguments)
		},
		_dispatchEvent: function() {
			window.dispatchEvent.apply(this, arguments);
		},
		dispatchEvent: function(event) {
			event._target = this;
			event._currentTarget = this;
			this._dispatchEvent(event);
		},
		get nodeName() {
			return "#document";
		},
		importNode: function(node, deep){
			return makeNode( this._dom.importNode(node._dom, deep) );
		},
		toString: function(){
			return "Document" + (typeof this._file == "string" ?
				": " + this._file : "");
		},
		get innerHTML(){
			return this.documentElement.outerHTML;
		},
		
		get defaultView(){
			return {
				getComputedStyle: function(elem){
					return {
						getPropertyValue: function(prop){
							prop = prop.replace(/\-(\w)/g,function(m,c){
								return c.toUpperCase();
							});
							var val = elem.style[prop];
							
							if ( prop == "opacity" && val == "" )
								val = "1";
								
							return val;
						}
					};
				}
			};
		},
		
		createEvent: function(type){
			return new Event(type);
        },

		get implementation(){
			var dom = this._dom;
			return {
				createDocument: function(namespaceURI, qualifiedNameStr, documentType) {
					return new DOMDocument().fromDocument(
						dom.getImplementation().createDocument(namespaceURI,
						                                       qualifiedNameStr,
						                                       documentType) );
				}
			};
		},

		evaluate: function(xpathExpression, contextNode, namespaceResolver, resultType, result) {
			var evaluator = new org.apache.xpath.domapi.XPathEvaluatorImpl();
			var xpathNSResolver = null;
			if(typeof namespaceResolver === "function") {
				xpathNSResolver = {
					getBaseIdentifier: function() {
						return null
					},
					getNamespaceForPrefix: namespaceResolver,
					handlesNullPrefixes: !namespaceResolver(),
					lookupNamespaceURI: namespaceResolver
				};
				
				xpathNSResolver = new JavaAdapter(org.apache.xml.utils.PrefixResolver,
				                                  org.w3c.dom.xpath.XPathNSResolver,
				                                  xpathNSResolver);
			}
			return new XPathResult( evaluator.evaluate(xpathExpression,
			                                           contextNode._dom,
			                                           xpathNSResolver,
			                                           resultType,
			                                           result) );
		}
	};
	
	function getDocument(node){
		return obj_nodes.get(node);
	}
	
	// DOM NodeList
	
	window.DOMNodeList = function(list){
		this._dom = list;
		
		for ( var i = 0; i < list.getLength(); i++ ) {
			this[i] = makeNode( list.item(i) );
		}
	};
	
	DOMNodeList.prototype = {
		toString: function(){
			return "[ " +
				Array.prototype.join.call( this, ", " ) + " ]";
		},
		get outerHTML(){
			return Array.prototype.map.call(
				this, function(node){return node.outerHTML;}).join('');
		},
		get length() {
			return this._dom.getLength();
		}
	};
	
	// DOM Node
	
	window.DOMNode = function(node){
		this._dom = node;
	};
	
	DOMNode.prototype = {
		get nodeType(){
			return this._dom.getNodeType();
		},
		get nodeValue(){
			return this._dom.getNodeValue();
		},
		get nodeName() {
			return this._dom.getNodeName();
		},
		get childNodes(){
			return new DOMNodeList( this._dom.getChildNodes() );
		},
		cloneNode: function(deep){
			return makeNode( this._dom.cloneNode(deep) );
		},
		get ownerDocument(){
			return getDocument( this._dom.ownerDocument );
		},
		get documentElement(){
			return makeNode( this._dom.documentElement );
		},
		get parentNode() {
			return makeNode( this._dom.getParentNode() );
		},
		get nextSibling() {
			return makeNode( this._dom.getNextSibling() );
		},
		get previousSibling() {
			return makeNode( this._dom.getPreviousSibling() );
		},
		get data() {
			return ""+this.nodeValue;
		},
		toString: function(){
			return '"' + this.nodeValue + '"';
		},
		get outerHTML(){
			return this.nodeValue;
		},
		get namespaceURI(){
			return this._dom.getNamespaceURI();
		}
	};
    
	window.DOMComment = function(node){
		this._dom = node;
	};

	DOMComment.prototype = extend(new DOMNode(), {
		get nodeType(){
			return 8;
		},
		get outerHTML(){
			return "<!--" + this.nodeValue + "-->";
		}
	});

	// DOM Element

	window.DOMElement = function(elem){
		this._dom = elem;
		this.style = {
			get opacity(){ return this._opacity; },
			set opacity(val){ this._opacity = val + ""; }
		};
		
		// Load CSS info
		var styles = (this.getAttribute("style") || "").split(/\s*;\s*/);
		
		for ( var i = 0; i < styles.length; i++ ) {
			var style = styles[i].split(/\s*:\s*/);
			if ( style.length == 2 )
				this.style[ style[0] ] = style[1];
		}
		
		if ( this.nodeName == "FORM" ) {
			this.__defineGetter__("elements", function(){
				return this.getElementsByTagName("*");
			});
			
			this.__defineGetter__("length", function(){
				var elems = this.elements;
				for ( var i = 0; i < elems.length; i++ ) {
					this[i] = elems[i];
				}
				
				return elems.length;
			});
		}

		if ( this.nodeName == "SELECT" ) {
			this.__defineGetter__("options", function(){
				return this.getElementsByTagName("option");
			});
		}
		
		this.__defineGetter__("defaultValue", function() {
			this.defaultValue = this.value;
		});
	};
	
	DOMElement.prototype = extend( new DOMNode(), {
		get nodeName(){
			return this.tagName;
		},
		get tagName(){
			return this._dom.getTagName().toUpperCase();
		},
		toString: function(){
			return "<" + this.tagName + (this.id ? "#" + this.id : "" ) + ">";
		},
		get outerHTML(){
			var ret = "<" + this.tagName, attr = this.attributes;
			
			for ( var i in attr )
				ret += " " + i + "='" + attr[i] + "'";
				
			if ( this.childNodes.length || this.nodeName == "SCRIPT" )
				ret += ">" + this.childNodes.outerHTML + 
					"</" + this.tagName + ">";
			else
				ret += "/>";
			
			return ret;
		},
		
		get attributes(){
			var attr = {}, attrs = this._dom.getAttributes();
			
			for ( var i = 0; i < attrs.getLength(); i++ )
				attr[ attrs.item(i).nodeName ] = attrs.item(i).nodeValue;
				
			return attr;
		},
		
		get innerHTML(){
			return this.childNodes.outerHTML;	
		},
		set innerHTML(html){
			html = html.replace(/<\/?([A-Z]+)/g, function(m){
				return m.toLowerCase();
			}).replace(/&nbsp;/g, " ");
			
			var nodes = this.ownerDocument.importNode(
				new DOMDocument().fromFile( new java.io.ByteArrayInputStream(
					(new java.lang.String("<wrap>" + html + "</wrap>"))
						.getBytes("UTF8"))).documentElement, true).childNodes;
			while (this.firstChild)
				this.removeChild( this.firstChild );
			
			for ( var i = nodes.length - 1; i >= 0; i-- )
				this.appendChild( nodes[i] );
		},
		
		get textContent(){
			return nav(this.childNodes);
			
			function nav(nodes){
				var str = "";
				for ( var i = 0; i < nodes.length; i++ )
					if ( nodes[i].nodeType == 3 )
						str += nodes[i].nodeValue;
					else if ( nodes[i].nodeType == 1 )
						str += nav(nodes[i].childNodes);
				return str;
			}
		},
		set textContent(text){
			while (this.firstChild)
				this.removeChild( this.firstChild );
			this.appendChild( this.ownerDocument.createTextNode(text));
		},
		
		style: {},
		clientHeight: 0,
		clientWidth: 0,
		offsetHeight: 0,
		offsetWidth: 0,
		
		get disabled() {
			var val = this.getAttribute("disabled");
			return val != "false" && !!val;
		},
		set disabled(val) { return this.setAttribute("disabled",val); },
		
		get checked() {
			var val = this.getAttribute("checked");
			return val != "false" && !!val;
		},
		set checked(val) { return this.setAttribute("checked",val); },
		
		get selected() {
			if ( !this._selectDone ) {
				this._selectDone = true;
				
				if ( this.nodeName == "OPTION" && !this.parentNode.getAttribute("multiple") ) {
					var opt = this.parentNode.getElementsByTagName("option");
					
					if ( this == opt[0] ) {
						var select = true;
						
						for ( var i = 1; i < opt.length; i++ )
							if ( opt[i].selected ) {
								select = false;
								break;
							}
							
						if ( select )
							this.selected = true;
					}
				}
			}
			
			var val = this.getAttribute("selected");
			return val != "false" && !!val;
		},
		set selected(val) { return this.setAttribute("selected",val); },

		get className() { return this.getAttribute("class") || ""; },
		set className(val) {
			return this.setAttribute("class",
				val.replace(/(^\s*|\s*$)/g,""));
		},
		
		get type() { return this.getAttribute("type") || ""; },
		set type(val) { return this.setAttribute("type",val); },

		get defaultValue() { return this.getAttribute("defaultValue") || ""; },
		set defaultValue(val) { return this.setAttribute("defaultValue",val); },

		get value() { return this.getAttribute("value") || ""; },
		set value(val) { return this.setAttribute("value",val); },
		
		get src() { return this.getAttribute("src") || ""; },
		set src(val) { return this.setAttribute("src",val); },
		
		get id() { return this.getAttribute("id") || ""; },
		set id(val) { return this.setAttribute("id",val); },
		
		getAttribute: function(name){
			return this._dom.hasAttribute(name) ?
				new String( this._dom.getAttribute(name) ) :
				null;
		},
		getAttributeNS: function(namespace, name){
			return this._dom.hasAttributeNS(namespace, name) ?
				new String( this._dom.getAttributeNS(namespace, name) ) :
				null;
		},
		setAttribute: function(name,value){
			this._dom.setAttribute(name,value);
		},
		setAttributeNS: function(namespace, name, value){
			var attr = this._dom.getOwnerDocument().createAttributeNS(namespace, name);
			attr.setValue(value);
			this._dom.setAttributeNodeNS(attr);
		},
		removeAttribute: function(name){
			this._dom.removeAttribute(name);
		},
		removeAttributeNS: function(namespace, name, value){
			var attr = this._dom.getAttributeNodeNS(namespace, name);
			this._dom.removeAttributeNodeNS(attr);
		},
		
		get childNodes(){
			return new DOMNodeList( this._dom.getChildNodes() );
		},
		get firstChild(){
			return makeNode( this._dom.getFirstChild() );
		},
		get lastChild(){
			return makeNode( this._dom.getLastChild() );
		},
		appendChild: function(node){
			this._dom.appendChild( node._dom );
		},
		insertBefore: function(node,before){
			this._dom.insertBefore( node._dom, before ? before._dom : before );
			
			execScripts( node );
			
			function execScripts( node ) {
				if ( node.nodeName == "SCRIPT" ) {
					if ( !node.getAttribute("src") ) {
						eval.call( window, node.textContent );
					}
				} else {
					var scripts = node.getElementsByTagName("script");
					for ( var i = 0; i < scripts.length; i++ ) {
						execScripts( node );
					}
				}
			}
		},
		removeChild: function(node){
			this._dom.removeChild( node._dom );
		},

		getElementsByTagName: DOMDocument.prototype.getElementsByTagName,
		getElementsByTagNameNS: DOMDocument.prototype.getElementsByTagNameNS,
        getElementsByClassName: DOMDocument.prototype.getElementsByClassName,
		
		addEventListener: function() {
            window.addEventListener.apply(this, arguments)
        },
		removeEventListener: function() {
            window.removeEventListener.apply(this, arguments);
        },
        _dispatchEvent: function() {
            window.dispatchEvent.apply(this, arguments);
        },
		dispatchEvent: function(event) {
            event._target = this;
            event._currentTarget = this;
            this._dispatchEvent(event);
        },
		
		click: function(){
			var event = document.createEvent();
			event.initEvent("click");
            event._target = this;
            event._currentTarget = this;
			this.dispatchEvent(event);
		},
		submit: function(){
			var event = document.createEvent();
			event.initEvent("submit");
            event._target = this;
            event._currentTarget = this;
			this.dispatchEvent(event);
		},
		focus: function(){
			var event = document.createEvent();
			event.initEvent("focus");
            event._target = this;
            event._currentTarget = this;
			this.dispatchEvent(event);
		},
		blur: function(){
			var event = document.createEvent();
			event.initEvent("blur");
            event._target = this;
            event._currentTarget = this;
			this.dispatchEvent(event);
		},
		get contentWindow(){
			return this.nodeName == "IFRAME" ? {
				document: this.contentDocument
			} : null;
		},
		get contentDocument(){
			if ( this.nodeName == "IFRAME" ) {
				if ( !this._doc )
					this._doc = new DOMDocument().fromFile(
						new java.io.ByteArrayInputStream((new java.lang.String(
							"<html><head><title></title></head><body></body></html>"))
						.getBytes("UTF8")));
				return this._doc;
			} else
				return null;
		}
	});
	
	// Helper method for extending one object with another
	
	function extend(a,b) {
		for ( var i in b ) {
			var g = b.__lookupGetter__(i), s = b.__lookupSetter__(i);
			
			if ( g || s ) {
				if ( g )
					a.__defineGetter__(i, g);
				if ( s )
					a.__defineSetter__(i, s);
			} else
				a[i] = b[i];
		}
		return a;
	}
	
	// Helper method for generating the right
	// DOM objects based upon the type
	
	var obj_nodes = new java.util.HashMap();
	
	function makeNode(node){
		if ( node ) {
			if ( !obj_nodes.containsKey( node ) )
				obj_nodes.put( node, node.getNodeType() == 1?
					new DOMElement( node ) :
					node.getNodeType() == 8 ?
					new DOMComment( node ) :
					new DOMNode( node ) );
			
			return obj_nodes.get(node);
		} else
			return null;
	}
	
	// XMLHttpRequest
	// Originally implemented by Yehuda Katz

	window.XMLHttpRequest = function(){
		this.headers = {};
		this.responseHeaders = {};
	};
	
	XMLHttpRequest.prototype = {
		open: function(method, url, async, user, password){ 
			this.readyState = 1;
			if (async)
				this.async = true;
			this.method = method || "GET";
			this.url = url;
			this.onreadystatechange();
		},
		setRequestHeader: function(header, value){
			this.headers[header] = value;
		},
		getResponseHeader: function(header){ },
		send: function(data){
			var self = this;
			
			function makeRequest(){
				var url = new java.net.URL(curLocation, self.url);
				if ( url.getProtocol() == "file" ) {
					if ( self.method == "PUT" ) {
						var out = new java.io.FileWriter( 
								new java.io.File( new java.net.URI( url.toString() ) ) ),
							text = new java.lang.String( data || "" );
						
						out.write( text, 0, text.length() );
						out.flush();
						out.close();
					} else if ( self.method == "DELETE" ) {
						var file = new java.io.File( new java.net.URI( url.toString() ) );
						file["delete"]();
					} else {
						var connection = url.openConnection();
						connection.connect();
						handleResponse();
					}
				} else { 
					var connection = url.openConnection();
					connection.setRequestMethod( self.method );
					
					// Add headers to Java connection
					for (var header in self.headers)
						connection.addRequestProperty(header, self.headers[header]);
					
					// Add data to Java connection
					if(data) {
						connection.setDoOutput(true);
						var streamWriter = new java.io.OutputStreamWriter(connection.getOutputStream());
						streamWriter.write(data);
						streamWriter.flush();
					}
					
					connection.connect();
					
					// Stick the response headers into responseHeaders
					for (var i = 0; ; i++) { 
						var headerName = connection.getHeaderFieldKey(i); 
						var headerValue = connection.getHeaderField(i);
						if (!headerName && !headerValue) break; 
						if (headerName)
							self.responseHeaders[headerName] = headerValue;
					}
					handleResponse();
				}
				
				function handleResponse(){
					self.readyState = 4;
					self.status = parseInt(connection.responseCode) || undefined;
					self.statusText = connection.responseMessage || "";

					var contentEncoding = connection.getContentEncoding() || "utf-8",
						buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 1024),
						length,
						responseXML = null;

					try{
						var stream = (contentEncoding.equalsIgnoreCase("gzip") || contentEncoding.equalsIgnoreCase("decompress") )?
								new java.util.zip.GZIPInputStream(connection.getInputStream()) :
								connection.getInputStream(),
							baos = new java.io.ByteArrayOutputStream();
						
						while (stream && (length = stream.read(buffer)) != -1) {
							baos.write(buffer, 0, length);
						}
						
						baos.close();
						stream.close();

						self.responseText = java.nio.charset.Charset.forName(contentEncoding)
							.decode(java.nio.ByteBuffer.wrap(baos.toByteArray())).toString();
					} catch(e) {
						self.responseText = null;
					}
					
					self.__defineGetter__("responseXML", function(){
						return responseXML;
					});
					
					if ( self.responseText && self.responseText.match(/^\s*</) ) {
						try {
							responseXML = new DOMDocument().fromFile(
								new java.io.ByteArrayInputStream(
									(new java.lang.String(
										self.responseText)).getBytes("UTF8")));
						} catch(e) {}
					}
				}
				
				self.onreadystatechange();
			}
			if (this.async)
				(new java.lang.Thread(new java.lang.Runnable({
					run: makeRequest
				}))).start();
			else
				makeRequest();
		},
		abort: function(){},
		onreadystatechange: function(){},
		getResponseHeader: function(header){
			if (this.readyState < 3)
				throw new Error("INVALID_STATE_ERR");
			else {
				var returnedHeaders = [];
				for (var rHeader in this.responseHeaders) {
					if (rHeader.match(new RegExp(header, "i")))
						returnedHeaders.push(this.responseHeaders[rHeader]);
				}
			
				if (returnedHeaders.length)
					return returnedHeaders.join(", ");
			}
			
			return null;
		},
		getAllResponseHeaders: function(header){
			if (this.readyState < 3)
				throw new Error("INVALID_STATE_ERR");
			else {
				var returnedHeaders = [];
				
				for (var header in this.responseHeaders)
					returnedHeaders.push( header + ": " + this.responseHeaders[header] );
				
				return returnedHeaders.join("\r\n");
			}
		},
		async: true,
		readyState: 0,
		responseText: "",
		status: 0
	};

	window.XMLSerializer = function() {
		// pass
	};

	XMLSerializer.prototype = {
		constructor: XMLSerializer,
		serializeToString: function(node) {
			var outputStream = java.io.ByteArrayOutputStream();

			this.serializeToStream(node, outputStream, "UTF-8");

			return new String(outputStream);
		},
		serializeToStream: function(root, stream, charset) {
			root = "_dom" in root ? root._dom : root;
			var tr = javax.xml.transform.TransformerFactory.newInstance()
			                                               .newTransformer();
			tr.setOutputProperty(javax.xml.transform.OutputKeys.ENCODING,
			                     charset);
			tr.setOutputProperty(javax.xml.transform.OutputKeys.INDENT,
			                     "yes");
			tr.setOutputProperty(javax.xml.transform.OutputKeys.METHOD,
			                    "xml");
			tr.transform(new javax.xml.transform.dom.DOMSource(root),
			             new javax.xml.transform.stream.StreamResult(stream));
		}
	};
	window.XPathResult = function(result) {
		this._result = result;
	};
	// values are 0 - 9
	window.XPathResult.ANY_TYPE = org.w3c.dom.xpath.XPathResult.ANY_TYPE;
	window.XPathResult.NUMBER_TYPE = org.w3c.dom.xpath.XPathResult.NUMBER_TYPE;
	window.XPathResult.STRING_TYPE = org.w3c.dom.xpath.XPathResult.STRING_TYPE;
	window.XPathResult.BOOLEAN_TYPE = org.w3c.dom.xpath.XPathResult.BOOLEAN_TYPE;
	window.XPathResult.UNORDERED_NODE_ITERATOR_TYPE = org.w3c.dom.xpath.XPathResult.UNORDERED_NODE_ITERATOR_TYPE;
	window.XPathResult.ORDERED_NODE_ITERATOR_TYPE = org.w3c.dom.xpath.XPathResult.ORDERED_NODE_ITERATOR_TYPE;
	window.XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE = org.w3c.dom.xpath.XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE;
	window.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE = org.w3c.dom.xpath.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE;
	window.XPathResult.ANY_UNORDERED_SNAPSHOT_TYPE = org.w3c.dom.xpath.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE;
	window.XPathResult.FIRST_ORDERED_NODE_TYPE = org.w3c.dom.xpath.XPathResult.ORDERED_NODE_SNAPSHOT_TYPE;

	window.XPathResult.prototype = {
		constructor: window.XPathResult,
		get booleanValue() {
			return this._result.getBooleanValue();
		},
		get invalidIteratorState() {
			return this._result.getInvalidIteratorState();
		},
		get numberValue() {
			return this._result.getNumberValue();
		},
		get resultType() {
			return this._result.getResultType();
		},
		get singleNodeValue() {
			return makeNode(this._result.getSingleNodeValue());
		},
		get snapshotLength() {
			return this._result.getSnapshotLength();
		},
		get stringValue() {
			return this._result.getStringValue();
		},
		iterateNext: function() {
			return makeNode(this._result.iterateNext());
		},
		snapshotItem: function(index) {
			return makeNode(this._result.snapshotItem(index));
		}
	};

	var oldEncodeURIComponent = encodeURIComponent;
	window.encodeURIComponent = function() {
		return oldEncodeURIComponent.apply(this, arguments)
		                            .replace(/%([0-9a-f]{2})/g,
		                                     function(m) {
		                                     	return m.toUpperCase()
		                                     });
	};
})();
