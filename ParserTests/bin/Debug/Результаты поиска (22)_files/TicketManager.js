(function (g, d, undefined) {
	// ticketmanager helpers
	var tmH = {
		hasClass: function (element, className) {
			var cn = element.className;
			var rxp = new RegExp("\\s?\\b" + className + "\\b", "g");
			return (rxp.test(cn) ? true : false);
		},
		addClass: function (element, className) {
			var cn = element.className;
			if (cn.indexOf(className) != -1) {
				return;
			}
			if (cn != '') {
				className = ' ' + className;
			}
			element.className = cn + className;
		},
		removeClass: function (element, className) {
			var cn = element.className;
			var rxp = new RegExp("\\s?\\b" + className + "\\b", "g");
			cn = cn.replace(rxp, '');
			element.className = cn;
			return element;
		},
		toggleClass: function (element, className) {
			if (!element || !className) {
				return;
			}
			var classString = element.className,
				nameIndex = classString.indexOf(className);
			if (nameIndex == -1) {
				classString += ' ' + className;
			} else {
				classString = classString.substr(0, nameIndex) + classString.substr(nameIndex + className.length);
			}
			element.className = classString;
		},
		createElement: function (tag, params) {
			params = params || {};
			var elem = d.createElementNS ?
			   d.createElementNS('http://www.w3.org/1999/xhtml', tag) :
			   d.createElement(tag);
			this.attrs(elem, params);
			return elem;
		},
		attrs: function (el, params) {
			for (var pr in params) {
				this.attr(el, pr, params[pr]);
			}
			return el;
		},
		attr: function (el, at, value) {
			at = { 'for': 'htmlFor', 'class': 'className' }[at] || at;
			if (!value) {
				return el[at] || el.getAttribute(at) || '';
			} else {
				if (at == 'style') { el.style.cssText = value; return; }
				el[at] = value;
				if (el.setAttribute) el.setAttribute(at, value);
			}
		},
		getWindowSize: function (dX, dY) {
			return {
				width: parseInt(window.innerWidth || d.documentElement.clientWidth) - 2 * (dX || 0),
				height: parseInt(window.innerHeight || d.documentElement.clientHeight) - 2 * (dY || 0)
			};
		},
		getWindowYCenter: function (height) {
			//var scrollTop = window.pageYOffset || d.documentElement.scrollTop;
			var scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (d.documentElement || d.body.parentNode || d.body).scrollTop;
			var windowHeight = this.getWindowSize().height;

			windowHeight = windowHeight < height ?
				height :
				parseInt(windowHeight);

			return Math.ceil(scrollTop + windowHeight / 2);
		},
		debounce: function(a, b, c) { var d;
			return function() {
				var e = this, f = arguments;
				clearTimeout(d), d = setTimeout(function() { d = null, c || a.apply(e, f); }, b), c && !d && a.apply(e, f);
			};
		},
		removeElement: function (el){
			el.parentNode.removeChild(el);
		}
	};

	g.tmH = tmH;

})(this, this.document);
//console.log(tmH);

// TicketManager
function TicketManager() {
    this.CommandUrlWithParametersTemplate = "{CommandURL}?command={Action}&ReturnURL={ReturnURL}{AdditionalParams}";
    this.FrameTemplate = "<iframe id='frame_{FrameID}' class='afisha-id-iframe widget_frame__iframe' src='{CommandURLWithParameters}' style='display: none;' scrolling='no' frameborder='0' allowTransparency='true' onload='onFrameLoad()'></iframe>";
}

function onFrameLoad() {
    var loader = document.getElementById("afishaWidgetLoader");
    if (loader)
        loader.style.display = "none";
}

TicketManager.prototype = {
	FrameID: null,
	CommandURL: null,
	ReturnURL: null,
	CookieDomain: null,
	widgets: null,
	customLoader: null,
	maxRequestLength: 2000,
	orderKeyParam: 'AFISHA_PARAM_ORDERKEY',
	creationTypeParam: 'AFISHA_CREATION_TYPE',
	onClose: { success: function () { }, close: function () { } },

	InitDialog: function (width, height) {

		this.borderStyleOld = this.borderStyleOld || "9px solid #eee";
		this.borderStyle = this.borderStyle || "9px solid rgba(223,223,223, 0.5)";

		var head = document.getElementsByTagName('head')[0];
		var style = document.createElement('style');
		style.type = 'text/css';
		var css = ".g-simple-button { display: block;position: absolute; z-index:3000; top: 13px;right: 16px;height: 19px;width: 19px;padding: 0;line-height: 10px;text-indent: -999em;cursor: pointer;box-shadow: 0 1px 0 #CCC;-moz-box-shadow: 0 1px 0 rgba(0, 0, 0, 0.1);-webkit-box-shadow: 0 1px 0 rgba(0, 0, 0, 0.1);box-shadow: 0 1px 0 rgba(0, 0, 0, 0.1);border: 1px solid #CCC;-moz-border-radius: 3px;-webkit-border-radius: 3px;border-radius: 3px;background: #F5F5F6;background: -moz-linear-gradient(top, white, #EEEEF0);background: -webkit-linear-gradient(top, white, #EEEEF0);background: -o-linear-gradient(top, white, #EEEEF0);background: -ms-linear-gradient(top, white, #EEEEF0);background: linear-gradient(top, white, #EEEEF0);filter: progid:DXImageTransform.Microsoft.Gradient(GradientType=0, StartColorStr='#ffffff', EndColorStr='#eeeef0');text-align: center;font-size: 11px;color: #666; }" +
			    ".g-simple-button:hover { border: 1px solid #FF781A;}" +
			".g-simple-button__close { font:bold 16px/18px Tahoma, sans-serif; text-decoration:none; color:#666; text-indent:0; vertical-align:top;}" +
			".g-simple-button__close:hover { color:#666; text-decoration:none;}" +
			".g-simple-button__img { display: block; margin: 5px auto 0px;}" +
			".widget_frame { position:fixed; top:50%; left:50%; display:block; border:" + this.borderStyleOld + "; border:" + this.borderStyle + "; box-shadow:0 0 30px -5px #000; overflow:hidden; z-inde:65011; -webkit-overflow-scrolling:touch; z-index:65011; -moz-box-sizing:border-box; -webkit-box-sizing:border-box; box-sizing:border-box;}" +
			".widget_frame__iframe { width:100% !important; height:100% !important; display:block;}" +
			".widget_content_popup { position:fixed; position:device-fixed; top:50%; left:50%; z-index:65012; width:0; height:0; background:rgba(0,0,0, 0.44); display:none; }" +
			".widget_content_popup_in { overflow:auto; overflow:hidden; -webkit-box-shadow:0 0 30px -5px #000; -moz-box-shadow 0 0 30px -5px #000; box-shadow:0 0 30px -5px #000; border:9px solid #eee; border:9px solid rgba(223,223,223, 0.5); margin:-9px;}" +
			".widget_content_popup__img { max-width:100%; height:auto; vertical-align:top; }" +
			".widget_content_popup_full .widget_content_popup_in { overflow:auto;}" +
			".widget_content_popup_full .widget_content_popup__img { width:auto; height:auto;}" +
			"" +
			".aw_loader { top:0; left:0; right:0; bottom:0; background:#bcbfc6; position:absolute;}" +
			".aw_loader__fakehead, .aw_loader__fakefoot { position:absolute; top:0; left:20%; height:72px; right:0; background:#fff;}" +
			".aw_loader__fakeleft { top:0; left:0; width:20%; bottom:0; background:#fff; position:absolute;}" +
			".aw_loader__fakefoot { top:auto; bottom:0; height:52px;}" +
			".aw_loader__cont { top:0; left:0; right:0; bottom:0; text-align:center; padding:0 0 0 20%; margin:auto 0; height:205px; position:absolute;}" +
			".aw_loader__ram_img { }" +
			".aw_loader__load_img { display:block; margin:52px auto 0; }";

		if (style.styleSheet) {
			style.styleSheet.cssText = css;
		} else {
			style.appendChild(document.createTextNode(css));
		}
		head.appendChild(style);

		this.popupMinWidth = 700;
		this.popupMinHeight = 528;
		this.popupMaxWidth = 1330;
		this.popupMaxHeight = 1000;
		this.popupBorderWidth = 9;
		this.popupWidth = width;
		this.popupHeight = height;

		this.afPopup = document.getElementById(ticketManager.FrameID);

		this.afPopup.className += " widget_frame";
		this.UpdateDialogPosition();
		this.afPopup.style.display = "block";
	},

	UpdateDialogPosition: function () {
		//var afPopup = document.getElementById(ticketManager.FrameID),
		var afPopup = this.afPopup,
			afStyle,
			popupSizes = this.getPopupSizes();

		if (afPopup) {
			afStyle = afPopup.style;

			afStyle.position = 'absolute';
			afStyle.width = popupSizes.width;
			afStyle.height = popupSizes.height;
			afStyle.left = "50%";
			afStyle.top = tmH.getWindowYCenter(popupSizes.height) + "px";
			afStyle.marginLeft = popupSizes.marginLeft;
			afStyle.marginTop = popupSizes.marginTop;
		}
		//alert(JSON.stringify(tmH.getWindowSize()) + " " + JSON.stringify(afStyle) );
		//console.log(popupSizes);
	},
	isMobileDevice: function () {
	    var maxMobileSize = 1280,
            mobileBrowsers = ["android", "blackberry"],
            isMobileBrowser = false,
            userAgent = navigator.userAgent.toLowerCase(),
            isIphone = userAgent.indexOf('iphone') > -1,
            isNotIpad = userAgent.indexOf('ipad') === -1,
            isMobileSize = screen.width < maxMobileSize && screen.height < maxMobileSize;

	    for (var i in mobileBrowsers) {
	        isMobileBrowser = userAgent.indexOf(mobileBrowsers[i]) > -1;
	        if (isMobileBrowser) {
	            break;
	        }
	    }

	    return isNotIpad && (isIphone || (isMobileBrowser && isMobileSize));
	},

	getPopupSizes: function () {
		var windowSize = tmH.getWindowSize();

		var widthTemp = this.popupWidth == '100%' ? windowSize.width : this.popupWidth;
		var heightTemp = this.popupHeight == '100%' ? windowSize.height : this.popupHeight;
		var width = widthTemp;
		var height = heightTemp;
		var marginLeft = width / 2;
		var marginTop = height / 2;

		return {
			width: width + 'px',
			height: height + 'px',
			marginLeft: -Math.round(marginLeft) + 'px',
			marginTop: -Math.round(marginTop) + 'px'
		};
	},

	ResizeDialog: function() {
		return tmH.debounce(function() {
			ticketManager.UpdateDialogPosition.apply(ticketManager, arguments);
		}, 250);
	},

	Execute: function (command) {
		if (typeof ie_6 == 'undefined') {
			var ie_6 = false;
			var ua = navigator.userAgent;
			var msieOffset = ua.indexOf("MSIE ");
			if (msieOffset != -1) {
				var ie_6 = parseFloat(ua.substring(msieOffset + 5, ua.indexOf(";", msieOffset))) <= 6;
			}
		}
		if (ie_6) {
			notSupported();
			return false;
		}

		ticketManager.load();

		var frame;
		switch (command.Name) {
			case "command":
			    this.commandFunction(command);
				break;

			case "setStyle":
				frame = document.getElementById('frame_' + ticketManager.FrameID);
				if (command.Args) {
					for (var i in command.Args) {
						frame.style[i] = command.Args[i];
					}
				}
				frame.style.display = "block";
				if (typeof (command.Args.width) != 'undefined')
					frame.style.left = (document.body.clientWidth - parseInt(command.Args.width)) / 2;
				if (typeof (command.Args.height) != 'undefined')
					frame.style.top = (document.body.clientHeight - parseInt(command.Args.height)) / 2;
				break;
			case "getUrl":
				frame = document.getElementById('frame_' + ticketManager.FrameID);
				frame.src = command.Args.URL + "#" + escape(location.href);
				break;

			case "redirect":
				var hashPrm = '';
				if (location.href.indexOf('#') > -1) {
					hashPrm = location.href.split('#')[1];
				}
				if (UrlRemoveHash(location.href) != command.Args.RedirectURL) {
					var url = command.Args.RedirectURL;
					if (hashPrm.length > 0)
						url = url + '#' + hashPrm;
					location.replace(url);
				}
				else {
					var url = getUrlWithoutHash(command.Args.RedirectURL);
					if (hashPrm.length > 0)
						url = url + '#' + hashPrm;
					location = url;
				}
				break;

			case "refresh":
				location.reload();
				break;
			case "setCookie":
				if (command.Args.Expires) {
					exdate = new Date();
					exdate.setDate(exdate.getDate() + 1 * command.Args.Expires);
					document.cookie = command.Args.Name + "=" + escape(command.Args.Value) + ((command.Args.Expires == null) ? "" : ";expires=" + exdate.toGMTString()) + (ticketManager.CookieDomain ? ";domain=" + ticketManager.CookieDomain : "") + ";path=/";
				}
				else
					document.cookie = command.Args.Name + "=" + escape(command.Args.Value) + (ticketManager.CookieDomain ? ";domain=" + ticketManager.CookieDomain : "") + ";path=/";
				break;
			case "hide":
				var el = document.getElementById(ticketManager.FrameID);
				if (el && el.parentNode)
					el.parentNode.removeChild(el);
				var ov = document.getElementById("afishaOverlay");
				if (ov && ov.parentNode)
					ov.parentNode.removeChild(ov);
				break;
			case "package":
				for (var i in command.Args)
					ticketManager.Execute(command.Args[i]);
				break;
			case "open":
				ticketManager.openWidget(command.Args.key, command.Args.movieName, command.Args.cityName);
				break;
			case "cinemaSchedule":
				ticketManager.cinemaSchedule(command.Args.key, command.Args.cinemaID);
				break;
			case "showImagePopup":
				ticketManager.showImagePopup(command.Args.url);
				break;
			case "session":
				ticketManager.session(command.Args.key, command.Args.sessionID);
				break;
			case "close":
				document.getElementById(ticketManager.FrameID).style.display = "none";
				document.getElementById("afishaOverlay").style.display = "none";
				ticketManager.removeOrderKeyParam();
				ticketManager.dispatchEvent("ticketmanager.events.close");
				//замута, чтоб сайт не скроллился при всплывании нашего окна
				document.getElementsByTagName("body")[0].style.cssText = document.getElementsByTagName("body")[0].style.cssText.replace(/;?overflow(-[xy])?:\s*hidden/gi, "").replace(/;?margin-right?:/gi, "");
				if (!command.Args)
					command.Args = {};
				if (command.Args.success)
					ticketManager.onClose.success({ orderKey: command.Args.orderKey });
				ticketManager.onClose.close({ success: command.Args.success, orderKey: command.Args.orderKey });
				tmH.removeElement(document.getElementById(ticketManager.FrameID));
				break;
			case "setHeight":
				var widget = ticketManager.getWidgetByKey(command.Args.key);
				var widgetIframe = document.getElementsByName("widget" + widget.Uid);
				var height = command.Args.height;
				widgetIframe[0].style.height = height + "px";
				break;
		    case "loaded":
		        onFrameLoad();
		        break;
		}
	},

	commandFunction: function(command) {
	    ticketManager.Execute({ Name: "hide" });
	    var additionalParams = "";
	    if (command.Args.AdditionalParams != null) {
	        var params = new Array();
	        for (var i = 0; i < command.Args.AdditionalParams.length; i++) {
	            var strFormat = new Array();
	            strFormat.push(command.Args.AdditionalParams[i].name);
	            strFormat.push(command.Args.AdditionalParams[i].value);
	            params.push(strFormat.join("="));
	        }
	        if (params.length > 0)
	            additionalParams = "&" + params.join("&");
	    }
	    var useMobileVersion = ticketManager.isMobileDevice() && command.IsMobileVersionSupported === true;
	    if (useMobileVersion)
	        additionalParams += "&devicetype=mobile";
	    var commandUrlWithParameters = ticketManager.CommandUrlWithParametersTemplate.
	        replace('{CommandURL}', ticketManager.CommandURL).
	        replace('{Action}', command.Args.Action).
	        replace('{AdditionalParams}', additionalParams).
	        replace('{ReturnURL}', command.Args.ReturnURL ? escape(command.Args.ReturnURL) : escape(ticketManager.ReturnURL));
	    if (useMobileVersion)
	        window.top.location = commandUrlWithParameters;
	    else
	        ticketManager.loadPopupFrame(commandUrlWithParameters);	    
	},

	loadPopupFrame: function (commandUrlWithParameters) {
	    var html = ticketManager.FrameTemplate.
	        replace('{CommandURLWithParameters}', commandUrlWithParameters).
	        replace('{FrameID}', ticketManager.FrameID);
        var loaderdiv = ticketManager.customLoader == null ?
                        ticketManager.getBaseLoader() : ticketManager.customLoader();
        loaderdiv.setAttribute("id", "afishaWidgetLoader");

        var newdiv = document.createElement('div');
        newdiv.appendChild(loaderdiv);
        newdiv.innerHTML += html;
        newdiv.setAttribute('id', ticketManager.FrameID);

        var overlay = document.createElement('div');
        overlay.setAttribute("id", "afishaOverlay");
        overlay.style.cssText = "position:fixed; top:-1000px; left:-1000px; z-index:65010; width:5000px; height:15000px; background:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEUAAACnej3aAAAAAXRSTlNwEOOpWgAAAApJREFUeF5jYAAAAAIAAd6ej78AAAAASUVORK5CYII=)";

        /*замута, чтоб сайт не скроллился при всплывании нашего окна:
        все содержимое их сайта в body оборачивается в див с overflow:hidden;  */
        var body = document.getElementsByTagName("body")[0];
        var w1 = body.clientWidth;
        body.style.cssText += ";overflow:hidden";
        var w2 = body.clientWidth;
        body.style.cssText += ";margin-right:" + (w2 - w1) + 'px';
        body.appendChild(overlay);
        body.appendChild(newdiv);
        ticketManager.initDialogAndSetStyle();
    },

	popupContentSizes: function (contentWidth, contentHeight) {
		var possibleSizes = tmH.getWindowSize(20,20),
			widthToHeight = contentWidth / contentHeight,
			newWidth = possibleSizes.width,
			newHeight = possibleSizes.height,
			newWidthToHeight = newWidth / newHeight;

		if (newWidthToHeight > widthToHeight) {
			if (contentHeight <= newHeight) {
				newHeight = contentHeight;
				newWidth = contentHeight * widthToHeight;
			} else {
				newWidth = parseInt(newHeight * widthToHeight);
			}
		} else {
			if (contentWidth <= newWidth) {
				newWidth = contentWidth;
				newHeight = contentWidth / widthToHeight;
			} else {
				newHeight = parseInt(newWidth / widthToHeight);
			}
		}

		return {
			width: newWidth,
			height: newHeight
		};
	},

	resetContentBlock: function (el, id) {
		el.innerHTML = '' +
				'<a href="javascript:ticketManager.closeImagePopup(&quot;' + id + '&quot;);" class="g-simple-button g-simple-button__close s-close-button">&times;</a>' +
				'<div id="' + id + '_content" class="widget_content_popup_in"></div>';
		tmH.removeClass(el, 'widget_content_popup_full');
		return el;
	},
	createContentBlock: function (id) {
		var cb = document.getElementById(id);
		if (!cb) {
			cb = tmH.createElement('div', { id: id, 'class': 'widget_content_popup' });
			document.getElementsByTagName("body")[0].appendChild(cb);
		}
		return ticketManager.resetContentBlock(cb, id);
	},
	centerContentBlock: function (el, width, height) {
		el.style.width = width;
		el.style.height = height;
		el.style.marginLeft = "-" + parseInt(width) / 2 + "px";
		el.style.marginTop = "-" + parseInt(height) / 2 + "px";
		return el;
	},

	showImagePopup: function (url) {

		var image = new Image();
		var imageContainerId = "ticketManagerImageContainer";

		var imageLoaded = function () {
			var imageContainer = ticketManager.createContentBlock(imageContainerId);
			var imageContainerIn = document.getElementById(imageContainerId + "_content");
			var newImageSizes = ticketManager.popupContentSizes(this.width, this.height);

			var toggleZoomImage = function () {
				tmH.toggleClass(imageContainerIn, 'widget_content_popup_full');

				if (tmH.hasClass(imageContainerIn, 'widget_content_popup_full')) {
					tmH.removeClass(imageContainerIn, 'widget_content_popup_full');
					imageContainerIn.style.cssText = '';
				} else {
					tmH.addClass(imageContainerIn, 'widget_content_popup_full');
				}


			};

			imageContainer.style.width = newImageSizes.width + "px";
			imageContainer.style.height = newImageSizes.height + "px";

			var imageParams = {
				"class": "widget_content_popup__img",
				"style": "" +
					"width:" + newImageSizes.width + "px;" +
					"height:" + newImageSizes.height + "px;" +
					"max-width:" + this.width + "px;" +
					"max-height:" + this.height + "px;"
			};

			image = tmH.attrs(image, imageParams);

			var link = tmH.createElement('a', { 'href': url, 'target': '_blank' });
			link.appendChild(image);
			imageContainerIn.appendChild(link);
			imageContainerIn.onclick = toggleZoomImage;

			imageContainer.style.display = "block";

			ticketManager.centerContentBlock(imageContainer, newImageSizes.width, newImageSizes.height);
		};

		var imageError = function () {
			//console.log('Error hallplan image load!');
		};

		image.onload = imageLoaded;
		image.onerror = imageError;
		image.src = url;
		image.style.display = 'block';
	},

	createZoom: function () {

	},

	closeImagePopup: function (id) {
		document.getElementById(id).style.display = 'none';
	},

	zoomImagePopup: function (id) {
		tmH.toggleClass(document.getElementById(id), 'widget_content_popup_full');
	},

	getBaseLoader: function () {
		var fakehead = document.createElement('div');
			fakehead.className = "aw_loader__fakehead";

		var loaderDivHtml = '' +
			'<div class="aw_loader__fakeleft"></div>' +
			'<div class="aw_loader__cont">' +
			    '<img class="aw_loader__ram_img" src="{getSSLStaticBase}i/best-tickets2.png" alt="" title="" />' +
			    '<img class="aw_loader__load_img" src="{getSSLStaticBase}i/ticket-loader.gif" alt="" title="" />' +
			'</div>' +
			'<div class="aw_loader__fakehead">' +
			    '<a class="g-simple-button g-simple-button__close s-close-button" href="javascript:ticketManager.closeWidget();">&times;</a>' +
			'</div>' +
			'<div class="aw_loader__fakefoot"></div>';

		var loaderdiv = document.createElement('div');
			loaderdiv.className = 'aw_loader';
			loaderdiv.innerHTML = loaderDivHtml.replace(new RegExp("{getSSLStaticBase}", 'g'), ticketManager.getSSLStaticBase());

		return loaderdiv;
	},

	removeOrderKeyParam: function () {
		var orderKey = ticketManager.getUrlVar(ticketManager.orderKeyParam);
		if (orderKey == null || orderKey == '')
			return;

		var creationType = ticketManager.getUrlVar(ticketManager.creationTypeParam);

		var url = location.href;
		url = ticketManager.removeUrlParam(url, ticketManager.orderKeyParam, orderKey);
		url = ticketManager.removeUrlParam(url, ticketManager.creationTypeParam, creationType);
		location.href = url;
	},

	removeUrlParam: function (url, key, value) {
		url = url.replace('&' + key + '=' + value, '');
		url = url.replace(key + '=' + value, '');
		if (url.slice(-1) == '?')
			url = url.replace('?', '');
		else
			url = url.replace('?&', '?');
		return url;
	},

	getUrlVars: function () {
		var vars = [], hash;
		var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
		for (var i = 0; i < hashes.length; i++) {
			hash = hashes[i].split('=');
			vars.push(hash[0]);
			vars[hash[0]] = hash[1];
		}
		return vars;
	},

	getUrlVar: function (name) {
		return ticketManager.getUrlVars()[name];
	},


	getWidgetByUid: function (widgetUid) {
		for (var i = 0; i < ticketManager.widgets.length; i++) {
			if (ticketManager.widgets[i].Uid == widgetUid)
				return ticketManager.widgets[i];
		}
		return null;
	},

	getWidgetByKey: function (widgetKey) {
		for (var i = 0; i < ticketManager.widgets.length; i++) {
			if (ticketManager.widgets[i].getAttribute("key") == widgetKey)
				return ticketManager.widgets[i];
		}
		return null;
	},

	setMovieWidget: function (key, html, movieID, movieName, width, height, widgetUid) {
		ticketManager.setWidget(key, html, width, height, widgetUid);
	},

	setScheduleWidget: function (key, html, width, height, widgetUid) {
		ticketManager.setWidget(key, html, width, height, widgetUid);
	},

	setCinemaWidget: function (key, html, cinemaID, width, height, widgetUid) {
		ticketManager.setWidget(key, html, width, height, widgetUid);
	},

	setListWidget: function (key, html, width, height, widgetUid) {
		ticketManager.setWidget(key, html, width, height, widgetUid);
	},

	setInlineScheduleWidget: function (key, src, width, height, widgetUid) {
		var widget = ticketManager.getWidgetByUid(widgetUid);
		if (widget.isContentAttached)
			return;
		widget.isContentAttached = true;
		var widgetName = "widget" + widgetUid;
		var widgetIframe = ticketManager.createWidgetFrame(widgetName, width, height);
		widgetIframe.src = src;
		widget.parentNode.insertBefore(widgetIframe, widget);
	},

	setWidget: function (key, html, width, height, widgetUid) {
		var widget = ticketManager.getWidgetByUid(widgetUid);
		if (widget.isContentAttached)
			return;
		widget.isContentAttached = true;
		var widgetName = "widget" + widgetUid;
		var widgetIframe = ticketManager.createWidgetFrame(widgetName, width, height);
		widget.parentNode.insertBefore(widgetIframe, widget);
		ticketManager.renderIframe(widgetName, html);
	},

	applyWidgetViewStat: function (widgets) {
		var parameters = "widgets=" + encodeURIComponent(widgets);
		var srcBase = ticketManager.getSSLBaseDomain();
		new Image().src = srcBase + "widgetstat/?" + parameters;
	},

	renderIframe: function (name, innerHTML) {
		for (var i = 0; i < window.frames.length; i++) {
			try {
				if (window.frames[i].frameElement.name == name) {
					window.frames[i].frameElement.style.display = "";
					window.frames[i].document.write(innerHTML);
					window.frames[i].document.close();
					break;
				}
			} catch (e) {
			}
		}
	},

	createWidgetFrame: function (name, width, height) {
		var widgetIframe = document.createElement("iframe");
		widgetIframe.name = name;
		widgetIframe.style.width = (isNaN(width)) ? width : (width + "px");
		widgetIframe.style.height = height + "px";
		widgetIframe.className = name;
		widgetIframe.allowTransparency = true;
		widgetIframe.frameBorder = 0;
		widgetIframe.style.border = "none";
		widgetIframe.scrolling = "no";
		return widgetIframe;
	},

	movieSchedule: function (movieName, cityName) {
		ticketManager.openWidget(ticketManager.getRichKey(), movieName, cityName);
	},

	creationSchedule: function (key, creationId, cityId, classId, filter, locale) {
		ticketManager.Execute(
			{
				Name: 'command',
				Args:
				{
					Action: 'Creation',
					ReturnURL: '',
					AdditionalParams: [
						{ name: 'WidgetKey', value: key },
						{ name: 'objectID', value: creationId },
						{ name: 'cityID', value: cityId },
						{ name: 'classID', value: classId },
						{ name: 'filter', value: filter },
			            { name: 'locale', value: locale }]
				},
                IsMobileVersionSupported: (classId === 9 || classId === 17)
			});		
	},

	closeWidget: function () {
		ticketManager.Execute({ Name: 'close' });
	},

	openWidget: function (key, movieName, cityName) {
		ticketManager.Execute({ Name: 'command', Args: { Action: 'Widget', ReturnURL: '', AdditionalParams: [{ name: 'WidgetKey', value: key }, { name: 'name', value: encodeURIComponent(movieName).replace("'", "") }, { name: 'cityName', value: encodeURIComponent(cityName).replace("'", "") }, { name: 'url', value: encodeURIComponent(window.location.href) }, { name: 'title', value: encodeURIComponent(document.title) }] } });
	},
	openWidgetV2: function (key, movieName, cityName) {
		ticketManager.Execute({ Name: 'command', Args: { Action: 'Widget', ReturnURL: '', AdditionalParams: [{ name: 'WidgetKey', value: key }, { name: 'name', value: encodeURIComponent(movieName).replace("'", "") }, { name: 'cityName', value: encodeURIComponent(cityName).replace("'", "") }, { name: 'url', value: encodeURIComponent(window.location.href) }, { name: 'title', value: encodeURIComponent(document.title) }] } });
	},
	hallPlan: function (cinemaID, movieID, time) {
	    ticketManager.Execute({
	        Name: 'command',
	        Args:
	        {
	            Action: 'HallPlan',
	            ReturnURL: '',
	            AdditionalParams:
	            [
	                { name: 'WidgetKey', value: ticketManager.getRichKey() }, { name: 'cinemaID', value: cinemaID }, { name: 'movieID', value: movieID }, { name: 'time', value: time }
	            ]
	        },
	        IsMobileVersionSupported: true
	    });
	},

	hallPlanV2: function (cinemaObjectID, movieObjectID, time) {
	    ticketManager.Execute({
	        Name: 'command',
	        Args: {
	            Action: 'HallPlanV2',
	            ReturnURL: '',
	            AdditionalParams:
	            [
	                { name: 'WidgetKey', value: ticketManager.getRichKey() }, { name: 'cinemaObjectID', value: cinemaObjectID }, { name: 'movieObjectID', value: movieObjectID }, { name: 'time', value: time }
	            ]
	        },
	        IsMobileVersionSupported: true
	    });
	},

	cinemaSchedule: function (key, cinemaID) {
	    ticketManager.placeSchedule(key, cinemaID);
	},

	placeSchedule: function (key, placeId, filter, locale) {
		ticketManager.Execute(
			{
				Name: 'command',
				Args: {
					Action: 'CinemaSchedule',
					ReturnURL: '',
					AdditionalParams:
					[
						{ name: 'WidgetKey', value: key },
						{ name: 'cinemaID', value: placeId },
						{ name: 'url', value: encodeURIComponent(window.location.href) },
						{ name: 'title', value: encodeURIComponent(document.title) },
						{ name: 'filter', value: filter },
					    { name: 'locale', value: locale }
					]					
				},
			  IsMobileVersionSupported: true
			});
	},

	// Obsolete: use ticketManager.session(key, sessionID)
	movieSession: function (key, sessionID) {
		ticketManager.session(key, sessionID);
	},

	session: function (key, sessionID, locale) {
	    ticketManager.Execute(
                {
                    Name: 'command',
                    Args: {
                    Action: 'Session',
                    ReturnURL: '',
                    AdditionalParams:
                    [
                        { name: 'WidgetKey', value: key },
                        { name: 'sessionID', value: sessionID },
                        { name: 'url', value: encodeURIComponent(window.location.href) },
                        { name: 'title', value: encodeURIComponent(document.title) },
                        { name: 'locale', value: locale }
                    ]
                    },
                    IsMobileVersionSupported: true
            });
	},
	richSession: function (sessionID, locale) {
	    ticketManager.session(ticketManager.getRichKey(), sessionID, locale);
	},

	sale: function (orderKey) {
		ticketManager.Execute({ Name: 'command', Args: { Action: 'SaleComplete', ReturnURL: '', AdditionalParams: [{ name: 'OrderKey', value: orderKey }] } });
	},

	pay: function (orderKey) {
		ticketManager.Execute({ Name: 'command', Args: { Action: 'PayOrder', ReturnURL: '', AdditionalParams: [{ name: 'OrderKey', value: orderKey }] } });
	},

	createAndPay: function (key, partnerOrderKey) {
		ticketManager.Execute({ Name: 'command', Args: { Action: 'CreateAndPayOrder', ReturnURL: '', AdditionalParams: [{ name: 'WidgetKey', value: key }, { name: 'PartnerOrderKey', value: partnerOrderKey }] } });
		return ticketManager.getWidgetEventSubscription();
	},

	createGift: function (key, giftCost) {
		ticketManager.Execute({ Name: 'command', Args: { Action: 'CreateGiftOrder', ReturnURL: '', AdditionalParams: [{ name: 'WidgetKey', value: key }, { name: 'GiftCost', value: giftCost }] } });
		return ticketManager.getWidgetEventSubscription();
	},

	listWidget: function (key, classId, cityId, filter, locale) {
		ticketManager.Execute(
			{
				Name: 'command',
				Args: {
					Action: 'ListWidget',
					ReturnURL: '',
					AdditionalParams:
					[
						{ name: 'WidgetKey', value: key },
						{ name: 'classId', value: classId },
						{ name: 'cityID', value: cityId },
						{ name: 'url', value: encodeURIComponent(window.location.href) },
						{ name: 'title', value: encodeURIComponent(document.title) },
						{ name: 'filter', value: filter },
					    { name: 'locale', value: locale }
					]
				}
			});
	},

	initDialogAndSetStyle: function (width, height) {
		this.minWidth = 736;
		this.minHeight = 546;
		this.maxWidth = 1330;
		this.maxHeight = 1000;

		if (!width)
			width = 736;
			//width = 1000;
			//width = '100%';
		if (!height)
			height = 546;
			//height = 750;
			//height = '100%';
		ticketManager.InitDialog.apply(ticketManager, [width, height]);
		ticketManager.Execute({ Name: 'setStyle', Args: { 'width': width, 'height': height } });
	},

	addEvent: function (obj, evt, fn) {
		if (typeof obj.attachEvent != 'undefined') {
			obj.attachEvent("on" + evt, fn);
		}
		else if (typeof obj.addEventListener != 'undefined') {
			obj.addEventListener(evt, fn, false);
		} else {
			//Do you want to support browser this old?
		}
	},
	getRichKey: function () {
		var rich = document.getElementsByTagName('rb:rich');
		if (rich.length > 0)
			return rich[0].getAttribute('key');
	},
	load: function () {
		if (typeof TicketManager.instance === 'object') {
			return TicketManager.instance;
		}

		// Cross-domain messages via window.postMessage() from widget frame only!
		function listener(event) {
			if ((event.origin + "/") != ticketManager.getBaseDomain() && (event.origin + "/") != ticketManager.getSSLBaseDomain()) {
				return;
			}
			var command = JSON.parse(event.data);
			ticketManager.Execute(command);
		}

		if (window.addEventListener) {
			window.addEventListener("message", listener, false);
		} else {
			window.attachEvent("onmessage", listener);
		}

		var afishaWidgetContainer = document.getElementById('afishaWidgetContainer');
		if (!afishaWidgetContainer) {
			afishaWidgetContainer = document.createElement('div');
			afishaWidgetContainer.setAttribute('id', 'afishaWidgetContainer');
			afishaWidgetContainer.innerHTML = "";
			document.getElementsByTagName("body")[0].appendChild(afishaWidgetContainer);
		}

		ticketManager.updateWidgets();

		var orderKey = ticketManager.getUrlVar(ticketManager.orderKeyParam);

		ticketManager.dispatchEvent("ticketmanager.events.load");

		var resizeCallback = ticketManager.ResizeDialog();

		ticketManager.addEvent(window, 'resize', resizeCallback);
		ticketManager.addEvent(window, 'orientationchange', resizeCallback);
		if (window.addEventListener) {
			document.addEventListener('focusout', resizeCallback);
		}

		TicketManager.instance = this;

		if (orderKey == null || orderKey == '') return;

		ticketManager.sale(orderKey);		
	},
	getTagsNames: function () {
		var res = new Array();
		var tmp;
		for (var a = 0; a < arguments.length; a++) {
			tmp = document.getElementsByTagName(arguments[a]);
			for (var t = 0; t < tmp.length; t++) {
				if (tmp[t].isScriptAttached)
					continue;
				res.push(tmp[t]);
			}
		}
		return res;
	},

	sortByWidgetID: function (w1, w2) {
		var key1 = w1.getAttribute('key');
		var key2 = w2.getAttribute('key');
		if (key1 < key2)
			return -1;
		if (key1 > key2)
			return 1;
		return 0;
	},

	globalWidgetUid: 0,

	updateWidgets: function () {
	    ticketManager.widgets = ticketManager.getTagsNames('rb:ticket', 'rb:movie', 'rb:cinema', 'rb:session', 'rb:schedule', 'rb:inline', 'rb:list', 'rb:inlinelist');
		ticketManager.widgets.sort(ticketManager.sortByWidgetID);
		var srcBase = ticketManager.getSSLBaseDomain();
		var requestParams = '';
		var handlerUrl = ticketManager.buildWidgetHandlerUrl(srcBase);
		var prevKey = '';
		for (var i = 0; i < ticketManager.widgets.length; i++) {
			var widget = ticketManager.widgets[i];
			if (widget.isScriptAttached)
				continue;
			widget.isScriptAttached = true;
			var nodeName = widget.nodeName.toLowerCase();
			var widgetKey = widget.getAttribute('key');
			widget.Uid = ticketManager.globalWidgetUid++;
			if (prevKey == '')
				prevKey = widgetKey;
			var widgetParams = ticketManager.getWidgetParams(widget, widget.Uid, ticketManager.getAddWidgetFunc(nodeName));
			if (requestParams.length > 0 && widgetKey == prevKey) {
				requestParams += "|" + widgetParams;
			} else {
				requestParams += "@" + ticketManager.addParam('widgetkey', widgetKey) + widgetParams;
			}
			if ((requestParams + handlerUrl).length >= ticketManager.maxRequestLength) {
		        ticketManager.addWidgetScript(requestParams, handlerUrl);
		        requestParams = '';
		    }

		    prevKey = widgetKey;
		}
		if (requestParams.length > 0)
			ticketManager.addWidgetScript(requestParams, handlerUrl);
	},

	getAddWidgetFunc: function (nodeName) {
		if (nodeName == 'rb:ticket' || nodeName == 'rb:movie')
			return ticketManager.addMovieWidgetParams;
		if (nodeName == 'rb:cinema')
			return ticketManager.addCinemaWidgetParams;
		if (nodeName == 'rb:session')
			return ticketManager.addSessionWidgetParams;
		if (nodeName == 'rb:schedule')
			return ticketManager.addScheduleWidgetParams;
		if (nodeName == 'rb:inline')
			return ticketManager.addScheduleWidgetParams;
		if (nodeName == 'rb:list')
		    return ticketManager.addListWidgetParams;
		if (nodeName == 'rb:inlinelist')
		    return ticketManager.addListWidgetParams;

	},

	getWidgetParams: function (widget, widgetUid, func) {
	    return func(widget) + ticketManager.addParam('widgetIndex', widgetUid);
	},

	addCinemaWidgetParams: function (widget) {
	    return ticketManager.getParamsFromAttrs(widget, 'cinemaID');
	},

	addSessionWidgetParams: function (widget) {
	    return ticketManager.getParamsFromAttrs(widget, 'sessionID', 'locale');
	},

	addMovieWidgetParams: function (widget) {
	    return ticketManager.getParamsFromAttrs(widget, 'cityID', 'movieID', 'cityName') +
		    ticketManager.addParam('name', widget.getAttribute('movieName'));
	},

	addScheduleWidgetParams: function (widget) {
	    return ticketManager.getParamsFromAttrs(widget, 'cityID', 'objectID', 'classType', 'filter', 'locale');
	},

	addListWidgetParams: function (widget) {
	    return ticketManager.getParamsFromAttrs(widget, 'cityID', 'classType', 'filter', 'locale');
	},

	getParamsFromAttrs: function (widget) {
	    var result = "";
	    for (var i = 1; i < arguments.length; i++) {
	        var name = arguments[i];
	        if (widget.getAttribute(name) != null && widget.getAttribute(name) != "") {
	            var value = widget.getAttribute(name);
	            if (name == "filter")
	                value = ticketManager.base64encode(value);
	            result += ticketManager.addParam(name, value);
	        }
	    }
	    return result;
	},

	addParam: function (name, value) {
		return "{" + name + "}" + encodeURIComponent(ticketManager.prepareParam(value));
	},

	prepareParam: function (value) {
		if (value == null || typeof (value) != 'string')
			return value;
		return value.replace(new RegExp("[{]|[}]|[|]|[@]|[,]", 'g'), "");
	},

	addWidgetScript: function (widgetParams, handlerUrl) {
		var newScript = document.createElement('script');
		newScript.type = 'text/javascript';
		newScript.src = handlerUrl + '&widgetParams=' + widgetParams;
		document.getElementsByTagName("body")[0].appendChild(newScript);
	},

	buildWidgetHandlerUrl: function (srcBase) {
		return srcBase + 'widgethandler/v4/?url=' + encodeURIComponent(window.location.href);
	},

	getWidgetEventSubscription: function () {
		return {
			success: function (handler) { ticketManager.onClose.success = handler; },
			close: function (handler) { ticketManager.onClose.close = handler; }
		};
	},

	getCookie: function (c_name) {
		var i, x, y, cookies = document.cookie.split(";");
		for (i = 0; i < cookies.length; i++) {
			x = cookies[i].substr(0, cookies[i].indexOf("="));
			y = cookies[i].substr(cookies[i].indexOf("=") + 1);
			x = x.replace(/^\s+|\s+$/g, "");
			if (x == c_name) {
				return unescape(y);
			}
		}
		return null;
	},

	getBaseDomain: function() {return 'http://widget.kassa.rambler.ru/';},

	getStaticBase: function() {return 'http://s1.kassa.rl0.ru/1605171833/widget/';},

	getSSLBaseDomain: function() {return 'https://widget.kassa.rambler.ru/';},

	getSSLStaticBase: function() {return 'https://kassa.rambler.ru/s/1605171833/widget/';},

	init: function () {
	    var srcBase = ticketManager.getSSLBaseDomain();
	    ticketManager.FrameID = 'afishaWidgetContainer';
	    ticketManager.CommandURL = srcBase + 'CrossDomainInteraction/DoCommand';
	    ticketManager.ReturnURL = window.location.href;

	    if (window.addEventListener) {
	    	if (document.readyState !== "loading") setTimeout(ticketManager.load, 0);
	    	else window.addEventListener('DOMContentLoaded', ticketManager.load, false);
		} else if (window.attachEvent) {
			window.attachEvent('onload', ticketManager.load);
		}
	},

	dispatchEvent: function (evtName) {
		var event;
		if (document.createEvent) {
			event = document.createEvent("Events");
			event.initEvent(evtName, true, true);
		} else {
			event = document.createEventObject();
			event.type = "propertychange";
			event.propertyName = evtName;
		}

		if (document.createEvent) {
			document.dispatchEvent(event);
		} else {
			document.fireEvent("onpropertychange", event);
		}
	},
	// Функция кодирования строки в base64 
	base64encode: function (str) {
		// Символы для base64-преобразования 
		var b64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
		var b64Encoded = '';
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;

		for (var i = 0; i < str.length;) {
			chr1 = str.charCodeAt(i++);
			chr2 = str.charCodeAt(i++);
			chr3 = str.charCodeAt(i++);

			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);

			enc3 = isNaN(chr2) ? 64 : (((chr2 & 15) << 2) | (chr3 >> 6));
			enc4 = isNaN(chr3) ? 64 : (chr3 & 63);

			b64Encoded += b64Chars.charAt(enc1) + b64Chars.charAt(enc2) +
						  b64Chars.charAt(enc3) + b64Chars.charAt(enc4);
		}
		return b64Encoded;
	}
};


var ticketManager = new TicketManager();
ticketManager.init();



