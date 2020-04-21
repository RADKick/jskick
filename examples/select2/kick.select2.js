// very popular jquery plugin select2 binding with kick
kick.binders[':select2'] = {
    publishes: true,
    priority: 2000,
    bind: function (el) {
        try {
            var me = this,
                opts = me.observer.value(),
                options = (opts instanceof Function ? opts() : opts), 
                valBinding = me.kin('@value'),
                pub = me.publish,
                select2 = $(el)
                    .select2(options)
                    .on("select2:select select2:unselect", function () {
                        if (!valBinding.lock(true)) { return; } //already locked
                        pub.apply(valBinding, arguments);
                        valBinding.lock(false);
                    });
            
            // always set plugin so that you can use inside vm now for calling refresh or whatever
            opts.select2 = select2;

            valBinding.subscribe(function (val) {
                if (!valBinding.lock(true)) { return; } //already locked
                $(el).trigger('change');
                valBinding.lock(false);
            });

        } catch (ex) {
            console.log(ex);
        }
    },
    unbind: function () {
        //this.kin('@').binder.unbind.apply(this, arguments);
        kick.binders['@value'].unbind.apply(this, arguments);
    }
};