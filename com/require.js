AFRAME.registerComponent('require', {
  init: function() { 
  },

})
    //<script src="https://coderofsalvation.github.io/xrsh-apps/helloworld.js"></script> 
const updateComponents = AFRAME.AEntity.prototype.updateComponents
AFRAME.AEntity.prototype.updateComponents = function(updateComponents){
  return function(){
    return updateComponents.apply(this,args)
  }
}(updateComponents)
