function getItems() {
    return [{name: 'x', value: 2} ,{name: 'y', value: 1} , {name: 'z', value: 3}]
  }
  var vm = {
    subvm: {
      selVal: 2,
      selChange(){
        vm.items.push({name: 'Selected[' + vm.subvm.selVal + '] - ' + vm.name, value: vm.items.length});
        vm.name = '';
      }
    },
    name:'',
    wid:'100%',
    items: getItems(),
    alert() {
      alert(vm.items[0].name);
    },
    push() {
      vm.items.push({name: 'pushed - ' + vm.name, value: vm.items.length});
      vm.name = '';
    },
    pop() {
      vm.items.pop()
    },
    shift() {
      vm.items.shift()
    },
    unshift() {
      vm.items.unshift({name: 'shifted - ' + vm.name,value: vm.items.length})
    },
    splice() {
      vm.items.splice(1, 1, {name: 'spliced + added - '  + vm.name + ' ' + vm.items.length, value: vm.items.length}, {name: 'spliced + added - ' + vm.items.length, value: vm.items.length})
    },
    reset() {
      vm.items = getItems()
    },
    sort() {
      vm.items.sort(function (a, b) {
        return (a.value || 0) - (b.value || 0)
      })
    },
    btnEditSave(item, name, flag, s1, n1, $vms, $e){
      item.value = item.value + n1;
      //console.log(item);
      return item && item.isEdited ? 'Save' : 'Edit';
    },
    edit(item, $e){
        let myItem = item.$item || item.myItem;
        myItem.isEdited = !myItem.isEdited;
        //vm.isEdited = myItem.isEdited;
    },
    del(item, $e){
      let idx = item.$index;
      vm.items.splice(idx, 1)
    }
  }

  // old example from https://jsfiddle.net/LeedsEbooks/fba88ph9/
function counterViewModel(attributes) {
    this.data = attributes;

    this.increment = function (event, scope) {
        // Rivets renames kebab-case to camelCase
        scope.data.counterAttr.value++;
    };
    this.decrement = function (event, scope) {
        scope.data.counterAttr.value--;
    };
    this.toggleColor = function (event, scope) {
        var old = scope.data.colorAttr.value;

        if (old === 'red') scope.data.colorAttr.value = 'blue';
        else scope.data.colorAttr.value = 'red';
    };
};

kick.components['app-counter'] = {
    template: function() {
        return
          '<button ^="increment">+</button>' +
          '<button ^="decrement">-</button>' +
          '<button ^="toggleColor"> Toggle Color </button>';
    },
    initialize: function(el, attributes) {
        return new counterViewModel(attributes);
    }
};

kick.bind('', vm); // you may say '[kick-app] or '#kickApp' or 'body' or ...
