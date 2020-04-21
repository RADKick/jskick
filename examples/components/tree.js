class MyTreeItem extends kick.Component {
  static get tag() { return 'my-tree-item';}
  static get template() {
    return `
    <div class="list-group list-group-tree well">
      <a href="#" ^="vmOpen($event, vmTitle)" class="list-group-item" data-toggle="collapse">
        <i class="fa fa-chevron"></i>
        {{vmTitle}} (Items: {{vmItems.length}}) outer link = {{link}}
        <span class="badge badge-info" :="vmBadge"></span>
      </a>
       <my-tree-item *item="vmItems" :title="item.title" :badge="item.badge" :link="link" :items="item.items" ^call1="call1" ></my-tree-item>
    </div>
      `
    }
  static get properties() {
    return {
      title: 'vmTitle',
      badge: 'vmBadge',
      items: 'vmItems',
      link: 'link',
      call1: 'call1'
    }
  }
  
  vmTitle = 'Hello';
  vmBadge = 10;
  vmItems = [];
  call1 = (e,t)=>{ this.vmTitle = 'Call1'};
  
  onInit(){
    this.vmTitle = this.vmTitle + ' Init'    
  }
  afterInit(){
    this.vmTitle = this.vmTitle + ' AfterInit'
  }

  vmOpen(ev, txt){
    this.link = 'Link here '
    this.vmTitle = txt + '+'
    this.call1(ev, txt)
    //alert('Hi from inside class I said hello to ' + this.vmTitle + ' Items Len: ' + this.vmItems.length)
  }

}
// class MyComponent extends kick.Component {
//   static get tag() { return 'my-tree';}
//   static get template() {
//     return `
//     <div *item="items" class="list-group list-group-tree well">
//       <a href="javascript:void(0);" class="list-group-item" data-toggle="collapse">
//         <i class="fa fa-chevron"></i>
//         <span class="badge">1</span>
//         {{item.title}}
//       </a>
//       <div class="list-group collapse"></div>
//     </div>
//     `
//   }
//   static get properties() {
//     return {
//       items: true,
//       link: true,
//       iconUrl: 'icon'
//     }
//   }  
// }

var vm = {
  items:[
    {title:'Item 1', badge:1,
      items: [
        {title:'Item 1.1', badge:1},
        {title:'Item 1.2', badge: 12},    
        {title:'Item 1.3', badge: 12,
          items: [
            {title:'Item 1.3.1', badge:1},
            {title:'Item 1.3.2', badge: 12},    
            {title:'Item 1.3.3', badge: 12,
            },    
          ]
        },    
      ]
    },
    {title:'Item 2', badge: 10},
    {
      title:'Item 3', badge: 20,
      items: [
        {title:'Item 3.1', badge:1},
        {title:'Item 3.2', badge: 10},    
      ]
    },
  ],
  link: 'Link Text!'
}

vm.msg = (ev, aTitle)=>{
  //alert(ev)
  //alert(aTitle + ' ' + vm.items.length)
  vm.link = aTitle + '!'
}

// you may say '[kick-app] or '#kickApp' or 'body' or ...
kick.bind('', vm, {components: [MyTreeItem]});
