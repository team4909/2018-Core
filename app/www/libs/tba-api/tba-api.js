(function (f) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = f()
    } else if (typeof define === "function" && define.amd) {
        define([], f)
    } else {
        var g;
        if (typeof window !== "undefined") {
            g = window
        } else if (typeof global !== "undefined") {
            g = global
        } else if (typeof self !== "undefined") {
            g = self
        } else {
            g = this
        }
        g.tba = f()
    }
})(function () {
    var define, module, exports;
    return (function e(t, n, r) {
        function s(o, u) {
            if (!n[o]) {
                if (!t[o]) {
                    var a = typeof require == "function" && require;
                    if (!u && a) return a(o, !0);
                    if (i) return i(o, !0);
                    var f = new Error("Cannot find module '" + o + "'");
                    throw f.code = "MODULE_NOT_FOUND", f
                }
                var l = n[o] = {
                    exports: {}
                };
                t[o][0].call(l.exports, function (e) {
                    var n = t[o][1][e];
                    return s(n ? n : e)
                }, l, l.exports, e, t, n, r)
            }
            return n[o].exports
        }
        var i = typeof require == "function" && require;
        for (var o = 0; o < r.length; o++) s(r[o]);
        return s
    })({
        1: [function (require, module, exports) {

            /**
             * Expose `Emitter`.
             */

            if (typeof module !== 'undefined') {
                module.exports = Emitter;
            }

            /**
             * Initialize a new `Emitter`.
             *
             * @api public
             */

            function Emitter(obj) {
                if (obj) return mixin(obj);
            };

            /**
             * Mixin the emitter properties.
             *
             * @param {Object} obj
             * @return {Object}
             * @api private
             */

            function mixin(obj) {
                for (var key in Emitter.prototype) {
                    obj[key] = Emitter.prototype[key];
                }
                return obj;
            }

            /**
             * Listen on the given `event` with `fn`.
             *
             * @param {String} event
             * @param {Function} fn
             * @return {Emitter}
             * @api public
             */

            Emitter.prototype.on =
                Emitter.prototype.addEventListener = function (event, fn) {
                    this._callbacks = this._callbacks || {};
                    (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
                    .push(fn);
                    return this;
                };

            /**
             * Adds an `event` listener that will be invoked a single
             * time then automatically removed.
             *
             * @param {String} event
             * @param {Function} fn
             * @return {Emitter}
             * @api public
             */

            Emitter.prototype.once = function (event, fn) {
                function on() {
                    this.off(event, on);
                    fn.apply(this, arguments);
                }

                on.fn = fn;
                this.on(event, on);
                return this;
            };

            /**
             * Remove the given callback for `event` or all
             * registered callbacks.
             *
             * @param {String} event
             * @param {Function} fn
             * @return {Emitter}
             * @api public
             */

            Emitter.prototype.off =
                Emitter.prototype.removeListener =
                Emitter.prototype.removeAllListeners =
                Emitter.prototype.removeEventListener = function (event, fn) {
                    this._callbacks = this._callbacks || {};

                    // all
                    if (0 == arguments.length) {
                        this._callbacks = {};
                        return this;
                    }

                    // specific event
                    var callbacks = this._callbacks['$' + event];
                    if (!callbacks) return this;

                    // remove all handlers
                    if (1 == arguments.length) {
                        delete this._callbacks['$' + event];
                        return this;
                    }

                    // remove specific handler
                    var cb;
                    for (var i = 0; i < callbacks.length; i++) {
                        cb = callbacks[i];
                        if (cb === fn || cb.fn === fn) {
                            callbacks.splice(i, 1);
                            break;
                        }
                    }
                    return this;
                };

            /**
             * Emit `event` with the given args.
             *
             * @param {String} event
             * @param {Mixed} ...
             * @return {Emitter}
             */

            Emitter.prototype.emit = function (event) {
                this._callbacks = this._callbacks || {};
                var args = [].slice.call(arguments, 1),
                    callbacks = this._callbacks['$' + event];

                if (callbacks) {
                    callbacks = callbacks.slice(0);
                    for (var i = 0, len = callbacks.length; i < len; ++i) {
                        callbacks[i].apply(this, args);
                    }
                }

                return this;
            };

            /**
             * Return array of callbacks for `event`.
             *
             * @param {String} event
             * @return {Array}
             * @api public
             */

            Emitter.prototype.listeners = function (event) {
                this._callbacks = this._callbacks || {};
                return this._callbacks['$' + event] || [];
            };

            /**
             * Check if this emitter has `event` handlers.
             *
             * @param {String} event
             * @return {Boolean}
             * @api public
             */

            Emitter.prototype.hasListeners = function (event) {
                return !!this.listeners(event).length;
            };

}, {}],
        2: [function (require, module, exports) {
            /**
             * Root reference for iframes.
             */

            var root;
            if (typeof window !== 'undefined') { // Browser window
                root = window;
            } else if (typeof self !== 'undefined') { // Web Worker
                root = self;
            } else { // Other environments
                console.warn("Using browser-only version of superagent in non-browser environment");
                root = this;
            }

            var Emitter = require('component-emitter');
            var RequestBase = require('./request-base');
            var isObject = require('./is-object');
            var isFunction = require('./is-function');
            var ResponseBase = require('./response-base');
            var shouldRetry = require('./should-retry');

            /**
             * Noop.
             */

            function noop() {};

            /**
             * Expose `request`.
             */

            var request = exports = module.exports = function (method, url) {
                // callback
                if ('function' == typeof url) {
                    return new exports.Request('GET', method).end(url);
                }

                // url first
                if (1 == arguments.length) {
                    return new exports.Request('GET', method);
                }

                return new exports.Request(method, url);
            }

            exports.Request = Request;

            /**
             * Determine XHR.
             */

            request.getXHR = function () {
                if (root.XMLHttpRequest &&
                    (!root.location || 'file:' != root.location.protocol ||
                        !root.ActiveXObject)) {
                    return new XMLHttpRequest;
                } else {
                    try {
                        return new ActiveXObject('Microsoft.XMLHTTP');
                    } catch (e) {}
                    try {
                        return new ActiveXObject('Msxml2.XMLHTTP.6.0');
                    } catch (e) {}
                    try {
                        return new ActiveXObject('Msxml2.XMLHTTP.3.0');
                    } catch (e) {}
                    try {
                        return new ActiveXObject('Msxml2.XMLHTTP');
                    } catch (e) {}
                }
                throw Error("Browser-only verison of superagent could not find XHR");
            };

            /**
             * Removes leading and trailing whitespace, added to support IE.
             *
             * @param {String} s
             * @return {String}
             * @api private
             */

            var trim = ''.trim ?
                function (s) {
                    return s.trim();
                } :
                function (s) {
                    return s.replace(/(^\s*|\s*$)/g, '');
                };

            /**
             * Serialize the given `obj`.
             *
             * @param {Object} obj
             * @return {String}
             * @api private
             */

            function serialize(obj) {
                if (!isObject(obj)) return obj;
                var pairs = [];
                for (var key in obj) {
                    pushEncodedKeyValuePair(pairs, key, obj[key]);
                }
                return pairs.join('&');
            }

            /**
             * Helps 'serialize' with serializing arrays.
             * Mutates the pairs array.
             *
             * @param {Array} pairs
             * @param {String} key
             * @param {Mixed} val
             */

            function pushEncodedKeyValuePair(pairs, key, val) {
                if (val != null) {
                    if (Array.isArray(val)) {
                        val.forEach(function (v) {
                            pushEncodedKeyValuePair(pairs, key, v);
                        });
                    } else if (isObject(val)) {
                        for (var subkey in val) {
                            pushEncodedKeyValuePair(pairs, key + '[' + subkey + ']', val[subkey]);
                        }
                    } else {
                        pairs.push(encodeURIComponent(key) +
                            '=' + encodeURIComponent(val));
                    }
                } else if (val === null) {
                    pairs.push(encodeURIComponent(key));
                }
            }

            /**
             * Expose serialization method.
             */

            request.serializeObject = serialize;

            /**
             * Parse the given x-www-form-urlencoded `str`.
             *
             * @param {String} str
             * @return {Object}
             * @api private
             */

            function parseString(str) {
                var obj = {};
                var pairs = str.split('&');
                var pair;
                var pos;

                for (var i = 0, len = pairs.length; i < len; ++i) {
                    pair = pairs[i];
                    pos = pair.indexOf('=');
                    if (pos == -1) {
                        obj[decodeURIComponent(pair)] = '';
                    } else {
                        obj[decodeURIComponent(pair.slice(0, pos))] =
                            decodeURIComponent(pair.slice(pos + 1));
                    }
                }

                return obj;
            }

            /**
             * Expose parser.
             */

            request.parseString = parseString;

            /**
             * Default MIME type map.
             *
             *     superagent.types.xml = 'application/xml';
             *
             */

            request.types = {
                html: 'text/html',
                json: 'application/json',
                xml: 'application/xml',
                urlencoded: 'application/x-www-form-urlencoded',
                'form': 'application/x-www-form-urlencoded',
                'form-data': 'application/x-www-form-urlencoded'
            };

            /**
             * Default serialization map.
             *
             *     superagent.serialize['application/xml'] = function(obj){
             *       return 'generated xml here';
             *     };
             *
             */

            request.serialize = {
                'application/x-www-form-urlencoded': serialize,
                'application/json': JSON.stringify
            };

            /**
             * Default parsers.
             *
             *     superagent.parse['application/xml'] = function(str){
             *       return { object parsed from str };
             *     };
             *
             */

            request.parse = {
                'application/x-www-form-urlencoded': parseString,
                'application/json': JSON.parse
            };

            /**
             * Parse the given header `str` into
             * an object containing the mapped fields.
             *
             * @param {String} str
             * @return {Object}
             * @api private
             */

            function parseHeader(str) {
                var lines = str.split(/\r?\n/);
                var fields = {};
                var index;
                var line;
                var field;
                var val;

                lines.pop(); // trailing CRLF

                for (var i = 0, len = lines.length; i < len; ++i) {
                    line = lines[i];
                    index = line.indexOf(':');
                    field = line.slice(0, index).toLowerCase();
                    val = trim(line.slice(index + 1));
                    fields[field] = val;
                }

                return fields;
            }

            /**
             * Check if `mime` is json or has +json structured syntax suffix.
             *
             * @param {String} mime
             * @return {Boolean}
             * @api private
             */

            function isJSON(mime) {
                return /[\/+]json\b/.test(mime);
            }

            /**
             * Initialize a new `Response` with the given `xhr`.
             *
             *  - set flags (.ok, .error, etc)
             *  - parse header
             *
             * Examples:
             *
             *  Aliasing `superagent` as `request` is nice:
             *
             *      request = superagent;
             *
             *  We can use the promise-like API, or pass callbacks:
             *
             *      request.get('/').end(function(res){});
             *      request.get('/', function(res){});
             *
             *  Sending data can be chained:
             *
             *      request
             *        .post('/user')
             *        .send({ name: 'tj' })
             *        .end(function(res){});
             *
             *  Or passed to `.send()`:
             *
             *      request
             *        .post('/user')
             *        .send({ name: 'tj' }, function(res){});
             *
             *  Or passed to `.post()`:
             *
             *      request
             *        .post('/user', { name: 'tj' })
             *        .end(function(res){});
             *
             * Or further reduced to a single call for simple cases:
             *
             *      request
             *        .post('/user', { name: 'tj' }, function(res){});
             *
             * @param {XMLHTTPRequest} xhr
             * @param {Object} options
             * @api private
             */

            function Response(req) {
                this.req = req;
                this.xhr = this.req.xhr;
                // responseText is accessible only if responseType is '' or 'text' and on older browsers
                this.text = ((this.req.method != 'HEAD' && (this.xhr.responseType === '' || this.xhr.responseType === 'text')) || typeof this.xhr.responseType === 'undefined') ?
                    this.xhr.responseText :
                    null;
                this.statusText = this.req.xhr.statusText;
                var status = this.xhr.status;
                // handle IE9 bug: http://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
                if (status === 1223) {
                    status = 204;
                }
                this._setStatusProperties(status);
                this.header = this.headers = parseHeader(this.xhr.getAllResponseHeaders());
                // getAllResponseHeaders sometimes falsely returns "" for CORS requests, but
                // getResponseHeader still works. so we get content-type even if getting
                // other headers fails.
                this.header['content-type'] = this.xhr.getResponseHeader('content-type');
                this._setHeaderProperties(this.header);

                if (null === this.text && req._responseType) {
                    this.body = this.xhr.response;
                } else {
                    this.body = this.req.method != 'HEAD' ?
                        this._parseBody(this.text ? this.text : this.xhr.response) :
                        null;
                }
            }

            ResponseBase(Response.prototype);

            /**
             * Parse the given body `str`.
             *
             * Used for auto-parsing of bodies. Parsers
             * are defined on the `superagent.parse` object.
             *
             * @param {String} str
             * @return {Mixed}
             * @api private
             */

            Response.prototype._parseBody = function (str) {
                var parse = request.parse[this.type];
                if (this.req._parser) {
                    return this.req._parser(this, str);
                }
                if (!parse && isJSON(this.type)) {
                    parse = request.parse['application/json'];
                }
                return parse && str && (str.length || str instanceof Object) ?
                    parse(str) :
                    null;
            };

            /**
             * Return an `Error` representative of this response.
             *
             * @return {Error}
             * @api public
             */

            Response.prototype.toError = function () {
                var req = this.req;
                var method = req.method;
                var url = req.url;

                var msg = 'cannot ' + method + ' ' + url + ' (' + this.status + ')';
                var err = new Error(msg);
                err.status = this.status;
                err.method = method;
                err.url = url;

                return err;
            };

            /**
             * Expose `Response`.
             */

            request.Response = Response;

            /**
             * Initialize a new `Request` with the given `method` and `url`.
             *
             * @param {String} method
             * @param {String} url
             * @api public
             */

            function Request(method, url) {
                var self = this;
                this._query = this._query || [];
                this.method = method;
                this.url = url;
                this.header = {}; // preserves header name case
                this._header = {}; // coerces header names to lowercase
                this.on('end', function () {
                    var err = null;
                    var res = null;

                    try {
                        res = new Response(self);
                    } catch (e) {
                        err = new Error('Parser is unable to parse the response');
                        err.parse = true;
                        err.original = e;
                        // issue #675: return the raw response if the response parsing fails
                        if (self.xhr) {
                            // ie9 doesn't have 'response' property
                            err.rawResponse = typeof self.xhr.responseType == 'undefined' ? self.xhr.responseText : self.xhr.response;
                            // issue #876: return the http status code if the response parsing fails
                            err.status = self.xhr.status ? self.xhr.status : null;
                            err.statusCode = err.status; // backwards-compat only
                        } else {
                            err.rawResponse = null;
                            err.status = null;
                        }

                        return self.callback(err);
                    }

                    self.emit('response', res);

                    var new_err;
                    try {
                        if (!self._isResponseOK(res)) {
                            new_err = new Error(res.statusText || 'Unsuccessful HTTP response');
                            new_err.original = err;
                            new_err.response = res;
                            new_err.status = res.status;
                        }
                    } catch (e) {
                        new_err = e; // #985 touching res may cause INVALID_STATE_ERR on old Android
                    }

                    // #1000 don't catch errors from the callback to avoid double calling it
                    if (new_err) {
                        self.callback(new_err, res);
                    } else {
                        self.callback(null, res);
                    }
                });
            }

            /**
             * Mixin `Emitter` and `RequestBase`.
             */

            Emitter(Request.prototype);
            RequestBase(Request.prototype);

            /**
             * Set Content-Type to `type`, mapping values from `request.types`.
             *
             * Examples:
             *
             *      superagent.types.xml = 'application/xml';
             *
             *      request.post('/')
             *        .type('xml')
             *        .send(xmlstring)
             *        .end(callback);
             *
             *      request.post('/')
             *        .type('application/xml')
             *        .send(xmlstring)
             *        .end(callback);
             *
             * @param {String} type
             * @return {Request} for chaining
             * @api public
             */

            Request.prototype.type = function (type) {
                this.set('Content-Type', request.types[type] || type);
                return this;
            };

            /**
             * Set Accept to `type`, mapping values from `request.types`.
             *
             * Examples:
             *
             *      superagent.types.json = 'application/json';
             *
             *      request.get('/agent')
             *        .accept('json')
             *        .end(callback);
             *
             *      request.get('/agent')
             *        .accept('application/json')
             *        .end(callback);
             *
             * @param {String} accept
             * @return {Request} for chaining
             * @api public
             */

            Request.prototype.accept = function (type) {
                this.set('Accept', request.types[type] || type);
                return this;
            };

            /**
             * Set Authorization field value with `user` and `pass`.
             *
             * @param {String} user
             * @param {String} [pass] optional in case of using 'bearer' as type
             * @param {Object} options with 'type' property 'auto', 'basic' or 'bearer' (default 'basic')
             * @return {Request} for chaining
             * @api public
             */

            Request.prototype.auth = function (user, pass, options) {
                if (typeof pass === 'object' && pass !== null) { // pass is optional and can substitute for options
                    options = pass;
                }
                if (!options) {
                    options = {
                        type: 'function' === typeof btoa ? 'basic' : 'auto',
                    }
                }

                switch (options.type) {
                    case 'basic':
                        this.set('Authorization', 'Basic ' + btoa(user + ':' + pass));
                        break;

                    case 'auto':
                        this.username = user;
                        this.password = pass;
                        break;

                    case 'bearer': // usage would be .auth(accessToken, { type: 'bearer' })
                        this.set('Authorization', 'Bearer ' + user);
                        break;
                }
                return this;
            };

            /**
             * Add query-string `val`.
             *
             * Examples:
             *
             *   request.get('/shoes')
             *     .query('size=10')
             *     .query({ color: 'blue' })
             *
             * @param {Object|String} val
             * @return {Request} for chaining
             * @api public
             */

            Request.prototype.query = function (val) {
                if ('string' != typeof val) val = serialize(val);
                if (val) this._query.push(val);
                return this;
            };

            /**
             * Queue the given `file` as an attachment to the specified `field`,
             * with optional `options` (or filename).
             *
             * ``` js
             * request.post('/upload')
             *   .attach('content', new Blob(['<a id="a"><b id="b">hey!</b></a>'], { type: "text/html"}))
             *   .end(callback);
             * ```
             *
             * @param {String} field
             * @param {Blob|File} file
             * @param {String|Object} options
             * @return {Request} for chaining
             * @api public
             */

            Request.prototype.attach = function (field, file, options) {
                if (file) {
                    if (this._data) {
                        throw Error("superagent can't mix .send() and .attach()");
                    }

                    this._getFormData().append(field, file, options || file.name);
                }
                return this;
            };

            Request.prototype._getFormData = function () {
                if (!this._formData) {
                    this._formData = new root.FormData();
                }
                return this._formData;
            };

            /**
             * Invoke the callback with `err` and `res`
             * and handle arity check.
             *
             * @param {Error} err
             * @param {Response} res
             * @api private
             */

            Request.prototype.callback = function (err, res) {
                // console.log(this._retries, this._maxRetries)
                if (this._maxRetries && this._retries++ < this._maxRetries && shouldRetry(err, res)) {
                    return this._retry();
                }

                var fn = this._callback;
                this.clearTimeout();

                if (err) {
                    if (this._maxRetries) err.retries = this._retries - 1;
                    this.emit('error', err);
                }

                fn(err, res);
            };

            /**
             * Invoke callback with x-domain error.
             *
             * @api private
             */

            Request.prototype.crossDomainError = function () {
                var err = new Error('Request has been terminated\nPossible causes: the network is offline, Origin is not allowed by Access-Control-Allow-Origin, the page is being unloaded, etc.');
                err.crossDomain = true;

                err.status = this.status;
                err.method = this.method;
                err.url = this.url;

                this.callback(err);
            };

            // This only warns, because the request is still likely to work
            Request.prototype.buffer = Request.prototype.ca = Request.prototype.agent = function () {
                console.warn("This is not supported in browser version of superagent");
                return this;
            };

            // This throws, because it can't send/receive data as expected
            Request.prototype.pipe = Request.prototype.write = function () {
                throw Error("Streaming is not supported in browser version of superagent");
            };

            /**
             * Compose querystring to append to req.url
             *
             * @api private
             */

            Request.prototype._appendQueryString = function () {
                var query = this._query.join('&');
                if (query) {
                    this.url += (this.url.indexOf('?') >= 0 ? '&' : '?') + query;
                }

                if (this._sort) {
                    var index = this.url.indexOf('?');
                    if (index >= 0) {
                        var queryArr = this.url.substring(index + 1).split('&');
                        if (isFunction(this._sort)) {
                            queryArr.sort(this._sort);
                        } else {
                            queryArr.sort();
                        }
                        this.url = this.url.substring(0, index) + '?' + queryArr.join('&');
                    }
                }
            };

            /**
             * Check if `obj` is a host object,
             * we don't want to serialize these :)
             *
             * @param {Object} obj
             * @return {Boolean}
             * @api private
             */
            Request.prototype._isHost = function _isHost(obj) {
                // Native objects stringify to [object File], [object Blob], [object FormData], etc.
                return obj && 'object' === typeof obj && !Array.isArray(obj) && Object.prototype.toString.call(obj) !== '[object Object]';
            }

            /**
             * Initiate request, invoking callback `fn(res)`
             * with an instanceof `Response`.
             *
             * @param {Function} fn
             * @return {Request} for chaining
             * @api public
             */

            Request.prototype.end = function (fn) {
                if (this._endCalled) {
                    console.warn("Warning: .end() was called twice. This is not supported in superagent");
                }
                this._endCalled = true;

                // store callback
                this._callback = fn || noop;

                // querystring
                this._appendQueryString();

                return this._end();
            };

            Request.prototype._end = function () {
                var self = this;
                var xhr = this.xhr = request.getXHR();
                var data = this._formData || this._data;

                this._setTimeouts();

                // state change
                xhr.onreadystatechange = function () {
                    var readyState = xhr.readyState;
                    if (readyState >= 2 && self._responseTimeoutTimer) {
                        clearTimeout(self._responseTimeoutTimer);
                    }
                    if (4 != readyState) {
                        return;
                    }

                    // In IE9, reads to any property (e.g. status) off of an aborted XHR will
                    // result in the error "Could not complete the operation due to error c00c023f"
                    var status;
                    try {
                        status = xhr.status
                    } catch (e) {
                        status = 0;
                    }

                    if (!status) {
                        if (self.timedout || self._aborted) return;
                        return self.crossDomainError();
                    }
                    self.emit('end');
                };

                // progress
                var handleProgress = function (direction, e) {
                    if (e.total > 0) {
                        e.percent = e.loaded / e.total * 100;
                    }
                    e.direction = direction;
                    self.emit('progress', e);
                }
                if (this.hasListeners('progress')) {
                    try {
                        xhr.onprogress = handleProgress.bind(null, 'download');
                        if (xhr.upload) {
                            xhr.upload.onprogress = handleProgress.bind(null, 'upload');
                        }
                    } catch (e) {
                        // Accessing xhr.upload fails in IE from a web worker, so just pretend it doesn't exist.
                        // Reported here:
                        // https://connect.microsoft.com/IE/feedback/details/837245/xmlhttprequest-upload-throws-invalid-argument-when-used-from-web-worker-context
                    }
                }

                // initiate request
                try {
                    if (this.username && this.password) {
                        xhr.open(this.method, this.url, true, this.username, this.password);
                    } else {
                        xhr.open(this.method, this.url, true);
                    }
                } catch (err) {
                    // see #1149
                    return this.callback(err);
                }

                // CORS
                if (this._withCredentials) xhr.withCredentials = true;

                // body
                if (!this._formData && 'GET' != this.method && 'HEAD' != this.method && 'string' != typeof data && !this._isHost(data)) {
                    // serialize stuff
                    var contentType = this._header['content-type'];
                    var serialize = this._serializer || request.serialize[contentType ? contentType.split(';')[0] : ''];
                    if (!serialize && isJSON(contentType)) {
                        serialize = request.serialize['application/json'];
                    }
                    if (serialize) data = serialize(data);
                }

                // set header fields
                for (var field in this.header) {
                    if (null == this.header[field]) continue;

                    if (this.header.hasOwnProperty(field))
                        xhr.setRequestHeader(field, this.header[field]);
                }

                if (this._responseType) {
                    xhr.responseType = this._responseType;
                }

                // send stuff
                this.emit('request', this);

                // IE11 xhr.send(undefined) sends 'undefined' string as POST payload (instead of nothing)
                // We need null here if data is undefined
                xhr.send(typeof data !== 'undefined' ? data : null);
                return this;
            };

            /**
             * GET `url` with optional callback `fn(res)`.
             *
             * @param {String} url
             * @param {Mixed|Function} [data] or fn
             * @param {Function} [fn]
             * @return {Request}
             * @api public
             */

            request.get = function (url, data, fn) {
                var req = request('GET', url);
                if ('function' == typeof data) fn = data, data = null;
                if (data) req.query(data);
                if (fn) req.end(fn);
                return req;
            };

            /**
             * HEAD `url` with optional callback `fn(res)`.
             *
             * @param {String} url
             * @param {Mixed|Function} [data] or fn
             * @param {Function} [fn]
             * @return {Request}
             * @api public
             */

            request.head = function (url, data, fn) {
                var req = request('HEAD', url);
                if ('function' == typeof data) fn = data, data = null;
                if (data) req.send(data);
                if (fn) req.end(fn);
                return req;
            };

            /**
             * OPTIONS query to `url` with optional callback `fn(res)`.
             *
             * @param {String} url
             * @param {Mixed|Function} [data] or fn
             * @param {Function} [fn]
             * @return {Request}
             * @api public
             */

            request.options = function (url, data, fn) {
                var req = request('OPTIONS', url);
                if ('function' == typeof data) fn = data, data = null;
                if (data) req.send(data);
                if (fn) req.end(fn);
                return req;
            };

            /**
             * DELETE `url` with optional `data` and callback `fn(res)`.
             *
             * @param {String} url
             * @param {Mixed} [data]
             * @param {Function} [fn]
             * @return {Request}
             * @api public
             */

            function del(url, data, fn) {
                var req = request('DELETE', url);
                if ('function' == typeof data) fn = data, data = null;
                if (data) req.send(data);
                if (fn) req.end(fn);
                return req;
            };

            request['del'] = del;
            request['delete'] = del;

            /**
             * PATCH `url` with optional `data` and callback `fn(res)`.
             *
             * @param {String} url
             * @param {Mixed} [data]
             * @param {Function} [fn]
             * @return {Request}
             * @api public
             */

            request.patch = function (url, data, fn) {
                var req = request('PATCH', url);
                if ('function' == typeof data) fn = data, data = null;
                if (data) req.send(data);
                if (fn) req.end(fn);
                return req;
            };

            /**
             * POST `url` with optional `data` and callback `fn(res)`.
             *
             * @param {String} url
             * @param {Mixed} [data]
             * @param {Function} [fn]
             * @return {Request}
             * @api public
             */

            request.post = function (url, data, fn) {
                var req = request('POST', url);
                if ('function' == typeof data) fn = data, data = null;
                if (data) req.send(data);
                if (fn) req.end(fn);
                return req;
            };

            /**
             * PUT `url` with optional `data` and callback `fn(res)`.
             *
             * @param {String} url
             * @param {Mixed|Function} [data] or fn
             * @param {Function} [fn]
             * @return {Request}
             * @api public
             */

            request.put = function (url, data, fn) {
                var req = request('PUT', url);
                if ('function' == typeof data) fn = data, data = null;
                if (data) req.send(data);
                if (fn) req.end(fn);
                return req;
            };

}, {
            "./is-function": 3,
            "./is-object": 4,
            "./request-base": 5,
            "./response-base": 6,
            "./should-retry": 7,
            "component-emitter": 1
        }],
        3: [function (require, module, exports) {
            /**
             * Check if `fn` is a function.
             *
             * @param {Function} fn
             * @return {Boolean}
             * @api private
             */
            var isObject = require('./is-object');

            function isFunction(fn) {
                var tag = isObject(fn) ? Object.prototype.toString.call(fn) : '';
                return tag === '[object Function]';
            }

            module.exports = isFunction;

}, {
            "./is-object": 4
        }],
        4: [function (require, module, exports) {
            /**
             * Check if `obj` is an object.
             *
             * @param {Object} obj
             * @return {Boolean}
             * @api private
             */

            function isObject(obj) {
                return null !== obj && 'object' === typeof obj;
            }

            module.exports = isObject;

}, {}],
        5: [function (require, module, exports) {
            /**
             * Module of mixed-in functions shared between node and client code
             */
            var isObject = require('./is-object');

            /**
             * Expose `RequestBase`.
             */

            module.exports = RequestBase;

            /**
             * Initialize a new `RequestBase`.
             *
             * @api public
             */

            function RequestBase(obj) {
                if (obj) return mixin(obj);
            }

            /**
             * Mixin the prototype properties.
             *
             * @param {Object} obj
             * @return {Object}
             * @api private
             */

            function mixin(obj) {
                for (var key in RequestBase.prototype) {
                    obj[key] = RequestBase.prototype[key];
                }
                return obj;
            }

            /**
             * Clear previous timeout.
             *
             * @return {Request} for chaining
             * @api public
             */

            RequestBase.prototype.clearTimeout = function _clearTimeout() {
                clearTimeout(this._timer);
                clearTimeout(this._responseTimeoutTimer);
                delete this._timer;
                delete this._responseTimeoutTimer;
                return this;
            };

            /**
             * Override default response body parser
             *
             * This function will be called to convert incoming data into request.body
             *
             * @param {Function}
             * @api public
             */

            RequestBase.prototype.parse = function parse(fn) {
                this._parser = fn;
                return this;
            };

            /**
             * Set format of binary response body.
             * In browser valid formats are 'blob' and 'arraybuffer',
             * which return Blob and ArrayBuffer, respectively.
             *
             * In Node all values result in Buffer.
             *
             * Examples:
             *
             *      req.get('/')
             *        .responseType('blob')
             *        .end(callback);
             *
             * @param {String} val
             * @return {Request} for chaining
             * @api public
             */

            RequestBase.prototype.responseType = function (val) {
                this._responseType = val;
                return this;
            };

            /**
             * Override default request body serializer
             *
             * This function will be called to convert data set via .send or .attach into payload to send
             *
             * @param {Function}
             * @api public
             */

            RequestBase.prototype.serialize = function serialize(fn) {
                this._serializer = fn;
                return this;
            };

            /**
             * Set timeouts.
             *
             * - response timeout is time between sending request and receiving the first byte of the response. Includes DNS and connection time.
             * - deadline is the time from start of the request to receiving response body in full. If the deadline is too short large files may not load at all on slow connections.
             *
             * Value of 0 or false means no timeout.
             *
             * @param {Number|Object} ms or {response, read, deadline}
             * @return {Request} for chaining
             * @api public
             */

            RequestBase.prototype.timeout = function timeout(options) {
                if (!options || 'object' !== typeof options) {
                    this._timeout = options;
                    this._responseTimeout = 0;
                    return this;
                }

                for (var option in options) {
                    switch (option) {
                        case 'deadline':
                            this._timeout = options.deadline;
                            break;
                        case 'response':
                            this._responseTimeout = options.response;
                            break;
                        default:
                            console.warn("Unknown timeout option", option);
                    }
                }
                return this;
            };

            /**
             * Set number of retry attempts on error.
             *
             * Failed requests will be retried 'count' times if timeout or err.code >= 500.
             *
             * @param {Number} count
             * @return {Request} for chaining
             * @api public
             */

            RequestBase.prototype.retry = function retry(count) {
                // Default to 1 if no count passed or true
                if (arguments.length === 0 || count === true) count = 1;
                if (count <= 0) count = 0;
                this._maxRetries = count;
                this._retries = 0;
                return this;
            };

            /**
             * Retry request
             *
             * @return {Request} for chaining
             * @api private
             */

            RequestBase.prototype._retry = function () {
                this.clearTimeout();

                // node
                if (this.req) {
                    this.req = null;
                    this.req = this.request();
                }

                this._aborted = false;
                this.timedout = false;

                return this._end();
            };

            /**
             * Promise support
             *
             * @param {Function} resolve
             * @param {Function} [reject]
             * @return {Request}
             */

            RequestBase.prototype.then = function then(resolve, reject) {
                if (!this._fullfilledPromise) {
                    var self = this;
                    if (this._endCalled) {
                        console.warn("Warning: superagent request was sent twice, because both .end() and .then() were called. Never call .end() if you use promises");
                    }
                    this._fullfilledPromise = new Promise(function (innerResolve, innerReject) {
                        self.end(function (err, res) {
                            if (err) innerReject(err);
                            else innerResolve(res);
                        });
                    });
                }
                return this._fullfilledPromise.then(resolve, reject);
            }

            RequestBase.prototype.catch = function (cb) {
                return this.then(undefined, cb);
            };

            /**
             * Allow for extension
             */

            RequestBase.prototype.use = function use(fn) {
                fn(this);
                return this;
            }

            RequestBase.prototype.ok = function (cb) {
                if ('function' !== typeof cb) throw Error("Callback required");
                this._okCallback = cb;
                return this;
            };

            RequestBase.prototype._isResponseOK = function (res) {
                if (!res) {
                    return false;
                }

                if (this._okCallback) {
                    return this._okCallback(res);
                }

                return res.status >= 200 && res.status < 300;
            };


            /**
             * Get request header `field`.
             * Case-insensitive.
             *
             * @param {String} field
             * @return {String}
             * @api public
             */

            RequestBase.prototype.get = function (field) {
                return this._header[field.toLowerCase()];
            };

            /**
             * Get case-insensitive header `field` value.
             * This is a deprecated internal API. Use `.get(field)` instead.
             *
             * (getHeader is no longer used internally by the superagent code base)
             *
             * @param {String} field
             * @return {String}
             * @api private
             * @deprecated
             */

            RequestBase.prototype.getHeader = RequestBase.prototype.get;

            /**
             * Set header `field` to `val`, or multiple fields with one object.
             * Case-insensitive.
             *
             * Examples:
             *
             *      req.get('/')
             *        .set('Accept', 'application/json')
             *        .set('X-API-Key', 'foobar')
             *        .end(callback);
             *
             *      req.get('/')
             *        .set({ Accept: 'application/json', 'X-API-Key': 'foobar' })
             *        .end(callback);
             *
             * @param {String|Object} field
             * @param {String} val
             * @return {Request} for chaining
             * @api public
             */

            RequestBase.prototype.set = function (field, val) {
                if (isObject(field)) {
                    for (var key in field) {
                        this.set(key, field[key]);
                    }
                    return this;
                }
                this._header[field.toLowerCase()] = val;
                this.header[field] = val;
                return this;
            };

            /**
             * Remove header `field`.
             * Case-insensitive.
             *
             * Example:
             *
             *      req.get('/')
             *        .unset('User-Agent')
             *        .end(callback);
             *
             * @param {String} field
             */
            RequestBase.prototype.unset = function (field) {
                delete this._header[field.toLowerCase()];
                delete this.header[field];
                return this;
            };

            /**
             * Write the field `name` and `val`, or multiple fields with one object
             * for "multipart/form-data" request bodies.
             *
             * ``` js
             * request.post('/upload')
             *   .field('foo', 'bar')
             *   .end(callback);
             *
             * request.post('/upload')
             *   .field({ foo: 'bar', baz: 'qux' })
             *   .end(callback);
             * ```
             *
             * @param {String|Object} name
             * @param {String|Blob|File|Buffer|fs.ReadStream} val
             * @return {Request} for chaining
             * @api public
             */
            RequestBase.prototype.field = function (name, val) {

                // name should be either a string or an object.
                if (null === name || undefined === name) {
                    throw new Error('.field(name, val) name can not be empty');
                }

                if (this._data) {
                    console.error(".field() can't be used if .send() is used. Please use only .send() or only .field() & .attach()");
                }

                if (isObject(name)) {
                    for (var key in name) {
                        this.field(key, name[key]);
                    }
                    return this;
                }

                if (Array.isArray(val)) {
                    for (var i in val) {
                        this.field(name, val[i]);
                    }
                    return this;
                }

                // val should be defined now
                if (null === val || undefined === val) {
                    throw new Error('.field(name, val) val can not be empty');
                }
                if ('boolean' === typeof val) {
                    val = '' + val;
                }
                this._getFormData().append(name, val);
                return this;
            };

            /**
             * Abort the request, and clear potential timeout.
             *
             * @return {Request}
             * @api public
             */
            RequestBase.prototype.abort = function () {
                if (this._aborted) {
                    return this;
                }
                this._aborted = true;
                this.xhr && this.xhr.abort(); // browser
                this.req && this.req.abort(); // node
                this.clearTimeout();
                this.emit('abort');
                return this;
            };

            /**
             * Enable transmission of cookies with x-domain requests.
             *
             * Note that for this to work the origin must not be
             * using "Access-Control-Allow-Origin" with a wildcard,
             * and also must set "Access-Control-Allow-Credentials"
             * to "true".
             *
             * @api public
             */

            RequestBase.prototype.withCredentials = function (on) {
                // This is browser-only functionality. Node side is no-op.
                if (on == undefined) on = true;
                this._withCredentials = on;
                return this;
            };

            /**
             * Set the max redirects to `n`. Does noting in browser XHR implementation.
             *
             * @param {Number} n
             * @return {Request} for chaining
             * @api public
             */

            RequestBase.prototype.redirects = function (n) {
                this._maxRedirects = n;
                return this;
            };

            /**
             * Convert to a plain javascript object (not JSON string) of scalar properties.
             * Note as this method is designed to return a useful non-this value,
             * it cannot be chained.
             *
             * @return {Object} describing method, url, and data of this request
             * @api public
             */

            RequestBase.prototype.toJSON = function () {
                return {
                    method: this.method,
                    url: this.url,
                    data: this._data,
                    headers: this._header
                };
            };


            /**
             * Send `data` as the request body, defaulting the `.type()` to "json" when
             * an object is given.
             *
             * Examples:
             *
             *       // manual json
             *       request.post('/user')
             *         .type('json')
             *         .send('{"name":"tj"}')
             *         .end(callback)
             *
             *       // auto json
             *       request.post('/user')
             *         .send({ name: 'tj' })
             *         .end(callback)
             *
             *       // manual x-www-form-urlencoded
             *       request.post('/user')
             *         .type('form')
             *         .send('name=tj')
             *         .end(callback)
             *
             *       // auto x-www-form-urlencoded
             *       request.post('/user')
             *         .type('form')
             *         .send({ name: 'tj' })
             *         .end(callback)
             *
             *       // defaults to x-www-form-urlencoded
             *      request.post('/user')
             *        .send('name=tobi')
             *        .send('species=ferret')
             *        .end(callback)
             *
             * @param {String|Object} data
             * @return {Request} for chaining
             * @api public
             */

            RequestBase.prototype.send = function (data) {
                var isObj = isObject(data);
                var type = this._header['content-type'];

                if (this._formData) {
                    console.error(".send() can't be used if .attach() or .field() is used. Please use only .send() or only .field() & .attach()");
                }

                if (isObj && !this._data) {
                    if (Array.isArray(data)) {
                        this._data = [];
                    } else if (!this._isHost(data)) {
                        this._data = {};
                    }
                } else if (data && this._data && this._isHost(this._data)) {
                    throw Error("Can't merge these send calls");
                }

                // merge
                if (isObj && isObject(this._data)) {
                    for (var key in data) {
                        this._data[key] = data[key];
                    }
                } else if ('string' == typeof data) {
                    // default to x-www-form-urlencoded
                    if (!type) this.type('form');
                    type = this._header['content-type'];
                    if ('application/x-www-form-urlencoded' == type) {
                        this._data = this._data ?
                            this._data + '&' + data :
                            data;
                    } else {
                        this._data = (this._data || '') + data;
                    }
                } else {
                    this._data = data;
                }

                if (!isObj || this._isHost(data)) {
                    return this;
                }

                // default to json
                if (!type) this.type('json');
                return this;
            };


            /**
             * Sort `querystring` by the sort function
             *
             *
             * Examples:
             *
             *       // default order
             *       request.get('/user')
             *         .query('name=Nick')
             *         .query('search=Manny')
             *         .sortQuery()
             *         .end(callback)
             *
             *       // customized sort function
             *       request.get('/user')
             *         .query('name=Nick')
             *         .query('search=Manny')
             *         .sortQuery(function(a, b){
             *           return a.length - b.length;
             *         })
             *         .end(callback)
             *
             *
             * @param {Function} sort
             * @return {Request} for chaining
             * @api public
             */

            RequestBase.prototype.sortQuery = function (sort) {
                // _sort default to true but otherwise can be a function or boolean
                this._sort = typeof sort === 'undefined' ? true : sort;
                return this;
            };

            /**
             * Invoke callback with timeout error.
             *
             * @api private
             */

            RequestBase.prototype._timeoutError = function (reason, timeout, errno) {
                if (this._aborted) {
                    return;
                }
                var err = new Error(reason + timeout + 'ms exceeded');
                err.timeout = timeout;
                err.code = 'ECONNABORTED';
                err.errno = errno;
                this.timedout = true;
                this.abort();
                this.callback(err);
            };

            RequestBase.prototype._setTimeouts = function () {
                var self = this;

                // deadline
                if (this._timeout && !this._timer) {
                    this._timer = setTimeout(function () {
                        self._timeoutError('Timeout of ', self._timeout, 'ETIME');
                    }, this._timeout);
                }
                // response timeout
                if (this._responseTimeout && !this._responseTimeoutTimer) {
                    this._responseTimeoutTimer = setTimeout(function () {
                        self._timeoutError('Response timeout of ', self._responseTimeout, 'ETIMEDOUT');
                    }, this._responseTimeout);
                }
            }

}, {
            "./is-object": 4
        }],
        6: [function (require, module, exports) {

            /**
             * Module dependencies.
             */

            var utils = require('./utils');

            /**
             * Expose `ResponseBase`.
             */

            module.exports = ResponseBase;

            /**
             * Initialize a new `ResponseBase`.
             *
             * @api public
             */

            function ResponseBase(obj) {
                if (obj) return mixin(obj);
            }

            /**
             * Mixin the prototype properties.
             *
             * @param {Object} obj
             * @return {Object}
             * @api private
             */

            function mixin(obj) {
                for (var key in ResponseBase.prototype) {
                    obj[key] = ResponseBase.prototype[key];
                }
                return obj;
            }

            /**
             * Get case-insensitive `field` value.
             *
             * @param {String} field
             * @return {String}
             * @api public
             */

            ResponseBase.prototype.get = function (field) {
                return this.header[field.toLowerCase()];
            };

            /**
             * Set header related properties:
             *
             *   - `.type` the content type without params
             *
             * A response of "Content-Type: text/plain; charset=utf-8"
             * will provide you with a `.type` of "text/plain".
             *
             * @param {Object} header
             * @api private
             */

            ResponseBase.prototype._setHeaderProperties = function (header) {
                // TODO: moar!
                // TODO: make this a util

                // content-type
                var ct = header['content-type'] || '';
                this.type = utils.type(ct);

                // params
                var params = utils.params(ct);
                for (var key in params) this[key] = params[key];

                this.links = {};

                // links
                try {
                    if (header.link) {
                        this.links = utils.parseLinks(header.link);
                    }
                } catch (err) {
                    // ignore
                }
            };

            /**
             * Set flags such as `.ok` based on `status`.
             *
             * For example a 2xx response will give you a `.ok` of __true__
             * whereas 5xx will be __false__ and `.error` will be __true__. The
             * `.clientError` and `.serverError` are also available to be more
             * specific, and `.statusType` is the class of error ranging from 1..5
             * sometimes useful for mapping respond colors etc.
             *
             * "sugar" properties are also defined for common cases. Currently providing:
             *
             *   - .noContent
             *   - .badRequest
             *   - .unauthorized
             *   - .notAcceptable
             *   - .notFound
             *
             * @param {Number} status
             * @api private
             */

            ResponseBase.prototype._setStatusProperties = function (status) {
                var type = status / 100 | 0;

                // status / class
                this.status = this.statusCode = status;
                this.statusType = type;

                // basics
                this.info = 1 == type;
                this.ok = 2 == type;
                this.redirect = 3 == type;
                this.clientError = 4 == type;
                this.serverError = 5 == type;
                this.error = (4 == type || 5 == type) ?
                    this.toError() :
                    false;

                // sugar
                this.accepted = 202 == status;
                this.noContent = 204 == status;
                this.badRequest = 400 == status;
                this.unauthorized = 401 == status;
                this.notAcceptable = 406 == status;
                this.forbidden = 403 == status;
                this.notFound = 404 == status;
            };

}, {
            "./utils": 8
        }],
        7: [function (require, module, exports) {
            var ERROR_CODES = [
  'ECONNRESET',
  'ETIMEDOUT',
  'EADDRINFO',
  'ESOCKETTIMEDOUT'
];

            /**
             * Determine if a request should be retried.
             * (Borrowed from segmentio/superagent-retry)
             *
             * @param {Error} err
             * @param {Response} [res]
             * @returns {Boolean}
             */
            module.exports = function shouldRetry(err, res) {
                if (err && err.code && ~ERROR_CODES.indexOf(err.code)) return true;
                if (res && res.status && res.status >= 500) return true;
                // Superagent timeout
                if (err && 'timeout' in err && err.code == 'ECONNABORTED') return true;
                if (err && 'crossDomain' in err) return true;
                return false;
            };

}, {}],
        8: [function (require, module, exports) {

            /**
             * Return the mime type for the given `str`.
             *
             * @param {String} str
             * @return {String}
             * @api private
             */

            exports.type = function (str) {
                return str.split(/ *; */).shift();
            };

            /**
             * Return header field parameters.
             *
             * @param {String} str
             * @return {Object}
             * @api private
             */

            exports.params = function (str) {
                return str.split(/ *; */).reduce(function (obj, str) {
                    var parts = str.split(/ *= */);
                    var key = parts.shift();
                    var val = parts.shift();

                    if (key && val) obj[key] = val;
                    return obj;
                }, {});
            };

            /**
             * Parse Link header fields.
             *
             * @param {String} str
             * @return {Object}
             * @api private
             */

            exports.parseLinks = function (str) {
                return str.split(/ *, */).reduce(function (obj, str) {
                    var parts = str.split(/ *; */);
                    var url = parts[0].slice(1, -1);
                    var rel = parts[1].split(/ *= */)[1].slice(1, -1);
                    obj[rel] = url;
                    return obj;
                }, {});
            };

            /**
             * Strip content related fields from `header`.
             *
             * @param {Object} header
             * @return {Object} header
             * @api private
             */

            exports.cleanHeader = function (header, shouldStripCookie) {
                delete header['content-type'];
                delete header['content-length'];
                delete header['transfer-encoding'];
                delete header['host'];
                if (shouldStripCookie) {
                    delete header['cookie'];
                }
                return header;
            };
}, {}],
        9: [function (require, module, exports) {
            (function (Buffer) {
                /**
                 * The Blue Alliance API v3
                 * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
                 *
                 * OpenAPI spec version: 3.0.4
                 *
                 * NOTE: This class is auto generated by the swagger code generator program.
                 * https://github.com/swagger-api/swagger-codegen.git
                 *
                 * Swagger Codegen version: 2.2.3
                 *
                 * Do not edit the class manually.
                 *
                 */

                (function (root, factory) {
                    if (typeof define === 'function' && define.amd) {
                        // AMD. Register as an anonymous module.
                        define(['superagent', 'querystring'], factory);
                    } else if (typeof module === 'object' && module.exports) {
                        // CommonJS-like environments that support module.exports, like Node.
                        module.exports = factory(require('superagent'), require('querystring'));
                    } else {
                        // Browser globals (root is window)
                        if (!root.TbaApiV3client) {
                            root.TbaApiV3client = {};
                        }
                        root.TbaApiV3client.ApiClient = factory(root.superagent, root.querystring);
                    }
                }(this, function (superagent, querystring) {
                    'use strict';

                    /**
                     * @module TBAAPI.Client/ApiClient
                     * @version 3.0.4
                     */

                    /**
                     * Manages low level client-server communications, parameter marshalling, etc. There should not be any need for an
                     * application to use this class directly - the *Api and model classes provide the public API for the service. The
                     * contents of this file should be regarded as internal but are documented for completeness.
                     * @alias module:TBAAPI.Client/ApiClient
                     * @class
                     */
                    var exports = function () {
                        /**
                         * The base URL against which to resolve every API call's (relative) path.
                         * @type {String}
                         * @default https://www.thebluealliance.com/api/v3
                         */
                        this.basePath = 'https://www.thebluealliance.com/api/v3'.replace(/\/+$/, '');

                        /**
                         * The authentication methods to be included for all API calls.
                         * @type {Array.<String>}
                         */
                        this.authentications = {
                            'apiKey': {
                                type: 'apiKey',
                                'in': 'header',
                                name: 'X-TBA-Auth-Key'
                            }
                        };
                        /**
                         * The default HTTP headers to be included for all API calls.
                         * @type {Array.<String>}
                         * @default {}
                         */
                        this.defaultHeaders = {};

                        /**
                         * The default HTTP timeout for all API calls.
                         * @type {Number}
                         * @default 60000
                         */
                        this.timeout = 60000;

                        /**
                         * If set to false an additional timestamp parameter is added to all API GET calls to
                         * prevent browser caching
                         * @type {Boolean}
                         * @default true
                         */
                        this.cache = true;

                        /**
                         * If set to true, the client will save the cookies from each server
                         * response, and return them in the next request.
                         * @default false
                         */
                        this.enableCookies = false;

                        /*
                         * Used to save and return cookies in a node.js (non-browser) setting,
                         * if this.enableCookies is set to true.
                         */
                        if (typeof window === 'undefined') {
                            this.agent = new superagent.agent();
                        }

                    };

                    /**
                     * Returns a string representation for an actual parameter.
                     * @param param The actual parameter.
                     * @returns {String} The string representation of <code>param</code>.
                     */
                    exports.prototype.paramToString = function (param) {
                        if (param == undefined || param == null) {
                            return '';
                        }
                        if (param instanceof Date) {
                            return param.toJSON();
                        }
                        return param.toString();
                    };

                    /**
                     * Builds full URL by appending the given path to the base URL and replacing path parameter place-holders with parameter values.
                     * NOTE: query parameters are not handled here.
                     * @param {String} path The path to append to the base URL.
                     * @param {Object} pathParams The parameter values to append.
                     * @returns {String} The encoded path with parameter values substituted.
                     */
                    exports.prototype.buildUrl = function (path, pathParams) {
                        if (!path.match(/^\//)) {
                            path = '/' + path;
                        }
                        var url = this.basePath + path;
                        var _this = this;
                        url = url.replace(/\{([\w-]+)\}/g, function (fullMatch, key) {
                            var value;
                            if (pathParams.hasOwnProperty(key)) {
                                value = _this.paramToString(pathParams[key]);
                            } else {
                                value = fullMatch;
                            }
                            return encodeURIComponent(value);
                        });
                        return url;
                    };

                    /**
                     * Checks whether the given content type represents JSON.<br>
                     * JSON content type examples:<br>
                     * <ul>
                     * <li>application/json</li>
                     * <li>application/json; charset=UTF8</li>
                     * <li>APPLICATION/JSON</li>
                     * </ul>
                     * @param {String} contentType The MIME content type to check.
                     * @returns {Boolean} <code>true</code> if <code>contentType</code> represents JSON, otherwise <code>false</code>.
                     */
                    exports.prototype.isJsonMime = function (contentType) {
                        return Boolean(contentType != null && contentType.match(/^application\/json(;.*)?$/i));
                    };

                    /**
                     * Chooses a content type from the given array, with JSON preferred; i.e. return JSON if included, otherwise return the first.
                     * @param {Array.<String>} contentTypes
                     * @returns {String} The chosen content type, preferring JSON.
                     */
                    exports.prototype.jsonPreferredMime = function (contentTypes) {
                        for (var i = 0; i < contentTypes.length; i++) {
                            if (this.isJsonMime(contentTypes[i])) {
                                return contentTypes[i];
                            }
                        }
                        return contentTypes[0];
                    };

                    /**
                     * Checks whether the given parameter value represents file-like content.
                     * @param param The parameter to check.
                     * @returns {Boolean} <code>true</code> if <code>param</code> represents a file.
                     */
                    exports.prototype.isFileParam = function (param) {
                        // fs.ReadStream in Node.js and Electron (but not in runtime like browserify)
                        if (typeof require === 'function') {
                            var fs;
                            try {
                                fs = require('fs');
                            } catch (err) {}
                            if (fs && fs.ReadStream && param instanceof fs.ReadStream) {
                                return true;
                            }
                        }
                        // Buffer in Node.js
                        if (typeof Buffer === 'function' && param instanceof Buffer) {
                            return true;
                        }
                        // Blob in browser
                        if (typeof Blob === 'function' && param instanceof Blob) {
                            return true;
                        }
                        // File in browser (it seems File object is also instance of Blob, but keep this for safe)
                        if (typeof File === 'function' && param instanceof File) {
                            return true;
                        }
                        return false;
                    };

                    /**
                     * Normalizes parameter values:
                     * <ul>
                     * <li>remove nils</li>
                     * <li>keep files and arrays</li>
                     * <li>format to string with `paramToString` for other cases</li>
                     * </ul>
                     * @param {Object.<String, Object>} params The parameters as object properties.
                     * @returns {Object.<String, Object>} normalized parameters.
                     */
                    exports.prototype.normalizeParams = function (params) {
                        var newParams = {};
                        for (var key in params) {
                            if (params.hasOwnProperty(key) && params[key] != undefined && params[key] != null) {
                                var value = params[key];
                                if (this.isFileParam(value) || Array.isArray(value)) {
                                    newParams[key] = value;
                                } else {
                                    newParams[key] = this.paramToString(value);
                                }
                            }
                        }
                        return newParams;
                    };

                    /**
                     * Enumeration of collection format separator strategies.
                     * @enum {String}
                     * @readonly
                     */
                    exports.CollectionFormatEnum = {
                        /**
                         * Comma-separated values. Value: <code>csv</code>
                         * @const
                         */
                        CSV: ',',
                        /**
                         * Space-separated values. Value: <code>ssv</code>
                         * @const
                         */
                        SSV: ' ',
                        /**
                         * Tab-separated values. Value: <code>tsv</code>
                         * @const
                         */
                        TSV: '\t',
                        /**
                         * Pipe(|)-separated values. Value: <code>pipes</code>
                         * @const
                         */
                        PIPES: '|',
                        /**
                         * Native array. Value: <code>multi</code>
                         * @const
                         */
                        MULTI: 'multi'
                    };

                    /**
                     * Builds a string representation of an array-type actual parameter, according to the given collection format.
                     * @param {Array} param An array parameter.
                     * @param {module:TBAAPI.Client/ApiClient.CollectionFormatEnum} collectionFormat The array element separator strategy.
                     * @returns {String|Array} A string representation of the supplied collection, using the specified delimiter. Returns
                     * <code>param</code> as is if <code>collectionFormat</code> is <code>multi</code>.
                     */
                    exports.prototype.buildCollectionParam = function buildCollectionParam(param, collectionFormat) {
                        if (param == null) {
                            return null;
                        }
                        switch (collectionFormat) {
                            case 'csv':
                                return param.map(this.paramToString).join(',');
                            case 'ssv':
                                return param.map(this.paramToString).join(' ');
                            case 'tsv':
                                return param.map(this.paramToString).join('\t');
                            case 'pipes':
                                return param.map(this.paramToString).join('|');
                            case 'multi':
                                // return the array directly as SuperAgent will handle it as expected
                                return param.map(this.paramToString);
                            default:
                                throw new Error('Unknown collection format: ' + collectionFormat);
                        }
                    };

                    /**
                     * Applies authentication headers to the request.
                     * @param {Object} request The request object created by a <code>superagent()</code> call.
                     * @param {Array.<String>} authNames An array of authentication method names.
                     */
                    exports.prototype.applyAuthToRequest = function (request, authNames) {
                        var _this = this;
                        authNames.forEach(function (authName) {
                            var auth = _this.authentications[authName];
                            switch (auth.type) {
                                case 'basic':
                                    if (auth.username || auth.password) {
                                        request.auth(auth.username || '', auth.password || '');
                                    }
                                    break;
                                case 'apiKey':
                                    if (auth.apiKey) {
                                        var data = {};
                                        if (auth.apiKeyPrefix) {
                                            data[auth.name] = auth.apiKeyPrefix + ' ' + auth.apiKey;
                                        } else {
                                            data[auth.name] = auth.apiKey;
                                        }
                                        if (auth['in'] === 'header') {
                                            request.set(data);
                                        } else {
                                            request.query(data);
                                        }
                                    }
                                    break;
                                case 'oauth2':
                                    if (auth.accessToken) {
                                        request.set({
                                            'Authorization': 'Bearer ' + auth.accessToken
                                        });
                                    }
                                    break;
                                default:
                                    throw new Error('Unknown authentication type: ' + auth.type);
                            }
                        });
                    };

                    /**
                     * Deserializes an HTTP response body into a value of the specified type.
                     * @param {Object} response A SuperAgent response object.
                     * @param {(String|Array.<String>|Object.<String, Object>|Function)} returnType The type to return. Pass a string for simple types
                     * or the constructor function for a complex type. Pass an array containing the type name to return an array of that type. To
                     * return an object, pass an object with one property whose name is the key type and whose value is the corresponding value type:
                     * all properties on <code>data<code> will be converted to this type.
                     * @returns A value of the specified type.
                     */
                    exports.prototype.deserialize = function deserialize(response, returnType) {
                        if (response == null || returnType == null || response.status == 204) {
                            return null;
                        }
                        // Rely on SuperAgent for parsing response body.
                        // See http://visionmedia.github.io/superagent/#parsing-response-bodies
                        var data = response.body;
                        if (data == null || (typeof data === 'object' && typeof data.length === 'undefined' && !Object.keys(data).length)) {
                            // SuperAgent does not always produce a body; use the unparsed response as a fallback
                            data = response.text;
                        }
                        return exports.convertToType(data, returnType);
                    };

                    /**
                     * Callback function to receive the result of the operation.
                     * @callback module:TBAAPI.Client/ApiClient~callApiCallback
                     * @param {String} error Error message, if any.
                     * @param data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Invokes the REST service using the supplied settings and parameters.
                     * @param {String} path The base URL to invoke.
                     * @param {String} httpMethod The HTTP method to use.
                     * @param {Object.<String, String>} pathParams A map of path parameters and their values.
                     * @param {Object.<String, Object>} queryParams A map of query parameters and their values.
                     * @param {Object.<String, Object>} headerParams A map of header parameters and their values.
                     * @param {Object.<String, Object>} formParams A map of form parameters and their values.
                     * @param {Object} bodyParam The value to pass as the request body.
                     * @param {Array.<String>} authNames An array of authentication type names.
                     * @param {Array.<String>} contentTypes An array of request MIME types.
                     * @param {Array.<String>} accepts An array of acceptable response MIME types.
                     * @param {(String|Array|ObjectFunction)} returnType The required type to return; can be a string for simple types or the
                     * constructor for a complex type.
                     * @param {module:TBAAPI.Client/ApiClient~callApiCallback} callback The callback function.
                     * @returns {Object} The SuperAgent request object.
                     */
                    exports.prototype.callApi = function callApi(path, httpMethod, pathParams,
                        queryParams, headerParams, formParams, bodyParam, authNames, contentTypes, accepts,
                        returnType, callback) {

                        var _this = this;
                        var url = this.buildUrl(path, pathParams);
                        var request = superagent(httpMethod, url);

                        // apply authentications
                        this.applyAuthToRequest(request, authNames);

                        // set query parameters
                        if (httpMethod.toUpperCase() === 'GET' && this.cache === false) {
                            queryParams['_'] = new Date().getTime();
                        }
                        request.query(this.normalizeParams(queryParams));

                        // set header parameters
                        request.set(this.defaultHeaders).set(this.normalizeParams(headerParams));

                        // set request timeout
                        request.timeout(this.timeout);

                        /*  var contentType = this.jsonPreferredMime(contentTypes);
                        if (contentType) {
                            // Issue with superagent and multipart/form-data (https://github.com/visionmedia/superagent/issues/746)
                            if (contentType != 'multipart/form-data') {
                                request.type(contentType);
                            }
                        } else if (!request.header['Content-Type']) {
                            request.type('application/json');
                        }

                        if (contentType === 'application/x-www-form-urlencoded') {
                            request.send(querystring.stringify(this.normalizeParams(formParams)));
                        } else if (contentType == 'multipart/form-data') {
                            var _formParams = this.normalizeParams(formParams);
                            for (var key in _formParams) {
                                if (_formParams.hasOwnProperty(key)) {
                                    if (this.isFileParam(_formParams[key])) {
                                        // file field
                                        request.attach(key, _formParams[key]);
                                    } else {
                                        request.field(key, _formParams[key]);
                                    }
                                }
                            }
                        } else if (bodyParam) {
                            request.send(bodyParam);
                        }*/

                        var accept = this.jsonPreferredMime(accepts);
                        if (accept) {
                            request.accept(accept);
                        }

                        if (returnType === 'Blob') {
                            request.responseType('blob');
                        } else if (returnType === 'String') {
                            request.responseType('string');
                        }

                        // Attach previously saved cookies, if enabled
                        if (this.enableCookies) {
                            if (typeof window === 'undefined') {
                                this.agent.attachCookies(request);
                            } else {
                                request.withCredentials();
                            }
                        }


                        request.end(function (error, response) {
                            if (callback) {
                                var data = null;
                                if (!error) {
                                    try {
                                        data = _this.deserialize(response, returnType);
                                        if (_this.enableCookies && typeof window === 'undefined') {
                                            _this.agent.saveCookies(response);
                                        }
                                    } catch (err) {
                                        error = err;
                                    }
                                }
                                callback(error, data, response);
                            }
                        });

                        return request;
                    };

                    /**
                     * Parses an ISO-8601 string representation of a date value.
                     * @param {String} str The date value as a string.
                     * @returns {Date} The parsed date object.
                     */
                    exports.parseDate = function (str) {
                        return new Date(str.replace(/T/i, ' '));
                    };

                    /**
                     * Converts a value to the specified type.
                     * @param {(String|Object)} data The data to convert, as a string or object.
                     * @param {(String|Array.<String>|Object.<String, Object>|Function)} type The type to return. Pass a string for simple types
                     * or the constructor function for a complex type. Pass an array containing the type name to return an array of that type. To
                     * return an object, pass an object with one property whose name is the key type and whose value is the corresponding value type:
                     * all properties on <code>data<code> will be converted to this type.
                     * @returns An instance of the specified type or null or undefined if data is null or undefined.
                     */
                    exports.convertToType = function (data, type) {
                        if (data === null || data === undefined)
                            return data

                        switch (type) {
                            case 'Boolean':
                                return Boolean(data);
                            case 'Integer':
                                return parseInt(data, 10);
                            case 'Number':
                                return parseFloat(data);
                            case 'String':
                                return String(data);
                            case 'Date':
                                return this.parseDate(String(data));
                            case 'Blob':
                                return data;
                            default:
                                if (type === Object) {
                                    // generic object, return directly
                                    return data;
                                } else if (typeof type === 'function') {
                                    // for model type like: User
                                    return type.constructFromObject(data);
                                } else if (Array.isArray(type)) {
                                    // for array type like: ['String']
                                    var itemType = type[0];
                                    return data.map(function (item) {
                                        return exports.convertToType(item, itemType);
                                    });
                                } else if (typeof type === 'object') {
                                    // for plain object type like: {'String': 'Integer'}
                                    var keyType, valueType;
                                    for (var k in type) {
                                        if (type.hasOwnProperty(k)) {
                                            keyType = k;
                                            valueType = type[k];
                                            break;
                                        }
                                    }
                                    var result = {};
                                    for (var k in data) {
                                        if (data.hasOwnProperty(k)) {
                                            var key = exports.convertToType(k, keyType);
                                            var value = exports.convertToType(data[k], valueType);
                                            result[key] = value;
                                        }
                                    }
                                    return result;
                                } else {
                                    // for unknown type, return the data directly
                                    return data;
                                }
                        }
                    };

                    /**
                     * Constructs a new map or array model from REST data.
                     * @param data {Object|Array} The REST data.
                     * @param obj {Object|Array} The target object or array.
                     */
                    exports.constructFromObject = function (data, obj, itemType) {
                        if (Array.isArray(data)) {
                            for (var i = 0; i < data.length; i++) {
                                if (data.hasOwnProperty(i))
                                    obj[i] = exports.convertToType(data[i], itemType);
                            }
                        } else {
                            for (var k in data) {
                                if (data.hasOwnProperty(k))
                                    obj[k] = exports.convertToType(data[k], itemType);
                            }
                        }
                    };

                    /**
                     * The default API client implementation.
                     * @type {module:TBAAPI.Client/ApiClient}
                     */
                    exports.instance = new exports();

                    return exports;
                }));

            }).call(this, require("buffer").Buffer)
}, {
            "buffer": 68,
            "fs": 67,
            "querystring": 72,
            "superagent": 2
        }],
        10: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/DistrictList', 'TBAAPI.Client/model/DistrictRanking', 'TBAAPI.Client/model/Event', 'TBAAPI.Client/model/EventDistrictPoints', 'TBAAPI.Client/model/EventSimple', 'TBAAPI.Client/model/Team', 'TBAAPI.Client/model/TeamSimple'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('../model/DistrictList'), require('../model/DistrictRanking'), require('../model/Event'), require('../model/EventDistrictPoints'), require('../model/EventSimple'), require('../model/Team'), require('../model/TeamSimple'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.DistrictApi = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.DistrictList, root.TbaApiV3client.DistrictRanking, root.TbaApiV3client.Event, root.TbaApiV3client.EventDistrictPoints, root.TbaApiV3client.EventSimple, root.TbaApiV3client.Team, root.TbaApiV3client.TeamSimple);
                }
            }(this, function (ApiClient, DistrictList, DistrictRanking, Event, EventDistrictPoints, EventSimple, Team, TeamSimple) {
                'use strict';

                /**
                 * District service.
                 * @module TBAAPI.Client/api/DistrictApi
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new DistrictApi. 
                 * @alias module:TBAAPI.Client/api/DistrictApi
                 * @class
                 * @param {module:TBAAPI.Client/ApiClient} apiClient Optional API client implementation to use,
                 * default to {@link module:TBAAPI.Client/ApiClient#instance} if unspecified.
                 */
                var exports = function (apiClient) {
                    this.apiClient = apiClient || ApiClient.instance;


                    /**
                     * Callback function to receive the result of the getDistrictEvents operation.
                     * @callback module:TBAAPI.Client/api/DistrictApi~getDistrictEventsCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Event>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of events in the given district.
                     * @param {String} districtKey TBA District Key, eg &#x60;2016fim&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/DistrictApi~getDistrictEventsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Event>}
                     */
                    this.getDistrictEvents = function (districtKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'districtKey' is set
                        if (districtKey === undefined || districtKey === null) {
                            throw new Error("Missing the required parameter 'districtKey' when calling getDistrictEvents");
                        }


                        var pathParams = {
                            'district_key': districtKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Event];

                        return this.apiClient.callApi(
                            '/district/{district_key}/events', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getDistrictEventsKeys operation.
                     * @callback module:TBAAPI.Client/api/DistrictApi~getDistrictEventsKeysCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<'String'>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of event keys for events in the given district.
                     * @param {String} districtKey TBA District Key, eg &#x60;2016fim&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/DistrictApi~getDistrictEventsKeysCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<'String'>}
                     */
                    this.getDistrictEventsKeys = function (districtKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'districtKey' is set
                        if (districtKey === undefined || districtKey === null) {
                            throw new Error("Missing the required parameter 'districtKey' when calling getDistrictEventsKeys");
                        }


                        var pathParams = {
                            'district_key': districtKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = ['String'];

                        return this.apiClient.callApi(
                            '/district/{district_key}/events/keys', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getDistrictEventsSimple operation.
                     * @callback module:TBAAPI.Client/api/DistrictApi~getDistrictEventsSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/EventSimple>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a short-form list of events in the given district.
                     * @param {String} districtKey TBA District Key, eg &#x60;2016fim&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/DistrictApi~getDistrictEventsSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/EventSimple>}
                     */
                    this.getDistrictEventsSimple = function (districtKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'districtKey' is set
                        if (districtKey === undefined || districtKey === null) {
                            throw new Error("Missing the required parameter 'districtKey' when calling getDistrictEventsSimple");
                        }


                        var pathParams = {
                            'district_key': districtKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [EventSimple];

                        return this.apiClient.callApi(
                            '/district/{district_key}/events/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getDistrictRankings operation.
                     * @callback module:TBAAPI.Client/api/DistrictApi~getDistrictRankingsCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/DistrictRanking>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of team district rankings for the given district.
                     * @param {String} districtKey TBA District Key, eg &#x60;2016fim&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/DistrictApi~getDistrictRankingsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/DistrictRanking>}
                     */
                    this.getDistrictRankings = function (districtKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'districtKey' is set
                        if (districtKey === undefined || districtKey === null) {
                            throw new Error("Missing the required parameter 'districtKey' when calling getDistrictRankings");
                        }


                        var pathParams = {
                            'district_key': districtKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [DistrictRanking];

                        return this.apiClient.callApi(
                            '/district/{district_key}/rankings', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getDistrictTeams operation.
                     * @callback module:TBAAPI.Client/api/DistrictApi~getDistrictTeamsCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Team>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of &#x60;Team&#x60; objects that competed in events in the given district.
                     * @param {String} districtKey TBA District Key, eg &#x60;2016fim&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/DistrictApi~getDistrictTeamsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Team>}
                     */
                    this.getDistrictTeams = function (districtKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'districtKey' is set
                        if (districtKey === undefined || districtKey === null) {
                            throw new Error("Missing the required parameter 'districtKey' when calling getDistrictTeams");
                        }


                        var pathParams = {
                            'district_key': districtKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Team];

                        return this.apiClient.callApi(
                            '/district/{district_key}/teams', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getDistrictTeamsKeys operation.
                     * @callback module:TBAAPI.Client/api/DistrictApi~getDistrictTeamsKeysCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<'String'>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of &#x60;Team&#x60; objects that competed in events in the given district.
                     * @param {String} districtKey TBA District Key, eg &#x60;2016fim&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/DistrictApi~getDistrictTeamsKeysCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<'String'>}
                     */
                    this.getDistrictTeamsKeys = function (districtKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'districtKey' is set
                        if (districtKey === undefined || districtKey === null) {
                            throw new Error("Missing the required parameter 'districtKey' when calling getDistrictTeamsKeys");
                        }


                        var pathParams = {
                            'district_key': districtKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = ['String'];

                        return this.apiClient.callApi(
                            '/district/{district_key}/teams/keys', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getDistrictTeamsSimple operation.
                     * @callback module:TBAAPI.Client/api/DistrictApi~getDistrictTeamsSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/TeamSimple>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a short-form list of &#x60;Team&#x60; objects that competed in events in the given district.
                     * @param {String} districtKey TBA District Key, eg &#x60;2016fim&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/DistrictApi~getDistrictTeamsSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/TeamSimple>}
                     */
                    this.getDistrictTeamsSimple = function (districtKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'districtKey' is set
                        if (districtKey === undefined || districtKey === null) {
                            throw new Error("Missing the required parameter 'districtKey' when calling getDistrictTeamsSimple");
                        }


                        var pathParams = {
                            'district_key': districtKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [TeamSimple];

                        return this.apiClient.callApi(
                            '/district/{district_key}/teams/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getDistrictsByYear operation.
                     * @callback module:TBAAPI.Client/api/DistrictApi~getDistrictsByYearCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/DistrictList>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of districts and their corresponding district key, for the given year.
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/DistrictApi~getDistrictsByYearCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/DistrictList>}
                     */
                    this.getDistrictsByYear = function (year, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getDistrictsByYear");
                        }


                        var pathParams = {
                            'year': year
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [DistrictList];

                        return this.apiClient.callApi(
                            '/districts/{year}', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventDistrictPoints operation.
                     * @callback module:TBAAPI.Client/api/DistrictApi~getEventDistrictPointsCallback
                     * @param {String} error Error message, if any.
                     * @param {module:TBAAPI.Client/model/EventDistrictPoints} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of team rankings for the Event.
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/DistrictApi~getEventDistrictPointsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link module:TBAAPI.Client/model/EventDistrictPoints}
                     */
                    this.getEventDistrictPoints = function (eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getEventDistrictPoints");
                        }


                        var pathParams = {
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = EventDistrictPoints;

                        return this.apiClient.callApi(
                            '/event/{event_key}/district_points', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamDistricts operation.
                     * @callback module:TBAAPI.Client/api/DistrictApi~getTeamDistrictsCallback
                     * @param {String} error Error message, if any.
                     * @param {Object.<String, {'String': 'String'}>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list or year and district pairs to denote each year the team was in a district. Will return an empty array if the team was never in a district.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/DistrictApi~getTeamDistrictsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Object.<String, {'String': 'String'}>}
                     */
                    this.getTeamDistricts = function (teamKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamDistricts");
                        }


                        var pathParams = {
                            'team_key': teamKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = {
                            'String': 'String'
                        };

                        return this.apiClient.callApi(
                            '/team/{team_key}/districts', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }
                };

                return exports;
            }));

}, {
            "../ApiClient": 9,
            "../model/DistrictList": 21,
            "../model/DistrictRanking": 22,
            "../model/Event": 27,
            "../model/EventDistrictPoints": 28,
            "../model/EventSimple": 41,
            "../model/Team": 54,
            "../model/TeamSimple": 63
        }],
        11: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/Award', 'TBAAPI.Client/model/EliminationAlliance', 'TBAAPI.Client/model/Event', 'TBAAPI.Client/model/EventDistrictPoints', 'TBAAPI.Client/model/EventOPRs', 'TBAAPI.Client/model/EventPredictions', 'TBAAPI.Client/model/EventRanking', 'TBAAPI.Client/model/EventSimple', 'TBAAPI.Client/model/Match', 'TBAAPI.Client/model/MatchSimple', 'TBAAPI.Client/model/Team', 'TBAAPI.Client/model/TeamEventStatus', 'TBAAPI.Client/model/TeamSimple'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('../model/Award'), require('../model/EliminationAlliance'), require('../model/Event'), require('../model/EventDistrictPoints'), require('../model/EventOPRs'), require('../model/EventPredictions'), require('../model/EventRanking'), require('../model/EventSimple'), require('../model/Match'), require('../model/MatchSimple'), require('../model/Team'), require('../model/TeamEventStatus'), require('../model/TeamSimple'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.EventApi = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.Award, root.TbaApiV3client.EliminationAlliance, root.TbaApiV3client.Event, root.TbaApiV3client.EventDistrictPoints, root.TbaApiV3client.EventOPRs, root.TbaApiV3client.EventPredictions, root.TbaApiV3client.EventRanking, root.TbaApiV3client.EventSimple, root.TbaApiV3client.Match, root.TbaApiV3client.MatchSimple, root.TbaApiV3client.Team, root.TbaApiV3client.TeamEventStatus, root.TbaApiV3client.TeamSimple);
                }
            }(this, function (ApiClient, Award, EliminationAlliance, Event, EventDistrictPoints, EventOPRs, EventPredictions, EventRanking, EventSimple, Match, MatchSimple, Team, TeamEventStatus, TeamSimple) {
                'use strict';

                /**
                 * Event service.
                 * @module TBAAPI.Client/api/EventApi
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new EventApi. 
                 * @alias module:TBAAPI.Client/api/EventApi
                 * @class
                 * @param {module:TBAAPI.Client/ApiClient} apiClient Optional API client implementation to use,
                 * default to {@link module:TBAAPI.Client/ApiClient#instance} if unspecified.
                 */
                var exports = function (apiClient) {
                    this.apiClient = apiClient || ApiClient.instance;


                    /**
                     * Callback function to receive the result of the getDistrictEvents operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getDistrictEventsCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Event>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of events in the given district.
                     * @param {String} districtKey TBA District Key, eg &#x60;2016fim&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getDistrictEventsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Event>}
                     */
                    this.getDistrictEvents = function (districtKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'districtKey' is set
                        if (districtKey === undefined || districtKey === null) {
                            throw new Error("Missing the required parameter 'districtKey' when calling getDistrictEvents");
                        }


                        var pathParams = {
                            'district_key': districtKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Event];

                        return this.apiClient.callApi(
                            '/district/{district_key}/events', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getDistrictEventsKeys operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getDistrictEventsKeysCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<'String'>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of event keys for events in the given district.
                     * @param {String} districtKey TBA District Key, eg &#x60;2016fim&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getDistrictEventsKeysCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<'String'>}
                     */
                    this.getDistrictEventsKeys = function (districtKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'districtKey' is set
                        if (districtKey === undefined || districtKey === null) {
                            throw new Error("Missing the required parameter 'districtKey' when calling getDistrictEventsKeys");
                        }


                        var pathParams = {
                            'district_key': districtKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = ['String'];

                        return this.apiClient.callApi(
                            '/district/{district_key}/events/keys', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getDistrictEventsSimple operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getDistrictEventsSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/EventSimple>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a short-form list of events in the given district.
                     * @param {String} districtKey TBA District Key, eg &#x60;2016fim&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getDistrictEventsSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/EventSimple>}
                     */
                    this.getDistrictEventsSimple = function (districtKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'districtKey' is set
                        if (districtKey === undefined || districtKey === null) {
                            throw new Error("Missing the required parameter 'districtKey' when calling getDistrictEventsSimple");
                        }


                        var pathParams = {
                            'district_key': districtKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [EventSimple];

                        return this.apiClient.callApi(
                            '/district/{district_key}/events/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEvent operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getEventCallback
                     * @param {String} error Error message, if any.
                     * @param {module:TBAAPI.Client/model/Event} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets an Event.
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getEventCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link module:TBAAPI.Client/model/Event}
                     */
                    this.getEvent = function (eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getEvent");
                        }


                        var pathParams = {
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = Event;

                        return this.apiClient.callApi(
                            '/event/{event_key}', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventAlliances operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getEventAlliancesCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/EliminationAlliance>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of Elimination Alliances for the given Event.
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getEventAlliancesCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/EliminationAlliance>}
                     */
                    this.getEventAlliances = function (eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getEventAlliances");
                        }


                        var pathParams = {
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [EliminationAlliance];

                        return this.apiClient.callApi(
                            '/event/{event_key}/alliances', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventAwards operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getEventAwardsCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Award>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of awards from the given event.
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getEventAwardsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Award>}
                     */
                    this.getEventAwards = function (eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getEventAwards");
                        }


                        var pathParams = {
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Award];

                        return this.apiClient.callApi(
                            '/event/{event_key}/awards', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventDistrictPoints operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getEventDistrictPointsCallback
                     * @param {String} error Error message, if any.
                     * @param {module:TBAAPI.Client/model/EventDistrictPoints} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of team rankings for the Event.
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getEventDistrictPointsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link module:TBAAPI.Client/model/EventDistrictPoints}
                     */
                    this.getEventDistrictPoints = function (eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getEventDistrictPoints");
                        }


                        var pathParams = {
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = EventDistrictPoints;

                        return this.apiClient.callApi(
                            '/event/{event_key}/district_points', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventInsights operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getEventInsightsCallback
                     * @param {String} error Error message, if any.
                     * @param {Object} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a set of Event-specific insights for the given Event.
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getEventInsightsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Object}
                     */
                    this.getEventInsights = function (eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getEventInsights");
                        }


                        var pathParams = {
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = Object;

                        return this.apiClient.callApi(
                            '/event/{event_key}/insights', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventMatches operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getEventMatchesCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Match>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of matches for the given event.
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getEventMatchesCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Match>}
                     */
                    this.getEventMatches = function (eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getEventMatches");
                        }


                        var pathParams = {
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Match];

                        return this.apiClient.callApi(
                            '/event/{event_key}/matches', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventMatchesKeys operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getEventMatchesKeysCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<'String'>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of match keys for the given event.
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getEventMatchesKeysCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<'String'>}
                     */
                    this.getEventMatchesKeys = function (eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getEventMatchesKeys");
                        }


                        var pathParams = {
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = ['String'];

                        return this.apiClient.callApi(
                            '/event/{event_key}/matches/keys', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventMatchesSimple operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getEventMatchesSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/MatchSimple>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a short-form list of matches for the given event.
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getEventMatchesSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/MatchSimple>}
                     */
                    this.getEventMatchesSimple = function (eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getEventMatchesSimple");
                        }


                        var pathParams = {
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [MatchSimple];

                        return this.apiClient.callApi(
                            '/event/{event_key}/matches/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventOPRs operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getEventOPRsCallback
                     * @param {String} error Error message, if any.
                     * @param {module:TBAAPI.Client/model/EventOPRs} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a set of Event OPRs (including OPR, DPR, and CCWM) for the given Event.
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getEventOPRsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link module:TBAAPI.Client/model/EventOPRs}
                     */
                    this.getEventOPRs = function (eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getEventOPRs");
                        }


                        var pathParams = {
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = EventOPRs;

                        return this.apiClient.callApi(
                            '/event/{event_key}/oprs', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventPredictions operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getEventPredictionsCallback
                     * @param {String} error Error message, if any.
                     * @param {module:TBAAPI.Client/model/EventPredictions} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets information on TBA-generated predictions for the given Event. Contains year-specific information. *WARNING* This endpoint is currently under development and may change at any time.
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getEventPredictionsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link module:TBAAPI.Client/model/EventPredictions}
                     */
                    this.getEventPredictions = function (eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getEventPredictions");
                        }


                        var pathParams = {
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = EventPredictions;

                        return this.apiClient.callApi(
                            '/event/{event_key}/predictions', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventRankings operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getEventRankingsCallback
                     * @param {String} error Error message, if any.
                     * @param {module:TBAAPI.Client/model/EventRanking} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of team rankings for the Event.
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getEventRankingsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link module:TBAAPI.Client/model/EventRanking}
                     */
                    this.getEventRankings = function (eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getEventRankings");
                        }


                        var pathParams = {
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = EventRanking;

                        return this.apiClient.callApi(
                            '/event/{event_key}/rankings', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventSimple operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getEventSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {module:TBAAPI.Client/model/EventSimple} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a short-form Event.
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getEventSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link module:TBAAPI.Client/model/EventSimple}
                     */
                    this.getEventSimple = function (eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getEventSimple");
                        }


                        var pathParams = {
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = EventSimple;

                        return this.apiClient.callApi(
                            '/event/{event_key}/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventTeams operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getEventTeamsCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Team>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of &#x60;Team&#x60; objects that competed in the given event.
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getEventTeamsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Team>}
                     */
                    this.getEventTeams = function (eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getEventTeams");
                        }


                        var pathParams = {
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Team];

                        return this.apiClient.callApi(
                            '/event/{event_key}/teams', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventTeamsKeys operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getEventTeamsKeysCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<'String'>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of &#x60;Team&#x60; keys that competed in the given event.
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getEventTeamsKeysCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<'String'>}
                     */
                    this.getEventTeamsKeys = function (eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getEventTeamsKeys");
                        }


                        var pathParams = {
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = ['String'];

                        return this.apiClient.callApi(
                            '/event/{event_key}/teams/keys', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventTeamsSimple operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getEventTeamsSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/TeamSimple>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a short-form list of &#x60;Team&#x60; objects that competed in the given event.
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getEventTeamsSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/TeamSimple>}
                     */
                    this.getEventTeamsSimple = function (eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getEventTeamsSimple");
                        }


                        var pathParams = {
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [TeamSimple];

                        return this.apiClient.callApi(
                            '/event/{event_key}/teams/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventsByYear operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getEventsByYearCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Event>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of events in the given year.
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getEventsByYearCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Event>}
                     */
                    this.getEventsByYear = function (year, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getEventsByYear");
                        }


                        var pathParams = {
                            'year': year
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Event];

                        return this.apiClient.callApi(
                            '/events/{year}', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventsByYearKeys operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getEventsByYearKeysCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<'String'>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of event keys in the given year.
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getEventsByYearKeysCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<'String'>}
                     */
                    this.getEventsByYearKeys = function (year, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getEventsByYearKeys");
                        }


                        var pathParams = {
                            'year': year
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = ['String'];

                        return this.apiClient.callApi(
                            '/events/{year}/keys', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventsByYearSimple operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getEventsByYearSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/EventSimple>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a short-form list of events in the given year.
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getEventsByYearSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/EventSimple>}
                     */
                    this.getEventsByYearSimple = function (year, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getEventsByYearSimple");
                        }


                        var pathParams = {
                            'year': year
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [EventSimple];

                        return this.apiClient.callApi(
                            '/events/{year}/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamEventAwards operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getTeamEventAwardsCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Award>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of awards the given team won at the given event.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getTeamEventAwardsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Award>}
                     */
                    this.getTeamEventAwards = function (teamKey, eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamEventAwards");
                        }

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getTeamEventAwards");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Award];

                        return this.apiClient.callApi(
                            '/team/{team_key}/event/{event_key}/awards', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamEventMatches operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getTeamEventMatchesCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Match>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of matches for the given team and event.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getTeamEventMatchesCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Match>}
                     */
                    this.getTeamEventMatches = function (teamKey, eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamEventMatches");
                        }

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getTeamEventMatches");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Match];

                        return this.apiClient.callApi(
                            '/team/{team_key}/event/{event_key}/matches', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamEventMatchesKeys operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getTeamEventMatchesKeysCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<'String'>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of match keys for matches for the given team and event.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getTeamEventMatchesKeysCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<'String'>}
                     */
                    this.getTeamEventMatchesKeys = function (teamKey, eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamEventMatchesKeys");
                        }

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getTeamEventMatchesKeys");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = ['String'];

                        return this.apiClient.callApi(
                            '/team/{team_key}/event/{event_key}/matches/keys', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamEventMatchesSimple operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getTeamEventMatchesSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Match>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a short-form list of matches for the given team and event.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getTeamEventMatchesSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Match>}
                     */
                    this.getTeamEventMatchesSimple = function (teamKey, eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamEventMatchesSimple");
                        }

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getTeamEventMatchesSimple");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Match];

                        return this.apiClient.callApi(
                            '/team/{team_key}/event/{event_key}/matches/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamEventStatus operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getTeamEventStatusCallback
                     * @param {String} error Error message, if any.
                     * @param {module:TBAAPI.Client/model/TeamEventStatus} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets the competition rank and status of the team at the given event.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getTeamEventStatusCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link module:TBAAPI.Client/model/TeamEventStatus}
                     */
                    this.getTeamEventStatus = function (teamKey, eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamEventStatus");
                        }

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getTeamEventStatus");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = TeamEventStatus;

                        return this.apiClient.callApi(
                            '/team/{team_key}/event/{event_key}/status', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamEvents operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getTeamEventsCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Event>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of all events this team has competed at.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getTeamEventsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Event>}
                     */
                    this.getTeamEvents = function (teamKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamEvents");
                        }


                        var pathParams = {
                            'team_key': teamKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Event];

                        return this.apiClient.callApi(
                            '/team/{team_key}/events', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamEventsByYear operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getTeamEventsByYearCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Event>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of events this team has competed at in the given year.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getTeamEventsByYearCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Event>}
                     */
                    this.getTeamEventsByYear = function (teamKey, year, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamEventsByYear");
                        }

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getTeamEventsByYear");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'year': year
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Event];

                        return this.apiClient.callApi(
                            '/team/{team_key}/events/{year}', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamEventsByYearKeys operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getTeamEventsByYearKeysCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<'String'>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of the event keys for events this team has competed at in the given year.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getTeamEventsByYearKeysCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<'String'>}
                     */
                    this.getTeamEventsByYearKeys = function (teamKey, year, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamEventsByYearKeys");
                        }

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getTeamEventsByYearKeys");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'year': year
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = ['String'];

                        return this.apiClient.callApi(
                            '/team/{team_key}/events/{year}/keys', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamEventsByYearSimple operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getTeamEventsByYearSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/EventSimple>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a short-form list of events this team has competed at in the given year.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getTeamEventsByYearSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/EventSimple>}
                     */
                    this.getTeamEventsByYearSimple = function (teamKey, year, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamEventsByYearSimple");
                        }

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getTeamEventsByYearSimple");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'year': year
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [EventSimple];

                        return this.apiClient.callApi(
                            '/team/{team_key}/events/{year}/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamEventsKeys operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getTeamEventsKeysCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<'String'>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of the event keys for all events this team has competed at.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getTeamEventsKeysCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<'String'>}
                     */
                    this.getTeamEventsKeys = function (teamKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamEventsKeys");
                        }


                        var pathParams = {
                            'team_key': teamKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = ['String'];

                        return this.apiClient.callApi(
                            '/team/{team_key}/events/keys', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamEventsSimple operation.
                     * @callback module:TBAAPI.Client/api/EventApi~getTeamEventsSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/EventSimple>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a short-form list of all events this team has competed at.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/EventApi~getTeamEventsSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/EventSimple>}
                     */
                    this.getTeamEventsSimple = function (teamKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamEventsSimple");
                        }


                        var pathParams = {
                            'team_key': teamKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [EventSimple];

                        return this.apiClient.callApi(
                            '/team/{team_key}/events/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }
                };

                return exports;
            }));

}, {
            "../ApiClient": 9,
            "../model/Award": 19,
            "../model/EliminationAlliance": 24,
            "../model/Event": 27,
            "../model/EventDistrictPoints": 28,
            "../model/EventOPRs": 35,
            "../model/EventPredictions": 36,
            "../model/EventRanking": 37,
            "../model/EventSimple": 41,
            "../model/Match": 42,
            "../model/MatchSimple": 50,
            "../model/Team": 54,
            "../model/TeamEventStatus": 55,
            "../model/TeamSimple": 63
        }],
        12: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/DistrictRanking', 'TBAAPI.Client/model/Event', 'TBAAPI.Client/model/EventSimple', 'TBAAPI.Client/model/Team', 'TBAAPI.Client/model/TeamSimple'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('../model/DistrictRanking'), require('../model/Event'), require('../model/EventSimple'), require('../model/Team'), require('../model/TeamSimple'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.ListApi = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.DistrictRanking, root.TbaApiV3client.Event, root.TbaApiV3client.EventSimple, root.TbaApiV3client.Team, root.TbaApiV3client.TeamSimple);
                }
            }(this, function (ApiClient, DistrictRanking, Event, EventSimple, Team, TeamSimple) {
                'use strict';

                /**
                 * List service.
                 * @module TBAAPI.Client/api/ListApi
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new ListApi. 
                 * @alias module:TBAAPI.Client/api/ListApi
                 * @class
                 * @param {module:TBAAPI.Client/ApiClient} apiClient Optional API client implementation to use,
                 * default to {@link module:TBAAPI.Client/ApiClient#instance} if unspecified.
                 */
                var exports = function (apiClient) {
                    this.apiClient = apiClient || ApiClient.instance;


                    /**
                     * Callback function to receive the result of the getDistrictEvents operation.
                     * @callback module:TBAAPI.Client/api/ListApi~getDistrictEventsCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Event>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of events in the given district.
                     * @param {String} districtKey TBA District Key, eg &#x60;2016fim&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/ListApi~getDistrictEventsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Event>}
                     */
                    this.getDistrictEvents = function (districtKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'districtKey' is set
                        if (districtKey === undefined || districtKey === null) {
                            throw new Error("Missing the required parameter 'districtKey' when calling getDistrictEvents");
                        }


                        var pathParams = {
                            'district_key': districtKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Event];

                        return this.apiClient.callApi(
                            '/district/{district_key}/events', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getDistrictEventsKeys operation.
                     * @callback module:TBAAPI.Client/api/ListApi~getDistrictEventsKeysCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<'String'>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of event keys for events in the given district.
                     * @param {String} districtKey TBA District Key, eg &#x60;2016fim&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/ListApi~getDistrictEventsKeysCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<'String'>}
                     */
                    this.getDistrictEventsKeys = function (districtKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'districtKey' is set
                        if (districtKey === undefined || districtKey === null) {
                            throw new Error("Missing the required parameter 'districtKey' when calling getDistrictEventsKeys");
                        }


                        var pathParams = {
                            'district_key': districtKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = ['String'];

                        return this.apiClient.callApi(
                            '/district/{district_key}/events/keys', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getDistrictEventsSimple operation.
                     * @callback module:TBAAPI.Client/api/ListApi~getDistrictEventsSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/EventSimple>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a short-form list of events in the given district.
                     * @param {String} districtKey TBA District Key, eg &#x60;2016fim&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/ListApi~getDistrictEventsSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/EventSimple>}
                     */
                    this.getDistrictEventsSimple = function (districtKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'districtKey' is set
                        if (districtKey === undefined || districtKey === null) {
                            throw new Error("Missing the required parameter 'districtKey' when calling getDistrictEventsSimple");
                        }


                        var pathParams = {
                            'district_key': districtKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [EventSimple];

                        return this.apiClient.callApi(
                            '/district/{district_key}/events/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getDistrictRankings operation.
                     * @callback module:TBAAPI.Client/api/ListApi~getDistrictRankingsCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/DistrictRanking>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of team district rankings for the given district.
                     * @param {String} districtKey TBA District Key, eg &#x60;2016fim&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/ListApi~getDistrictRankingsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/DistrictRanking>}
                     */
                    this.getDistrictRankings = function (districtKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'districtKey' is set
                        if (districtKey === undefined || districtKey === null) {
                            throw new Error("Missing the required parameter 'districtKey' when calling getDistrictRankings");
                        }


                        var pathParams = {
                            'district_key': districtKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [DistrictRanking];

                        return this.apiClient.callApi(
                            '/district/{district_key}/rankings', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getDistrictTeams operation.
                     * @callback module:TBAAPI.Client/api/ListApi~getDistrictTeamsCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Team>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of &#x60;Team&#x60; objects that competed in events in the given district.
                     * @param {String} districtKey TBA District Key, eg &#x60;2016fim&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/ListApi~getDistrictTeamsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Team>}
                     */
                    this.getDistrictTeams = function (districtKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'districtKey' is set
                        if (districtKey === undefined || districtKey === null) {
                            throw new Error("Missing the required parameter 'districtKey' when calling getDistrictTeams");
                        }


                        var pathParams = {
                            'district_key': districtKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Team];

                        return this.apiClient.callApi(
                            '/district/{district_key}/teams', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getDistrictTeamsKeys operation.
                     * @callback module:TBAAPI.Client/api/ListApi~getDistrictTeamsKeysCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<'String'>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of &#x60;Team&#x60; objects that competed in events in the given district.
                     * @param {String} districtKey TBA District Key, eg &#x60;2016fim&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/ListApi~getDistrictTeamsKeysCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<'String'>}
                     */
                    this.getDistrictTeamsKeys = function (districtKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'districtKey' is set
                        if (districtKey === undefined || districtKey === null) {
                            throw new Error("Missing the required parameter 'districtKey' when calling getDistrictTeamsKeys");
                        }


                        var pathParams = {
                            'district_key': districtKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = ['String'];

                        return this.apiClient.callApi(
                            '/district/{district_key}/teams/keys', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getDistrictTeamsSimple operation.
                     * @callback module:TBAAPI.Client/api/ListApi~getDistrictTeamsSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/TeamSimple>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a short-form list of &#x60;Team&#x60; objects that competed in events in the given district.
                     * @param {String} districtKey TBA District Key, eg &#x60;2016fim&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/ListApi~getDistrictTeamsSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/TeamSimple>}
                     */
                    this.getDistrictTeamsSimple = function (districtKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'districtKey' is set
                        if (districtKey === undefined || districtKey === null) {
                            throw new Error("Missing the required parameter 'districtKey' when calling getDistrictTeamsSimple");
                        }


                        var pathParams = {
                            'district_key': districtKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [TeamSimple];

                        return this.apiClient.callApi(
                            '/district/{district_key}/teams/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventTeams operation.
                     * @callback module:TBAAPI.Client/api/ListApi~getEventTeamsCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Team>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of &#x60;Team&#x60; objects that competed in the given event.
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/ListApi~getEventTeamsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Team>}
                     */
                    this.getEventTeams = function (eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getEventTeams");
                        }


                        var pathParams = {
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Team];

                        return this.apiClient.callApi(
                            '/event/{event_key}/teams', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventTeamsKeys operation.
                     * @callback module:TBAAPI.Client/api/ListApi~getEventTeamsKeysCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<'String'>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of &#x60;Team&#x60; keys that competed in the given event.
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/ListApi~getEventTeamsKeysCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<'String'>}
                     */
                    this.getEventTeamsKeys = function (eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getEventTeamsKeys");
                        }


                        var pathParams = {
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = ['String'];

                        return this.apiClient.callApi(
                            '/event/{event_key}/teams/keys', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventTeamsSimple operation.
                     * @callback module:TBAAPI.Client/api/ListApi~getEventTeamsSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/TeamSimple>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a short-form list of &#x60;Team&#x60; objects that competed in the given event.
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/ListApi~getEventTeamsSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/TeamSimple>}
                     */
                    this.getEventTeamsSimple = function (eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getEventTeamsSimple");
                        }


                        var pathParams = {
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [TeamSimple];

                        return this.apiClient.callApi(
                            '/event/{event_key}/teams/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventsByYear operation.
                     * @callback module:TBAAPI.Client/api/ListApi~getEventsByYearCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Event>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of events in the given year.
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/ListApi~getEventsByYearCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Event>}
                     */
                    this.getEventsByYear = function (year, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getEventsByYear");
                        }


                        var pathParams = {
                            'year': year
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Event];

                        return this.apiClient.callApi(
                            '/events/{year}', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventsByYearKeys operation.
                     * @callback module:TBAAPI.Client/api/ListApi~getEventsByYearKeysCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<'String'>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of event keys in the given year.
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/ListApi~getEventsByYearKeysCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<'String'>}
                     */
                    this.getEventsByYearKeys = function (year, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getEventsByYearKeys");
                        }


                        var pathParams = {
                            'year': year
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = ['String'];

                        return this.apiClient.callApi(
                            '/events/{year}/keys', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventsByYearSimple operation.
                     * @callback module:TBAAPI.Client/api/ListApi~getEventsByYearSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/EventSimple>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a short-form list of events in the given year.
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/ListApi~getEventsByYearSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/EventSimple>}
                     */
                    this.getEventsByYearSimple = function (year, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getEventsByYearSimple");
                        }


                        var pathParams = {
                            'year': year
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [EventSimple];

                        return this.apiClient.callApi(
                            '/events/{year}/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeams operation.
                     * @callback module:TBAAPI.Client/api/ListApi~getTeamsCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Team>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of &#x60;Team&#x60; objects, paginated in groups of 500.
                     * @param {Number} pageNum Page number of results to return, zero-indexed
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/ListApi~getTeamsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Team>}
                     */
                    this.getTeams = function (pageNum, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'pageNum' is set
                        if (pageNum === undefined || pageNum === null) {
                            throw new Error("Missing the required parameter 'pageNum' when calling getTeams");
                        }


                        var pathParams = {
                            'page_num': pageNum
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Team];

                        return this.apiClient.callApi(
                            '/teams/{page_num}', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamsByYear operation.
                     * @callback module:TBAAPI.Client/api/ListApi~getTeamsByYearCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Team>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of &#x60;Team&#x60; objects that competed in the given year, paginated in groups of 500.
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Number} pageNum Page number of results to return, zero-indexed
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/ListApi~getTeamsByYearCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Team>}
                     */
                    this.getTeamsByYear = function (year, pageNum, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getTeamsByYear");
                        }

                        // verify the required parameter 'pageNum' is set
                        if (pageNum === undefined || pageNum === null) {
                            throw new Error("Missing the required parameter 'pageNum' when calling getTeamsByYear");
                        }


                        var pathParams = {
                            'year': year,
                            'page_num': pageNum
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Team];

                        return this.apiClient.callApi(
                            '/teams/{year}/{page_num}', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamsByYearKeys operation.
                     * @callback module:TBAAPI.Client/api/ListApi~getTeamsByYearKeysCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<'String'>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list Team Keys that competed in the given year, paginated in groups of 500.
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Number} pageNum Page number of results to return, zero-indexed
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/ListApi~getTeamsByYearKeysCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<'String'>}
                     */
                    this.getTeamsByYearKeys = function (year, pageNum, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getTeamsByYearKeys");
                        }

                        // verify the required parameter 'pageNum' is set
                        if (pageNum === undefined || pageNum === null) {
                            throw new Error("Missing the required parameter 'pageNum' when calling getTeamsByYearKeys");
                        }


                        var pathParams = {
                            'year': year,
                            'page_num': pageNum
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = ['String'];

                        return this.apiClient.callApi(
                            '/teams/{year}/{page_num}/keys', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamsByYearSimple operation.
                     * @callback module:TBAAPI.Client/api/ListApi~getTeamsByYearSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/TeamSimple>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of short form &#x60;Team_Simple&#x60; objects that competed in the given year, paginated in groups of 500.
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Number} pageNum Page number of results to return, zero-indexed
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/ListApi~getTeamsByYearSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/TeamSimple>}
                     */
                    this.getTeamsByYearSimple = function (year, pageNum, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getTeamsByYearSimple");
                        }

                        // verify the required parameter 'pageNum' is set
                        if (pageNum === undefined || pageNum === null) {
                            throw new Error("Missing the required parameter 'pageNum' when calling getTeamsByYearSimple");
                        }


                        var pathParams = {
                            'year': year,
                            'page_num': pageNum
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [TeamSimple];

                        return this.apiClient.callApi(
                            '/teams/{year}/{page_num}/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamsKeys operation.
                     * @callback module:TBAAPI.Client/api/ListApi~getTeamsKeysCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<'String'>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of Team keys, paginated in groups of 500. (Note, each page will not have 500 teams, but will include the teams within that range of 500.)
                     * @param {Number} pageNum Page number of results to return, zero-indexed
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/ListApi~getTeamsKeysCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<'String'>}
                     */
                    this.getTeamsKeys = function (pageNum, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'pageNum' is set
                        if (pageNum === undefined || pageNum === null) {
                            throw new Error("Missing the required parameter 'pageNum' when calling getTeamsKeys");
                        }


                        var pathParams = {
                            'page_num': pageNum
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = ['String'];

                        return this.apiClient.callApi(
                            '/teams/{page_num}/keys', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamsSimple operation.
                     * @callback module:TBAAPI.Client/api/ListApi~getTeamsSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/TeamSimple>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of short form &#x60;Team_Simple&#x60; objects, paginated in groups of 500.
                     * @param {Number} pageNum Page number of results to return, zero-indexed
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/ListApi~getTeamsSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/TeamSimple>}
                     */
                    this.getTeamsSimple = function (pageNum, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'pageNum' is set
                        if (pageNum === undefined || pageNum === null) {
                            throw new Error("Missing the required parameter 'pageNum' when calling getTeamsSimple");
                        }


                        var pathParams = {
                            'page_num': pageNum
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [TeamSimple];

                        return this.apiClient.callApi(
                            '/teams/{page_num}/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }
                };

                return exports;
            }));

}, {
            "../ApiClient": 9,
            "../model/DistrictRanking": 22,
            "../model/Event": 27,
            "../model/EventSimple": 41,
            "../model/Team": 54,
            "../model/TeamSimple": 63
        }],
        13: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/Match', 'TBAAPI.Client/model/MatchSimple'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('../model/Match'), require('../model/MatchSimple'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.MatchApi = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.Match, root.TbaApiV3client.MatchSimple);
                }
            }(this, function (ApiClient, Match, MatchSimple) {
                'use strict';

                /**
                 * Match service.
                 * @module TBAAPI.Client/api/MatchApi
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new MatchApi. 
                 * @alias module:TBAAPI.Client/api/MatchApi
                 * @class
                 * @param {module:TBAAPI.Client/ApiClient} apiClient Optional API client implementation to use,
                 * default to {@link module:TBAAPI.Client/ApiClient#instance} if unspecified.
                 */
                var exports = function (apiClient) {
                    this.apiClient = apiClient || ApiClient.instance;


                    /**
                     * Callback function to receive the result of the getEventMatches operation.
                     * @callback module:TBAAPI.Client/api/MatchApi~getEventMatchesCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Match>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of matches for the given event.
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/MatchApi~getEventMatchesCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Match>}
                     */
                    this.getEventMatches = function (eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getEventMatches");
                        }


                        var pathParams = {
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Match];

                        return this.apiClient.callApi(
                            '/event/{event_key}/matches', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventMatchesKeys operation.
                     * @callback module:TBAAPI.Client/api/MatchApi~getEventMatchesKeysCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<'String'>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of match keys for the given event.
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/MatchApi~getEventMatchesKeysCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<'String'>}
                     */
                    this.getEventMatchesKeys = function (eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getEventMatchesKeys");
                        }


                        var pathParams = {
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = ['String'];

                        return this.apiClient.callApi(
                            '/event/{event_key}/matches/keys', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventMatchesSimple operation.
                     * @callback module:TBAAPI.Client/api/MatchApi~getEventMatchesSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/MatchSimple>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a short-form list of matches for the given event.
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/MatchApi~getEventMatchesSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/MatchSimple>}
                     */
                    this.getEventMatchesSimple = function (eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getEventMatchesSimple");
                        }


                        var pathParams = {
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [MatchSimple];

                        return this.apiClient.callApi(
                            '/event/{event_key}/matches/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getMatch operation.
                     * @callback module:TBAAPI.Client/api/MatchApi~getMatchCallback
                     * @param {String} error Error message, if any.
                     * @param {module:TBAAPI.Client/model/Match} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a &#x60;Match&#x60; object for the given match key.
                     * @param {String} matchKey TBA Match Key, eg &#x60;2016nytr_qm1&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/MatchApi~getMatchCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link module:TBAAPI.Client/model/Match}
                     */
                    this.getMatch = function (matchKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'matchKey' is set
                        if (matchKey === undefined || matchKey === null) {
                            throw new Error("Missing the required parameter 'matchKey' when calling getMatch");
                        }


                        var pathParams = {
                            'match_key': matchKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = Match;

                        return this.apiClient.callApi(
                            '/match/{match_key}', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getMatchSimple operation.
                     * @callback module:TBAAPI.Client/api/MatchApi~getMatchSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {module:TBAAPI.Client/model/MatchSimple} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a short-form &#x60;Match&#x60; object for the given match key.
                     * @param {String} matchKey TBA Match Key, eg &#x60;2016nytr_qm1&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/MatchApi~getMatchSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link module:TBAAPI.Client/model/MatchSimple}
                     */
                    this.getMatchSimple = function (matchKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'matchKey' is set
                        if (matchKey === undefined || matchKey === null) {
                            throw new Error("Missing the required parameter 'matchKey' when calling getMatchSimple");
                        }


                        var pathParams = {
                            'match_key': matchKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = MatchSimple;

                        return this.apiClient.callApi(
                            '/match/{match_key}/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamEventMatches operation.
                     * @callback module:TBAAPI.Client/api/MatchApi~getTeamEventMatchesCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Match>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of matches for the given team and event.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/MatchApi~getTeamEventMatchesCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Match>}
                     */
                    this.getTeamEventMatches = function (teamKey, eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamEventMatches");
                        }

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getTeamEventMatches");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Match];

                        return this.apiClient.callApi(
                            '/team/{team_key}/event/{event_key}/matches', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamEventMatchesKeys operation.
                     * @callback module:TBAAPI.Client/api/MatchApi~getTeamEventMatchesKeysCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<'String'>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of match keys for matches for the given team and event.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/MatchApi~getTeamEventMatchesKeysCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<'String'>}
                     */
                    this.getTeamEventMatchesKeys = function (teamKey, eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamEventMatchesKeys");
                        }

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getTeamEventMatchesKeys");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = ['String'];

                        return this.apiClient.callApi(
                            '/team/{team_key}/event/{event_key}/matches/keys', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamEventMatchesSimple operation.
                     * @callback module:TBAAPI.Client/api/MatchApi~getTeamEventMatchesSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Match>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a short-form list of matches for the given team and event.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/MatchApi~getTeamEventMatchesSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Match>}
                     */
                    this.getTeamEventMatchesSimple = function (teamKey, eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamEventMatchesSimple");
                        }

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getTeamEventMatchesSimple");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Match];

                        return this.apiClient.callApi(
                            '/team/{team_key}/event/{event_key}/matches/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamMatchesByYear operation.
                     * @callback module:TBAAPI.Client/api/MatchApi~getTeamMatchesByYearCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Match>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of matches for the given team and year.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/MatchApi~getTeamMatchesByYearCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Match>}
                     */
                    this.getTeamMatchesByYear = function (teamKey, year, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamMatchesByYear");
                        }

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getTeamMatchesByYear");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'year': year
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Match];

                        return this.apiClient.callApi(
                            '/team/{team_key}/matches/{year}', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamMatchesByYearKeys operation.
                     * @callback module:TBAAPI.Client/api/MatchApi~getTeamMatchesByYearKeysCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<'String'>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of match keys for matches for the given team and year.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/MatchApi~getTeamMatchesByYearKeysCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<'String'>}
                     */
                    this.getTeamMatchesByYearKeys = function (teamKey, year, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamMatchesByYearKeys");
                        }

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getTeamMatchesByYearKeys");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'year': year
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = ['String'];

                        return this.apiClient.callApi(
                            '/team/{team_key}/matches/{year}/keys', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamMatchesByYearSimple operation.
                     * @callback module:TBAAPI.Client/api/MatchApi~getTeamMatchesByYearSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/MatchSimple>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a short-form list of matches for the given team and year.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/MatchApi~getTeamMatchesByYearSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/MatchSimple>}
                     */
                    this.getTeamMatchesByYearSimple = function (teamKey, year, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamMatchesByYearSimple");
                        }

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getTeamMatchesByYearSimple");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'year': year
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [MatchSimple];

                        return this.apiClient.callApi(
                            '/team/{team_key}/matches/{year}/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }
                };

                return exports;
            }));

}, {
            "../ApiClient": 9,
            "../model/Match": 42,
            "../model/MatchSimple": 50
        }],
        14: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/APIStatus'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('../model/APIStatus'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.TBAApi = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.APIStatus);
                }
            }(this, function (ApiClient, APIStatus) {
                'use strict';

                /**
                 * TBA service.
                 * @module TBAAPI.Client/api/TBAApi
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new TBAApi. 
                 * @alias module:TBAAPI.Client/api/TBAApi
                 * @class
                 * @param {module:TBAAPI.Client/ApiClient} apiClient Optional API client implementation to use,
                 * default to {@link module:TBAAPI.Client/ApiClient#instance} if unspecified.
                 */
                var exports = function (apiClient) {
                    this.apiClient = apiClient || ApiClient.instance;


                    /**
                     * Callback function to receive the result of the getStatus operation.
                     * @callback module:TBAAPI.Client/api/TBAApi~getStatusCallback
                     * @param {String} error Error message, if any.
                     * @param {module:TBAAPI.Client/model/APIStatus} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Returns API status, and TBA status information.
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TBAApi~getStatusCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link module:TBAAPI.Client/model/APIStatus}
                     */
                    this.getStatus = function (opts, callback) {
                        opts = opts || {};
                        var postBody = null;


                        var pathParams = {};
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = APIStatus;

                        return this.apiClient.callApi(
                            '/status', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }
                };

                return exports;
            }));

}, {
            "../ApiClient": 9,
            "../model/APIStatus": 17
        }],
        15: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/Award', 'TBAAPI.Client/model/DistrictRanking', 'TBAAPI.Client/model/Event', 'TBAAPI.Client/model/EventSimple', 'TBAAPI.Client/model/Match', 'TBAAPI.Client/model/MatchSimple', 'TBAAPI.Client/model/Media', 'TBAAPI.Client/model/Team', 'TBAAPI.Client/model/TeamEventStatus', 'TBAAPI.Client/model/TeamRobot', 'TBAAPI.Client/model/TeamSimple'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('../model/Award'), require('../model/DistrictRanking'), require('../model/Event'), require('../model/EventSimple'), require('../model/Match'), require('../model/MatchSimple'), require('../model/Media'), require('../model/Team'), require('../model/TeamEventStatus'), require('../model/TeamRobot'), require('../model/TeamSimple'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.TeamApi = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.Award, root.TbaApiV3client.DistrictRanking, root.TbaApiV3client.Event, root.TbaApiV3client.EventSimple, root.TbaApiV3client.Match, root.TbaApiV3client.MatchSimple, root.TbaApiV3client.Media, root.TbaApiV3client.Team, root.TbaApiV3client.TeamEventStatus, root.TbaApiV3client.TeamRobot, root.TbaApiV3client.TeamSimple);
                }
            }(this, function (ApiClient, Award, DistrictRanking, Event, EventSimple, Match, MatchSimple, Media, Team, TeamEventStatus, TeamRobot, TeamSimple) {
                'use strict';

                /**
                 * Team service.
                 * @module TBAAPI.Client/api/TeamApi
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new TeamApi. 
                 * @alias module:TBAAPI.Client/api/TeamApi
                 * @class
                 * @param {module:TBAAPI.Client/ApiClient} apiClient Optional API client implementation to use,
                 * default to {@link module:TBAAPI.Client/ApiClient#instance} if unspecified.
                 */
                var exports = function (apiClient) {
                    this.apiClient = apiClient || ApiClient.instance;


                    /**
                     * Callback function to receive the result of the getDistrictRankings operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getDistrictRankingsCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/DistrictRanking>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of team district rankings for the given district.
                     * @param {String} districtKey TBA District Key, eg &#x60;2016fim&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getDistrictRankingsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/DistrictRanking>}
                     */
                    this.getDistrictRankings = function (districtKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'districtKey' is set
                        if (districtKey === undefined || districtKey === null) {
                            throw new Error("Missing the required parameter 'districtKey' when calling getDistrictRankings");
                        }


                        var pathParams = {
                            'district_key': districtKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [DistrictRanking];

                        return this.apiClient.callApi(
                            '/district/{district_key}/rankings', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getDistrictTeams operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getDistrictTeamsCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Team>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of &#x60;Team&#x60; objects that competed in events in the given district.
                     * @param {String} districtKey TBA District Key, eg &#x60;2016fim&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getDistrictTeamsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Team>}
                     */
                    this.getDistrictTeams = function (districtKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'districtKey' is set
                        if (districtKey === undefined || districtKey === null) {
                            throw new Error("Missing the required parameter 'districtKey' when calling getDistrictTeams");
                        }


                        var pathParams = {
                            'district_key': districtKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Team];

                        return this.apiClient.callApi(
                            '/district/{district_key}/teams', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getDistrictTeamsKeys operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getDistrictTeamsKeysCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<'String'>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of &#x60;Team&#x60; objects that competed in events in the given district.
                     * @param {String} districtKey TBA District Key, eg &#x60;2016fim&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getDistrictTeamsKeysCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<'String'>}
                     */
                    this.getDistrictTeamsKeys = function (districtKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'districtKey' is set
                        if (districtKey === undefined || districtKey === null) {
                            throw new Error("Missing the required parameter 'districtKey' when calling getDistrictTeamsKeys");
                        }


                        var pathParams = {
                            'district_key': districtKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = ['String'];

                        return this.apiClient.callApi(
                            '/district/{district_key}/teams/keys', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getDistrictTeamsSimple operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getDistrictTeamsSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/TeamSimple>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a short-form list of &#x60;Team&#x60; objects that competed in events in the given district.
                     * @param {String} districtKey TBA District Key, eg &#x60;2016fim&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getDistrictTeamsSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/TeamSimple>}
                     */
                    this.getDistrictTeamsSimple = function (districtKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'districtKey' is set
                        if (districtKey === undefined || districtKey === null) {
                            throw new Error("Missing the required parameter 'districtKey' when calling getDistrictTeamsSimple");
                        }


                        var pathParams = {
                            'district_key': districtKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [TeamSimple];

                        return this.apiClient.callApi(
                            '/district/{district_key}/teams/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventTeams operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getEventTeamsCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Team>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of &#x60;Team&#x60; objects that competed in the given event.
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getEventTeamsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Team>}
                     */
                    this.getEventTeams = function (eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getEventTeams");
                        }


                        var pathParams = {
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Team];

                        return this.apiClient.callApi(
                            '/event/{event_key}/teams', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventTeamsKeys operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getEventTeamsKeysCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<'String'>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of &#x60;Team&#x60; keys that competed in the given event.
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getEventTeamsKeysCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<'String'>}
                     */
                    this.getEventTeamsKeys = function (eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getEventTeamsKeys");
                        }


                        var pathParams = {
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = ['String'];

                        return this.apiClient.callApi(
                            '/event/{event_key}/teams/keys', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getEventTeamsSimple operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getEventTeamsSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/TeamSimple>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a short-form list of &#x60;Team&#x60; objects that competed in the given event.
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getEventTeamsSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/TeamSimple>}
                     */
                    this.getEventTeamsSimple = function (eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getEventTeamsSimple");
                        }


                        var pathParams = {
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [TeamSimple];

                        return this.apiClient.callApi(
                            '/event/{event_key}/teams/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeam operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamCallback
                     * @param {String} error Error message, if any.
                     * @param {module:TBAAPI.Client/model/Team} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a &#x60;Team&#x60; object for the team referenced by the given key.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link module:TBAAPI.Client/model/Team}
                     */
                    this.getTeam = function (teamKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeam");
                        }


                        var pathParams = {
                            'team_key': teamKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = Team;

                        return this.apiClient.callApi(
                            '/team/{team_key}', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamAwards operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamAwardsCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Award>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of awards the given team has won.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamAwardsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Award>}
                     */
                    this.getTeamAwards = function (teamKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamAwards");
                        }


                        var pathParams = {
                            'team_key': teamKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Award];

                        return this.apiClient.callApi(
                            '/team/{team_key}/awards', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamAwardsByYear operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamAwardsByYearCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Award>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of awards the given team has won in a given year.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamAwardsByYearCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Award>}
                     */
                    this.getTeamAwardsByYear = function (teamKey, year, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamAwardsByYear");
                        }

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getTeamAwardsByYear");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'year': year
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Award];

                        return this.apiClient.callApi(
                            '/team/{team_key}/awards/{year}', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamDistricts operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamDistrictsCallback
                     * @param {String} error Error message, if any.
                     * @param {Object.<String, {'String': 'String'}>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list or year and district pairs to denote each year the team was in a district. Will return an empty array if the team was never in a district.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamDistrictsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Object.<String, {'String': 'String'}>}
                     */
                    this.getTeamDistricts = function (teamKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamDistricts");
                        }


                        var pathParams = {
                            'team_key': teamKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = {
                            'String': 'String'
                        };

                        return this.apiClient.callApi(
                            '/team/{team_key}/districts', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamEventAwards operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamEventAwardsCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Award>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of awards the given team won at the given event.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamEventAwardsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Award>}
                     */
                    this.getTeamEventAwards = function (teamKey, eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamEventAwards");
                        }

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getTeamEventAwards");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Award];

                        return this.apiClient.callApi(
                            '/team/{team_key}/event/{event_key}/awards', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamEventMatches operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamEventMatchesCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Match>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of matches for the given team and event.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamEventMatchesCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Match>}
                     */
                    this.getTeamEventMatches = function (teamKey, eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamEventMatches");
                        }

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getTeamEventMatches");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Match];

                        return this.apiClient.callApi(
                            '/team/{team_key}/event/{event_key}/matches', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamEventMatchesKeys operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamEventMatchesKeysCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<'String'>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of match keys for matches for the given team and event.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamEventMatchesKeysCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<'String'>}
                     */
                    this.getTeamEventMatchesKeys = function (teamKey, eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamEventMatchesKeys");
                        }

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getTeamEventMatchesKeys");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = ['String'];

                        return this.apiClient.callApi(
                            '/team/{team_key}/event/{event_key}/matches/keys', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamEventMatchesSimple operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamEventMatchesSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Match>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a short-form list of matches for the given team and event.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamEventMatchesSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Match>}
                     */
                    this.getTeamEventMatchesSimple = function (teamKey, eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamEventMatchesSimple");
                        }

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getTeamEventMatchesSimple");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Match];

                        return this.apiClient.callApi(
                            '/team/{team_key}/event/{event_key}/matches/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamEventStatus operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamEventStatusCallback
                     * @param {String} error Error message, if any.
                     * @param {module:TBAAPI.Client/model/TeamEventStatus} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets the competition rank and status of the team at the given event.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {String} eventKey TBA Event Key, eg &#x60;2016nytr&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamEventStatusCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link module:TBAAPI.Client/model/TeamEventStatus}
                     */
                    this.getTeamEventStatus = function (teamKey, eventKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamEventStatus");
                        }

                        // verify the required parameter 'eventKey' is set
                        if (eventKey === undefined || eventKey === null) {
                            throw new Error("Missing the required parameter 'eventKey' when calling getTeamEventStatus");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'event_key': eventKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = TeamEventStatus;

                        return this.apiClient.callApi(
                            '/team/{team_key}/event/{event_key}/status', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamEvents operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamEventsCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Event>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of all events this team has competed at.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamEventsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Event>}
                     */
                    this.getTeamEvents = function (teamKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamEvents");
                        }


                        var pathParams = {
                            'team_key': teamKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Event];

                        return this.apiClient.callApi(
                            '/team/{team_key}/events', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamEventsByYear operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamEventsByYearCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Event>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of events this team has competed at in the given year.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamEventsByYearCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Event>}
                     */
                    this.getTeamEventsByYear = function (teamKey, year, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamEventsByYear");
                        }

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getTeamEventsByYear");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'year': year
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Event];

                        return this.apiClient.callApi(
                            '/team/{team_key}/events/{year}', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamEventsByYearKeys operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamEventsByYearKeysCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<'String'>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of the event keys for events this team has competed at in the given year.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamEventsByYearKeysCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<'String'>}
                     */
                    this.getTeamEventsByYearKeys = function (teamKey, year, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamEventsByYearKeys");
                        }

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getTeamEventsByYearKeys");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'year': year
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = ['String'];

                        return this.apiClient.callApi(
                            '/team/{team_key}/events/{year}/keys', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamEventsByYearSimple operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamEventsByYearSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/EventSimple>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a short-form list of events this team has competed at in the given year.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamEventsByYearSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/EventSimple>}
                     */
                    this.getTeamEventsByYearSimple = function (teamKey, year, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamEventsByYearSimple");
                        }

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getTeamEventsByYearSimple");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'year': year
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [EventSimple];

                        return this.apiClient.callApi(
                            '/team/{team_key}/events/{year}/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamEventsKeys operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamEventsKeysCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<'String'>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of the event keys for all events this team has competed at.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamEventsKeysCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<'String'>}
                     */
                    this.getTeamEventsKeys = function (teamKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamEventsKeys");
                        }


                        var pathParams = {
                            'team_key': teamKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = ['String'];

                        return this.apiClient.callApi(
                            '/team/{team_key}/events/keys', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamEventsSimple operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamEventsSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/EventSimple>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a short-form list of all events this team has competed at.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamEventsSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/EventSimple>}
                     */
                    this.getTeamEventsSimple = function (teamKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamEventsSimple");
                        }


                        var pathParams = {
                            'team_key': teamKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [EventSimple];

                        return this.apiClient.callApi(
                            '/team/{team_key}/events/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamMatchesByYear operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamMatchesByYearCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Match>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of matches for the given team and year.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamMatchesByYearCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Match>}
                     */
                    this.getTeamMatchesByYear = function (teamKey, year, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamMatchesByYear");
                        }

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getTeamMatchesByYear");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'year': year
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Match];

                        return this.apiClient.callApi(
                            '/team/{team_key}/matches/{year}', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamMatchesByYearKeys operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamMatchesByYearKeysCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<'String'>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of match keys for matches for the given team and year.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamMatchesByYearKeysCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<'String'>}
                     */
                    this.getTeamMatchesByYearKeys = function (teamKey, year, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamMatchesByYearKeys");
                        }

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getTeamMatchesByYearKeys");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'year': year
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = ['String'];

                        return this.apiClient.callApi(
                            '/team/{team_key}/matches/{year}/keys', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamMatchesByYearSimple operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamMatchesByYearSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/MatchSimple>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a short-form list of matches for the given team and year.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamMatchesByYearSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/MatchSimple>}
                     */
                    this.getTeamMatchesByYearSimple = function (teamKey, year, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamMatchesByYearSimple");
                        }

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getTeamMatchesByYearSimple");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'year': year
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [MatchSimple];

                        return this.apiClient.callApi(
                            '/team/{team_key}/matches/{year}/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamMediaByTag operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamMediaByTagCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Media>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of Media (videos / pictures) for the given team and tag.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {String} mediaTag Media Tag which describes the Media.
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamMediaByTagCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Media>}
                     */
                    this.getTeamMediaByTag = function (teamKey, mediaTag, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamMediaByTag");
                        }

                        // verify the required parameter 'mediaTag' is set
                        if (mediaTag === undefined || mediaTag === null) {
                            throw new Error("Missing the required parameter 'mediaTag' when calling getTeamMediaByTag");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'media_tag': mediaTag
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Media];

                        return this.apiClient.callApi(
                            '/team/{team_key}/media/tag/{media_tag}', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamMediaByTagYear operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamMediaByTagYearCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Media>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of Media (videos / pictures) for the given team, tag and year.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {String} mediaTag Media Tag which describes the Media.
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamMediaByTagYearCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Media>}
                     */
                    this.getTeamMediaByTagYear = function (teamKey, mediaTag, year, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamMediaByTagYear");
                        }

                        // verify the required parameter 'mediaTag' is set
                        if (mediaTag === undefined || mediaTag === null) {
                            throw new Error("Missing the required parameter 'mediaTag' when calling getTeamMediaByTagYear");
                        }

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getTeamMediaByTagYear");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'media_tag': mediaTag,
                            'year': year
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Media];

                        return this.apiClient.callApi(
                            '/team/{team_key}/media/tag/{media_tag}/{year}', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamMediaByYear operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamMediaByYearCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Media>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of Media (videos / pictures) for the given team and year.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamMediaByYearCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Media>}
                     */
                    this.getTeamMediaByYear = function (teamKey, year, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamMediaByYear");
                        }

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getTeamMediaByYear");
                        }


                        var pathParams = {
                            'team_key': teamKey,
                            'year': year
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Media];

                        return this.apiClient.callApi(
                            '/team/{team_key}/media/{year}', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamRobots operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamRobotsCallback
                     * @param {String} error Error message, if any.
                     * @param {Object.<String, module:TBAAPI.Client/model/{'String': TeamRobot}>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of year and robot name pairs for each year that a robot name was provided. Will return an empty array if the team has never named a robot.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamRobotsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Object.<String, module:TBAAPI.Client/model/{'String': TeamRobot}>}
                     */
                    this.getTeamRobots = function (teamKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamRobots");
                        }


                        var pathParams = {
                            'team_key': teamKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = {
                            'String': TeamRobot
                        };

                        return this.apiClient.callApi(
                            '/team/{team_key}/robots', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamSimple operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {module:TBAAPI.Client/model/TeamSimple} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a &#x60;Team_Simple&#x60; object for the team referenced by the given key.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link module:TBAAPI.Client/model/TeamSimple}
                     */
                    this.getTeamSimple = function (teamKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamSimple");
                        }


                        var pathParams = {
                            'team_key': teamKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = TeamSimple;

                        return this.apiClient.callApi(
                            '/team/{team_key}/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamSocialMedia operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamSocialMediaCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Media>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of Media (social media) for the given team.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamSocialMediaCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Media>}
                     */
                    this.getTeamSocialMedia = function (teamKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamSocialMedia");
                        }


                        var pathParams = {
                            'team_key': teamKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Media];

                        return this.apiClient.callApi(
                            '/team/{team_key}/social_media', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamYearsParticipated operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamYearsParticipatedCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<'Number'>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of years in which the team participated in at least one competition.
                     * @param {String} teamKey TBA Team Key, eg &#x60;frc254&#x60;
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamYearsParticipatedCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<'Number'>}
                     */
                    this.getTeamYearsParticipated = function (teamKey, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'teamKey' is set
                        if (teamKey === undefined || teamKey === null) {
                            throw new Error("Missing the required parameter 'teamKey' when calling getTeamYearsParticipated");
                        }


                        var pathParams = {
                            'team_key': teamKey
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = ['Number'];

                        return this.apiClient.callApi(
                            '/team/{team_key}/years_participated', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeams operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamsCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Team>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of &#x60;Team&#x60; objects, paginated in groups of 500.
                     * @param {Number} pageNum Page number of results to return, zero-indexed
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamsCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Team>}
                     */
                    this.getTeams = function (pageNum, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'pageNum' is set
                        if (pageNum === undefined || pageNum === null) {
                            throw new Error("Missing the required parameter 'pageNum' when calling getTeams");
                        }


                        var pathParams = {
                            'page_num': pageNum
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Team];

                        return this.apiClient.callApi(
                            '/teams/{page_num}', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamsByYear operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamsByYearCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/Team>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of &#x60;Team&#x60; objects that competed in the given year, paginated in groups of 500.
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Number} pageNum Page number of results to return, zero-indexed
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamsByYearCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/Team>}
                     */
                    this.getTeamsByYear = function (year, pageNum, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getTeamsByYear");
                        }

                        // verify the required parameter 'pageNum' is set
                        if (pageNum === undefined || pageNum === null) {
                            throw new Error("Missing the required parameter 'pageNum' when calling getTeamsByYear");
                        }


                        var pathParams = {
                            'year': year,
                            'page_num': pageNum
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [Team];

                        return this.apiClient.callApi(
                            '/teams/{year}/{page_num}', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamsByYearKeys operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamsByYearKeysCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<'String'>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list Team Keys that competed in the given year, paginated in groups of 500.
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Number} pageNum Page number of results to return, zero-indexed
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamsByYearKeysCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<'String'>}
                     */
                    this.getTeamsByYearKeys = function (year, pageNum, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getTeamsByYearKeys");
                        }

                        // verify the required parameter 'pageNum' is set
                        if (pageNum === undefined || pageNum === null) {
                            throw new Error("Missing the required parameter 'pageNum' when calling getTeamsByYearKeys");
                        }


                        var pathParams = {
                            'year': year,
                            'page_num': pageNum
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = ['String'];

                        return this.apiClient.callApi(
                            '/teams/{year}/{page_num}/keys', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamsByYearSimple operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamsByYearSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/TeamSimple>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of short form &#x60;Team_Simple&#x60; objects that competed in the given year, paginated in groups of 500.
                     * @param {Number} year Competition Year (or Season). Must be 4 digits.
                     * @param {Number} pageNum Page number of results to return, zero-indexed
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamsByYearSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/TeamSimple>}
                     */
                    this.getTeamsByYearSimple = function (year, pageNum, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'year' is set
                        if (year === undefined || year === null) {
                            throw new Error("Missing the required parameter 'year' when calling getTeamsByYearSimple");
                        }

                        // verify the required parameter 'pageNum' is set
                        if (pageNum === undefined || pageNum === null) {
                            throw new Error("Missing the required parameter 'pageNum' when calling getTeamsByYearSimple");
                        }


                        var pathParams = {
                            'year': year,
                            'page_num': pageNum
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [TeamSimple];

                        return this.apiClient.callApi(
                            '/teams/{year}/{page_num}/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamsKeys operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamsKeysCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<'String'>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of Team keys, paginated in groups of 500. (Note, each page will not have 500 teams, but will include the teams within that range of 500.)
                     * @param {Number} pageNum Page number of results to return, zero-indexed
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamsKeysCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<'String'>}
                     */
                    this.getTeamsKeys = function (pageNum, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'pageNum' is set
                        if (pageNum === undefined || pageNum === null) {
                            throw new Error("Missing the required parameter 'pageNum' when calling getTeamsKeys");
                        }


                        var pathParams = {
                            'page_num': pageNum
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = ['String'];

                        return this.apiClient.callApi(
                            '/teams/{page_num}/keys', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }

                    /**
                     * Callback function to receive the result of the getTeamsSimple operation.
                     * @callback module:TBAAPI.Client/api/TeamApi~getTeamsSimpleCallback
                     * @param {String} error Error message, if any.
                     * @param {Array.<module:TBAAPI.Client/model/TeamSimple>} data The data returned by the service call.
                     * @param {String} response The complete HTTP response.
                     */

                    /**
                     * Gets a list of short form &#x60;Team_Simple&#x60; objects, paginated in groups of 500.
                     * @param {Number} pageNum Page number of results to return, zero-indexed
                     * @param {Object} opts Optional parameters
                     * @param {String} opts.ifModifiedSince Value of the &#x60;Last-Modified&#x60; header in the most recently cached response by the client.
                     * @param {module:TBAAPI.Client/api/TeamApi~getTeamsSimpleCallback} callback The callback function, accepting three arguments: error, data, response
                     * data is of type: {@link Array.<module:TBAAPI.Client/model/TeamSimple>}
                     */
                    this.getTeamsSimple = function (pageNum, opts, callback) {
                        opts = opts || {};
                        var postBody = null;

                        // verify the required parameter 'pageNum' is set
                        if (pageNum === undefined || pageNum === null) {
                            throw new Error("Missing the required parameter 'pageNum' when calling getTeamsSimple");
                        }


                        var pathParams = {
                            'page_num': pageNum
                        };
                        var queryParams = {};
                        var headerParams = {
                            'If-Modified-Since': opts['ifModifiedSince']
                        };
                        var formParams = {};

                        var authNames = ['apiKey'];
                        var contentTypes = [];
                        var accepts = ['application/json'];
                        var returnType = [TeamSimple];

                        return this.apiClient.callApi(
                            '/teams/{page_num}/simple', 'GET',
                            pathParams, queryParams, headerParams, formParams, postBody,
                            authNames, contentTypes, accepts, returnType, callback
                        );
                    }
                };

                return exports;
            }));

}, {
            "../ApiClient": 9,
            "../model/Award": 19,
            "../model/DistrictRanking": 22,
            "../model/Event": 27,
            "../model/EventSimple": 41,
            "../model/Match": 42,
            "../model/MatchSimple": 50,
            "../model/Media": 53,
            "../model/Team": 54,
            "../model/TeamEventStatus": 55,
            "../model/TeamRobot": 62,
            "../model/TeamSimple": 63
        }],
        16: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/APIStatus', 'TBAAPI.Client/model/APIStatusAppVersion', 'TBAAPI.Client/model/Award', 'TBAAPI.Client/model/AwardRecipient', 'TBAAPI.Client/model/DistrictList', 'TBAAPI.Client/model/DistrictRanking', 'TBAAPI.Client/model/DistrictRankingEventPoints', 'TBAAPI.Client/model/EliminationAlliance', 'TBAAPI.Client/model/EliminationAllianceBackup', 'TBAAPI.Client/model/EliminationAllianceStatus', 'TBAAPI.Client/model/Event', 'TBAAPI.Client/model/EventDistrictPoints', 'TBAAPI.Client/model/EventDistrictPointsPoints', 'TBAAPI.Client/model/EventDistrictPointsTiebreakers', 'TBAAPI.Client/model/EventInsights2016', 'TBAAPI.Client/model/EventInsights2016Detail', 'TBAAPI.Client/model/EventInsights2017', 'TBAAPI.Client/model/EventInsights2017Detail', 'TBAAPI.Client/model/EventOPRs', 'TBAAPI.Client/model/EventPredictions', 'TBAAPI.Client/model/EventRanking', 'TBAAPI.Client/model/EventRankingExtraStatsInfo', 'TBAAPI.Client/model/EventRankingRankings', 'TBAAPI.Client/model/EventRankingSortOrderInfo', 'TBAAPI.Client/model/EventSimple', 'TBAAPI.Client/model/Match', 'TBAAPI.Client/model/MatchAlliance', 'TBAAPI.Client/model/MatchScoreBreakdown2015', 'TBAAPI.Client/model/MatchScoreBreakdown2015Alliance', 'TBAAPI.Client/model/MatchScoreBreakdown2016', 'TBAAPI.Client/model/MatchScoreBreakdown2016Alliance', 'TBAAPI.Client/model/MatchScoreBreakdown2017', 'TBAAPI.Client/model/MatchScoreBreakdown2017Alliance', 'TBAAPI.Client/model/MatchSimple', 'TBAAPI.Client/model/MatchSimpleAlliances', 'TBAAPI.Client/model/MatchVideos', 'TBAAPI.Client/model/Media', 'TBAAPI.Client/model/Team', 'TBAAPI.Client/model/TeamEventStatus', 'TBAAPI.Client/model/TeamEventStatusAlliance', 'TBAAPI.Client/model/TeamEventStatusAllianceBackup', 'TBAAPI.Client/model/TeamEventStatusPlayoff', 'TBAAPI.Client/model/TeamEventStatusRank', 'TBAAPI.Client/model/TeamEventStatusRankRanking', 'TBAAPI.Client/model/TeamEventStatusRankSortOrderInfo', 'TBAAPI.Client/model/TeamRobot', 'TBAAPI.Client/model/TeamSimple', 'TBAAPI.Client/model/WLTRecord', 'TBAAPI.Client/model/Webcast', 'TBAAPI.Client/api/DistrictApi', 'TBAAPI.Client/api/EventApi', 'TBAAPI.Client/api/ListApi', 'TBAAPI.Client/api/MatchApi', 'TBAAPI.Client/api/TBAApi', 'TBAAPI.Client/api/TeamApi'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('./ApiClient'), require('./model/APIStatus'), require('./model/APIStatusAppVersion'), require('./model/Award'), require('./model/AwardRecipient'), require('./model/DistrictList'), require('./model/DistrictRanking'), require('./model/DistrictRankingEventPoints'), require('./model/EliminationAlliance'), require('./model/EliminationAllianceBackup'), require('./model/EliminationAllianceStatus'), require('./model/Event'), require('./model/EventDistrictPoints'), require('./model/EventDistrictPointsPoints'), require('./model/EventDistrictPointsTiebreakers'), require('./model/EventInsights2016'), require('./model/EventInsights2016Detail'), require('./model/EventInsights2017'), require('./model/EventInsights2017Detail'), require('./model/EventOPRs'), require('./model/EventPredictions'), require('./model/EventRanking'), require('./model/EventRankingExtraStatsInfo'), require('./model/EventRankingRankings'), require('./model/EventRankingSortOrderInfo'), require('./model/EventSimple'), require('./model/Match'), require('./model/MatchAlliance'), require('./model/MatchScoreBreakdown2015'), require('./model/MatchScoreBreakdown2015Alliance'), require('./model/MatchScoreBreakdown2016'), require('./model/MatchScoreBreakdown2016Alliance'), require('./model/MatchScoreBreakdown2017'), require('./model/MatchScoreBreakdown2017Alliance'), require('./model/MatchSimple'), require('./model/MatchSimpleAlliances'), require('./model/MatchVideos'), require('./model/Media'), require('./model/Team'), require('./model/TeamEventStatus'), require('./model/TeamEventStatusAlliance'), require('./model/TeamEventStatusAllianceBackup'), require('./model/TeamEventStatusPlayoff'), require('./model/TeamEventStatusRank'), require('./model/TeamEventStatusRankRanking'), require('./model/TeamEventStatusRankSortOrderInfo'), require('./model/TeamRobot'), require('./model/TeamSimple'), require('./model/WLTRecord'), require('./model/Webcast'), require('./api/DistrictApi'), require('./api/EventApi'), require('./api/ListApi'), require('./api/MatchApi'), require('./api/TBAApi'), require('./api/TeamApi'));
                }
            }(function (ApiClient, APIStatus, APIStatusAppVersion, Award, AwardRecipient, DistrictList, DistrictRanking, DistrictRankingEventPoints, EliminationAlliance, EliminationAllianceBackup, EliminationAllianceStatus, Event, EventDistrictPoints, EventDistrictPointsPoints, EventDistrictPointsTiebreakers, EventInsights2016, EventInsights2016Detail, EventInsights2017, EventInsights2017Detail, EventOPRs, EventPredictions, EventRanking, EventRankingExtraStatsInfo, EventRankingRankings, EventRankingSortOrderInfo, EventSimple, Match, MatchAlliance, MatchScoreBreakdown2015, MatchScoreBreakdown2015Alliance, MatchScoreBreakdown2016, MatchScoreBreakdown2016Alliance, MatchScoreBreakdown2017, MatchScoreBreakdown2017Alliance, MatchSimple, MatchSimpleAlliances, MatchVideos, Media, Team, TeamEventStatus, TeamEventStatusAlliance, TeamEventStatusAllianceBackup, TeamEventStatusPlayoff, TeamEventStatusRank, TeamEventStatusRankRanking, TeamEventStatusRankSortOrderInfo, TeamRobot, TeamSimple, WLTRecord, Webcast, DistrictApi, EventApi, ListApi, MatchApi, TBAApi, TeamApi) {
                'use strict';

                /**
                 * _Overview__Information_and_statistics_about_FIRST_Robotics_Competition_teams_and_events__If_you_are_looking_for_the_old_version__v2_of_the_API_documentation_can_be_found__here_apidocsv2___Authentication_All_endpoints_require_an_Auth_Key_to_be_passed_in_the_header_X_TBA_Auth_Key__If_you_do_not_have_an_auth_key_yet_you_can_obtain_one_from_your__Account_Page_account___A_User_Agent_header_may_need_to_be_set_to_prevent_a_403_Unauthorized_error_.<br>
                 * The <code>index</code> module provides access to constructors for all the classes which comprise the public API.
                 * <p>
                 * An AMD (recommended!) or CommonJS application will generally do something equivalent to the following:
                 * <pre>
                 * var TbaApiV3client = require('TBAAPI.Client/index'); // See note below*.
                 * var xxxSvc = new TbaApiV3client.XxxApi(); // Allocate the API class we're going to use.
                 * var yyyModel = new TbaApiV3client.Yyy(); // Construct a model instance.
                 * yyyModel.someProperty = 'someValue';
                 * ...
                 * var zzz = xxxSvc.doSomething(yyyModel); // Invoke the service.
                 * ...
                 * </pre>
                 * <em>*NOTE: For a top-level AMD script, use require(['TBAAPI.Client/index'], function(){...})
                 * and put the application logic within the callback function.</em>
                 * </p>
                 * <p>
                 * A non-AMD browser application (discouraged) might do something like this:
                 * <pre>
                 * var xxxSvc = new TbaApiV3client.XxxApi(); // Allocate the API class we're going to use.
                 * var yyy = new TbaApiV3client.Yyy(); // Construct a model instance.
                 * yyyModel.someProperty = 'someValue';
                 * ...
                 * var zzz = xxxSvc.doSomething(yyyModel); // Invoke the service.
                 * ...
                 * </pre>
                 * </p>
                 * @module TBAAPI.Client/index
                 * @version 3.0.4
                 */
                var exports = {
                    /**
                     * The ApiClient constructor.
                     * @property {module:TBAAPI.Client/ApiClient}
                     */
                    ApiClient: ApiClient,
                    /**
                     * The APIStatus model constructor.
                     * @property {module:TBAAPI.Client/model/APIStatus}
                     */
                    APIStatus: APIStatus,
                    /**
                     * The APIStatusAppVersion model constructor.
                     * @property {module:TBAAPI.Client/model/APIStatusAppVersion}
                     */
                    APIStatusAppVersion: APIStatusAppVersion,
                    /**
                     * The Award model constructor.
                     * @property {module:TBAAPI.Client/model/Award}
                     */
                    Award: Award,
                    /**
                     * The AwardRecipient model constructor.
                     * @property {module:TBAAPI.Client/model/AwardRecipient}
                     */
                    AwardRecipient: AwardRecipient,
                    /**
                     * The DistrictList model constructor.
                     * @property {module:TBAAPI.Client/model/DistrictList}
                     */
                    DistrictList: DistrictList,
                    /**
                     * The DistrictRanking model constructor.
                     * @property {module:TBAAPI.Client/model/DistrictRanking}
                     */
                    DistrictRanking: DistrictRanking,
                    /**
                     * The DistrictRankingEventPoints model constructor.
                     * @property {module:TBAAPI.Client/model/DistrictRankingEventPoints}
                     */
                    DistrictRankingEventPoints: DistrictRankingEventPoints,
                    /**
                     * The EliminationAlliance model constructor.
                     * @property {module:TBAAPI.Client/model/EliminationAlliance}
                     */
                    EliminationAlliance: EliminationAlliance,
                    /**
                     * The EliminationAllianceBackup model constructor.
                     * @property {module:TBAAPI.Client/model/EliminationAllianceBackup}
                     */
                    EliminationAllianceBackup: EliminationAllianceBackup,
                    /**
                     * The EliminationAllianceStatus model constructor.
                     * @property {module:TBAAPI.Client/model/EliminationAllianceStatus}
                     */
                    EliminationAllianceStatus: EliminationAllianceStatus,
                    /**
                     * The Event model constructor.
                     * @property {module:TBAAPI.Client/model/Event}
                     */
                    Event: Event,
                    /**
                     * The EventDistrictPoints model constructor.
                     * @property {module:TBAAPI.Client/model/EventDistrictPoints}
                     */
                    EventDistrictPoints: EventDistrictPoints,
                    /**
                     * The EventDistrictPointsPoints model constructor.
                     * @property {module:TBAAPI.Client/model/EventDistrictPointsPoints}
                     */
                    EventDistrictPointsPoints: EventDistrictPointsPoints,
                    /**
                     * The EventDistrictPointsTiebreakers model constructor.
                     * @property {module:TBAAPI.Client/model/EventDistrictPointsTiebreakers}
                     */
                    EventDistrictPointsTiebreakers: EventDistrictPointsTiebreakers,
                    /**
                     * The EventInsights2016 model constructor.
                     * @property {module:TBAAPI.Client/model/EventInsights2016}
                     */
                    EventInsights2016: EventInsights2016,
                    /**
                     * The EventInsights2016Detail model constructor.
                     * @property {module:TBAAPI.Client/model/EventInsights2016Detail}
                     */
                    EventInsights2016Detail: EventInsights2016Detail,
                    /**
                     * The EventInsights2017 model constructor.
                     * @property {module:TBAAPI.Client/model/EventInsights2017}
                     */
                    EventInsights2017: EventInsights2017,
                    /**
                     * The EventInsights2017Detail model constructor.
                     * @property {module:TBAAPI.Client/model/EventInsights2017Detail}
                     */
                    EventInsights2017Detail: EventInsights2017Detail,
                    /**
                     * The EventOPRs model constructor.
                     * @property {module:TBAAPI.Client/model/EventOPRs}
                     */
                    EventOPRs: EventOPRs,
                    /**
                     * The EventPredictions model constructor.
                     * @property {module:TBAAPI.Client/model/EventPredictions}
                     */
                    EventPredictions: EventPredictions,
                    /**
                     * The EventRanking model constructor.
                     * @property {module:TBAAPI.Client/model/EventRanking}
                     */
                    EventRanking: EventRanking,
                    /**
                     * The EventRankingExtraStatsInfo model constructor.
                     * @property {module:TBAAPI.Client/model/EventRankingExtraStatsInfo}
                     */
                    EventRankingExtraStatsInfo: EventRankingExtraStatsInfo,
                    /**
                     * The EventRankingRankings model constructor.
                     * @property {module:TBAAPI.Client/model/EventRankingRankings}
                     */
                    EventRankingRankings: EventRankingRankings,
                    /**
                     * The EventRankingSortOrderInfo model constructor.
                     * @property {module:TBAAPI.Client/model/EventRankingSortOrderInfo}
                     */
                    EventRankingSortOrderInfo: EventRankingSortOrderInfo,
                    /**
                     * The EventSimple model constructor.
                     * @property {module:TBAAPI.Client/model/EventSimple}
                     */
                    EventSimple: EventSimple,
                    /**
                     * The Match model constructor.
                     * @property {module:TBAAPI.Client/model/Match}
                     */
                    Match: Match,
                    /**
                     * The MatchAlliance model constructor.
                     * @property {module:TBAAPI.Client/model/MatchAlliance}
                     */
                    MatchAlliance: MatchAlliance,
                    /**
                     * The MatchScoreBreakdown2015 model constructor.
                     * @property {module:TBAAPI.Client/model/MatchScoreBreakdown2015}
                     */
                    MatchScoreBreakdown2015: MatchScoreBreakdown2015,
                    /**
                     * The MatchScoreBreakdown2015Alliance model constructor.
                     * @property {module:TBAAPI.Client/model/MatchScoreBreakdown2015Alliance}
                     */
                    MatchScoreBreakdown2015Alliance: MatchScoreBreakdown2015Alliance,
                    /**
                     * The MatchScoreBreakdown2016 model constructor.
                     * @property {module:TBAAPI.Client/model/MatchScoreBreakdown2016}
                     */
                    MatchScoreBreakdown2016: MatchScoreBreakdown2016,
                    /**
                     * The MatchScoreBreakdown2016Alliance model constructor.
                     * @property {module:TBAAPI.Client/model/MatchScoreBreakdown2016Alliance}
                     */
                    MatchScoreBreakdown2016Alliance: MatchScoreBreakdown2016Alliance,
                    /**
                     * The MatchScoreBreakdown2017 model constructor.
                     * @property {module:TBAAPI.Client/model/MatchScoreBreakdown2017}
                     */
                    MatchScoreBreakdown2017: MatchScoreBreakdown2017,
                    /**
                     * The MatchScoreBreakdown2017Alliance model constructor.
                     * @property {module:TBAAPI.Client/model/MatchScoreBreakdown2017Alliance}
                     */
                    MatchScoreBreakdown2017Alliance: MatchScoreBreakdown2017Alliance,
                    /**
                     * The MatchSimple model constructor.
                     * @property {module:TBAAPI.Client/model/MatchSimple}
                     */
                    MatchSimple: MatchSimple,
                    /**
                     * The MatchSimpleAlliances model constructor.
                     * @property {module:TBAAPI.Client/model/MatchSimpleAlliances}
                     */
                    MatchSimpleAlliances: MatchSimpleAlliances,
                    /**
                     * The MatchVideos model constructor.
                     * @property {module:TBAAPI.Client/model/MatchVideos}
                     */
                    MatchVideos: MatchVideos,
                    /**
                     * The Media model constructor.
                     * @property {module:TBAAPI.Client/model/Media}
                     */
                    Media: Media,
                    /**
                     * The Team model constructor.
                     * @property {module:TBAAPI.Client/model/Team}
                     */
                    Team: Team,
                    /**
                     * The TeamEventStatus model constructor.
                     * @property {module:TBAAPI.Client/model/TeamEventStatus}
                     */
                    TeamEventStatus: TeamEventStatus,
                    /**
                     * The TeamEventStatusAlliance model constructor.
                     * @property {module:TBAAPI.Client/model/TeamEventStatusAlliance}
                     */
                    TeamEventStatusAlliance: TeamEventStatusAlliance,
                    /**
                     * The TeamEventStatusAllianceBackup model constructor.
                     * @property {module:TBAAPI.Client/model/TeamEventStatusAllianceBackup}
                     */
                    TeamEventStatusAllianceBackup: TeamEventStatusAllianceBackup,
                    /**
                     * The TeamEventStatusPlayoff model constructor.
                     * @property {module:TBAAPI.Client/model/TeamEventStatusPlayoff}
                     */
                    TeamEventStatusPlayoff: TeamEventStatusPlayoff,
                    /**
                     * The TeamEventStatusRank model constructor.
                     * @property {module:TBAAPI.Client/model/TeamEventStatusRank}
                     */
                    TeamEventStatusRank: TeamEventStatusRank,
                    /**
                     * The TeamEventStatusRankRanking model constructor.
                     * @property {module:TBAAPI.Client/model/TeamEventStatusRankRanking}
                     */
                    TeamEventStatusRankRanking: TeamEventStatusRankRanking,
                    /**
                     * The TeamEventStatusRankSortOrderInfo model constructor.
                     * @property {module:TBAAPI.Client/model/TeamEventStatusRankSortOrderInfo}
                     */
                    TeamEventStatusRankSortOrderInfo: TeamEventStatusRankSortOrderInfo,
                    /**
                     * The TeamRobot model constructor.
                     * @property {module:TBAAPI.Client/model/TeamRobot}
                     */
                    TeamRobot: TeamRobot,
                    /**
                     * The TeamSimple model constructor.
                     * @property {module:TBAAPI.Client/model/TeamSimple}
                     */
                    TeamSimple: TeamSimple,
                    /**
                     * The WLTRecord model constructor.
                     * @property {module:TBAAPI.Client/model/WLTRecord}
                     */
                    WLTRecord: WLTRecord,
                    /**
                     * The Webcast model constructor.
                     * @property {module:TBAAPI.Client/model/Webcast}
                     */
                    Webcast: Webcast,
                    /**
                     * The DistrictApi service constructor.
                     * @property {module:TBAAPI.Client/api/DistrictApi}
                     */
                    DistrictApi: DistrictApi,
                    /**
                     * The EventApi service constructor.
                     * @property {module:TBAAPI.Client/api/EventApi}
                     */
                    EventApi: EventApi,
                    /**
                     * The ListApi service constructor.
                     * @property {module:TBAAPI.Client/api/ListApi}
                     */
                    ListApi: ListApi,
                    /**
                     * The MatchApi service constructor.
                     * @property {module:TBAAPI.Client/api/MatchApi}
                     */
                    MatchApi: MatchApi,
                    /**
                     * The TBAApi service constructor.
                     * @property {module:TBAAPI.Client/api/TBAApi}
                     */
                    TBAApi: TBAApi,
                    /**
                     * The TeamApi service constructor.
                     * @property {module:TBAAPI.Client/api/TeamApi}
                     */
                    TeamApi: TeamApi
                };

                return exports;
            }));

}, {
            "./ApiClient": 9,
            "./api/DistrictApi": 10,
            "./api/EventApi": 11,
            "./api/ListApi": 12,
            "./api/MatchApi": 13,
            "./api/TBAApi": 14,
            "./api/TeamApi": 15,
            "./model/APIStatus": 17,
            "./model/APIStatusAppVersion": 18,
            "./model/Award": 19,
            "./model/AwardRecipient": 20,
            "./model/DistrictList": 21,
            "./model/DistrictRanking": 22,
            "./model/DistrictRankingEventPoints": 23,
            "./model/EliminationAlliance": 24,
            "./model/EliminationAllianceBackup": 25,
            "./model/EliminationAllianceStatus": 26,
            "./model/Event": 27,
            "./model/EventDistrictPoints": 28,
            "./model/EventDistrictPointsPoints": 29,
            "./model/EventDistrictPointsTiebreakers": 30,
            "./model/EventInsights2016": 31,
            "./model/EventInsights2016Detail": 32,
            "./model/EventInsights2017": 33,
            "./model/EventInsights2017Detail": 34,
            "./model/EventOPRs": 35,
            "./model/EventPredictions": 36,
            "./model/EventRanking": 37,
            "./model/EventRankingExtraStatsInfo": 38,
            "./model/EventRankingRankings": 39,
            "./model/EventRankingSortOrderInfo": 40,
            "./model/EventSimple": 41,
            "./model/Match": 42,
            "./model/MatchAlliance": 43,
            "./model/MatchScoreBreakdown2015": 44,
            "./model/MatchScoreBreakdown2015Alliance": 45,
            "./model/MatchScoreBreakdown2016": 46,
            "./model/MatchScoreBreakdown2016Alliance": 47,
            "./model/MatchScoreBreakdown2017": 48,
            "./model/MatchScoreBreakdown2017Alliance": 49,
            "./model/MatchSimple": 50,
            "./model/MatchSimpleAlliances": 51,
            "./model/MatchVideos": 52,
            "./model/Media": 53,
            "./model/Team": 54,
            "./model/TeamEventStatus": 55,
            "./model/TeamEventStatusAlliance": 56,
            "./model/TeamEventStatusAllianceBackup": 57,
            "./model/TeamEventStatusPlayoff": 58,
            "./model/TeamEventStatusRank": 59,
            "./model/TeamEventStatusRankRanking": 60,
            "./model/TeamEventStatusRankSortOrderInfo": 61,
            "./model/TeamRobot": 62,
            "./model/TeamSimple": 63,
            "./model/WLTRecord": 64,
            "./model/Webcast": 65
        }],
        17: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/APIStatusAppVersion'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('./APIStatusAppVersion'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.APIStatus = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.APIStatusAppVersion);
                }
            }(this, function (ApiClient, APIStatusAppVersion) {
                'use strict';




                /**
                 * The APIStatus model module.
                 * @module TBAAPI.Client/model/APIStatus
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>APIStatus</code>.
                 * @alias module:TBAAPI.Client/model/APIStatus
                 * @class
                 * @param currentSeason {Number} Year of the current FRC season.
                 * @param maxSeason {Number} Maximum FRC season year for valid queries.
                 * @param isDatafeedDown {Boolean} True if the entire FMS API provided by FIRST is down.
                 * @param downEvents {Array.<String>} An array of strings containing event keys of any active events that are no longer updating.
                 * @param ios {module:TBAAPI.Client/model/APIStatusAppVersion} 
                 * @param android {module:TBAAPI.Client/model/APIStatusAppVersion} 
                 */
                var exports = function (currentSeason, maxSeason, isDatafeedDown, downEvents, ios, android) {
                    var _this = this;

                    _this['current_season'] = currentSeason;
                    _this['max_season'] = maxSeason;
                    _this['is_datafeed_down'] = isDatafeedDown;
                    _this['down_events'] = downEvents;
                    _this['ios'] = ios;
                    _this['android'] = android;
                };

                /**
                 * Constructs a <code>APIStatus</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/APIStatus} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/APIStatus} The populated <code>APIStatus</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('current_season')) {
                            obj['current_season'] = ApiClient.convertToType(data['current_season'], 'Number');
                        }
                        if (data.hasOwnProperty('max_season')) {
                            obj['max_season'] = ApiClient.convertToType(data['max_season'], 'Number');
                        }
                        if (data.hasOwnProperty('is_datafeed_down')) {
                            obj['is_datafeed_down'] = ApiClient.convertToType(data['is_datafeed_down'], 'Boolean');
                        }
                        if (data.hasOwnProperty('down_events')) {
                            obj['down_events'] = ApiClient.convertToType(data['down_events'], ['String']);
                        }
                        if (data.hasOwnProperty('ios')) {
                            obj['ios'] = APIStatusAppVersion.constructFromObject(data['ios']);
                        }
                        if (data.hasOwnProperty('android')) {
                            obj['android'] = APIStatusAppVersion.constructFromObject(data['android']);
                        }
                    }
                    return obj;
                }

                /**
                 * Year of the current FRC season.
                 * @member {Number} current_season
                 */
                exports.prototype['current_season'] = undefined;
                /**
                 * Maximum FRC season year for valid queries.
                 * @member {Number} max_season
                 */
                exports.prototype['max_season'] = undefined;
                /**
                 * True if the entire FMS API provided by FIRST is down.
                 * @member {Boolean} is_datafeed_down
                 */
                exports.prototype['is_datafeed_down'] = undefined;
                /**
                 * An array of strings containing event keys of any active events that are no longer updating.
                 * @member {Array.<String>} down_events
                 */
                exports.prototype['down_events'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/APIStatusAppVersion} ios
                 */
                exports.prototype['ios'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/APIStatusAppVersion} android
                 */
                exports.prototype['android'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9,
            "./APIStatusAppVersion": 18
        }],
        18: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.APIStatusAppVersion = factory(root.TbaApiV3client.ApiClient);
                }
            }(this, function (ApiClient) {
                'use strict';




                /**
                 * The APIStatusAppVersion model module.
                 * @module TBAAPI.Client/model/APIStatusAppVersion
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>APIStatusAppVersion</code>.
                 * @alias module:TBAAPI.Client/model/APIStatusAppVersion
                 * @class
                 * @param minAppVersion {Number} Internal use - Minimum application version required to correctly connect and process data.
                 * @param latestAppVersion {Number} Internal use - Latest application version available.
                 */
                var exports = function (minAppVersion, latestAppVersion) {
                    var _this = this;

                    _this['min_app_version'] = minAppVersion;
                    _this['latest_app_version'] = latestAppVersion;
                };

                /**
                 * Constructs a <code>APIStatusAppVersion</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/APIStatusAppVersion} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/APIStatusAppVersion} The populated <code>APIStatusAppVersion</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('min_app_version')) {
                            obj['min_app_version'] = ApiClient.convertToType(data['min_app_version'], 'Number');
                        }
                        if (data.hasOwnProperty('latest_app_version')) {
                            obj['latest_app_version'] = ApiClient.convertToType(data['latest_app_version'], 'Number');
                        }
                    }
                    return obj;
                }

                /**
                 * Internal use - Minimum application version required to correctly connect and process data.
                 * @member {Number} min_app_version
                 */
                exports.prototype['min_app_version'] = undefined;
                /**
                 * Internal use - Latest application version available.
                 * @member {Number} latest_app_version
                 */
                exports.prototype['latest_app_version'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9
        }],
        19: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/AwardRecipient'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('./AwardRecipient'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.Award = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.AwardRecipient);
                }
            }(this, function (ApiClient, AwardRecipient) {
                'use strict';




                /**
                 * The Award model module.
                 * @module TBAAPI.Client/model/Award
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>Award</code>.
                 * @alias module:TBAAPI.Client/model/Award
                 * @class
                 * @param name {String} The name of the award as provided by FIRST. May vary for the same award type.
                 * @param awardType {Number} Type of award given. See https://github.com/the-blue-alliance/the-blue-alliance/blob/master/consts/award_type.py#L6
                 * @param eventKey {String} The event_key of the event the award was won at.
                 * @param recipientList {Array.<module:TBAAPI.Client/model/AwardRecipient>} A list of recipients of the award at the event. Either team_key and/or awardee for individual awards.
                 * @param year {Number} The year this award was won.
                 */
                var exports = function (name, awardType, eventKey, recipientList, year) {
                    var _this = this;

                    _this['name'] = name;
                    _this['award_type'] = awardType;
                    _this['event_key'] = eventKey;
                    _this['recipient_list'] = recipientList;
                    _this['year'] = year;
                };

                /**
                 * Constructs a <code>Award</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/Award} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/Award} The populated <code>Award</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('name')) {
                            obj['name'] = ApiClient.convertToType(data['name'], 'String');
                        }
                        if (data.hasOwnProperty('award_type')) {
                            obj['award_type'] = ApiClient.convertToType(data['award_type'], 'Number');
                        }
                        if (data.hasOwnProperty('event_key')) {
                            obj['event_key'] = ApiClient.convertToType(data['event_key'], 'String');
                        }
                        if (data.hasOwnProperty('recipient_list')) {
                            obj['recipient_list'] = ApiClient.convertToType(data['recipient_list'], [AwardRecipient]);
                        }
                        if (data.hasOwnProperty('year')) {
                            obj['year'] = ApiClient.convertToType(data['year'], 'Number');
                        }
                    }
                    return obj;
                }

                /**
                 * The name of the award as provided by FIRST. May vary for the same award type.
                 * @member {String} name
                 */
                exports.prototype['name'] = undefined;
                /**
                 * Type of award given. See https://github.com/the-blue-alliance/the-blue-alliance/blob/master/consts/award_type.py#L6
                 * @member {Number} award_type
                 */
                exports.prototype['award_type'] = undefined;
                /**
                 * The event_key of the event the award was won at.
                 * @member {String} event_key
                 */
                exports.prototype['event_key'] = undefined;
                /**
                 * A list of recipients of the award at the event. Either team_key and/or awardee for individual awards.
                 * @member {Array.<module:TBAAPI.Client/model/AwardRecipient>} recipient_list
                 */
                exports.prototype['recipient_list'] = undefined;
                /**
                 * The year this award was won.
                 * @member {Number} year
                 */
                exports.prototype['year'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9,
            "./AwardRecipient": 20
        }],
        20: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.AwardRecipient = factory(root.TbaApiV3client.ApiClient);
                }
            }(this, function (ApiClient) {
                'use strict';




                /**
                 * The AwardRecipient model module.
                 * @module TBAAPI.Client/model/AwardRecipient
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>AwardRecipient</code>.
                 * An &#x60;Award_Recipient&#x60; object represents the team and/or person who received an award at an event.
                 * @alias module:TBAAPI.Client/model/AwardRecipient
                 * @class
                 */
                var exports = function () {
                    var _this = this;



                };

                /**
                 * Constructs a <code>AwardRecipient</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/AwardRecipient} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/AwardRecipient} The populated <code>AwardRecipient</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('team_key')) {
                            obj['team_key'] = ApiClient.convertToType(data['team_key'], 'String');
                        }
                        if (data.hasOwnProperty('awardee')) {
                            obj['awardee'] = ApiClient.convertToType(data['awardee'], 'String');
                        }
                    }
                    return obj;
                }

                /**
                 * The TBA team key for the team that was given the award. May be null.
                 * @member {String} team_key
                 */
                exports.prototype['team_key'] = undefined;
                /**
                 * The name of the individual given the award. May be null.
                 * @member {String} awardee
                 */
                exports.prototype['awardee'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9
        }],
        21: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.DistrictList = factory(root.TbaApiV3client.ApiClient);
                }
            }(this, function (ApiClient) {
                'use strict';




                /**
                 * The DistrictList model module.
                 * @module TBAAPI.Client/model/DistrictList
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>DistrictList</code>.
                 * @alias module:TBAAPI.Client/model/DistrictList
                 * @class
                 * @param abbreviation {String} The short identifier for the district.
                 * @param displayName {String} The long name for the district.
                 * @param key {String} Key for this district, e.g. `2016ne`.
                 * @param year {Number} Year this district participated.
                 */
                var exports = function (abbreviation, displayName, key, year) {
                    var _this = this;

                    _this['abbreviation'] = abbreviation;
                    _this['display_name'] = displayName;
                    _this['key'] = key;
                    _this['year'] = year;
                };

                /**
                 * Constructs a <code>DistrictList</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/DistrictList} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/DistrictList} The populated <code>DistrictList</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('abbreviation')) {
                            obj['abbreviation'] = ApiClient.convertToType(data['abbreviation'], 'String');
                        }
                        if (data.hasOwnProperty('display_name')) {
                            obj['display_name'] = ApiClient.convertToType(data['display_name'], 'String');
                        }
                        if (data.hasOwnProperty('key')) {
                            obj['key'] = ApiClient.convertToType(data['key'], 'String');
                        }
                        if (data.hasOwnProperty('year')) {
                            obj['year'] = ApiClient.convertToType(data['year'], 'Number');
                        }
                    }
                    return obj;
                }

                /**
                 * The short identifier for the district.
                 * @member {String} abbreviation
                 */
                exports.prototype['abbreviation'] = undefined;
                /**
                 * The long name for the district.
                 * @member {String} display_name
                 */
                exports.prototype['display_name'] = undefined;
                /**
                 * Key for this district, e.g. `2016ne`.
                 * @member {String} key
                 */
                exports.prototype['key'] = undefined;
                /**
                 * Year this district participated.
                 * @member {Number} year
                 */
                exports.prototype['year'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9
        }],
        22: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/DistrictRankingEventPoints'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('./DistrictRankingEventPoints'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.DistrictRanking = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.DistrictRankingEventPoints);
                }
            }(this, function (ApiClient, DistrictRankingEventPoints) {
                'use strict';




                /**
                 * The DistrictRanking model module.
                 * @module TBAAPI.Client/model/DistrictRanking
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>DistrictRanking</code>.
                 * Rank of a team in a district.
                 * @alias module:TBAAPI.Client/model/DistrictRanking
                 * @class
                 * @param teamKey {String} TBA team key for the team.
                 * @param rank {Number} Numerical rank of the team, 1 being top rank.
                 * @param pointTotal {Number} Total district points for the team.
                 */
                var exports = function (teamKey, rank, pointTotal) {
                    var _this = this;

                    _this['team_key'] = teamKey;
                    _this['rank'] = rank;

                    _this['point_total'] = pointTotal;

                };

                /**
                 * Constructs a <code>DistrictRanking</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/DistrictRanking} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/DistrictRanking} The populated <code>DistrictRanking</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('team_key')) {
                            obj['team_key'] = ApiClient.convertToType(data['team_key'], 'String');
                        }
                        if (data.hasOwnProperty('rank')) {
                            obj['rank'] = ApiClient.convertToType(data['rank'], 'Number');
                        }
                        if (data.hasOwnProperty('rookie_bonus')) {
                            obj['rookie_bonus'] = ApiClient.convertToType(data['rookie_bonus'], 'Number');
                        }
                        if (data.hasOwnProperty('point_total')) {
                            obj['point_total'] = ApiClient.convertToType(data['point_total'], 'Number');
                        }
                        if (data.hasOwnProperty('event_points')) {
                            obj['event_points'] = ApiClient.convertToType(data['event_points'], [DistrictRankingEventPoints]);
                        }
                    }
                    return obj;
                }

                /**
                 * TBA team key for the team.
                 * @member {String} team_key
                 */
                exports.prototype['team_key'] = undefined;
                /**
                 * Numerical rank of the team, 1 being top rank.
                 * @member {Number} rank
                 */
                exports.prototype['rank'] = undefined;
                /**
                 * Any points added to a team as a result of the rookie bonus.
                 * @member {Number} rookie_bonus
                 */
                exports.prototype['rookie_bonus'] = undefined;
                /**
                 * Total district points for the team.
                 * @member {Number} point_total
                 */
                exports.prototype['point_total'] = undefined;
                /**
                 * List of events that contributed to the point total for the team.
                 * @member {Array.<module:TBAAPI.Client/model/DistrictRankingEventPoints>} event_points
                 */
                exports.prototype['event_points'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9,
            "./DistrictRankingEventPoints": 23
        }],
        23: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.DistrictRankingEventPoints = factory(root.TbaApiV3client.ApiClient);
                }
            }(this, function (ApiClient) {
                'use strict';




                /**
                 * The DistrictRankingEventPoints model module.
                 * @module TBAAPI.Client/model/DistrictRankingEventPoints
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>DistrictRankingEventPoints</code>.
                 * @alias module:TBAAPI.Client/model/DistrictRankingEventPoints
                 * @class
                 * @param eventKey {String} TBA Event key for this event.
                 * @param districtCmp {Boolean} `true` if this event is a District Championship event.
                 * @param alliancePoints {Number} Points awarded for alliance selection.
                 * @param awardPoints {Number} Points awarded for event awards.
                 * @param qualPoints {Number} Points awarded for qualification match performance.
                 * @param elimPoints {Number} Points awarded for elimination match performance.
                 * @param total {Number} Total points awarded at this event.
                 */
                var exports = function (eventKey, districtCmp, alliancePoints, awardPoints, qualPoints, elimPoints, total) {
                    var _this = this;

                    _this['event_key'] = eventKey;
                    _this['district_cmp'] = districtCmp;
                    _this['alliance_points'] = alliancePoints;
                    _this['award_points'] = awardPoints;
                    _this['qual_points'] = qualPoints;
                    _this['elim_points'] = elimPoints;
                    _this['total'] = total;
                };

                /**
                 * Constructs a <code>DistrictRankingEventPoints</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/DistrictRankingEventPoints} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/DistrictRankingEventPoints} The populated <code>DistrictRankingEventPoints</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('event_key')) {
                            obj['event_key'] = ApiClient.convertToType(data['event_key'], 'String');
                        }
                        if (data.hasOwnProperty('district_cmp')) {
                            obj['district_cmp'] = ApiClient.convertToType(data['district_cmp'], 'Boolean');
                        }
                        if (data.hasOwnProperty('alliance_points')) {
                            obj['alliance_points'] = ApiClient.convertToType(data['alliance_points'], 'Number');
                        }
                        if (data.hasOwnProperty('award_points')) {
                            obj['award_points'] = ApiClient.convertToType(data['award_points'], 'Number');
                        }
                        if (data.hasOwnProperty('qual_points')) {
                            obj['qual_points'] = ApiClient.convertToType(data['qual_points'], 'Number');
                        }
                        if (data.hasOwnProperty('elim_points')) {
                            obj['elim_points'] = ApiClient.convertToType(data['elim_points'], 'Number');
                        }
                        if (data.hasOwnProperty('total')) {
                            obj['total'] = ApiClient.convertToType(data['total'], 'Number');
                        }
                    }
                    return obj;
                }

                /**
                 * TBA Event key for this event.
                 * @member {String} event_key
                 */
                exports.prototype['event_key'] = undefined;
                /**
                 * `true` if this event is a District Championship event.
                 * @member {Boolean} district_cmp
                 */
                exports.prototype['district_cmp'] = undefined;
                /**
                 * Points awarded for alliance selection.
                 * @member {Number} alliance_points
                 */
                exports.prototype['alliance_points'] = undefined;
                /**
                 * Points awarded for event awards.
                 * @member {Number} award_points
                 */
                exports.prototype['award_points'] = undefined;
                /**
                 * Points awarded for qualification match performance.
                 * @member {Number} qual_points
                 */
                exports.prototype['qual_points'] = undefined;
                /**
                 * Points awarded for elimination match performance.
                 * @member {Number} elim_points
                 */
                exports.prototype['elim_points'] = undefined;
                /**
                 * Total points awarded at this event.
                 * @member {Number} total
                 */
                exports.prototype['total'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9
        }],
        24: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/EliminationAllianceBackup', 'TBAAPI.Client/model/EliminationAllianceStatus'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('./EliminationAllianceBackup'), require('./EliminationAllianceStatus'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.EliminationAlliance = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.EliminationAllianceBackup, root.TbaApiV3client.EliminationAllianceStatus);
                }
            }(this, function (ApiClient, EliminationAllianceBackup, EliminationAllianceStatus) {
                'use strict';




                /**
                 * The EliminationAlliance model module.
                 * @module TBAAPI.Client/model/EliminationAlliance
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>EliminationAlliance</code>.
                 * @alias module:TBAAPI.Client/model/EliminationAlliance
                 * @class
                 * @param picks {Array.<String>} List of team keys picked for the alliance. First pick is captain.
                 */
                var exports = function (picks) {
                    var _this = this;




                    _this['picks'] = picks;

                };

                /**
                 * Constructs a <code>EliminationAlliance</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/EliminationAlliance} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/EliminationAlliance} The populated <code>EliminationAlliance</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('name')) {
                            obj['name'] = ApiClient.convertToType(data['name'], 'String');
                        }
                        if (data.hasOwnProperty('backup')) {
                            obj['backup'] = EliminationAllianceBackup.constructFromObject(data['backup']);
                        }
                        if (data.hasOwnProperty('declines')) {
                            obj['declines'] = ApiClient.convertToType(data['declines'], ['String']);
                        }
                        if (data.hasOwnProperty('picks')) {
                            obj['picks'] = ApiClient.convertToType(data['picks'], ['String']);
                        }
                        if (data.hasOwnProperty('status')) {
                            obj['status'] = EliminationAllianceStatus.constructFromObject(data['status']);
                        }
                    }
                    return obj;
                }

                /**
                 * Alliance name, may be null.
                 * @member {String} name
                 */
                exports.prototype['name'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/EliminationAllianceBackup} backup
                 */
                exports.prototype['backup'] = undefined;
                /**
                 * List of teams that declined the alliance.
                 * @member {Array.<String>} declines
                 */
                exports.prototype['declines'] = undefined;
                /**
                 * List of team keys picked for the alliance. First pick is captain.
                 * @member {Array.<String>} picks
                 */
                exports.prototype['picks'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/EliminationAllianceStatus} status
                 */
                exports.prototype['status'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9,
            "./EliminationAllianceBackup": 25,
            "./EliminationAllianceStatus": 26
        }],
        25: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.EliminationAllianceBackup = factory(root.TbaApiV3client.ApiClient);
                }
            }(this, function (ApiClient) {
                'use strict';




                /**
                 * The EliminationAllianceBackup model module.
                 * @module TBAAPI.Client/model/EliminationAllianceBackup
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>EliminationAllianceBackup</code>.
                 * Backup team called in, may be null.
                 * @alias module:TBAAPI.Client/model/EliminationAllianceBackup
                 * @class
                 */
                var exports = function () {
                    var _this = this;



                };

                /**
                 * Constructs a <code>EliminationAllianceBackup</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/EliminationAllianceBackup} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/EliminationAllianceBackup} The populated <code>EliminationAllianceBackup</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('out')) {
                            obj['out'] = ApiClient.convertToType(data['out'], 'String');
                        }
                        if (data.hasOwnProperty('in')) {
                            obj['in'] = ApiClient.convertToType(data['in'], 'String');
                        }
                    }
                    return obj;
                }

                /**
                 * Team key that was replaced by the backup team.
                 * @member {String} out
                 */
                exports.prototype['out'] = undefined;
                /**
                 * Team key that was called in as the backup.
                 * @member {String} in
                 */
                exports.prototype['in'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9
        }],
        26: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/WLTRecord'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('./WLTRecord'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.EliminationAllianceStatus = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.WLTRecord);
                }
            }(this, function (ApiClient, WLTRecord) {
                'use strict';




                /**
                 * The EliminationAllianceStatus model module.
                 * @module TBAAPI.Client/model/EliminationAllianceStatus
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>EliminationAllianceStatus</code>.
                 * @alias module:TBAAPI.Client/model/EliminationAllianceStatus
                 * @class
                 */
                var exports = function () {
                    var _this = this;






                };

                /**
                 * Constructs a <code>EliminationAllianceStatus</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/EliminationAllianceStatus} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/EliminationAllianceStatus} The populated <code>EliminationAllianceStatus</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('current_level_record')) {
                            obj['current_level_record'] = WLTRecord.constructFromObject(data['current_level_record']);
                        }
                        if (data.hasOwnProperty('level')) {
                            obj['level'] = ApiClient.convertToType(data['level'], 'String');
                        }
                        if (data.hasOwnProperty('playoff_average')) {
                            obj['playoff_average'] = ApiClient.convertToType(data['playoff_average'], 'Number');
                        }
                        if (data.hasOwnProperty('record')) {
                            obj['record'] = WLTRecord.constructFromObject(data['record']);
                        }
                        if (data.hasOwnProperty('status')) {
                            obj['status'] = ApiClient.convertToType(data['status'], 'String');
                        }
                    }
                    return obj;
                }

                /**
                 * @member {module:TBAAPI.Client/model/WLTRecord} current_level_record
                 */
                exports.prototype['current_level_record'] = undefined;
                /**
                 * @member {String} level
                 */
                exports.prototype['level'] = undefined;
                /**
                 * @member {Number} playoff_average
                 */
                exports.prototype['playoff_average'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/WLTRecord} record
                 */
                exports.prototype['record'] = undefined;
                /**
                 * @member {String} status
                 */
                exports.prototype['status'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9,
            "./WLTRecord": 64
        }],
        27: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/DistrictList', 'TBAAPI.Client/model/Webcast'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('./DistrictList'), require('./Webcast'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.Event = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.DistrictList, root.TbaApiV3client.Webcast);
                }
            }(this, function (ApiClient, DistrictList, Webcast) {
                'use strict';




                /**
                 * The Event model module.
                 * @module TBAAPI.Client/model/Event
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>Event</code>.
                 * @alias module:TBAAPI.Client/model/Event
                 * @class
                 * @param key {String} TBA event key with the format yyyy[EVENT_CODE], where yyyy is the year, and EVENT_CODE is the event code of the event.
                 * @param name {String} Official name of event on record either provided by FIRST or organizers of offseason event.
                 * @param eventCode {String} Event short code, as provided by FIRST.
                 * @param eventType {Number} Event Type, as defined here: https://github.com/the-blue-alliance/the-blue-alliance/blob/master/consts/event_type.py#L2
                 * @param startDate {Date} Event start date in `yyyy-mm-dd` format.
                 * @param endDate {Date} Event end date in `yyyy-mm-dd` format.
                 * @param year {Number} Year the event data is for.
                 * @param eventTypeString {String} Event Type, eg Regional, District, or Offseason.
                 */
                var exports = function (key, name, eventCode, eventType, startDate, endDate, year, eventTypeString) {
                    var _this = this;

                    _this['key'] = key;
                    _this['name'] = name;
                    _this['event_code'] = eventCode;
                    _this['event_type'] = eventType;




                    _this['start_date'] = startDate;
                    _this['end_date'] = endDate;
                    _this['year'] = year;

                    _this['event_type_string'] = eventTypeString;









                };

                /**
                 * Constructs a <code>Event</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/Event} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/Event} The populated <code>Event</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('key')) {
                            obj['key'] = ApiClient.convertToType(data['key'], 'String');
                        }
                        if (data.hasOwnProperty('name')) {
                            obj['name'] = ApiClient.convertToType(data['name'], 'String');
                        }
                        if (data.hasOwnProperty('event_code')) {
                            obj['event_code'] = ApiClient.convertToType(data['event_code'], 'String');
                        }
                        if (data.hasOwnProperty('event_type')) {
                            obj['event_type'] = ApiClient.convertToType(data['event_type'], 'Number');
                        }
                        if (data.hasOwnProperty('district')) {
                            obj['district'] = DistrictList.constructFromObject(data['district']);
                        }
                        if (data.hasOwnProperty('city')) {
                            obj['city'] = ApiClient.convertToType(data['city'], 'String');
                        }
                        if (data.hasOwnProperty('state_prov')) {
                            obj['state_prov'] = ApiClient.convertToType(data['state_prov'], 'String');
                        }
                        if (data.hasOwnProperty('country')) {
                            obj['country'] = ApiClient.convertToType(data['country'], 'String');
                        }
                        if (data.hasOwnProperty('start_date')) {
                            obj['start_date'] = ApiClient.convertToType(data['start_date'], 'Date');
                        }
                        if (data.hasOwnProperty('end_date')) {
                            obj['end_date'] = ApiClient.convertToType(data['end_date'], 'Date');
                        }
                        if (data.hasOwnProperty('year')) {
                            obj['year'] = ApiClient.convertToType(data['year'], 'Number');
                        }
                        if (data.hasOwnProperty('short_name')) {
                            obj['short_name'] = ApiClient.convertToType(data['short_name'], 'String');
                        }
                        if (data.hasOwnProperty('event_type_string')) {
                            obj['event_type_string'] = ApiClient.convertToType(data['event_type_string'], 'String');
                        }
                        if (data.hasOwnProperty('week')) {
                            obj['week'] = ApiClient.convertToType(data['week'], 'Number');
                        }
                        if (data.hasOwnProperty('address')) {
                            obj['address'] = ApiClient.convertToType(data['address'], 'String');
                        }
                        if (data.hasOwnProperty('postal_code')) {
                            obj['postal_code'] = ApiClient.convertToType(data['postal_code'], 'String');
                        }
                        if (data.hasOwnProperty('gmaps_place_id')) {
                            obj['gmaps_place_id'] = ApiClient.convertToType(data['gmaps_place_id'], 'String');
                        }
                        if (data.hasOwnProperty('gmaps_url')) {
                            obj['gmaps_url'] = ApiClient.convertToType(data['gmaps_url'], 'String');
                        }
                        if (data.hasOwnProperty('lat')) {
                            obj['lat'] = ApiClient.convertToType(data['lat'], 'Number');
                        }
                        if (data.hasOwnProperty('lng')) {
                            obj['lng'] = ApiClient.convertToType(data['lng'], 'Number');
                        }
                        if (data.hasOwnProperty('location_name')) {
                            obj['location_name'] = ApiClient.convertToType(data['location_name'], 'String');
                        }
                        if (data.hasOwnProperty('timezone')) {
                            obj['timezone'] = ApiClient.convertToType(data['timezone'], 'String');
                        }
                        if (data.hasOwnProperty('website')) {
                            obj['website'] = ApiClient.convertToType(data['website'], 'String');
                        }
                        if (data.hasOwnProperty('first_event_id')) {
                            obj['first_event_id'] = ApiClient.convertToType(data['first_event_id'], 'String');
                        }
                        if (data.hasOwnProperty('first_event_code')) {
                            obj['first_event_code'] = ApiClient.convertToType(data['first_event_code'], 'String');
                        }
                        if (data.hasOwnProperty('webcasts')) {
                            obj['webcasts'] = ApiClient.convertToType(data['webcasts'], [Webcast]);
                        }
                        if (data.hasOwnProperty('division_keys')) {
                            obj['division_keys'] = ApiClient.convertToType(data['division_keys'], ['String']);
                        }
                        if (data.hasOwnProperty('parent_event_key')) {
                            obj['parent_event_key'] = ApiClient.convertToType(data['parent_event_key'], 'String');
                        }
                        if (data.hasOwnProperty('playoff_type')) {
                            obj['playoff_type'] = ApiClient.convertToType(data['playoff_type'], 'Number');
                        }
                        if (data.hasOwnProperty('playoff_type_string')) {
                            obj['playoff_type_string'] = ApiClient.convertToType(data['playoff_type_string'], 'String');
                        }
                    }
                    return obj;
                }

                /**
                 * TBA event key with the format yyyy[EVENT_CODE], where yyyy is the year, and EVENT_CODE is the event code of the event.
                 * @member {String} key
                 */
                exports.prototype['key'] = undefined;
                /**
                 * Official name of event on record either provided by FIRST or organizers of offseason event.
                 * @member {String} name
                 */
                exports.prototype['name'] = undefined;
                /**
                 * Event short code, as provided by FIRST.
                 * @member {String} event_code
                 */
                exports.prototype['event_code'] = undefined;
                /**
                 * Event Type, as defined here: https://github.com/the-blue-alliance/the-blue-alliance/blob/master/consts/event_type.py#L2
                 * @member {Number} event_type
                 */
                exports.prototype['event_type'] = undefined;
                /**
                 * The district this event is in, may be null.
                 * @member {module:TBAAPI.Client/model/DistrictList} district
                 */
                exports.prototype['district'] = undefined;
                /**
                 * City, town, village, etc. the event is located in.
                 * @member {String} city
                 */
                exports.prototype['city'] = undefined;
                /**
                 * State or Province the event is located in.
                 * @member {String} state_prov
                 */
                exports.prototype['state_prov'] = undefined;
                /**
                 * Country the event is located in.
                 * @member {String} country
                 */
                exports.prototype['country'] = undefined;
                /**
                 * Event start date in `yyyy-mm-dd` format.
                 * @member {Date} start_date
                 */
                exports.prototype['start_date'] = undefined;
                /**
                 * Event end date in `yyyy-mm-dd` format.
                 * @member {Date} end_date
                 */
                exports.prototype['end_date'] = undefined;
                /**
                 * Year the event data is for.
                 * @member {Number} year
                 */
                exports.prototype['year'] = undefined;
                /**
                 * Same as `name` but doesn't include event specifiers, such as 'Regional' or 'District'. May be null.
                 * @member {String} short_name
                 */
                exports.prototype['short_name'] = undefined;
                /**
                 * Event Type, eg Regional, District, or Offseason.
                 * @member {String} event_type_string
                 */
                exports.prototype['event_type_string'] = undefined;
                /**
                 * Week of the competition season this event is in.
                 * @member {Number} week
                 */
                exports.prototype['week'] = undefined;
                /**
                 * Address of the event's venue, if available.
                 * @member {String} address
                 */
                exports.prototype['address'] = undefined;
                /**
                 * Postal code from the event address.
                 * @member {String} postal_code
                 */
                exports.prototype['postal_code'] = undefined;
                /**
                 * Google Maps Place ID for the event address.
                 * @member {String} gmaps_place_id
                 */
                exports.prototype['gmaps_place_id'] = undefined;
                /**
                 * Link to address location on Google Maps.
                 * @member {String} gmaps_url
                 */
                exports.prototype['gmaps_url'] = undefined;
                /**
                 * Latitude for the event address.
                 * @member {Number} lat
                 */
                exports.prototype['lat'] = undefined;
                /**
                 * Longitude for the event address.
                 * @member {Number} lng
                 */
                exports.prototype['lng'] = undefined;
                /**
                 * Name of the location at the address for the event, eg. Blue Alliance High School.
                 * @member {String} location_name
                 */
                exports.prototype['location_name'] = undefined;
                /**
                 * Timezone name.
                 * @member {String} timezone
                 */
                exports.prototype['timezone'] = undefined;
                /**
                 * The event's website, if any.
                 * @member {String} website
                 */
                exports.prototype['website'] = undefined;
                /**
                 * The FIRST internal Event ID, used to link to the event on the FRC webpage.
                 * @member {String} first_event_id
                 */
                exports.prototype['first_event_id'] = undefined;
                /**
                 * Public facing event code used by FIRST (on frc-events.firstinspires.org, for example)
                 * @member {String} first_event_code
                 */
                exports.prototype['first_event_code'] = undefined;
                /**
                 * @member {Array.<module:TBAAPI.Client/model/Webcast>} webcasts
                 */
                exports.prototype['webcasts'] = undefined;
                /**
                 * An array of event keys for the divisions at this event.
                 * @member {Array.<String>} division_keys
                 */
                exports.prototype['division_keys'] = undefined;
                /**
                 * The TBA Event key that represents the event's parent. Used to link back to the event from a division event. It is also the inverse relation of `divison_keys`.
                 * @member {String} parent_event_key
                 */
                exports.prototype['parent_event_key'] = undefined;
                /**
                 * Playoff Type, as defined here: https://github.com/the-blue-alliance/the-blue-alliance/blob/master/consts/playoff_type.py#L4, or null.
                 * @member {Number} playoff_type
                 */
                exports.prototype['playoff_type'] = undefined;
                /**
                 * String representation of the `playoff_type`, or null.
                 * @member {String} playoff_type_string
                 */
                exports.prototype['playoff_type_string'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9,
            "./DistrictList": 21,
            "./Webcast": 65
        }],
        28: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/EventDistrictPointsPoints', 'TBAAPI.Client/model/EventDistrictPointsTiebreakers'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('./EventDistrictPointsPoints'), require('./EventDistrictPointsTiebreakers'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.EventDistrictPoints = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.EventDistrictPointsPoints, root.TbaApiV3client.EventDistrictPointsTiebreakers);
                }
            }(this, function (ApiClient, EventDistrictPointsPoints, EventDistrictPointsTiebreakers) {
                'use strict';




                /**
                 * The EventDistrictPoints model module.
                 * @module TBAAPI.Client/model/EventDistrictPoints
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>EventDistrictPoints</code>.
                 * @alias module:TBAAPI.Client/model/EventDistrictPoints
                 * @class
                 * @param points {Object.<String, module:TBAAPI.Client/model/EventDistrictPointsPoints>} Points gained for each team at the event. Stored as a key-value pair with the team key as the key, and an object describing the points as its value.
                 */
                var exports = function (points) {
                    var _this = this;

                    _this['points'] = points;

                };

                /**
                 * Constructs a <code>EventDistrictPoints</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/EventDistrictPoints} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/EventDistrictPoints} The populated <code>EventDistrictPoints</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('points')) {
                            obj['points'] = ApiClient.convertToType(data['points'], {
                                'String': EventDistrictPointsPoints
                            });
                        }
                        if (data.hasOwnProperty('tiebreakers')) {
                            obj['tiebreakers'] = ApiClient.convertToType(data['tiebreakers'], {
                                'String': EventDistrictPointsTiebreakers
                            });
                        }
                    }
                    return obj;
                }

                /**
                 * Points gained for each team at the event. Stored as a key-value pair with the team key as the key, and an object describing the points as its value.
                 * @member {Object.<String, module:TBAAPI.Client/model/EventDistrictPointsPoints>} points
                 */
                exports.prototype['points'] = undefined;
                /**
                 * Tiebreaker values for each team at the event. Stored as a key-value pair with the team key as the key, and an object describing the tiebreaker elements as its value.
                 * @member {Object.<String, module:TBAAPI.Client/model/EventDistrictPointsTiebreakers>} tiebreakers
                 */
                exports.prototype['tiebreakers'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9,
            "./EventDistrictPointsPoints": 29,
            "./EventDistrictPointsTiebreakers": 30
        }],
        29: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.EventDistrictPointsPoints = factory(root.TbaApiV3client.ApiClient);
                }
            }(this, function (ApiClient) {
                'use strict';




                /**
                 * The EventDistrictPointsPoints model module.
                 * @module TBAAPI.Client/model/EventDistrictPointsPoints
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>EventDistrictPointsPoints</code>.
                 * @alias module:TBAAPI.Client/model/EventDistrictPointsPoints
                 * @class
                 * @param alliancePoints {Number} Points awarded for alliance selection
                 * @param awardPoints {Number} Points awarded for event awards.
                 * @param qualPoints {Number} Points awarded for qualification match performance.
                 * @param elimPoints {Number} Points awarded for elimination match performance.
                 * @param total {Number} Total points awarded at this event.
                 */
                var exports = function (alliancePoints, awardPoints, qualPoints, elimPoints, total) {
                    var _this = this;

                    _this['alliance_points'] = alliancePoints;
                    _this['award_points'] = awardPoints;
                    _this['qual_points'] = qualPoints;
                    _this['elim_points'] = elimPoints;
                    _this['total'] = total;
                };

                /**
                 * Constructs a <code>EventDistrictPointsPoints</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/EventDistrictPointsPoints} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/EventDistrictPointsPoints} The populated <code>EventDistrictPointsPoints</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('alliance_points')) {
                            obj['alliance_points'] = ApiClient.convertToType(data['alliance_points'], 'Number');
                        }
                        if (data.hasOwnProperty('award_points')) {
                            obj['award_points'] = ApiClient.convertToType(data['award_points'], 'Number');
                        }
                        if (data.hasOwnProperty('qual_points')) {
                            obj['qual_points'] = ApiClient.convertToType(data['qual_points'], 'Number');
                        }
                        if (data.hasOwnProperty('elim_points')) {
                            obj['elim_points'] = ApiClient.convertToType(data['elim_points'], 'Number');
                        }
                        if (data.hasOwnProperty('total')) {
                            obj['total'] = ApiClient.convertToType(data['total'], 'Number');
                        }
                    }
                    return obj;
                }

                /**
                 * Points awarded for alliance selection
                 * @member {Number} alliance_points
                 */
                exports.prototype['alliance_points'] = undefined;
                /**
                 * Points awarded for event awards.
                 * @member {Number} award_points
                 */
                exports.prototype['award_points'] = undefined;
                /**
                 * Points awarded for qualification match performance.
                 * @member {Number} qual_points
                 */
                exports.prototype['qual_points'] = undefined;
                /**
                 * Points awarded for elimination match performance.
                 * @member {Number} elim_points
                 */
                exports.prototype['elim_points'] = undefined;
                /**
                 * Total points awarded at this event.
                 * @member {Number} total
                 */
                exports.prototype['total'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9
        }],
        30: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.EventDistrictPointsTiebreakers = factory(root.TbaApiV3client.ApiClient);
                }
            }(this, function (ApiClient) {
                'use strict';




                /**
                 * The EventDistrictPointsTiebreakers model module.
                 * @module TBAAPI.Client/model/EventDistrictPointsTiebreakers
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>EventDistrictPointsTiebreakers</code>.
                 * @alias module:TBAAPI.Client/model/EventDistrictPointsTiebreakers
                 * @class
                 */
                var exports = function () {
                    var _this = this;



                };

                /**
                 * Constructs a <code>EventDistrictPointsTiebreakers</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/EventDistrictPointsTiebreakers} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/EventDistrictPointsTiebreakers} The populated <code>EventDistrictPointsTiebreakers</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('highest_qual_scores')) {
                            obj['highest_qual_scores'] = ApiClient.convertToType(data['highest_qual_scores'], ['Number']);
                        }
                        if (data.hasOwnProperty('qual_wins')) {
                            obj['qual_wins'] = ApiClient.convertToType(data['qual_wins'], 'Number');
                        }
                    }
                    return obj;
                }

                /**
                 * @member {Array.<Number>} highest_qual_scores
                 */
                exports.prototype['highest_qual_scores'] = undefined;
                /**
                 * @member {Number} qual_wins
                 */
                exports.prototype['qual_wins'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9
        }],
        31: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/EventInsights2016Detail'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('./EventInsights2016Detail'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.EventInsights2016 = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.EventInsights2016Detail);
                }
            }(this, function (ApiClient, EventInsights2016Detail) {
                'use strict';




                /**
                 * The EventInsights2016 model module.
                 * @module TBAAPI.Client/model/EventInsights2016
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>EventInsights2016</code>.
                 * Insights for FIRST Stronghold qualification and elimination matches.
                 * @alias module:TBAAPI.Client/model/EventInsights2016
                 * @class
                 */
                var exports = function () {
                    var _this = this;



                };

                /**
                 * Constructs a <code>EventInsights2016</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/EventInsights2016} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/EventInsights2016} The populated <code>EventInsights2016</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('qual')) {
                            obj['qual'] = EventInsights2016Detail.constructFromObject(data['qual']);
                        }
                        if (data.hasOwnProperty('playoff')) {
                            obj['playoff'] = EventInsights2016Detail.constructFromObject(data['playoff']);
                        }
                    }
                    return obj;
                }

                /**
                 * @member {module:TBAAPI.Client/model/EventInsights2016Detail} qual
                 */
                exports.prototype['qual'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/EventInsights2016Detail} playoff
                 */
                exports.prototype['playoff'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9,
            "./EventInsights2016Detail": 32
        }],
        32: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.EventInsights2016Detail = factory(root.TbaApiV3client.ApiClient);
                }
            }(this, function (ApiClient) {
                'use strict';




                /**
                 * The EventInsights2016Detail model module.
                 * @module TBAAPI.Client/model/EventInsights2016Detail
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>EventInsights2016Detail</code>.
                 * @alias module:TBAAPI.Client/model/EventInsights2016Detail
                 * @class
                 * @param lowBar {Array.<Number>} For the Low Bar - An array with three values, number of times damaged, number of opportunities to damage, and percentage.
                 * @param aChevalDeFrise {Array.<Number>} For the Cheval De Frise - An array with three values, number of times damaged, number of opportunities to damage, and percentage.
                 * @param aPortcullis {Array.<Number>} For the Portcullis - An array with three values, number of times damaged, number of opportunities to damage, and percentage.
                 * @param bRamparts {Array.<Number>} For the Ramparts - An array with three values, number of times damaged, number of opportunities to damage, and percentage.
                 * @param bMoat {Array.<Number>} For the Moat - An array with three values, number of times damaged, number of opportunities to damage, and percentage.
                 * @param cSallyPort {Array.<Number>} For the Sally Port - An array with three values, number of times damaged, number of opportunities to damage, and percentage.
                 * @param cDrawbridge {Array.<Number>} For the Drawbridge - An array with three values, number of times damaged, number of opportunities to damage, and percentage.
                 * @param dRoughTerrain {Array.<Number>} For the Rough Terrain - An array with three values, number of times damaged, number of opportunities to damage, and percentage.
                 * @param dRockWall {Array.<Number>} For the Rock Wall - An array with three values, number of times damaged, number of opportunities to damage, and percentage.
                 * @param averageHighGoals {Number} Average number of high goals scored.
                 * @param averageLowGoals {Number} Average number of low goals scored.
                 * @param breaches {Array.<Number>} An array with three values, number of times breached, number of opportunities to breech, and percentage.
                 * @param scales {Array.<Number>} An array with three values, number of times scaled, number of opportunities to scale, and percentage.
                 * @param challenges {Array.<Number>} An array with three values, number of times challenged, number of opportunities to challenge, and percentage.
                 * @param captures {Array.<Number>} An array with three values, number of times captured, number of opportunities to capture, and percentage.
                 * @param averageWinScore {Number} Average winning score.
                 * @param averageWinMargin {Number} Average margin of victory.
                 * @param averageScore {Number} Average total score.
                 * @param averageAutoScore {Number} Average autonomous score.
                 * @param averageCrossingScore {Number} Average crossing score.
                 * @param averageBoulderScore {Number} Average boulder score.
                 * @param averageTowerScore {Number} Average tower score.
                 * @param averageFoulScore {Number} Average foul score.
                 * @param highScore {Array.<String>} An array with three values, high score, match key from the match with the high score, and the name of the match.
                 */
                var exports = function (lowBar, aChevalDeFrise, aPortcullis, bRamparts, bMoat, cSallyPort, cDrawbridge, dRoughTerrain, dRockWall, averageHighGoals, averageLowGoals, breaches, scales, challenges, captures, averageWinScore, averageWinMargin, averageScore, averageAutoScore, averageCrossingScore, averageBoulderScore, averageTowerScore, averageFoulScore, highScore) {
                    var _this = this;

                    _this['LowBar'] = lowBar;
                    _this['A_ChevalDeFrise'] = aChevalDeFrise;
                    _this['A_Portcullis'] = aPortcullis;
                    _this['B_Ramparts'] = bRamparts;
                    _this['B_Moat'] = bMoat;
                    _this['C_SallyPort'] = cSallyPort;
                    _this['C_Drawbridge'] = cDrawbridge;
                    _this['D_RoughTerrain'] = dRoughTerrain;
                    _this['D_RockWall'] = dRockWall;
                    _this['average_high_goals'] = averageHighGoals;
                    _this['average_low_goals'] = averageLowGoals;
                    _this['breaches'] = breaches;
                    _this['scales'] = scales;
                    _this['challenges'] = challenges;
                    _this['captures'] = captures;
                    _this['average_win_score'] = averageWinScore;
                    _this['average_win_margin'] = averageWinMargin;
                    _this['average_score'] = averageScore;
                    _this['average_auto_score'] = averageAutoScore;
                    _this['average_crossing_score'] = averageCrossingScore;
                    _this['average_boulder_score'] = averageBoulderScore;
                    _this['average_tower_score'] = averageTowerScore;
                    _this['average_foul_score'] = averageFoulScore;
                    _this['high_score'] = highScore;
                };

                /**
                 * Constructs a <code>EventInsights2016Detail</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/EventInsights2016Detail} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/EventInsights2016Detail} The populated <code>EventInsights2016Detail</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('LowBar')) {
                            obj['LowBar'] = ApiClient.convertToType(data['LowBar'], ['Number']);
                        }
                        if (data.hasOwnProperty('A_ChevalDeFrise')) {
                            obj['A_ChevalDeFrise'] = ApiClient.convertToType(data['A_ChevalDeFrise'], ['Number']);
                        }
                        if (data.hasOwnProperty('A_Portcullis')) {
                            obj['A_Portcullis'] = ApiClient.convertToType(data['A_Portcullis'], ['Number']);
                        }
                        if (data.hasOwnProperty('B_Ramparts')) {
                            obj['B_Ramparts'] = ApiClient.convertToType(data['B_Ramparts'], ['Number']);
                        }
                        if (data.hasOwnProperty('B_Moat')) {
                            obj['B_Moat'] = ApiClient.convertToType(data['B_Moat'], ['Number']);
                        }
                        if (data.hasOwnProperty('C_SallyPort')) {
                            obj['C_SallyPort'] = ApiClient.convertToType(data['C_SallyPort'], ['Number']);
                        }
                        if (data.hasOwnProperty('C_Drawbridge')) {
                            obj['C_Drawbridge'] = ApiClient.convertToType(data['C_Drawbridge'], ['Number']);
                        }
                        if (data.hasOwnProperty('D_RoughTerrain')) {
                            obj['D_RoughTerrain'] = ApiClient.convertToType(data['D_RoughTerrain'], ['Number']);
                        }
                        if (data.hasOwnProperty('D_RockWall')) {
                            obj['D_RockWall'] = ApiClient.convertToType(data['D_RockWall'], ['Number']);
                        }
                        if (data.hasOwnProperty('average_high_goals')) {
                            obj['average_high_goals'] = ApiClient.convertToType(data['average_high_goals'], 'Number');
                        }
                        if (data.hasOwnProperty('average_low_goals')) {
                            obj['average_low_goals'] = ApiClient.convertToType(data['average_low_goals'], 'Number');
                        }
                        if (data.hasOwnProperty('breaches')) {
                            obj['breaches'] = ApiClient.convertToType(data['breaches'], ['Number']);
                        }
                        if (data.hasOwnProperty('scales')) {
                            obj['scales'] = ApiClient.convertToType(data['scales'], ['Number']);
                        }
                        if (data.hasOwnProperty('challenges')) {
                            obj['challenges'] = ApiClient.convertToType(data['challenges'], ['Number']);
                        }
                        if (data.hasOwnProperty('captures')) {
                            obj['captures'] = ApiClient.convertToType(data['captures'], ['Number']);
                        }
                        if (data.hasOwnProperty('average_win_score')) {
                            obj['average_win_score'] = ApiClient.convertToType(data['average_win_score'], 'Number');
                        }
                        if (data.hasOwnProperty('average_win_margin')) {
                            obj['average_win_margin'] = ApiClient.convertToType(data['average_win_margin'], 'Number');
                        }
                        if (data.hasOwnProperty('average_score')) {
                            obj['average_score'] = ApiClient.convertToType(data['average_score'], 'Number');
                        }
                        if (data.hasOwnProperty('average_auto_score')) {
                            obj['average_auto_score'] = ApiClient.convertToType(data['average_auto_score'], 'Number');
                        }
                        if (data.hasOwnProperty('average_crossing_score')) {
                            obj['average_crossing_score'] = ApiClient.convertToType(data['average_crossing_score'], 'Number');
                        }
                        if (data.hasOwnProperty('average_boulder_score')) {
                            obj['average_boulder_score'] = ApiClient.convertToType(data['average_boulder_score'], 'Number');
                        }
                        if (data.hasOwnProperty('average_tower_score')) {
                            obj['average_tower_score'] = ApiClient.convertToType(data['average_tower_score'], 'Number');
                        }
                        if (data.hasOwnProperty('average_foul_score')) {
                            obj['average_foul_score'] = ApiClient.convertToType(data['average_foul_score'], 'Number');
                        }
                        if (data.hasOwnProperty('high_score')) {
                            obj['high_score'] = ApiClient.convertToType(data['high_score'], ['String']);
                        }
                    }
                    return obj;
                }

                /**
                 * For the Low Bar - An array with three values, number of times damaged, number of opportunities to damage, and percentage.
                 * @member {Array.<Number>} LowBar
                 */
                exports.prototype['LowBar'] = undefined;
                /**
                 * For the Cheval De Frise - An array with three values, number of times damaged, number of opportunities to damage, and percentage.
                 * @member {Array.<Number>} A_ChevalDeFrise
                 */
                exports.prototype['A_ChevalDeFrise'] = undefined;
                /**
                 * For the Portcullis - An array with three values, number of times damaged, number of opportunities to damage, and percentage.
                 * @member {Array.<Number>} A_Portcullis
                 */
                exports.prototype['A_Portcullis'] = undefined;
                /**
                 * For the Ramparts - An array with three values, number of times damaged, number of opportunities to damage, and percentage.
                 * @member {Array.<Number>} B_Ramparts
                 */
                exports.prototype['B_Ramparts'] = undefined;
                /**
                 * For the Moat - An array with three values, number of times damaged, number of opportunities to damage, and percentage.
                 * @member {Array.<Number>} B_Moat
                 */
                exports.prototype['B_Moat'] = undefined;
                /**
                 * For the Sally Port - An array with three values, number of times damaged, number of opportunities to damage, and percentage.
                 * @member {Array.<Number>} C_SallyPort
                 */
                exports.prototype['C_SallyPort'] = undefined;
                /**
                 * For the Drawbridge - An array with three values, number of times damaged, number of opportunities to damage, and percentage.
                 * @member {Array.<Number>} C_Drawbridge
                 */
                exports.prototype['C_Drawbridge'] = undefined;
                /**
                 * For the Rough Terrain - An array with three values, number of times damaged, number of opportunities to damage, and percentage.
                 * @member {Array.<Number>} D_RoughTerrain
                 */
                exports.prototype['D_RoughTerrain'] = undefined;
                /**
                 * For the Rock Wall - An array with three values, number of times damaged, number of opportunities to damage, and percentage.
                 * @member {Array.<Number>} D_RockWall
                 */
                exports.prototype['D_RockWall'] = undefined;
                /**
                 * Average number of high goals scored.
                 * @member {Number} average_high_goals
                 */
                exports.prototype['average_high_goals'] = undefined;
                /**
                 * Average number of low goals scored.
                 * @member {Number} average_low_goals
                 */
                exports.prototype['average_low_goals'] = undefined;
                /**
                 * An array with three values, number of times breached, number of opportunities to breech, and percentage.
                 * @member {Array.<Number>} breaches
                 */
                exports.prototype['breaches'] = undefined;
                /**
                 * An array with three values, number of times scaled, number of opportunities to scale, and percentage.
                 * @member {Array.<Number>} scales
                 */
                exports.prototype['scales'] = undefined;
                /**
                 * An array with three values, number of times challenged, number of opportunities to challenge, and percentage.
                 * @member {Array.<Number>} challenges
                 */
                exports.prototype['challenges'] = undefined;
                /**
                 * An array with three values, number of times captured, number of opportunities to capture, and percentage.
                 * @member {Array.<Number>} captures
                 */
                exports.prototype['captures'] = undefined;
                /**
                 * Average winning score.
                 * @member {Number} average_win_score
                 */
                exports.prototype['average_win_score'] = undefined;
                /**
                 * Average margin of victory.
                 * @member {Number} average_win_margin
                 */
                exports.prototype['average_win_margin'] = undefined;
                /**
                 * Average total score.
                 * @member {Number} average_score
                 */
                exports.prototype['average_score'] = undefined;
                /**
                 * Average autonomous score.
                 * @member {Number} average_auto_score
                 */
                exports.prototype['average_auto_score'] = undefined;
                /**
                 * Average crossing score.
                 * @member {Number} average_crossing_score
                 */
                exports.prototype['average_crossing_score'] = undefined;
                /**
                 * Average boulder score.
                 * @member {Number} average_boulder_score
                 */
                exports.prototype['average_boulder_score'] = undefined;
                /**
                 * Average tower score.
                 * @member {Number} average_tower_score
                 */
                exports.prototype['average_tower_score'] = undefined;
                /**
                 * Average foul score.
                 * @member {Number} average_foul_score
                 */
                exports.prototype['average_foul_score'] = undefined;
                /**
                 * An array with three values, high score, match key from the match with the high score, and the name of the match.
                 * @member {Array.<String>} high_score
                 */
                exports.prototype['high_score'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9
        }],
        33: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/EventInsights2017Detail'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('./EventInsights2017Detail'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.EventInsights2017 = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.EventInsights2017Detail);
                }
            }(this, function (ApiClient, EventInsights2017Detail) {
                'use strict';




                /**
                 * The EventInsights2017 model module.
                 * @module TBAAPI.Client/model/EventInsights2017
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>EventInsights2017</code>.
                 * Insights for FIRST STEAMWORKS qualification and elimination matches.
                 * @alias module:TBAAPI.Client/model/EventInsights2017
                 * @class
                 */
                var exports = function () {
                    var _this = this;



                };

                /**
                 * Constructs a <code>EventInsights2017</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/EventInsights2017} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/EventInsights2017} The populated <code>EventInsights2017</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('qual')) {
                            obj['qual'] = EventInsights2017Detail.constructFromObject(data['qual']);
                        }
                        if (data.hasOwnProperty('playoff')) {
                            obj['playoff'] = EventInsights2017Detail.constructFromObject(data['playoff']);
                        }
                    }
                    return obj;
                }

                /**
                 * @member {module:TBAAPI.Client/model/EventInsights2017Detail} qual
                 */
                exports.prototype['qual'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/EventInsights2017Detail} playoff
                 */
                exports.prototype['playoff'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9,
            "./EventInsights2017Detail": 34
        }],
        34: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.EventInsights2017Detail = factory(root.TbaApiV3client.ApiClient);
                }
            }(this, function (ApiClient) {
                'use strict';




                /**
                 * The EventInsights2017Detail model module.
                 * @module TBAAPI.Client/model/EventInsights2017Detail
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>EventInsights2017Detail</code>.
                 * @alias module:TBAAPI.Client/model/EventInsights2017Detail
                 * @class
                 * @param averageFoulScore {Number} Average foul score.
                 * @param averageFuelPoints {Number} Average fuel points scored.
                 * @param averageFuelPointsAuto {Number} Average fuel points scored during auto.
                 * @param averageFuelPointsTeleop {Number} Average fuel points scored during teleop.
                 * @param averageHighGoals {Number} Average points scored in the high goal.
                 * @param averageHighGoalsAuto {Number} Average points scored in the high goal during auto.
                 * @param averageHighGoalsTeleop {Number} Average points scored in the high goal during teleop.
                 * @param averageLowGoals {Number} Average points scored in the low goal.
                 * @param averageLowGoalsAuto {Number} Average points scored in the low goal during auto.
                 * @param averageLowGoalsTeleop {Number} Average points scored in the low goal during teleop.
                 * @param averageMobilityPointsAuto {Number} Average mobility points scored during auto.
                 * @param averagePointsAuto {Number} Average points scored during auto.
                 * @param averagePointsTeleop {Number} Average points scored during teleop.
                 * @param averageRotorPoints {Number} Average rotor points scored.
                 * @param averageRotorPointsAuto {Number} Average rotor points scored during auto.
                 * @param averageRotorPointsTeleop {Number} Average rotor points scored during teleop.
                 * @param averageScore {Number} Average score.
                 * @param averageTakeoffPointsTeleop {Number} Average takeoff points scored during teleop.
                 * @param averageWinMargin {Number} Average margin of victory.
                 * @param averageWinScore {Number} Average winning score.
                 * @param highKpa {Array.<String>} An array with three values, kPa scored, match key from the match with the high kPa, and the name of the match
                 * @param highScore {Array.<String>} An array with three values, high score, match key from the match with the high score, and the name of the match
                 * @param kpaAchieved {Array.<Number>} An array with three values, number of times kPa bonus achieved, number of opportunities to bonus, and percentage.
                 * @param mobilityCounts {Array.<Number>} An array with three values, number of times mobility bonus achieved, number of opportunities to bonus, and percentage.
                 * @param rotor1Engaged {Array.<Number>} An array with three values, number of times rotor 1 engaged, number of opportunities to engage, and percentage.
                 * @param rotor1EngagedAuto {Array.<Number>} An array with three values, number of times rotor 1 engaged in auto, number of opportunities to engage in auto, and percentage.
                 * @param rotor2Engaged {Array.<Number>} An array with three values, number of times rotor 2 engaged, number of opportunities to engage, and percentage.
                 * @param rotor2EngagedAuto {Array.<Number>} An array with three values, number of times rotor 2 engaged in auto, number of opportunities to engage in auto, and percentage.
                 * @param rotor3Engaged {Array.<Number>} An array with three values, number of times rotor 3 engaged, number of opportunities to engage, and percentage.
                 * @param rotor4Engaged {Array.<Number>} An array with three values, number of times rotor 4 engaged, number of opportunities to engage, and percentage.
                 * @param takeoffCounts {Array.<Number>} An array with three values, number of times takeoff was counted, number of opportunities to takeoff, and percentage.
                 */
                var exports = function (averageFoulScore, averageFuelPoints, averageFuelPointsAuto, averageFuelPointsTeleop, averageHighGoals, averageHighGoalsAuto, averageHighGoalsTeleop, averageLowGoals, averageLowGoalsAuto, averageLowGoalsTeleop, averageMobilityPointsAuto, averagePointsAuto, averagePointsTeleop, averageRotorPoints, averageRotorPointsAuto, averageRotorPointsTeleop, averageScore, averageTakeoffPointsTeleop, averageWinMargin, averageWinScore, highKpa, highScore, kpaAchieved, mobilityCounts, rotor1Engaged, rotor1EngagedAuto, rotor2Engaged, rotor2EngagedAuto, rotor3Engaged, rotor4Engaged, takeoffCounts) {
                    var _this = this;

                    _this['average_foul_score'] = averageFoulScore;
                    _this['average_fuel_points'] = averageFuelPoints;
                    _this['average_fuel_points_auto'] = averageFuelPointsAuto;
                    _this['average_fuel_points_teleop'] = averageFuelPointsTeleop;
                    _this['average_high_goals'] = averageHighGoals;
                    _this['average_high_goals_auto'] = averageHighGoalsAuto;
                    _this['average_high_goals_teleop'] = averageHighGoalsTeleop;
                    _this['average_low_goals'] = averageLowGoals;
                    _this['average_low_goals_auto'] = averageLowGoalsAuto;
                    _this['average_low_goals_teleop'] = averageLowGoalsTeleop;
                    _this['average_mobility_points_auto'] = averageMobilityPointsAuto;
                    _this['average_points_auto'] = averagePointsAuto;
                    _this['average_points_teleop'] = averagePointsTeleop;
                    _this['average_rotor_points'] = averageRotorPoints;
                    _this['average_rotor_points_auto'] = averageRotorPointsAuto;
                    _this['average_rotor_points_teleop'] = averageRotorPointsTeleop;
                    _this['average_score'] = averageScore;
                    _this['average_takeoff_points_teleop'] = averageTakeoffPointsTeleop;
                    _this['average_win_margin'] = averageWinMargin;
                    _this['average_win_score'] = averageWinScore;
                    _this['high_kpa'] = highKpa;
                    _this['high_score'] = highScore;
                    _this['kpa_achieved'] = kpaAchieved;
                    _this['mobility_counts'] = mobilityCounts;
                    _this['rotor_1_engaged'] = rotor1Engaged;
                    _this['rotor_1_engaged_auto'] = rotor1EngagedAuto;
                    _this['rotor_2_engaged'] = rotor2Engaged;
                    _this['rotor_2_engaged_auto'] = rotor2EngagedAuto;
                    _this['rotor_3_engaged'] = rotor3Engaged;
                    _this['rotor_4_engaged'] = rotor4Engaged;
                    _this['takeoff_counts'] = takeoffCounts;
                };

                /**
                 * Constructs a <code>EventInsights2017Detail</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/EventInsights2017Detail} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/EventInsights2017Detail} The populated <code>EventInsights2017Detail</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('average_foul_score')) {
                            obj['average_foul_score'] = ApiClient.convertToType(data['average_foul_score'], 'Number');
                        }
                        if (data.hasOwnProperty('average_fuel_points')) {
                            obj['average_fuel_points'] = ApiClient.convertToType(data['average_fuel_points'], 'Number');
                        }
                        if (data.hasOwnProperty('average_fuel_points_auto')) {
                            obj['average_fuel_points_auto'] = ApiClient.convertToType(data['average_fuel_points_auto'], 'Number');
                        }
                        if (data.hasOwnProperty('average_fuel_points_teleop')) {
                            obj['average_fuel_points_teleop'] = ApiClient.convertToType(data['average_fuel_points_teleop'], 'Number');
                        }
                        if (data.hasOwnProperty('average_high_goals')) {
                            obj['average_high_goals'] = ApiClient.convertToType(data['average_high_goals'], 'Number');
                        }
                        if (data.hasOwnProperty('average_high_goals_auto')) {
                            obj['average_high_goals_auto'] = ApiClient.convertToType(data['average_high_goals_auto'], 'Number');
                        }
                        if (data.hasOwnProperty('average_high_goals_teleop')) {
                            obj['average_high_goals_teleop'] = ApiClient.convertToType(data['average_high_goals_teleop'], 'Number');
                        }
                        if (data.hasOwnProperty('average_low_goals')) {
                            obj['average_low_goals'] = ApiClient.convertToType(data['average_low_goals'], 'Number');
                        }
                        if (data.hasOwnProperty('average_low_goals_auto')) {
                            obj['average_low_goals_auto'] = ApiClient.convertToType(data['average_low_goals_auto'], 'Number');
                        }
                        if (data.hasOwnProperty('average_low_goals_teleop')) {
                            obj['average_low_goals_teleop'] = ApiClient.convertToType(data['average_low_goals_teleop'], 'Number');
                        }
                        if (data.hasOwnProperty('average_mobility_points_auto')) {
                            obj['average_mobility_points_auto'] = ApiClient.convertToType(data['average_mobility_points_auto'], 'Number');
                        }
                        if (data.hasOwnProperty('average_points_auto')) {
                            obj['average_points_auto'] = ApiClient.convertToType(data['average_points_auto'], 'Number');
                        }
                        if (data.hasOwnProperty('average_points_teleop')) {
                            obj['average_points_teleop'] = ApiClient.convertToType(data['average_points_teleop'], 'Number');
                        }
                        if (data.hasOwnProperty('average_rotor_points')) {
                            obj['average_rotor_points'] = ApiClient.convertToType(data['average_rotor_points'], 'Number');
                        }
                        if (data.hasOwnProperty('average_rotor_points_auto')) {
                            obj['average_rotor_points_auto'] = ApiClient.convertToType(data['average_rotor_points_auto'], 'Number');
                        }
                        if (data.hasOwnProperty('average_rotor_points_teleop')) {
                            obj['average_rotor_points_teleop'] = ApiClient.convertToType(data['average_rotor_points_teleop'], 'Number');
                        }
                        if (data.hasOwnProperty('average_score')) {
                            obj['average_score'] = ApiClient.convertToType(data['average_score'], 'Number');
                        }
                        if (data.hasOwnProperty('average_takeoff_points_teleop')) {
                            obj['average_takeoff_points_teleop'] = ApiClient.convertToType(data['average_takeoff_points_teleop'], 'Number');
                        }
                        if (data.hasOwnProperty('average_win_margin')) {
                            obj['average_win_margin'] = ApiClient.convertToType(data['average_win_margin'], 'Number');
                        }
                        if (data.hasOwnProperty('average_win_score')) {
                            obj['average_win_score'] = ApiClient.convertToType(data['average_win_score'], 'Number');
                        }
                        if (data.hasOwnProperty('high_kpa')) {
                            obj['high_kpa'] = ApiClient.convertToType(data['high_kpa'], ['String']);
                        }
                        if (data.hasOwnProperty('high_score')) {
                            obj['high_score'] = ApiClient.convertToType(data['high_score'], ['String']);
                        }
                        if (data.hasOwnProperty('kpa_achieved')) {
                            obj['kpa_achieved'] = ApiClient.convertToType(data['kpa_achieved'], ['Number']);
                        }
                        if (data.hasOwnProperty('mobility_counts')) {
                            obj['mobility_counts'] = ApiClient.convertToType(data['mobility_counts'], ['Number']);
                        }
                        if (data.hasOwnProperty('rotor_1_engaged')) {
                            obj['rotor_1_engaged'] = ApiClient.convertToType(data['rotor_1_engaged'], ['Number']);
                        }
                        if (data.hasOwnProperty('rotor_1_engaged_auto')) {
                            obj['rotor_1_engaged_auto'] = ApiClient.convertToType(data['rotor_1_engaged_auto'], ['Number']);
                        }
                        if (data.hasOwnProperty('rotor_2_engaged')) {
                            obj['rotor_2_engaged'] = ApiClient.convertToType(data['rotor_2_engaged'], ['Number']);
                        }
                        if (data.hasOwnProperty('rotor_2_engaged_auto')) {
                            obj['rotor_2_engaged_auto'] = ApiClient.convertToType(data['rotor_2_engaged_auto'], ['Number']);
                        }
                        if (data.hasOwnProperty('rotor_3_engaged')) {
                            obj['rotor_3_engaged'] = ApiClient.convertToType(data['rotor_3_engaged'], ['Number']);
                        }
                        if (data.hasOwnProperty('rotor_4_engaged')) {
                            obj['rotor_4_engaged'] = ApiClient.convertToType(data['rotor_4_engaged'], ['Number']);
                        }
                        if (data.hasOwnProperty('takeoff_counts')) {
                            obj['takeoff_counts'] = ApiClient.convertToType(data['takeoff_counts'], ['Number']);
                        }
                    }
                    return obj;
                }

                /**
                 * Average foul score.
                 * @member {Number} average_foul_score
                 */
                exports.prototype['average_foul_score'] = undefined;
                /**
                 * Average fuel points scored.
                 * @member {Number} average_fuel_points
                 */
                exports.prototype['average_fuel_points'] = undefined;
                /**
                 * Average fuel points scored during auto.
                 * @member {Number} average_fuel_points_auto
                 */
                exports.prototype['average_fuel_points_auto'] = undefined;
                /**
                 * Average fuel points scored during teleop.
                 * @member {Number} average_fuel_points_teleop
                 */
                exports.prototype['average_fuel_points_teleop'] = undefined;
                /**
                 * Average points scored in the high goal.
                 * @member {Number} average_high_goals
                 */
                exports.prototype['average_high_goals'] = undefined;
                /**
                 * Average points scored in the high goal during auto.
                 * @member {Number} average_high_goals_auto
                 */
                exports.prototype['average_high_goals_auto'] = undefined;
                /**
                 * Average points scored in the high goal during teleop.
                 * @member {Number} average_high_goals_teleop
                 */
                exports.prototype['average_high_goals_teleop'] = undefined;
                /**
                 * Average points scored in the low goal.
                 * @member {Number} average_low_goals
                 */
                exports.prototype['average_low_goals'] = undefined;
                /**
                 * Average points scored in the low goal during auto.
                 * @member {Number} average_low_goals_auto
                 */
                exports.prototype['average_low_goals_auto'] = undefined;
                /**
                 * Average points scored in the low goal during teleop.
                 * @member {Number} average_low_goals_teleop
                 */
                exports.prototype['average_low_goals_teleop'] = undefined;
                /**
                 * Average mobility points scored during auto.
                 * @member {Number} average_mobility_points_auto
                 */
                exports.prototype['average_mobility_points_auto'] = undefined;
                /**
                 * Average points scored during auto.
                 * @member {Number} average_points_auto
                 */
                exports.prototype['average_points_auto'] = undefined;
                /**
                 * Average points scored during teleop.
                 * @member {Number} average_points_teleop
                 */
                exports.prototype['average_points_teleop'] = undefined;
                /**
                 * Average rotor points scored.
                 * @member {Number} average_rotor_points
                 */
                exports.prototype['average_rotor_points'] = undefined;
                /**
                 * Average rotor points scored during auto.
                 * @member {Number} average_rotor_points_auto
                 */
                exports.prototype['average_rotor_points_auto'] = undefined;
                /**
                 * Average rotor points scored during teleop.
                 * @member {Number} average_rotor_points_teleop
                 */
                exports.prototype['average_rotor_points_teleop'] = undefined;
                /**
                 * Average score.
                 * @member {Number} average_score
                 */
                exports.prototype['average_score'] = undefined;
                /**
                 * Average takeoff points scored during teleop.
                 * @member {Number} average_takeoff_points_teleop
                 */
                exports.prototype['average_takeoff_points_teleop'] = undefined;
                /**
                 * Average margin of victory.
                 * @member {Number} average_win_margin
                 */
                exports.prototype['average_win_margin'] = undefined;
                /**
                 * Average winning score.
                 * @member {Number} average_win_score
                 */
                exports.prototype['average_win_score'] = undefined;
                /**
                 * An array with three values, kPa scored, match key from the match with the high kPa, and the name of the match
                 * @member {Array.<String>} high_kpa
                 */
                exports.prototype['high_kpa'] = undefined;
                /**
                 * An array with three values, high score, match key from the match with the high score, and the name of the match
                 * @member {Array.<String>} high_score
                 */
                exports.prototype['high_score'] = undefined;
                /**
                 * An array with three values, number of times kPa bonus achieved, number of opportunities to bonus, and percentage.
                 * @member {Array.<Number>} kpa_achieved
                 */
                exports.prototype['kpa_achieved'] = undefined;
                /**
                 * An array with three values, number of times mobility bonus achieved, number of opportunities to bonus, and percentage.
                 * @member {Array.<Number>} mobility_counts
                 */
                exports.prototype['mobility_counts'] = undefined;
                /**
                 * An array with three values, number of times rotor 1 engaged, number of opportunities to engage, and percentage.
                 * @member {Array.<Number>} rotor_1_engaged
                 */
                exports.prototype['rotor_1_engaged'] = undefined;
                /**
                 * An array with three values, number of times rotor 1 engaged in auto, number of opportunities to engage in auto, and percentage.
                 * @member {Array.<Number>} rotor_1_engaged_auto
                 */
                exports.prototype['rotor_1_engaged_auto'] = undefined;
                /**
                 * An array with three values, number of times rotor 2 engaged, number of opportunities to engage, and percentage.
                 * @member {Array.<Number>} rotor_2_engaged
                 */
                exports.prototype['rotor_2_engaged'] = undefined;
                /**
                 * An array with three values, number of times rotor 2 engaged in auto, number of opportunities to engage in auto, and percentage.
                 * @member {Array.<Number>} rotor_2_engaged_auto
                 */
                exports.prototype['rotor_2_engaged_auto'] = undefined;
                /**
                 * An array with three values, number of times rotor 3 engaged, number of opportunities to engage, and percentage.
                 * @member {Array.<Number>} rotor_3_engaged
                 */
                exports.prototype['rotor_3_engaged'] = undefined;
                /**
                 * An array with three values, number of times rotor 4 engaged, number of opportunities to engage, and percentage.
                 * @member {Array.<Number>} rotor_4_engaged
                 */
                exports.prototype['rotor_4_engaged'] = undefined;
                /**
                 * An array with three values, number of times takeoff was counted, number of opportunities to takeoff, and percentage.
                 * @member {Array.<Number>} takeoff_counts
                 */
                exports.prototype['takeoff_counts'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9
        }],
        35: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.EventOPRs = factory(root.TbaApiV3client.ApiClient);
                }
            }(this, function (ApiClient) {
                'use strict';




                /**
                 * The EventOPRs model module.
                 * @module TBAAPI.Client/model/EventOPRs
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>EventOPRs</code>.
                 * OPR, DPR, and CCWM for teams at the event.
                 * @alias module:TBAAPI.Client/model/EventOPRs
                 * @class
                 */
                var exports = function () {
                    var _this = this;




                };

                /**
                 * Constructs a <code>EventOPRs</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/EventOPRs} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/EventOPRs} The populated <code>EventOPRs</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('oprs')) {
                            obj['oprs'] = ApiClient.convertToType(data['oprs'], {
                                'String': 'Number'
                            });
                        }
                        if (data.hasOwnProperty('dprs')) {
                            obj['dprs'] = ApiClient.convertToType(data['dprs'], {
                                'String': 'Number'
                            });
                        }
                        if (data.hasOwnProperty('ccwms')) {
                            obj['ccwms'] = ApiClient.convertToType(data['ccwms'], {
                                'String': 'Number'
                            });
                        }
                    }
                    return obj;
                }

                /**
                 * A key-value pair with team key (eg `frc254`) as key and OPR as value.
                 * @member {Object.<String, Number>} oprs
                 */
                exports.prototype['oprs'] = undefined;
                /**
                 * A key-value pair with team key (eg `frc254`) as key and DPR as value.
                 * @member {Object.<String, Number>} dprs
                 */
                exports.prototype['dprs'] = undefined;
                /**
                 * A key-value pair with team key (eg `frc254`) as key and CCWM as value.
                 * @member {Object.<String, Number>} ccwms
                 */
                exports.prototype['ccwms'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9
        }],
        36: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.EventPredictions = factory(root.TbaApiV3client.ApiClient);
                }
            }(this, function (ApiClient) {
                'use strict';




                /**
                 * The EventPredictions model module.
                 * @module TBAAPI.Client/model/EventPredictions
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>EventPredictions</code>.
                 * JSON Object containing prediction information for the event. Contains year-specific information and is subject to change.
                 * @alias module:TBAAPI.Client/model/EventPredictions
                 * @class
                 */
                var exports = function () {
                    var _this = this;

                };

                /**
                 * Constructs a <code>EventPredictions</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/EventPredictions} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/EventPredictions} The populated <code>EventPredictions</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                    }
                    return obj;
                }




                return exports;
            }));



}, {
            "../ApiClient": 9
        }],
        37: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/EventRankingExtraStatsInfo', 'TBAAPI.Client/model/EventRankingRankings', 'TBAAPI.Client/model/EventRankingSortOrderInfo'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('./EventRankingExtraStatsInfo'), require('./EventRankingRankings'), require('./EventRankingSortOrderInfo'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.EventRanking = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.EventRankingExtraStatsInfo, root.TbaApiV3client.EventRankingRankings, root.TbaApiV3client.EventRankingSortOrderInfo);
                }
            }(this, function (ApiClient, EventRankingExtraStatsInfo, EventRankingRankings, EventRankingSortOrderInfo) {
                'use strict';




                /**
                 * The EventRanking model module.
                 * @module TBAAPI.Client/model/EventRanking
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>EventRanking</code>.
                 * @alias module:TBAAPI.Client/model/EventRanking
                 * @class
                 * @param rankings {Array.<module:TBAAPI.Client/model/EventRankingRankings>} List of rankings at the event.
                 * @param sortOrderInfo {Array.<module:TBAAPI.Client/model/EventRankingSortOrderInfo>} List of year-specific values provided in the `sort_orders` array for each team.
                 */
                var exports = function (rankings, sortOrderInfo) {
                    var _this = this;

                    _this['rankings'] = rankings;

                    _this['sort_order_info'] = sortOrderInfo;
                };

                /**
                 * Constructs a <code>EventRanking</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/EventRanking} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/EventRanking} The populated <code>EventRanking</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('rankings')) {
                            obj['rankings'] = ApiClient.convertToType(data['rankings'], [EventRankingRankings]);
                        }
                        if (data.hasOwnProperty('extra_stats_info')) {
                            obj['extra_stats_info'] = ApiClient.convertToType(data['extra_stats_info'], [EventRankingExtraStatsInfo]);
                        }
                        if (data.hasOwnProperty('sort_order_info')) {
                            obj['sort_order_info'] = ApiClient.convertToType(data['sort_order_info'], [EventRankingSortOrderInfo]);
                        }
                    }
                    return obj;
                }

                /**
                 * List of rankings at the event.
                 * @member {Array.<module:TBAAPI.Client/model/EventRankingRankings>} rankings
                 */
                exports.prototype['rankings'] = undefined;
                /**
                 * List of special TBA-generated values provided in the `extra_stats` array for each item.
                 * @member {Array.<module:TBAAPI.Client/model/EventRankingExtraStatsInfo>} extra_stats_info
                 */
                exports.prototype['extra_stats_info'] = undefined;
                /**
                 * List of year-specific values provided in the `sort_orders` array for each team.
                 * @member {Array.<module:TBAAPI.Client/model/EventRankingSortOrderInfo>} sort_order_info
                 */
                exports.prototype['sort_order_info'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9,
            "./EventRankingExtraStatsInfo": 38,
            "./EventRankingRankings": 39,
            "./EventRankingSortOrderInfo": 40
        }],
        38: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.EventRankingExtraStatsInfo = factory(root.TbaApiV3client.ApiClient);
                }
            }(this, function (ApiClient) {
                'use strict';




                /**
                 * The EventRankingExtraStatsInfo model module.
                 * @module TBAAPI.Client/model/EventRankingExtraStatsInfo
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>EventRankingExtraStatsInfo</code>.
                 * @alias module:TBAAPI.Client/model/EventRankingExtraStatsInfo
                 * @class
                 * @param name {String} Name of the field used in the `extra_stats` array.
                 * @param precision {Number} Integer expressing the number of digits of precision in the number provided in `sort_orders`.
                 */
                var exports = function (name, precision) {
                    var _this = this;

                    _this['name'] = name;
                    _this['precision'] = precision;
                };

                /**
                 * Constructs a <code>EventRankingExtraStatsInfo</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/EventRankingExtraStatsInfo} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/EventRankingExtraStatsInfo} The populated <code>EventRankingExtraStatsInfo</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('name')) {
                            obj['name'] = ApiClient.convertToType(data['name'], 'String');
                        }
                        if (data.hasOwnProperty('precision')) {
                            obj['precision'] = ApiClient.convertToType(data['precision'], 'Number');
                        }
                    }
                    return obj;
                }

                /**
                 * Name of the field used in the `extra_stats` array.
                 * @member {String} name
                 */
                exports.prototype['name'] = undefined;
                /**
                 * Integer expressing the number of digits of precision in the number provided in `sort_orders`.
                 * @member {Number} precision
                 */
                exports.prototype['precision'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9
        }],
        39: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/WLTRecord'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('./WLTRecord'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.EventRankingRankings = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.WLTRecord);
                }
            }(this, function (ApiClient, WLTRecord) {
                'use strict';




                /**
                 * The EventRankingRankings model module.
                 * @module TBAAPI.Client/model/EventRankingRankings
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>EventRankingRankings</code>.
                 * @alias module:TBAAPI.Client/model/EventRankingRankings
                 * @class
                 * @param dq {Number} Number of times disqualified.
                 * @param matchesPlayed {Number} Number of matches played by this team.
                 * @param rank {Number} The team's rank at the event as provided by FIRST.
                 * @param record {module:TBAAPI.Client/model/WLTRecord} 
                 * @param teamKey {String} The team with this rank.
                 */
                var exports = function (dq, matchesPlayed, rank, record, teamKey) {
                    var _this = this;

                    _this['dq'] = dq;
                    _this['matches_played'] = matchesPlayed;

                    _this['rank'] = rank;
                    _this['record'] = record;


                    _this['team_key'] = teamKey;
                };

                /**
                 * Constructs a <code>EventRankingRankings</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/EventRankingRankings} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/EventRankingRankings} The populated <code>EventRankingRankings</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('dq')) {
                            obj['dq'] = ApiClient.convertToType(data['dq'], 'Number');
                        }
                        if (data.hasOwnProperty('matches_played')) {
                            obj['matches_played'] = ApiClient.convertToType(data['matches_played'], 'Number');
                        }
                        if (data.hasOwnProperty('qual_average')) {
                            obj['qual_average'] = ApiClient.convertToType(data['qual_average'], 'Number');
                        }
                        if (data.hasOwnProperty('rank')) {
                            obj['rank'] = ApiClient.convertToType(data['rank'], 'Number');
                        }
                        if (data.hasOwnProperty('record')) {
                            obj['record'] = WLTRecord.constructFromObject(data['record']);
                        }
                        if (data.hasOwnProperty('extra_stats')) {
                            obj['extra_stats'] = ApiClient.convertToType(data['extra_stats'], ['Number']);
                        }
                        if (data.hasOwnProperty('sort_orders')) {
                            obj['sort_orders'] = ApiClient.convertToType(data['sort_orders'], ['Number']);
                        }
                        if (data.hasOwnProperty('team_key')) {
                            obj['team_key'] = ApiClient.convertToType(data['team_key'], 'String');
                        }
                    }
                    return obj;
                }

                /**
                 * Number of times disqualified.
                 * @member {Number} dq
                 */
                exports.prototype['dq'] = undefined;
                /**
                 * Number of matches played by this team.
                 * @member {Number} matches_played
                 */
                exports.prototype['matches_played'] = undefined;
                /**
                 * The average match score during qualifications. Year specific. May be null if not relevant for a given year.
                 * @member {Number} qual_average
                 */
                exports.prototype['qual_average'] = undefined;
                /**
                 * The team's rank at the event as provided by FIRST.
                 * @member {Number} rank
                 */
                exports.prototype['rank'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/WLTRecord} record
                 */
                exports.prototype['record'] = undefined;
                /**
                 * Additional special data on the team's performance calculated by TBA.
                 * @member {Array.<Number>} extra_stats
                 */
                exports.prototype['extra_stats'] = undefined;
                /**
                 * Additional year-specific information, may be null. See parent `sort_order_info` for details.
                 * @member {Array.<Number>} sort_orders
                 */
                exports.prototype['sort_orders'] = undefined;
                /**
                 * The team with this rank.
                 * @member {String} team_key
                 */
                exports.prototype['team_key'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9,
            "./WLTRecord": 64
        }],
        40: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.EventRankingSortOrderInfo = factory(root.TbaApiV3client.ApiClient);
                }
            }(this, function (ApiClient) {
                'use strict';




                /**
                 * The EventRankingSortOrderInfo model module.
                 * @module TBAAPI.Client/model/EventRankingSortOrderInfo
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>EventRankingSortOrderInfo</code>.
                 * @alias module:TBAAPI.Client/model/EventRankingSortOrderInfo
                 * @class
                 * @param name {String} Name of the field used in the `sort_order` array.
                 * @param precision {Number} Integer expressing the number of digits of precision in the number provided in `sort_orders`.
                 */
                var exports = function (name, precision) {
                    var _this = this;

                    _this['name'] = name;
                    _this['precision'] = precision;
                };

                /**
                 * Constructs a <code>EventRankingSortOrderInfo</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/EventRankingSortOrderInfo} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/EventRankingSortOrderInfo} The populated <code>EventRankingSortOrderInfo</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('name')) {
                            obj['name'] = ApiClient.convertToType(data['name'], 'String');
                        }
                        if (data.hasOwnProperty('precision')) {
                            obj['precision'] = ApiClient.convertToType(data['precision'], 'Number');
                        }
                    }
                    return obj;
                }

                /**
                 * Name of the field used in the `sort_order` array.
                 * @member {String} name
                 */
                exports.prototype['name'] = undefined;
                /**
                 * Integer expressing the number of digits of precision in the number provided in `sort_orders`.
                 * @member {Number} precision
                 */
                exports.prototype['precision'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9
        }],
        41: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/DistrictList'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('./DistrictList'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.EventSimple = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.DistrictList);
                }
            }(this, function (ApiClient, DistrictList) {
                'use strict';




                /**
                 * The EventSimple model module.
                 * @module TBAAPI.Client/model/EventSimple
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>EventSimple</code>.
                 * @alias module:TBAAPI.Client/model/EventSimple
                 * @class
                 * @param key {String} TBA event key with the format yyyy[EVENT_CODE], where yyyy is the year, and EVENT_CODE is the event code of the event.
                 * @param name {String} Official name of event on record either provided by FIRST or organizers of offseason event.
                 * @param eventCode {String} Event short code, as provided by FIRST.
                 * @param eventType {Number} Event Type, as defined here: https://github.com/the-blue-alliance/the-blue-alliance/blob/master/consts/event_type.py#L2
                 * @param startDate {Date} Event start date in `yyyy-mm-dd` format.
                 * @param endDate {Date} Event end date in `yyyy-mm-dd` format.
                 * @param year {Number} Year the event data is for.
                 */
                var exports = function (key, name, eventCode, eventType, startDate, endDate, year) {
                    var _this = this;

                    _this['key'] = key;
                    _this['name'] = name;
                    _this['event_code'] = eventCode;
                    _this['event_type'] = eventType;




                    _this['start_date'] = startDate;
                    _this['end_date'] = endDate;
                    _this['year'] = year;
                };

                /**
                 * Constructs a <code>EventSimple</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/EventSimple} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/EventSimple} The populated <code>EventSimple</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('key')) {
                            obj['key'] = ApiClient.convertToType(data['key'], 'String');
                        }
                        if (data.hasOwnProperty('name')) {
                            obj['name'] = ApiClient.convertToType(data['name'], 'String');
                        }
                        if (data.hasOwnProperty('event_code')) {
                            obj['event_code'] = ApiClient.convertToType(data['event_code'], 'String');
                        }
                        if (data.hasOwnProperty('event_type')) {
                            obj['event_type'] = ApiClient.convertToType(data['event_type'], 'Number');
                        }
                        if (data.hasOwnProperty('district')) {
                            obj['district'] = DistrictList.constructFromObject(data['district']);
                        }
                        if (data.hasOwnProperty('city')) {
                            obj['city'] = ApiClient.convertToType(data['city'], 'String');
                        }
                        if (data.hasOwnProperty('state_prov')) {
                            obj['state_prov'] = ApiClient.convertToType(data['state_prov'], 'String');
                        }
                        if (data.hasOwnProperty('country')) {
                            obj['country'] = ApiClient.convertToType(data['country'], 'String');
                        }
                        if (data.hasOwnProperty('start_date')) {
                            obj['start_date'] = ApiClient.convertToType(data['start_date'], 'Date');
                        }
                        if (data.hasOwnProperty('end_date')) {
                            obj['end_date'] = ApiClient.convertToType(data['end_date'], 'Date');
                        }
                        if (data.hasOwnProperty('year')) {
                            obj['year'] = ApiClient.convertToType(data['year'], 'Number');
                        }
                    }
                    return obj;
                }

                /**
                 * TBA event key with the format yyyy[EVENT_CODE], where yyyy is the year, and EVENT_CODE is the event code of the event.
                 * @member {String} key
                 */
                exports.prototype['key'] = undefined;
                /**
                 * Official name of event on record either provided by FIRST or organizers of offseason event.
                 * @member {String} name
                 */
                exports.prototype['name'] = undefined;
                /**
                 * Event short code, as provided by FIRST.
                 * @member {String} event_code
                 */
                exports.prototype['event_code'] = undefined;
                /**
                 * Event Type, as defined here: https://github.com/the-blue-alliance/the-blue-alliance/blob/master/consts/event_type.py#L2
                 * @member {Number} event_type
                 */
                exports.prototype['event_type'] = undefined;
                /**
                 * The district this event is in, may be null.
                 * @member {module:TBAAPI.Client/model/DistrictList} district
                 */
                exports.prototype['district'] = undefined;
                /**
                 * City, town, village, etc. the event is located in.
                 * @member {String} city
                 */
                exports.prototype['city'] = undefined;
                /**
                 * State or Province the event is located in.
                 * @member {String} state_prov
                 */
                exports.prototype['state_prov'] = undefined;
                /**
                 * Country the event is located in.
                 * @member {String} country
                 */
                exports.prototype['country'] = undefined;
                /**
                 * Event start date in `yyyy-mm-dd` format.
                 * @member {Date} start_date
                 */
                exports.prototype['start_date'] = undefined;
                /**
                 * Event end date in `yyyy-mm-dd` format.
                 * @member {Date} end_date
                 */
                exports.prototype['end_date'] = undefined;
                /**
                 * Year the event data is for.
                 * @member {Number} year
                 */
                exports.prototype['year'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9,
            "./DistrictList": 21
        }],
        42: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/MatchSimpleAlliances', 'TBAAPI.Client/model/MatchVideos'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('./MatchSimpleAlliances'), require('./MatchVideos'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.Match = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.MatchSimpleAlliances, root.TbaApiV3client.MatchVideos);
                }
            }(this, function (ApiClient, MatchSimpleAlliances, MatchVideos) {
                'use strict';




                /**
                 * The Match model module.
                 * @module TBAAPI.Client/model/Match
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>Match</code>.
                 * @alias module:TBAAPI.Client/model/Match
                 * @class
                 * @param key {String} TBA event key with the format `yyyy[EVENT_CODE]_[COMP_LEVEL]m[MATCH_NUMBER]`, where `yyyy` is the year, and `EVENT_CODE` is the event code of the event, `COMP_LEVEL` is (qm, ef, qf, sf, f), and `MATCH_NUMBER` is the match number in the competition level. A set number may be appended to the competition level if more than one match in required per set.
                 * @param compLevel {module:TBAAPI.Client/model/Match.CompLevelEnum} The competition level the match was played at.
                 * @param setNumber {Number} The set number in a series of matches where more than one match is required in the match series.
                 * @param matchNumber {Number} The match number of the match in the competition level.
                 * @param eventKey {String} Event key of the event the match was played at.
                 */
                var exports = function (key, compLevel, setNumber, matchNumber, eventKey) {
                    var _this = this;

                    _this['key'] = key;
                    _this['comp_level'] = compLevel;
                    _this['set_number'] = setNumber;
                    _this['match_number'] = matchNumber;


                    _this['event_key'] = eventKey;






                };

                /**
                 * Constructs a <code>Match</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/Match} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/Match} The populated <code>Match</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('key')) {
                            obj['key'] = ApiClient.convertToType(data['key'], 'String');
                        }
                        if (data.hasOwnProperty('comp_level')) {
                            obj['comp_level'] = ApiClient.convertToType(data['comp_level'], 'String');
                        }
                        if (data.hasOwnProperty('set_number')) {
                            obj['set_number'] = ApiClient.convertToType(data['set_number'], 'Number');
                        }
                        if (data.hasOwnProperty('match_number')) {
                            obj['match_number'] = ApiClient.convertToType(data['match_number'], 'Number');
                        }
                        if (data.hasOwnProperty('alliances')) {
                            obj['alliances'] = MatchSimpleAlliances.constructFromObject(data['alliances']);
                        }
                        if (data.hasOwnProperty('winning_alliance')) {
                            obj['winning_alliance'] = ApiClient.convertToType(data['winning_alliance'], 'String');
                        }
                        if (data.hasOwnProperty('event_key')) {
                            obj['event_key'] = ApiClient.convertToType(data['event_key'], 'String');
                        }
                        if (data.hasOwnProperty('time')) {
                            obj['time'] = ApiClient.convertToType(data['time'], 'Number');
                        }
                        if (data.hasOwnProperty('actual_time')) {
                            obj['actual_time'] = ApiClient.convertToType(data['actual_time'], 'Number');
                        }
                        if (data.hasOwnProperty('predicted_time')) {
                            obj['predicted_time'] = ApiClient.convertToType(data['predicted_time'], 'Number');
                        }
                        if (data.hasOwnProperty('post_result_time')) {
                            obj['post_result_time'] = ApiClient.convertToType(data['post_result_time'], 'Number');
                        }
                        if (data.hasOwnProperty('score_breakdown')) {
                            obj['score_breakdown'] = ApiClient.convertToType(data['score_breakdown'], Object);
                        }
                        if (data.hasOwnProperty('videos')) {
                            obj['videos'] = ApiClient.convertToType(data['videos'], [MatchVideos]);
                        }
                    }
                    return obj;
                }

                /**
                 * TBA event key with the format `yyyy[EVENT_CODE]_[COMP_LEVEL]m[MATCH_NUMBER]`, where `yyyy` is the year, and `EVENT_CODE` is the event code of the event, `COMP_LEVEL` is (qm, ef, qf, sf, f), and `MATCH_NUMBER` is the match number in the competition level. A set number may be appended to the competition level if more than one match in required per set.
                 * @member {String} key
                 */
                exports.prototype['key'] = undefined;
                /**
                 * The competition level the match was played at.
                 * @member {module:TBAAPI.Client/model/Match.CompLevelEnum} comp_level
                 */
                exports.prototype['comp_level'] = undefined;
                /**
                 * The set number in a series of matches where more than one match is required in the match series.
                 * @member {Number} set_number
                 */
                exports.prototype['set_number'] = undefined;
                /**
                 * The match number of the match in the competition level.
                 * @member {Number} match_number
                 */
                exports.prototype['match_number'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/MatchSimpleAlliances} alliances
                 */
                exports.prototype['alliances'] = undefined;
                /**
                 * The color (red/blue) of the winning alliance. Will contain an empty string in the event of no winner, or a tie.
                 * @member {String} winning_alliance
                 */
                exports.prototype['winning_alliance'] = undefined;
                /**
                 * Event key of the event the match was played at.
                 * @member {String} event_key
                 */
                exports.prototype['event_key'] = undefined;
                /**
                 * UNIX timestamp (seconds since 1-Jan-1970 00:00:00) of the scheduled match time, as taken from the published schedule.
                 * @member {Number} time
                 */
                exports.prototype['time'] = undefined;
                /**
                 * UNIX timestamp (seconds since 1-Jan-1970 00:00:00) of actual match start time.
                 * @member {Number} actual_time
                 */
                exports.prototype['actual_time'] = undefined;
                /**
                 * UNIX timestamp (seconds since 1-Jan-1970 00:00:00) of the TBA predicted match start time.
                 * @member {Number} predicted_time
                 */
                exports.prototype['predicted_time'] = undefined;
                /**
                 * UNIX timestamp (seconds since 1-Jan-1970 00:00:00) when the match result was posted.
                 * @member {Number} post_result_time
                 */
                exports.prototype['post_result_time'] = undefined;
                /**
                 * Score breakdown for auto, teleop, etc. points. Varies from year to year. May be null.
                 * @member {Object} score_breakdown
                 */
                exports.prototype['score_breakdown'] = undefined;
                /**
                 * Array of video objects associated with this match.
                 * @member {Array.<module:TBAAPI.Client/model/MatchVideos>} videos
                 */
                exports.prototype['videos'] = undefined;


                /**
                 * Allowed values for the <code>comp_level</code> property.
                 * @enum {String}
                 * @readonly
                 */
                exports.CompLevelEnum = {
                    /**
                     * value: "qm"
                     * @const
                     */
                    "qm": "qm",
                    /**
                     * value: "ef"
                     * @const
                     */
                    "ef": "ef",
                    /**
                     * value: "qf"
                     * @const
                     */
                    "qf": "qf",
                    /**
                     * value: "sf"
                     * @const
                     */
                    "sf": "sf",
                    /**
                     * value: "f"
                     * @const
                     */
                    "f": "f"
                };


                return exports;
            }));



}, {
            "../ApiClient": 9,
            "./MatchSimpleAlliances": 51,
            "./MatchVideos": 52
        }],
        43: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.MatchAlliance = factory(root.TbaApiV3client.ApiClient);
                }
            }(this, function (ApiClient) {
                'use strict';




                /**
                 * The MatchAlliance model module.
                 * @module TBAAPI.Client/model/MatchAlliance
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>MatchAlliance</code>.
                 * @alias module:TBAAPI.Client/model/MatchAlliance
                 * @class
                 * @param score {Number} Score for this alliance. Will be null or -1 for an unplayed match.
                 * @param teamKeys {Array.<String>} 
                 */
                var exports = function (score, teamKeys) {
                    var _this = this;

                    _this['score'] = score;
                    _this['team_keys'] = teamKeys;


                };

                /**
                 * Constructs a <code>MatchAlliance</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/MatchAlliance} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/MatchAlliance} The populated <code>MatchAlliance</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('score')) {
                            obj['score'] = ApiClient.convertToType(data['score'], 'Number');
                        }
                        if (data.hasOwnProperty('team_keys')) {
                            obj['team_keys'] = ApiClient.convertToType(data['team_keys'], ['String']);
                        }
                        if (data.hasOwnProperty('surrogate_team_keys')) {
                            obj['surrogate_team_keys'] = ApiClient.convertToType(data['surrogate_team_keys'], ['String']);
                        }
                        if (data.hasOwnProperty('dq_team_keys')) {
                            obj['dq_team_keys'] = ApiClient.convertToType(data['dq_team_keys'], ['String']);
                        }
                    }
                    return obj;
                }

                /**
                 * Score for this alliance. Will be null or -1 for an unplayed match.
                 * @member {Number} score
                 */
                exports.prototype['score'] = undefined;
                /**
                 * @member {Array.<String>} team_keys
                 */
                exports.prototype['team_keys'] = undefined;
                /**
                 * TBA team keys (eg `frc254`) of any teams playing as a surrogate.
                 * @member {Array.<String>} surrogate_team_keys
                 */
                exports.prototype['surrogate_team_keys'] = undefined;
                /**
                 * TBA team keys (eg `frc254`) of any disqualified teams.
                 * @member {Array.<String>} dq_team_keys
                 */
                exports.prototype['dq_team_keys'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9
        }],
        44: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/MatchScoreBreakdown2015Alliance'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('./MatchScoreBreakdown2015Alliance'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.MatchScoreBreakdown2015 = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.MatchScoreBreakdown2015Alliance);
                }
            }(this, function (ApiClient, MatchScoreBreakdown2015Alliance) {
                'use strict';




                /**
                 * The MatchScoreBreakdown2015 model module.
                 * @module TBAAPI.Client/model/MatchScoreBreakdown2015
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>MatchScoreBreakdown2015</code>.
                 * See the 2015 FMS API documentation for a description of each value
                 * @alias module:TBAAPI.Client/model/MatchScoreBreakdown2015
                 * @class
                 */
                var exports = function () {
                    var _this = this;





                };

                /**
                 * Constructs a <code>MatchScoreBreakdown2015</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/MatchScoreBreakdown2015} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/MatchScoreBreakdown2015} The populated <code>MatchScoreBreakdown2015</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('blue')) {
                            obj['blue'] = MatchScoreBreakdown2015Alliance.constructFromObject(data['blue']);
                        }
                        if (data.hasOwnProperty('red')) {
                            obj['red'] = MatchScoreBreakdown2015Alliance.constructFromObject(data['red']);
                        }
                        if (data.hasOwnProperty('coopertition')) {
                            obj['coopertition'] = ApiClient.convertToType(data['coopertition'], 'String');
                        }
                        if (data.hasOwnProperty('coopertition_points')) {
                            obj['coopertition_points'] = ApiClient.convertToType(data['coopertition_points'], 'Number');
                        }
                    }
                    return obj;
                }

                /**
                 * @member {module:TBAAPI.Client/model/MatchScoreBreakdown2015Alliance} blue
                 */
                exports.prototype['blue'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/MatchScoreBreakdown2015Alliance} red
                 */
                exports.prototype['red'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/MatchScoreBreakdown2015.CoopertitionEnum} coopertition
                 */
                exports.prototype['coopertition'] = undefined;
                /**
                 * @member {Number} coopertition_points
                 */
                exports.prototype['coopertition_points'] = undefined;


                /**
                 * Allowed values for the <code>coopertition</code> property.
                 * @enum {String}
                 * @readonly
                 */
                exports.CoopertitionEnum = {
                    /**
                     * value: "None"
                     * @const
                     */
                    "None": "None",
                    /**
                     * value: "Unknown"
                     * @const
                     */
                    "Unknown": "Unknown",
                    /**
                     * value: "Stack"
                     * @const
                     */
                    "Stack": "Stack"
                };


                return exports;
            }));



}, {
            "../ApiClient": 9,
            "./MatchScoreBreakdown2015Alliance": 45
        }],
        45: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.MatchScoreBreakdown2015Alliance = factory(root.TbaApiV3client.ApiClient);
                }
            }(this, function (ApiClient) {
                'use strict';




                /**
                 * The MatchScoreBreakdown2015Alliance model module.
                 * @module TBAAPI.Client/model/MatchScoreBreakdown2015Alliance
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>MatchScoreBreakdown2015Alliance</code>.
                 * @alias module:TBAAPI.Client/model/MatchScoreBreakdown2015Alliance
                 * @class
                 */
                var exports = function () {
                    var _this = this;









                };

                /**
                 * Constructs a <code>MatchScoreBreakdown2015Alliance</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/MatchScoreBreakdown2015Alliance} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/MatchScoreBreakdown2015Alliance} The populated <code>MatchScoreBreakdown2015Alliance</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('auto_points')) {
                            obj['auto_points'] = ApiClient.convertToType(data['auto_points'], 'Number');
                        }
                        if (data.hasOwnProperty('teleop_points')) {
                            obj['teleop_points'] = ApiClient.convertToType(data['teleop_points'], 'Number');
                        }
                        if (data.hasOwnProperty('container_points')) {
                            obj['container_points'] = ApiClient.convertToType(data['container_points'], 'Number');
                        }
                        if (data.hasOwnProperty('tote_points')) {
                            obj['tote_points'] = ApiClient.convertToType(data['tote_points'], 'Number');
                        }
                        if (data.hasOwnProperty('litter_points')) {
                            obj['litter_points'] = ApiClient.convertToType(data['litter_points'], 'Number');
                        }
                        if (data.hasOwnProperty('foul_points')) {
                            obj['foul_points'] = ApiClient.convertToType(data['foul_points'], 'Number');
                        }
                        if (data.hasOwnProperty('adjust_points')) {
                            obj['adjust_points'] = ApiClient.convertToType(data['adjust_points'], 'Number');
                        }
                        if (data.hasOwnProperty('total_points')) {
                            obj['total_points'] = ApiClient.convertToType(data['total_points'], 'Number');
                        }
                        if (data.hasOwnProperty('foul_count')) {
                            obj['foul_count'] = ApiClient.convertToType(data['foul_count'], 'Number');
                        }
                        if (data.hasOwnProperty('tote_count_far')) {
                            obj['tote_count_far'] = ApiClient.convertToType(data['tote_count_far'], 'Number');
                        }
                        if (data.hasOwnProperty('tote_count_near')) {
                            obj['tote_count_near'] = ApiClient.convertToType(data['tote_count_near'], 'Number');
                        }
                        if (data.hasOwnProperty('tote_set')) {
                            obj['tote_set'] = ApiClient.convertToType(data['tote_set'], 'Boolean');
                        }
                        if (data.hasOwnProperty('tote_stack')) {
                            obj['tote_stack'] = ApiClient.convertToType(data['tote_stack'], 'Boolean');
                        }
                        if (data.hasOwnProperty('container_count_level1')) {
                            obj['container_count_level1'] = ApiClient.convertToType(data['container_count_level1'], 'Number');
                        }
                        if (data.hasOwnProperty('container_count_level2')) {
                            obj['container_count_level2'] = ApiClient.convertToType(data['container_count_level2'], 'Number');
                        }
                        if (data.hasOwnProperty('container_count_level3')) {
                            obj['container_count_level3'] = ApiClient.convertToType(data['container_count_level3'], 'Number');
                        }
                        if (data.hasOwnProperty('container_count_level4')) {
                            obj['container_count_level4'] = ApiClient.convertToType(data['container_count_level4'], 'Number');
                        }
                        if (data.hasOwnProperty('container_count_level5')) {
                            obj['container_count_level5'] = ApiClient.convertToType(data['container_count_level5'], 'Number');
                        }
                        if (data.hasOwnProperty('container_count_level6')) {
                            obj['container_count_level6'] = ApiClient.convertToType(data['container_count_level6'], 'Number');
                        }
                        if (data.hasOwnProperty('container_set')) {
                            obj['container_set'] = ApiClient.convertToType(data['container_set'], 'Boolean');
                        }
                        if (data.hasOwnProperty('litter_count_container')) {
                            obj['litter_count_container'] = ApiClient.convertToType(data['litter_count_container'], 'Number');
                        }
                        if (data.hasOwnProperty('litter_count_landfill')) {
                            obj['litter_count_landfill'] = ApiClient.convertToType(data['litter_count_landfill'], 'Number');
                        }
                        if (data.hasOwnProperty('litter_count_unprocessed')) {
                            obj['litter_count_unprocessed'] = ApiClient.convertToType(data['litter_count_unprocessed'], 'Number');
                        }
                        if (data.hasOwnProperty('robot_set')) {
                            obj['robot_set'] = ApiClient.convertToType(data['robot_set'], 'Boolean');
                        }
                    }
                    return obj;
                }

                /**
                 * @member {Number} auto_points
                 */
                exports.prototype['auto_points'] = undefined;
                /**
                 * @member {Number} teleop_points
                 */
                exports.prototype['teleop_points'] = undefined;
                /**
                 * @member {Number} container_points
                 */
                exports.prototype['container_points'] = undefined;
                /**
                 * @member {Number} tote_points
                 */
                exports.prototype['tote_points'] = undefined;
                /**
                 * @member {Number} litter_points
                 */
                exports.prototype['litter_points'] = undefined;
                /**
                 * @member {Number} foul_points
                 */
                exports.prototype['foul_points'] = undefined;
                /**
                 * @member {Number} adjust_points
                 */
                exports.prototype['adjust_points'] = undefined;
                /**
                 * @member {Number} total_points
                 */
                exports.prototype['total_points'] = undefined;
                /**
                 * @member {Number} foul_count
                 */
                exports.prototype['foul_count'] = undefined;
                /**
                 * @member {Number} tote_count_far
                 */
                exports.prototype['tote_count_far'] = undefined;
                /**
                 * @member {Number} tote_count_near
                 */
                exports.prototype['tote_count_near'] = undefined;
                /**
                 * @member {Boolean} tote_set
                 */
                exports.prototype['tote_set'] = undefined;
                /**
                 * @member {Boolean} tote_stack
                 */
                exports.prototype['tote_stack'] = undefined;
                /**
                 * @member {Number} container_count_level1
                 */
                exports.prototype['container_count_level1'] = undefined;
                /**
                 * @member {Number} container_count_level2
                 */
                exports.prototype['container_count_level2'] = undefined;
                /**
                 * @member {Number} container_count_level3
                 */
                exports.prototype['container_count_level3'] = undefined;
                /**
                 * @member {Number} container_count_level4
                 */
                exports.prototype['container_count_level4'] = undefined;
                /**
                 * @member {Number} container_count_level5
                 */
                exports.prototype['container_count_level5'] = undefined;
                /**
                 * @member {Number} container_count_level6
                 */
                exports.prototype['container_count_level6'] = undefined;
                /**
                 * @member {Boolean} container_set
                 */
                exports.prototype['container_set'] = undefined;
                /**
                 * @member {Number} litter_count_container
                 */
                exports.prototype['litter_count_container'] = undefined;
                /**
                 * @member {Number} litter_count_landfill
                 */
                exports.prototype['litter_count_landfill'] = undefined;
                /**
                 * @member {Number} litter_count_unprocessed
                 */
                exports.prototype['litter_count_unprocessed'] = undefined;
                /**
                 * @member {Boolean} robot_set
                 */
                exports.prototype['robot_set'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9
        }],
        46: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/MatchScoreBreakdown2016Alliance'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('./MatchScoreBreakdown2016Alliance'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.MatchScoreBreakdown2016 = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.MatchScoreBreakdown2016Alliance);
                }
            }(this, function (ApiClient, MatchScoreBreakdown2016Alliance) {
                'use strict';




                /**
                 * The MatchScoreBreakdown2016 model module.
                 * @module TBAAPI.Client/model/MatchScoreBreakdown2016
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>MatchScoreBreakdown2016</code>.
                 * See the 2016 FMS API documentation for a description of each value.
                 * @alias module:TBAAPI.Client/model/MatchScoreBreakdown2016
                 * @class
                 */
                var exports = function () {
                    var _this = this;



                };

                /**
                 * Constructs a <code>MatchScoreBreakdown2016</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/MatchScoreBreakdown2016} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/MatchScoreBreakdown2016} The populated <code>MatchScoreBreakdown2016</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('blue')) {
                            obj['blue'] = MatchScoreBreakdown2016Alliance.constructFromObject(data['blue']);
                        }
                        if (data.hasOwnProperty('red')) {
                            obj['red'] = MatchScoreBreakdown2016Alliance.constructFromObject(data['red']);
                        }
                    }
                    return obj;
                }

                /**
                 * @member {module:TBAAPI.Client/model/MatchScoreBreakdown2016Alliance} blue
                 */
                exports.prototype['blue'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/MatchScoreBreakdown2016Alliance} red
                 */
                exports.prototype['red'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9,
            "./MatchScoreBreakdown2016Alliance": 47
        }],
        47: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.MatchScoreBreakdown2016Alliance = factory(root.TbaApiV3client.ApiClient);
                }
            }(this, function (ApiClient) {
                'use strict';




                /**
                 * The MatchScoreBreakdown2016Alliance model module.
                 * @module TBAAPI.Client/model/MatchScoreBreakdown2016Alliance
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>MatchScoreBreakdown2016Alliance</code>.
                 * @alias module:TBAAPI.Client/model/MatchScoreBreakdown2016Alliance
                 * @class
                 */
                var exports = function () {
                    var _this = this;









                };

                /**
                 * Constructs a <code>MatchScoreBreakdown2016Alliance</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/MatchScoreBreakdown2016Alliance} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/MatchScoreBreakdown2016Alliance} The populated <code>MatchScoreBreakdown2016Alliance</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('autoPoints')) {
                            obj['autoPoints'] = ApiClient.convertToType(data['autoPoints'], 'Number');
                        }
                        if (data.hasOwnProperty('teleopPoints')) {
                            obj['teleopPoints'] = ApiClient.convertToType(data['teleopPoints'], 'Number');
                        }
                        if (data.hasOwnProperty('breechPoints')) {
                            obj['breechPoints'] = ApiClient.convertToType(data['breechPoints'], 'Number');
                        }
                        if (data.hasOwnProperty('foulPoints')) {
                            obj['foulPoints'] = ApiClient.convertToType(data['foulPoints'], 'Number');
                        }
                        if (data.hasOwnProperty('capturePoints')) {
                            obj['capturePoints'] = ApiClient.convertToType(data['capturePoints'], 'Number');
                        }
                        if (data.hasOwnProperty('adjustPoints')) {
                            obj['adjustPoints'] = ApiClient.convertToType(data['adjustPoints'], 'Number');
                        }
                        if (data.hasOwnProperty('totalPoints')) {
                            obj['totalPoints'] = ApiClient.convertToType(data['totalPoints'], 'Number');
                        }
                        if (data.hasOwnProperty('robot1Auto')) {
                            obj['robot1Auto'] = ApiClient.convertToType(data['robot1Auto'], 'String');
                        }
                        if (data.hasOwnProperty('robot2Auto')) {
                            obj['robot2Auto'] = ApiClient.convertToType(data['robot2Auto'], 'String');
                        }
                        if (data.hasOwnProperty('robot3Auto')) {
                            obj['robot3Auto'] = ApiClient.convertToType(data['robot3Auto'], 'String');
                        }
                        if (data.hasOwnProperty('autoReachPoints')) {
                            obj['autoReachPoints'] = ApiClient.convertToType(data['autoReachPoints'], 'Number');
                        }
                        if (data.hasOwnProperty('autoCrossingPoints')) {
                            obj['autoCrossingPoints'] = ApiClient.convertToType(data['autoCrossingPoints'], 'Number');
                        }
                        if (data.hasOwnProperty('autoBouldersLow')) {
                            obj['autoBouldersLow'] = ApiClient.convertToType(data['autoBouldersLow'], 'Number');
                        }
                        if (data.hasOwnProperty('autoBouldersHigh')) {
                            obj['autoBouldersHigh'] = ApiClient.convertToType(data['autoBouldersHigh'], 'Number');
                        }
                        if (data.hasOwnProperty('autoBoulderPoints')) {
                            obj['autoBoulderPoints'] = ApiClient.convertToType(data['autoBoulderPoints'], 'Number');
                        }
                        if (data.hasOwnProperty('teleopCrossingPoints')) {
                            obj['teleopCrossingPoints'] = ApiClient.convertToType(data['teleopCrossingPoints'], 'Number');
                        }
                        if (data.hasOwnProperty('teleopBouldersLow')) {
                            obj['teleopBouldersLow'] = ApiClient.convertToType(data['teleopBouldersLow'], 'Number');
                        }
                        if (data.hasOwnProperty('teleopBouldersHigh')) {
                            obj['teleopBouldersHigh'] = ApiClient.convertToType(data['teleopBouldersHigh'], 'Number');
                        }
                        if (data.hasOwnProperty('teleopBoulderPoints')) {
                            obj['teleopBoulderPoints'] = ApiClient.convertToType(data['teleopBoulderPoints'], 'Number');
                        }
                        if (data.hasOwnProperty('teleopDefensesBreached')) {
                            obj['teleopDefensesBreached'] = ApiClient.convertToType(data['teleopDefensesBreached'], 'Boolean');
                        }
                        if (data.hasOwnProperty('teleopChallengePoints')) {
                            obj['teleopChallengePoints'] = ApiClient.convertToType(data['teleopChallengePoints'], 'Number');
                        }
                        if (data.hasOwnProperty('teleopScalePoints')) {
                            obj['teleopScalePoints'] = ApiClient.convertToType(data['teleopScalePoints'], 'Number');
                        }
                        if (data.hasOwnProperty('teleopTowerCaptured')) {
                            obj['teleopTowerCaptured'] = ApiClient.convertToType(data['teleopTowerCaptured'], 'Number');
                        }
                        if (data.hasOwnProperty('towerFaceA')) {
                            obj['towerFaceA'] = ApiClient.convertToType(data['towerFaceA'], 'String');
                        }
                        if (data.hasOwnProperty('towerFaceB')) {
                            obj['towerFaceB'] = ApiClient.convertToType(data['towerFaceB'], 'String');
                        }
                        if (data.hasOwnProperty('towerFaceC')) {
                            obj['towerFaceC'] = ApiClient.convertToType(data['towerFaceC'], 'String');
                        }
                        if (data.hasOwnProperty('towerEndStrength')) {
                            obj['towerEndStrength'] = ApiClient.convertToType(data['towerEndStrength'], 'Number');
                        }
                        if (data.hasOwnProperty('techFoulCount')) {
                            obj['techFoulCount'] = ApiClient.convertToType(data['techFoulCount'], 'Number');
                        }
                        if (data.hasOwnProperty('foulCount')) {
                            obj['foulCount'] = ApiClient.convertToType(data['foulCount'], 'Number');
                        }
                        if (data.hasOwnProperty('position2')) {
                            obj['position2'] = ApiClient.convertToType(data['position2'], 'String');
                        }
                        if (data.hasOwnProperty('position3')) {
                            obj['position3'] = ApiClient.convertToType(data['position3'], 'String');
                        }
                        if (data.hasOwnProperty('position4')) {
                            obj['position4'] = ApiClient.convertToType(data['position4'], 'String');
                        }
                        if (data.hasOwnProperty('position5')) {
                            obj['position5'] = ApiClient.convertToType(data['position5'], 'String');
                        }
                        if (data.hasOwnProperty('position1crossings')) {
                            obj['position1crossings'] = ApiClient.convertToType(data['position1crossings'], 'Number');
                        }
                        if (data.hasOwnProperty('position2crossings')) {
                            obj['position2crossings'] = ApiClient.convertToType(data['position2crossings'], 'Number');
                        }
                        if (data.hasOwnProperty('position3crossings')) {
                            obj['position3crossings'] = ApiClient.convertToType(data['position3crossings'], 'Number');
                        }
                        if (data.hasOwnProperty('position4crossings')) {
                            obj['position4crossings'] = ApiClient.convertToType(data['position4crossings'], 'Number');
                        }
                        if (data.hasOwnProperty('position5crossings')) {
                            obj['position5crossings'] = ApiClient.convertToType(data['position5crossings'], 'Number');
                        }
                    }
                    return obj;
                }

                /**
                 * @member {Number} autoPoints
                 */
                exports.prototype['autoPoints'] = undefined;
                /**
                 * @member {Number} teleopPoints
                 */
                exports.prototype['teleopPoints'] = undefined;
                /**
                 * @member {Number} breechPoints
                 */
                exports.prototype['breechPoints'] = undefined;
                /**
                 * @member {Number} foulPoints
                 */
                exports.prototype['foulPoints'] = undefined;
                /**
                 * @member {Number} capturePoints
                 */
                exports.prototype['capturePoints'] = undefined;
                /**
                 * @member {Number} adjustPoints
                 */
                exports.prototype['adjustPoints'] = undefined;
                /**
                 * @member {Number} totalPoints
                 */
                exports.prototype['totalPoints'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/MatchScoreBreakdown2016Alliance.Robot1AutoEnum} robot1Auto
                 */
                exports.prototype['robot1Auto'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/MatchScoreBreakdown2016Alliance.Robot2AutoEnum} robot2Auto
                 */
                exports.prototype['robot2Auto'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/MatchScoreBreakdown2016Alliance.Robot3AutoEnum} robot3Auto
                 */
                exports.prototype['robot3Auto'] = undefined;
                /**
                 * @member {Number} autoReachPoints
                 */
                exports.prototype['autoReachPoints'] = undefined;
                /**
                 * @member {Number} autoCrossingPoints
                 */
                exports.prototype['autoCrossingPoints'] = undefined;
                /**
                 * @member {Number} autoBouldersLow
                 */
                exports.prototype['autoBouldersLow'] = undefined;
                /**
                 * @member {Number} autoBouldersHigh
                 */
                exports.prototype['autoBouldersHigh'] = undefined;
                /**
                 * @member {Number} autoBoulderPoints
                 */
                exports.prototype['autoBoulderPoints'] = undefined;
                /**
                 * @member {Number} teleopCrossingPoints
                 */
                exports.prototype['teleopCrossingPoints'] = undefined;
                /**
                 * @member {Number} teleopBouldersLow
                 */
                exports.prototype['teleopBouldersLow'] = undefined;
                /**
                 * @member {Number} teleopBouldersHigh
                 */
                exports.prototype['teleopBouldersHigh'] = undefined;
                /**
                 * @member {Number} teleopBoulderPoints
                 */
                exports.prototype['teleopBoulderPoints'] = undefined;
                /**
                 * @member {Boolean} teleopDefensesBreached
                 */
                exports.prototype['teleopDefensesBreached'] = undefined;
                /**
                 * @member {Number} teleopChallengePoints
                 */
                exports.prototype['teleopChallengePoints'] = undefined;
                /**
                 * @member {Number} teleopScalePoints
                 */
                exports.prototype['teleopScalePoints'] = undefined;
                /**
                 * @member {Number} teleopTowerCaptured
                 */
                exports.prototype['teleopTowerCaptured'] = undefined;
                /**
                 * @member {String} towerFaceA
                 */
                exports.prototype['towerFaceA'] = undefined;
                /**
                 * @member {String} towerFaceB
                 */
                exports.prototype['towerFaceB'] = undefined;
                /**
                 * @member {String} towerFaceC
                 */
                exports.prototype['towerFaceC'] = undefined;
                /**
                 * @member {Number} towerEndStrength
                 */
                exports.prototype['towerEndStrength'] = undefined;
                /**
                 * @member {Number} techFoulCount
                 */
                exports.prototype['techFoulCount'] = undefined;
                /**
                 * @member {Number} foulCount
                 */
                exports.prototype['foulCount'] = undefined;
                /**
                 * @member {String} position2
                 */
                exports.prototype['position2'] = undefined;
                /**
                 * @member {String} position3
                 */
                exports.prototype['position3'] = undefined;
                /**
                 * @member {String} position4
                 */
                exports.prototype['position4'] = undefined;
                /**
                 * @member {String} position5
                 */
                exports.prototype['position5'] = undefined;
                /**
                 * @member {Number} position1crossings
                 */
                exports.prototype['position1crossings'] = undefined;
                /**
                 * @member {Number} position2crossings
                 */
                exports.prototype['position2crossings'] = undefined;
                /**
                 * @member {Number} position3crossings
                 */
                exports.prototype['position3crossings'] = undefined;
                /**
                 * @member {Number} position4crossings
                 */
                exports.prototype['position4crossings'] = undefined;
                /**
                 * @member {Number} position5crossings
                 */
                exports.prototype['position5crossings'] = undefined;


                /**
                 * Allowed values for the <code>robot1Auto</code> property.
                 * @enum {String}
                 * @readonly
                 */
                exports.Robot1AutoEnum = {
                    /**
                     * value: "Crossed"
                     * @const
                     */
                    "Crossed": "Crossed",
                    /**
                     * value: "Reached"
                     * @const
                     */
                    "Reached": "Reached",
                    /**
                     * value: "None"
                     * @const
                     */
                    "None": "None"
                };

                /**
                 * Allowed values for the <code>robot2Auto</code> property.
                 * @enum {String}
                 * @readonly
                 */
                exports.Robot2AutoEnum = {
                    /**
                     * value: "Crossed"
                     * @const
                     */
                    "Crossed": "Crossed",
                    /**
                     * value: "Reached"
                     * @const
                     */
                    "Reached": "Reached",
                    /**
                     * value: "None"
                     * @const
                     */
                    "None": "None"
                };

                /**
                 * Allowed values for the <code>robot3Auto</code> property.
                 * @enum {String}
                 * @readonly
                 */
                exports.Robot3AutoEnum = {
                    /**
                     * value: "Crossed"
                     * @const
                     */
                    "Crossed": "Crossed",
                    /**
                     * value: "Reached"
                     * @const
                     */
                    "Reached": "Reached",
                    /**
                     * value: "None"
                     * @const
                     */
                    "None": "None"
                };


                return exports;
            }));



}, {
            "../ApiClient": 9
        }],
        48: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/MatchScoreBreakdown2017Alliance'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('./MatchScoreBreakdown2017Alliance'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.MatchScoreBreakdown2017 = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.MatchScoreBreakdown2017Alliance);
                }
            }(this, function (ApiClient, MatchScoreBreakdown2017Alliance) {
                'use strict';




                /**
                 * The MatchScoreBreakdown2017 model module.
                 * @module TBAAPI.Client/model/MatchScoreBreakdown2017
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>MatchScoreBreakdown2017</code>.
                 * See the 2017 FMS API documentation for a description of each value.
                 * @alias module:TBAAPI.Client/model/MatchScoreBreakdown2017
                 * @class
                 */
                var exports = function () {
                    var _this = this;



                };

                /**
                 * Constructs a <code>MatchScoreBreakdown2017</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/MatchScoreBreakdown2017} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/MatchScoreBreakdown2017} The populated <code>MatchScoreBreakdown2017</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('blue')) {
                            obj['blue'] = MatchScoreBreakdown2017Alliance.constructFromObject(data['blue']);
                        }
                        if (data.hasOwnProperty('red')) {
                            obj['red'] = MatchScoreBreakdown2017Alliance.constructFromObject(data['red']);
                        }
                    }
                    return obj;
                }

                /**
                 * @member {module:TBAAPI.Client/model/MatchScoreBreakdown2017Alliance} blue
                 */
                exports.prototype['blue'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/MatchScoreBreakdown2017Alliance} red
                 */
                exports.prototype['red'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9,
            "./MatchScoreBreakdown2017Alliance": 49
        }],
        49: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.MatchScoreBreakdown2017Alliance = factory(root.TbaApiV3client.ApiClient);
                }
            }(this, function (ApiClient) {
                'use strict';




                /**
                 * The MatchScoreBreakdown2017Alliance model module.
                 * @module TBAAPI.Client/model/MatchScoreBreakdown2017Alliance
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>MatchScoreBreakdown2017Alliance</code>.
                 * @alias module:TBAAPI.Client/model/MatchScoreBreakdown2017Alliance
                 * @class
                 */
                var exports = function () {
                    var _this = this;









                };

                /**
                 * Constructs a <code>MatchScoreBreakdown2017Alliance</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/MatchScoreBreakdown2017Alliance} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/MatchScoreBreakdown2017Alliance} The populated <code>MatchScoreBreakdown2017Alliance</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('autoPoints')) {
                            obj['autoPoints'] = ApiClient.convertToType(data['autoPoints'], 'Number');
                        }
                        if (data.hasOwnProperty('teleopPoints')) {
                            obj['teleopPoints'] = ApiClient.convertToType(data['teleopPoints'], 'Number');
                        }
                        if (data.hasOwnProperty('breechPoints')) {
                            obj['breechPoints'] = ApiClient.convertToType(data['breechPoints'], 'Number');
                        }
                        if (data.hasOwnProperty('foulPoints')) {
                            obj['foulPoints'] = ApiClient.convertToType(data['foulPoints'], 'Number');
                        }
                        if (data.hasOwnProperty('capturePoints')) {
                            obj['capturePoints'] = ApiClient.convertToType(data['capturePoints'], 'Number');
                        }
                        if (data.hasOwnProperty('adjustPoints')) {
                            obj['adjustPoints'] = ApiClient.convertToType(data['adjustPoints'], 'Number');
                        }
                        if (data.hasOwnProperty('totalPoints')) {
                            obj['totalPoints'] = ApiClient.convertToType(data['totalPoints'], 'Number');
                        }
                        if (data.hasOwnProperty('robot1Auto')) {
                            obj['robot1Auto'] = ApiClient.convertToType(data['robot1Auto'], 'String');
                        }
                        if (data.hasOwnProperty('robot2Auto')) {
                            obj['robot2Auto'] = ApiClient.convertToType(data['robot2Auto'], 'String');
                        }
                        if (data.hasOwnProperty('robot3Auto')) {
                            obj['robot3Auto'] = ApiClient.convertToType(data['robot3Auto'], 'String');
                        }
                        if (data.hasOwnProperty('rotor1Auto')) {
                            obj['rotor1Auto'] = ApiClient.convertToType(data['rotor1Auto'], 'Boolean');
                        }
                        if (data.hasOwnProperty('rotor2Auto')) {
                            obj['rotor2Auto'] = ApiClient.convertToType(data['rotor2Auto'], 'Boolean');
                        }
                        if (data.hasOwnProperty('autoFuelLow')) {
                            obj['autoFuelLow'] = ApiClient.convertToType(data['autoFuelLow'], 'Number');
                        }
                        if (data.hasOwnProperty('autoFuelHigh')) {
                            obj['autoFuelHigh'] = ApiClient.convertToType(data['autoFuelHigh'], 'Number');
                        }
                        if (data.hasOwnProperty('autoMobilityPoints')) {
                            obj['autoMobilityPoints'] = ApiClient.convertToType(data['autoMobilityPoints'], 'Number');
                        }
                        if (data.hasOwnProperty('autoRotorPoints')) {
                            obj['autoRotorPoints'] = ApiClient.convertToType(data['autoRotorPoints'], 'Number');
                        }
                        if (data.hasOwnProperty('autoFuelPoints')) {
                            obj['autoFuelPoints'] = ApiClient.convertToType(data['autoFuelPoints'], 'Number');
                        }
                        if (data.hasOwnProperty('teleopFuelPoints')) {
                            obj['teleopFuelPoints'] = ApiClient.convertToType(data['teleopFuelPoints'], 'Number');
                        }
                        if (data.hasOwnProperty('teleopFuelLow')) {
                            obj['teleopFuelLow'] = ApiClient.convertToType(data['teleopFuelLow'], 'Number');
                        }
                        if (data.hasOwnProperty('teleopFuelHigh')) {
                            obj['teleopFuelHigh'] = ApiClient.convertToType(data['teleopFuelHigh'], 'Number');
                        }
                        if (data.hasOwnProperty('teleopRotorPoints')) {
                            obj['teleopRotorPoints'] = ApiClient.convertToType(data['teleopRotorPoints'], 'Number');
                        }
                        if (data.hasOwnProperty('kPaRankingPointAchieved')) {
                            obj['kPaRankingPointAchieved'] = ApiClient.convertToType(data['kPaRankingPointAchieved'], 'Boolean');
                        }
                        if (data.hasOwnProperty('teleopTakeoffPoints')) {
                            obj['teleopTakeoffPoints'] = ApiClient.convertToType(data['teleopTakeoffPoints'], 'Number');
                        }
                        if (data.hasOwnProperty('kPaBonusPoints')) {
                            obj['kPaBonusPoints'] = ApiClient.convertToType(data['kPaBonusPoints'], 'Number');
                        }
                        if (data.hasOwnProperty('rotorBonusPoints')) {
                            obj['rotorBonusPoints'] = ApiClient.convertToType(data['rotorBonusPoints'], 'Number');
                        }
                        if (data.hasOwnProperty('rotor1Engaged')) {
                            obj['rotor1Engaged'] = ApiClient.convertToType(data['rotor1Engaged'], 'Boolean');
                        }
                        if (data.hasOwnProperty('rotor2Engaged')) {
                            obj['rotor2Engaged'] = ApiClient.convertToType(data['rotor2Engaged'], 'Boolean');
                        }
                        if (data.hasOwnProperty('rotor3Engaged')) {
                            obj['rotor3Engaged'] = ApiClient.convertToType(data['rotor3Engaged'], 'Boolean');
                        }
                        if (data.hasOwnProperty('rotor4Engaged')) {
                            obj['rotor4Engaged'] = ApiClient.convertToType(data['rotor4Engaged'], 'Boolean');
                        }
                        if (data.hasOwnProperty('rotorRankingPointAchieved')) {
                            obj['rotorRankingPointAchieved'] = ApiClient.convertToType(data['rotorRankingPointAchieved'], 'Boolean');
                        }
                        if (data.hasOwnProperty('techFoulCount')) {
                            obj['techFoulCount'] = ApiClient.convertToType(data['techFoulCount'], 'Number');
                        }
                        if (data.hasOwnProperty('foulCount')) {
                            obj['foulCount'] = ApiClient.convertToType(data['foulCount'], 'Number');
                        }
                        if (data.hasOwnProperty('touchpadNear')) {
                            obj['touchpadNear'] = ApiClient.convertToType(data['touchpadNear'], 'String');
                        }
                        if (data.hasOwnProperty('touchpadMiddle')) {
                            obj['touchpadMiddle'] = ApiClient.convertToType(data['touchpadMiddle'], 'String');
                        }
                        if (data.hasOwnProperty('touchpadFar')) {
                            obj['touchpadFar'] = ApiClient.convertToType(data['touchpadFar'], 'String');
                        }
                    }
                    return obj;
                }

                /**
                 * @member {Number} autoPoints
                 */
                exports.prototype['autoPoints'] = undefined;
                /**
                 * @member {Number} teleopPoints
                 */
                exports.prototype['teleopPoints'] = undefined;
                /**
                 * @member {Number} breechPoints
                 */
                exports.prototype['breechPoints'] = undefined;
                /**
                 * @member {Number} foulPoints
                 */
                exports.prototype['foulPoints'] = undefined;
                /**
                 * @member {Number} capturePoints
                 */
                exports.prototype['capturePoints'] = undefined;
                /**
                 * @member {Number} adjustPoints
                 */
                exports.prototype['adjustPoints'] = undefined;
                /**
                 * @member {Number} totalPoints
                 */
                exports.prototype['totalPoints'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/MatchScoreBreakdown2017Alliance.Robot1AutoEnum} robot1Auto
                 */
                exports.prototype['robot1Auto'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/MatchScoreBreakdown2017Alliance.Robot2AutoEnum} robot2Auto
                 */
                exports.prototype['robot2Auto'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/MatchScoreBreakdown2017Alliance.Robot3AutoEnum} robot3Auto
                 */
                exports.prototype['robot3Auto'] = undefined;
                /**
                 * @member {Boolean} rotor1Auto
                 */
                exports.prototype['rotor1Auto'] = undefined;
                /**
                 * @member {Boolean} rotor2Auto
                 */
                exports.prototype['rotor2Auto'] = undefined;
                /**
                 * @member {Number} autoFuelLow
                 */
                exports.prototype['autoFuelLow'] = undefined;
                /**
                 * @member {Number} autoFuelHigh
                 */
                exports.prototype['autoFuelHigh'] = undefined;
                /**
                 * @member {Number} autoMobilityPoints
                 */
                exports.prototype['autoMobilityPoints'] = undefined;
                /**
                 * @member {Number} autoRotorPoints
                 */
                exports.prototype['autoRotorPoints'] = undefined;
                /**
                 * @member {Number} autoFuelPoints
                 */
                exports.prototype['autoFuelPoints'] = undefined;
                /**
                 * @member {Number} teleopFuelPoints
                 */
                exports.prototype['teleopFuelPoints'] = undefined;
                /**
                 * @member {Number} teleopFuelLow
                 */
                exports.prototype['teleopFuelLow'] = undefined;
                /**
                 * @member {Number} teleopFuelHigh
                 */
                exports.prototype['teleopFuelHigh'] = undefined;
                /**
                 * @member {Number} teleopRotorPoints
                 */
                exports.prototype['teleopRotorPoints'] = undefined;
                /**
                 * @member {Boolean} kPaRankingPointAchieved
                 */
                exports.prototype['kPaRankingPointAchieved'] = undefined;
                /**
                 * @member {Number} teleopTakeoffPoints
                 */
                exports.prototype['teleopTakeoffPoints'] = undefined;
                /**
                 * @member {Number} kPaBonusPoints
                 */
                exports.prototype['kPaBonusPoints'] = undefined;
                /**
                 * @member {Number} rotorBonusPoints
                 */
                exports.prototype['rotorBonusPoints'] = undefined;
                /**
                 * @member {Boolean} rotor1Engaged
                 */
                exports.prototype['rotor1Engaged'] = undefined;
                /**
                 * @member {Boolean} rotor2Engaged
                 */
                exports.prototype['rotor2Engaged'] = undefined;
                /**
                 * @member {Boolean} rotor3Engaged
                 */
                exports.prototype['rotor3Engaged'] = undefined;
                /**
                 * @member {Boolean} rotor4Engaged
                 */
                exports.prototype['rotor4Engaged'] = undefined;
                /**
                 * @member {Boolean} rotorRankingPointAchieved
                 */
                exports.prototype['rotorRankingPointAchieved'] = undefined;
                /**
                 * @member {Number} techFoulCount
                 */
                exports.prototype['techFoulCount'] = undefined;
                /**
                 * @member {Number} foulCount
                 */
                exports.prototype['foulCount'] = undefined;
                /**
                 * @member {String} touchpadNear
                 */
                exports.prototype['touchpadNear'] = undefined;
                /**
                 * @member {String} touchpadMiddle
                 */
                exports.prototype['touchpadMiddle'] = undefined;
                /**
                 * @member {String} touchpadFar
                 */
                exports.prototype['touchpadFar'] = undefined;


                /**
                 * Allowed values for the <code>robot1Auto</code> property.
                 * @enum {String}
                 * @readonly
                 */
                exports.Robot1AutoEnum = {
                    /**
                     * value: "Unknown"
                     * @const
                     */
                    "Unknown": "Unknown",
                    /**
                     * value: "Mobility"
                     * @const
                     */
                    "Mobility": "Mobility",
                    /**
                     * value: "None"
                     * @const
                     */
                    "None": "None"
                };

                /**
                 * Allowed values for the <code>robot2Auto</code> property.
                 * @enum {String}
                 * @readonly
                 */
                exports.Robot2AutoEnum = {
                    /**
                     * value: "Unknown"
                     * @const
                     */
                    "Unknown": "Unknown",
                    /**
                     * value: "Mobility"
                     * @const
                     */
                    "Mobility": "Mobility",
                    /**
                     * value: "None"
                     * @const
                     */
                    "None": "None"
                };

                /**
                 * Allowed values for the <code>robot3Auto</code> property.
                 * @enum {String}
                 * @readonly
                 */
                exports.Robot3AutoEnum = {
                    /**
                     * value: "Unknown"
                     * @const
                     */
                    "Unknown": "Unknown",
                    /**
                     * value: "Mobility"
                     * @const
                     */
                    "Mobility": "Mobility",
                    /**
                     * value: "None"
                     * @const
                     */
                    "None": "None"
                };


                return exports;
            }));



}, {
            "../ApiClient": 9
        }],
        50: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/MatchSimpleAlliances'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('./MatchSimpleAlliances'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.MatchSimple = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.MatchSimpleAlliances);
                }
            }(this, function (ApiClient, MatchSimpleAlliances) {
                'use strict';




                /**
                 * The MatchSimple model module.
                 * @module TBAAPI.Client/model/MatchSimple
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>MatchSimple</code>.
                 * @alias module:TBAAPI.Client/model/MatchSimple
                 * @class
                 * @param key {String} TBA event key with the format `yyyy[EVENT_CODE]_[COMP_LEVEL]m[MATCH_NUMBER]`, where `yyyy` is the year, and `EVENT_CODE` is the event code of the event, `COMP_LEVEL` is (qm, ef, qf, sf, f), and `MATCH_NUMBER` is the match number in the competition level. A set number may append the competition level if more than one match in required per set.
                 * @param compLevel {module:TBAAPI.Client/model/MatchSimple.CompLevelEnum} The competition level the match was played at.
                 * @param setNumber {Number} The set number in a series of matches where more than one match is required in the match series.
                 * @param matchNumber {Number} The match number of the match in the competition level.
                 * @param eventKey {String} Event key of the event the match was played at.
                 */
                var exports = function (key, compLevel, setNumber, matchNumber, eventKey) {
                    var _this = this;

                    _this['key'] = key;
                    _this['comp_level'] = compLevel;
                    _this['set_number'] = setNumber;
                    _this['match_number'] = matchNumber;


                    _this['event_key'] = eventKey;



                };

                /**
                 * Constructs a <code>MatchSimple</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/MatchSimple} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/MatchSimple} The populated <code>MatchSimple</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('key')) {
                            obj['key'] = ApiClient.convertToType(data['key'], 'String');
                        }
                        if (data.hasOwnProperty('comp_level')) {
                            obj['comp_level'] = ApiClient.convertToType(data['comp_level'], 'String');
                        }
                        if (data.hasOwnProperty('set_number')) {
                            obj['set_number'] = ApiClient.convertToType(data['set_number'], 'Number');
                        }
                        if (data.hasOwnProperty('match_number')) {
                            obj['match_number'] = ApiClient.convertToType(data['match_number'], 'Number');
                        }
                        if (data.hasOwnProperty('alliances')) {
                            obj['alliances'] = MatchSimpleAlliances.constructFromObject(data['alliances']);
                        }
                        if (data.hasOwnProperty('winning_alliance')) {
                            obj['winning_alliance'] = ApiClient.convertToType(data['winning_alliance'], 'String');
                        }
                        if (data.hasOwnProperty('event_key')) {
                            obj['event_key'] = ApiClient.convertToType(data['event_key'], 'String');
                        }
                        if (data.hasOwnProperty('time')) {
                            obj['time'] = ApiClient.convertToType(data['time'], 'Number');
                        }
                        if (data.hasOwnProperty('predicted_time')) {
                            obj['predicted_time'] = ApiClient.convertToType(data['predicted_time'], 'Number');
                        }
                        if (data.hasOwnProperty('actual_time')) {
                            obj['actual_time'] = ApiClient.convertToType(data['actual_time'], 'Number');
                        }
                    }
                    return obj;
                }

                /**
                 * TBA event key with the format `yyyy[EVENT_CODE]_[COMP_LEVEL]m[MATCH_NUMBER]`, where `yyyy` is the year, and `EVENT_CODE` is the event code of the event, `COMP_LEVEL` is (qm, ef, qf, sf, f), and `MATCH_NUMBER` is the match number in the competition level. A set number may append the competition level if more than one match in required per set.
                 * @member {String} key
                 */
                exports.prototype['key'] = undefined;
                /**
                 * The competition level the match was played at.
                 * @member {module:TBAAPI.Client/model/MatchSimple.CompLevelEnum} comp_level
                 */
                exports.prototype['comp_level'] = undefined;
                /**
                 * The set number in a series of matches where more than one match is required in the match series.
                 * @member {Number} set_number
                 */
                exports.prototype['set_number'] = undefined;
                /**
                 * The match number of the match in the competition level.
                 * @member {Number} match_number
                 */
                exports.prototype['match_number'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/MatchSimpleAlliances} alliances
                 */
                exports.prototype['alliances'] = undefined;
                /**
                 * The color (red/blue) of the winning alliance. Will contain an empty string in the event of no winner, or a tie.
                 * @member {module:TBAAPI.Client/model/MatchSimple.WinningAllianceEnum} winning_alliance
                 */
                exports.prototype['winning_alliance'] = undefined;
                /**
                 * Event key of the event the match was played at.
                 * @member {String} event_key
                 */
                exports.prototype['event_key'] = undefined;
                /**
                 * UNIX timestamp (seconds since 1-Jan-1970 00:00:00) of the scheduled match time, as taken from the published schedule.
                 * @member {Number} time
                 */
                exports.prototype['time'] = undefined;
                /**
                 * UNIX timestamp (seconds since 1-Jan-1970 00:00:00) of the TBA predicted match start time.
                 * @member {Number} predicted_time
                 */
                exports.prototype['predicted_time'] = undefined;
                /**
                 * UNIX timestamp (seconds since 1-Jan-1970 00:00:00) of actual match start time.
                 * @member {Number} actual_time
                 */
                exports.prototype['actual_time'] = undefined;


                /**
                 * Allowed values for the <code>comp_level</code> property.
                 * @enum {String}
                 * @readonly
                 */
                exports.CompLevelEnum = {
                    /**
                     * value: "qm"
                     * @const
                     */
                    "qm": "qm",
                    /**
                     * value: "ef"
                     * @const
                     */
                    "ef": "ef",
                    /**
                     * value: "qf"
                     * @const
                     */
                    "qf": "qf",
                    /**
                     * value: "sf"
                     * @const
                     */
                    "sf": "sf",
                    /**
                     * value: "f"
                     * @const
                     */
                    "f": "f"
                };

                /**
                 * Allowed values for the <code>winning_alliance</code> property.
                 * @enum {String}
                 * @readonly
                 */
                exports.WinningAllianceEnum = {
                    /**
                     * value: "red"
                     * @const
                     */
                    "red": "red",
                    /**
                     * value: "blue"
                     * @const
                     */
                    "blue": "blue"
                };


                return exports;
            }));



}, {
            "../ApiClient": 9,
            "./MatchSimpleAlliances": 51
        }],
        51: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/MatchAlliance'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('./MatchAlliance'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.MatchSimpleAlliances = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.MatchAlliance);
                }
            }(this, function (ApiClient, MatchAlliance) {
                'use strict';




                /**
                 * The MatchSimpleAlliances model module.
                 * @module TBAAPI.Client/model/MatchSimpleAlliances
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>MatchSimpleAlliances</code>.
                 * A list of alliances, the teams on the alliances, and their score.
                 * @alias module:TBAAPI.Client/model/MatchSimpleAlliances
                 * @class
                 */
                var exports = function () {
                    var _this = this;



                };

                /**
                 * Constructs a <code>MatchSimpleAlliances</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/MatchSimpleAlliances} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/MatchSimpleAlliances} The populated <code>MatchSimpleAlliances</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('blue')) {
                            obj['blue'] = MatchAlliance.constructFromObject(data['blue']);
                        }
                        if (data.hasOwnProperty('red')) {
                            obj['red'] = MatchAlliance.constructFromObject(data['red']);
                        }
                    }
                    return obj;
                }

                /**
                 * @member {module:TBAAPI.Client/model/MatchAlliance} blue
                 */
                exports.prototype['blue'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/MatchAlliance} red
                 */
                exports.prototype['red'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9,
            "./MatchAlliance": 43
        }],
        52: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.MatchVideos = factory(root.TbaApiV3client.ApiClient);
                }
            }(this, function (ApiClient) {
                'use strict';




                /**
                 * The MatchVideos model module.
                 * @module TBAAPI.Client/model/MatchVideos
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>MatchVideos</code>.
                 * @alias module:TBAAPI.Client/model/MatchVideos
                 * @class
                 */
                var exports = function () {
                    var _this = this;



                };

                /**
                 * Constructs a <code>MatchVideos</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/MatchVideos} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/MatchVideos} The populated <code>MatchVideos</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('key')) {
                            obj['key'] = ApiClient.convertToType(data['key'], 'String');
                        }
                        if (data.hasOwnProperty('type')) {
                            obj['type'] = ApiClient.convertToType(data['type'], 'String');
                        }
                    }
                    return obj;
                }

                /**
                 * Unique key representing this video
                 * @member {String} key
                 */
                exports.prototype['key'] = undefined;
                /**
                 * Can be one of 'youtube' or 'tba'
                 * @member {String} type
                 */
                exports.prototype['type'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9
        }],
        53: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.Media = factory(root.TbaApiV3client.ApiClient);
                }
            }(this, function (ApiClient) {
                'use strict';




                /**
                 * The Media model module.
                 * @module TBAAPI.Client/model/Media
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>Media</code>.
                 * The &#x60;Media&#x60; object contains a reference for most any media associated with a team or event on TBA.
                 * @alias module:TBAAPI.Client/model/Media
                 * @class
                 * @param key {String} TBA identifier for this media.
                 * @param type {module:TBAAPI.Client/model/Media.TypeEnum} String type of the media element.
                 */
                var exports = function (key, type) {
                    var _this = this;

                    _this['key'] = key;
                    _this['type'] = type;



                };

                /**
                 * Constructs a <code>Media</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/Media} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/Media} The populated <code>Media</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('key')) {
                            obj['key'] = ApiClient.convertToType(data['key'], 'String');
                        }
                        if (data.hasOwnProperty('type')) {
                            obj['type'] = ApiClient.convertToType(data['type'], 'String');
                        }
                        if (data.hasOwnProperty('foreign_key')) {
                            obj['foreign_key'] = ApiClient.convertToType(data['foreign_key'], 'String');
                        }
                        if (data.hasOwnProperty('details')) {
                            obj['details'] = ApiClient.convertToType(data['details'], Object);
                        }
                        if (data.hasOwnProperty('preferred')) {
                            obj['preferred'] = ApiClient.convertToType(data['preferred'], 'Boolean');
                        }
                    }
                    return obj;
                }

                /**
                 * TBA identifier for this media.
                 * @member {String} key
                 */
                exports.prototype['key'] = undefined;
                /**
                 * String type of the media element.
                 * @member {module:TBAAPI.Client/model/Media.TypeEnum} type
                 */
                exports.prototype['type'] = undefined;
                /**
                 * The key used to identify this media on the media site.
                 * @member {String} foreign_key
                 */
                exports.prototype['foreign_key'] = undefined;
                /**
                 * If required, a JSON dict of additional media information.
                 * @member {Object} details
                 */
                exports.prototype['details'] = undefined;
                /**
                 * True if the media is of high quality.
                 * @member {Boolean} preferred
                 */
                exports.prototype['preferred'] = undefined;


                /**
                 * Allowed values for the <code>type</code> property.
                 * @enum {String}
                 * @readonly
                 */
                exports.TypeEnum = {
                    /**
                     * value: "youtube"
                     * @const
                     */
                    "youtube": "youtube",
                    /**
                     * value: "cdphotothread"
                     * @const
                     */
                    "cdphotothread": "cdphotothread",
                    /**
                     * value: "imgur"
                     * @const
                     */
                    "imgur": "imgur",
                    /**
                     * value: "facebook-profile"
                     * @const
                     */
                    "facebook-profile": "facebook-profile",
                    /**
                     * value: "youtube-channel"
                     * @const
                     */
                    "youtube-channel": "youtube-channel",
                    /**
                     * value: "twitter-profile"
                     * @const
                     */
                    "twitter-profile": "twitter-profile",
                    /**
                     * value: "github-profile"
                     * @const
                     */
                    "github-profile": "github-profile",
                    /**
                     * value: "instagram-profile"
                     * @const
                     */
                    "instagram-profile": "instagram-profile",
                    /**
                     * value: "periscope-profile"
                     * @const
                     */
                    "periscope-profile": "periscope-profile",
                    /**
                     * value: "grabcad"
                     * @const
                     */
                    "grabcad": "grabcad",
                    /**
                     * value: "pinterest-profile"
                     * @const
                     */
                    "pinterest-profile": "pinterest-profile",
                    /**
                     * value: "snapchat-profile"
                     * @const
                     */
                    "snapchat-profile": "snapchat-profile",
                    /**
                     * value: "twitch-channel"
                     * @const
                     */
                    "twitch-channel": "twitch-channel"
                };


                return exports;
            }));



}, {
            "../ApiClient": 9
        }],
        54: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.Team = factory(root.TbaApiV3client.ApiClient);
                }
            }(this, function (ApiClient) {
                'use strict';




                /**
                 * The Team model module.
                 * @module TBAAPI.Client/model/Team
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>Team</code>.
                 * @alias module:TBAAPI.Client/model/Team
                 * @class
                 * @param key {String} TBA team key with the format `frcXXXX` with `XXXX` representing the team number.
                 * @param teamNumber {Number} Official team number issued by FIRST.
                 * @param name {String} Official long name registered with FIRST.
                 * @param rookieYear {Number} First year the team officially competed.
                 */
                var exports = function (key, teamNumber, name, rookieYear) {
                    var _this = this;

                    _this['key'] = key;
                    _this['team_number'] = teamNumber;

                    _this['name'] = name;









                    _this['rookie_year'] = rookieYear;


                };

                /**
                 * Constructs a <code>Team</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/Team} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/Team} The populated <code>Team</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('key')) {
                            obj['key'] = ApiClient.convertToType(data['key'], 'String');
                        }
                        if (data.hasOwnProperty('team_number')) {
                            obj['team_number'] = ApiClient.convertToType(data['team_number'], 'Number');
                        }
                        if (data.hasOwnProperty('nickname')) {
                            obj['nickname'] = ApiClient.convertToType(data['nickname'], 'String');
                        }
                        if (data.hasOwnProperty('name')) {
                            obj['name'] = ApiClient.convertToType(data['name'], 'String');
                        }
                        if (data.hasOwnProperty('city')) {
                            obj['city'] = ApiClient.convertToType(data['city'], 'String');
                        }
                        if (data.hasOwnProperty('state_prov')) {
                            obj['state_prov'] = ApiClient.convertToType(data['state_prov'], 'String');
                        }
                        if (data.hasOwnProperty('country')) {
                            obj['country'] = ApiClient.convertToType(data['country'], 'String');
                        }
                        if (data.hasOwnProperty('address')) {
                            obj['address'] = ApiClient.convertToType(data['address'], 'String');
                        }
                        if (data.hasOwnProperty('postal_code')) {
                            obj['postal_code'] = ApiClient.convertToType(data['postal_code'], 'String');
                        }
                        if (data.hasOwnProperty('gmaps_place_id')) {
                            obj['gmaps_place_id'] = ApiClient.convertToType(data['gmaps_place_id'], 'String');
                        }
                        if (data.hasOwnProperty('gmaps_url')) {
                            obj['gmaps_url'] = ApiClient.convertToType(data['gmaps_url'], 'String');
                        }
                        if (data.hasOwnProperty('lat')) {
                            obj['lat'] = ApiClient.convertToType(data['lat'], 'Number');
                        }
                        if (data.hasOwnProperty('lng')) {
                            obj['lng'] = ApiClient.convertToType(data['lng'], 'Number');
                        }
                        if (data.hasOwnProperty('location_name')) {
                            obj['location_name'] = ApiClient.convertToType(data['location_name'], 'String');
                        }
                        if (data.hasOwnProperty('website')) {
                            obj['website'] = ApiClient.convertToType(data['website'], 'String');
                        }
                        if (data.hasOwnProperty('rookie_year')) {
                            obj['rookie_year'] = ApiClient.convertToType(data['rookie_year'], 'Number');
                        }
                        if (data.hasOwnProperty('motto')) {
                            obj['motto'] = ApiClient.convertToType(data['motto'], 'String');
                        }
                        if (data.hasOwnProperty('home_championship')) {
                            obj['home_championship'] = ApiClient.convertToType(data['home_championship'], Object);
                        }
                    }
                    return obj;
                }

                /**
                 * TBA team key with the format `frcXXXX` with `XXXX` representing the team number.
                 * @member {String} key
                 */
                exports.prototype['key'] = undefined;
                /**
                 * Official team number issued by FIRST.
                 * @member {Number} team_number
                 */
                exports.prototype['team_number'] = undefined;
                /**
                 * Team nickname provided by FIRST.
                 * @member {String} nickname
                 */
                exports.prototype['nickname'] = undefined;
                /**
                 * Official long name registered with FIRST.
                 * @member {String} name
                 */
                exports.prototype['name'] = undefined;
                /**
                 * City of team derived from parsing the address registered with FIRST.
                 * @member {String} city
                 */
                exports.prototype['city'] = undefined;
                /**
                 * State of team derived from parsing the address registered with FIRST.
                 * @member {String} state_prov
                 */
                exports.prototype['state_prov'] = undefined;
                /**
                 * Country of team derived from parsing the address registered with FIRST.
                 * @member {String} country
                 */
                exports.prototype['country'] = undefined;
                /**
                 * Will be NULL, for future development.
                 * @member {String} address
                 */
                exports.prototype['address'] = undefined;
                /**
                 * Postal code from the team address.
                 * @member {String} postal_code
                 */
                exports.prototype['postal_code'] = undefined;
                /**
                 * Will be NULL, for future development.
                 * @member {String} gmaps_place_id
                 */
                exports.prototype['gmaps_place_id'] = undefined;
                /**
                 * Will be NULL, for future development.
                 * @member {String} gmaps_url
                 */
                exports.prototype['gmaps_url'] = undefined;
                /**
                 * Will be NULL, for future development.
                 * @member {Number} lat
                 */
                exports.prototype['lat'] = undefined;
                /**
                 * Will be NULL, for future development.
                 * @member {Number} lng
                 */
                exports.prototype['lng'] = undefined;
                /**
                 * Will be NULL, for future development.
                 * @member {String} location_name
                 */
                exports.prototype['location_name'] = undefined;
                /**
                 * Official website associated with the team.
                 * @member {String} website
                 */
                exports.prototype['website'] = undefined;
                /**
                 * First year the team officially competed.
                 * @member {Number} rookie_year
                 */
                exports.prototype['rookie_year'] = undefined;
                /**
                 * Team's motto as provided by FIRST.
                 * @member {String} motto
                 */
                exports.prototype['motto'] = undefined;
                /**
                 * Location of the team's home championship each year as a key-value pair. The year (as a string) is the key, and the city is the value.
                 * @member {Object} home_championship
                 */
                exports.prototype['home_championship'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9
        }],
        55: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/TeamEventStatusAlliance', 'TBAAPI.Client/model/TeamEventStatusPlayoff', 'TBAAPI.Client/model/TeamEventStatusRank'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('./TeamEventStatusAlliance'), require('./TeamEventStatusPlayoff'), require('./TeamEventStatusRank'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.TeamEventStatus = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.TeamEventStatusAlliance, root.TbaApiV3client.TeamEventStatusPlayoff, root.TbaApiV3client.TeamEventStatusRank);
                }
            }(this, function (ApiClient, TeamEventStatusAlliance, TeamEventStatusPlayoff, TeamEventStatusRank) {
                'use strict';




                /**
                 * The TeamEventStatus model module.
                 * @module TBAAPI.Client/model/TeamEventStatus
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>TeamEventStatus</code>.
                 * @alias module:TBAAPI.Client/model/TeamEventStatus
                 * @class
                 */
                var exports = function () {
                    var _this = this;







                };

                /**
                 * Constructs a <code>TeamEventStatus</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/TeamEventStatus} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/TeamEventStatus} The populated <code>TeamEventStatus</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('qual')) {
                            obj['qual'] = TeamEventStatusRank.constructFromObject(data['qual']);
                        }
                        if (data.hasOwnProperty('alliance')) {
                            obj['alliance'] = TeamEventStatusAlliance.constructFromObject(data['alliance']);
                        }
                        if (data.hasOwnProperty('playoff')) {
                            obj['playoff'] = TeamEventStatusPlayoff.constructFromObject(data['playoff']);
                        }
                        if (data.hasOwnProperty('alliance_status_str')) {
                            obj['alliance_status_str'] = ApiClient.convertToType(data['alliance_status_str'], 'String');
                        }
                        if (data.hasOwnProperty('playoff_status_str')) {
                            obj['playoff_status_str'] = ApiClient.convertToType(data['playoff_status_str'], 'String');
                        }
                        if (data.hasOwnProperty('overall_status_str')) {
                            obj['overall_status_str'] = ApiClient.convertToType(data['overall_status_str'], 'String');
                        }
                    }
                    return obj;
                }

                /**
                 * @member {module:TBAAPI.Client/model/TeamEventStatusRank} qual
                 */
                exports.prototype['qual'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/TeamEventStatusAlliance} alliance
                 */
                exports.prototype['alliance'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/TeamEventStatusPlayoff} playoff
                 */
                exports.prototype['playoff'] = undefined;
                /**
                 * An HTML formatted string suitable for display to the user containing the team's alliance pick status.
                 * @member {String} alliance_status_str
                 */
                exports.prototype['alliance_status_str'] = undefined;
                /**
                 * An HTML formatter string suitable for display to the user containing the team's playoff status.
                 * @member {String} playoff_status_str
                 */
                exports.prototype['playoff_status_str'] = undefined;
                /**
                 * An HTML formatted string suitable for display to the user containing the team's overall status summary of the event.
                 * @member {String} overall_status_str
                 */
                exports.prototype['overall_status_str'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9,
            "./TeamEventStatusAlliance": 56,
            "./TeamEventStatusPlayoff": 58,
            "./TeamEventStatusRank": 59
        }],
        56: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/TeamEventStatusAllianceBackup'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('./TeamEventStatusAllianceBackup'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.TeamEventStatusAlliance = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.TeamEventStatusAllianceBackup);
                }
            }(this, function (ApiClient, TeamEventStatusAllianceBackup) {
                'use strict';




                /**
                 * The TeamEventStatusAlliance model module.
                 * @module TBAAPI.Client/model/TeamEventStatusAlliance
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>TeamEventStatusAlliance</code>.
                 * @alias module:TBAAPI.Client/model/TeamEventStatusAlliance
                 * @class
                 * @param _number {Number} Alliance number.
                 * @param pick {Number} Order the team was picked in the alliance from 0-2, with 0 being alliance captain.
                 */
                var exports = function (_number, pick) {
                    var _this = this;


                    _this['number'] = _number;

                    _this['pick'] = pick;
                };

                /**
                 * Constructs a <code>TeamEventStatusAlliance</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/TeamEventStatusAlliance} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/TeamEventStatusAlliance} The populated <code>TeamEventStatusAlliance</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('name')) {
                            obj['name'] = ApiClient.convertToType(data['name'], 'String');
                        }
                        if (data.hasOwnProperty('number')) {
                            obj['number'] = ApiClient.convertToType(data['number'], 'Number');
                        }
                        if (data.hasOwnProperty('backup')) {
                            obj['backup'] = TeamEventStatusAllianceBackup.constructFromObject(data['backup']);
                        }
                        if (data.hasOwnProperty('pick')) {
                            obj['pick'] = ApiClient.convertToType(data['pick'], 'Number');
                        }
                    }
                    return obj;
                }

                /**
                 * Alliance name, may be null.
                 * @member {String} name
                 */
                exports.prototype['name'] = undefined;
                /**
                 * Alliance number.
                 * @member {Number} number
                 */
                exports.prototype['number'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/TeamEventStatusAllianceBackup} backup
                 */
                exports.prototype['backup'] = undefined;
                /**
                 * Order the team was picked in the alliance from 0-2, with 0 being alliance captain.
                 * @member {Number} pick
                 */
                exports.prototype['pick'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9,
            "./TeamEventStatusAllianceBackup": 57
        }],
        57: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.TeamEventStatusAllianceBackup = factory(root.TbaApiV3client.ApiClient);
                }
            }(this, function (ApiClient) {
                'use strict';




                /**
                 * The TeamEventStatusAllianceBackup model module.
                 * @module TBAAPI.Client/model/TeamEventStatusAllianceBackup
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>TeamEventStatusAllianceBackup</code>.
                 * Backup status, may be null.
                 * @alias module:TBAAPI.Client/model/TeamEventStatusAllianceBackup
                 * @class
                 */
                var exports = function () {
                    var _this = this;



                };

                /**
                 * Constructs a <code>TeamEventStatusAllianceBackup</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/TeamEventStatusAllianceBackup} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/TeamEventStatusAllianceBackup} The populated <code>TeamEventStatusAllianceBackup</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('out')) {
                            obj['out'] = ApiClient.convertToType(data['out'], 'String');
                        }
                        if (data.hasOwnProperty('in')) {
                            obj['in'] = ApiClient.convertToType(data['in'], 'String');
                        }
                    }
                    return obj;
                }

                /**
                 * TBA key for the team replaced by the backup.
                 * @member {String} out
                 */
                exports.prototype['out'] = undefined;
                /**
                 * TBA key for the backup team called in.
                 * @member {String} in
                 */
                exports.prototype['in'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9
        }],
        58: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/WLTRecord'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('./WLTRecord'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.TeamEventStatusPlayoff = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.WLTRecord);
                }
            }(this, function (ApiClient, WLTRecord) {
                'use strict';




                /**
                 * The TeamEventStatusPlayoff model module.
                 * @module TBAAPI.Client/model/TeamEventStatusPlayoff
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>TeamEventStatusPlayoff</code>.
                 * Playoff status for this team, may be null if the team did not make playoffs, or playoffs have not begun.
                 * @alias module:TBAAPI.Client/model/TeamEventStatusPlayoff
                 * @class
                 */
                var exports = function () {
                    var _this = this;






                };

                /**
                 * Constructs a <code>TeamEventStatusPlayoff</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/TeamEventStatusPlayoff} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/TeamEventStatusPlayoff} The populated <code>TeamEventStatusPlayoff</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('level')) {
                            obj['level'] = ApiClient.convertToType(data['level'], 'String');
                        }
                        if (data.hasOwnProperty('current_level_record')) {
                            obj['current_level_record'] = WLTRecord.constructFromObject(data['current_level_record']);
                        }
                        if (data.hasOwnProperty('record')) {
                            obj['record'] = WLTRecord.constructFromObject(data['record']);
                        }
                        if (data.hasOwnProperty('status')) {
                            obj['status'] = ApiClient.convertToType(data['status'], 'String');
                        }
                        if (data.hasOwnProperty('playoff_average')) {
                            obj['playoff_average'] = ApiClient.convertToType(data['playoff_average'], 'Number');
                        }
                    }
                    return obj;
                }

                /**
                 * The highest playoff level the team reached.
                 * @member {module:TBAAPI.Client/model/TeamEventStatusPlayoff.LevelEnum} level
                 */
                exports.prototype['level'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/WLTRecord} current_level_record
                 */
                exports.prototype['current_level_record'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/WLTRecord} record
                 */
                exports.prototype['record'] = undefined;
                /**
                 * Current competition status for the playoffs.
                 * @member {module:TBAAPI.Client/model/TeamEventStatusPlayoff.StatusEnum} status
                 */
                exports.prototype['status'] = undefined;
                /**
                 * The average match score during playoffs. Year specific. May be null if not relevant for a given year.
                 * @member {Number} playoff_average
                 */
                exports.prototype['playoff_average'] = undefined;


                /**
                 * Allowed values for the <code>level</code> property.
                 * @enum {String}
                 * @readonly
                 */
                exports.LevelEnum = {
                    /**
                     * value: "qm"
                     * @const
                     */
                    "qm": "qm",
                    /**
                     * value: "ef"
                     * @const
                     */
                    "ef": "ef",
                    /**
                     * value: "qf"
                     * @const
                     */
                    "qf": "qf",
                    /**
                     * value: "sf"
                     * @const
                     */
                    "sf": "sf",
                    /**
                     * value: "f"
                     * @const
                     */
                    "f": "f"
                };

                /**
                 * Allowed values for the <code>status</code> property.
                 * @enum {String}
                 * @readonly
                 */
                exports.StatusEnum = {
                    /**
                     * value: "won"
                     * @const
                     */
                    "won": "won",
                    /**
                     * value: "eliminated"
                     * @const
                     */
                    "eliminated": "eliminated",
                    /**
                     * value: "playing"
                     * @const
                     */
                    "playing": "playing"
                };


                return exports;
            }));



}, {
            "../ApiClient": 9,
            "./WLTRecord": 64
        }],
        59: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/TeamEventStatusRankRanking', 'TBAAPI.Client/model/TeamEventStatusRankSortOrderInfo'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('./TeamEventStatusRankRanking'), require('./TeamEventStatusRankSortOrderInfo'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.TeamEventStatusRank = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.TeamEventStatusRankRanking, root.TbaApiV3client.TeamEventStatusRankSortOrderInfo);
                }
            }(this, function (ApiClient, TeamEventStatusRankRanking, TeamEventStatusRankSortOrderInfo) {
                'use strict';




                /**
                 * The TeamEventStatusRank model module.
                 * @module TBAAPI.Client/model/TeamEventStatusRank
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>TeamEventStatusRank</code>.
                 * @alias module:TBAAPI.Client/model/TeamEventStatusRank
                 * @class
                 */
                var exports = function () {
                    var _this = this;





                };

                /**
                 * Constructs a <code>TeamEventStatusRank</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/TeamEventStatusRank} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/TeamEventStatusRank} The populated <code>TeamEventStatusRank</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('num_teams')) {
                            obj['num_teams'] = ApiClient.convertToType(data['num_teams'], 'Number');
                        }
                        if (data.hasOwnProperty('ranking')) {
                            obj['ranking'] = TeamEventStatusRankRanking.constructFromObject(data['ranking']);
                        }
                        if (data.hasOwnProperty('sort_order_info')) {
                            obj['sort_order_info'] = ApiClient.convertToType(data['sort_order_info'], [TeamEventStatusRankSortOrderInfo]);
                        }
                        if (data.hasOwnProperty('status')) {
                            obj['status'] = ApiClient.convertToType(data['status'], 'String');
                        }
                    }
                    return obj;
                }

                /**
                 * Number of teams ranked.
                 * @member {Number} num_teams
                 */
                exports.prototype['num_teams'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/TeamEventStatusRankRanking} ranking
                 */
                exports.prototype['ranking'] = undefined;
                /**
                 * Ordered list of names corresponding to the elements of the `sort_orders` array.
                 * @member {Array.<module:TBAAPI.Client/model/TeamEventStatusRankSortOrderInfo>} sort_order_info
                 */
                exports.prototype['sort_order_info'] = undefined;
                /**
                 * @member {String} status
                 */
                exports.prototype['status'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9,
            "./TeamEventStatusRankRanking": 60,
            "./TeamEventStatusRankSortOrderInfo": 61
        }],
        60: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient', 'TBAAPI.Client/model/WLTRecord'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'), require('./WLTRecord'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.TeamEventStatusRankRanking = factory(root.TbaApiV3client.ApiClient, root.TbaApiV3client.WLTRecord);
                }
            }(this, function (ApiClient, WLTRecord) {
                'use strict';




                /**
                 * The TeamEventStatusRankRanking model module.
                 * @module TBAAPI.Client/model/TeamEventStatusRankRanking
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>TeamEventStatusRankRanking</code>.
                 * @alias module:TBAAPI.Client/model/TeamEventStatusRankRanking
                 * @class
                 */
                var exports = function () {
                    var _this = this;








                };

                /**
                 * Constructs a <code>TeamEventStatusRankRanking</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/TeamEventStatusRankRanking} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/TeamEventStatusRankRanking} The populated <code>TeamEventStatusRankRanking</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('dq')) {
                            obj['dq'] = ApiClient.convertToType(data['dq'], 'Number');
                        }
                        if (data.hasOwnProperty('matches_played')) {
                            obj['matches_played'] = ApiClient.convertToType(data['matches_played'], 'Number');
                        }
                        if (data.hasOwnProperty('qual_average')) {
                            obj['qual_average'] = ApiClient.convertToType(data['qual_average'], 'Number');
                        }
                        if (data.hasOwnProperty('rank')) {
                            obj['rank'] = ApiClient.convertToType(data['rank'], 'Number');
                        }
                        if (data.hasOwnProperty('record')) {
                            obj['record'] = WLTRecord.constructFromObject(data['record']);
                        }
                        if (data.hasOwnProperty('sort_orders')) {
                            obj['sort_orders'] = ApiClient.convertToType(data['sort_orders'], ['Number']);
                        }
                        if (data.hasOwnProperty('team_key')) {
                            obj['team_key'] = ApiClient.convertToType(data['team_key'], 'String');
                        }
                    }
                    return obj;
                }

                /**
                 * Number of matches the team was disqualified for.
                 * @member {Number} dq
                 */
                exports.prototype['dq'] = undefined;
                /**
                 * Number of matches played.
                 * @member {Number} matches_played
                 */
                exports.prototype['matches_played'] = undefined;
                /**
                 * For some years, average qualification score. Can be null.
                 * @member {Number} qual_average
                 */
                exports.prototype['qual_average'] = undefined;
                /**
                 * Relative rank of this team.
                 * @member {Number} rank
                 */
                exports.prototype['rank'] = undefined;
                /**
                 * @member {module:TBAAPI.Client/model/WLTRecord} record
                 */
                exports.prototype['record'] = undefined;
                /**
                 * Ordered list of values used to determine the rank. See the `sort_order_info` property for the name of each value.
                 * @member {Array.<Number>} sort_orders
                 */
                exports.prototype['sort_orders'] = undefined;
                /**
                 * TBA team key for this rank.
                 * @member {String} team_key
                 */
                exports.prototype['team_key'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9,
            "./WLTRecord": 64
        }],
        61: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.TeamEventStatusRankSortOrderInfo = factory(root.TbaApiV3client.ApiClient);
                }
            }(this, function (ApiClient) {
                'use strict';




                /**
                 * The TeamEventStatusRankSortOrderInfo model module.
                 * @module TBAAPI.Client/model/TeamEventStatusRankSortOrderInfo
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>TeamEventStatusRankSortOrderInfo</code>.
                 * @alias module:TBAAPI.Client/model/TeamEventStatusRankSortOrderInfo
                 * @class
                 */
                var exports = function () {
                    var _this = this;



                };

                /**
                 * Constructs a <code>TeamEventStatusRankSortOrderInfo</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/TeamEventStatusRankSortOrderInfo} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/TeamEventStatusRankSortOrderInfo} The populated <code>TeamEventStatusRankSortOrderInfo</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('name')) {
                            obj['name'] = ApiClient.convertToType(data['name'], 'String');
                        }
                        if (data.hasOwnProperty('precision')) {
                            obj['precision'] = ApiClient.convertToType(data['precision'], 'Number');
                        }
                    }
                    return obj;
                }

                /**
                 * The descriptive name of the value used to sort the ranking.
                 * @member {String} name
                 */
                exports.prototype['name'] = undefined;
                /**
                 * The number of digits of precision used for this value, eg `2` would correspond to a value of `101.11` while `0` would correspond to `101`.
                 * @member {Number} precision
                 */
                exports.prototype['precision'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9
        }],
        62: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.TeamRobot = factory(root.TbaApiV3client.ApiClient);
                }
            }(this, function (ApiClient) {
                'use strict';




                /**
                 * The TeamRobot model module.
                 * @module TBAAPI.Client/model/TeamRobot
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>TeamRobot</code>.
                 * @alias module:TBAAPI.Client/model/TeamRobot
                 * @class
                 * @param year {Number} Year this robot competed in.
                 * @param robotName {String} Name of the robot as provided by the team.
                 * @param key {String} Internal TBA identifier for this robot.
                 * @param teamKey {String} TBA team key for this robot.
                 */
                var exports = function (year, robotName, key, teamKey) {
                    var _this = this;

                    _this['year'] = year;
                    _this['robot_name'] = robotName;
                    _this['key'] = key;
                    _this['team_key'] = teamKey;
                };

                /**
                 * Constructs a <code>TeamRobot</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/TeamRobot} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/TeamRobot} The populated <code>TeamRobot</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('year')) {
                            obj['year'] = ApiClient.convertToType(data['year'], 'Number');
                        }
                        if (data.hasOwnProperty('robot_name')) {
                            obj['robot_name'] = ApiClient.convertToType(data['robot_name'], 'String');
                        }
                        if (data.hasOwnProperty('key')) {
                            obj['key'] = ApiClient.convertToType(data['key'], 'String');
                        }
                        if (data.hasOwnProperty('team_key')) {
                            obj['team_key'] = ApiClient.convertToType(data['team_key'], 'String');
                        }
                    }
                    return obj;
                }

                /**
                 * Year this robot competed in.
                 * @member {Number} year
                 */
                exports.prototype['year'] = undefined;
                /**
                 * Name of the robot as provided by the team.
                 * @member {String} robot_name
                 */
                exports.prototype['robot_name'] = undefined;
                /**
                 * Internal TBA identifier for this robot.
                 * @member {String} key
                 */
                exports.prototype['key'] = undefined;
                /**
                 * TBA team key for this robot.
                 * @member {String} team_key
                 */
                exports.prototype['team_key'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9
        }],
        63: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.TeamSimple = factory(root.TbaApiV3client.ApiClient);
                }
            }(this, function (ApiClient) {
                'use strict';




                /**
                 * The TeamSimple model module.
                 * @module TBAAPI.Client/model/TeamSimple
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>TeamSimple</code>.
                 * @alias module:TBAAPI.Client/model/TeamSimple
                 * @class
                 * @param key {String} TBA team key with the format `frcXXXX` with `XXXX` representing the team number.
                 * @param teamNumber {Number} Official team number issued by FIRST.
                 * @param name {String} Official long name registered with FIRST.
                 */
                var exports = function (key, teamNumber, name) {
                    var _this = this;

                    _this['key'] = key;
                    _this['team_number'] = teamNumber;

                    _this['name'] = name;



                };

                /**
                 * Constructs a <code>TeamSimple</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/TeamSimple} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/TeamSimple} The populated <code>TeamSimple</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('key')) {
                            obj['key'] = ApiClient.convertToType(data['key'], 'String');
                        }
                        if (data.hasOwnProperty('team_number')) {
                            obj['team_number'] = ApiClient.convertToType(data['team_number'], 'Number');
                        }
                        if (data.hasOwnProperty('nickname')) {
                            obj['nickname'] = ApiClient.convertToType(data['nickname'], 'String');
                        }
                        if (data.hasOwnProperty('name')) {
                            obj['name'] = ApiClient.convertToType(data['name'], 'String');
                        }
                        if (data.hasOwnProperty('city')) {
                            obj['city'] = ApiClient.convertToType(data['city'], 'String');
                        }
                        if (data.hasOwnProperty('state_prov')) {
                            obj['state_prov'] = ApiClient.convertToType(data['state_prov'], 'String');
                        }
                        if (data.hasOwnProperty('country')) {
                            obj['country'] = ApiClient.convertToType(data['country'], 'String');
                        }
                    }
                    return obj;
                }

                /**
                 * TBA team key with the format `frcXXXX` with `XXXX` representing the team number.
                 * @member {String} key
                 */
                exports.prototype['key'] = undefined;
                /**
                 * Official team number issued by FIRST.
                 * @member {Number} team_number
                 */
                exports.prototype['team_number'] = undefined;
                /**
                 * Team nickname provided by FIRST.
                 * @member {String} nickname
                 */
                exports.prototype['nickname'] = undefined;
                /**
                 * Official long name registered with FIRST.
                 * @member {String} name
                 */
                exports.prototype['name'] = undefined;
                /**
                 * City of team derived from parsing the address registered with FIRST.
                 * @member {String} city
                 */
                exports.prototype['city'] = undefined;
                /**
                 * State of team derived from parsing the address registered with FIRST.
                 * @member {String} state_prov
                 */
                exports.prototype['state_prov'] = undefined;
                /**
                 * Country of team derived from parsing the address registered with FIRST.
                 * @member {String} country
                 */
                exports.prototype['country'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9
        }],
        64: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.WLTRecord = factory(root.TbaApiV3client.ApiClient);
                }
            }(this, function (ApiClient) {
                'use strict';




                /**
                 * The WLTRecord model module.
                 * @module TBAAPI.Client/model/WLTRecord
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>WLTRecord</code>.
                 * A Win-Loss-Tie record for a team, or an alliance.
                 * @alias module:TBAAPI.Client/model/WLTRecord
                 * @class
                 * @param losses {Number} Number of losses.
                 * @param wins {Number} Number of wins.
                 * @param ties {Number} Number of ties.
                 */
                var exports = function (losses, wins, ties) {
                    var _this = this;

                    _this['losses'] = losses;
                    _this['wins'] = wins;
                    _this['ties'] = ties;
                };

                /**
                 * Constructs a <code>WLTRecord</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/WLTRecord} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/WLTRecord} The populated <code>WLTRecord</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('losses')) {
                            obj['losses'] = ApiClient.convertToType(data['losses'], 'Number');
                        }
                        if (data.hasOwnProperty('wins')) {
                            obj['wins'] = ApiClient.convertToType(data['wins'], 'Number');
                        }
                        if (data.hasOwnProperty('ties')) {
                            obj['ties'] = ApiClient.convertToType(data['ties'], 'Number');
                        }
                    }
                    return obj;
                }

                /**
                 * Number of losses.
                 * @member {Number} losses
                 */
                exports.prototype['losses'] = undefined;
                /**
                 * Number of wins.
                 * @member {Number} wins
                 */
                exports.prototype['wins'] = undefined;
                /**
                 * Number of ties.
                 * @member {Number} ties
                 */
                exports.prototype['ties'] = undefined;



                return exports;
            }));



}, {
            "../ApiClient": 9
        }],
        65: [function (require, module, exports) {
            /**
             * The Blue Alliance API v3
             * # Overview    Information and statistics about FIRST Robotics Competition teams and events. If you are looking for the old version (v2) of the API, documentation can be found [here](/apidocs/v2).   # Authentication   All endpoints require an Auth Key to be passed in the header `X-TBA-Auth-Key`. If you do not have an auth key yet, you can obtain one from your [Account Page](/account).    A `User-Agent` header may need to be set to prevent a 403 Unauthorized error.
             *
             * OpenAPI spec version: 3.0.4
             *
             * NOTE: This class is auto generated by the swagger code generator program.
             * https://github.com/swagger-api/swagger-codegen.git
             *
             * Swagger Codegen version: 2.2.3
             *
             * Do not edit the class manually.
             *
             */

            (function (root, factory) {
                if (typeof define === 'function' && define.amd) {
                    // AMD. Register as an anonymous module.
                    define(['TBAAPI.Client/ApiClient'], factory);
                } else if (typeof module === 'object' && module.exports) {
                    // CommonJS-like environments that support module.exports, like Node.
                    module.exports = factory(require('../ApiClient'));
                } else {
                    // Browser globals (root is window)
                    if (!root.TbaApiV3client) {
                        root.TbaApiV3client = {};
                    }
                    root.TbaApiV3client.Webcast = factory(root.TbaApiV3client.ApiClient);
                }
            }(this, function (ApiClient) {
                'use strict';




                /**
                 * The Webcast model module.
                 * @module TBAAPI.Client/model/Webcast
                 * @version 3.0.4
                 */

                /**
                 * Constructs a new <code>Webcast</code>.
                 * @alias module:TBAAPI.Client/model/Webcast
                 * @class
                 * @param type {module:TBAAPI.Client/model/Webcast.TypeEnum} Type of webcast, typically descriptive of the streaming provider.
                 * @param channel {String} Type specific channel information. May be the YouTube stream, or Twitch channel name. In the case of iframe types, contains HTML to embed the stream in an HTML iframe.
                 */
                var exports = function (type, channel) {
                    var _this = this;

                    _this['type'] = type;
                    _this['channel'] = channel;

                };

                /**
                 * Constructs a <code>Webcast</code> from a plain JavaScript object, optionally creating a new instance.
                 * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
                 * @param {Object} data The plain JavaScript object bearing properties of interest.
                 * @param {module:TBAAPI.Client/model/Webcast} obj Optional instance to populate.
                 * @return {module:TBAAPI.Client/model/Webcast} The populated <code>Webcast</code> instance.
                 */
                exports.constructFromObject = function (data, obj) {
                    if (data) {
                        obj = obj || new exports();

                        if (data.hasOwnProperty('type')) {
                            obj['type'] = ApiClient.convertToType(data['type'], 'String');
                        }
                        if (data.hasOwnProperty('channel')) {
                            obj['channel'] = ApiClient.convertToType(data['channel'], 'String');
                        }
                        if (data.hasOwnProperty('file')) {
                            obj['file'] = ApiClient.convertToType(data['file'], 'String');
                        }
                    }
                    return obj;
                }

                /**
                 * Type of webcast, typically descriptive of the streaming provider.
                 * @member {module:TBAAPI.Client/model/Webcast.TypeEnum} type
                 */
                exports.prototype['type'] = undefined;
                /**
                 * Type specific channel information. May be the YouTube stream, or Twitch channel name. In the case of iframe types, contains HTML to embed the stream in an HTML iframe.
                 * @member {String} channel
                 */
                exports.prototype['channel'] = undefined;
                /**
                 * File identification as may be required for some types. May be null.
                 * @member {String} file
                 */
                exports.prototype['file'] = undefined;


                /**
                 * Allowed values for the <code>type</code> property.
                 * @enum {String}
                 * @readonly
                 */
                exports.TypeEnum = {
                    /**
                     * value: "youtube"
                     * @const
                     */
                    "youtube": "youtube",
                    /**
                     * value: "twitch"
                     * @const
                     */
                    "twitch": "twitch",
                    /**
                     * value: "ustream"
                     * @const
                     */
                    "ustream": "ustream",
                    /**
                     * value: "iframe"
                     * @const
                     */
                    "iframe": "iframe",
                    /**
                     * value: "html5"
                     * @const
                     */
                    "html5": "html5",
                    /**
                     * value: "rtmp"
                     * @const
                     */
                    "rtmp": "rtmp",
                    /**
                     * value: "livestream"
                     * @const
                     */
                    "livestream": "livestream"
                };


                return exports;
            }));



}, {
            "../ApiClient": 9
        }],
        66: [function (require, module, exports) {
            'use strict'

            exports.byteLength = byteLength
            exports.toByteArray = toByteArray
            exports.fromByteArray = fromByteArray

            var lookup = []
            var revLookup = []
            var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

            var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
            for (var i = 0, len = code.length; i < len; ++i) {
                lookup[i] = code[i]
                revLookup[code.charCodeAt(i)] = i
            }

            revLookup['-'.charCodeAt(0)] = 62
            revLookup['_'.charCodeAt(0)] = 63

            function placeHoldersCount(b64) {
                var len = b64.length
                if (len % 4 > 0) {
                    throw new Error('Invalid string. Length must be a multiple of 4')
                }

                // the number of equal signs (place holders)
                // if there are two placeholders, than the two characters before it
                // represent one byte
                // if there is only one, then the three characters before it represent 2 bytes
                // this is just a cheap hack to not do indexOf twice
                return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
            }

            function byteLength(b64) {
                // base64 is 4/3 + up to two characters of the original data
                return (b64.length * 3 / 4) - placeHoldersCount(b64)
            }

            function toByteArray(b64) {
                var i, l, tmp, placeHolders, arr
                var len = b64.length
                placeHolders = placeHoldersCount(b64)

                arr = new Arr((len * 3 / 4) - placeHolders)

                // if there are placeholders, only get up to the last complete 4 chars
                l = placeHolders > 0 ? len - 4 : len

                var L = 0

                for (i = 0; i < l; i += 4) {
                    tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
                    arr[L++] = (tmp >> 16) & 0xFF
                    arr[L++] = (tmp >> 8) & 0xFF
                    arr[L++] = tmp & 0xFF
                }

                if (placeHolders === 2) {
                    tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
                    arr[L++] = tmp & 0xFF
                } else if (placeHolders === 1) {
                    tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
                    arr[L++] = (tmp >> 8) & 0xFF
                    arr[L++] = tmp & 0xFF
                }

                return arr
            }

            function tripletToBase64(num) {
                return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
            }

            function encodeChunk(uint8, start, end) {
                var tmp
                var output = []
                for (var i = start; i < end; i += 3) {
                    tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
                    output.push(tripletToBase64(tmp))
                }
                return output.join('')
            }

            function fromByteArray(uint8) {
                var tmp
                var len = uint8.length
                var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
                var output = ''
                var parts = []
                var maxChunkLength = 16383 // must be multiple of 3

                // go through the array every three bytes, we'll deal with trailing stuff later
                for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
                    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
                }

                // pad the end with zeros, but make sure to not forget the extra bytes
                if (extraBytes === 1) {
                    tmp = uint8[len - 1]
                    output += lookup[tmp >> 2]
                    output += lookup[(tmp << 4) & 0x3F]
                    output += '=='
                } else if (extraBytes === 2) {
                    tmp = (uint8[len - 2] << 8) + (uint8[len - 1])
                    output += lookup[tmp >> 10]
                    output += lookup[(tmp >> 4) & 0x3F]
                    output += lookup[(tmp << 2) & 0x3F]
                    output += '='
                }

                parts.push(output)

                return parts.join('')
            }

}, {}],
        67: [function (require, module, exports) {

}, {}],
        68: [function (require, module, exports) {
            /*!
             * The buffer module from node.js, for the browser.
             *
             * @author   Feross Aboukhadijeh <https://feross.org>
             * @license  MIT
             */
            /* eslint-disable no-proto */

            'use strict'

            var base64 = require('base64-js')
            var ieee754 = require('ieee754')

            exports.Buffer = Buffer
            exports.SlowBuffer = SlowBuffer
            exports.INSPECT_MAX_BYTES = 50

            var K_MAX_LENGTH = 0x7fffffff
            exports.kMaxLength = K_MAX_LENGTH

            /**
             * If `Buffer.TYPED_ARRAY_SUPPORT`:
             *   === true    Use Uint8Array implementation (fastest)
             *   === false   Print warning and recommend using `buffer` v4.x which has an Object
             *               implementation (most compatible, even IE6)
             *
             * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
             * Opera 11.6+, iOS 4.2+.
             *
             * We report that the browser does not support typed arrays if the are not subclassable
             * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
             * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
             * for __proto__ and has a buggy typed array implementation.
             */
            Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

            if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
                typeof console.error === 'function') {
                console.error(
                    'This browser lacks typed array (Uint8Array) support which is required by ' +
                    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
                )
            }

            function typedArraySupport() {
                // Can typed array instances can be augmented?
                try {
                    var arr = new Uint8Array(1)
                    arr.__proto__ = {
                        __proto__: Uint8Array.prototype,
                        foo: function () {
                            return 42
                        }
                    }
                    return arr.foo() === 42
                } catch (e) {
                    return false
                }
            }

            function createBuffer(length) {
                if (length > K_MAX_LENGTH) {
                    throw new RangeError('Invalid typed array length')
                }
                // Return an augmented `Uint8Array` instance
                var buf = new Uint8Array(length)
                buf.__proto__ = Buffer.prototype
                return buf
            }

            /**
             * The Buffer constructor returns instances of `Uint8Array` that have their
             * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
             * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
             * and the `Uint8Array` methods. Square bracket notation works as expected -- it
             * returns a single octet.
             *
             * The `Uint8Array` prototype remains unmodified.
             */

            function Buffer(arg, encodingOrOffset, length) {
                // Common case.
                if (typeof arg === 'number') {
                    if (typeof encodingOrOffset === 'string') {
                        throw new Error(
                            'If encoding is specified then the first argument must be a string'
                        )
                    }
                    return allocUnsafe(arg)
                }
                return from(arg, encodingOrOffset, length)
            }

            // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
            if (typeof Symbol !== 'undefined' && Symbol.species &&
                Buffer[Symbol.species] === Buffer) {
                Object.defineProperty(Buffer, Symbol.species, {
                    value: null,
                    configurable: true,
                    enumerable: false,
                    writable: false
                })
            }

            Buffer.poolSize = 8192 // not used by this implementation

            function from(value, encodingOrOffset, length) {
                if (typeof value === 'number') {
                    throw new TypeError('"value" argument must not be a number')
                }

                if (isArrayBuffer(value)) {
                    return fromArrayBuffer(value, encodingOrOffset, length)
                }

                if (typeof value === 'string') {
                    return fromString(value, encodingOrOffset)
                }

                return fromObject(value)
            }

            /**
             * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
             * if value is a number.
             * Buffer.from(str[, encoding])
             * Buffer.from(array)
             * Buffer.from(buffer)
             * Buffer.from(arrayBuffer[, byteOffset[, length]])
             **/
            Buffer.from = function (value, encodingOrOffset, length) {
                return from(value, encodingOrOffset, length)
            }

            // Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
            // https://github.com/feross/buffer/pull/148
            Buffer.prototype.__proto__ = Uint8Array.prototype
            Buffer.__proto__ = Uint8Array

            function assertSize(size) {
                if (typeof size !== 'number') {
                    throw new TypeError('"size" argument must be a number')
                } else if (size < 0) {
                    throw new RangeError('"size" argument must not be negative')
                }
            }

            function alloc(size, fill, encoding) {
                assertSize(size)
                if (size <= 0) {
                    return createBuffer(size)
                }
                if (fill !== undefined) {
                    // Only pay attention to encoding if it's a string. This
                    // prevents accidentally sending in a number that would
                    // be interpretted as a start offset.
                    return typeof encoding === 'string' ?
                        createBuffer(size).fill(fill, encoding) :
                        createBuffer(size).fill(fill)
                }
                return createBuffer(size)
            }

            /**
             * Creates a new filled Buffer instance.
             * alloc(size[, fill[, encoding]])
             **/
            Buffer.alloc = function (size, fill, encoding) {
                return alloc(size, fill, encoding)
            }

            function allocUnsafe(size) {
                assertSize(size)
                return createBuffer(size < 0 ? 0 : checked(size) | 0)
            }

            /**
             * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
             * */
            Buffer.allocUnsafe = function (size) {
                return allocUnsafe(size)
            }
            /**
             * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
             */
            Buffer.allocUnsafeSlow = function (size) {
                return allocUnsafe(size)
            }

            function fromString(string, encoding) {
                if (typeof encoding !== 'string' || encoding === '') {
                    encoding = 'utf8'
                }

                if (!Buffer.isEncoding(encoding)) {
                    throw new TypeError('"encoding" must be a valid string encoding')
                }

                var length = byteLength(string, encoding) | 0
                var buf = createBuffer(length)

                var actual = buf.write(string, encoding)

                if (actual !== length) {
                    // Writing a hex string, for example, that contains invalid characters will
                    // cause everything after the first invalid character to be ignored. (e.g.
                    // 'abxxcd' will be treated as 'ab')
                    buf = buf.slice(0, actual)
                }

                return buf
            }

            function fromArrayLike(array) {
                var length = array.length < 0 ? 0 : checked(array.length) | 0
                var buf = createBuffer(length)
                for (var i = 0; i < length; i += 1) {
                    buf[i] = array[i] & 255
                }
                return buf
            }

            function fromArrayBuffer(array, byteOffset, length) {
                if (byteOffset < 0 || array.byteLength < byteOffset) {
                    throw new RangeError('\'offset\' is out of bounds')
                }

                if (array.byteLength < byteOffset + (length || 0)) {
                    throw new RangeError('\'length\' is out of bounds')
                }

                var buf
                if (byteOffset === undefined && length === undefined) {
                    buf = new Uint8Array(array)
                } else if (length === undefined) {
                    buf = new Uint8Array(array, byteOffset)
                } else {
                    buf = new Uint8Array(array, byteOffset, length)
                }

                // Return an augmented `Uint8Array` instance
                buf.__proto__ = Buffer.prototype
                return buf
            }

            function fromObject(obj) {
                if (Buffer.isBuffer(obj)) {
                    var len = checked(obj.length) | 0
                    var buf = createBuffer(len)

                    if (buf.length === 0) {
                        return buf
                    }

                    obj.copy(buf, 0, 0, len)
                    return buf
                }

                if (obj) {
                    if (isArrayBufferView(obj) || 'length' in obj) {
                        if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
                            return createBuffer(0)
                        }
                        return fromArrayLike(obj)
                    }

                    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
                        return fromArrayLike(obj.data)
                    }
                }

                throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
            }

            function checked(length) {
                // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
                // length is NaN (which is otherwise coerced to zero.)
                if (length >= K_MAX_LENGTH) {
                    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                        'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
                }
                return length | 0
            }

            function SlowBuffer(length) {
                if (+length != length) { // eslint-disable-line eqeqeq
                    length = 0
                }
                return Buffer.alloc(+length)
            }

            Buffer.isBuffer = function isBuffer(b) {
                return b != null && b._isBuffer === true
            }

            Buffer.compare = function compare(a, b) {
                if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
                    throw new TypeError('Arguments must be Buffers')
                }

                if (a === b) return 0

                var x = a.length
                var y = b.length

                for (var i = 0, len = Math.min(x, y); i < len; ++i) {
                    if (a[i] !== b[i]) {
                        x = a[i]
                        y = b[i]
                        break
                    }
                }

                if (x < y) return -1
                if (y < x) return 1
                return 0
            }

            Buffer.isEncoding = function isEncoding(encoding) {
                switch (String(encoding).toLowerCase()) {
                    case 'hex':
                    case 'utf8':
                    case 'utf-8':
                    case 'ascii':
                    case 'latin1':
                    case 'binary':
                    case 'base64':
                    case 'ucs2':
                    case 'ucs-2':
                    case 'utf16le':
                    case 'utf-16le':
                        return true
                    default:
                        return false
                }
            }

            Buffer.concat = function concat(list, length) {
                if (!Array.isArray(list)) {
                    throw new TypeError('"list" argument must be an Array of Buffers')
                }

                if (list.length === 0) {
                    return Buffer.alloc(0)
                }

                var i
                if (length === undefined) {
                    length = 0
                    for (i = 0; i < list.length; ++i) {
                        length += list[i].length
                    }
                }

                var buffer = Buffer.allocUnsafe(length)
                var pos = 0
                for (i = 0; i < list.length; ++i) {
                    var buf = list[i]
                    if (!Buffer.isBuffer(buf)) {
                        throw new TypeError('"list" argument must be an Array of Buffers')
                    }
                    buf.copy(buffer, pos)
                    pos += buf.length
                }
                return buffer
            }

            function byteLength(string, encoding) {
                if (Buffer.isBuffer(string)) {
                    return string.length
                }
                if (isArrayBufferView(string) || isArrayBuffer(string)) {
                    return string.byteLength
                }
                if (typeof string !== 'string') {
                    string = '' + string
                }

                var len = string.length
                if (len === 0) return 0

                // Use a for loop to avoid recursion
                var loweredCase = false
                for (;;) {
                    switch (encoding) {
                        case 'ascii':
                        case 'latin1':
                        case 'binary':
                            return len
                        case 'utf8':
                        case 'utf-8':
                        case undefined:
                            return utf8ToBytes(string).length
                        case 'ucs2':
                        case 'ucs-2':
                        case 'utf16le':
                        case 'utf-16le':
                            return len * 2
                        case 'hex':
                            return len >>> 1
                        case 'base64':
                            return base64ToBytes(string).length
                        default:
                            if (loweredCase) return utf8ToBytes(string).length // assume utf8
                            encoding = ('' + encoding).toLowerCase()
                            loweredCase = true
                    }
                }
            }
            Buffer.byteLength = byteLength

            function slowToString(encoding, start, end) {
                var loweredCase = false

                // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
                // property of a typed array.

                // This behaves neither like String nor Uint8Array in that we set start/end
                // to their upper/lower bounds if the value passed is out of range.
                // undefined is handled specially as per ECMA-262 6th Edition,
                // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
                if (start === undefined || start < 0) {
                    start = 0
                }
                // Return early if start > this.length. Done here to prevent potential uint32
                // coercion fail below.
                if (start > this.length) {
                    return ''
                }

                if (end === undefined || end > this.length) {
                    end = this.length
                }

                if (end <= 0) {
                    return ''
                }

                // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
                end >>>= 0
                start >>>= 0

                if (end <= start) {
                    return ''
                }

                if (!encoding) encoding = 'utf8'

                while (true) {
                    switch (encoding) {
                        case 'hex':
                            return hexSlice(this, start, end)

                        case 'utf8':
                        case 'utf-8':
                            return utf8Slice(this, start, end)

                        case 'ascii':
                            return asciiSlice(this, start, end)

                        case 'latin1':
                        case 'binary':
                            return latin1Slice(this, start, end)

                        case 'base64':
                            return base64Slice(this, start, end)

                        case 'ucs2':
                        case 'ucs-2':
                        case 'utf16le':
                        case 'utf-16le':
                            return utf16leSlice(this, start, end)

                        default:
                            if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
                            encoding = (encoding + '').toLowerCase()
                            loweredCase = true
                    }
                }
            }

            // This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
            // to detect a Buffer instance. It's not possible to use `instanceof Buffer`
            // reliably in a browserify context because there could be multiple different
            // copies of the 'buffer' package in use. This method works even for Buffer
            // instances that were created from another copy of the `buffer` package.
            // See: https://github.com/feross/buffer/issues/154
            Buffer.prototype._isBuffer = true

            function swap(b, n, m) {
                var i = b[n]
                b[n] = b[m]
                b[m] = i
            }

            Buffer.prototype.swap16 = function swap16() {
                var len = this.length
                if (len % 2 !== 0) {
                    throw new RangeError('Buffer size must be a multiple of 16-bits')
                }
                for (var i = 0; i < len; i += 2) {
                    swap(this, i, i + 1)
                }
                return this
            }

            Buffer.prototype.swap32 = function swap32() {
                var len = this.length
                if (len % 4 !== 0) {
                    throw new RangeError('Buffer size must be a multiple of 32-bits')
                }
                for (var i = 0; i < len; i += 4) {
                    swap(this, i, i + 3)
                    swap(this, i + 1, i + 2)
                }
                return this
            }

            Buffer.prototype.swap64 = function swap64() {
                var len = this.length
                if (len % 8 !== 0) {
                    throw new RangeError('Buffer size must be a multiple of 64-bits')
                }
                for (var i = 0; i < len; i += 8) {
                    swap(this, i, i + 7)
                    swap(this, i + 1, i + 6)
                    swap(this, i + 2, i + 5)
                    swap(this, i + 3, i + 4)
                }
                return this
            }

            Buffer.prototype.toString = function toString() {
                var length = this.length
                if (length === 0) return ''
                if (arguments.length === 0) return utf8Slice(this, 0, length)
                return slowToString.apply(this, arguments)
            }

            Buffer.prototype.equals = function equals(b) {
                if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
                if (this === b) return true
                return Buffer.compare(this, b) === 0
            }

            Buffer.prototype.inspect = function inspect() {
                var str = ''
                var max = exports.INSPECT_MAX_BYTES
                if (this.length > 0) {
                    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
                    if (this.length > max) str += ' ... '
                }
                return '<Buffer ' + str + '>'
            }

            Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
                if (!Buffer.isBuffer(target)) {
                    throw new TypeError('Argument must be a Buffer')
                }

                if (start === undefined) {
                    start = 0
                }
                if (end === undefined) {
                    end = target ? target.length : 0
                }
                if (thisStart === undefined) {
                    thisStart = 0
                }
                if (thisEnd === undefined) {
                    thisEnd = this.length
                }

                if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
                    throw new RangeError('out of range index')
                }

                if (thisStart >= thisEnd && start >= end) {
                    return 0
                }
                if (thisStart >= thisEnd) {
                    return -1
                }
                if (start >= end) {
                    return 1
                }

                start >>>= 0
                end >>>= 0
                thisStart >>>= 0
                thisEnd >>>= 0

                if (this === target) return 0

                var x = thisEnd - thisStart
                var y = end - start
                var len = Math.min(x, y)

                var thisCopy = this.slice(thisStart, thisEnd)
                var targetCopy = target.slice(start, end)

                for (var i = 0; i < len; ++i) {
                    if (thisCopy[i] !== targetCopy[i]) {
                        x = thisCopy[i]
                        y = targetCopy[i]
                        break
                    }
                }

                if (x < y) return -1
                if (y < x) return 1
                return 0
            }

            // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
            // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
            //
            // Arguments:
            // - buffer - a Buffer to search
            // - val - a string, Buffer, or number
            // - byteOffset - an index into `buffer`; will be clamped to an int32
            // - encoding - an optional encoding, relevant is val is a string
            // - dir - true for indexOf, false for lastIndexOf
            function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
                // Empty buffer means no match
                if (buffer.length === 0) return -1

                // Normalize byteOffset
                if (typeof byteOffset === 'string') {
                    encoding = byteOffset
                    byteOffset = 0
                } else if (byteOffset > 0x7fffffff) {
                    byteOffset = 0x7fffffff
                } else if (byteOffset < -0x80000000) {
                    byteOffset = -0x80000000
                }
                byteOffset = +byteOffset // Coerce to Number.
                if (numberIsNaN(byteOffset)) {
                    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
                    byteOffset = dir ? 0 : (buffer.length - 1)
                }

                // Normalize byteOffset: negative offsets start from the end of the buffer
                if (byteOffset < 0) byteOffset = buffer.length + byteOffset
                if (byteOffset >= buffer.length) {
                    if (dir) return -1
                    else byteOffset = buffer.length - 1
                } else if (byteOffset < 0) {
                    if (dir) byteOffset = 0
                    else return -1
                }

                // Normalize val
                if (typeof val === 'string') {
                    val = Buffer.from(val, encoding)
                }

                // Finally, search either indexOf (if dir is true) or lastIndexOf
                if (Buffer.isBuffer(val)) {
                    // Special case: looking for empty string/buffer always fails
                    if (val.length === 0) {
                        return -1
                    }
                    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
                } else if (typeof val === 'number') {
                    val = val & 0xFF // Search for a byte value [0-255]
                    if (typeof Uint8Array.prototype.indexOf === 'function') {
                        if (dir) {
                            return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
                        } else {
                            return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
                        }
                    }
                    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
                }

                throw new TypeError('val must be string, number or Buffer')
            }

            function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
                var indexSize = 1
                var arrLength = arr.length
                var valLength = val.length

                if (encoding !== undefined) {
                    encoding = String(encoding).toLowerCase()
                    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
                        encoding === 'utf16le' || encoding === 'utf-16le') {
                        if (arr.length < 2 || val.length < 2) {
                            return -1
                        }
                        indexSize = 2
                        arrLength /= 2
                        valLength /= 2
                        byteOffset /= 2
                    }
                }

                function read(buf, i) {
                    if (indexSize === 1) {
                        return buf[i]
                    } else {
                        return buf.readUInt16BE(i * indexSize)
                    }
                }

                var i
                if (dir) {
                    var foundIndex = -1
                    for (i = byteOffset; i < arrLength; i++) {
                        if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
                            if (foundIndex === -1) foundIndex = i
                            if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
                        } else {
                            if (foundIndex !== -1) i -= i - foundIndex
                            foundIndex = -1
                        }
                    }
                } else {
                    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
                    for (i = byteOffset; i >= 0; i--) {
                        var found = true
                        for (var j = 0; j < valLength; j++) {
                            if (read(arr, i + j) !== read(val, j)) {
                                found = false
                                break
                            }
                        }
                        if (found) return i
                    }
                }

                return -1
            }

            Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
                return this.indexOf(val, byteOffset, encoding) !== -1
            }

            Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
                return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
            }

            Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
                return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
            }

            function hexWrite(buf, string, offset, length) {
                offset = Number(offset) || 0
                var remaining = buf.length - offset
                if (!length) {
                    length = remaining
                } else {
                    length = Number(length)
                    if (length > remaining) {
                        length = remaining
                    }
                }

                // must be an even number of digits
                var strLen = string.length
                if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

                if (length > strLen / 2) {
                    length = strLen / 2
                }
                for (var i = 0; i < length; ++i) {
                    var parsed = parseInt(string.substr(i * 2, 2), 16)
                    if (numberIsNaN(parsed)) return i
                    buf[offset + i] = parsed
                }
                return i
            }

            function utf8Write(buf, string, offset, length) {
                return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
            }

            function asciiWrite(buf, string, offset, length) {
                return blitBuffer(asciiToBytes(string), buf, offset, length)
            }

            function latin1Write(buf, string, offset, length) {
                return asciiWrite(buf, string, offset, length)
            }

            function base64Write(buf, string, offset, length) {
                return blitBuffer(base64ToBytes(string), buf, offset, length)
            }

            function ucs2Write(buf, string, offset, length) {
                return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
            }

            Buffer.prototype.write = function write(string, offset, length, encoding) {
                // Buffer#write(string)
                if (offset === undefined) {
                    encoding = 'utf8'
                    length = this.length
                    offset = 0
                    // Buffer#write(string, encoding)
                } else if (length === undefined && typeof offset === 'string') {
                    encoding = offset
                    length = this.length
                    offset = 0
                    // Buffer#write(string, offset[, length][, encoding])
                } else if (isFinite(offset)) {
                    offset = offset >>> 0
                    if (isFinite(length)) {
                        length = length >>> 0
                        if (encoding === undefined) encoding = 'utf8'
                    } else {
                        encoding = length
                        length = undefined
                    }
                } else {
                    throw new Error(
                        'Buffer.write(string, encoding, offset[, length]) is no longer supported'
                    )
                }

                var remaining = this.length - offset
                if (length === undefined || length > remaining) length = remaining

                if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
                    throw new RangeError('Attempt to write outside buffer bounds')
                }

                if (!encoding) encoding = 'utf8'

                var loweredCase = false
                for (;;) {
                    switch (encoding) {
                        case 'hex':
                            return hexWrite(this, string, offset, length)

                        case 'utf8':
                        case 'utf-8':
                            return utf8Write(this, string, offset, length)

                        case 'ascii':
                            return asciiWrite(this, string, offset, length)

                        case 'latin1':
                        case 'binary':
                            return latin1Write(this, string, offset, length)

                        case 'base64':
                            // Warning: maxLength not taken into account in base64Write
                            return base64Write(this, string, offset, length)

                        case 'ucs2':
                        case 'ucs-2':
                        case 'utf16le':
                        case 'utf-16le':
                            return ucs2Write(this, string, offset, length)

                        default:
                            if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
                            encoding = ('' + encoding).toLowerCase()
                            loweredCase = true
                    }
                }
            }

            Buffer.prototype.toJSON = function toJSON() {
                return {
                    type: 'Buffer',
                    data: Array.prototype.slice.call(this._arr || this, 0)
                }
            }

            function base64Slice(buf, start, end) {
                if (start === 0 && end === buf.length) {
                    return base64.fromByteArray(buf)
                } else {
                    return base64.fromByteArray(buf.slice(start, end))
                }
            }

            function utf8Slice(buf, start, end) {
                end = Math.min(buf.length, end)
                var res = []

                var i = start
                while (i < end) {
                    var firstByte = buf[i]
                    var codePoint = null
                    var bytesPerSequence = (firstByte > 0xEF) ? 4 :
                        (firstByte > 0xDF) ? 3 :
                        (firstByte > 0xBF) ? 2 :
                        1

                    if (i + bytesPerSequence <= end) {
                        var secondByte, thirdByte, fourthByte, tempCodePoint

                        switch (bytesPerSequence) {
                            case 1:
                                if (firstByte < 0x80) {
                                    codePoint = firstByte
                                }
                                break
                            case 2:
                                secondByte = buf[i + 1]
                                if ((secondByte & 0xC0) === 0x80) {
                                    tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
                                    if (tempCodePoint > 0x7F) {
                                        codePoint = tempCodePoint
                                    }
                                }
                                break
                            case 3:
                                secondByte = buf[i + 1]
                                thirdByte = buf[i + 2]
                                if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                                    tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
                                    if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                                        codePoint = tempCodePoint
                                    }
                                }
                                break
                            case 4:
                                secondByte = buf[i + 1]
                                thirdByte = buf[i + 2]
                                fourthByte = buf[i + 3]
                                if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                                    tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
                                    if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                                        codePoint = tempCodePoint
                                    }
                                }
                        }
                    }

                    if (codePoint === null) {
                        // we did not generate a valid codePoint so insert a
                        // replacement char (U+FFFD) and advance only 1 byte
                        codePoint = 0xFFFD
                        bytesPerSequence = 1
                    } else if (codePoint > 0xFFFF) {
                        // encode to utf16 (surrogate pair dance)
                        codePoint -= 0x10000
                        res.push(codePoint >>> 10 & 0x3FF | 0xD800)
                        codePoint = 0xDC00 | codePoint & 0x3FF
                    }

                    res.push(codePoint)
                    i += bytesPerSequence
                }

                return decodeCodePointsArray(res)
            }

            // Based on http://stackoverflow.com/a/22747272/680742, the browser with
            // the lowest limit is Chrome, with 0x10000 args.
            // We go 1 magnitude less, for safety
            var MAX_ARGUMENTS_LENGTH = 0x1000

            function decodeCodePointsArray(codePoints) {
                var len = codePoints.length
                if (len <= MAX_ARGUMENTS_LENGTH) {
                    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
                }

                // Decode in chunks to avoid "call stack size exceeded".
                var res = ''
                var i = 0
                while (i < len) {
                    res += String.fromCharCode.apply(
                        String,
                        codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
                    )
                }
                return res
            }

            function asciiSlice(buf, start, end) {
                var ret = ''
                end = Math.min(buf.length, end)

                for (var i = start; i < end; ++i) {
                    ret += String.fromCharCode(buf[i] & 0x7F)
                }
                return ret
            }

            function latin1Slice(buf, start, end) {
                var ret = ''
                end = Math.min(buf.length, end)

                for (var i = start; i < end; ++i) {
                    ret += String.fromCharCode(buf[i])
                }
                return ret
            }

            function hexSlice(buf, start, end) {
                var len = buf.length

                if (!start || start < 0) start = 0
                if (!end || end < 0 || end > len) end = len

                var out = ''
                for (var i = start; i < end; ++i) {
                    out += toHex(buf[i])
                }
                return out
            }

            function utf16leSlice(buf, start, end) {
                var bytes = buf.slice(start, end)
                var res = ''
                for (var i = 0; i < bytes.length; i += 2) {
                    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
                }
                return res
            }

            Buffer.prototype.slice = function slice(start, end) {
                var len = this.length
                start = ~~start
                end = end === undefined ? len : ~~end

                if (start < 0) {
                    start += len
                    if (start < 0) start = 0
                } else if (start > len) {
                    start = len
                }

                if (end < 0) {
                    end += len
                    if (end < 0) end = 0
                } else if (end > len) {
                    end = len
                }

                if (end < start) end = start

                var newBuf = this.subarray(start, end)
                // Return an augmented `Uint8Array` instance
                newBuf.__proto__ = Buffer.prototype
                return newBuf
            }

            /*
             * Need to make sure that buffer isn't trying to write out of bounds.
             */
            function checkOffset(offset, ext, length) {
                if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
                if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
            }

            Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
                offset = offset >>> 0
                byteLength = byteLength >>> 0
                if (!noAssert) checkOffset(offset, byteLength, this.length)

                var val = this[offset]
                var mul = 1
                var i = 0
                while (++i < byteLength && (mul *= 0x100)) {
                    val += this[offset + i] * mul
                }

                return val
            }

            Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
                offset = offset >>> 0
                byteLength = byteLength >>> 0
                if (!noAssert) {
                    checkOffset(offset, byteLength, this.length)
                }

                var val = this[offset + --byteLength]
                var mul = 1
                while (byteLength > 0 && (mul *= 0x100)) {
                    val += this[offset + --byteLength] * mul
                }

                return val
            }

            Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
                offset = offset >>> 0
                if (!noAssert) checkOffset(offset, 1, this.length)
                return this[offset]
            }

            Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
                offset = offset >>> 0
                if (!noAssert) checkOffset(offset, 2, this.length)
                return this[offset] | (this[offset + 1] << 8)
            }

            Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
                offset = offset >>> 0
                if (!noAssert) checkOffset(offset, 2, this.length)
                return (this[offset] << 8) | this[offset + 1]
            }

            Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
                offset = offset >>> 0
                if (!noAssert) checkOffset(offset, 4, this.length)

                return ((this[offset]) |
                        (this[offset + 1] << 8) |
                        (this[offset + 2] << 16)) +
                    (this[offset + 3] * 0x1000000)
            }

            Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
                offset = offset >>> 0
                if (!noAssert) checkOffset(offset, 4, this.length)

                return (this[offset] * 0x1000000) +
                    ((this[offset + 1] << 16) |
                        (this[offset + 2] << 8) |
                        this[offset + 3])
            }

            Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
                offset = offset >>> 0
                byteLength = byteLength >>> 0
                if (!noAssert) checkOffset(offset, byteLength, this.length)

                var val = this[offset]
                var mul = 1
                var i = 0
                while (++i < byteLength && (mul *= 0x100)) {
                    val += this[offset + i] * mul
                }
                mul *= 0x80

                if (val >= mul) val -= Math.pow(2, 8 * byteLength)

                return val
            }

            Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
                offset = offset >>> 0
                byteLength = byteLength >>> 0
                if (!noAssert) checkOffset(offset, byteLength, this.length)

                var i = byteLength
                var mul = 1
                var val = this[offset + --i]
                while (i > 0 && (mul *= 0x100)) {
                    val += this[offset + --i] * mul
                }
                mul *= 0x80

                if (val >= mul) val -= Math.pow(2, 8 * byteLength)

                return val
            }

            Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
                offset = offset >>> 0
                if (!noAssert) checkOffset(offset, 1, this.length)
                if (!(this[offset] & 0x80)) return (this[offset])
                return ((0xff - this[offset] + 1) * -1)
            }

            Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
                offset = offset >>> 0
                if (!noAssert) checkOffset(offset, 2, this.length)
                var val = this[offset] | (this[offset + 1] << 8)
                return (val & 0x8000) ? val | 0xFFFF0000 : val
            }

            Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
                offset = offset >>> 0
                if (!noAssert) checkOffset(offset, 2, this.length)
                var val = this[offset + 1] | (this[offset] << 8)
                return (val & 0x8000) ? val | 0xFFFF0000 : val
            }

            Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
                offset = offset >>> 0
                if (!noAssert) checkOffset(offset, 4, this.length)

                return (this[offset]) |
                    (this[offset + 1] << 8) |
                    (this[offset + 2] << 16) |
                    (this[offset + 3] << 24)
            }

            Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
                offset = offset >>> 0
                if (!noAssert) checkOffset(offset, 4, this.length)

                return (this[offset] << 24) |
                    (this[offset + 1] << 16) |
                    (this[offset + 2] << 8) |
                    (this[offset + 3])
            }

            Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
                offset = offset >>> 0
                if (!noAssert) checkOffset(offset, 4, this.length)
                return ieee754.read(this, offset, true, 23, 4)
            }

            Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
                offset = offset >>> 0
                if (!noAssert) checkOffset(offset, 4, this.length)
                return ieee754.read(this, offset, false, 23, 4)
            }

            Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
                offset = offset >>> 0
                if (!noAssert) checkOffset(offset, 8, this.length)
                return ieee754.read(this, offset, true, 52, 8)
            }

            Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
                offset = offset >>> 0
                if (!noAssert) checkOffset(offset, 8, this.length)
                return ieee754.read(this, offset, false, 52, 8)
            }

            function checkInt(buf, value, offset, ext, max, min) {
                if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
                if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
                if (offset + ext > buf.length) throw new RangeError('Index out of range')
            }

            Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
                value = +value
                offset = offset >>> 0
                byteLength = byteLength >>> 0
                if (!noAssert) {
                    var maxBytes = Math.pow(2, 8 * byteLength) - 1
                    checkInt(this, value, offset, byteLength, maxBytes, 0)
                }

                var mul = 1
                var i = 0
                this[offset] = value & 0xFF
                while (++i < byteLength && (mul *= 0x100)) {
                    this[offset + i] = (value / mul) & 0xFF
                }

                return offset + byteLength
            }

            Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
                value = +value
                offset = offset >>> 0
                byteLength = byteLength >>> 0
                if (!noAssert) {
                    var maxBytes = Math.pow(2, 8 * byteLength) - 1
                    checkInt(this, value, offset, byteLength, maxBytes, 0)
                }

                var i = byteLength - 1
                var mul = 1
                this[offset + i] = value & 0xFF
                while (--i >= 0 && (mul *= 0x100)) {
                    this[offset + i] = (value / mul) & 0xFF
                }

                return offset + byteLength
            }

            Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
                value = +value
                offset = offset >>> 0
                if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
                this[offset] = (value & 0xff)
                return offset + 1
            }

            Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
                value = +value
                offset = offset >>> 0
                if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
                this[offset] = (value & 0xff)
                this[offset + 1] = (value >>> 8)
                return offset + 2
            }

            Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
                value = +value
                offset = offset >>> 0
                if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
                this[offset] = (value >>> 8)
                this[offset + 1] = (value & 0xff)
                return offset + 2
            }

            Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
                value = +value
                offset = offset >>> 0
                if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
                this[offset + 3] = (value >>> 24)
                this[offset + 2] = (value >>> 16)
                this[offset + 1] = (value >>> 8)
                this[offset] = (value & 0xff)
                return offset + 4
            }

            Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
                value = +value
                offset = offset >>> 0
                if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
                this[offset] = (value >>> 24)
                this[offset + 1] = (value >>> 16)
                this[offset + 2] = (value >>> 8)
                this[offset + 3] = (value & 0xff)
                return offset + 4
            }

            Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
                value = +value
                offset = offset >>> 0
                if (!noAssert) {
                    var limit = Math.pow(2, (8 * byteLength) - 1)

                    checkInt(this, value, offset, byteLength, limit - 1, -limit)
                }

                var i = 0
                var mul = 1
                var sub = 0
                this[offset] = value & 0xFF
                while (++i < byteLength && (mul *= 0x100)) {
                    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
                        sub = 1
                    }
                    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
                }

                return offset + byteLength
            }

            Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
                value = +value
                offset = offset >>> 0
                if (!noAssert) {
                    var limit = Math.pow(2, (8 * byteLength) - 1)

                    checkInt(this, value, offset, byteLength, limit - 1, -limit)
                }

                var i = byteLength - 1
                var mul = 1
                var sub = 0
                this[offset + i] = value & 0xFF
                while (--i >= 0 && (mul *= 0x100)) {
                    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
                        sub = 1
                    }
                    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
                }

                return offset + byteLength
            }

            Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
                value = +value
                offset = offset >>> 0
                if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
                if (value < 0) value = 0xff + value + 1
                this[offset] = (value & 0xff)
                return offset + 1
            }

            Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
                value = +value
                offset = offset >>> 0
                if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
                this[offset] = (value & 0xff)
                this[offset + 1] = (value >>> 8)
                return offset + 2
            }

            Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
                value = +value
                offset = offset >>> 0
                if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
                this[offset] = (value >>> 8)
                this[offset + 1] = (value & 0xff)
                return offset + 2
            }

            Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
                value = +value
                offset = offset >>> 0
                if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
                this[offset] = (value & 0xff)
                this[offset + 1] = (value >>> 8)
                this[offset + 2] = (value >>> 16)
                this[offset + 3] = (value >>> 24)
                return offset + 4
            }

            Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
                value = +value
                offset = offset >>> 0
                if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
                if (value < 0) value = 0xffffffff + value + 1
                this[offset] = (value >>> 24)
                this[offset + 1] = (value >>> 16)
                this[offset + 2] = (value >>> 8)
                this[offset + 3] = (value & 0xff)
                return offset + 4
            }

            function checkIEEE754(buf, value, offset, ext, max, min) {
                if (offset + ext > buf.length) throw new RangeError('Index out of range')
                if (offset < 0) throw new RangeError('Index out of range')
            }

            function writeFloat(buf, value, offset, littleEndian, noAssert) {
                value = +value
                offset = offset >>> 0
                if (!noAssert) {
                    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
                }
                ieee754.write(buf, value, offset, littleEndian, 23, 4)
                return offset + 4
            }

            Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
                return writeFloat(this, value, offset, true, noAssert)
            }

            Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
                return writeFloat(this, value, offset, false, noAssert)
            }

            function writeDouble(buf, value, offset, littleEndian, noAssert) {
                value = +value
                offset = offset >>> 0
                if (!noAssert) {
                    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
                }
                ieee754.write(buf, value, offset, littleEndian, 52, 8)
                return offset + 8
            }

            Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
                return writeDouble(this, value, offset, true, noAssert)
            }

            Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
                return writeDouble(this, value, offset, false, noAssert)
            }

            // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
            Buffer.prototype.copy = function copy(target, targetStart, start, end) {
                if (!start) start = 0
                if (!end && end !== 0) end = this.length
                if (targetStart >= target.length) targetStart = target.length
                if (!targetStart) targetStart = 0
                if (end > 0 && end < start) end = start

                // Copy 0 bytes; we're done
                if (end === start) return 0
                if (target.length === 0 || this.length === 0) return 0

                // Fatal error conditions
                if (targetStart < 0) {
                    throw new RangeError('targetStart out of bounds')
                }
                if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
                if (end < 0) throw new RangeError('sourceEnd out of bounds')

                // Are we oob?
                if (end > this.length) end = this.length
                if (target.length - targetStart < end - start) {
                    end = target.length - targetStart + start
                }

                var len = end - start
                var i

                if (this === target && start < targetStart && targetStart < end) {
                    // descending copy from end
                    for (i = len - 1; i >= 0; --i) {
                        target[i + targetStart] = this[i + start]
                    }
                } else if (len < 1000) {
                    // ascending copy from start
                    for (i = 0; i < len; ++i) {
                        target[i + targetStart] = this[i + start]
                    }
                } else {
                    Uint8Array.prototype.set.call(
                        target,
                        this.subarray(start, start + len),
                        targetStart
                    )
                }

                return len
            }

            // Usage:
            //    buffer.fill(number[, offset[, end]])
            //    buffer.fill(buffer[, offset[, end]])
            //    buffer.fill(string[, offset[, end]][, encoding])
            Buffer.prototype.fill = function fill(val, start, end, encoding) {
                // Handle string cases:
                if (typeof val === 'string') {
                    if (typeof start === 'string') {
                        encoding = start
                        start = 0
                        end = this.length
                    } else if (typeof end === 'string') {
                        encoding = end
                        end = this.length
                    }
                    if (val.length === 1) {
                        var code = val.charCodeAt(0)
                        if (code < 256) {
                            val = code
                        }
                    }
                    if (encoding !== undefined && typeof encoding !== 'string') {
                        throw new TypeError('encoding must be a string')
                    }
                    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
                        throw new TypeError('Unknown encoding: ' + encoding)
                    }
                } else if (typeof val === 'number') {
                    val = val & 255
                }

                // Invalid ranges are not set to a default, so can range check early.
                if (start < 0 || this.length < start || this.length < end) {
                    throw new RangeError('Out of range index')
                }

                if (end <= start) {
                    return this
                }

                start = start >>> 0
                end = end === undefined ? this.length : end >>> 0

                if (!val) val = 0

                var i
                if (typeof val === 'number') {
                    for (i = start; i < end; ++i) {
                        this[i] = val
                    }
                } else {
                    var bytes = Buffer.isBuffer(val) ?
                        val :
                        new Buffer(val, encoding)
                    var len = bytes.length
                    for (i = 0; i < end - start; ++i) {
                        this[i + start] = bytes[i % len]
                    }
                }

                return this
            }

            // HELPER FUNCTIONS
            // ================

            var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

            function base64clean(str) {
                // Node strips out invalid characters like \n and \t from the string, base64-js does not
                str = str.trim().replace(INVALID_BASE64_RE, '')
                // Node converts strings with length < 2 to ''
                if (str.length < 2) return ''
                // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
                while (str.length % 4 !== 0) {
                    str = str + '='
                }
                return str
            }

            function toHex(n) {
                if (n < 16) return '0' + n.toString(16)
                return n.toString(16)
            }

            function utf8ToBytes(string, units) {
                units = units || Infinity
                var codePoint
                var length = string.length
                var leadSurrogate = null
                var bytes = []

                for (var i = 0; i < length; ++i) {
                    codePoint = string.charCodeAt(i)

                    // is surrogate component
                    if (codePoint > 0xD7FF && codePoint < 0xE000) {
                        // last char was a lead
                        if (!leadSurrogate) {
                            // no lead yet
                            if (codePoint > 0xDBFF) {
                                // unexpected trail
                                if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
                                continue
                            } else if (i + 1 === length) {
                                // unpaired lead
                                if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
                                continue
                            }

                            // valid lead
                            leadSurrogate = codePoint

                            continue
                        }

                        // 2 leads in a row
                        if (codePoint < 0xDC00) {
                            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
                            leadSurrogate = codePoint
                            continue
                        }

                        // valid surrogate pair
                        codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
                    } else if (leadSurrogate) {
                        // valid bmp char, but last char was a lead
                        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
                    }

                    leadSurrogate = null

                    // encode utf8
                    if (codePoint < 0x80) {
                        if ((units -= 1) < 0) break
                        bytes.push(codePoint)
                    } else if (codePoint < 0x800) {
                        if ((units -= 2) < 0) break
                        bytes.push(
                            codePoint >> 0x6 | 0xC0,
                            codePoint & 0x3F | 0x80
                        )
                    } else if (codePoint < 0x10000) {
                        if ((units -= 3) < 0) break
                        bytes.push(
                            codePoint >> 0xC | 0xE0,
                            codePoint >> 0x6 & 0x3F | 0x80,
                            codePoint & 0x3F | 0x80
                        )
                    } else if (codePoint < 0x110000) {
                        if ((units -= 4) < 0) break
                        bytes.push(
                            codePoint >> 0x12 | 0xF0,
                            codePoint >> 0xC & 0x3F | 0x80,
                            codePoint >> 0x6 & 0x3F | 0x80,
                            codePoint & 0x3F | 0x80
                        )
                    } else {
                        throw new Error('Invalid code point')
                    }
                }

                return bytes
            }

            function asciiToBytes(str) {
                var byteArray = []
                for (var i = 0; i < str.length; ++i) {
                    // Node's code seems to be doing this and not & 0x7F..
                    byteArray.push(str.charCodeAt(i) & 0xFF)
                }
                return byteArray
            }

            function utf16leToBytes(str, units) {
                var c, hi, lo
                var byteArray = []
                for (var i = 0; i < str.length; ++i) {
                    if ((units -= 2) < 0) break

                    c = str.charCodeAt(i)
                    hi = c >> 8
                    lo = c % 256
                    byteArray.push(lo)
                    byteArray.push(hi)
                }

                return byteArray
            }

            function base64ToBytes(str) {
                return base64.toByteArray(base64clean(str))
            }

            function blitBuffer(src, dst, offset, length) {
                for (var i = 0; i < length; ++i) {
                    if ((i + offset >= dst.length) || (i >= src.length)) break
                    dst[i + offset] = src[i]
                }
                return i
            }

            // ArrayBuffers from another context (i.e. an iframe) do not pass the `instanceof` check
            // but they should be treated as valid. See: https://github.com/feross/buffer/issues/166
            function isArrayBuffer(obj) {
                return obj instanceof ArrayBuffer ||
                    (obj != null && obj.constructor != null && obj.constructor.name === 'ArrayBuffer' &&
                        typeof obj.byteLength === 'number')
            }

            // Node 0.10 supports `ArrayBuffer` but lacks `ArrayBuffer.isView`
            function isArrayBufferView(obj) {
                return (typeof ArrayBuffer.isView === 'function') && ArrayBuffer.isView(obj)
            }

            function numberIsNaN(obj) {
                return obj !== obj // eslint-disable-line no-self-compare
            }

}, {
            "base64-js": 66,
            "ieee754": 69
        }],
        69: [function (require, module, exports) {
            exports.read = function (buffer, offset, isLE, mLen, nBytes) {
                var e, m
                var eLen = nBytes * 8 - mLen - 1
                var eMax = (1 << eLen) - 1
                var eBias = eMax >> 1
                var nBits = -7
                var i = isLE ? (nBytes - 1) : 0
                var d = isLE ? -1 : 1
                var s = buffer[offset + i]

                i += d

                e = s & ((1 << (-nBits)) - 1)
                s >>= (-nBits)
                nBits += eLen
                for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

                m = e & ((1 << (-nBits)) - 1)
                e >>= (-nBits)
                nBits += mLen
                for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

                if (e === 0) {
                    e = 1 - eBias
                } else if (e === eMax) {
                    return m ? NaN : ((s ? -1 : 1) * Infinity)
                } else {
                    m = m + Math.pow(2, mLen)
                    e = e - eBias
                }
                return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
            }

            exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
                var e, m, c
                var eLen = nBytes * 8 - mLen - 1
                var eMax = (1 << eLen) - 1
                var eBias = eMax >> 1
                var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
                var i = isLE ? 0 : (nBytes - 1)
                var d = isLE ? 1 : -1
                var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

                value = Math.abs(value)

                if (isNaN(value) || value === Infinity) {
                    m = isNaN(value) ? 1 : 0
                    e = eMax
                } else {
                    e = Math.floor(Math.log(value) / Math.LN2)
                    if (value * (c = Math.pow(2, -e)) < 1) {
                        e--
                        c *= 2
                    }
                    if (e + eBias >= 1) {
                        value += rt / c
                    } else {
                        value += rt * Math.pow(2, 1 - eBias)
                    }
                    if (value * c >= 2) {
                        e++
                        c /= 2
                    }

                    if (e + eBias >= eMax) {
                        m = 0
                        e = eMax
                    } else if (e + eBias >= 1) {
                        m = (value * c - 1) * Math.pow(2, mLen)
                        e = e + eBias
                    } else {
                        m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
                        e = 0
                    }
                }

                for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

                e = (e << mLen) | m
                eLen += mLen
                for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

                buffer[offset + i - d] |= s * 128
            }

}, {}],
        70: [function (require, module, exports) {
            // Copyright Joyent, Inc. and other Node contributors.
            //
            // Permission is hereby granted, free of charge, to any person obtaining a
            // copy of this software and associated documentation files (the
            // "Software"), to deal in the Software without restriction, including
            // without limitation the rights to use, copy, modify, merge, publish,
            // distribute, sublicense, and/or sell copies of the Software, and to permit
            // persons to whom the Software is furnished to do so, subject to the
            // following conditions:
            //
            // The above copyright notice and this permission notice shall be included
            // in all copies or substantial portions of the Software.
            //
            // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
            // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
            // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
            // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
            // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
            // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
            // USE OR OTHER DEALINGS IN THE SOFTWARE.

            'use strict';

            // If obj.hasOwnProperty has been overridden, then calling
            // obj.hasOwnProperty(prop) will break.
            // See: https://github.com/joyent/node/issues/1707
            function hasOwnProperty(obj, prop) {
                return Object.prototype.hasOwnProperty.call(obj, prop);
            }

            module.exports = function (qs, sep, eq, options) {
                sep = sep || '&';
                eq = eq || '=';
                var obj = {};

                if (typeof qs !== 'string' || qs.length === 0) {
                    return obj;
                }

                var regexp = /\+/g;
                qs = qs.split(sep);

                var maxKeys = 1000;
                if (options && typeof options.maxKeys === 'number') {
                    maxKeys = options.maxKeys;
                }

                var len = qs.length;
                // maxKeys <= 0 means that we should not limit keys count
                if (maxKeys > 0 && len > maxKeys) {
                    len = maxKeys;
                }

                for (var i = 0; i < len; ++i) {
                    var x = qs[i].replace(regexp, '%20'),
                        idx = x.indexOf(eq),
                        kstr, vstr, k, v;

                    if (idx >= 0) {
                        kstr = x.substr(0, idx);
                        vstr = x.substr(idx + 1);
                    } else {
                        kstr = x;
                        vstr = '';
                    }

                    k = decodeURIComponent(kstr);
                    v = decodeURIComponent(vstr);

                    if (!hasOwnProperty(obj, k)) {
                        obj[k] = v;
                    } else if (isArray(obj[k])) {
                        obj[k].push(v);
                    } else {
                        obj[k] = [obj[k], v];
                    }
                }

                return obj;
            };

            var isArray = Array.isArray || function (xs) {
                return Object.prototype.toString.call(xs) === '[object Array]';
            };

}, {}],
        71: [function (require, module, exports) {
            // Copyright Joyent, Inc. and other Node contributors.
            //
            // Permission is hereby granted, free of charge, to any person obtaining a
            // copy of this software and associated documentation files (the
            // "Software"), to deal in the Software without restriction, including
            // without limitation the rights to use, copy, modify, merge, publish,
            // distribute, sublicense, and/or sell copies of the Software, and to permit
            // persons to whom the Software is furnished to do so, subject to the
            // following conditions:
            //
            // The above copyright notice and this permission notice shall be included
            // in all copies or substantial portions of the Software.
            //
            // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
            // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
            // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
            // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
            // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
            // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
            // USE OR OTHER DEALINGS IN THE SOFTWARE.

            'use strict';

            var stringifyPrimitive = function (v) {
                switch (typeof v) {
                    case 'string':
                        return v;

                    case 'boolean':
                        return v ? 'true' : 'false';

                    case 'number':
                        return isFinite(v) ? v : '';

                    default:
                        return '';
                }
            };

            module.exports = function (obj, sep, eq, name) {
                sep = sep || '&';
                eq = eq || '=';
                if (obj === null) {
                    obj = undefined;
                }

                if (typeof obj === 'object') {
                    return map(objectKeys(obj), function (k) {
                        var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
                        if (isArray(obj[k])) {
                            return map(obj[k], function (v) {
                                return ks + encodeURIComponent(stringifyPrimitive(v));
                            }).join(sep);
                        } else {
                            return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
                        }
                    }).join(sep);

                }

                if (!name) return '';
                return encodeURIComponent(stringifyPrimitive(name)) + eq +
                    encodeURIComponent(stringifyPrimitive(obj));
            };

            var isArray = Array.isArray || function (xs) {
                return Object.prototype.toString.call(xs) === '[object Array]';
            };

            function map(xs, f) {
                if (xs.map) return xs.map(f);
                var res = [];
                for (var i = 0; i < xs.length; i++) {
                    res.push(f(xs[i], i));
                }
                return res;
            }

            var objectKeys = Object.keys || function (obj) {
                var res = [];
                for (var key in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
                }
                return res;
            };

}, {}],
        72: [function (require, module, exports) {
            'use strict';

            exports.decode = exports.parse = require('./decode');
            exports.encode = exports.stringify = require('./encode');

}, {
            "./decode": 70,
            "./encode": 71
        }]
    }, {}, [16])(16)
});
