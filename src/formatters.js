const formatters = {
    watch: function(value) {
      return value;
    },
  
    not: function(value) {
      return !value;
    },
  
    negate: function(value) {
      return !value;
    }
  }
  
export default formatters