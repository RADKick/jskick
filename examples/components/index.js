class MyComponent extends kick.Component {
  static get tag() { return 'my-component';}
  static get template() {
    return ` <span>{{ message }}</span>, <br/> Bold <b :="message"></b> and <br> VM link is <a :href="link" :="linktext"></a> <br/>`
  }
  static get properties() {
    return {
      message: true,
      link: true,
      linktext: true,
      iconUrl: 'icon'
    }
  }  
}

var vm = {
  link: 'https://google.com',
  linkText: 'Hello There Google!'
}
//customElements.define('my-component', MyComponent);

// you may say '[kick-app] or '#kickApp' or 'body' or ...
kick.bind('', vm, {components: [MyComponent]});
