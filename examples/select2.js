var vm = {
    s11: '', s2:'',
    tasks: [{
        name: "Get dog food"
    },
    {
        name: "Mow lawn"
    },
    {
        name: "Fix car"
    },
    {
        name: "Fix fence"
    },
    {
        name: "Walk dog"
    },
    {
        name: "Read book"
    }
    ],
    idTasks: [{
        "id": "1",
        "text": "First Last",
        "role": "Architect"
    }, {
        "id": "2",
        "text": "Robert Hollinger",
        "role": "Manager"
    }, {
        "id": "3",
        "text": "Mike Sapp",
        "role": "Developer"
    }, {
        "id": "4",
        "text": "Nina Switz",
        "role": "Business"
    }],
    data: [
        {
            id: 0,
            text: 'enhancement'
        },
        {
            id: 1,
            text: 'bug'
        },
        {
            id: 2,
            text: 'duplicate'
        },
        {
            id: 3,
            text: 'invalid'
        },
        {
            id: 4,
            text: 'wontfix'
        }
    ],
    selectOpts: {
        placeholder: 'Select an option',
        width: '100%',
        //minimumInputLength: 1,
        allowClear: true,

        closeOnSelect : false,
        multiple: true,
        tags: true
    },
    selectOpts2(){ 
        return {
            placeholder: 'Select an option',
            width: '100%',
            //minimumInputLength: 1,
            data: 
            { results: vm.idTasks, text: function(item) { return item.name; } },
            allowClear: true,
        }; 
    },
    selectOpts3(){ 
        return {
            placeholder: 'Select an option',
            width: '100%',
            //minimumInputLength: 1,
            data: vm.data,
            allowClear: true,
        }; 
    },
    chg: function () {
        vm.s11 = 'Fix car'
    },
    addTask: function () {
        var task = {
            name: "new",
            show: true
        };
        vm.selectedTask = task;
        vm.normalPriorityTasks.push(task);
    },
    trash: []
};

function format(item) {
    var originalOption = item.element;
    return '<span class="nr">' + $(originalOption).val() + '</span> - <span class="description">' + $(originalOption).data('foo') + '</span>';
}

kick.binders[':select2'] = {
    publishes: true,
    priority: 2000,
    bind: function (el) {
        try {
            var me = this,
                opts = me.observer.value(),
                valBinding = me.kin('@'),
                pub = me.publish;

            opts = (opts instanceof Function ? opts() : opts);    
            $(el)
                .select2(opts)
                .on("select2:select select2:unselect", function () {
                    if (!valBinding.lock(true)) { return; } //already locked
                    pub.apply(valBinding, arguments);
                    valBinding.lock(false);
                });

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
}

var vw = kick.bind('', vm);
