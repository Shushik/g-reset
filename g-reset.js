/**
 * @page        http://github.com/Shushik/g-reset/
 * @author      Shushik <silkleopard@yandex.ru>
 * @version     1.0
 * @description Simple jQuery-like lib
 */
$ = SJQL = (function(ctx) {

    var
        /**
         * Main wrapper
         *
         * @value {object}
         */
        $ = {},
        /**
         * Common trash object
         *
         * @value {object}
         */
        _ = {
            /**
             * 
             *
             * @value {object}
             */
            topics : {}
        };

    /**
     * DOM Event handler bind
     *
     * @this   {$}
     * @param  {DOMNode}
     * @param  {string}
     * @param  {function}
     * @return {function}
     */
    $.on = function(node, alias, handler) {
        var
            pfix  = '',
            wrap  = '',
            fn    = null;

        if (node.addEventListener) {
            wrap = 'addEventListener';
        } else if (node.attachEvent) {
            pfix = 'on';
            wrap = 'attachEvent';
        }

        fn = $.proxy(function(event) {
            var
                norm = $.event(event);

            handler.call(this, norm);
        }, node);

        node[wrap](
            pfix + alias,
            fn
        );

        return fn;
    }

    /**
     * DOM Event handler unbind
     *
     * @this   {$}
     * @param  {DOMNode}
     * @param  {string}
     * @param  {function}
     * @return {undefined}
     */
    $.off = function(node, alias, fn) {
        var
            pfix = '',
            wrap = '';

        if (node.removeEventListener) {
            wrap = 'removeEventListener';
        } else if (node.detachEvent) {
            pfix = 'on';
            wrap = 'detachEvent';
        }

        node[wrap](
            pfix + alias,
            fn
        );
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

        if (clean.target.nodeType === 3) {
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
            event.stopPropagation = function() {
                this.cancelBubble = true;
            };
        }

        // Prevent default action
        if (!event.preventDefault) {
            event.preventDefault = function() {
                this.returnValue = false;
            };
        }

        return clean;
    }

    /**
     * Get an offset for chosen elements
     * (magic copypasted from jQuery)
     *
     * @this    {Suggest}
     * @param   {DOMNode}
     * @param   {DOMNode}
     * @returns {Object}
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
     * Run the function in a given context
     *
     * @this   {$}
     * @param  {function}
     * @param  {object}
     * @return {}
     */
    $.proxy = function(fn, ctx) {
        return function() {
            var
                args = arguments;

            return fn.apply(ctx, args);
        }
    }

    /**
     * Make an AJAX request (async only)
     *
     * @this    {$}
     * @param   {string}
     * @param   {object}
     * @returns {XMLHttpRequest}
     */
    $.ajax = function(url, handlers) {
        handlers = handlers || {};

        var
            pos   = 0,
            field = '',
            apis  = [
                      function() {return new XMLHttpRequest()},
                      function() {return new ActiveXObject("Msxml2.XMLHTTP")},
                      function() {return new ActiveXObject("Msxml3.XMLHTTP")},
                      function() {return new ActiveXObject("Microsoft.XMLHTTP")}
                    ],
            xhr   = null;

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
        xhr.open('GET', url, true);
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
     * @this    {$}
     * @param   {string}
     * @returns {object}
     */
    $.json = function(data) {
        var
            json  = null,
            check = '';

        if (typeof data == 'string') {
            check = data.substring(0, 1);

            if (check == '{' || check == '[' || check == '"') {
                if (window.JSON) {
                    json = window.JSON.parse(data);
                } else {
                    json = eval(data);
                }
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