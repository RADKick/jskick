window.onload = function () {
    var vm = {
        code: '',
        cmOpts: {
            mode: "javascript",
            theme: "default",
            lineNumbers: true
        },
        chg: function (code) {
            vm.code = code + '\n\\\\ Hello There - ' + (new Date());
        }
    }
    
    var vw = kick.bind('', vm);
};

