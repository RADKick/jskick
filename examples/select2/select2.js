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

var vw = kick.bind('', vm);
