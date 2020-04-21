// sorting e.g. :sort-list="" :sort-item=""
  kick.binders[':sort-list'] = function(el, cfg) {
    var list = cfg.list || cfg;
    $(el).data("kickList", list)
      .sortable($.extend({
        revert: true,
        helper: 'clone',
        stop: function(event, ui) {
          var item = ui.item.data("kickItem");
          if (item) {
            //identify parents
            //var originalParent = ui.item.data("kick-list");
            var originalParent = ui.item.data('sortableItem').element.data("kickList");
            var newParent = ui.item.parent().data("kickList");
            //figure out its new position
            var position = ui.item.parent().children().index(ui.item);
            if (position >= 0) {
              // Cancel is important it helps in keeping the item attached to binder element
              // https://stackoverflow.com/questions/14199681/jquery-ui-sortable-move-clone-but-keep-original
              $(this).sortable('cancel');
              originalParent.splice(originalParent.indexOf(item), 1);
              if(newParent) { newParent.splice(position, 0, item); }
              //ui.item.data("kick-list", newParent);
            }
  
            ui.item.remove();
          }
        },
        connectWith: '.sort-items'
      }, cfg.sortables));
  };

  kick.binders[':sort-item'] = function(el, item) {
    $(el).data("kickItem", item);
  };
