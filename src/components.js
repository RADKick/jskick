import {parseType} from './parsers'
import Observer from './observer'
import Binding from './bindings'

export class ComponentBinding extends Binding {
    // Initializes a component binding for the specified view. The raw component
    // element is passed in along with the component type. Attributes and scope
    // inflections are determined based on the components defined attributes.
    constructor(view, el, type) {
      // {
      //   // Hack: trick Babel/TypeScript into allowing this before super.
      //   if (false) { super(); }
      //   let thisFn = (() => { return this; }).toString();
      //   let thisName = thisFn.match(/return (?:_assertThisInitialized\()*(\w+)\)*;/)[1];
      //   //eval(`${thisName} = this;`);
      // }
      //super();
      //this.locals = this.locals.bind(this);
      //this.bind = this.bind.bind(this);
      //this.unbind = this.unbind.bind(this);
      this.view = view;
      this.el = el;
      this.type = type;
      this.component = this.view.components[this.type];
      this.static = {};
      this.observers = {};
      this.upstreamObservers = {};

      const bindingRegExp = view.bindingRegExp();

      for (let attribute of this.el.attributes || []) {
        if (!bindingRegExp.test(attribute.name)) {
          const propertyName = this.camelCase(attribute.name);

          const token = kick.TypeParser.parse(attribute.value);

          if ((this.component.static != null ? this.component.static : []).includes(propertyName)) {
            this.static[propertyName] = attribute.value;
          } else if (token.type === kick.TypeParser.types.primitive) {
            this.static[propertyName] = token.value;
          } else {
            this.observers[propertyName] = attribute.value;
          }
        }
      }
    }

    // Intercepts `Binding::sync` since component bindings are not bound to
    // a particular model to update it's value.
    sync() {}

    // Intercepts `Binding::update` since component bindings are not bound
    // to a particular model to update it's value.
    update() {}

    // Intercepts `Binding::publish` since component bindings are not bound
    // to a particular model to update it's value.
    publish() {}

    // Returns an object map using the component's scope inflections.
    locals() {
      let key, value;
      const result = {};

      for (key in this.static) {
        value = this.static[key];
        result[key] = value;
      }

      for (key in this.observers) {
        const observer = this.observers[key];
        result[key] = observer.value();
      }

      return result;
    }

    // Returns a camel-cased version of the string. Used when translating an
    // element's attribute name into a property name for the component's scope.
    camelCase(string) {
      return string.replace(/-([a-z])/g, grouped => grouped[1].toUpperCase());
    }

    // Intercepts `Binding::bind` to build `@componentView` with a localized
    // map of models from the root view. Bind `@componentView` on subsequent calls.
    bind() {
      let key;
      if (!this.bound) {
        for (key in this.observers) {
          const keypath = this.observers[key];
          this.observers[key] = this.observe(this.view.models, keypath, (key => { return () => {
            return this.componentView.models[key] = this.observers[key].value();
          }; }
          ).call(this, key)
          );
        }

        this.bound = true;
      }

      if (this.componentView != null) {
        this.componentView.bind();
      } else {
        let option;
        this.el.innerHTML = this.component.template.call(this);
        const scope = this.component.initialize.call(this, this.el, this.locals());
        this.el._bound = true;

        const options = {};

        for (option of Rivets.extensions) {
          var k, v;
          options[option] = {};
          if (this.component[option]) { for (k in this.component[option]) { v = this.component[option][k]; options[option][k] = v; } }
          for (k in this.view[option]) { v = this.view[option][k]; if (options[option][k] == null) { options[option][k] = v; } }
        }

        for (option of Rivets.options) {
          options[option] = this.component[option] != null ? this.component[option] : this.view[option];
        }

        this.componentView = new Rivets.View(Array.prototype.slice.call(this.el.childNodes), scope, options);
        this.componentView.bind();

        for (key in this.observers) {
          const observer = this.observers[key];
          this.upstreamObservers[key] = this.observe(this.componentView.models, key, ((key, observer) => () => {
            return observer.setValue(this.componentView.models[key]);
          }
          ).call(this, key, observer)
          );
        }
      }
    }

    // Intercept `Binding::unbind` to be called on `@componentView`.
    unbind() {
      let key, observer;
      for (key in this.upstreamObservers) {
        observer = this.upstreamObservers[key];
        observer.unobserve();
      }

      for (key in this.observers) {
        observer = this.observers[key];
        observer.unobserve();
      }

      return (this.componentView != null ? this.componentView.unbind.call(this) : undefined);
    }
  }