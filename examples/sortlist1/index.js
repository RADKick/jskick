var vm = {
    highPriorityTasks: [{
        name: "Get dog food"
    },
    {
        name: "Mow lawn"
    },
    {
        name: "Fix car"
    }
    ],
    normalPriorityTasks: [{
        name: "Fix fence"
    },
    {
        name: "Walk dog"
    },
    {
        name: "Read book"
    }
    ],
    setSortables: function (list) {
        return {
            list: list,
            sortables: {
                // helper: function(event, ui) {
                //     return $('<div class="item"></div>')
                // },
                connectWith: '.items'
            }
        };
    },
    selectedTask: null,
    blur: function (item) {
        vm.selectedTask = null;
        item.show = false;
    },
    selectTask: function (task, sel) {
        vm.selectedTask = task;
        task && (task.show = true);
    },
    show: function (item) {
        return item === vm.selectedTask;
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


var vw = kick.bind('', vm);
