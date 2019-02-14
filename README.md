# kick

kick.js is a variation of Rivets.js and tinybind, a lightweight data binding and templating system that facilitates building data-driven views. Inspired by many libraries like angular, react, angular-lite and vuejs. It is agnostic about every aspect of a front-end MV(C|VM|P) stack, making it easy to introduce it into your current workflow or to use it as part of your own custom front-end stack comprised of other libraries.

If you like short syntax, and symbols for binding html then you will love it.

See kick in action with the short syntax at https://stackblitz.com/edit/kick-js1

Simple drag drop https://jsfiddle.net/riteshpahwa/ecn1fq6j/

Not so simple drag drop http://jsfiddle.net/riteshpahwa/qym37hbf/119/

## CAUTION: 

Not ready for prod. Need help with few more things, like expression binding, testing, etc.


## Install

```bash
npm install @radkick/kick
```

Use in a script tag...

```html
<script src="node_modules/@radkick/kick/dist/kick.min.js"></script>
```

... or import using a bundler like webpack

```javascript
import kick from '@radkick/kick'
```


## Usage

```html
<section id="auction">
  <h3>{{ auction.product.name }}</h3>
  <p>Current bid: {{ auction.currentBid | money }}</p>

  <aside ?="auction.timeLeft | lt 120">
    Hurry up! There is {{ auction.timeLeft | time }} left.
  </aside>
</section>
```

```javascript
kick.bind($('#auction'), {auction: auction})
```

## Getting Started and Documentation

Documentation will be (is) available on the [homepage](http://radkick.github.io/kickjs/). Learn by reading the [Guide](http://radkick.github.io/kickjs/docs/guide/) and refer to the [Binder Reference](http://radkick.github.io/kickjs/docs/reference/) to see what binders are available to you out-of-the-box.

## Differences from Rivets.js / tinybind.js

* Public interface
  * Remove component feature -> incomplete, untested code. Use web components libraries like SkateJs or LitElement
  * Add not/negate formatter
  * Remove unless and unchecked binders in favor of combining not/negate formatters with if/checked binders
  * Remove computed feature - can be replaced by an identity formatter
  * Add ability to customize input event through event-name attribute
* Internal changes
  * Written in ES6 instead of coffeescript
  * Change how scope of iteration binder works. Instead of copying properties down to children, uses a prototype like approach
    * Related: [486](https://github.com/mikeric/rivets/issues/486) [512](https://github.com/mikeric/rivets/issues/512) [417](https://github.com/mikeric/rivets/pull/417)
    * More info in the [documentation](https://radkick.github.io/kick/docs/reference/#each-[item])
  * Change name of rv-each index property from index to $index
  * Change how to customize index name in each binder (using an attribute)
    * Related: [551](https://github.com/mikeric/rivets/issues/551) [552](https://github.com/mikeric/rivets/pull/552)
  * Do not bind publish, bind and unbind methods to binding instances
  * Register default binder through fallbackBinder option instead of * binder
  * Integrate sightglass into kick code base
  * Remove view.select method
  * Rename binding property args to arg and changed type from array to string
  * All binders like :?^ (as it used to be rv-*) attributes are removed after binding
  * Changes how observer is registered / notified. Instead of passing a function (sync), pass an object with a sync method


## Building and Testing

First install any development dependencies.

```
$ npm install
```

#### Building

kick.js uses rollup as it's bundling / build tool. Run the following to compile the source into `dist/`.

```
$ npm run build
```

#### Testing

kick.js uses [mocha](http://visionmedia.github.io/mocha/) as it's testing framework, alongside [should](https://github.com/visionmedia/should.js/) for expectations and [sinon](http://sinonjs.org/) for spies, stubs and mocks. Run the following to run the full test suite.

```
$ npm test
```

#### Building documentation

The documentation is built with [harp](http://harpjs.com/) which must be installed globally

```
$ cd docs
$ harp compile _harp ./
```


## Contributing

#### Bug Reporting

1. Ensure the bug can be reproduced on the latest master.
2. Open an issue on GitHub and include an isolated [JSFiddle](http://jsfiddle.net/) or [Stackblitz](https://stackblitz.com) demonstration of the bug. The more information you provide, the easier it will be to validate and fix.

#### Pull Requests

1. Fork the repository and create a topic branch.
3. Make sure not to commit any changes under `dist/` as they will surely cause conflicts for others later. Files under `dist/` are only committed when a new build is released.
4. Include tests that cover any changes or additions that you've made.
5. Push your topic branch to your fork and submit a pull request. Include details about the changes as well as a reference to related issue(s).
