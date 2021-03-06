/**
 * @page        http://github.com/Shushik/g-reset/
 * @author      Shushik <silkleopard@yandex.ru>
 * @version     1.0
 * @description Simple jQuery-like lib
 */
$ = SJQL = (function() {

    var
        /**
         * Core
         *
         * @constructor
         *
         * @this   {$}
         * @param  {string|object}
         * @param  {DOMNode}
         * @return {$}
         */
        $ = function(smth, ctx) {
            if ($.wrapper) {
                return new $.wrapper(smth, ctx);
            }
        },
        /**
         * Common trash object
         *
         * @value {object}
         */
        _ = {
            css : {
                nopx : 'zoom,widows,zIndex,opacity,orphans,fontWeight,lineHeight,columnCount,fillOpacity',
                norm : {'float' : 'cssFloat'}
            },
            attr : {
                bool : 'loop,open,async,defer,hidden,scoped,checked,selected,autoplay,controls,disabled,multiple,readonly,required,autofocus',
                prop : 'id,dir,lang,title,value,style'
            },
            /**
             * Published topics
             *
             * @value {object}
             */
            topics : {}
        };

    /**
     * Short alias for getElementById
     *
     * @this   {$}
     * @param  {string}
     * @return {Null|DOMNode}
     */
    $.id = function(id) {
        return document.getElementById(id);
    }

    /**
     * Short alias for querySelectorAll
     *
     * @this   {$}
     * @param  {string}
     * @param  {DOMNode}
     * @return {DOMNodesList}
     */
    $.find = function(expr, ctx) {
        ctx = ctx || document;

        return ctx.querySelectorAll(expr);
    }

    /**
     * Find the closest parent node which matches the query
     *
     * @this   {$}
     * @param  {DOMNode}
     * @param  {string}
     * @param  {DOMNode}
     * @return {Null|DOMNode}
     */
    $.closest = function(from, expr, till) {
        till = till || document.body;

        var
            end    = 0,
            pos    = 0,
            chk    = null,
            list   = null,
            node   = from,
            parent = node.parentNode;

        // Iterate through all parent nodes
        while (node != till) {
            parent = node.parentNode;
            list   = parent.parentNode.querySelectorAll(expr);
            end    = list.length - 1;

            // Check if a current parent`s parent contains the needed node
            for (pos = end; pos >= 0; pos--) {
                chk = list[pos];

                // Return the founded node
                if (chk == parent) {
                    return parent;
                }
            }

            node = parent;
        }

        return null;
    }

    /**
     * DOM Events handlers bind
     *
     * @this   {$}
     * @param  {DOMNode}
     * @param  {string}
     * @param  {function}
     * @return {function}
     */
    $.on = function(node, alias, handler) {
        var
            end   = 0,
            pos   = 0,
            pfix  = '',
            wrap  = '',
            fn    = null;

        // Read all event aliases
        alias = alias.split(' ');
        end   = alias.length;

        // Check if the events aliases were given
        if (!end) {
            return;
        }

        // Choose a method to bind an event handler
        if (node.addEventListener) {
            wrap = 'addEventListener';
        } else if (node.attachEvent) {
            pfix = 'on';
            wrap = 'attachEvent';
        }

        // Create the proxied handler wrapper
        fn = $.proxy(function(event) {
            var
                norm = $.event(event);

            handler.call(this, norm);
        }, node);

        // Bind event handlers for all given
        // types of events
        for (pos = 0; pos < end; pos++) {
            node[wrap](
                pfix + alias[pos],
                fn
            );
        }

        return fn;
    }

    /**
     * DOM Events handlers unbind
     *
     * @this   {$}
     * @param  {DOMNode}
     * @param  {string}
     * @param  {function}
     * @return {undefined}
     */
    $.off = function(node, alias, fn) {
        var
            end  = 0,
            pos  = 0,
            pfix = '',
            wrap = '';

        // Read all event aliases
        alias = alias.split(' ');
        end   = alias.length;

        // Check if the events aliases were given
        if (!end) {
            return;
        }

        // Choose a method to bind event handlers
        if (node.removeEventListener) {
            wrap = 'removeEventListener';
        } else if (node.detachEvent) {
            pfix = 'on';
            wrap = 'detachEvent';
        }

        // Unbind event handlers for all given
        // types of events
        for (pos = 0; pos < end; pos++) {
            node[wrap](
                pfix + alias[pos],
                fn
            );
        }
    }

    /**
     * DOM Event object normalization
     *
     * @this   {$}
     * @param  {Event}
     * @return {object}
     */
    $.event = function(event) {
        event = event || window.event;

        var
            type  = event.type,
            alias = '',
            ntype = '',
            clean = {
                // Readonly original event object
                originalEvent : event
            };

        // Clone the original event object
        for (alias in event) {
            clean[alias] = event[alias];
        }

        // Events hacks for older browsers
        if (!event.target) {
            clean.target = event.srcElement;
        }

        if (event.target && clean.target.nodeType === 3) {
            clean.target = event.target.parentNode;
        }

        // Keycode
        if (
            type == 'keypress' ||
            type == 'keydown' ||
            type == 'keyup'
        ) {
            if (!event.keyCode && event.which) {
                clean.keyCode = event.which;
            }
        }

        // Timestamp
        if (!event.timeStamp) {
            clean.timeStamp = (new Date()).getTime();
        }

        // Related target for IE
        if (!event.relatedTarget) {
            clean.relatedTarget = event.fromElement;
        }

        // Stop bubbling
        if (!event.stopPropagation) {
            clean.stopPropagation = function() {
                event.cancelBubble = true;
            };
        } else {
            clean.stopPropagation = function() {
                event.stopPropagation();
            }
        }

        // Prevent default action
        if (!event.preventDefault) {
            clean.preventDefault = function() {
                event.returnValue = false;
            };
        } else {
            clean.preventDefault = function() {
                event.preventDefault();
            }
        }

        return clean;
    }

    /**
     * Get the input, textarea, select or button value
     *
     * @this   {$}
     * @param  {DOMNode}
     * @param  {string}
     * @param  {string}
     * @return {undefined|string}
     */
    $.css = function(node, style, value) {
        var
            code  = '',
            prop  = '',
            alias = '',
            stype = typeof style,
            vtype = typeof value,
            nopx  = null,
            curr  = null,
            props = null;

        function
            _norm(prop) {
                prop = $.camel(prop);

                if (_.css.norm[prop]) {
                    prop = _.css.norm[prop];
                }

                return prop;
            };

        // Filter the comments and text nodes
        if (!node || node.nodeType === 3 || node.nodeType === 8 || !node.style) {
            return;
        }

        if (style === 'object') {
            // Create the properties object
            props = style;
        } else if (value !== undefined) {
            // Only numbers and strings are allowed to set
            if (vtype !== 'string' || vtype !== 'number') {
                return;
            }

            // Create the properties object
            props = {
                style : value
            };
        }

        if (props) {
            nopx = _.css.nopx.split(',');

            // Set the values for given css properties
            for (alias in props) {
                prop = _norm(alias);
                code = props[alias];

                // Clean the px
                if ($.index(prop, nopx) !== -1) {
                    code.replace('px', '');
                }

                node.style[name] = props[alias];
            }
        } else {
            prop = _norm(style);

            // Get inline styles first
            curr = node.style;

            if (curr && curr[prop]) {
                return curr[prop];
            }

            // Get attached styles
            curr = node.currentStyle ?
                   node.currentStyle :
                   window.getComputedStyle(node, null);

            if (curr && curr[prop]) {
                return curr[prop];
            }

            return '';
        }
    }

    /**
     * Get the input, textarea, select or button value
     *
     * @this   {$}
     * @param  {DOMNode}
     * @param  {string}
     * @return {undefined|string}
     */
    $.val = function(node, value) {
        var
            tag  = node && node.tagName ? node.tagName.toLowerCase() : '',
            tags = 'input,select,textarea,button',
            type = typeof value;

        if (tag && $.index(tag, tags.split(',')) !== -1) {
            if (value !== undefined) {
                if (type === 'number' || type === 'string') {
                    node.value = value;
                    node.setAttribute("value", value);
                }
            }

            return $.prop(node, 'value', value);
        }
    }

    /**
     * Read or write given property from DOMNode
     *
     * @this   {$}
     * @param  {DOMNode}
     * @param  {string}
     * @param  {boolean|number|string|object|function}
     * @return {undefined|boolean|number|string|object|function}
     */
    $.prop = function(node, alias, value) {
        var
            read = '';

        if (alias.match(/-/)) {
            alias = $.camel(alias);
        }

        if (value !== undefined) {
            if (value === null && node[alias]) {
                delete node[alias];
            } else {
                node[alias] = value;
            }
        } else {
            if (typeof node[alias] === 'function') {
                read = node[alias]();
            } else {
                read = node[alias];
            }
        }

        return read;
    }

    /**
     * Read or write given attribute from DOMNode
     *
     * @this   {$}
     * @param  {DOMNode}
     * @param  {string}
     * @param  {string|object|function}
     * @return {undefined|boolean|number|string|object|function}
     */
    $.attr = function(node, alias, value) {
        var
            act  = false,
            bool = false,
            prop = false,
            type = node.nodeType,
            read = '';

        // Filter the text and comments nodes
        if (!node || type === 3 || type === 8 || type === 2 ) {
            return;
        }

        // Set an indicator to a function
        if (alias.match(/^on/) || typeof value === 'function') {
            act = true;
        }

        // Set an indicator of boolean or direct typed attributes
        if ($.index(
            alias,
            _.attr.bool.split(',')
        ) > -1) {
            bool = true;
        } else if ($.index(
            alias,
            _.attr.prop.split(',')
        ) > -1) {
            prop = true;
        }

        if (value !== undefined) {
            if (value === null) {
                if (bool) {
                    node[alias] = false;
                } else if (prop) {
                    $.prop(node, alias, value);
                }

                node.removeAttribute(alias);
            } else {
                if (bool) {
                    node[alias] = true;
                } else if (prop) {
                    $.prop(node, alias, value);
                }

                node.setAttribute(alias, value);
            }
        } else {
            if (bool) {
                read = node[alias];
            } else if (prop) {
                read = $.prop(node, alias);
            } else {
                read = node.getAttribute(alias);
            }
        }

        return read;
    }

    /**
     * className operations
     *
     * @this   {$}
     * @param  {DOMNode}
     * @param  {string}
     * @param  {boolean}
     * @return {undefined|boolean}
     */
    $.cname = function(node, alias, set) {
        var
            check = false,
            pos   = 0,
            cname = node.className ?
                    node.className.
                    replace(/[\n\t\r]/g, ' ').
                    replace(/ {2,}/g, ' ').
                    split(' ') :
                    [];

        pos   = $.index(alias, cname);
        check = pos > -1 ? true : false;

        if (set !== undefined) {
            if (set === false && check) {
                // Remove the existant class
                cname.splice(pos, 1);
            } else if (set === true) {
                if (check) {
                    // Replace the given class
                    cname[pos] = alias;
                } else {
                    // Add the new class
                    cname.push(alias);
                }
            }
        } else {
            return check;
        }

        // Save the new className
        node.className = cname.join(' ');
    }

    /**
     * 
     *
     * @this   {$}
     * @param  {boolean|string}
     * @param  {string}
     * @param  {object}
     * @return {undefined|string|object}
     */
    $.cookie = function(alias, value, args) {
        var
            end     = 0,
            pos     = 0,
            cookie  = [],
            cookies = [],
            all     = {},
            till    = null,
            props   = {};

        if (value === null) {
            // Delete existant cookie
            till = new Date();
            till.setTime(till.getTime() - 1);

            document.cookie = alias + '=; expires=' + till.toGMTString();
        } else if (typeof value === 'string') {
            // Set or reset a cookie
            cookie = alias + '=' + escape(value);

            if (args) {
                if (args instanceof Date) {
                    cookie += '; expires=' + args.toUTCString();
                } else {
                    if (args.expires) {
                        cookie += '; expires=' + args.expires.toUTCString();
                    }

                    if (args.path) {
                        cookie += '; path=' + escape(args.path);
                    }

                    if (args.domain) {
                        cookie += '; domain=' + escape(args.domain);
                    }

                    if (args.secure) {
                        cookie += '; secure';
                    }
                }
            }

            document.cookie = cookie;
        } else {
            cookies = document.cookie.split(';');
            end     = cookies.length;

            // Get the key-value pairs from cookies array
            for (pos = 0; pos < end; pos++) {
                cookie = cookies[pos].split('=');
                cookie[1] = unescape(cookie[1]);

                // Try to find a cookie
                if (cookie[0] === alias) {
                    return cookie[1];
                }

                // Save the key-value pair
                all[cookie[0]] = cookie[1];
            }

            if (alias === true) {
                // Return all the cookies
                return all;
            } else {
                // Return nothing
                return null;
            }
        }
    }

    /**
     * Get or set the values into the localStorage or the sessionStorage
     *
     * @this   {$}
     * @param  {string}
     * @param  {string}
     * @param  {boolean}
     * @param  {boolean}
     * @return {undefined|string|object|Exception}
     */
    $.storage = function(alias, value, session, clear) {
        var
            end     = 0,
            pos     = 0,
            type    = typeof value,
            marker  = '',
            all     = {},
            storage = session ? sessionStorage : localStorage;

        if (value !== undefined) {
            if (value === null) {
                // Remove the item
                storage.removeItem(alias);
            } else {
                // Stringify booleans and objects
                if (type === 'boolean' || type === 'object') {
                    value = JSON.stringify(value);
                }

                // Try to write the value into the storage
                try {
                    storage.setItem(alias, value);
                } catch (exc) {
                    if (exc === QUOTA_EXCEEDED_ERR && clear) {
                        storage.clear();
                        storage.setItem(alias, value);
                    } else {
                        return exc;
                    }
                }
            }
        } else if (alias !== undefined) {
            // Read the storage item value
            return storage.getItem(alias);
        } else {
            // Read all the items in the storage
            end = storage.length;

            for (pos = 0; pos < end; pos++) {
                marker = storage.key(pos);

                all[marker] = storage.getItem(marker);
            }

            return all;
        }
    }

    /**
     * Get the selection or select the node content
     *
     * @this   {$}
     * @param  {DOMNode}
     * @return {undefined|string}
     */
    $.sel = function(node) {
        var
            rng = null,
            sel = null;

        if (node !== undefined) {
            if (document.createRange) {
                rng = document.createRange();
                rng.selectNode(node)

                sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(rng);
            } else {
                rng = document.body.createTextRange();
                rng.moveToElementText(node);
                rng.select();
            }
        } else {
            if (window.getSelection) {
                return window.getSelection().toString();
            } else if (document.selection.createRange) {
                return document.selection.createRange().text;
            }

            return '';
        }
    }

    /**
     * Get or set a caret position
     *
     * @this   {$}
     * @param  {DOMNode}
     * @param  {number|null}
     * @param  {string}
     * @return {undefined|number}
     */
    $.caret = function(node, pos, text) {
        var
            ie  = document.selection ? true : false,
            ind = 0,
            len = 0,
            val = $.val(node),
            rng = null;

        len = val.length;

        // Set a focus into a field
        if (pos !== undefined || ie) {
            node.focus();
        }

        if (ie) {
            // A caret position in IE
            rng = document.selection.createRange();
            rng.moveStart('character', -len);

            if (typeof pos === 'number') {
                rng.move('character', pos);
                rng.select();
                rng.moveStart('character', -len);
                rng.select();
                ind = rng.text.length;
                rng.moveStart('character', pos);
                rng.select();
            } else {
                ind = rng.text.length;
            }
        } else {
            // A caret position in other browsers
            if (typeof pos === 'number') {
                node.selectionStart = pos;
                node.selectionEnd   = pos;
            }

            ind = node.selectionStart;
        }

        if (typeof text === 'string') {
            // Insert a given text
            $.val(
                node,
                val.substring(0, ind) +
                text +
                val.substring(ind)
            );

            if (ie) {
                rng.move('character', ind + text.length);
                rng.select();
            } else {
                node.selectionStart = ind + text.length;
                node.selectionEnd   = ind + text.length;
            }
        } else {
            // Return a current position
            return ind;
        }
    }

    /**
     * Get an offset for chosen elements
     * (magic copypasted from jQuery)
     *
     * @this   {$}
     * @param  {DOMNode}
     * @param  {DOMNode}
     * @return {object}
     */
    $.offset = function(from, till) {
        till = till || document.body;

        var
            quirks  = false,
            table   = /^t(?:able|d|h)$/i,
            doc     = document,
            body    = doc.body,
            view    = doc.defaultView ? doc.defaultView.getComputedStyle : null,
            node    = from,
            prev    = view ? view(node, null) : node.currentStyle,
            curr    = null,
            offset  = {
                top    : node.offsetTop,
                left   : node.offsetLeft,
                width  : node.offsetWidth,
                height : node.offsetHeight
            },
            cparent = node.offsetParent,
            pparent = from;

        if (navigator.userAgent.match(/MSIE [67]/) && doc.compatMode != 'CSS1Compat') {
            quirks = true;
        }

        while ((node = node.parentNode) && node != till) {
            if (prev.position === 'fixed') {
                break;
            }

            curr = view ? view(node, null) : node.currentStyle;

            offset.top  -= node.scrollTop;
            offset.left -= node.scrollLeft;

            if (node === cparent) {
                offset.top  += node.offsetTop;
                offset.left += node.offsetLeft;

                if (quirks && table.test(node.tagName)) {
                    offset.top  += parseFloat(curr.borderTopWidth)  || 0;
                    offset.left += parseFloat(curr.borderLeftWidth) || 0;
                }

                pparent = cparent;
                cparent = node.offsetParent;
            }

            if (curr.overflow !== 'visible') {
                offset.top  += parseFloat(curr.borderTopWidth)  || 0;
                offset.left += parseFloat(curr.borderLeftWidth) || 0;
            }

            prev = curr;
        }

        if (node === body) {
            if (prev.position === 'relative' || prev.position === 'static') {
                offset.top  += body.offsetTop;
                offset.left += body.offsetLeft;
            } else if (prev.position === 'fixed') {
                offset.top  += Math.max(doc.scrollTop,  body.scrollTop);
                offset.left += Math.max(doc.scrollLeft, body.scrollLeft)
            }
        }

        return offset;
    }

    /**
     * Iterate through the string, array or object
     *
     * @this   {$}
     * @param  {string|object|Array}
     * @param  {function}
     * @return {undefined}
     */
    $.each = function(items, handler) {
        var
            end   = 0,
            pos   = -1,
            alias = '';

        if (items.length) {
            end = items.length - 1;

            while (pos++ < end) {
                handler.call(items[pos], pos, items[pos]);
            }
        } else if (typeof items === 'object') {
            for (alias in items) {
                handler.call(items[alias], alias, items[alias]);
            }
        }
    }

    /**
     * Run the function in a given context
     *
     * @this   {$}
     * @param  {function}
     * @param  {object}
     * @return {function}
     */
    $.proxy = function(fn, ctx) {
        return function() {
            return fn.apply(ctx, arguments);
        }
    }

    /**
     * Extend a pseudoclass object
     *
     * @this   {$}
     * @param  {function}
     * @param  {function}
     * @return {function}
     */
    $.extend = function(chld, prnt) {
        var
            tmp = function() {};

        tmp.prototype = prnt.prototype;
        chld.prototype = new tmp();

        chld.prototype.constructor = chld;
        chld.superclass = prnt.prototype;
    }

    /**
     * IndexOf alias (works with objects too)
     *
     * @this   {$}
     * @param  {number|string}
     * @param  {object}
     * @return {number|string}
     */
    $.index = function(hayfork, haystack) {
        var
            end   = 0,
            pos   = 0,
            alias = '';

        if (typeof haystack == 'object') {
            if (haystack instanceof Array) {
                if (haystack.indexOf) {
                    return haystack.indexOf(hayfork);
                } else {
                    end = haystack.length;

                    for (pos = 0; pos < end; pos++) {
                        if (haystack[pos] === hayfork) {
                            return pos;
                        }
                    }
                }

                return -1;
            } else {
                for (alias in haystack) {
                    if (haystack[alias] === hayfork) {
                        return alias;
                    }
                }

                return null;
            }
        }
    }

    /**
     * Trim a string
     *
     * @this   {$}
     * @param  {string}
     * @param  {boolean}
     * @return {string}
     */
    $.trim = function(str, clean) {
        if (!str.trim) {
            str = str.trim();
        } else {
            str = str.replace(/^\s*/g, '').replace(/\s*$/g, '')
        }

        // Clean the string from double spaces, tabs
        if (clean !== undefined) {
            str = str.
                  replace(/\r/g, '').
                  replace(/\t/g, ' ').
                  replace(/\n{2,}/g, '\n').
                  replace(/ {2,}/, ' ');
        }

        return str;
    }

    /**
     * Make a camel-cased string
     *
     * @this   {$}
     * @param  {string}
     * @param  {boolean}
     * @return {string}
     */
    $.camel = function(str, camelize) {
        camelize = camelize || false;

        var
            pos   = 0,
            camel = '';

        // Camelize the string
        if (typeof str == 'string') {
            while (str[pos]) {
                if (str[pos] == '-') {
                    camelize = true;
                } else {
                    if (camelize) {
                        camel += str[pos].toUpperCase();
                        camelize = false;
                    } else {
                        camel += str[pos];
                    }
                }

                pos++;
            }
        }

        return camel;
    }

    /**
     * Make an AJAX request (async only)
     *
     * @this   {$}
     * @param  {string}
     * @param  {object}
     * @param  {object}
     * @param  {string}
     * @return {XMLHttpRequest}
     */
    $.ajax = function(url, args, handlers, type) {
        args     = args || null;
        type     = (type || 'GET').toUpperCase();
        handlers = handlers || {};

        var
            pos    = 0,
            alias  = '',
            field  = '',
            fields = '',
            apis   = [
                function() {return new XMLHttpRequest()},
                function() {return new ActiveXObject("Msxml2.XMLHTTP")},
                function() {return new ActiveXObject("Msxml3.XMLHTTP")},
                function() {return new ActiveXObject("Microsoft.XMLHTTP")}
            ],
            xhr    = null;

        //
        if (type == 'GET' && args) {
            for (alias in args) {
                fields += '&' + alias + '=' + encodeURIComponent(args[alias]);
            }

            if (!url.match(/\?/)) {
                fields = fields.replace(/^&/, '?');
            }

            url += fields;
        }

        //
        for (pos = 0; pos < 4; pos++) {
            try {
                xhr = apis[pos]();
            } catch (e) {
                continue;
            }

            break;
        }

        //
        if (!xhr) {
            return;
        }

        //
        xhr.open(type, url, true);
        xhr.setRequestHeader('User-Agent', 'XMLHTTP/1.0');

        //
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (
                    xhr.status == 200 && handlers.success ||
                    xhr.status == 304 && handlers.success
                ) {
                    handlers.success(xhr.responseText, xhr);
                } else if (handlers.error) {
                    handlers.error({
                        status : xhr.status,
                        raw    : xhr.responseText ?
                                 xhr.responseText :
                                 ''
                    });
                }
            } else {
                if (handlers.error) {
                    handlers.error(xhr);
                }

                return;
            }
        }

        xhr.send();

        return xhr;
    };

    /**
     * Encode string to JSON
     *
     * @this   {$}
     * @param  {string}
     * @return {object}
     */
    $.json = function(data) {
        var
            json  = null,
            check = '';

        if (typeof data == 'string') {
            check = data.substring(0, 1);

            if (check == '{' || check == '[' || check == '"') {
                json = window.JSON.parse(data);
            }
        }

        return json;
    };

    /**
     * Publish a topic
     *
     * @this   {$}
     * @param  {string}
     * @param  {Array}
     * @return {object}
     */
    $.pub = function(msg, args) {
        args = args || [];

        var
            pos    = 0,
            end    = 0,
            topic  = null,
            topics = _.topics;

        if (typeof msg == 'string' && topics[msg]) {
            topic = topics[msg];
            end   = topic.length;

            // Try to run all the topic handlers
            for (pos = 0; pos < end; pos++) {
                try {
                    topic[pos].apply(topic[pos], args);
                } catch (exc) {}
            }
        }
    }

    /**
     * Subscribe to a topic
     *
     * @this   {$}
     * @param  {string}
     * @param  {function}
     * @return {object}
     */
    $.sub = function(msg, fn) {
        var
            topics = _.topics;

        // Create a topic if not exists
        if (!topics[msg]) {
            topics[msg] = [];
        }

        // Save the subscription handler
        topics[msg].push(fn)
    }


    return $;

})();