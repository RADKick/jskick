kick.binders[':codemirror'] = {
    publishes: true,
    priority: 2000,
    bind: function (el) {
        try {
            var me = this,
                opts = me.observer.value(),
                valBinding = me.kin('@'),
                pub = valBinding && valBinding.publish;

            el.editor = CodeMirror.fromTextArea(el, opts);
            el.editor.on('change', function (cm) {
                if (!valBinding.lock(true)) { return; }  //already locked
                var val = cm.getValue();
                valBinding.set(val);
                pub.apply(valBinding, arguments);
                valBinding.lock(false);
            });

            valBinding.subscribe(function (val) {
                if (!valBinding.lock(true)) { return; }  //already locked
                el.editor.setValue(val);
                //el.editor.refresh();
                valBinding.lock(false);
            });
        } catch (ex) {
            console.log(ex);
        }
    },
    getValue: function (el) {
        return el.editor && el.editor.getValue();
    },
    unbind: function () {
        //kick.binders['@value'].unbind.apply(this, arguments);
    },
    routine: function () {
        //kick.binders['@value'].routine.apply(this, arguments);
    }
};

kick.binders[':focus'] = {
    publishes: true,
    priority: 2001,
    bind: function (el) {
        var me = this;
        me.hasfocusUpdatingProperty = '__kick_hasfocusUpdating';
        me.hasfocusLastValue = '__kick_hasfocusLastValue';
        var handleElementFocusChange = function (isFocused) {
            // Where possible, ignore which event was raised and determine focus state using activeElement,
            // as this avoids phantom focus/blur events raised when changing tabs in modern browsers.
            // However, not all KO-targeted browsers (Firefox 2) support activeElement. For those browsers,
            // prevent a loss of focus when changing tabs/windows by setting a flag that prevents hasfocus
            // from calling 'blur()' on the element when it loses focus.
            // Discussion at https://github.com/SteveSanderson/knockout/pull/352
            el[me.hasfocusUpdatingProperty] = true;
            var ownerDoc = el.ownerDocument;
            if ("activeElement" in ownerDoc) {
                var active;
                try {
                    active = ownerDoc.activeElement;
                } catch (e) {
                    // IE9 throws if you access activeElement during page load (see issue #703)
                    active = ownerDoc.body;
                }
                isFocused = (active === el);
            }
            var modelValue = me.observer.value();
            //ko.expressionRewriting.writeValueToProperty(modelValue, allBindings, 'hasfocus', isFocused, true);

            //cache the latest value, so we can avoid unnecessarily calling focus/blur in the update function
            el[me.hasfocusLastValue] = isFocused;
            el[me.hasfocusUpdatingProperty] = false;
        };
        var handleElementFocusIn = handleElementFocusChange.bind(null, true);
        var handleElementFocusOut = handleElementFocusChange.bind(null, false);

        me.listners['focus'] = handleElementFocusChange.bind(null, true);
        me.listners['blur'] = handleElementFocusChange.bind(null, false);
        el.addEventListener('focus', me.listeners['focus'], false);
        el.addEventListener('blur', me.listeners['blur'], false);
        //me.buildBinding(el, '^focus', '', this.options.binders['^&'])
        // ko.utils.registerEventHandler(element, "focus", handleElementFocusIn);
        // ko.utils.registerEventHandler(element, "focusin", handleElementFocusIn); // For IE
        // ko.utils.registerEventHandler(element, "blur",  handleElementFocusOut);
        // ko.utils.registerEventHandler(element, "focusout",  handleElementFocusOut); // For IE
    },
    unbind: function () {
        var me = this;
        me.el.removeEventListener('focus', me.listeners['focus'], false);
        me.el.removeEventListener('blur', me.listeners['blur'], false);
    },
    routine: function (el) {
        var me = this, value = !!me.observer.value();

        if (!el[me.hasfocusUpdatingProperty] && el[me.hasfocusLastValue] !== value) {
            value ? el.focus() : el.blur();

            // In IE, the blur method doesn't always cause the element to lose focus (for example, if the window is not in focus).
            // Setting focus to the body element does seem to be reliable in IE, but should only be used if we know that the current
            // element was focused already.
            if (!value && el[me.hasfocusLastValue]) {
                el.ownerDocument.body.focus();
            }

            // For IE, which doesn't reliably fire "focus" or "blur" events synchronously
            //ko.dependencyDetection.ignore(ko.utils.triggerEvent, null, [element, value ? "focusin" : "focusout"]);
        }
    }
};