var vm = {
    allowDrop($e) {
      $e.preventDefault();
    },
    drag($e) {
      $e.dataTransfer.setData("text", $e.target.id);
    },
    drop($e) {
      $e.preventDefault();
      var data = $e.dataTransfer.getData("text");
      $e.target.appendChild(document.getElementById(data));
      //var el = document.querySelector();
      //$e.target.appendChild(el);
    }
  }


  // you may say '[kick-app] or '#kickApp' or 'body' or ...
  kick.bind('', vm);
