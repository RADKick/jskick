import kick from './kick'
import View from './view'
import {OPTIONS, EXTENSIONS, COMPS} from './constants'
import binders from './binders'
import formatters from './formatters'
import adapter from './adapter'
import Observer from './observer'
//import router from './router'
import Component from './component'

// Returns the public interface.
kick.binders = binders
kick.formatters = formatters
kick.adapters['.'] = adapter
kick.Component = Component
//kick.router = router

// Binds some data to a template / element. Returns a kick.View instance.
kick.bind = (elm, models, options, ) => {
  // if element then return itself
  elm = elm || '[kick-app]';
  let el = (elm.nodeType && elm.nodeType > 0) ? elm : document.querySelector(elm);
  kick.includeFile(el);

  // refresh the el again after loading files
  el = (elm.nodeType && elm.nodeType > 0) ? elm : document.querySelector(elm);

  
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

  if(viewOptions[COMPS]){
    Object.keys(viewOptions[COMPS]).forEach(key => {
      let comp = viewOptions[COMPS][key]
      //kick.components[comp.tag] = comp;
      if(!customElements.get(comp.tag)){
        customElements.define(comp.tag, comp)
      }
    })
  }

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

kick.loadFile = (el, file) => {
  /* Make an HTTP request using the attribute value as the file name: */
  try {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status == 200) {
          /* Remove the attribute, and call this function once more: */
          if(el.tagName === 'KICKER'){
            // replace el with new html
            el.outerHTML = this.responseText;
            // not sure about the below yet 
            // kick.includeFile(el.parent);
          } else {
            el.removeAttribute(":file");
            el.innerHTML = this.responseText;
            kick.includeFile(el);
          }
        }
        else if (this.status == 404) {el.innerHTML = '<!-- ' + this.responseURL + ' not found. -->';}
        else {el.innerHTML = '<!-- ' + this.responseText + ' -->';}
      }
    } 
    xhttp.open("GET", file, false);
    xhttp.send();
  } catch (e) {
    el.innerHTML = '<!-- Unable to connect to server -->';
  }
}

// Sets the element's HTML content from file.
kick.includeFile = (el) => {
  let z, i, elmnt, file;
  if(!el.getElementsByTagName){
    if(el.children.length){
      z = el.children;
    } else {
      return;
    }
  } else{
    /* Loop through a collection of all HTML elements: */
    z =  el.getElementsByTagName("*");
  } 

  for (i = 0; i < z.length; i++) {
    elmnt = z[i];
    /*search for elements with a certain atrribute:*/
    file = elmnt.getAttribute(":file");
    if (file) {
      kick.loadFile(elmnt, file);
    }
  }
}

export default kick
