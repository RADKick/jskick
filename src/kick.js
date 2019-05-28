import {EXTENSIONS} from './constants'
import {parseTemplate, parseType} from './parsers'

const kick = {
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
    ':' : ':text',
    '::' : ':html',
    '$' : ':html',
    '+': ':show',
    '-': ':hide',
    '~': ':disabled',
    '~~': ':enabled'
    },
    // was starBinder in rivetsjs, in kickjs *(star) is used for binding so changing it to varBinder as an variable binder
    varBinderMap: {
      '.&': ':class-&',
      '..&': ':style-&',
      '::&': ':attr-&',
    },
  // Default sightglass root interface.
  rootInterface: '.',

  // Preload data by default.
  preloadData: true,

  // Default event handler.
  handler: function(context, ev, binding) {
    //changing the order of returns as well as passed arguments first then $event
    //todo document this breakig change
    const processedArgs = binding.parseFormatterArguments(binding.fnArgs, 0);
    this.call(context, ...[...processedArgs, binding.view.models, ev])
  },

  // Sets the attribute on the element. If no binder above is matched it will fall
  // back to using this binder.
  fallbackBinder: function(el, value) {
    if (value != null) {
      let type = this.type; 
      if(type.substr(0,1) === ':'){ type = type.substr(1); }
      el.setAttribute(type, value)
    } else {
      el.removeAttribute(this.type)
    }
  },

  // Merges an object literal into the corresponding global options.
  configure: function(options) {
    if (!options) {
      return
    }
    Object.keys(options).forEach(option => {
      let value = options[option]

      if (EXTENSIONS.indexOf(option) > -1) {
        Object.keys(value).forEach(key => {
          this[option][key] = value[key]
        })
      } else {
        this[option] = value
      }
    })
  },

  router:{}
}

export default kick
