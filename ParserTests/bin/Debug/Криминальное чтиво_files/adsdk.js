(function(root) {
    var setTimeoutFunc = setTimeout;
    function noop() {}
    var asap = typeof setImmediate === "function" && setImmediate || function(fn) {
        setTimeoutFunc(fn, 1);
    };
    function bind(fn, thisArg) {
        return function() {
            fn.apply(thisArg, arguments);
        };
    }
    var isArray = Array.isArray || function(value) {
        return Object.prototype.toString.call(value) === "[object Array]";
    };
    function Promise(fn) {
        if (typeof this !== "object") throw new TypeError("Promises must be constructed via new");
        if (typeof fn !== "function") throw new TypeError("not a function");
        this._state = 0;
        this._value = undefined;
        this._deferreds = [];
        doResolve(fn, this);
    }
    function handle(self, deferred) {
        while (self._state === 3) {
            self = self._value;
        }
        if (self._state === 0) {
            self._deferreds.push(deferred);
            return;
        }
        asap(function() {
            var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
            if (cb === null) {
                (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
                return;
            }
            var ret;
            try {
                ret = cb(self._value);
            } catch (e) {
                reject(deferred.promise, e);
                return;
            }
            resolve(deferred.promise, ret);
        });
    }
    function resolve(self, newValue) {
        try {
            if (newValue === self) throw new TypeError("A promise cannot be resolved with itself.");
            if (newValue && (typeof newValue === "object" || typeof newValue === "function")) {
                var then = newValue.then;
                if (newValue instanceof Promise) {
                    self._state = 3;
                    self._value = newValue;
                    finale(self);
                    return;
                } else if (typeof then === "function") {
                    doResolve(bind(then, newValue), self);
                    return;
                }
            }
            self._state = 1;
            self._value = newValue;
            finale(self);
        } catch (e) {
            reject(self, e);
        }
    }
    function reject(self, newValue) {
        self._state = 2;
        self._value = newValue;
        finale(self);
    }
    function finale(self) {
        for (var i = 0, len = self._deferreds.length; i < len; i++) {
            handle(self, self._deferreds[i]);
        }
        self._deferreds = null;
    }
    function Handler(onFulfilled, onRejected, promise) {
        this.onFulfilled = typeof onFulfilled === "function" ? onFulfilled : null;
        this.onRejected = typeof onRejected === "function" ? onRejected : null;
        this.promise = promise;
    }
    function doResolve(fn, self) {
        var done = false;
        try {
            fn(function(value) {
                if (done) return;
                done = true;
                resolve(self, value);
            }, function(reason) {
                if (done) return;
                done = true;
                reject(self, reason);
            });
        } catch (ex) {
            if (done) return;
            done = true;
            reject(self, ex);
        }
    }
    Promise.prototype["catch"] = function(onRejected) {
        return this.then(null, onRejected);
    };
    Promise.prototype.then = function(onFulfilled, onRejected) {
        var prom = new Promise(noop);
        handle(this, new Handler(onFulfilled, onRejected, prom));
        return prom;
    };
    Promise.all = function() {
        var args = Array.prototype.slice.call(arguments.length === 1 && isArray(arguments[0]) ? arguments[0] : arguments);
        return new Promise(function(resolve, reject) {
            if (args.length === 0) return resolve([]);
            var remaining = args.length;
            function res(i, val) {
                try {
                    if (val && (typeof val === "object" || typeof val === "function")) {
                        var then = val.then;
                        if (typeof then === "function") {
                            then.call(val, function(val) {
                                res(i, val);
                            }, reject);
                            return;
                        }
                    }
                    args[i] = val;
                    if (--remaining === 0) {
                        resolve(args);
                    }
                } catch (ex) {
                    reject(ex);
                }
            }
            for (var i = 0; i < args.length; i++) {
                res(i, args[i]);
            }
        });
    };
    Promise.resolve = function(value) {
        if (value && typeof value === "object" && value.constructor === Promise) {
            return value;
        }
        return new Promise(function(resolve) {
            resolve(value);
        });
    };
    Promise.reject = function(value) {
        return new Promise(function(resolve, reject) {
            reject(value);
        });
    };
    Promise.race = function(values) {
        return new Promise(function(resolve, reject) {
            for (var i = 0, len = values.length; i < len; i++) {
                values[i].then(resolve, reject);
            }
        });
    };
    Promise._setImmediateFn = function _setImmediateFn(fn) {
        asap = fn;
    };
    if (typeof module !== "undefined" && module.exports) {
        module.exports = Promise;
    } else if (!root.Promise) {
        root.Promise = Promise;
    }
})(this);

(function(window) {
    var ya = window.ya || (window.ya = {});
    (function(window) {
        "use strict";
        if (!window.ya) {
            window.ya = {};
        }
        if (!window.ya.videoAd) {
            window.ya.videoAd = {};
        }
        if (!window.ya.mediaAd) {
            window.ya.mediaAd = {};
        }
        var NS = window.ya.mediaAd;
        if (NS.DOMAIN === undefined) {
            NS.DOMAIN = "yastatic.net";
        }
        if (NS.SDK_VERSION === undefined) {
            NS.SDK_VERSION = "1.0-254";
        }
        if (NS.SDK_FULL_VERSION === undefined) {
            NS.SDK_FULL_VERSION = "js:" + NS.SDK_VERSION;
        }
        if (NS.SDK_URL_VERSION === undefined) {
            NS.SDK_URL_VERSION = window.ya.mediaAd.SDK_VERSION.split("-")[0].split(".").join("_") + "/v-" + window.ya.mediaAd.SDK_VERSION;
        }
    })(window);
    (function(doc) {
        "use strict";
        var pollute = true, api, vendor, apis = {
            w3: {
                enabled: "fullscreenEnabled",
                element: "fullscreenElement",
                request: "requestFullscreen",
                exit: "exitFullscreen",
                events: {
                    change: "fullscreenchange",
                    error: "fullscreenerror"
                }
            },
            webkit: {
                enabled: "webkitIsFullScreen",
                element: "webkitCurrentFullScreenElement",
                request: "webkitRequestFullScreen",
                exit: "webkitCancelFullScreen",
                events: {
                    change: "webkitfullscreenchange",
                    error: "webkitfullscreenerror"
                }
            },
            moz: {
                enabled: "mozFullScreen",
                element: "mozFullScreenElement",
                request: "mozRequestFullScreen",
                exit: "mozCancelFullScreen",
                events: {
                    change: "mozfullscreenchange",
                    error: "mozfullscreenerror"
                }
            },
            ms: {
                enabled: "msFullscreenEnabled",
                element: "msFullscreenElement",
                request: "msRequestFullscreen",
                exit: "msExitFullscreen",
                events: {
                    change: "MSFullscreenChange",
                    error: "MSFullscreenError"
                }
            }
        }, w3 = apis.w3;
        for (vendor in apis) {
            if (apis[vendor].enabled in doc) {
                api = apis[vendor];
                break;
            }
        }
        function dispatch(type, target) {
            var event = doc.createEvent("Event");
            event.initEvent(type, true, false);
            target.dispatchEvent(event);
        }
        function handleChange(e) {
            doc[w3.enabled] = doc[api.enabled];
            doc[w3.element] = doc[api.element];
            dispatch(w3.events.change, e.target);
        }
        function handleError(e) {
            dispatch(w3.events.error, e.target);
        }
        if (pollute && !(w3.enabled in doc) && api) {
            doc.addEventListener(api.events.change, handleChange, false);
            doc.addEventListener(api.events.error, handleError, false);
            doc[w3.enabled] = doc[api.enabled];
            doc[w3.element] = doc[api.element];
            doc[w3.exit] = doc[api.exit];
            Element.prototype[w3.request] = function() {
                return this[api.request].apply(this, arguments);
            };
        }
        return api;
    })(document);
    var require, define;
    (function() {
        var modules = {}, factories = {};
        (require = function(id) {
            if (id.pop) id = id[0];
            var m = modules[id];
            if (!m) {
                m = {
                    id: id,
                    exports: {}
                };
                modules[id] = m.module = m;
                var factory = factories[id];
                if (factory) {
                    m.exports = factory.apply(m, factory.deps.map(m.require = function(id) {
                        return m[id] || require(rel(id, m.id));
                    })) || m.exports;
                } else {
                    throw new Error("hazelnut.js factory is not defined: " + id);
                }
            }
            return m.exports;
        }).config = valueOf;
        (define = function(id, deps, factory) {
            (factories[id] = typeof (factory = factory || deps) !== "function" ? function() {
                return factory;
            } : factory).deps = deps.pop ? deps : [];
        }).amd = {};
        function rel(name, path) {
            name = name.replace(/^(?:\.\/|(\.\.\/))/, path.replace(/[^\/]+$/g, "") + "$1");
            while (name !== (name = name.replace(/[^\/]+\/\.\.\/?/g, ""))) ;
            return name;
        }
    })();
    var __extends = this && this.__extends || function(d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() {
            this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    define("util/net", [ "require", "exports", "util/util" ], function(require, exports, util_1) {
        "use strict";
        var DEFAULT_ERROR_URL = "//awaps.yandex.ru/65/218/0.gif", mediaAd = ya.mediaAd;
        function appendVersion(url) {
            if (!util_1.isTrueYandexDomain(url)) {
                return url;
            }
            var qChar = url.indexOf("?") > -1 ? "&" : "?";
            return "" + url + qChar + "video-api-version=" + encodeURIComponent(mediaAd.SDK_FULL_VERSION);
        }
        exports.appendVersion = appendVersion;
        mediaAd.setDefaultUrlScheme = function(sheme) {
            var allowedShemes = [ "http", "https" ];
            if (allowedShemes.indexOf(sheme) < 0) {
                throw new Error("AdSDK setDefaultUrlScheme error. Allowed: " + allowedShemes.join(", "));
            }
            mediaAd.util.URL_SCHEME = sheme;
        };
        function fixUrlSheme(url) {
            if (url.trim().substr(0, 2) === "//" && mediaAd.util.URL_SCHEME) {
                url = mediaAd.util.URL_SCHEME + url;
            }
            return url;
        }
        exports.fixUrlSheme = fixUrlSheme;
        var NetworkError = function(_super) {
            __extends(NetworkError, _super);
            function NetworkError() {
                _super.apply(this, arguments);
            }
            return NetworkError;
        }(Error);
        function load(url, data, timeout) {
            return new Promise(function(resolve, reject) {
                var xmlHttp = new XMLHttpRequest();
                xmlHttp.open("GET", fixUrlSheme(url));
                xmlHttp.timeout = typeof timeout === "number" ? timeout : 0;
                xmlHttp.withCredentials = true;
                xmlHttp.ontimeout = function() {
                    var error = new NetworkError("HTTP timeout error");
                    error.isTimeoutError = true;
                    reject(error);
                };
                function fireError(error) {
                    reject(error);
                }
                xmlHttp.onerror = function() {
                    var error = new Error("XHROnError " + xmlHttp.statusText + ": " + url);
                    error.id = xmlHttp.status;
                    fireError(error);
                };
                xmlHttp.onreadystatechange = function() {
                    if (xmlHttp.readyState !== 4) {
                        return;
                    }
                    if (xmlHttp.status === 0) {
                        return;
                    }
                    if (xmlHttp.status !== 200) {
                        var error = new Error(xmlHttp.statusText);
                        error.id = xmlHttp.status;
                        error.message += ": " + url;
                        fireError(error);
                        return;
                    }
                    resolve(xmlHttp.responseXML);
                };
                try {
                    xmlHttp.send(data);
                } catch (e) {
                    e.message += ": " + url;
                    fireError(e);
                }
            });
        }
        exports.load = load;
        function knock(urls) {
            if (!Array.isArray(urls)) {
                return;
            }
            urls.forEach(function(url) {
                return new Image().src = fixUrlSheme(appendVersion(url));
            });
        }
        exports.knock = knock;
        function trackError(error, urls) {
            if (urls === void 0) {
                urls = [];
            }
            var errorData = [], preparedUrls = [];
            var errorId = error.hasOwnProperty("id") ? encodeURIComponent(error.id.toString()) : "0";
            errorData.push("errcode=" + errorId);
            errorData.push("subsection=" + errorId);
            if (typeof error.message === "string" && error.message.length > 0) {
                errorData.push("errstring=" + encodeURIComponent(error.message));
            }
            urls = urls.concat([ DEFAULT_ERROR_URL ]);
            for (var i = 0, len = urls.length; i < len; i++) {
                var url = urls[i];
                var qChar = url.indexOf("?") > -1 ? "&" : "?";
                preparedUrls.push("" + url + qChar + errorData.join("&"));
            }
            knock(preparedUrls);
        }
        exports.trackError = trackError;
    });
    define("util/util", [ "require", "exports", "util/net" ], function(require, exports, net_1) {
        "use strict";
        var YANDEX_DOMAINS = [ "yandex.ru", "yandex.com", "yandex.net", "yandex.com.tr", "yandex.ua", "yandex.by", "yandex.kz", "yastatic.net", "yandex.st", "yandex-team.ru", "yandex-team.com", "yandex-team.com.ua", "yandex-team.net.ua", "yandex-team.com.tr", "ya.ru" ], YANDEX_FRIENDS_DOMAINS = [ "kinopoisk.ru", "kinopoisk.ua", "kinopoisk.by", "kinopoisk.tel", "vidigital.ru", "tns-counter.ru", "adfox.ru" ];
        function log(message) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (ya.mediaAd.DEV_MODE && console && console.log) {
                console.log.apply(console, [ message ].concat(args));
            }
        }
        exports.log = log;
        function fireCallback(callback) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (!callback) {
                return;
            }
            if (typeof callback === "function") {
                callback.apply(void 0, args);
            } else if (callback && callback.hasOwnProperty("length")) {
                var callbacks = callback;
                callbacks.forEach(function(callbackFunction) {
                    return callbackFunction.apply(void 0, args);
                });
            }
        }
        exports.fireCallback = fireCallback;
        function waitForDocumentEvents(events, callback) {
            var receiver = function() {
                events.forEach(function(event) {
                    return document.removeEventListener(event, receiver);
                });
                callback();
            };
            events.forEach(function(event) {
                return document.addEventListener(event, receiver);
            });
        }
        exports.waitForDocumentEvents = waitForDocumentEvents;
        function endsWith(input, suffix) {
            return suffix === input.substring(input.length - suffix.length);
        }
        exports.endsWith = endsWith;
        function getDomainFromUrl(url) {
            if (!url) {
                return "";
            }
            var aNode = document.createElement("a");
            aNode.setAttribute("href", url);
            return aNode.hostname;
        }
        exports.getDomainFromUrl = getDomainFromUrl;
        function isTrueYandexDomain(url) {
            return isYandexDomain(url, true);
        }
        exports.isTrueYandexDomain = isTrueYandexDomain;
        function isYandexDomain(url, ignoreFriends) {
            if (ignoreFriends === void 0) {
                ignoreFriends = false;
            }
            if (!url) {
                return false;
            }
            var domain = getDomainFromUrl(url), domains = ignoreFriends ? YANDEX_DOMAINS : YANDEX_DOMAINS.concat(YANDEX_FRIENDS_DOMAINS);
            if (!domain || domain.length === 0) {
                return false;
            }
            for (var i = 0, len = domains.length; i < len; i++) {
                var yaDomain = domains[i];
                if (endsWith(domain, yaDomain)) {
                    return true;
                }
            }
            return false;
        }
        exports.isYandexDomain = isYandexDomain;
        function createVideoNode(containerElement, sourceOrSources, poster, autoplay) {
            var videoNode = document.createElement("video");
            videoNode.id = "yaVideoPlayer_" + Math.floor(Math.random() * 1e6);
            videoNode.setAttribute("x-webkit-airplay", "allow");
            if (Array.isArray(sourceOrSources)) {
                sourceOrSources.forEach(function(source) {
                    var sourceNode = document.createElement("source");
                    sourceNode.src = net_1.fixUrlSheme(source.src);
                    sourceNode.type = source.type;
                    videoNode.appendChild(sourceNode);
                });
            } else if (sourceOrSources) {
                videoNode.src = net_1.fixUrlSheme(sourceOrSources);
            }
            if (poster) {
                videoNode.poster = poster;
            }
            videoNode.autoplay = !!autoplay;
            videoNode.preload = autoplay ? "auto" : "none";
            if (containerElement.firstChild) {
                containerElement.insertBefore(videoNode, containerElement.firstChild);
            } else {
                containerElement.appendChild(videoNode);
            }
            return videoNode;
        }
        exports.createVideoNode = createVideoNode;
        var FF_MIN_FLASH_VERSION = "20.0.0.306";
        function isBlockedFlash() {
            if (isFirefox()) {
                var mimeTypes = window.navigator.mimeTypes;
                if (mimeTypes.hasOwnProperty("application/x-shockwave-flash")) {
                    var flash = mimeTypes["application/x-shockwave-flash"];
                    if (flash.enabledPlugin && flash.enabledPlugin.version) {
                        var version = flash.enabledPlugin.version.split(".").map(function(n) {
                            return parseInt(n, 10);
                        });
                        if (version.length === 4) {
                            var min = FF_MIN_FLASH_VERSION.split(".").map(function(n) {
                                return parseInt(n, 10);
                            });
                            for (var key = 0; key < 4; key++) {
                                if (version[key] < min[key]) {
                                    return true;
                                } else if (version[key] > min[key]) {
                                    return false;
                                }
                            }
                        }
                    }
                }
            }
            return false;
        }
        exports.isBlockedFlash = isBlockedFlash;
        function isFirefox() {
            return window.navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
        }
        exports.isFirefox = isFirefox;
        function isTouchDevice() {
            return "ontouchstart" in window || window.navigator.maxTouchPoints > 0 || window.navigator.msMaxTouchPoints > 0;
        }
        exports.isTouchDevice = isTouchDevice;
        function isIPhone() {
            return navigator.userAgent.toLowerCase().indexOf("iphone") > -1;
        }
        exports.isIPhone = isIPhone;
        function isIOSWebView() {
            return /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(window.navigator.userAgent);
        }
        exports.isIOSWebView = isIOSWebView;
        function isIPad() {
            return navigator.platform.indexOf("iPad") > -1;
        }
        exports.isIPad = isIPad;
        function isAndroid() {
            return navigator.userAgent.toLowerCase().indexOf("android") > -1;
        }
        exports.isAndroid = isAndroid;
        function isIOS() {
            var userAgent = navigator.userAgent.toLowerCase();
            return userAgent.indexOf("iphone") > -1 || userAgent.indexOf("ipad") > -1 || userAgent.indexOf("ipod") > -1;
        }
        exports.isIOS = isIOS;
        function isIOS7() {
            return isIOS() && getIOSVersion() === 7;
        }
        exports.isIOS7 = isIOS7;
        function getIOSVersion() {
            if (/iP(hone|od|ad)/.test(navigator.platform)) {
                var v = navigator.appVersion.match(/OS (\d+)_(\d+)_?(\d+)?/);
                return parseInt(v[1], 10);
            }
        }
        exports.getIOSVersion = getIOSVersion;
        function parseVASTTime(timeString) {
            if (timeString.search(/^\d{2}:\d{2}:\d{2}(\.\d{1,3})?$/) === -1) {
                return NaN;
            }
            var skipTimeParts = timeString.trim().split(":");
            if (skipTimeParts.length < 2 || skipTimeParts.length > 3) {
                return NaN;
            }
            var msParts = skipTimeParts[skipTimeParts.length - 1].split(".");
            var value = 0;
            if (msParts.length === 2) {
                value = +msParts[1] / 1e3;
            }
            if (skipTimeParts.length === 2) {
                value += +skipTimeParts[0] * 60 + +skipTimeParts[1];
            } else {
                value += +skipTimeParts[0] * 3600 + +skipTimeParts[1] * 60 + +skipTimeParts[2];
            }
            return value;
        }
        exports.parseVASTTime = parseVASTTime;
        function createDiv(className, innerHtml) {
            var div = document.createElement("div");
            div.className = className;
            if (innerHtml) {
                div.innerHTML = innerHtml;
            }
            return div;
        }
        exports.createDiv = createDiv;
        function createControl(elementClass, clickHandler, text, parent) {
            var element = createDiv(elementClass, text);
            element.addEventListener("click", clickHandler);
            if (parent) {
                parent.appendChild(element);
            }
            return element;
        }
        exports.createControl = createControl;
        function getElement(elementOrElementId) {
            return typeof elementOrElementId === "string" ? document.getElementById(elementOrElementId) : elementOrElementId;
        }
        exports.getElement = getElement;
        function getReferrer() {
            var href;
            try {
                href = top.location.href;
            } catch (ex) {
                href = location.href;
            }
            return href;
        }
        exports.getReferrer = getReferrer;
        function addTouchSafeMouseEnterHandler(element, handler) {
            var isOver = false;
            var lastMoveHandler;
            element.addEventListener("mousemove", function(overEvent) {
                if (lastMoveHandler) {
                    return;
                }
                lastMoveHandler = function onMouseMove(moveEvent) {
                    if (!isOver && (moveEvent.clientX !== overEvent.clientX || moveEvent.clientY !== overEvent.clientY)) {
                        isOver = true;
                        handler(overEvent);
                        element.removeEventListener("mousemove", onMouseMove);
                        lastMoveHandler = null;
                    }
                };
                element.addEventListener("mousemove", lastMoveHandler);
                setTimeout(function() {
                    if (!lastMoveHandler) {
                        return;
                    }
                    element.removeEventListener("mousemove", lastMoveHandler);
                    lastMoveHandler = null;
                }, 250);
            });
            element.addEventListener("mouseleave", function() {
                isOver = false;
            });
        }
        exports.addTouchSafeMouseEnterHandler = addTouchSafeMouseEnterHandler;
        var Timer = function() {
            function Timer(time) {
                this.time = time;
                this.isFired = false;
            }
            Timer.prototype.setup = function() {
                var _this = this;
                if (this.promise === undefined) {
                    this.promise = new Promise(function(resolve) {
                        _this.id = setTimeout(function() {
                            _this.isFired = true;
                            resolve();
                        }, _this.time);
                    });
                }
                return this.promise;
            };
            Timer.prototype.stop = function() {
                if (this.id !== undefined) {
                    clearTimeout(this.id);
                    this.id = undefined;
                }
            };
            return Timer;
        }();
        exports.Timer = Timer;
        function addBuiltinSkin() {
            var style = document.querySelector("style[data-yamediaad]");
            if (style) {
                return;
            }
            style = document.createElement("style");
            style.setAttribute("data-yamediaad", "");
            style.innerHTML = ya.mediaAd.DEFAULT_CSS;
            document.querySelector("head").appendChild(style);
        }
        exports.addBuiltinSkin = addBuiltinSkin;
        ya.mediaAd.util = ya.mediaAd.util || {};
        ya.mediaAd.util.isIOS = isIOS;
        ya.mediaAd.util.isTouchDevice = isTouchDevice;
    });
    define("adsdk/error/VideoError", [ "require", "exports" ], function(require, exports) {
        "use strict";
        var VideoError = function(_super) {
            __extends(VideoError, _super);
            function VideoError(id, message) {
                _super.call(this, message);
                this.id = id;
            }
            VideoError.NO_APPROPRIATE_VIDEO_SOURCE = 52;
            VideoError.FETCHING_ABORTED = 101;
            VideoError.NETWORK_ERROR = 102;
            VideoError.DECODE_ERROR = 103;
            VideoError.SRC_NOT_SUPPORTED = 104;
            VideoError.VIDEO_ERROR = 10;
            return VideoError;
        }(Error);
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = VideoError;
    });
    define("util/EventBus", [ "require", "exports" ], function(require, exports) {
        "use strict";
        var EventBus = function() {
            function EventBus() {
                this.resetEventBus();
            }
            EventBus.toEventsArr = function(event, func) {
                var eventsArr = [];
                if (typeof event === "string") {
                    eventsArr.push({
                        name: event,
                        callback: func
                    });
                } else if (event instanceof Array) {
                    for (var key in event) {
                        if (event.hasOwnProperty(key)) {
                            if (typeof func !== "function") {
                                throw new Error("You MUST pass callback in the second parameter with eventsName array");
                            }
                            if (event.hasOwnProperty(key)) {
                                eventsArr.push({
                                    name: event[key],
                                    callback: func
                                });
                            }
                        }
                    }
                } else if (typeof event === "object") {
                    for (var key in event) {
                        if (event.hasOwnProperty(key)) {
                            eventsArr.push({
                                name: key,
                                callback: event[key]
                            });
                        }
                    }
                } else {
                    throw new Error("Event name MUST be a string");
                }
                return eventsArr;
            };
            EventBus.addEvent = function(eventsStore, event) {
                var name = event.name, callback = event.callback;
                if (typeof callback !== "function") {
                    throw new Error("Event listener MUST be a function");
                }
                if (!eventsStore[name]) {
                    eventsStore[name] = [];
                }
                if (eventsStore[name].indexOf(callback) === -1) {
                    eventsStore[name].push(callback);
                }
            };
            EventBus.addEvents = function(eventsStore, eventsArr) {
                for (var key in eventsArr) {
                    if (eventsArr.hasOwnProperty(key)) {
                        EventBus.addEvent(eventsStore, eventsArr[key]);
                    }
                }
            };
            EventBus.offCallbackByCallbacks = function(callbacksArr, callback) {
                if (!callbacksArr) {
                    return;
                }
                var index = callbacksArr.indexOf(callback);
                if (index !== -1) {
                    callbacksArr.splice(index, 1);
                }
            };
            EventBus.prototype.resetEventBus = function() {
                this._events = {
                    on: {},
                    once: {}
                };
                return this;
            };
            EventBus.prototype.on = function(event, func) {
                EventBus.addEvents(this._events.on, EventBus.toEventsArr(event, func));
                return this;
            };
            EventBus.prototype.once = function(event, func) {
                EventBus.addEvents(this._events.once, EventBus.toEventsArr(event, func));
                return this;
            };
            EventBus.prototype.when = function(event) {
                var _this = this;
                return new Promise(function(resolve) {
                    if (typeof event === "string") {
                        _this.once(event, function(param) {
                            return resolve(param);
                        });
                    } else if (event instanceof Array) {
                        for (var key in event) {
                            if (event.hasOwnProperty(key)) {
                                _this.once(event[key], function(param) {
                                    return resolve(param);
                                });
                            }
                        }
                    } else {
                        throw new Error('EventBus "when" method can take a string on string array parameter');
                    }
                });
            };
            EventBus.prototype.off = function(event, func) {
                this.offEvents(EventBus.toEventsArr(event, func));
                return this;
            };
            EventBus.prototype.emit = function(event, param) {
                if (typeof event === "string") {
                    this.emitEvent(event, param);
                } else if (event instanceof Array) {
                    for (var x in event) {
                        if (event.hasOwnProperty(x)) {
                            this.emitEvent(event[x], param);
                        }
                    }
                } else if (typeof event === "object") {
                    for (var i in event) {
                        if (event.hasOwnProperty(i)) {
                            this.emitEvent(i, event[i]);
                        }
                    }
                }
                return this;
            };
            EventBus.prototype.reemit = function(eventBus, event) {
                var _this = this;
                var events = event instanceof Array ? event : [ event ];
                for (var key in events) {
                    if (events.hasOwnProperty(key)) {
                        (function(eventName) {
                            return eventBus.on(eventName, function(param) {
                                return _this.emit(eventName, param);
                            });
                        })(events[key]);
                    }
                }
                return this;
            };
            EventBus.prototype.offEvents = function(eventsArr) {
                for (var key in eventsArr) {
                    if (eventsArr.hasOwnProperty(key)) {
                        var _a = eventsArr[key], name_1 = _a.name, callback = _a.callback;
                        EventBus.offCallbackByCallbacks(this._events.on[name_1], callback);
                        EventBus.offCallbackByCallbacks(this._events.once[name_1], callback);
                    }
                }
            };
            EventBus.prototype.emitEvent = function(name, param) {
                this.emitEvents(this._events.on[name], param);
                this.emitEvents(this._events.once[name], param);
                this._events.once[name] = undefined;
            };
            EventBus.prototype.emitEvents = function(callbacksArr, param) {
                if (!callbacksArr) {
                    return;
                }
                for (var key in callbacksArr) {
                    if (callbacksArr.hasOwnProperty(key)) {
                        callbacksArr[key].apply(this, [ param ]);
                    }
                }
            };
            return EventBus;
        }();
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = EventBus;
    });
    define("adsdk/VideoState", [ "require", "exports" ], function(require, exports) {
        "use strict";
        var VideoState = function() {
            function VideoState(videoNode) {
                this.src = videoNode.currentSrc;
                this.controls = videoNode.controls;
                this.poster = videoNode.poster;
            }
            VideoState.prototype.applyTo = function(videoNode) {
                videoNode.src = this.src || "";
                videoNode.controls = this.controls;
                videoNode.poster = this.poster;
            };
            return VideoState;
        }();
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = VideoState;
    });
    define("adsdk/VideoNodeController", [ "require", "exports", "adsdk/error/VideoError", "util/EventBus", "adsdk/VideoState" ], function(require, exports, VideoError_1, EventBus_1, VideoState_1) {
        "use strict";
        var MUTE_DURATION = 1e3;
        var UNMUTE_DURATION = 400;
        var VideoNodeController = function(_super) {
            __extends(VideoNodeController, _super);
            function VideoNodeController(videoNode) {
                _super.call(this);
                this.videoNode = videoNode;
                this.lastMutedValue = false;
                this.isFullscreen = false;
                this.isStarted = false;
                this.justStarted = false;
                this.isLagging = false;
                this._muted = false;
                this.init();
            }
            VideoNodeController.prototype.resetState = function() {
                this.isStarted = false;
                this.isLagging = false;
                if (this.timeUpdateIntervalId) {
                    clearInterval(this.timeUpdateIntervalId);
                    this.timeUpdateIntervalId = 0;
                }
            };
            VideoNodeController.prototype.play = function() {
                var _this = this;
                this.resetState();
                var abortHandler = function() {
                    _this.videoNode.removeEventListener("abort", abortHandler);
                    setTimeout(function() {
                        return _this.videoNode.play();
                    }, 0);
                };
                this.videoNode.addEventListener("abort", abortHandler);
                this.resume();
            };
            VideoNodeController.prototype.getVideoState = function() {
                return new VideoState_1.default(this.videoNode);
            };
            VideoNodeController.prototype.setVideoState = function(videoState) {
                this.resetState();
                this.videoNode.autoplay = false;
                videoState.applyTo(this.videoNode);
            };
            VideoNodeController.prototype.resume = function() {
                this.videoNode.autoplay = true;
                this.videoNode.preload = "auto";
                this.videoNode.play();
            };
            VideoNodeController.prototype.pause = function() {
                this.videoNode.pause();
            };
            VideoNodeController.prototype.setMute = function(value, fade) {
                if (fade === void 0) {
                    fade = false;
                }
                this._muted = value;
                if (fade) {
                    this.muteWithFade(value);
                } else {
                    this.videoNode.muted = value;
                    this.videoNode.volume = value ? 0 : 1;
                }
            };
            VideoNodeController.prototype.setSrc = function(src) {
                this.videoNode.src = src;
            };
            VideoNodeController.prototype.getWidth = function() {
                return this.videoNode.clientWidth;
            };
            VideoNodeController.prototype.getHeight = function() {
                return this.videoNode.clientHeight;
            };
            VideoNodeController.prototype.setVisibleControls = function(visible) {
                this.videoNode.controls = visible;
            };
            VideoNodeController.prototype.setPoster = function(poster) {
                this.videoNode.poster = poster;
            };
            VideoNodeController.prototype.getVideoNodeError = function() {
                var error = new VideoError_1.default(VideoError_1.default.VIDEO_ERROR, "Cannot play the video source");
                if (this.videoNode.error) {
                    switch (this.videoNode.error.code) {
                      case MediaError.MEDIA_ERR_ABORTED:
                        error = new VideoError_1.default(VideoError_1.default.FETCHING_ABORTED, "The fetching process for the video resource was aborted by the user agent");
                        break;

                      case MediaError.MEDIA_ERR_NETWORK:
                        error = new VideoError_1.default(VideoError_1.default.NETWORK_ERROR, "A network error occurred");
                        break;

                      case MediaError.MEDIA_ERR_DECODE:
                        error = new VideoError_1.default(VideoError_1.default.DECODE_ERROR, "An error occurred while decoding the video resource");
                        break;

                      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                        error = new VideoError_1.default(VideoError_1.default.SRC_NOT_SUPPORTED, "The 'src=" + this.videoNode.currentSrc + "' attribute was not suitable");
                        break;
                    }
                }
                return error;
            };
            VideoNodeController.prototype.init = function() {
                var _this = this;
                var videoNode = this.videoNode;
                this._muted = this.lastMutedValue = videoNode.muted;
                videoNode.addEventListener("click", function(event) {
                    _this.emit("click", event);
                });
                var canplayHandler = function() {
                    if (_this.isLagging || _this.justStarted) {
                        _this.isLagging = false;
                        _this.justStarted = false;
                    }
                };
                var fullscreenChangeHandler = function() {
                    if (document.fullscreenEnabled) {
                        if (document.fullscreenElement === videoNode) {
                            _this.isFullscreen = true;
                            _this.emit("fullscreen");
                        }
                    } else if (_this.isFullscreen) {
                        _this.isFullscreen = false;
                        _this.emit("exitFullscreen");
                    }
                };
                var timeupdateHandler = function() {
                    _this.emit("currentPositionChange", {
                        currentTime: videoNode.currentTime,
                        duration: videoNode.duration
                    });
                };
                {
                    var checkInterval_1 = 100;
                    var lastPlayPos_1 = 0;
                    var currentPlayPos_1 = 0;
                    var bufferingDetected_1 = false;
                    var checkBuffering = function() {
                        currentPlayPos_1 = _this.videoNode.currentTime;
                        var offset = 1 / checkInterval_1;
                        if (!bufferingDetected_1 && currentPlayPos_1 < lastPlayPos_1 + offset && !_this.videoNode.paused) {
                            _this.emit("bufferEmpty");
                            bufferingDetected_1 = true;
                        }
                        if (bufferingDetected_1 && currentPlayPos_1 > lastPlayPos_1 + offset && !_this.videoNode.paused) {
                            _this.emit("bufferFull");
                            bufferingDetected_1 = false;
                        }
                        lastPlayPos_1 = currentPlayPos_1;
                    };
                    setInterval(checkBuffering, checkInterval_1);
                }
                var handlers = [ {
                    name: "error",
                    handler: function() {
                        return _this.emit("error", _this.getVideoNodeError());
                    }
                }, {
                    name: "waiting",
                    handler: function() {
                        if (!_this.isStarted || _this.justStarted) {
                            return;
                        }
                        _this.isLagging = true;
                    }
                }, {
                    name: "timeupdate",
                    handler: timeupdateHandler
                }, {
                    name: "play",
                    handler: function() {
                        if (!_this.timeUpdateIntervalId) {
                            _this.timeUpdateIntervalId = setInterval(timeupdateHandler, 500);
                        }
                        _this.justStarted = true;
                        if (!_this.isStarted) {
                            _this.isStarted = true;
                            _this.emit("start");
                        } else {
                            _this.emit("resume");
                        }
                    }
                }, {
                    name: "canplay",
                    handler: canplayHandler
                }, {
                    name: "playing",
                    handler: function() {
                        _this.lastMutedValue = videoNode.muted;
                        canplayHandler();
                        _this.emit("playing");
                    }
                }, {
                    name: "ended",
                    handler: function() {
                        _this.resetState();
                        _this.emit("complete");
                    }
                }, {
                    name: "pause",
                    handler: function() {
                        if (videoNode.currentTime === videoNode.duration) {
                            return;
                        }
                        _this.emit("pause");
                    }
                }, {
                    name: "volumechange",
                    handler: function() {
                        if (_this.lastMutedValue !== videoNode.muted) {
                            _this.lastMutedValue = videoNode.muted;
                            _this.emit("muteChange", videoNode.muted);
                        }
                    }
                }, {
                    name: "fullscreenchange",
                    handler: fullscreenChangeHandler,
                    target: window.document
                } ];
                handlers.forEach(function(_a) {
                    var target = _a.target, name = _a.name, handler = _a.handler;
                    (target ? target : videoNode).addEventListener(name, handler);
                });
                fullscreenChangeHandler();
                this.destroy = function() {
                    _this.resetState();
                    handlers.forEach(function(_a) {
                        var target = _a.target, name = _a.name, handler = _a.handler;
                        (target ? target : videoNode).removeEventListener(name, handler);
                    });
                    videoNode.pause();
                    videoNode.src = "";
                    _this.destroy = null;
                };
            };
            VideoNodeController.prototype.muteWithFade = function(muted) {
                var _this = this;
                if (this.muteIntervalId) {
                    clearInterval(this.muteIntervalId);
                }
                var time = new Date().getTime();
                var initialValue = this.videoNode.volume;
                var valueToChange = muted ? 0 : 1;
                var duration = Math.abs((muted ? MUTE_DURATION : UNMUTE_DURATION) * (initialValue - valueToChange));
                if (duration === 0) {
                    return;
                }
                this.videoNode.muted = false;
                this.muteIntervalId = setInterval(function() {
                    var timeStep = (new Date().getTime() - time) / duration;
                    _this.videoNode.volume = muted ? Math.max(valueToChange, (1 - timeStep) * (initialValue - valueToChange)) : Math.min(valueToChange, timeStep * (valueToChange - initialValue));
                    if (timeStep >= 1) {
                        clearInterval(_this.muteIntervalId);
                        _this.muteIntervalId = 0;
                        if (muted) {
                            _this.videoNode.muted = true;
                        }
                    }
                }, 20);
            };
            Object.defineProperty(VideoNodeController.prototype, "muted", {
                get: function() {
                    return this.muteIntervalId > 0 ? this._muted : this.videoNode.muted;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(VideoNodeController.prototype, "volume", {
                get: function() {
                    return this.videoNode.volume;
                },
                enumerable: true,
                configurable: true
            });
            return VideoNodeController;
        }(EventBus_1.default);
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = VideoNodeController;
    });
    define("shared/rollover_mute", [ "require", "exports", "util/EventBus" ], function(require, exports, EventBus_2) {
        "use strict";
        function createHoverBus(wrapperElement) {
            var eventBus = new EventBus_2.default();
            eventBus.on({
                enter: function() {
                    return eventBus.emit("changeHover", true);
                },
                leave: function() {
                    return eventBus.emit("changeHover", false);
                }
            });
            wrapperElement.addEventListener("mouseenter", function() {
                eventBus.emit("enter");
            });
            wrapperElement.addEventListener("mouseleave", function() {
                eventBus.emit("leave");
            });
            return eventBus;
        }
        exports.createHoverBus = createHoverBus;
    });
    define("util/VisibilitySensor", [ "require", "exports", "util/EventBus" ], function(require, exports, EventBus_3) {
        "use strict";
        var VisibilitySensor = function(_super) {
            __extends(VisibilitySensor, _super);
            function VisibilitySensor(el, threshold) {
                var _this = this;
                _super.call(this);
                this.el = el;
                this.threshold = threshold;
                this.visibility = false;
                this.isEndOfTheBody = false;
                var _a = this.el.getBoundingClientRect(), width = _a.width, height = _a.height;
                this.on("changeState", function() {
                    var rect = _this.el.getBoundingClientRect();
                    if (rect.width !== width || rect.height !== height) {
                        _this.emit("resize", rect);
                        width = rect.width;
                        height = rect.height;
                    }
                    var isEndOfTheBody = _this.getTheEndOfTheBody();
                    if (isEndOfTheBody !== _this.isEndOfTheBody) {
                        _this.isEndOfTheBody = isEndOfTheBody;
                        if (isEndOfTheBody) {
                            _this.emit("endOfTheBody");
                        }
                    }
                    var isVisibleNow = _this.getVisibility();
                    if (_this.getVisibility() !== _this.visibility) {
                        _this.visibility = isVisibleNow;
                        _this.emit("changeVisibility", isVisibleNow);
                        if (isVisibleNow) {
                            _this.emit("show");
                        } else {
                            _this.emit("hide");
                        }
                    }
                });
                var hiddenProperty = "hidden" in document ? "hidden" : "webkitHidden" in document ? "webkitHidden" : "mozHidden" in document ? "mozHidden" : null;
                var visibilityStateProperty = "visibilityState" in document ? "visibilityState" : "webkitVisibilityState" in document ? "webkitVisibilityState" : "mozVisibilityState" in document ? "mozVisibilityState" : null;
                if (hiddenProperty !== null && visibilityStateProperty !== null) {
                    this.documentHiddenProperty = hiddenProperty;
                    var visibilityChangeEvent = hiddenProperty.replace(/hidden/i, "visibilitychange");
                    document.addEventListener(visibilityChangeEvent, function() {
                        return _this.emit("changeDocumentVisibility", _this.documentVisibility);
                    });
                }
                for (var elem = el.parentElement; elem; elem = elem.parentElement) {
                    elem.addEventListener("scroll", function() {
                        return _this.emit("changeState");
                    });
                }
                window.addEventListener("resize", function() {
                    return _this.emit("changeState");
                });
                window.addEventListener("scroll", function() {
                    return _this.emit("changeState");
                });
                this.on([ "changeDocumentVisibility" ], function() {
                    return _this.emit("changeState");
                });
                this.visibility = this.getVisibility();
                this.isEndOfTheBody = this.getTheEndOfTheBody();
            }
            VisibilitySensor.getDocumentHeight = function() {
                var body = document.body;
                var html = document.documentElement;
                return Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
            };
            VisibilitySensor.isFullScrolledElement = function(el) {
                var doc = document.documentElement;
                if (el === doc || el === document.body) {
                    var top_1 = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
                    return VisibilitySensor.getDocumentHeight() - (top_1 + window.innerHeight) < 40;
                }
                if (el.scrollHeight > el.clientHeight) {
                    if (el.scrollHeight - (el.scrollTop + el.clientHeight) > 40) {
                        return false;
                    }
                }
                return true;
            };
            VisibilitySensor.prototype.whenShow = function() {
                if (this.getVisibility()) {
                    return Promise.resolve();
                } else {
                    return this.when("show");
                }
            };
            VisibilitySensor.prototype.whenCanShow = function() {
                var _this = this;
                if (this.getVisibility()) {
                    return Promise.resolve();
                } else {
                    if (this.getTheEndOfTheBody() && this.getIsAfterBody()) {
                        return Promise.resolve();
                    } else {
                        return new Promise(function(resolve) {
                            _this.when("show").then(resolve);
                            _this.on("endOfTheBody", function() {
                                if (_this.getIsAfterBody()) {
                                    resolve();
                                }
                            });
                        });
                    }
                }
            };
            VisibilitySensor.prototype.getVisibility = function() {
                if (!this.documentVisibility) {
                    return false;
                } else {
                    var rect = this.el.getBoundingClientRect();
                    var area = rect.width * rect.height;
                    var top_2 = Math.max(rect.top, 0);
                    var right = Math.min(rect.right, Math.max(document.documentElement.clientWidth, window.innerWidth || 0));
                    var bottom = Math.min(rect.bottom, Math.max(document.documentElement.clientHeight, window.innerHeight || 0));
                    var left = Math.max(rect.left, 0);
                    var visibility = Math.max((right - left) * (bottom - top_2), 0) / area;
                    return visibility > this.threshold;
                }
            };
            VisibilitySensor.prototype.getTheEndOfTheBody = function() {
                if (!(this.el.parentElement && this.el.parentElement.parentElement)) {
                    return false;
                }
                var grandParent = this.el.parentElement.parentElement;
                for (var el = grandParent; el; el = el.parentElement) {
                    if (!VisibilitySensor.isFullScrolledElement(el)) {
                        return false;
                    }
                }
                return true;
            };
            VisibilitySensor.prototype.getIsAfterBody = function() {
                return this.el.getBoundingClientRect().bottom > document.body.getBoundingClientRect().bottom;
            };
            Object.defineProperty(VisibilitySensor.prototype, "documentVisibility", {
                get: function() {
                    return !document[this.documentHiddenProperty];
                },
                enumerable: true,
                configurable: true
            });
            return VisibilitySensor;
        }(EventBus_3.default);
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = VisibilitySensor;
    });
    define("adsdk/DisplayController", [ "require", "exports", "util/VisibilitySensor", "util/EventBus" ], function(require, exports, VisibilitySensor_1, EventBus_4) {
        "use strict";
        var DisplayController = function(_super) {
            __extends(DisplayController, _super);
            function DisplayController(wrapperNode) {
                _super.call(this);
                this.wrapperNode = wrapperNode;
                this.visibilitySensor = new VisibilitySensor_1.default(wrapperNode, .5);
            }
            DisplayController.isJsDisplayController = function(displayController) {
                return displayController.currentContentType !== "flash";
            };
            Object.defineProperty(DisplayController.prototype, "paused", {
                get: function() {
                    return this.getPaused();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(DisplayController.prototype, "muted", {
                get: function() {
                    return this.getMuted();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(DisplayController.prototype, "duration", {
                get: function() {
                    return this.getDuration();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(DisplayController.prototype, "currentTime", {
                get: function() {
                    return this.getCurrentTime();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(DisplayController.prototype, "currentContentType", {
                get: function() {
                    return this.getCurrentContentType();
                },
                enumerable: true,
                configurable: true
            });
            return DisplayController;
        }(EventBus_4.default);
        exports.DisplayController = DisplayController;
    });
    define("adsdk/AdConfig", [ "require", "exports" ], function(require, exports) {
        "use strict";
    });
    define("adsdk/AdDisplayConfig", [ "require", "exports" ], function(require, exports) {
        "use strict";
    });
    define("adsdk/TrackingEventType", [ "require", "exports" ], function(require, exports) {
        "use strict";
        var TrackingEventType = {
            ERROR: "error",
            IMPRESSION: "impression",
            CREATIVE_VIEW: "creativeView",
            START: "start",
            FIRST_QUARTILE: "firstQuartile",
            MIDPOINT: "midpoint",
            THIRD_QUARTILE: "thirdQuartile",
            COMPLETE: "complete",
            MUTE: "mute",
            UNMUTE: "unmute",
            PAUSE: "pause",
            RESUME: "resume",
            FULLSCREEN: "fullscreen",
            EXIT_FULLSCREEN: "exitFullscreen",
            CLOSE: "close",
            SKIP: "skip",
            CLICK_THROUGH: "clickThrough",
            PROGRESS: "progress",
            REWIND: "rewind",
            VIEWABLE: "viewable",
            DWELL: "dwell"
        };
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = TrackingEventType;
        ya.mediaAd.TrackingEventType = TrackingEventType;
    });
    define("util/xml_util", [ "require", "exports" ], function(require, exports) {
        "use strict";
        function readAttr(element, attrName, defaultValue) {
            if (defaultValue === void 0) {
                defaultValue = null;
            }
            if (element.hasAttribute(attrName)) {
                return element.getAttribute(attrName).trim();
            }
            return defaultValue;
        }
        exports.readAttr = readAttr;
        function readElementText(element) {
            return element && element.textContent ? element.textContent.trim() : "";
        }
        exports.readElementText = readElementText;
        function isElementSet(element) {
            return element && readElementText(element).length;
        }
        exports.isElementSet = isElementSet;
    });
    define("adsdk/vast/MediaFile", [ "require", "exports", "util/xml_util" ], function(require, exports, xml_util_1) {
        "use strict";
        var MediaFile = function() {
            function MediaFile() {}
            MediaFile.fromXml = function(xml) {
                var mediaFile = new MediaFile();
                mediaFile.width = parseInt(xml_util_1.readAttr(xml, "width", 0), 10);
                mediaFile.height = parseInt(xml_util_1.readAttr(xml, "height", 0), 10);
                mediaFile.bitrate = parseInt(xml_util_1.readAttr(xml, "bitrate", 0), 10);
                mediaFile.delivery = xml_util_1.readAttr(xml, "delivery");
                mediaFile.type = xml_util_1.readAttr(xml, "type");
                mediaFile.isVpaid = xml_util_1.readAttr(xml, "apiFramework") === "VPAID";
                mediaFile.source = xml_util_1.readElementText(xml);
                return mediaFile;
            };
            return MediaFile;
        }();
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = MediaFile;
    });
    define("adsdk/mediaAd/MediaSource", [ "require", "exports" ], function(require, exports) {
        "use strict";
        var MediaSource = function() {
            function MediaSource(_a) {
                var source = _a.source, type = _a.type, bitrate = _a.bitrate, width = _a.width, height = _a.height, isVpaid = _a.isVpaid;
                this.isVpaid = false;
                this.src = source;
                this.type = type;
                this.bitrate = bitrate;
                this.width = width;
                this.height = height;
                this.isVpaid = isVpaid;
            }
            return MediaSource;
        }();
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = MediaSource;
    });
    define("adsdk/error/BlockInfoError", [ "require", "exports" ], function(require, exports) {
        "use strict";
        var BlockInfoError = function(_super) {
            __extends(BlockInfoError, _super);
            function BlockInfoError(message, id) {
                _super.call(this, message);
                this.id = id;
            }
            BlockInfoError.PARSE_ERROR = 1001;
            BlockInfoError.TIMEOUT_ERROR = 1002;
            BlockInfoError.PARAMS_ERROR = 1003;
            return BlockInfoError;
        }(Error);
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = BlockInfoError;
    });
    define("adsdk/AdType", [ "require", "exports" ], function(require, exports) {
        "use strict";
        var AdType = {
            PREROLL: "preroll",
            MIDROLL: "midroll",
            PAUSEROLL: "pauseroll",
            OVERLAY: "overlay",
            POSTROLL: "postroll"
        };
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = AdType;
        ya.mediaAd.AdType = AdType;
    });
    define("adsdk/Block", [ "require", "exports", "util/xml_util", "adsdk/AdType" ], function(require, exports, xml_util_2, AdType_1) {
        "use strict";
        var Block = function() {
            function Block() {
                this.id = 0;
                this.adType = "";
                this.startTime = 0;
                this.duration = 0;
                this.positionsCount = 0;
            }
            Block.fromXml = function(xml) {
                var startTimeNode = xml.querySelector("StartTime");
                var durationNode = xml.querySelector("Duration");
                var positionsCountNode = xml.querySelector("PositionsCount");
                var block = new Block();
                block.id = xml_util_2.readAttr(xml, "BlockID", 0);
                block.adType = xml_util_2.readAttr(xml, "type", AdType_1.default.PREROLL);
                block.startTime = +xml_util_2.readElementText(startTimeNode);
                block.duration = +xml_util_2.readElementText(durationNode);
                block.positionsCount = +xml_util_2.readElementText(positionsCountNode);
                return block;
            };
            return Block;
        }();
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = Block;
    });
    define("adsdk/BlockInfo", [ "require", "exports", "adsdk/error/BlockInfoError", "util/xml_util", "util/net", "util/util", "adsdk/Block" ], function(require, exports, BlockInfoError_1, xml_util_3, net_2, util_2, Block_1) {
        "use strict";
        var BLOCK_INFO_LOAD_TIMEOUT = 3e3;
        var BlockInfo = function() {
            function BlockInfo() {
                this.partnerId = "";
                this.sessionId = "";
                this.categoryID = 0;
                this.categoryName = "";
                this.skinUrl = "";
                this.title = "";
                this.skipDelay = 5;
                this.skipTimeLeftShow = true;
                this.timeLeftShow = true;
                this.visitSiteShow = false;
                this.vastTimeout = 3e3;
                this.videoTimeout = 2e3;
                this.wrapperTimeout = 3e3;
                this.wrapperMaxCount = 3;
                this.vpaidTimeout = 3e3;
                this.bufferFullTimeout = 2500;
                this.bufferEmptyLimit = 5;
                this.vpaidEnabled = true;
                this.skinTimeout = 2e3;
                this.blocks = [];
            }
            BlockInfo.getUrl = function(config) {
                if (!config.partnerId) {
                    return null;
                }
                return net_2.appendVersion("//an.yandex.ru/vcset/" + encodeURIComponent("" + config.partnerId) + "?video-category-id=" + encodeURIComponent("" + config.category) + "&duration=" + encodeURIComponent("" + config.duration) + "&client_type=html");
            };
            BlockInfo.fromXml = function(xml) {
                var blockInfoNode = xml.querySelector("Blocksinfo"), blocksNodes = blockInfoNode.querySelectorAll("Blocks > Block"), blockInfo = new BlockInfo(), block;
                function readParam(nodeName) {
                    return xml_util_3.readElementText(blockInfoNode.querySelector(nodeName));
                }
                blockInfo.partnerId = readParam("PartnerID");
                blockInfo.sessionId = readParam("SessionID");
                blockInfo.categoryID = +readParam("CategoryID");
                blockInfo.categoryName = readParam("CategoryName");
                if (util_2.endsWith(readParam("Skin"), ".css")) {
                    blockInfo.skinUrl = readParam("Skin");
                }
                blockInfo.bufferEmptyLimit = parseInt(readParam("BufferEmptyLimit"), 10);
                blockInfo.title = readParam("Title");
                blockInfo.skipDelay = parseInt(readParam("SkipDelay"), 10);
                blockInfo.skipTimeLeftShow = readParam("SkipTimeLeftShow") === "true";
                blockInfo.timeLeftShow = readParam("TimeLeftShow") === "true";
                blockInfo.visitSiteShow = readParam("VisitSiteShow") === "true";
                blockInfo.vastTimeout = parseInt(readParam("VASTTimeout"), 10);
                blockInfo.videoTimeout = parseInt(readParam("VideoTimeout"), 10);
                blockInfo.vpaidTimeout = parseInt(readParam("VPAIDTimeout"), 10);
                blockInfo.wrapperTimeout = parseInt(readParam("WrapperTimeout"), 10);
                blockInfo.wrapperMaxCount = parseInt(readParam("WrapperMaxCount"), 10);
                blockInfo.bufferFullTimeout = parseInt(readParam("BufferFullTimeout"), 10);
                blockInfo.skinTimeout = parseInt(readParam("SkinTimeout"), 10);
                for (var i = 0; i < blocksNodes.length; i++) {
                    block = Block_1.default.fromXml(blocksNodes[i]);
                    blockInfo.blocks.push(block);
                }
                return blockInfo;
            };
            BlockInfo.load = function(config) {
                var url = BlockInfo.getUrl(config);
                if (!url) {
                    return Promise.reject(new BlockInfoError_1.default("Invalid ad parameters", BlockInfoError_1.default.PARAMS_ERROR));
                }
                return net_2.load(url, null, BLOCK_INFO_LOAD_TIMEOUT).then(function(xml) {
                    var blockInfo;
                    try {
                        blockInfo = BlockInfo.fromXml(xml);
                    } catch (parseXmlError) {
                        return Promise.reject(new BlockInfoError_1.default(parseXmlError.message, BlockInfoError_1.default.PARSE_ERROR));
                    }
                    return blockInfo;
                }).catch(function(error) {
                    if (error.isTimeoutError) {
                        return Promise.reject(new BlockInfoError_1.default(error.message, BlockInfoError_1.default.PARSE_ERROR));
                    } else {
                        return Promise.reject(new BlockInfoError_1.default("Timeout of loading block info. PartnerId: " + config.partnerId + "; categoryId: " + config.category, BlockInfoError_1.default.TIMEOUT_ERROR));
                    }
                });
            };
            BlockInfo.prototype.getBlockByAdType = function(adType) {
                for (var i = 0; i < this.blocks.length; i++) {
                    if (this.blocks[i].adType === adType) {
                        return this.blocks[i];
                    }
                }
                return null;
            };
            return BlockInfo;
        }();
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = BlockInfo;
    });
    define("adsdk/vast/VastSourceType", [ "require", "exports" ], function(require, exports) {
        "use strict";
        var VastSourceType;
        (function(VastSourceType) {
            VastSourceType[VastSourceType["EXTERNAL"] = 0] = "EXTERNAL";
            VastSourceType[VastSourceType["AD_FOX"] = 1] = "AD_FOX";
            VastSourceType[VastSourceType["YANDEX"] = 2] = "YANDEX";
        })(VastSourceType || (VastSourceType = {}));
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = VastSourceType;
    });
    define("adsdk/error/VastError", [ "require", "exports" ], function(require, exports) {
        "use strict";
        var VastError = function(_super) {
            __extends(VastError, _super);
            function VastError(message, id) {
                _super.call(this, message);
                this.id = id;
            }
            VastError.INVALID_VAST_XML = 40;
            VastError.NO_IN_LINE_OR_WRAPPER_NODE = 53;
            VastError.NO_VAST_ID_TAG_URI = 54;
            VastError.VAST_LOAD_TIMEOUT = 60;
            VastError.WRAPPER_LOAD_TIMEOUT = 61;
            VastError.WRAPPER_MAX_COUNT_LIMIT = 44;
            VastError.INCORRECT_SKIPOFFSET_FORMAT = 46;
            VastError.ADFOX_VAST_LOAD_ERROR = 47;
            VastError.YA_VAST_LOAD_ERROR = 48;
            VastError.YANDEX_WRAPPER_ENDED_WITH_NOT_YANDEX_VAST = 49;
            return VastError;
        }(Error);
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = VastError;
    });
    define("adsdk/vast/VastIcon", [ "require", "exports", "util/xml_util" ], function(require, exports, xml_util_4) {
        "use strict";
        var VastIcon = function() {
            function VastIcon() {}
            VastIcon.fromXml = function(xml) {
                var staticResourceNode = xml.querySelector("StaticResource"), vastIcon = new VastIcon();
                vastIcon.src = xml_util_4.readElementText(staticResourceNode);
                vastIcon.program = xml_util_4.readAttr(xml, "program");
                vastIcon.xPosition = parseInt(xml_util_4.readAttr(xml, "xPosition", 0), 10);
                vastIcon.yPosition = parseInt(xml_util_4.readAttr(xml, "yPosition", 0), 10);
                vastIcon.width = parseInt(xml_util_4.readAttr(xml, "width", 0), 10);
                vastIcon.height = parseInt(xml_util_4.readAttr(xml, "height", 0), 10);
                return vastIcon;
            };
            return VastIcon;
        }();
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = VastIcon;
    });
    define("adsdk/vast/VastAd", [ "require", "exports", "util/xml_util", "adsdk/vast/VastSourceType", "adsdk/error/VastError", "util/util", "util/net", "adsdk/vast/MediaFile", "adsdk/vast/VastIcon" ], function(require, exports, xml_util_5, VastSourceType_1, VastError_1, util_3, net_3, MediaFile_1, VastIcon_1) {
        "use strict";
        var VastAd = function() {
            function VastAd() {
                this.mediaFiles = [];
                this.icons = [];
                this.trackings = {};
                this.clickThrough = "";
                this.isYandexAdxWrapper = false;
                this.skipTime = NaN;
                this.skipOffset = NaN;
                this.progressOffset = NaN;
                this.duration = NaN;
                this.isClickable = true;
                this.numRepeats = 1;
            }
            VastAd.fromXml = function(xml, vastSourceType, isWrapper) {
                if (isWrapper === void 0) {
                    isWrapper = false;
                }
                var sequenceAttr = xml.getAttribute("sequence");
                var sequence = sequenceAttr === null ? Number.MAX_VALUE : parseInt(sequenceAttr, 10);
                var videoClicks = xml.querySelector("VideoClicks");
                var mediaFileNodeList = xml.querySelectorAll("MediaFile");
                var linearNode = xml.querySelector("Linear");
                var trackingNodeList = xml.querySelectorAll("Tracking");
                var impressionNodeList = xml.querySelectorAll("Impression");
                var viewableImpressionNodeList = xml.querySelectorAll("ViewableImpression");
                var errorNodeList = xml.querySelectorAll("Error");
                var extensionsNode = xml.querySelector("Extensions");
                var descriptionNode = xml.querySelector("Description");
                var iconNodeList = xml.querySelectorAll("Icons Icon");
                var adParameters = xml.querySelector("AdParameters");
                var ad = new VastAd();
                ad.sequence = sequence;
                ad.adParameters = adParameters ? xml_util_5.readElementText(adParameters) : "";
                if (!isWrapper) {
                    for (var i = 0, len = mediaFileNodeList.length; i < len; i++) {
                        ad.mediaFiles.push(MediaFile_1.default.fromXml(mediaFileNodeList[i]));
                    }
                    if (videoClicks) {
                        var nodeValue = xml_util_5.readElementText(videoClicks.querySelector("ClickThrough"));
                        if (nodeValue) {
                            ad.clickThrough = nodeValue;
                        }
                    }
                }
                if (videoClicks) {
                    var clickTrackings = videoClicks.querySelectorAll("ClickTracking");
                    for (var i = 0, len = clickTrackings.length; i < len; i++) {
                        ad.addEventUrl("clickThrough", xml_util_5.readElementText(clickTrackings[i]));
                    }
                }
                for (var i = 0, len = trackingNodeList.length; i < len; i++) {
                    var eventName = xml_util_5.readAttr(trackingNodeList[i], "event");
                    ad.addEventUrl(eventName, xml_util_5.readElementText(trackingNodeList[i]));
                    if (eventName === "progress") {
                        ad.progressOffset = util_3.parseVASTTime(xml_util_5.readAttr(trackingNodeList[i], "offset", ""));
                    }
                }
                for (var i = 0, len = impressionNodeList.length; i < len; i++) {
                    ad.addEventUrl("impression", xml_util_5.readElementText(impressionNodeList[i]));
                }
                for (var i = 0, len = viewableImpressionNodeList.length; i < len; i++) {
                    var viewableNodeList = viewableImpressionNodeList[i].querySelectorAll("Viewable");
                    for (var j = 0, len_1 = viewableNodeList.length; j < len_1; j++) {
                        var link = xml_util_5.readElementText(viewableNodeList[j]);
                        ad.addEventUrl("viewable", link);
                    }
                }
                for (var i = 0, len = errorNodeList.length; i < len; i++) {
                    if (vastSourceType === VastSourceType_1.default.AD_FOX) {
                        ad.addEventUrl("adFoxError", xml_util_5.readElementText(errorNodeList[i]));
                    } else {
                        ad.addEventUrl("error", xml_util_5.readElementText(errorNodeList[i]));
                    }
                }
                for (var i = 0, len = iconNodeList.length; i < len; i++) {
                    ad.icons.push(VastIcon_1.default.fromXml(iconNodeList[i]));
                }
                if (extensionsNode) {
                    var dwell = extensionsNode.querySelectorAll('Extension[type="dwell"]');
                    for (var i = 0, len = dwell.length; i < len; i++) {
                        ad.addEventUrl("dwell", xml_util_5.readElementText(dwell[i]));
                    }
                    var skipAdNodeList = extensionsNode.querySelectorAll('Extension[type="skipAd"]');
                    for (var i = 0, len = skipAdNodeList.length; i < len; i++) {
                        ad.addEventUrl("skip", xml_util_5.readElementText(skipAdNodeList[i]));
                    }
                    var skipTimeNode = extensionsNode.querySelector('Extension[type="skipTime"]');
                    if (xml_util_5.isElementSet(skipTimeNode)) {
                        ad.skipTime = util_3.parseVASTTime(xml_util_5.readElementText(skipTimeNode));
                        if (ad.skipTime > 180) {
                            ad.skipTime = 0;
                        }
                    }
                    var isClickableNode = extensionsNode.querySelector('Extension[type="isClickable"]');
                    if (xml_util_5.isElementSet(isClickableNode)) {
                        ad.isClickable = xml_util_5.readElementText(isClickableNode) !== "0";
                    }
                }
                if (xml_util_5.isElementSet(descriptionNode)) {
                    ad.description = xml_util_5.readElementText(descriptionNode);
                }
                if (linearNode) {
                    var nodeValue = xml_util_5.readAttr(linearNode, "skipoffset", "").trim();
                    if (nodeValue !== "") {
                        var skipOffset = util_3.parseVASTTime(nodeValue);
                        if (!isNaN(skipOffset)) {
                            ad.skipOffset = skipOffset;
                        } else {
                            net_3.trackError(new VastError_1.default(nodeValue, VastError_1.default.INCORRECT_SKIPOFFSET_FORMAT), ad.trackings.error);
                        }
                    }
                    var durationNode = linearNode.querySelector("Duration");
                    if (durationNode) {
                        ad.duration = util_3.parseVASTTime(xml_util_5.readElementText(durationNode));
                    }
                }
                return ad;
            };
            VastAd.prototype.addEventUrl = function(eventName, url) {
                if (!url || !eventName) {
                    return;
                }
                if (!this.trackings[eventName]) {
                    this.trackings[eventName] = [];
                }
                this.trackings[eventName].push(url);
            };
            VastAd.prototype.merge = function(adToMerge) {
                if (adToMerge.mediaFiles.length) {
                    for (var i = 0, len = adToMerge.mediaFiles.length; i < len; i++) {
                        this.mediaFiles.push(adToMerge.mediaFiles[i]);
                    }
                }
                for (var eventName in adToMerge.trackings) {
                    if (adToMerge.trackings.hasOwnProperty(eventName)) {
                        if (!this.trackings[eventName]) {
                            this.trackings[eventName] = adToMerge.trackings[eventName];
                        } else {
                            this.trackings[eventName] = this.trackings[eventName].concat(adToMerge.trackings[eventName]);
                        }
                    }
                }
                if (typeof adToMerge.clickThrough === "string" && adToMerge.clickThrough.length) {
                    this.clickThrough = adToMerge.clickThrough;
                }
                this.skipTime = adToMerge.skipTime;
                this.skipOffset = adToMerge.skipOffset;
                this.isClickable = adToMerge.isClickable;
                if (!isNaN(adToMerge.progressOffset)) {
                    this.progressOffset = adToMerge.progressOffset;
                }
            };
            VastAd.prototype.hasMedia = function() {
                return Boolean(this.mediaFiles && this.mediaFiles.length);
            };
            return VastAd;
        }();
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = VastAd;
    });
    define("adsdk/vast/VAST", [ "require", "exports", "util/util", "util/xml_util", "util/net", "adsdk/vast/VastSourceType", "adsdk/error/VastError", "adsdk/vast/VastAd" ], function(require, exports, util_4, xml_util_6, net_4, VastSourceType_2, VastError_2, VastAd_1) {
        "use strict";
        var REFERER_MACRO = "{REFERER}";
        var VAST_VERSIONS = [ "2.0", "3.0" ];
        var AD_FOX_MARKER = "Yandex ADX";
        function prepareUrl(url) {
            return url.replace(REFERER_MACRO, encodeURIComponent(util_4.getReferrer()));
        }
        function prepareListParam(param) {
            return encodeURIComponent(typeof param === "string" ? param : param.join("\n"));
        }
        var VAST = function() {
            function VAST(ads) {
                this.ads = ads;
            }
            return VAST;
        }();
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = VAST;
        function getVastUrl(adConfig, blockInfo, blockId) {
            var url, params, targetRef = window.location.toString(), pageRef = window.document.referrer;
            params = "imp-id=" + blockId + "&target-ref=" + encodeURIComponent(targetRef) + "&page-ref=" + encodeURIComponent(pageRef);
            if (adConfig.playerInfo) {
                params += ":" + adConfig.playerInfo;
            }
            if (adConfig.width) {
                params += "&video-width=" + adConfig.width;
            }
            if (adConfig.height) {
                params += "&video-height=" + adConfig.height;
            }
            if (adConfig.videoContentId) {
                params += "&video-content-id=" + adConfig.videoContentId;
            }
            if (adConfig.videoContentName) {
                params += "&video-content-name=" + encodeURIComponent(adConfig.videoContentName);
            }
            if (adConfig.videoPublisherId) {
                params += "&video-publisher-id=" + adConfig.videoPublisherId;
            }
            if (adConfig.videoPublisherName) {
                params += "&video-publisher-name=" + encodeURIComponent(adConfig.videoPublisherName);
            }
            if (adConfig.videoGenreId) {
                params += "&video-genre-id=" + prepareListParam("" + adConfig.videoGenreId);
            }
            if (adConfig.videoGenreName) {
                params += "&video-genre-name=" + prepareListParam(adConfig.videoGenreName);
            }
            if (adConfig.tagsList) {
                params += "&tags-list=" + prepareListParam(adConfig.tagsList);
            }
            if (adConfig.extParam) {
                params += "&ext-param=" + encodeURIComponent(adConfig.extParam);
            }
            params += "&charset=" + encodeURIComponent(adConfig.charset || "UTF-8");
            if (blockInfo.sessionId) {
                params += "&video-session-id=" + encodeURIComponent(blockInfo.sessionId);
            }
            params += "&rnd=" + Math.random();
            url = "//an.yandex.ru/meta/" + encodeURIComponent(blockInfo.partnerId) + "?" + params;
            return net_4.appendVersion(url);
        }
        exports.getVastUrl = getVastUrl;
        function loadVast(urlOrVast, isAdFox, vastTimeout, wrapperTimeout, wrapperMaxCount) {
            var wrapperLevel = 0;
            var wrapperTimer = new util_4.Timer(wrapperTimeout);
            var isXmlVast = urlOrVast.charAt(0) === "<";
            if (isXmlVast) {
                var xml = void 0;
                try {
                    xml = new DOMParser().parseFromString(urlOrVast, "application/xml");
                } catch (e) {
                    return Promise.reject(new VastError_2.default("Inline VAST syntax error: " + e, VastError_2.default.INVALID_VAST_XML));
                }
                return processVastXml(xml, "", VastSourceType_2.default.EXTERNAL);
            } else {
                return loadVastInternal(prepareUrl(urlOrVast), isAdFox ? VastSourceType_2.default.AD_FOX : util_4.isYandexDomain(urlOrVast) ? VastSourceType_2.default.YANDEX : VastSourceType_2.default.EXTERNAL);
            }
            function loadVastInternal(url, vastSourceType) {
                return net_4.load(url, null, vastTimeout).then(function(xml) {
                    return processVastXml(xml, url, vastSourceType);
                }).catch(function(error) {
                    if (error.isTimeoutError) {
                        return Promise.reject(new VastError_2.default("VAST load timeout", VastError_2.default.VAST_LOAD_TIMEOUT));
                    } else if (error instanceof VastError_2.default) {
                        return Promise.reject(error);
                    } else {
                        return Promise.reject(new VastError_2.default("" + (error.id ? error.id + ": " : "") + error.message, vastSourceType === VastSourceType_2.default.AD_FOX ? VastError_2.default.ADFOX_VAST_LOAD_ERROR : VastError_2.default.YA_VAST_LOAD_ERROR));
                    }
                });
            }
            function processVastXml(xml, url, vastSourceType) {
                var vastNode = xml.querySelector("VAST");
                var adNodeList = Array.prototype.slice.call(xml.querySelectorAll("VAST Ad"));
                if (!vastNode) {
                    throw new VastError_2.default("No VAST tag found", VastError_2.default.INVALID_VAST_XML);
                }
                if (VAST_VERSIONS.indexOf(vastNode.getAttribute("version")) === -1) {
                    throw new VastError_2.default("Invalid VAST document version", VastError_2.default.INVALID_VAST_XML);
                }
                if (adNodeList.length === 0) {
                    throw new VastError_2.default("No Ad section", VastError_2.default.NO_IN_LINE_OR_WRAPPER_NODE);
                }
                return Promise.all(adNodeList.map(function(adNode) {
                    return processAdNode(adNode, url, vastSourceType);
                })).then(function(ads) {
                    return new VAST(ads);
                });
            }
            function processAdNode(adNode, fromUrl, vastSourceType) {
                var inLineNode = adNode.querySelector("InLine");
                var wrapperNode = adNode.querySelector("Wrapper");
                var ad;
                if (inLineNode) {
                    if (vastSourceType === VastSourceType_2.default.YANDEX && !util_4.isYandexDomain(fromUrl)) {
                        throw new VastError_2.default("Yandex wrapper ended with VAST loaded from not Yandex domain.", VastError_2.default.YANDEX_WRAPPER_ENDED_WITH_NOT_YANDEX_VAST);
                    }
                    try {
                        ad = VastAd_1.default.fromXml(adNode, vastSourceType);
                    } catch (error) {
                        throw new VastError_2.default(error.toString(), VastError_2.default.INVALID_VAST_XML);
                    }
                    return ad;
                }
                if (wrapperTimer.isFired) {
                    throw new VastError_2.default("There is no InLine or Wrapper node in the VAST document", VastError_2.default.NO_IN_LINE_OR_WRAPPER_NODE);
                }
                if (++wrapperLevel > wrapperMaxCount) {
                    throw new VastError_2.default("Limit of nested wrappers reached", VastError_2.default.WRAPPER_MAX_COUNT_LIMIT);
                }
                return processWrapperNode(wrapperNode, vastSourceType);
            }
            function processWrapperNode(wrapperNode, vastSourceType) {
                var vastUriNode = wrapperNode.querySelector("VASTAdTagURI");
                var ad;
                if (!xml_util_6.isElementSet(vastUriNode)) {
                    throw new VastError_2.default("There is no VASTAdTagURI in the 'Wrapper' node", VastError_2.default.NO_VAST_ID_TAG_URI);
                }
                ad = VastAd_1.default.fromXml(wrapperNode, vastSourceType, true);
                var vastUri = xml_util_6.readElementText(vastUriNode);
                if (vastUri === AD_FOX_MARKER) {
                    ad.isYandexAdxWrapper = true;
                    var returnUrlNode = wrapperNode.querySelector("Extension[type='ReturnURL']");
                    if (xml_util_6.isElementSet(returnUrlNode)) {
                        ad.returnUrl = xml_util_6.readElementText(returnUrlNode);
                    }
                    return ad;
                }
                return Promise.race([ wrapperTimer.setup().then(function() {
                    return Promise.reject(new VastError_2.default("Wrapper load timeout.", VastError_2.default.WRAPPER_LOAD_TIMEOUT));
                }), loadVastInternal(vastUri, vastSourceType).then(function(vast) {
                    for (var i = 0, len = vast.ads.length; i < len; i++) {
                        ad.merge(vast.ads[i]);
                    }
                    return ad;
                }) ]);
            }
        }
        exports.loadVast = loadVast;
    });
    define("adsdk/mediaAd/Icon", [ "require", "exports" ], function(require, exports) {
        "use strict";
        var Icon = function() {
            function Icon() {
                this.x = NaN;
                this.y = NaN;
                this.width = NaN;
                this.height = NaN;
            }
            Icon.fromVastIcon = function(vastIcon) {
                var icon = new Icon();
                icon.src = vastIcon.src;
                icon.type = vastIcon.program;
                icon.x = vastIcon.xPosition;
                icon.y = vastIcon.yPosition;
                icon.width = vastIcon.width;
                icon.height = vastIcon.height;
                return icon;
            };
            return Icon;
        }();
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = Icon;
    });
    define("adsdk/mediaAd/MediaAd", [ "require", "exports", "util/net", "adsdk/mediaAd/MediaSource", "util/util", "adsdk/vast/VAST", "adsdk/mediaAd/Icon" ], function(require, exports, net_5, MediaSource_1, util_5, VAST_1, Icon_1) {
        "use strict";
        var IMAGE_CONTENT_TYPES = [ "image/jpeg", "image/gif", "image/png" ];
        var MediaAd = function() {
            function MediaAd(blockInfo, vastAd) {
                this.vastAd = vastAd;
                this.numRepeats = 1;
                this.duration = 0;
                this.clickThroughUrl = vastAd.clickThrough;
                this.numRepeats = vastAd.numRepeats;
                this.duration = 0;
                this.sources = vastAd.mediaFiles.map(function(mediaFile) {
                    return new MediaSource_1.default(mediaFile);
                });
                this.imageSources = this.sources.filter(function(mediaSource) {
                    return IMAGE_CONTENT_TYPES.indexOf(mediaSource.type) > -1;
                }).sort(function(source1, source2) {
                    return IMAGE_CONTENT_TYPES.indexOf(source1.type) - IMAGE_CONTENT_TYPES.indexOf(source2.type);
                });
                this.icons = vastAd.icons.map(function(vastIcon) {
                    return Icon_1.default.fromVastIcon(vastIcon);
                });
                this.playbackParams = {
                    isClickable: vastAd.isClickable && !!this.clickThroughUrl,
                    title: blockInfo.title,
                    description: vastAd.description,
                    skinUrl: blockInfo.skinUrl,
                    skipTimeLeftShow: blockInfo.skipTimeLeftShow,
                    timeLeftShow: blockInfo.timeLeftShow,
                    videoTimeout: blockInfo.videoTimeout,
                    vpaidTimeout: blockInfo.vpaidTimeout,
                    bufferFullTimeout: blockInfo.bufferFullTimeout,
                    bufferEmptyLimit: blockInfo.bufferEmptyLimit,
                    progressOffset: vastAd.progressOffset,
                    visitSiteShow: blockInfo.visitSiteShow,
                    autoplay: true,
                    minimalGui: false,
                    skipDelay: 0,
                    pauseAllowed: false
                };
                if (isNaN(vastAd.skipOffset)) {
                    if (this.sources.length > 0 && blockInfo.skipDelay) {}
                } else if (isNaN(vastAd.skipTime)) {
                    this.playbackParams.skipDelay = blockInfo.skipDelay === 0 ? vastAd.skipOffset : Math.min(blockInfo.skipDelay, vastAd.skipOffset);
                } else {
                    this.playbackParams.skipDelay = vastAd.skipTime;
                }
                if (!isNaN(vastAd.duration)) {
                    this.duration = vastAd.duration;
                }
            }
            MediaAd.create = function(blockInfo, vastOrAd) {
                var ads = [];
                if (vastOrAd instanceof VAST_1.default) {
                    vastOrAd.ads.forEach(function(ad) {
                        ads.push(ad);
                    });
                } else {
                    ads.push(vastOrAd);
                }
                if (ads[0]) {
                    return ads.map(function(ad) {
                        return new MediaAd(blockInfo, ad);
                    });
                }
                return null;
            };
            MediaAd.prototype.trackError = function(error) {
                net_5.trackError(error, this.vastAd.trackings.error);
                net_5.knock(this.vastAd.trackings.adFoxError);
            };
            MediaAd.prototype.trackEvent = function(eventName) {
                util_5.log("Tracking:", eventName);
                net_5.knock(this.vastAd.trackings[eventName]);
            };
            MediaAd.prototype.hasMedia = function() {
                return Boolean(this.sources && this.sources.length);
            };
            Object.defineProperty(MediaAd.prototype, "contentType", {
                get: function() {
                    var isJsVpaid = this.sources.some(function(mediaSource) {
                        return mediaSource.isVpaid && mediaSource.type === "application/javascript";
                    });
                    return isJsVpaid ? "vpaid" : "video";
                },
                enumerable: true,
                configurable: true
            });
            return MediaAd;
        }();
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = MediaAd;
    });
    define("adsdk/error/AdError", [ "require", "exports" ], function(require, exports) {
        "use strict";
        var AdError = function(_super) {
            __extends(AdError, _super);
            function AdError(message, id) {
                _super.call(this, message);
                this.id = id;
            }
            AdError.VIDEO_TIMEOUT = 62;
            AdError.VPAID_TIMEOUT = 65;
            AdError.BUFFER_FULL_TIMEOUT = 63;
            AdError.BUFFER_EMPTY_LIMIT = 64;
            return AdError;
        }(Error);
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = AdError;
    });
    define("adsdk/AdConfigInternal", [ "require", "exports" ], function(require, exports) {
        "use strict";
    });
    define("adsdk/error/MediaAdError", [ "require", "exports" ], function(require, exports) {
        "use strict";
        var MediaAdError = function(_super) {
            __extends(MediaAdError, _super);
            function MediaAdError(message, id) {
                _super.call(this, message);
                this.id = id;
            }
            MediaAdError.NO_AD_TO_DISPLAY = 51;
            MediaAdError.NO_AD_TO_DISPLAY_MSG = "No ads to display in the VAST documents";
            MediaAdError.SKIP_DELAY_WITHOUT_SKIPOFFSET = 45;
            MediaAdError.SKIP_DELAY_WITHOUT_SKIPOFFSET_MSG = "BlockInfo-Skipoffset error";
            return MediaAdError;
        }(Error);
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = MediaAdError;
    });
    define("adsdk/AdManager", [ "require", "exports", "adsdk/vast/VAST", "adsdk/error/MediaAdError", "adsdk/mediaAd/MediaAd", "util/net", "adsdk/AdType" ], function(require, exports, VAST_2, MediaAdError_1, MediaAd_1, net_6, AdType_2) {
        "use strict";
        var AdManager = function() {
            function AdManager(adConfig, blockInfo) {
                this.adConfig = adConfig;
                this.blockInfo = blockInfo;
            }
            AdManager.sortMediaAdsBySequence = function(mediaAds) {
                return mediaAds.sort(function(a, b) {
                    return a.vastAd.sequence - b.vastAd.sequence;
                });
            };
            AdManager.prototype.loadAd = function(adType, onLoaded, onError) {
                return this.loadAdInternal(adType).then(function(mediaAds) {
                    if (typeof onLoaded === "function") {
                        onLoaded(mediaAds[0]);
                    }
                    return mediaAds;
                }).catch(function(error) {
                    if (typeof onError === "function") {
                        onError(error);
                    }
                    return Promise.reject(error);
                });
            };
            AdManager.prototype.loadAdInternal = function(adType) {
                var _this = this;
                return new Promise(function(resolve, reject) {
                    var blockInfo = _this.blockInfo;
                    var adConfig = _this.adConfig;
                    var yandexADXInsteadOfAdFoxFail = adConfig.yandexADXInsteadOfAdFoxFail;
                    var block = blockInfo.getBlockByAdType(adType);
                    var preferAdFox = adConfig.preferAdfox !== undefined ? adConfig.preferAdfox : true;
                    var mainVast;
                    var adFoxVast;
                    var mainAd;
                    var adFoxAd;
                    var adFoxMode = false;
                    var isSyncWithAdFoxComplete = false;
                    var vastUrlOrContent;
                    var adFoxLoadingError = false;
                    var rtbLoadingError = false;
                    var adFoxUrl;
                    if (adType === AdType_2.default.MIDROLL && adConfig.adFoxUrlMidRoll) {
                        adFoxUrl = adConfig.adFoxUrlMidRoll;
                    } else if (adType === AdType_2.default.PAUSEROLL && adConfig.adFoxUrlPauseRoll) {
                        adFoxUrl = adConfig.adFoxUrlPauseRoll;
                    } else if (adType === AdType_2.default.POSTROLL && adConfig.adFoxUrlPostRoll) {
                        adFoxUrl = adConfig.adFoxUrlPostRoll;
                    } else {
                        adFoxUrl = adConfig.adFoxUrl;
                    }
                    if (!block) {
                        reject(new Error("No ads of a given type " + adType));
                        return;
                    }
                    if (adConfig[block.adType + "Vast"]) {
                        processVAST(adConfig[block.adType + "Vast"]);
                        return;
                    }
                    if (adConfig.adFoxUrlVast || adFoxUrl) {
                        adFoxMode = true;
                        VAST_2.loadVast(adConfig.adFoxUrlVast || adFoxUrl, true, blockInfo.vastTimeout, blockInfo.wrapperTimeout, blockInfo.wrapperMaxCount).then(function(vast) {
                            adFoxVast = vast;
                            syncMainAndAdFoxVast();
                        }).catch(function(error) {
                            net_6.trackError(error);
                            adFoxLoadingError = true;
                            syncMainAndAdFoxVast();
                        });
                    }
                    if (adConfig.vastUrl) {
                        vastUrlOrContent = adConfig.vastUrl;
                    } else if (adConfig.vast) {
                        vastUrlOrContent = adConfig.vast;
                    } else {
                        vastUrlOrContent = VAST_2.getVastUrl(adConfig, blockInfo, block.id);
                    }
                    VAST_2.loadVast(vastUrlOrContent, false, blockInfo.vastTimeout, blockInfo.wrapperTimeout, blockInfo.wrapperMaxCount).then(function(vast) {
                        if (adFoxMode) {
                            mainVast = vast;
                            syncMainAndAdFoxVast();
                            return;
                        }
                        processVAST(vast);
                    }).catch(function(error) {
                        net_6.trackError(error);
                        if (adFoxMode) {
                            rtbLoadingError = true;
                            syncMainAndAdFoxVast();
                            return;
                        }
                        reject(error);
                    });
                    function syncMainAndAdFoxVast() {
                        var resultMediaAds;
                        if (isSyncWithAdFoxComplete) {
                            return;
                        }
                        if (adFoxLoadingError && rtbLoadingError) {
                            isSyncWithAdFoxComplete = true;
                            reject(new MediaAdError_1.default(MediaAdError_1.default.NO_AD_TO_DISPLAY_MSG, MediaAdError_1.default.NO_AD_TO_DISPLAY));
                            return;
                        }
                        if (adFoxLoadingError) {
                            if (yandexADXInsteadOfAdFoxFail && adConfig.partnerId) {
                                if (mainVast) {
                                    isSyncWithAdFoxComplete = true;
                                    resultMediaAds = MediaAd_1.default.create(blockInfo, mainVast);
                                }
                            } else {
                                if (preferAdFox) {
                                    isSyncWithAdFoxComplete = true;
                                } else if (mainVast) {
                                    isSyncWithAdFoxComplete = true;
                                    resultMediaAds = MediaAd_1.default.create(blockInfo, mainVast);
                                }
                            }
                        } else if (rtbLoadingError && adFoxVast) {
                            isSyncWithAdFoxComplete = true;
                            resultMediaAds = MediaAd_1.default.create(blockInfo, adFoxVast);
                        } else if (adFoxVast && preferAdFox || mainVast && !preferAdFox) {
                            adFoxAd = adFoxVast ? adFoxVast.ads[0] : null;
                            mainAd = mainVast ? mainVast.ads[0] : null;
                            var adFoxContainsMedia = adFoxAd && adFoxAd.hasMedia();
                            var mainVastContainsMedia = mainAd && mainAd.hasMedia();
                            if (adFoxContainsMedia && (preferAdFox || !mainVastContainsMedia)) {
                                isSyncWithAdFoxComplete = true;
                                resultMediaAds = MediaAd_1.default.create(blockInfo, adFoxVast);
                            } else if (mainVastContainsMedia && (!preferAdFox || !adFoxContainsMedia)) {
                                isSyncWithAdFoxComplete = true;
                                if (preferAdFox && adFoxAd) {
                                    if (adFoxAd.isYandexAdxWrapper && mainAd) {
                                        adFoxAd.merge(mainAd);
                                    }
                                    resultMediaAds = MediaAd_1.default.create(blockInfo, adFoxAd);
                                } else if (!preferAdFox) {
                                    resultMediaAds = MediaAd_1.default.create(blockInfo, mainAd);
                                }
                            } else if (adFoxVast && mainVast) {
                                isSyncWithAdFoxComplete = true;
                            }
                        }
                        if (isSyncWithAdFoxComplete) {
                            if (resultMediaAds && resultMediaAds[0] && resultMediaAds[0].hasMedia()) {
                                resolve(resultMediaAds);
                            } else if (adFoxAd && adFoxAd.returnUrl && preferAdFox) {
                                VAST_2.loadVast(adFoxAd.returnUrl, true, blockInfo.vastTimeout, blockInfo.wrapperTimeout, blockInfo.wrapperMaxCount).then(processVAST).catch(function(error) {
                                    net_6.trackError(error);
                                    reject(error);
                                });
                            } else {
                                reject(new MediaAdError_1.default(MediaAdError_1.default.NO_AD_TO_DISPLAY_MSG, MediaAdError_1.default.NO_AD_TO_DISPLAY));
                            }
                        }
                    }
                    function processVAST(vast) {
                        var mediaAds = MediaAd_1.default.create(blockInfo, vast);
                        if (mediaAds && mediaAds[0] && mediaAds[0].hasMedia()) {
                            resolve(mediaAds);
                        } else {
                            reject(new MediaAdError_1.default(MediaAdError_1.default.NO_AD_TO_DISPLAY_MSG, MediaAdError_1.default.NO_AD_TO_DISPLAY));
                        }
                    }
                }).then(function(mediaAds) {
                    return AdManager.sortMediaAdsBySequence(mediaAds);
                });
            };
            return AdManager;
        }();
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = AdManager;
    });
    define("adsdk/mediaAd/CustomTrackingEventType", [ "require", "exports" ], function(require, exports) {
        "use strict";
        var CustomTrackingEventType = {
            BUFFER_EMPTY: "bufferEmpty",
            BUFFER_FULL: "bufferFull"
        };
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = CustomTrackingEventType;
    });
    define("adsdk/AdMedia", [ "require", "exports", "util/net", "util/EventBus", "util/util" ], function(require, exports, net_7, EventBus_5, util_6) {
        "use strict";
        var AdMedia = function(_super) {
            __extends(AdMedia, _super);
            function AdMedia(adDisplayController, mediaAd) {
                var _this = this;
                _super.call(this);
                this.adDisplayController = adDisplayController;
                this.mediaAd = mediaAd;
                this.impressionTrackOffset = 0;
                this.viewability = false;
                this.isStarted = false;
                this.isPlaying = false;
                this.on([ "start", "resume" ], function() {
                    _this.isPlaying = true;
                    if (adDisplayController.visibilitySensor.getVisibility()) {
                        _this.setViewability(true);
                    }
                }).on([ "stop", "pause" ], function() {
                    _this.isPlaying = false;
                    _this.setViewability(false);
                });
                adDisplayController.visibilitySensor.on("changeVisibility", function(visible) {
                    _this.setViewability(visible && _this.isPlaying);
                });
            }
            AdMedia.prototype.trackEvent = function(eventName) {
                util_6.log("Track event ==> ", eventName);
                net_7.knock(this.mediaAd.vastAd.trackings[eventName]);
            };
            AdMedia.prototype.trackError = function(error) {
                util_6.log("Track error ==> ", error);
                net_7.trackError(error, this.mediaAd.vastAd.trackings.error);
                net_7.knock(this.mediaAd.vastAd.trackings.adFoxError);
            };
            AdMedia.prototype.clickThrough = function() {
                var clickThroughUrl = this.mediaAd.clickThroughUrl;
                if (clickThroughUrl) {
                    window.open(clickThroughUrl, "_blank");
                    this.pause();
                    this.emit("clickThrough");
                }
            };
            AdMedia.prototype.setNumRepeats = function(numRepeats) {
                this.mediaAd.numRepeats = numRepeats;
            };
            AdMedia.prototype.destroyAdMedia = function() {
                this.resetEventBus();
                this.destroy();
            };
            AdMedia.prototype.setViewability = function(viewability) {
                if (this.viewability !== viewability) {
                    this.viewability = viewability;
                    this.emit("changeViewability", viewability);
                }
            };
            Object.defineProperty(AdMedia.prototype, "duration", {
                get: function() {
                    return this.getDuration();
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AdMedia.prototype, "playbackParams", {
                get: function() {
                    return this.mediaAd.playbackParams;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AdMedia.prototype, "contentType", {
                get: function() {
                    return this.mediaAd.contentType;
                },
                enumerable: true,
                configurable: true
            });
            return AdMedia;
        }(EventBus_5.default);
        exports.AdMedia = AdMedia;
    });
    define("adsdk/AdViewer", [ "require", "exports", "adsdk/mediaAd/CustomTrackingEventType", "adsdk/TrackingEventType", "util/net", "adsdk/error/VideoError", "adsdk/error/AdError", "adsdk/AdMedia" ], function(require, exports, CustomTrackingEventType_1, TrackingEventType_1, net_8, VideoError_2, AdError_1, AdMedia_1) {
        "use strict";
        var AdViewer = function(_super) {
            __extends(AdViewer, _super);
            function AdViewer(adDisplayController, mediaAd) {
                var _this = this;
                _super.call(this, adDisplayController, mediaAd);
                this.videoCurrentTime = NaN;
                this.videoDuration = NaN;
                this.isPreloaded = false;
                var impressionTracked = false;
                var playingTracked = false;
                var progressTracked = false;
                var firstQuartileTracked = false;
                var midpointTracked = false;
                var thirdQuartileTracked = false;
                this.on("currentPositionChange", function(_a) {
                    var currentTime = _a.currentTime, duration = _a.duration;
                    if (!playingTracked && currentTime > 0) {
                        playingTracked = true;
                        _this.emit("start");
                    }
                    if (!impressionTracked && currentTime > _this.impressionTrackOffset) {
                        impressionTracked = true;
                        _this.emit("impression");
                    }
                    if (!progressTracked && currentTime > mediaAd.playbackParams.progressOffset) {
                        progressTracked = true;
                        _this.emit("progress");
                    }
                    if (!firstQuartileTracked && currentTime >= duration / 4) {
                        firstQuartileTracked = true;
                        _this.emit("firstQuartile");
                    }
                    if (!midpointTracked && currentTime >= duration / 2) {
                        midpointTracked = true;
                        _this.emit("midpoint");
                    }
                    if (!thirdQuartileTracked && currentTime >= duration * 3 / 4) {
                        thirdQuartileTracked = true;
                        _this.emit("thirdQuartile");
                    }
                });
                this.on({
                    firstQuartile: function() {
                        return _this.trackEvent(TrackingEventType_1.default.FIRST_QUARTILE);
                    },
                    midpoint: function() {
                        return _this.trackEvent(TrackingEventType_1.default.MIDPOINT);
                    },
                    thirdQuartile: function() {
                        return _this.trackEvent(TrackingEventType_1.default.THIRD_QUARTILE);
                    },
                    pause: function() {
                        return _this.trackEvent(TrackingEventType_1.default.PAUSE);
                    },
                    skip: function() {
                        return _this.trackEvent(TrackingEventType_1.default.SKIP);
                    },
                    start: function() {
                        _this.trackEvent(TrackingEventType_1.default.START);
                        _this.trackEvent(TrackingEventType_1.default.CREATIVE_VIEW);
                    },
                    complete: function() {
                        return _this.trackEvent(TrackingEventType_1.default.COMPLETE);
                    },
                    clickThrough: function() {
                        return _this.trackEvent(TrackingEventType_1.default.CLICK_THROUGH);
                    },
                    impression: function() {
                        return _this.trackEvent(TrackingEventType_1.default.IMPRESSION);
                    },
                    progress: function() {
                        return _this.trackEvent(TrackingEventType_1.default.PROGRESS);
                    }
                });
            }
            AdViewer.prototype.resume = function() {
                this.videoNodeController.resume();
            };
            AdViewer.prototype.changeMute = function(mute, fade) {
                if (fade === void 0) {
                    fade = false;
                }
                this.adDisplayController.setMute(mute, fade);
            };
            AdViewer.prototype.play = function(autoplay) {
                var _this = this;
                if (autoplay === void 0) {
                    autoplay = true;
                }
                this.preload().catch(function(error) {
                    return _this.emit("stop", error);
                });
                if (autoplay) {
                    if (!this.isStarted) {
                        this.isStarted = true;
                        this.subscribeEvents();
                        this.start();
                    } else {
                        this.resume();
                    }
                } else {
                    this.videoNodeController.once([ "start", "resume" ], function() {
                        if (!_this.isStarted) {
                            if (_this.videoNodeController.videoNode.currentSrc === _this.preferredSource.src) {
                                _this.isStarted = true;
                                _this.subscribeEvents();
                                _this.start();
                            }
                        }
                    });
                }
                return this.when("stop").then(function(error) {
                    if (error) {
                        return Promise.reject(error);
                    }
                });
            };
            AdViewer.prototype.pause = function() {
                this.videoNodeController.pause();
            };
            AdViewer.prototype.skip = function(eventType) {
                if (eventType === void 0) {
                    eventType = TrackingEventType_1.default.SKIP;
                }
                this.emit([ "skip", "stop" ]);
            };
            AdViewer.prototype.getAdDimensions = function() {
                var videoNode = this.videoNodeController.videoNode;
                if (!this.preferredSource) {
                    return null;
                }
                if (videoNode.videoWidth > 0) {
                    return {
                        width: videoNode.videoWidth,
                        height: videoNode.videoHeight
                    };
                } else {
                    return {
                        width: this.preferredSource.width,
                        height: this.preferredSource.height
                    };
                }
            };
            AdViewer.prototype.getCurrentTime = function() {
                return this.videoCurrentTime;
            };
            AdViewer.prototype.getDuration = function() {
                return this.videoDuration || this.mediaAd.duration;
            };
            AdViewer.prototype.destroy = function() {
                if (this.videoNodeCallbacks) {
                    this.videoNodeController.off(this.videoNodeCallbacks);
                }
            };
            AdViewer.prototype.getPreferredSource = function(sourceList) {
                var playableSources = [], preferableSource;
                var videoNode = this.videoNodeController.videoNode;
                for (var i = 0, len = sourceList.length; i < len; i++) {
                    var videoSource = sourceList[i];
                    if (videoNode.canPlayType(videoSource.type) === "probably") {
                        playableSources.push(videoSource);
                    }
                }
                if (playableSources.length === 0) {
                    for (var i = 0, len = sourceList.length; i < len; i++) {
                        var videoSource = sourceList[i];
                        if (videoNode.canPlayType(videoSource.type) === "maybe") {
                            playableSources.push(videoSource);
                        }
                    }
                }
                if (playableSources.length === 0) {
                    for (var i = 0, len = sourceList.length; i < len; i++) {
                        var videoSource = sourceList[i];
                        if (videoSource.type !== "application/x-shockwave-flash" && videoSource.type !== "video/mp4" && videoSource.src.indexOf(".mp4") > -1) {
                            playableSources.push(videoSource);
                        }
                    }
                }
                if (playableSources.length === 0) {
                    return Promise.reject(new VideoError_2.default(VideoError_2.default.NO_APPROPRIATE_VIDEO_SOURCE, "Cannot find an appropriate video source."));
                }
                playableSources.sort(function(a, b) {
                    if (a.bitrate && b.bitrate) {
                        return a.bitrate - b.bitrate;
                    } else if (a.width && b.width) {
                        return a.width - b.width;
                    } else if (a.height && b.height) {
                        return a.height - b.height;
                    }
                });
                for (var i = 0; i < this.adDisplayController.qualityLevel && playableSources.length > 1; i++) {
                    playableSources.shift();
                }
                var minDelta = Number.MAX_VALUE;
                for (var i = 0, len = playableSources.length; i < len; i++) {
                    var videoSource = playableSources[i];
                    var delta = Math.max(Math.abs(this.videoNodeController.getWidth() - videoSource.width), Math.abs(this.videoNodeController.getHeight() - videoSource.height));
                    if (delta < minDelta) {
                        minDelta = delta;
                        preferableSource = videoSource;
                    }
                }
                var preferredSource = preferableSource;
                if (!preferredSource) {
                    var message = "Cannot find an appropriate video source.";
                    if (sourceList.some(function(source) {
                        return source.isVpaid;
                    })) {
                        message = "VPAID returned. " + message;
                    }
                    return Promise.reject(new VideoError_2.default(VideoError_2.default.NO_APPROPRIATE_VIDEO_SOURCE, message));
                }
                if (/\.yandex\.(ru|net)\/get/.test(preferredSource.src)) {
                    return this.loadSourceRedirect(preferredSource.src).then(function(src) {
                        preferredSource.src = src;
                        return preferredSource;
                    });
                } else {
                    return preferredSource;
                }
            };
            AdViewer.prototype.loadSourceRedirect = function(src) {
                var tmpXhr = new XMLHttpRequest();
                if (tmpXhr.responseURL === undefined) {
                    return Promise.resolve(src);
                }
                return new Promise(function(resolve) {
                    var xhr = new XMLHttpRequest();
                    xhr.open("HEAD", net_8.fixUrlSheme(src));
                    xhr.onload = function() {
                        if (xhr.status === 200) {
                            resolve(xhr.responseURL);
                        } else {
                            resolve(src);
                        }
                    };
                    xhr.onerror = function() {
                        return resolve(src);
                    };
                    xhr.ontimeout = function() {
                        return resolve(src);
                    };
                    xhr.send();
                });
            };
            AdViewer.prototype.preload = function() {
                var _this = this;
                if (this.isPreloaded) {
                    return Promise.resolve();
                } else {
                    var mediaSourceOrPromise = this.getPreferredSource(this.mediaAd.sources);
                    if (this.mediaAd.imageSources.length) {
                        this.videoNodeController.setPoster(this.mediaAd.imageSources[0].src);
                    }
                    if (mediaSourceOrPromise instanceof Promise) {
                        return mediaSourceOrPromise.then(function(mediaSource) {
                            return _this.setMediaSource(mediaSource);
                        });
                    } else {
                        this.setMediaSource(mediaSourceOrPromise);
                        return Promise.resolve();
                    }
                }
            };
            AdViewer.prototype.setMediaSource = function(mediaSource) {
                this.isPreloaded = true;
                this.preferredSource = mediaSource;
                this.videoNodeController.setSrc(mediaSource.src);
                this.emit("ready");
            };
            AdViewer.prototype.subscribeEvents = function() {
                var _this = this;
                var mediaAd = this.mediaAd;
                var videoNodeController = this.videoNodeController;
                var repeats = 0;
                var bufferEmptyNum = 0;
                var isFirstBufferEmpty = true;
                this.videoNodeCallbacks = {
                    error: function(videoError) {
                        return _this.emit("stop", videoError);
                    },
                    pause: function() {
                        return _this.emit("pause");
                    },
                    resume: function() {
                        return _this.emit("resume");
                    },
                    complete: function() {
                        repeats++;
                        if (repeats === 1) {
                            _this.emit("complete");
                        } else {
                            _this.trackEvent(TrackingEventType_1.default.COMPLETE + repeats);
                        }
                        if (repeats === mediaAd.numRepeats) {
                            _this.emit("stop");
                        } else {
                            videoNodeController.resume();
                        }
                    },
                    fullscreen: function() {
                        _this.trackEvent(TrackingEventType_1.default.FULLSCREEN);
                    },
                    exitFullscreen: function() {
                        _this.trackEvent(TrackingEventType_1.default.EXIT_FULLSCREEN);
                    },
                    muteChange: function(muted) {
                        if (_this.isPlaying) {
                            _this.trackEvent(muted ? TrackingEventType_1.default.MUTE : TrackingEventType_1.default.UNMUTE);
                        }
                        _this.emit("muteChange", muted);
                    },
                    bufferEmpty: function() {
                        if (++bufferEmptyNum > mediaAd.playbackParams.bufferEmptyLimit) {
                            _this.emit("stop", new AdError_1.default("Buffer empty limit", AdError_1.default.BUFFER_EMPTY_LIMIT));
                        } else {
                            if (isFirstBufferEmpty) {
                                isFirstBufferEmpty = false;
                            } else {
                                _this.trackEvent(CustomTrackingEventType_1.default.BUFFER_EMPTY);
                                var bufferFullTimeout_1 = setTimeout(function() {
                                    _this.emit("stop", new AdError_1.default("Buffer full timeout", AdError_1.default.BUFFER_FULL_TIMEOUT));
                                }, _this.mediaAd.playbackParams.bufferFullTimeout);
                                _this.once("stop", function() {
                                    return clearTimeout(bufferFullTimeout_1);
                                });
                                _this.videoNodeController.once("bufferFull", function() {
                                    return clearTimeout(bufferFullTimeout_1);
                                });
                            }
                        }
                    },
                    bufferFull: function() {
                        _this.trackEvent(CustomTrackingEventType_1.default.BUFFER_FULL);
                    },
                    currentPositionChange: function(_a) {
                        var currentTime = _a.currentTime, duration = _a.duration;
                        if (!duration) {
                            if (mediaAd.duration) {
                                duration = mediaAd.duration;
                            } else {
                                return;
                            }
                        }
                        _this.videoCurrentTime = currentTime;
                        _this.videoDuration = duration;
                        _this.emit("currentPositionChange", {
                            currentTime: currentTime,
                            duration: duration
                        });
                    }
                };
                videoNodeController.on(this.videoNodeCallbacks);
            };
            AdViewer.prototype.start = function() {
                var videoNodeController = this.videoNodeController;
                videoNodeController.play();
                videoNodeController.setVisibleControls(false);
            };
            Object.defineProperty(AdViewer.prototype, "muted", {
                get: function() {
                    return this.videoNodeController.muted;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AdViewer.prototype, "videoNodeController", {
                get: function() {
                    return this.adDisplayController.videoNodeController;
                },
                enumerable: true,
                configurable: true
            });
            return AdViewer;
        }(AdMedia_1.AdMedia);
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = AdViewer;
    });
    define("adsdk/iframeStyle", [ "require", "exports" ], function(require, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = "\n.yaAdSdkVpaidContainer {\n    position: absolute;\n    top: 0;\n    right: 0;\n    bottom: 0;\n    left: 0;\n}\n\n.yaAdSdkVpaidContainer > iframe {\n    position: absolute;\n    top: 0;\n    left: 0;\n    width: 100%;\n    height: 100%;\n    margin: 0;\n    padding: 0;\n    border: 0;\n}\n";
    });
    define("adsdk/AdVpaid", [ "require", "exports", "adsdk/TrackingEventType", "adsdk/iframeStyle", "adsdk/AdMedia" ], function(require, exports, TrackingEventType_2, iframeStyle_1, AdMedia_2) {
        "use strict";
        var VIEW_MODS = {
            NORMAL: "normal",
            THUMBNAIL: "thumbnail",
            FULLSCREEN: "fullscreen"
        };
        var AdVpaid = function(_super) {
            __extends(AdVpaid, _super);
            function AdVpaid(adDisplayController, mediaAd) {
                var _this = this;
                _super.call(this, adDisplayController, mediaAd);
                this.isPreloaded = false;
                this.adParameters = mediaAd.vastAd.adParameters;
                this.on({
                    firstQuartile: function() {
                        return _this.trackEvent(TrackingEventType_2.default.FIRST_QUARTILE);
                    },
                    midpoint: function() {
                        return _this.trackEvent(TrackingEventType_2.default.MIDPOINT);
                    },
                    thirdQuartile: function() {
                        return _this.trackEvent(TrackingEventType_2.default.THIRD_QUARTILE);
                    },
                    pause: function() {
                        return _this.trackEvent(TrackingEventType_2.default.PAUSE);
                    },
                    resume: function() {
                        return _this.trackEvent(TrackingEventType_2.default.RESUME);
                    },
                    skip: function() {
                        return _this.trackEvent(TrackingEventType_2.default.SKIP);
                    },
                    close: function() {
                        return _this.trackEvent(TrackingEventType_2.default.CLOSE);
                    },
                    start: function() {
                        return _this.trackEvent(TrackingEventType_2.default.CREATIVE_VIEW);
                    },
                    videoStart: function() {
                        return _this.trackEvent(TrackingEventType_2.default.START);
                    },
                    complete: function() {
                        return _this.trackEvent(TrackingEventType_2.default.COMPLETE);
                    },
                    clickThrough: function() {
                        return _this.trackEvent(TrackingEventType_2.default.CLICK_THROUGH);
                    },
                    impression: function() {
                        return _this.trackEvent(TrackingEventType_2.default.IMPRESSION);
                    },
                    error: function(error) {
                        return _this.trackError(error);
                    }
                });
                this.videoNodeCallbacks = {
                    muteChange: function(muted) {
                        return _this.emit("muteChange");
                    }
                };
                this.once({
                    error: function(error) {
                        _this.emit("stop", error);
                    }
                });
            }
            AdVpaid.checkVPAIDInterface = function(creative) {
                return creative.handshakeVersion && typeof creative.handshakeVersion === "function" && creative.initAd && typeof creative.initAd === "function" && creative.startAd && typeof creative.startAd === "function" && creative.stopAd && typeof creative.stopAd === "function" && creative.skipAd && typeof creative.skipAd === "function" && creative.resizeAd && typeof creative.resizeAd === "function" && creative.pauseAd && typeof creative.pauseAd === "function" && creative.resumeAd && typeof creative.resumeAd === "function" && creative.expandAd && typeof creative.expandAd === "function" && creative.collapseAd && typeof creative.collapseAd === "function" && creative.subscribe && typeof creative.subscribe === "function" && creative.unsubscribe && typeof creative.unsubscribe === "function";
            };
            AdVpaid.prototype.play = function(autoplay) {
                var _this = this;
                if (autoplay === void 0) {
                    autoplay = true;
                }
                this.preload().then(function() {
                    if (autoplay) {
                        _this.containerNode.style.display = "block";
                        _this.creative.startAd();
                    }
                });
                return this.when("stop").then(function(error) {
                    if (error) {
                        return Promise.reject(error);
                    }
                });
            };
            AdVpaid.prototype.getCurrentTime = function() {
                var remaining = this.creative && typeof this.creative.getAdRemainingTime === "function" && this.creative.getAdRemainingTime() || 0;
                return this.duration - remaining;
            };
            AdVpaid.prototype.pause = function() {
                this.creative.pauseAd();
            };
            AdVpaid.prototype.resume = function() {
                this.creative.resumeAd();
            };
            AdVpaid.prototype.skip = function() {
                this.creative.skipAd();
            };
            AdVpaid.prototype.getDuration = function() {
                return this.creative && typeof this.creative.getAdDuration === "function" && this.creative.getAdDuration() || this.mediaAd.duration || 0;
            };
            AdVpaid.prototype.getAdDimensions = function() {
                if (this.creative && typeof this.creative.getAdDimensions === "function") {
                    return this.creative.getAdDimensions();
                } else {
                    return null;
                }
            };
            AdVpaid.prototype.destroy = function() {
                this.videoNodeController.off(this.videoNodeCallbacks);
                this.removeControls();
            };
            AdVpaid.prototype.preload = function() {
                var _this = this;
                this.videoNodeController.on(this.videoNodeCallbacks);
                if (this.isPreloaded) {
                    return Promise.resolve();
                } else {
                    return new Promise(function(resolve, reject) {
                        _this.load().catch(reject);
                        _this.when("loaded").then(function() {
                            _this.isPreloaded = true;
                            resolve();
                            _this.emit("ready");
                        });
                    });
                }
            };
            AdVpaid.prototype.load = function() {
                var _this = this;
                return this.createControls().then(function() {
                    return _this.putScriptInIFrame();
                }).then(function() {
                    return _this.initIFrame();
                }).then(function() {
                    return _this.initAd();
                });
            };
            AdVpaid.prototype.createControls = function() {
                var _this = this;
                return new Promise(function(resolve) {
                    var videoWrapperNode = _this.videoWrapperNode;
                    var containerNode = _this.containerNode = document.createElement("div");
                    containerNode.className = "yaAdSdkVpaidContainer";
                    containerNode.style.display = "none";
                    videoWrapperNode.style.position = "relative";
                    var style = _this.style = document.createElement("style");
                    style.type = "text/css";
                    style.innerHTML = iframeStyle_1.default;
                    containerNode.appendChild(style);
                    var iframe = _this.iframe = document.createElement("iframe");
                    iframe.scrolling = "no";
                    containerNode.appendChild(iframe);
                    iframe.addEventListener("load", resolve);
                    videoWrapperNode.appendChild(containerNode);
                });
            };
            AdVpaid.prototype.putScriptInIFrame = function() {
                var _this = this;
                return new Promise(function(resolve) {
                    var document = _this.iframe.contentWindow.document;
                    var script = document.createElement("script");
                    script.type = "text/javascript";
                    script.src = _this.getScriptSrc();
                    script.addEventListener("load", resolve);
                    document.head.appendChild(script);
                });
            };
            AdVpaid.prototype.initIFrame = function() {
                if (typeof this.iframe.contentWindow.getVPAIDAd === "function") {
                    this.creative = this.iframe.contentWindow.getVPAIDAd();
                } else {
                    throw new Error("VPAID does not provide getVPAIDAd function: " + this.getScriptSrc());
                }
                if (!AdVpaid.checkVPAIDInterface(this.creative)) {
                    throw new Error("VPAID does not implement all of the required functions: " + this.getScriptSrc());
                }
            };
            AdVpaid.prototype.initAd = function() {
                var window = this.iframe.contentWindow;
                var width = window.innerWidth;
                var height = window.innerHeight;
                var viewMode = VIEW_MODS.NORMAL;
                var desiredBitrate = 700;
                var creativeData = {
                    AdParameters: this.adParameters
                };
                var environmentVars = {
                    slot: this.iframe.contentDocument.body,
                    videoSlot: this.videoNodeController.videoNode,
                    videoSlotCanAutoPlay: true
                };
                this.subscribeCreativeEvents();
                this.creative.initAd(width, height, viewMode, desiredBitrate, creativeData, environmentVars);
            };
            AdVpaid.prototype.removeControls = function() {
                this.videoWrapperNode.removeChild(this.containerNode);
            };
            AdVpaid.prototype.getScriptSrc = function() {
                return this.getCurrentSource().src;
            };
            AdVpaid.prototype.getCurrentSource = function() {
                return this.mediaAd.sources.filter(function(mediaSource) {
                    return mediaSource.type === "application/javascript";
                })[0];
            };
            AdVpaid.prototype.subscribeCreativeEvents = function() {
                var _this = this;
                var events = {
                    start: "AdStarted",
                    stop: "AdStopped",
                    close: "AdUserClose",
                    videoStart: "AdVideoStart",
                    firstQuartile: "AdVideoFirstQuartile",
                    midpoint: "AdVideoMidpoint",
                    thirdQuartile: "AdVideoThirdQuartile",
                    complete: "AdVideoComplete",
                    pause: "AdPaused",
                    resume: [ "AdResumed", "AdPlaying" ],
                    loaded: "AdLoaded",
                    clickThrough: "AdClickThru",
                    volumeChange: [ "AdVolumeChanged", "AdVolumeChange" ],
                    sizeChange: "AdSizeChange",
                    expanded: "AdExpanded",
                    skip: "AdSkipped",
                    error: "AdError",
                    impression: "AdImpression",
                    finish: "AdFinished"
                };
                for (var key in events) {
                    if (events.hasOwnProperty(key)) {
                        (function(internalEvent) {
                            var event = events[internalEvent];
                            if (typeof event === "string") {
                                _this.subscribeCreativeEvent(internalEvent, event);
                            } else if (event instanceof Array) {
                                event.forEach(function(event) {
                                    return _this.subscribeCreativeEvent(internalEvent, event);
                                });
                            }
                        })(key);
                    }
                }
            };
            AdVpaid.prototype.subscribeCreativeEvent = function(internalEvent, event) {
                var _this = this;
                this.creative.subscribe(function() {
                    var args = [];
                    for (var _i = 0; _i < arguments.length; _i++) {
                        args[_i - 0] = arguments[_i];
                    }
                    return _this.emit(internalEvent, args.length > 1 ? args : args[0]);
                }, event);
            };
            Object.defineProperty(AdVpaid.prototype, "videoWrapperNode", {
                get: function() {
                    return this.adDisplayController.wrapperNode;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AdVpaid.prototype, "videoNodeController", {
                get: function() {
                    return this.adDisplayController.videoNodeController;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AdVpaid.prototype, "config", {
                get: function() {
                    return this.adDisplayController.config;
                },
                enumerable: true,
                configurable: true
            });
            return AdVpaid;
        }(AdMedia_2.AdMedia);
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = AdVpaid;
    });
    define("util/Control", [ "require", "exports", "util/util" ], function(require, exports, util_7) {
        "use strict";
        var Control = function() {
            function Control(elementClass, clickHandler, text, parent, stopPropagation) {
                if (stopPropagation === void 0) {
                    stopPropagation = true;
                }
                this.elementClass = elementClass;
                this.clickHandler = clickHandler;
                this.text = text;
                this.parent = parent;
                this.blocked = false;
                this.el = util_7.createDiv(elementClass, text);
                this.el.addEventListener("click", function(event) {
                    if (stopPropagation) {
                        event.stopPropagation();
                    }
                    if (typeof clickHandler === "function") {
                        clickHandler();
                    }
                });
            }
            Control.prototype.setText = function(text) {
                this.el.innerHTML = text.trim() || "";
                return this;
            };
            Control.prototype.setVisible = function(visible) {
                if (!this.blocked && this.isVisible !== visible) {
                    if (visible) {
                        this.parent.appendChild(this.el);
                    } else {
                        this.parent.removeChild(this.el);
                    }
                }
                return this;
            };
            Control.prototype.getClasses = function() {
                return this.el.className.split(/\s+/);
            };
            Control.prototype.hasClass = function(className) {
                return this.getClasses().indexOf(className) > -1;
            };
            Control.prototype.addClass = function(className) {
                if (!this.hasClass(className)) {
                    this.el.className += " " + className;
                }
                return this;
            };
            Control.prototype.removeClass = function(className) {
                if (this.hasClass(className)) {
                    var classes = this.getClasses();
                    classes.splice(classes.indexOf(className), 1);
                    this.el.className = classes.join(" ");
                }
                return this;
            };
            Control.prototype.setClasses = function(classes) {
                this.el.className = classes;
                return this;
            };
            Control.prototype.hide = function() {
                return this.setVisible(false);
            };
            Control.prototype.show = function() {
                return this.setVisible(true);
            };
            Control.prototype.setBlocked = function(blocked) {
                if (blocked) {
                    this.hide();
                }
                this.blocked = blocked;
                return this;
            };
            Control.prototype.block = function() {
                return this.setBlocked(true);
            };
            Control.prototype.unBlock = function() {
                return this.setBlocked(false);
            };
            Control.prototype.appendChild = function(el) {
                this.el.appendChild(el);
                return this;
            };
            Control.prototype.removeChild = function(el) {
                this.el.removeChild(el);
                return this;
            };
            Object.defineProperty(Control.prototype, "isVisible", {
                get: function() {
                    return this.el.parentElement === this.parent;
                },
                enumerable: true,
                configurable: true
            });
            return Control;
        }();
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = Control;
    });
    define("adsdk/Gui", [ "require", "exports", "util/util", "shared/rollover_mute", "util/EventBus", "util/net", "util/Control" ], function(require, exports, util_8, rollover_mute_1, EventBus_6, net_9, Control_1) {
        "use strict";
        var DEV_SKIN_URL = "../skin.css";
        var DEFAULT_SKIN_URL = "//" + ya.mediaAd.DOMAIN + "/awaps-ad-sdk-js/" + ya.mediaAd.SDK_URL_VERSION + "/skin.css";
        var UnmuteInviter = function(_super) {
            __extends(UnmuteInviter, _super);
            function UnmuteInviter(parent, handler) {
                var _this = this;
                _super.call(this, "unmuteInviter", null, null, parent);
                var wrapper = util_8.createDiv("unmuteInviterWrapper");
                var icon = util_8.createDiv("unmuteInviterIcon");
                wrapper.appendChild(icon);
                var text = util_8.createDiv("unmuteInviterText", "&#1053;&#1072;&#1074;&#1077;&#1076;&#1080;&#1090;&#1077; &#1082;&#1091;&#1088;" + "&#1089;&#1086;&#1088;,<br>&#1095;&#1090;&#1086;&#1073;&#1099; &#1074;&#1082;" + "&#1083;&#1102;&#1095;&#1080;&#1090;&#1100; &#1079;&#1074;&#1091;&#1082;");
                wrapper.appendChild(text);
                this.el.appendChild(wrapper);
                rollover_mute_1.createHoverBus(this.el).on({
                    enter: function() {
                        if (_this.timeout) {
                            return;
                        }
                        _this.timeout = setTimeout(function() {
                            _this.hide();
                            handler();
                        }, 1e3);
                    },
                    leave: function() {
                        clearTimeout(_this.timeout);
                        _this.timeout = 0;
                    }
                });
                icon.addEventListener("click", function(e) {
                    return e.preventDefault();
                });
                text.addEventListener("click", function(e) {
                    return e.preventDefault();
                });
            }
            UnmuteInviter.prototype.remove = function() {
                clearTimeout(this.timeout);
                this.hide();
            };
            return UnmuteInviter;
        }(Control_1.default);
        var Gui = function(_super) {
            __extends(Gui, _super);
            function Gui(container) {
                var _this = this;
                _super.call(this);
                this.container = container;
                this.hovered = false;
                this.controls = {};
                var wrapper = this.wrapper = new Control_1.default("yaAdSdkGui", function() {
                    return _this.emit("click");
                }, null, container, false);
                container.style.position = "relative";
                if (util_8.isIOS7()) {
                    wrapper.el.style.display = "none";
                }
                this.createControls();
                this.reemit(rollover_mute_1.createHoverBus(wrapper.el), [ "enter", "leave", "changeHover" ]);
                this.on("changeHover", function(hover) {
                    return _this.hovered = hover;
                });
            }
            Gui.prototype.addSkin = function(skinUrl) {
                if (!skinUrl) {
                    if (ya.mediaAd.DEFAULT_CSS) {
                        util_8.addBuiltinSkin();
                        return;
                    }
                    skinUrl = DEFAULT_SKIN_URL;
                }
                var styles = document.querySelectorAll("link");
                for (var i = 0; i < styles.length; i++) {
                    if (styles[i].href === skinUrl) {
                        return;
                    }
                }
                var style = document.createElement("link");
                style.type = "text/css";
                style.rel = "stylesheet";
                style.href = net_9.fixUrlSheme(ya.mediaAd.DEV_MODE ? DEV_SKIN_URL : skinUrl);
                var firstStyle = document.querySelector('head link[rel="stylesheet"]');
                if (firstStyle) {
                    document.querySelector("head").insertBefore(style, firstStyle);
                } else {
                    document.querySelector("head").appendChild(style);
                }
            };
            Gui.prototype.setMute = function(mute) {
                this.controls.mute.setClasses(mute ? "unMute" : "mute");
            };
            Gui.prototype.show = function() {
                this.wrapper.show();
            };
            Gui.prototype.hide = function() {
                this.wrapper.hide();
            };
            Gui.prototype.destroy = function() {
                this.hide();
                this.wrapper = null;
            };
            Gui.prototype.createControls = function() {
                var _this = this;
                var topRightBlock = this.topRightBlock = util_8.createDiv("topRightBlock");
                var wrapper = this.wrapper;
                wrapper.appendChild(topRightBlock);
                this.controls.timeLeft = new Control_1.default("timeLeft", null, "Реклама 00", wrapper.el);
                var visitSiteWrapper = util_8.createDiv("visitSiteWrapper");
                wrapper.appendChild(visitSiteWrapper);
                this.controls.visitSite = new Control_1.default("visitSite pointer", function() {
                    return _this.emit("click");
                }, "Перейти на сайт рекламодателя", visitSiteWrapper, false);
                this.controls.play = new Control_1.default("play", function() {
                    return _this.emit("play");
                }, null, wrapper.el);
                this.controls.pause = new Control_1.default("pause", function() {
                    return _this.emit("pause");
                }, null, wrapper.el).hide();
                this.controls.mute = new Control_1.default("mute", function() {
                    return _this.emit("changeMute");
                }, null, topRightBlock);
                this.controls.mute.el.style.zIndex = "10";
                this.controls.skipTimeLeft = new Control_1.default("skipTimeLeft", null, "&#1055;&#1088;&#1086;&#1087;&#1091;&#1089;&#1090;&#1080;&#1090;&#1100; " + "&#1088;&#1077;&#1082;&#1083;&#1072;&#1084;&#1091;: 5 &#1089;&#1077;&#1082;", topRightBlock);
                this.controls.skip = new Control_1.default("skip", function() {
                    return _this.emit("skip");
                }, "&#1055;&#1088;&#1086;&#1087;&#1091;&#1089;&#1090;&#1080;&#1090;&#1100;", topRightBlock);
                this.controls.skip.hide();
                this.controls.title = new Control_1.default("title", null, null, wrapper.el);
                this.controls.unmuteInviter = new UnmuteInviter(wrapper.el, function() {
                    _this.emit("changeMute", true);
                });
                this.controls.unmuteInviter.el.style.zIndex = "9";
            };
            return Gui;
        }(EventBus_6.default);
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = Gui;
    });
    define("adsdk/AdDisplayController", [ "require", "exports", "util/util", "adsdk/VideoNodeController", "shared/rollover_mute", "adsdk/DisplayController", "adsdk/TrackingEventType", "adsdk/error/AdError", "adsdk/AdViewer", "adsdk/AdVpaid", "adsdk/Gui" ], function(require, exports, util_9, VideoNodeController_1, rollover_mute_2, DisplayController_1, TrackingEventType_3, AdError_2, AdViewer_1, AdVpaid_1, Gui_1) {
        "use strict";
        var AdDisplayController = function(_super) {
            __extends(AdDisplayController, _super);
            function AdDisplayController(config, adManager, videoNodeOrId, videoWrapperNodeOrId) {
                var _this = this;
                _super.call(this, util_9.getElement(videoWrapperNodeOrId));
                this.config = config;
                this.adManager = adManager;
                this.qualityLevel = 0;
                var videoNode = util_9.getElement(videoNodeOrId);
                var videoWrapperNode = util_9.getElement(videoWrapperNodeOrId);
                var videoNodeController = this.videoNodeController = new VideoNodeController_1.default(videoNode);
                if (config.qualityLevel) {
                    this.qualityLevel = config.qualityLevel;
                }
                this.on({
                    afterEndAd: function() {
                        return _this.setVisibleNativeControls(true);
                    },
                    ready: function() {
                        return _this.setVisibleNativeControls(false);
                    }
                });
                this.reemit(rollover_mute_2.createHoverBus(videoWrapperNode), [ "changeHover" ]).on("changeHover", function(hover) {
                    return _this.isHovered = hover;
                });
                var gui = this.gui = new Gui_1.default(videoWrapperNode);
                var controls = gui.controls;
                if (util_9.isTouchDevice()) {
                    gui.wrapper.addClass("yaAdSdkGui-mobile");
                }
                if (util_9.isTouchDevice()) {
                    this.on([ "start", "resume" ], function() {
                        if (_this.currentAdMedia.playbackParams.pauseAllowed && !util_9.isIPhone()) {
                            controls.pause.show();
                        }
                    });
                } else {
                    gui.on({
                        enter: function() {
                            if (_this.currentAdMedia.playbackParams.pauseAllowed && !controls.play.isVisible && !controls.unmuteInviter.isVisible) {
                                controls.pause.show();
                            }
                        },
                        leave: function() {
                            return controls.pause.hide();
                        }
                    });
                    this.on([ "start", "resume" ], function() {
                        if (_this.currentAdMedia.playbackParams.pauseAllowed && gui.hovered) {
                            controls.pause.show();
                        }
                    });
                }
                this.on({
                    pause: function() {
                        return controls.pause.hide();
                    }
                });
                gui.on({
                    changeMute: function(fade) {
                        return _this.setMute(!videoNodeController.muted, fade);
                    },
                    click: function() {
                        return _this.clickThrough();
                    },
                    pause: function() {
                        return _this.pause();
                    },
                    play: function() {
                        _this.videoNode.play();
                        if (_this.currentAdMedia.isStarted) {
                            _this.trackEvent(TrackingEventType_3.default.RESUME);
                        }
                    },
                    skip: function() {
                        return _this.skip();
                    }
                });
                this.once("playAdMedia", function() {
                    var playbackParams = _this.currentAdMedia.playbackParams;
                    gui.addSkin(playbackParams.skinUrl);
                    if (playbackParams.isClickable && !playbackParams.visitSiteShow) {
                        gui.wrapper.addClass("pointer");
                    } else {
                        gui.wrapper.removeClass("pointer");
                    }
                    controls.play.setVisible(!playbackParams.autoplay);
                }).on({
                    afterEndAd: function() {
                        return gui.hide();
                    },
                    afterStartAdMedia: function(adMedia) {
                        var playbackParams = adMedia.playbackParams;
                        if (adMedia.contentType === "video") {
                            gui.show();
                        } else if (!controls.unmuteInviter.isVisible) {
                            gui.hide();
                        }
                        gui.topRightBlock.className = playbackParams.minimalGui ? "topRightBlockMinimal" : "topRightBlock";
                        controls.skip.setBlocked(playbackParams.minimalGui);
                        controls.skipTimeLeft.setBlocked(playbackParams.minimalGui || !playbackParams.skipTimeLeftShow);
                        controls.timeLeft.setVisible(playbackParams.timeLeftShow);
                        controls.title.setText(playbackParams.title).setVisible(!!playbackParams.title.trim() && !playbackParams.minimalGui);
                        controls.mute.setVisible(!util_9.isIOS() && (util_9.isTouchDevice() || !playbackParams.minimalGui));
                        controls.visitSite.setVisible(playbackParams.isClickable && playbackParams.visitSiteShow);
                        gui.setMute(_this.videoNodeController.muted);
                    },
                    beforeStartAd: function() {
                        gui.show();
                    },
                    currentPositionChange: function(_a) {
                        var currentTime = _a.currentTime, duration = _a.duration;
                        var showButton = currentTime >= _this.currentAdMedia.playbackParams.skipDelay && _this.currentAdMedia.playbackParams.skipDelay > 0;
                        var left = duration - currentTime;
                        var minutes = Math.floor(left / 60);
                        var skipLeft = Math.floor(_this.currentAdMedia.playbackParams.skipDelay - currentTime);
                        var seconds = Math.floor(left - minutes * 60);
                        _this.gui.controls.skipTimeLeft.setVisible(!showButton);
                        _this.gui.controls.skip.setVisible(showButton);
                        if (!showButton) {
                            _this.gui.controls.skipTimeLeft.setText("&#1055;&#1088;&#1086;&#1087;&#1091;&#1089;&#1090;&#1080;&#1090;&#1100; " + "&#1088;&#1077;&#1082;&#1083;&#1072;&#1084;&#1091;: " + skipLeft + " &#1089;&#1077;&#1082;");
                        }
                        _this.gui.controls.timeLeft.setText("&#1056;&#1077;&#1082;&#1083;&#1072;&#1084;&#1072; " + (seconds < 10 ? "0" + seconds : seconds));
                    },
                    muteChange: function(mute) {
                        return gui.setMute(mute);
                    },
                    pause: function() {
                        controls.play.show();
                    }
                }).on([ "start", "resume" ], function() {
                    return controls.play.hide();
                });
            }
            AdDisplayController.prototype.loadAndShowAd = function(adType) {
                var _this = this;
                this.isFinished = false;
                this.currentAdType = adType;
                this.videoNodeController.pause();
                return this.loadAd().then(function(adMediaList) {
                    return _this.adMediaList = adMediaList;
                }).then(function() {
                    return _this.showAd();
                }).catch(function(error) {
                    _this.emit("error", error);
                    return Promise.reject(error);
                });
            };
            AdDisplayController.prototype.destroy = function() {
                this.videoNodeController.destroy();
            };
            AdDisplayController.prototype.setMute = function(mute, fade) {
                this.videoNodeController.setMute(mute, fade);
            };
            AdDisplayController.prototype.clickThrough = function() {
                if (this.currentAdMedia) {
                    this.currentAdMedia.clickThrough();
                }
            };
            AdDisplayController.prototype.play = function(autoplay) {
                if (autoplay === void 0) {
                    autoplay = true;
                }
                if (autoplay) {
                    this.emit("playRequest");
                }
                return this.currentAdMedia.play(autoplay);
            };
            AdDisplayController.prototype.pause = function() {
                this.currentAdMedia.pause();
            };
            AdDisplayController.prototype.resume = function() {
                this.currentAdMedia.resume();
            };
            AdDisplayController.prototype.skip = function(eventType) {
                this.isFinished = true;
                this.currentAdMedia.skip(eventType);
                this.emitAdEnd();
            };
            AdDisplayController.prototype.getAdDimensions = function() {
                return this.currentAdMedia ? this.currentAdMedia.getAdDimensions() : null;
            };
            AdDisplayController.prototype.trackEvent = function(eventType) {
                this.currentAdMedia.trackEvent(eventType);
            };
            AdDisplayController.prototype.getCurrentContentType = function() {
                if (this.currentAdMedia) {
                    return this.currentAdMedia.contentType;
                } else {
                    return null;
                }
            };
            AdDisplayController.prototype.getCurrentTime = function() {
                return this.getCurrentMediaStartTime() + this.currentAdMedia.getCurrentTime();
            };
            AdDisplayController.prototype.getDuration = function() {
                var duration = 0;
                this.adMediaList.forEach(function(adMedia) {
                    duration += adMedia.duration;
                });
                return duration;
            };
            AdDisplayController.prototype.getPaused = function() {
                return this.videoNode.paused;
            };
            AdDisplayController.prototype.getMuted = function() {
                return this.videoNode.muted;
            };
            AdDisplayController.prototype.setVisibleNativeControls = function(visible) {
                if (!visible) {
                    if (!this.nativeControlsHidder) {
                        this.nativeControlsHidder = document.createElement("style");
                        this.nativeControlsHidder.innerHTML = "\n                    #" + this.videoNode.id + "::-webkit-media-controls{\n                        display:none !important;\n                    }\n                ";
                    }
                    document.head.appendChild(this.nativeControlsHidder);
                } else {
                    if (this.nativeControlsHidder && this.nativeControlsHidder.parentElement) {
                        document.head.removeChild(this.nativeControlsHidder);
                    }
                }
            };
            AdDisplayController.prototype.getCurrentAdMediaIndex = function() {
                return this.adMediaList.indexOf(this.currentAdMedia);
            };
            AdDisplayController.prototype.showAd = function() {
                var _this = this;
                return new Promise(function(resolve, reject) {
                    _this.emitAdEnd = resolve;
                    _this.emit("beforeStartAd");
                    _this.adMediaList[0].once({
                        ready: function() {
                            return _this.emit("ready");
                        },
                        start: function() {
                            return _this.emit("afterStartAd");
                        }
                    });
                    _this.adMediaList.forEach(function(adMedia) {
                        _this.reemit(adMedia, [ "start", "resume", "muteChange", "pause", "clickThrough" ]);
                        adMedia.once("start", function() {
                            return _this.emit("afterStartAdMedia", adMedia);
                        }).on("currentPositionChange", function(_a) {
                            var currentTime = _a.currentTime;
                            return _this.emit("currentPositionChange", {
                                currentTime: _this.getCurrentMediaStartTime() + currentTime,
                                duration: _this.duration
                            });
                        });
                    });
                    var complete = Promise.resolve();
                    _this.adMediaList.forEach(function(adMedia) {
                        complete = complete.then(function() {
                            return _this.isFinished ? null : _this.playAdMedia(adMedia).then(function() {
                                return _this.emit("afterEndAdMedia");
                            }).catch(function(error) {
                                _this.emit("afterEndAdMedia");
                                _this.isFinished = true;
                                reject(error);
                            });
                        });
                    });
                    return complete.then(resolve);
                }).then(function() {
                    return _this.emit("afterEndAd");
                }).catch(function(error) {
                    _this.emit("afterEndAd", error);
                    return Promise.reject(error);
                });
            };
            AdDisplayController.prototype.playAdMedia = function(adMedia) {
                var _this = this;
                this.currentAdMedia = adMedia;
                return new Promise(function(resolve, reject) {
                    var config = _this.config;
                    var playbackParams = adMedia.playbackParams;
                    var isVideo = adMedia.contentType === "video";
                    var errorTimeout = isVideo ? playbackParams.videoTimeout : playbackParams.vpaidTimeout;
                    var errorId = isVideo ? AdError_2.default.VIDEO_TIMEOUT : AdError_2.default.VPAID_TIMEOUT;
                    _this.once("playRequest", function() {
                        if (!adMedia.isStarted) {
                            var timeout_1 = setTimeout(function() {
                                reject(new AdError_2.default("Timeout of " + adMedia.contentType + ": " + errorTimeout, errorId));
                            }, errorTimeout);
                            adMedia.once([ "start", "resume" ], function() {
                                return clearTimeout(timeout_1);
                            });
                        }
                    });
                    _this.emit("playAdMedia");
                    var autoplay = !config.hasOwnProperty("autoplay") || config.autoplay;
                    _this.play(autoplay || _this.getCurrentAdMediaIndex() > 0).then(resolve).catch(reject);
                }).then(function() {
                    adMedia.destroyAdMedia();
                }).catch(function(error) {
                    adMedia.destroyAdMedia();
                    return Promise.reject(error);
                });
            };
            AdDisplayController.prototype.loadAd = function() {
                var _this = this;
                return this.adManager.loadAd(this.currentAdType).then(function(mediaAds) {
                    return mediaAds.map(function(mediaAd) {
                        return _this.createAdMedia(mediaAd);
                    });
                });
            };
            AdDisplayController.prototype.getCurrentMediaStartTime = function() {
                var num = this.getCurrentAdMediaIndex();
                var time = 0;
                for (var i = 0; i < num; i++) {
                    time += this.adMediaList[i].duration;
                }
                return time;
            };
            AdDisplayController.prototype.createAdMedia = function(mediaAd) {
                var playbackParams = mediaAd.playbackParams;
                var config = this.config;
                var adMedia;
                switch (mediaAd.contentType) {
                  case "vpaid":
                    adMedia = new AdVpaid_1.default(this, mediaAd);
                    break;

                  case "video":
                    adMedia = new AdViewer_1.default(this, mediaAd);
                    break;

                  default:
                    throw new Error("Unresolved content type of mediaAd");
                }
                if (config.numruns) {
                    adMedia.setNumRepeats(config.numruns);
                }
                if (config.impressionOffset !== undefined) {
                    adMedia.impressionTrackOffset = config.impressionOffset;
                }
                if (!config.duration && this.videoNodeController.videoNode.duration) {
                    config.duration = this.videoNodeController.videoNode.duration;
                }
                if (config.minimalGui === true) {
                    playbackParams.minimalGui = true;
                }
                if (config.visitSiteShow !== undefined) {
                    playbackParams.visitSiteShow = config.visitSiteShow;
                }
                if (config.autoplay !== undefined) {
                    playbackParams.autoplay = config.autoplay;
                }
                if (config.pauseAllowed !== undefined) {
                    playbackParams.pauseAllowed = config.pauseAllowed;
                }
                config.width = this.videoNodeController.getWidth();
                config.height = this.videoNodeController.getHeight();
                return adMedia;
            };
            Object.defineProperty(AdDisplayController.prototype, "videoNode", {
                get: function() {
                    return this.videoNodeController.videoNode;
                },
                enumerable: true,
                configurable: true
            });
            Object.defineProperty(AdDisplayController.prototype, "muted", {
                get: function() {
                    return this.videoNode.volume === 0;
                },
                enumerable: true,
                configurable: true
            });
            return AdDisplayController;
        }(DisplayController_1.DisplayController);
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = AdDisplayController;
    });
    define("adsdk/AdSdkCallbacks", [ "require", "exports" ], function(require, exports) {
        "use strict";
    });
    define("adsdk/AdConfigParams", [ "require", "exports" ], function(require, exports) {
        "use strict";
        var AdConfigParams = {
            VAST_URL: "vastUrl",
            VAST: "vast",
            AD_FOX_URL: "adFoxUrl",
            AD_FOX_URL_VAST: "adFoxUrlVast",
            PREFER_ADFOX: "preferAdFox",
            PARTNER_ID: "partnerId",
            CATEGORY: "category",
            TAGS_LIST: "tagsList",
            CHARSET: "charset",
            VIDEO_CONTENT_ID: "videoContentId",
            VIDEO_CONTENT_NAME: "videoContentName",
            VIDEO_PUBLISHER_ID: "videoPublisherId",
            VIDEO_PUBLISHER_NAME: "videoPublisherName",
            VIDEO_GENRE_ID: "videoGenreId",
            VIDEO_GENRE_NAME: "videoGenreName",
            EXT_PARAM: "extParam",
            PLAYER_INFO: "playerInfo",
            DURATION: "duration",
            IMPRESSION_TRACK_OFFSET: "impressionOffset"
        };
        Object.defineProperty(exports, "__esModule", {
            value: true
        });
        exports.default = AdConfigParams;
    });
    define("AdSDK", [ "require", "exports", "adsdk/AdDisplayController", "util/util", "adsdk/AdConfigParams", "adsdk/AdManager", "adsdk/BlockInfo", "util/net", "adsdk/AdType" ], function(require, exports, AdDisplayController_1, util_10, AdConfigParams_1, AdManager_1, BlockInfo_1, net_10, AdType_3) {
        "use strict";
        var MediaAdNs = ya.mediaAd;
        MediaAdNs.initPlacement = function(config, onInit, onError) {
            function onSuccess(blockInfo) {
                onInit(new AdManager_1.default(config, blockInfo));
            }
            if (config.blockInfo) {
                onSuccess(config.blockInfo);
            } else {
                BlockInfo_1.default.load(config).then(onSuccess).catch(function(blockInfoError) {
                    net_10.trackError(blockInfoError);
                    util_10.fireCallback(onError, blockInfoError);
                });
            }
        };
        MediaAdNs.initAdDisplay = function(config, videoNodeOrId, videoWrapperNodeOrId, callback) {
            MediaAdNs.initPlacement(config, function(adManager) {
                util_10.fireCallback(callback, new AdDisplayController_1.default(config, adManager, videoNodeOrId, videoWrapperNodeOrId));
            }, callback);
        };
        var AdSDK = function() {
            function AdSDK(config, videoNodeOrId, videoWrapperNodeOrId) {
                this.config = config;
                this.adCallbacks = {
                    onAdStart: function() {
                        return;
                    },
                    onAdEnd: function() {
                        return;
                    },
                    onAdMediaStart: function() {
                        return;
                    },
                    onAdMediaEnd: function() {
                        return;
                    }
                };
                this.videoNode = util_10.getElement(videoNodeOrId);
                this.videoWrapperNode = util_10.getElement(videoWrapperNodeOrId);
            }
            AdSDK.prototype.init = function(onInit, onError) {
                var _this = this;
                this.callbacks = {
                    onInit: onInit,
                    onError: onError
                };
                MediaAdNs.initAdDisplay(this.config, this.videoNode.id, this.videoWrapperNode.id, function(obj) {
                    if (obj instanceof Error) {
                        util_10.fireCallback(onError, obj);
                    } else {
                        _this.displayController = obj;
                        _this.displayController.on({
                            afterStartAd: function() {
                                return util_10.fireCallback(_this.adCallbacks.onAdStart, _this.displayController.currentAdType);
                            },
                            afterStartAdMedia: function() {
                                return util_10.fireCallback(_this.adCallbacks.onAdMediaStart, _this.displayController.currentAdType);
                            },
                            afterEndAdMedia: function() {
                                return util_10.fireCallback(_this.adCallbacks.onAdMediaEnd, _this.displayController.currentAdType);
                            },
                            afterEndAd: function() {
                                return util_10.fireCallback(_this.adCallbacks.onAdEnd, _this.displayController.currentAdType);
                            }
                        });
                        _this.mainVideoState = _this.displayController.videoNodeController.getVideoState();
                        _this.startWatchingVideoForAd();
                        util_10.fireCallback(onInit, _this.adCallbacks);
                    }
                });
            };
            AdSDK.prototype.startWatchingVideoForAd = function() {
                var _this = this;
                var videoNodeController = this.displayController.videoNodeController;
                return videoNodeController.when("start").then(function() {
                    return _this.showAd(AdType_3.default.PREROLL);
                }).then(function() {
                    return _this.playMainVideo();
                }).catch(function(error) {
                    util_10.fireCallback(_this.callbacks.onError, error);
                    _this.playMainVideo();
                }).then(function() {
                    return videoNodeController.when("complete");
                }).then(function() {
                    return _this.showAd(AdType_3.default.POSTROLL);
                }).then(function() {
                    return _this.setMainVideo();
                }).then(function() {
                    return _this.startWatchingVideoForAd();
                }).catch(function(error) {
                    util_10.fireCallback(_this.callbacks.onError, error);
                    _this.setMainVideo();
                });
            };
            AdSDK.prototype.setMainVideo = function() {
                this.displayController.videoNodeController.setVideoState(this.mainVideoState);
            };
            AdSDK.prototype.playMainVideo = function() {
                this.setMainVideo();
                this.displayController.videoNodeController.play();
            };
            AdSDK.prototype.showAd = function(adType) {
                return this.displayController.loadAndShowAd(adType);
            };
            return AdSDK;
        }();
        MediaAdNs.initForVideoNode = function(config, videoNodeOrId, videoWrapperNodeOrId, onInit, onError) {
            var adSDK = new AdSDK(config, videoNodeOrId, videoWrapperNodeOrId);
            adSDK.init(onInit, onError);
        };
        MediaAdNs.AdConfigParams = AdConfigParams_1.default;
        var VideoAdNS = ya.videoAd;
        VideoAdNS.AdConfigParams = AdConfigParams_1.default;
        VideoAdNS.initVideoNode = function(config, videoNodeId, videoWrapperNodeId, callback) {
            MediaAdNs.initForVideoNode(config, videoNodeId, videoWrapperNodeId, callback, callback);
        };
    });
    require("AdSDK");
}).call({}, window);
//# sourceMappingURL=adsdk.js.map
