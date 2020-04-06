import kick from './kick'

class Component extends HTMLElement {
  static setObservedAttributes(_comp) {
    const template = _comp.template
    const tag = _comp.tag
    if (!template || !tag) {
      throw new Error(`No template or tag declared for ${this.name}`)
    }
    
    _comp.__templateEl = document.createElement('template')
    _comp.__templateEl.innerHTML = template
    
    const propAttributeMap = _comp.__propAttributeMap = {}
    const attributes = []
    const properties = _comp.properties
    
    if (properties) {
      Object.keys(properties).forEach(propName => {
        const propConfig = properties[propName]
        const attrName = typeof propConfig === 'string' ? propConfig : propName
        propAttributeMap[attrName] = propName        
        attributes.push(attrName)
        
        // this.vm[propName] = propConfig
      })
    }    
    return attributes
  }
  static get observedAttributes() {
    return this.setObservedAttributes(this)
  }


  connectedCallback() {        
    const nodes = this.constructor.__templateEl.content.cloneNode(true)
    this.__kickView = kick.bind(nodes, this)
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }
    this.__kickView.sync()
    this.appendChild(nodes)
    this.__kickView.sync()
    this.afterInit()
  }

  disconnectedCallback() {
    this.beforeExit()
    this.__kickView.unbind()    
  }

  attributeChangedCallback(name, old, value) {
    if (old !== value) {      
      const propName = this.constructor.__propAttributeMap[name]
      this[propName] = value
    }
  }
  constructor(...args){
    const self = super(...args)
    // !this.properties && this.setObservedAttributes(this)
    // this.__templateEl = document.createElement('template')
    // this.__templateEl.innerHTML = this.template

    //let templateContent = template.content


    this.onInit()
    return self
  }
  onInit(){}
  afterInit(){}
  beforeExit(){}
  
}

export default Component