import kick from './kick'
import View from './view'
import {OPTIONS, EXTENSIONS} from './constants'
import adapter from './adapter'
import binders from './binders'
import Observer from './observer'
//import router from './router'
//import components from './components'

// Returns the public interface.
kick.binders = binders
//kick.components = components
kick.adapters['.'] = adapter
//kick.router = router

// Binds some data to a template / element. Returns a kick.View instance.
kick.bind = (elm, models, options) => {
  // if element then return itself
  elm = elm || '[kick-app]';
  let el = (elm.nodeType && elm.nodeType > 0) ? elm : document.querySelector(elm);

  let viewOptions = {}
  models = models || {}
  options = options || {}

  EXTENSIONS.forEach(extensionType => {
    viewOptions[extensionType] = Object.create(null)

    if (options[extensionType]) {
      Object.keys(options[extensionType]).forEach(key => {
        viewOptions[extensionType][key] = options[extensionType][key]
      })
    }

    Object.keys(kick[extensionType]).forEach(key => {
      if (!viewOptions[extensionType][key]) {
        viewOptions[extensionType][key] = kick[extensionType][key]
      }
    })
  })

  OPTIONS.forEach(option => {
    let value = options[option]
    viewOptions[option] = value != null ? value : kick[option]
  })

  viewOptions.varBinders = Object.keys(viewOptions.binders).filter(function (key) {
    return key.indexOf('&') > 0
  })

  Observer.updateOptions(viewOptions)

  let view = new View(el, models, viewOptions)
  view.bind()
  return view
}

// Initializes a new instance of a component on the specified element and
// returns a View instance.
kick.init = (component, el, data = {}) => {
  if (el == null) { el = document.createElement('div'); }
  component = kick.components[component];
  let template = component.template.call(kick, el);
  if (template instanceof HTMLElement) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
    el.appendChild(template);
  } else {
    el.innerHTML = template;
  }
  const scope = component.initialize.call(kick, el, data);

  let view = new View(el, scope)
  view.bind()
  return view
}


kick.formatters.negate = kick.formatters.not = (value) => {
  return !value;
};

kick.formatters.call = (value, ...args) => {
  if(!args.length) {return;}
  let fn = args[0]
  args = Array.prototype.slice.call(args, 1)
  //value.call(...args)
  return fn.call(value, ...args)
  /* fix later if needs to be
  return () => {
      return fn.apply(null, value, ...args);
  }
  */
}

export default kick
