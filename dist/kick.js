(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.kick = factory());
}(this, (function () { 'use strict';

  var OPTIONS = [//'prefix',
  'templateDelimiters', 'rootInterface', 'preloadData', 'handler'];
  var COMPS = 'components';
  var EXTENSIONS = ['binders', 'formatters', COMPS, 'adapters'];

  var PRIMITIVE = 0;
  var KEYPATH = 1;
  var TEXT = 0;
  var BINDING = 1;
  var QUOTED_STR = /^'.*'$|^".*"$/;
  var WHITESPACES = ' \n\r\t'.split(''); // Parser and tokenizer for getting the type and value from a string.

  function parseType(string) {
    var type = PRIMITIVE;
    var value = string;

    if (QUOTED_STR.test(string)) {
      value = string.slice(1, -1);
    } else if (string === "true") {
      value = true;
    } else if (string === "false") {
      value = false;
    } else if (string === "null") {
      value = null;
    } else if (string === "undefined") {
      value = undefined;
    } else if (!isNaN(string)) {
      value = Number(string);
    } else {
      type = KEYPATH;
    }

    return {
      type: type,
      value: value
    };
  } // Template parser and tokenizer for mustache-style text content bindings.
  // Parses the template and returns a set of tokens, separating static portions
  // of text from binding declarations.

  function parseTemplate(template, delimiters) {
    var tokens;
    var length = template.length;
    var index = 0;
    var lastIndex = 0;
    var open = delimiters[0],
        close = delimiters[1];

    while (lastIndex < length) {
      index = template.indexOf(open, lastIndex);

      if (index < 0) {
        if (tokens) {
          tokens.push({
            type: TEXT,
            value: template.slice(lastIndex)
          });
        }

        break;
      } else {
        tokens || (tokens = []);

        if (index > 0 && lastIndex < index) {
          tokens.push({
            type: TEXT,
            value: template.slice(lastIndex, index)
          });
        }

        lastIndex = index + open.length;
        index = template.indexOf(close, lastIndex);

        if (index < 0) {
          var substring = template.slice(lastIndex - close.length);
          var lastToken = tokens[tokens.length - 1];

          if (lastToken && lastToken.type === TEXT) {
            lastToken.value += substring;
          } else {
            tokens.push({
              type: TEXT,
              value: substring
            });
          }

          break;
        }

        var value = template.slice(lastIndex, index).trim();
        tokens.push({
          type: BINDING,
          value: value
        });
        lastIndex = index + close.length;
      }
    }

    return tokens;
  }
  function parseFnExpr(expr) {
    function jsNested(statement) {
      var regex = new RegExp("([a-zA-Z0-9_$]+)\\((.*)\\)", "g");
      var root = {
        _: []
      };

      if (QUOTED_STR.test(statement)) {
        root._.push({
          k: statement,
          t: "l"
        });

        return root;
      }

      var r = regex.exec(statement);

      if (!r || r.length < 3) {
        return root;
      }

      var parameters = args(r[2]);
      var node = {
        _: []
      };
      parameters.forEach(function (p) {
        if (p.e) {
          if (p.e.indexOf("(") == -1) {
            node._.push({
              k: p.e,
              t: "p"
            });
          } else {
            var wrappedNode = jsNested(p.e),
                k;

            for (k in wrappedNode) {
              node._.push(wrappedNode[k][0]);
            }
          }
        }
      }); // Assign node to the node's identifier

      root._.push({
        k: r[1],
        t: 'f',
        _: node._
      }); //root._.push(r[1]:node);


      return root;
    }

    function args(statement) {
      statement += ","; // so I don't have to handle the "last, leftover parameter"

      var results = [];
      var chars = statement.split("");
      var level = 0; // levels of parenthesis, used to track how deep I am in ().

      var index = 0; // determines which parameter am I currently on.

      var temp = "",
          match = '',
          temp2 = '';
      chars.forEach(function (char) {
        switch (true) {
          case char === "'":
          case char === '"':
            if (match.length && match === char) {
              temp += match + temp2 + match;
              results[index] = {
                s: temp2
              };
              match = temp2 = ''; //level--;
              //temp = '';

              index++;
            } else {
              match = char; //level++;
            } //level++;


            break;

          case !match.length && WHITESPACES.indexOf(char) !== -1:
            break;

          case !match.length && char === '(':
            temp += char;
            level++;
            break;

          case !match.length && char === ')':
            temp += char;
            level--;
            break;

          case !match.length && char === ',':
            // if the comma is between a set of parenthesis, ignore.
            if (level !== 0) {
              temp += char;
            } // if the comma is external, split the string.
            else {
                results[index] = {
                  e: temp
                };
                temp = '';
                index++;
              }

            break;

          default:
            if (match.length) {
              temp2 += char;
            } else {
              temp += char;
            }

            break;
        }
      });
      return results;
    } //return if we were able to parse functions otherwise it will be null


    return jsNested(expr)._[0] || null;
  } // Someone bored at http://jsfiddle.net/ryanwheale/e8aaa8ny/3/

  var kick = {
    // Global binders.
    binders: {},
    // Global formatters.
    formatters: {},
    // Global components.
    components: {},
    // Global sightglass adapters.
    adapters: {},

    /*
    // Default attribute prefix.
    _prefix: 'rv',
     _fullPrefix: 'rv-',
     /* get prefix () {
      return this._prefix
    },
     set prefix (value) {
      this._prefix = value
      this._fullPrefix = value + '-'
    }, */
    parseTemplate: parseTemplate,
    parseType: parseType,
    // Default template delimiters.
    templateDelimiters: ['{{', '}}'],
    // Binder shortcuts - extend it if you want to have your own
    // else if(nodeName === '?') {nodeName = 'if';}
    binderMap: {
      '^': '^click',
      '^^': '^dblclick',
      '^_': '^contextmenu',
      '^@': '^change',
      '^+': '^focus',
      '^-': '^blur',
      '@': '@value',
      '@x': '@checked',
      '@-x': '@unchecked',
      ':': ':text',
      '::': ':html',
      '$': ':html',
      '+': ':show',
      '-': ':hide',
      '~': ':disabled',
      '~~': ':enabled',
      '-~': ':enabled'
    },
    // was starBinder in rivetsjs, in kickjs *(star) is used for foreach binding so changing it to varBinder as an variable binder
    varBinderMap: {
      '.&': ':class-&',
      '-.&': '-:class-&',
      '..&': ':style-&',
      '-..&': '-:style-&',
      ':&': ':attr-&',
      '-:&': '-:attr-&'
    },
    // Default sightglass root interface.
    rootInterface: '.',
    // Preload data by default.
    preloadData: true,
    // Default event handler.
    handler: function handler(context, ev, binding) {
      // changing the order of returns as well as passed arguments first then $event
      // todo document this breakig change
      var processedArgs = binding.parseFormatterArguments(binding.fnArgs, 0, ev, binding.view.models);
      var fns = this.name.split(' ');
      var fn = fns[fns.length - 1];

      if (!fn || fn === '') {
        //, binding.view.models, ev
        this.call.apply(this, [context].concat([].concat(processedArgs)));
      } else {
        var _ctx$fn;

        var ctx = binding.model;

        (_ctx$fn = ctx[fn]).call.apply(_ctx$fn, [ctx].concat([].concat(processedArgs)));
      }
    },
    // Sets the attribute on the element. If no binder above is matched it will fall
    // back to using this binder.
    fallbackBinder: function fallbackBinder(el, value) {
      if (value != null) {
        // is this a component?
        var type = this.type;
        var comp = customElements.get(el.localName);

        if (type.substr(0, 1) === ':') {
          type = type.substr(1);
        }

        if (comp && comp.properties && comp.properties[type] !== undefined) {
          var mapType = comp.properties[type];
          el[mapType] = value;
        } else {
          el.setAttribute(type, value);
        }
      } else {
        el.removeAttribute(this.type);
      }
    },
    // Merges an object literal into the corresponding global options.
    configure: function configure(options) {
      var _this = this;

      if (!options) {
        return;
      }

      Object.keys(options).forEach(function (option) {
        var value = options[option];

        if (EXTENSIONS.indexOf(option) > -1) {
          Object.keys(value).forEach(function (key) {
            _this[option][key] = value[key];
          });
        } else {
          _this[option] = value;
        }
      });
    },
    router: {}
  };

  // Check if a value is an object than can be observed.
  function isObject(obj) {
    return typeof obj === 'object' && obj !== null;
  } // Error thrower.


  function error(message) {
    throw new Error('[Observer] ' + message);
  }

  var adapters;
  var interfaces;
  var rootInterface; // Constructs a new keypath observer and kicks things off.

  function Observer(obj, keypath, callback) {
    this.keypath = keypath;
    this.callback = callback;
    this.objectPath = [];
    this.parse();
    this.obj = this.getRootObject(obj);

    if (isObject(this.target = this.realize())) {
      this.set(true, this.key, this.target, this.callback);
    }
  }

  Observer.updateOptions = function (options) {
    adapters = options.adapters;
    interfaces = Object.keys(adapters);
    rootInterface = options.rootInterface;
  }; // Tokenizes the provided keypath string into interface + path tokens for the
  // observer to work with.


  Observer.tokenize = function (keypath, root) {
    var tokens = [];
    var current = {
      i: root,
      path: ''
    };
    var index, chr;

    for (index = 0; index < keypath.length; index++) {
      chr = keypath.charAt(index);

      if (!!~interfaces.indexOf(chr)) {
        tokens.push(current);
        current = {
          i: chr,
          path: ''
        };
      } else {
        current.path += chr;
      }
    }

    tokens.push(current);
    return tokens;
  }; // Parses the keypath using the interfaces defined on the view. Sets variables
  // for the tokenized keypath as well as the end key.


  Observer.prototype.parse = function () {
    var path, root;

    if (!interfaces.length) {
      error('Must define at least one adapter interface.');
    }

    if (!!~interfaces.indexOf(this.keypath[0])) {
      root = this.keypath[0];
      path = this.keypath.substr(1);
    } else {
      root = rootInterface;
      path = this.keypath;
    }

    this.tokens = Observer.tokenize(path, root);
    this.key = this.tokens.pop();
  }; // Realizes the full keypath, attaching observers for every key and correcting
  // old observers to any changed objects in the keypath.


  Observer.prototype.realize = function () {
    var current = this.obj;
    var unreached = -1;
    var prev;
    var token;

    for (var index = 0; index < this.tokens.length; index++) {
      token = this.tokens[index];

      if (isObject(current)) {
        if (typeof this.objectPath[index] !== 'undefined') {
          if (current !== (prev = this.objectPath[index])) {
            this.set(false, token, prev, this);
            this.set(true, token, current, this);
            this.objectPath[index] = current;
          }
        } else {
          this.set(true, token, current, this);
          this.objectPath[index] = current;
        }

        current = this.get(token, current);
      } else {
        if (unreached === -1) {
          unreached = index;
        }

        if (prev = this.objectPath[index]) {
          this.set(false, token, prev, this);
        }
      }
    }

    if (unreached !== -1) {
      this.objectPath.splice(unreached);
    }

    return current;
  }; // Updates the keypath. This is called when any intermediary key is changed.


  Observer.prototype.sync = function () {
    var next, oldValue, newValue;

    if ((next = this.realize()) !== this.target) {
      if (isObject(this.target)) {
        this.set(false, this.key, this.target, this.callback);
      }

      if (isObject(next)) {
        this.set(true, this.key, next, this.callback);
      }

      oldValue = this.value();
      this.target = next;
      newValue = this.value();
      if (newValue !== oldValue || newValue instanceof Function) this.callback.sync();
    } else if (next instanceof Array) {
      this.callback.sync();
    }
  }; // Reads the current end value of the observed keypath. Returns undefined if
  // the full keypath is unreachable.


  Observer.prototype.value = function () {
    if (isObject(this.target)) {
      return this.get(this.key, this.target);
    }
  }; // Sets the current end value of the observed keypath. Calling setValue when
  // the full keypath is unreachable is a no-op.


  Observer.prototype.setValue = function (value) {
    if (isObject(this.target)) {
      adapters[this.key.i].set(this.target, this.key.path, value);
    }
  }; // Gets the provided key on an object.


  Observer.prototype.get = function (key, obj) {
    return adapters[key.i].get(obj, key.path);
  }; // Observes or unobserves a callback on the object using the provided key.


  Observer.prototype.set = function (active, key, obj, callback) {
    var action = active ? 'observe' : 'unobserve';
    adapters[key.i][action](obj, key.path, callback);
  }; // Unobserves the entire keypath.


  Observer.prototype.unobserve = function () {
    var obj;
    var token;

    for (var index = 0; index < this.tokens.length; index++) {
      token = this.tokens[index];

      if (obj = this.objectPath[index]) {
        this.set(false, token, obj, this);
      }
    }

    if (isObject(this.target)) {
      this.set(false, this.key, this.target, this.callback);
    }
  }; // traverse the scope chain to find the scope which has the root property
  // if the property is not found in chain, returns the root scope


  Observer.prototype.getRootObject = function (obj) {
    var rootProp, current;

    if (!obj.$parent) {
      return obj;
    }

    if (this.tokens.length) {
      rootProp = this.tokens[0].path;
    } else {
      rootProp = this.key.path;
    }

    current = obj;

    while (current.$parent && current[rootProp] === undefined) {
      current = current.$parent;
    }

    return current;
  };

  function getInputValue(el) {
    var results = [];

    if (el.type === "checkbox") {
      return el.checked;
    } else if (el.type === "select-multiple") {
      el.options.forEach(function (option) {
        if (option.selected) {
          results.push(option.value);
        }
      });
      return results;
    } else {
      return el.value;
    }
  }

  var FORMATTER_ARGS = /[^\s']+|'([^']|'[^\s])*'|"([^"]|"[^\s])*"/g;
  var FORMATTER_SPLIT = /\s+/;
  var FN_CHECK = /\(.*\)/; // A single binding between a model attribute and a DOM element.

  var Binding =
  /*#__PURE__*/
  function () {
    // All information about the binding is passed into the constructor; the
    // containing view, the DOM node, the type of binding, the model object and the
    // keypath at which to listen for changes.
    function Binding(view, el, type, keypath, binder, arg, formatters) {
      this.view = view;
      this.el = el;
      this.type = type;
      this.keypath = keypath;
      this.binder = binder;
      this.arg = arg;
      this.formatters = formatters;
      this.formatterObservers = {};
      this.model = undefined; //new property in kick for fn args but not sure if this is the right way

      this.fnArgs = []; //new property in kick for subscribers to get notified if value is changing specifically for jquery plugins

      this.subscribers = []; //new property in kick for locking to avoid loops of updates, specifically for jquery plugins

      this.locked = false; // add object to hold listners so that they can be unbinded later

      this.listeners = {};
    } // Observes the object keypath


    var _proto = Binding.prototype;

    _proto.observe = function observe(obj, keypath) {
      return new Observer(obj, keypath, this);
    };

    _proto.parseTarget = function parseTarget() {
      if (this.keypath) {
        var token = parseType(this.keypath);

        if (token.type === 0) {
          this.value = token.value;
        } else {
          if (FN_CHECK.test(this.keypath)) {
            var fnExpr = parseFnExpr(this.keypath);

            if (fnExpr) {
              this.keypath = fnExpr.k;
              this.fnArgs = fnExpr._.map(function (x) {
                return x.k;
              }); //let fnArgs = fnExpr._.map(x => x.k)
              //this.fnArgs = this.parseFormatterArguments(fnArgs, 0)
            }
          }

          this.observer = this.observe(this.view.models, this.keypath);
          this.model = this.observer.target;
        }
      } else {
        this.value = undefined;
      }
    };

    _proto.parseFormatterArguments = function parseFormatterArguments(args, formatterIndex, ev, vm) {
      var _this = this;

      return args.map(parseType).map(function (_ref, ai) {
        var type = _ref.type,
            value = _ref.value;

        if (type === 0) {
          return value;
        } else if (value === '$ev') {
          //return event here
          return ev;
        } else if (value === '$vm') {
          //return model here
          return vm;
        } else if (value === '$el') {
          //return element here
          return _this.el;
        } else {
          if (!_this.formatterObservers[formatterIndex]) {
            _this.formatterObservers[formatterIndex] = {};
          }

          var observer = _this.formatterObservers[formatterIndex][ai];

          if (!observer) {
            observer = _this.observe(_this.view.models, value);
            _this.formatterObservers[formatterIndex][ai] = observer;
          }

          return observer.value();
        }
      });
    } // Applies all the current formatters to the supplied value and returns the
    // formatted value.
    ;

    _proto.formattedValue = function formattedValue(value) {
      var _this2 = this;

      return this.formatters.reduce(function (result, declaration, index) {
        var args = declaration.match(FORMATTER_ARGS);
        var id = args.shift();
        var formatter = _this2.view.options.formatters[id];

        var processedArgs = _this2.parseFormatterArguments(args, index, null, _this2.view.models);

        if (formatter && formatter.read instanceof Function) {
          result = formatter.read.apply(formatter, [result].concat(processedArgs));
        } else if (formatter instanceof Function) {
          result = formatter.apply(void 0, [result].concat(processedArgs));
        }

        return result;
      }, value);
    } // Returns an event handler for the binding around the supplied function.
    ;

    _proto.eventHandler = function eventHandler(fn) {
      var binding = this;
      var handler = binding.view.options.handler;
      var lfn = fn;
      var type = this.type;
      var el = this.el;

      if (type.substr(0, 1) === '^') {
        type = type.substr(1);
      }

      if (el.constructor && el.constructor.properties && el.constructor.properties[type] !== undefined) {
        var mapType = el.constructor.properties[type];
        el[mapType] = lfn;
      } else {
        return function (ev) {
          lfn && handler.call(lfn, this, ev, binding);
        };
      }
    } // Sets the value for the binding. This Basically just runs the binding routine
    // with the supplied value formatted.
    ;

    _proto.set = function set(value) {
      if (value instanceof Function && !this.binder.function) {
        var _value;

        //todo update docs, probably a breaking change
        var processedArgs = this.parseFormatterArguments(this.fnArgs, 0, null, this.view.models);
        value = this.formattedValue((_value = value).call.apply(_value, [this.model].concat([].concat(processedArgs)))); //value = this.formattedValue(value.call(this.model))
      } else {
        value = this.formattedValue(value);
      }

      var routineFn = this.binder.routine || this.binder;

      if (routineFn instanceof Function) {
        routineFn.call(this, this.el, value);
        this.callSubscribers(value);
      }
    } // Syncs up the view binding with the model.
    ;

    _proto.sync = function sync() {
      if (this.observer) {
        this.model = this.observer.target;
        this.set(this.observer.value());
      } else {
        this.set(this.value);
      }
    } // Publishes the value currently set on the input element back to the model.
    ;

    _proto.publish = function publish() {
      var _this3 = this;

      if (this.observer) {
        var value = this.formatters.reduceRight(function (result, declaration, index) {
          var args = declaration.split(FORMATTER_SPLIT);
          var id = args.shift();
          var formatter = _this3.view.options.formatters[id];

          var processedArgs = _this3.parseFormatterArguments(args, index, null, _this3.view.models);

          if (formatter && formatter.publish) {
            result = formatter.publish.apply(formatter, [result].concat(processedArgs));
          }

          return result;
        }, this.getValue(this.el));
        this.observer.setValue(value);
      }
    } // Subscribes to the model for changes at the specified keypath. Bi-directional
    // routines will also listen for changes on the element to propagate them back
    // to the model.
    ;

    _proto.bind = function bind() {
      this.parseTarget();

      if (this.binder.hasOwnProperty("bind")) {
        this.binder.bind.call(this, this.el);
      }

      if (this.view.options.preloadData) {
        this.sync();
      }
    } // Unsubscribes from the model and the element.
    ;

    _proto.unbind = function unbind() {
      var _this4 = this;

      if (this.binder.unbind) {
        this.binder.unbind.call(this, this.el);
      }

      if (this.observer) {
        this.observer.unobserve();
      }

      Object.keys(this.formatterObservers).forEach(function (fi) {
        var args = _this4.formatterObservers[fi];
        Object.keys(args).forEach(function (ai) {
          args[ai].unobserve();
        });
      });
      this.formatterObservers = {};
    } // Updates the binding's model from what is currently set on the view. Unbinds
    // the old model first and then re-binds with the new model.
    ;

    _proto.update = function update(models) {
      if (models === void 0) {
        models = {};
      }

      if (this.observer) {
        this.model = this.observer.target;
      }

      if (this.binder.update) {
        this.binder.update.call(this, models);
      }
    } // Returns elements value
    ;

    _proto.getValue = function getValue(el) {
      if (this.binder && this.binder.getValue) {
        return this.binder.getValue.call(this, el);
      } else {
        return getInputValue(el);
      }
    } // Subscribe to the value changes
    ;

    _proto.subscribe = function subscribe(listener) {
      var index = this.subscribers.push(listener) - 1; // Provide handle back for removal of listener

      return {
        remove: function remove() {
          delete this.subscribers[index];
        }
      };
    } // Call the subscribers
    ;

    _proto.callSubscribers = function callSubscribers(value) {
      // Cycle through subscribers queue, fire!
      this.subscribers.forEach(function (item) {
        item(value);
      });
    } // lock if not locked and returns false if already locked
    ;

    _proto.lock = function lock(locking) {
      // return locked state if none provided
      if (locking === undefined) {
        return this.locked;
      } else if (this.locked === true && locking === true) {
        // already locked asking again for same lock state
        return false;
      }

      return this.locked = locking;
    } // Returns the next of kin bindings on the same element
    ;

    _proto.kins = function kins() {
      var _this5 = this;

      return this.view.bindings.filter(function (x) {
        return x.el === _this5.el;
      });
    } // Returns the binding of a given type on the same element
    ;

    _proto.kin = function kin(type) {
      var mappedType = kick.binderMap[type] || type;
      return this.kins().find(function (x) {
        return x.type === mappedType;
      });
    };

    return Binding;
  }();

  var textBinder = {
    routine: function routine(node, value) {
      node.data = value != null ? value : '';
    }
  };
  var DECLARATION_SPLIT = /((?:'[^']*')*(?:(?:[^\|']*(?:'[^']*')+[^\|']*)+|[^\|]+))|^$/g;
  var binderPrefixes = '@:^.-+?!*#$~'.split('');

  var parseNode = function parseNode(view, node) {
    var block = false;

    if (node.nodeType === 3) {
      var tokens = parseTemplate(node.data, kick.templateDelimiters);

      if (tokens) {
        for (var i = 0; i < tokens.length; i++) {
          var token = tokens[i];
          var text = document.createTextNode(token.value);
          node.parentNode.insertBefore(text, node);

          if (token.type === 1) {
            view.buildBinding(text, null, token.value, textBinder, null);
          }
        }

        node.parentNode.removeChild(node);
      }

      block = true;
    } else if (node.nodeType === 1) {
      block = view.traverse(node);
    }

    if (!block) {
      for (var _i = 0; _i < node.childNodes.length; _i++) {
        parseNode(view, node.childNodes[_i]);
      }
    }
  };

  var bindingComparator = function bindingComparator(a, b) {
    var aPriority = a.binder ? a.binder.priority || 0 : 0;
    var bPriority = b.binder ? b.binder.priority || 0 : 0;
    return bPriority - aPriority;
  };

  var trimStr = function trimStr(str) {
    return str.trim();
  }; // A collection of bindings built from a set of parent nodes.


  var View =
  /*#__PURE__*/
  function () {
    // The DOM elements and the model objects for binding are passed into the
    // constructor along with any local options that should be used throughout the
    // context of the view and it's bindings.
    function View(els, models, options) {
      if (els.jquery || els instanceof Array) {
        this.els = els;
      } else {
        this.els = [els];
      }

      this.models = models;
      this.options = options;
      this.build();
    }

    var _proto = View.prototype;

    _proto.buildBinding = function buildBinding(node, type, declaration, binder, arg) {
      var pipes = declaration.match(DECLARATION_SPLIT).map(trimStr);
      var keypath = pipes.shift();

      if (arg === '' && type === '*') {
        // resolve for in expression, useful for case sensitive members e.g. myItem in items
        var forRE = new RegExp(/^(.+)\s+in\s+(.[^|\s]+)(.*)$/gm);
        var forExp = forRE.exec(keypath); // console.log(forExp)

        if (forExp && forExp.length > 2) {
          arg = forExp[1] || arg;
          keypath = forExp[2] || keypath;
        } // console.log(forExp[3].split('|'))

      }

      this.bindings.push(new Binding(this, node, type, keypath, binder, arg, pipes));
    } // Parses the DOM tree and builds `Binding` instances for every matched
    // binding declaration.
    ;

    _proto.build = function build() {
      this.bindings = [];
      var elements = this.els,
          i,
          len;

      for (i = 0, len = elements.length; i < len; i++) {
        parseNode(this, elements[i]);
      }

      this.bindings.sort(bindingComparator);
    };

    _proto.traverse = function traverse(node) {
      // let bindingPrefix = kick._fullPrefix
      var block = node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE';
      var attributes = node.attributes;
      var bindInfos = [];
      var varBinders = this.options.varBinders;
      var mappedBinder;
      var binderType, binder, identifier, arg;

      for (var i = 0, len = attributes.length; i < len; i++) {
        var attribute = attributes[i]; // if (attribute.name.indexOf(bindingPrefix) === 0) {

        if (this.startWithBinder(attribute.name)) {
          // binderType = attribute.name.slice(bindingPrefix.length);
          mappedBinder = kick.binderMap[attribute.name];
          binderType = mappedBinder || attribute.name; // type = attribute.name.slice(bindingPrefix.length)

          binder = this.options.binders[binderType];
          arg = undefined;

          if (!binder) {
            for (var k = 0; k < varBinders.length; k++) {
              identifier = varBinders[k];

              if (binderType.slice(0, identifier.length - 1) === identifier.slice(0, -1)) {
                binder = this.options.binders[identifier];
                arg = binderType.slice(identifier.length - 1);
                break;
              }
            }
          }

          if (!binder) {
            binder = kick.fallbackBinder;
          }

          if (binder.block) {
            this.buildBinding(node, binderType, attribute.value, binder, arg);
            node.removeAttribute(attribute.name);
            return true;
          }

          bindInfos.push({
            attr: attribute,
            binder: binder,
            type: binderType,
            arg: arg
          });
        }
      }

      for (var _i2 = 0; _i2 < bindInfos.length; _i2++) {
        var bindInfo = bindInfos[_i2];
        this.buildBinding(node, bindInfo.type, bindInfo.attr.value, bindInfo.binder, bindInfo.arg);
        node.removeAttribute(bindInfo.attr.name);
      }

      if (kick.components[binderType] && !node._bound) {
        this.bindings.push(new ComponentBinding(this, node, binderType));
        block = true;
      }

      return block;
    } // Binds all of the current bindings for this view.
    ;

    _proto.bind = function bind() {
      this.bindings.forEach(function (binding) {
        binding.bind();
      });
    } // Unbinds all of the current bindings for this view.
    ;

    _proto.unbind = function unbind() {
      this.bindings.forEach(function (binding) {
        binding.unbind();
      });
    } // Syncs up the view with the model by running the routines on all bindings.
    ;

    _proto.sync = function sync() {
      this.bindings.forEach(function (binding) {
        binding.sync();
      });
    } // Publishes the input values from the view back to the model (reverse sync).
    ;

    _proto.publish = function publish() {
      this.bindings.forEach(function (binding) {
        if (binding.binder && binding.binder.publishes) {
          binding.publish();
        }
      });
    } // Updates the view's models along with any affected bindings.
    ;

    _proto.update = function update(models) {
      var _this = this;

      if (models === void 0) {
        models = {};
      }

      Object.keys(models).forEach(function (key) {
        _this.models[key] = models[key];
      });
      this.bindings.forEach(function (binding) {
        if (binding.update) {
          binding.update(models);
        }
      });
    } // move it to utils
    ;

    _proto.startWithBinder = function startWithBinder(name) {
      var prefix = name.substr(0, 1);
      return binderPrefixes.some(function (pre) {
        return pre === prefix;
      });
    };

    return View;
  }();

  var has$ = window.jQuery ? true : false;

  var on = function on(el, arg, handler) {
    has$ ? $(el).on(arg, handler) : el.addEventListener(arg, handler);
  };

  var off = function off(el, arg, handler) {
    has$ ? $(el).off(arg, handler) : el.removeEventListener(arg, handler);
  };

  var getString = function getString(value) {
    return value != null ? value.toString() : undefined;
  };

  var times = function times(n, cb) {
    for (var i = 0; i < n; i++) {
      cb();
    }
  };

  function createView(binding, data, anchorEl) {
    var template = binding.el.cloneNode(true);
    var view = new View(template, data, binding.view.options);
    view.bind();
    binding.marker.parentNode.insertBefore(template, anchorEl);
    return view;
  }

  var binders = {
    // Binds an event handler on the element.
    '^&': {
      function: true,
      priority: 1000,
      unbind: function unbind(el) {
        if (this.handler) {
          off(el, this.arg, this.handler);
        }
      },
      routine: function routine(el, value) {
        if (this.handler) {
          off(el, this.arg, this.handler);
        }

        this.handler = this.eventHandler(value);
        on(el, this.arg, this.handler);
      }
    },
    // for $item Appends bound instances of the element in place for item in the array.
    '*&': {
      block: true,
      priority: 4000,
      bind: function bind(el) {
        if (!this.marker) {
          this.marker = document.createComment(" kick: " + this.type + " ");
          this.iterated = [];
          el.parentNode.insertBefore(this.marker, el);
          el.parentNode.removeChild(el);
        } else {
          this.iterated.forEach(function (view) {
            view.bind();
          });
        }
      },
      unbind: function unbind(el) {
        if (this.iterated) {
          this.iterated.forEach(function (view) {
            view.unbind();
          });
        }
      },
      routine: function routine(el, collection) {
        var _this = this;

        var modelName = this.arg || '$item';
        collection = collection || [];
        var indexProp = el.getAttribute('#index') || el.getAttribute('index-property') || '$index';
        collection.forEach(function (model, index) {
          var data = {
            $parent: _this.view.models
          };
          data[indexProp] = index;
          data[modelName] = model;
          var view = _this.iterated[index];

          if (!view) {
            var previous = _this.marker;

            if (_this.iterated.length) {
              previous = _this.iterated[_this.iterated.length - 1].els[0];
            }

            view = createView(_this, data, previous.nextSibling);

            _this.iterated.push(view);
          } else {
            if (view.models[modelName] !== model) {
              // search for a view that matches the model
              var matchIndex, nextView;

              for (var nextIndex = index + 1; nextIndex < _this.iterated.length; nextIndex++) {
                nextView = _this.iterated[nextIndex];

                if (nextView.models[modelName] === model) {
                  matchIndex = nextIndex;
                  break;
                }
              }

              if (matchIndex !== undefined) {
                // model is in other position
                // todo: consider avoiding the splice here by setting a flag
                // profile performance before implementing such change
                _this.iterated.splice(matchIndex, 1);

                _this.marker.parentNode.insertBefore(nextView.els[0], view.els[0]);

                nextView.models[indexProp] = index;
              } else {
                //new model
                nextView = createView(_this, data, view.els[0]);
              }

              _this.iterated.splice(index, 0, nextView);
            } else {
              view.models[indexProp] = index;
            }
          }
        });

        if (this.iterated.length > collection.length) {
          times(this.iterated.length - collection.length, function () {
            var view = _this.iterated.pop();

            view.unbind();

            _this.marker.parentNode.removeChild(view.els[0]);
          });
        }

        if (el.nodeName === 'OPTION') {
          this.view.bindings.forEach(function (binding) {
            if (binding.el === _this.marker.parentNode && binding.type === 'value') {
              binding.sync();
            }
          });
        }
      },
      update: function update(models) {
        var _this2 = this;

        var data = {}; //todo: add test and fix if necessary

        Object.keys(models).forEach(function (key) {
          if (key !== _this2.arg) {
            data[key] = models[key];
          }
        });
        this.iterated.forEach(function (view) {
          view.update(data);
        });
      }
    },
    // Order of ..& should be before .& otherwise match will trigger shorter length first
    // removes the style from the element when there is value
    '-..&': function _(el, value) {
      var propertyName = this.arg;

      if (value) {
        el.style[propertyName] = '';
      }
    },
    // Order of ..& should be before .& otherwise match will trigger shorter length first
    // Adds or removes the style from the element when there is value
    '..&': function _(el, value) {
      var propertyName = this.arg;

      if (value) {
        el.style[propertyName] = value;
      } else {
        el.style[propertyName] = '';
      }
    },
    // Adds or removes the class from the element when value is false or true.
    '-.&': function _(el, value) {
      var elClass = " " + el.className + " ";

      if (value === elClass.indexOf(" " + this.arg + " ") > -1) {
        if (value) {
          el.className = elClass.replace(" " + this.arg + " ", ' ').trim();
        } else {
          el.className = el.className + " " + this.arg;
        }
      }
    },
    // Adds or removes the class from the element when value is true or false.
    '.&': function _(el, value) {
      var elClass = " " + el.className + " ";

      if (!value === elClass.indexOf(" " + this.arg + " ") > -1) {
        if (value) {
          el.className = el.className + " " + this.arg;
        } else {
          el.className = elClass.replace(" " + this.arg + " ", ' ').trim();
        }
      }
    },
    // Sets the element's text value.
    ':text': function text(el, value) {
      el.textContent = value != null ? value : '';
    },
    // Sets the element's HTML content.
    ':html': function html(el, value) {
      el.innerHTML = value != null ? value : '';
    },
    // Shows the element when value is true.
    ':show': function show(el, value) {
      el.style.display = value ? '' : 'none';
    },
    // Hides the element when value is true (negated version of `show` binder).
    ':hide': function hide(el, value) {
      el.style.display = value ? 'none' : '';
    },
    // Enables the element when value is true.
    ':enabled': function enabled(el, value) {
      el.disabled = !value;
    },
    // Disables the element when value is true (negated version of `enabled` binder).
    ':disabled': function disabled(el, value) {
      el.disabled = !!value;
    },
    // Checks a checkbox or radio input when the value is true. Also sets the model
    // property when the input is checked or unchecked (two-way binder).
    // also "@x"
    '@checked': {
      publishes: true,
      priority: 2000,
      bind: function bind(el) {
        var self = this;

        if (!this.callback) {
          this.callback = function () {
            self.publish();
          };
        }

        el.addEventListener('change', this.callback);
      },
      unbind: function unbind(el) {
        el.removeEventListener('change', this.callback);
      },
      routine: function routine(el, value) {
        if (el.type === 'radio') {
          el.checked = getString(el.value) === getString(value);
        } else {
          el.checked = !!value;
        }
      }
    },
    // Unchecks a checkbox or radio input when the value is true. Also sets the model
    // property when the input is checked or unchecked (two-way binder).
    // also "@-x"
    '@unchecked': {
      publishes: true,
      priority: 2000,
      bind: function bind(el) {
        var self = this;

        if (!this.callback) {
          this.callback = function () {
            self.publish();
          };
        }

        el.addEventListener('change', this.callback);
      },
      unbind: function unbind(el) {
        el.removeEventListener('change', this.callback);
      },
      routine: function routine(el, value) {
        if (el.type === 'radio') {
          el.checked = !(getString(el.value) === getString(value));
        } else {
          el.checked = !!!value;
        }
      }
    },
    // Sets the element's value. Also sets the model property when the input changes
    // (two-way binder).
    '@value': {
      publishes: true,
      priority: 3000,
      bind: function bind(el) {
        this.isRadio = el.tagName === 'INPUT' && el.type === 'radio';

        if (!this.isRadio) {
          this.event = el.getAttribute('event-name') || (el.tagName === 'SELECT' ? 'change' : 'input');
          var self = this;

          if (!this.callback) {
            this.callback = function () {
              self.publish();
            };
          }

          el.addEventListener(this.event, this.callback);
        }
      },
      unbind: function unbind(el) {
        if (!this.isRadio) {
          el.removeEventListener(this.event, this.callback);
        }
      },
      routine: function routine(el, value) {
        if (this.isRadio) {
          el.setAttribute('value', value);
        } else {
          if (el.type === 'select-multiple') {
            if (value instanceof Array) {
              for (var i = 0; i < el.length; i++) {
                var option = el[i];
                option.selected = value.indexOf(option.value) > -1;
              }
            }
          } else if (getString(value) !== getString(el.value)) {
            el.value = value != null ? value : '';
          }
        }
      }
    },
    // Inserts and binds the element and it's child nodes into the DOM when true.
    '?': {
      block: true,
      priority: 4000,
      bind: function bind(el) {
        if (!this.marker) {
          this.marker = document.createComment(' kick: ' + this.type + ' ' + this.keypath + ' ');
          this.attached = false;
          el.parentNode.insertBefore(this.marker, el);
          el.parentNode.removeChild(el);
        } else if (this.bound === false && this.nested) {
          this.nested.bind();
        }

        this.bound = true;
      },
      unbind: function unbind() {
        if (this.nested) {
          this.nested.unbind();
          this.bound = false;
        }
      },
      routine: function routine(el, value) {
        if (!!value !== this.attached) {
          if (value) {
            if (!this.nested) {
              this.nested = new View(el, this.view.models, this.view.options);
              this.nested.bind();
            }

            this.marker.parentNode.insertBefore(el, this.marker.nextSibling);
            this.attached = true;
          } else {
            el.parentNode.removeChild(el);
            this.attached = false;
          }
        }
      },
      update: function update(models) {
        if (this.nested) {
          this.nested.update(models);
        }
      }
    },
    // Inserts and binds the element and it's child nodes into the DOM when false.
    '-?': {
      block: true,
      priority: 4001,
      bind: function bind(el) {
        if (!this.marker) {
          this.marker = document.createComment(' kick: ' + this.type + ' ' + this.keypath + ' ');
          this.attached = false;
          el.parentNode.insertBefore(this.marker, el);
          el.parentNode.removeChild(el);
        } else if (this.bound === false && this.nested) {
          this.nested.bind();
        }

        this.bound = true;
      },
      unbind: function unbind() {
        if (this.nested) {
          this.nested.unbind();
          this.bound = false;
        }
      },
      routine: function routine(el, value) {
        if (!!value === this.attached) {
          if (!value) {
            if (!this.nested) {
              this.nested = new View(el, this.view.models, this.view.options);
              this.nested.bind();
            }

            this.marker.parentNode.insertBefore(el, this.marker.nextSibling);
            this.attached = true;
          } else {
            el.parentNode.removeChild(el);
            this.attached = false;
          }
        }
      },
      update: function update(models) {
        if (this.nested) {
          this.nested.update(models);
        }
      }
    },
    ':&': function _(el, value) {
      if (value != null) {
        el.setAttribute(this.arg, value);
      } else {
        el.removeAttribute(this.arg);
      }
    },
    '-:&': function _(el, value) {
      if (value != null) {
        el.removeAttribute(this.arg);
      }
    }
  };

  var formatters = {
    watch: function watch(value) {
      return value;
    },
    not: function not(value) {
      return !value;
    },
    negate: function negate(value) {
      return !value;
    }
  };

  // The default `.` adapter that comes with kick.js. Allows subscribing to
  // properties on plain objects, implemented in ES5 natives using
  // `Object.defineProperty`.
  var ARRAY_METHODS = ['push', 'pop', 'shift', 'unshift', 'sort', 'reverse', 'splice'];
  var adapter = {
    counter: 0,
    weakmap: {},
    weakReference: function weakReference(obj) {
      if (!obj.hasOwnProperty('__rv')) {
        var id = this.counter++;
        Object.defineProperty(obj, '__rv', {
          value: id
        });
      }

      if (!this.weakmap[obj.__rv]) {
        this.weakmap[obj.__rv] = {
          callbacks: {}
        };
      }

      return this.weakmap[obj.__rv];
    },
    cleanupWeakReference: function cleanupWeakReference(ref, id) {
      if (!Object.keys(ref.callbacks).length) {
        if (!(ref.pointers && Object.keys(ref.pointers).length)) {
          delete this.weakmap[id];
        }
      }
    },
    stubFunction: function stubFunction(obj, fn) {
      var original = obj[fn];
      var map = this.weakReference(obj);
      var weakmap = this.weakmap;

      obj[fn] = function () {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        var response = original.apply(obj, args);
        Object.keys(map.pointers).forEach(function (r) {
          var k = map.pointers[r];

          if (weakmap[r]) {
            if (weakmap[r].callbacks[k] instanceof Array) {
              weakmap[r].callbacks[k].forEach(function (callback) {
                callback.sync();
              });
            }
          }
        });
        return response;
      };
    },
    observeMutations: function observeMutations(obj, ref, keypath) {
      var _this = this;

      if (obj instanceof Array) {
        var map = this.weakReference(obj);

        if (!map.pointers) {
          map.pointers = {};
          ARRAY_METHODS.forEach(function (fn) {
            _this.stubFunction(obj, fn);
          });
        }

        if (!map.pointers[ref]) {
          map.pointers[ref] = [];
        }

        if (map.pointers[ref].indexOf(keypath) === -1) {
          map.pointers[ref].push(keypath);
        }
      }
    },
    unobserveMutations: function unobserveMutations(obj, ref, keypath) {
      if (obj instanceof Array && obj.__rv != null) {
        var map = this.weakmap[obj.__rv];

        if (map) {
          var pointers = map.pointers[ref];

          if (pointers) {
            var idx = pointers.indexOf(keypath);

            if (idx > -1) {
              pointers.splice(idx, 1);
            }

            if (!pointers.length) {
              delete map.pointers[ref];
            }

            this.cleanupWeakReference(map, obj.__rv);
          }
        }
      }
    },
    observe: function observe(obj, keypath, callback) {
      var _this2 = this;

      var value;
      var callbacks = this.weakReference(obj).callbacks;

      if (!callbacks[keypath]) {
        callbacks[keypath] = [];
        var desc = Object.getOwnPropertyDescriptor(obj, keypath);

        if (!desc || !(desc.get || desc.set || !desc.configurable)) {
          value = obj[keypath];
          Object.defineProperty(obj, keypath, {
            enumerable: true,
            get: function get() {
              return value;
            },
            set: function set(newValue) {
              if (newValue !== value) {
                _this2.unobserveMutations(value, obj.__rv, keypath);

                value = newValue;
                var map = _this2.weakmap[obj.__rv];

                if (map) {
                  var _callbacks = map.callbacks[keypath];

                  if (_callbacks) {
                    _callbacks.forEach(function (cb) {
                      cb.sync();
                    });
                  }

                  _this2.observeMutations(newValue, obj.__rv, keypath);
                }
              }
            }
          });
        }
      }

      if (callbacks[keypath].indexOf(callback) === -1) {
        callbacks[keypath].push(callback);
      }

      this.observeMutations(obj[keypath], obj.__rv, keypath);
    },
    unobserve: function unobserve(obj, keypath, callback) {
      var map = this.weakmap[obj.__rv];

      if (map) {
        var callbacks = map.callbacks[keypath];

        if (callbacks) {
          var idx = callbacks.indexOf(callback);

          if (idx > -1) {
            callbacks.splice(idx, 1);

            if (!callbacks.length) {
              delete map.callbacks[keypath];
              this.unobserveMutations(obj[keypath], obj.__rv, keypath);
            }
          }

          this.cleanupWeakReference(map, obj.__rv);
        }
      }
    },
    get: function get(obj, keypath) {
      return obj[keypath];
    },
    set: function set(obj, keypath, value) {
      obj[keypath] = value;
    }
  };

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    subClass.__proto__ = superClass;
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function isNativeReflectConstruct() {
    if (typeof Reflect === "undefined" || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === "function") return true;

    try {
      Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
      return true;
    } catch (e) {
      return false;
    }
  }

  function _construct(Parent, args, Class) {
    if (isNativeReflectConstruct()) {
      _construct = Reflect.construct;
    } else {
      _construct = function _construct(Parent, args, Class) {
        var a = [null];
        a.push.apply(a, args);
        var Constructor = Function.bind.apply(Parent, a);
        var instance = new Constructor();
        if (Class) _setPrototypeOf(instance, Class.prototype);
        return instance;
      };
    }

    return _construct.apply(null, arguments);
  }

  function _isNativeFunction(fn) {
    return Function.toString.call(fn).indexOf("[native code]") !== -1;
  }

  function _wrapNativeSuper(Class) {
    var _cache = typeof Map === "function" ? new Map() : undefined;

    _wrapNativeSuper = function _wrapNativeSuper(Class) {
      if (Class === null || !_isNativeFunction(Class)) return Class;

      if (typeof Class !== "function") {
        throw new TypeError("Super expression must either be null or a function");
      }

      if (typeof _cache !== "undefined") {
        if (_cache.has(Class)) return _cache.get(Class);

        _cache.set(Class, Wrapper);
      }

      function Wrapper() {
        return _construct(Class, arguments, _getPrototypeOf(this).constructor);
      }

      Wrapper.prototype = Object.create(Class.prototype, {
        constructor: {
          value: Wrapper,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
      return _setPrototypeOf(Wrapper, Class);
    };

    return _wrapNativeSuper(Class);
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  var Component =
  /*#__PURE__*/
  function (_HTMLElement) {
    _inheritsLoose(Component, _HTMLElement);

    Component.setObservedAttributes = function setObservedAttributes(_comp) {
      var template = _comp.template;
      var tag = _comp.tag;

      if (!template || !tag) {
        throw new Error("No template or tag declared for " + this.name);
      }

      _comp.__templateEl = document.createElement('template');
      _comp.__templateEl.innerHTML = template;
      var propAttributeMap = _comp.__propAttributeMap = {};
      var attributes = [];
      var properties = _comp.properties;

      if (properties) {
        Object.keys(properties).forEach(function (propName) {
          var propConfig = properties[propName];
          var attrName = typeof propConfig === 'string' ? propConfig : propName;
          propAttributeMap[attrName] = propName;
          attributes.push(attrName); // this.vm[propName] = propConfig
        });
      }

      return attributes;
    };

    var _proto = Component.prototype;

    _proto.connectedCallback = function connectedCallback() {
      var nodes = this.constructor.__templateEl.content.cloneNode(true);

      this.__kickView = kick.bind(nodes, this);

      while (this.firstChild) {
        this.removeChild(this.firstChild);
      }

      this.__kickView.sync();

      this.appendChild(nodes);

      this.__kickView.sync();

      this.afterInit();
    };

    _proto.disconnectedCallback = function disconnectedCallback() {
      this.beforeExit();

      this.__kickView.unbind();
    };

    _proto.attributeChangedCallback = function attributeChangedCallback(name, old, value) {
      if (old !== value) {
        var propName = this.constructor.__propAttributeMap[name];
        this[propName] = value;
      }
    };

    _createClass(Component, null, [{
      key: "observedAttributes",
      get: function get() {
        return this.setObservedAttributes(this);
      }
    }]);

    function Component() {
      var _this;

      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var self = _this = _HTMLElement.call.apply(_HTMLElement, [this].concat(args)) || this; // !this.properties && this.setObservedAttributes(this)
      // this.__templateEl = document.createElement('template')
      // this.__templateEl.innerHTML = this.template
      //let templateContent = template.content


      _this.onInit();

      return self || _assertThisInitialized(_this);
    }

    _proto.onInit = function onInit() {};

    _proto.afterInit = function afterInit() {};

    _proto.beforeExit = function beforeExit() {};

    return Component;
  }(_wrapNativeSuper(HTMLElement));

  kick.binders = binders;
  kick.formatters = formatters;
  kick.adapters['.'] = adapter;
  kick.Component = Component; //kick.router = router
  // Binds some data to a template / element. Returns a kick.View instance.

  kick.bind = function (elm, models, options) {
    // if element then return itself
    elm = elm || '[kick-app]';
    var el = elm.nodeType && elm.nodeType > 0 ? elm : document.querySelector(elm);
    kick.includeFile(el); // refresh the el again after loading files

    el = elm.nodeType && elm.nodeType > 0 ? elm : document.querySelector(elm);
    var viewOptions = {};
    models = models || {};
    options = options || {};
    EXTENSIONS.forEach(function (extensionType) {
      viewOptions[extensionType] = Object.create(null);

      if (options[extensionType]) {
        Object.keys(options[extensionType]).forEach(function (key) {
          viewOptions[extensionType][key] = options[extensionType][key];
        });
      }

      Object.keys(kick[extensionType]).forEach(function (key) {
        if (!viewOptions[extensionType][key]) {
          viewOptions[extensionType][key] = kick[extensionType][key];
        }
      });
    });

    if (viewOptions[COMPS]) {
      Object.keys(viewOptions[COMPS]).forEach(function (key) {
        var comp = viewOptions[COMPS][key]; //kick.components[comp.tag] = comp;

        if (comp.tag && !customElements.get(comp.tag)) {
          customElements.define(comp.tag, comp);
        }
      });
    }

    OPTIONS.forEach(function (option) {
      var value = options[option];
      viewOptions[option] = value != null ? value : kick[option];
    });
    viewOptions.varBinders = Object.keys(viewOptions.binders).filter(function (key) {
      return key.indexOf('&') > 0;
    });
    Observer.updateOptions(viewOptions);
    var view = new View(el, models, viewOptions);
    view.bind();
    return view;
  }; // Initializes a new instance of a component on the specified element and
  // returns a View instance.


  kick.init = function (component, el, data) {
    if (data === void 0) {
      data = {};
    }

    if (el == null) {
      el = document.createElement('div');
    }

    component = kick.components[component];
    var template = component.template.call(kick, el);

    if (template instanceof HTMLElement) {
      while (el.firstChild) {
        el.removeChild(el.firstChild);
      }

      el.appendChild(template);
    } else {
      el.innerHTML = template;
    }

    var scope = component.initialize.call(kick, el, data);
    var view = new View(el, scope);
    view.bind();
    return view;
  };

  kick.formatters.negate = kick.formatters.not = function (value) {
    return !value;
  };

  kick.formatters.call = function (value) {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    if (!args.length) {
      return;
    }

    var fn = args[0];
    args = Array.prototype.slice.call(args, 1); //value.call(...args)

    return fn.call.apply(fn, [value].concat(args));
    /* fix later if needs to be
    return () => {
        return fn.apply(null, value, ...args);
    }
    */
  };

  kick.loadFile = function (el, file) {
    /* Make an HTTP request using the attribute value as the file name: */
    try {
      var xhttp = new XMLHttpRequest();

      xhttp.onreadystatechange = function () {
        if (this.readyState == 4) {
          if (this.status == 200) {
            /* Remove the attribute, and call this function once more: */
            if (el.tagName === 'KICKER') {
              // replace el with new html
              el.outerHTML = this.responseText; // not sure about the below yet 
              // kick.includeFile(el.parent);
            } else {
              el.removeAttribute(":file");
              el.innerHTML = this.responseText;
              kick.includeFile(el);
            }
          } else if (this.status == 404) {
            el.innerHTML = '<!-- ' + this.responseURL + ' not found. -->';
          } else {
            el.innerHTML = '<!-- ' + this.responseText + ' -->';
          }
        }
      };

      xhttp.open("GET", file, false);
      xhttp.send();
    } catch (e) {
      el.innerHTML = '<!-- Unable to connect to server -->';
    }
  }; // Sets the element's HTML content from file.


  kick.includeFile = function (el) {
    var z, i, elmnt, file;

    if (!el.getElementsByTagName) {
      if (el.children.length) {
        z = el.children;
      } else {
        return;
      }
    } else {
      /* Loop through a collection of all HTML elements: */
      z = el.getElementsByTagName("*");
    }

    for (i = 0; i < z.length; i++) {
      elmnt = z[i];
      /*search for elements with a certain atrribute:*/

      file = elmnt.getAttribute(":file");

      if (file) {
        kick.loadFile(elmnt, file);
      }
    }
  };

  return kick;

})));
//# sourceMappingURL=kick.js.map
