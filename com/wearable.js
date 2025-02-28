AFRAME.registerComponent('wearable', {
  schema:{
    el: {type:"selector"},
    controlPos: {type:"vec3"}, 
    controlRot: {type:"vec3"},
    handPos: {type:"vec3"}, 
    handRot: {type:"vec3"} 
  }, 
  init: function(){
    this.remember()

    if( !this.data.el ) return console.warn(`wear.js: cannot find ${this.data.el}`)
    this.data.el.object3D.name = 'wearable'

    // hand vs controller multi attach-heuristics (intended to survived AFRAME updates)
    this.data.el.addEventListener('controllermodelready',  this.attachWhatEverController.bind(this) ) // downside: no model yet
    this.data.el.addEventListener('model-loaded',          this.attachWhatEverController.bind(this) ) // downside: only called once [model not added yet]
    this.el.sceneEl.addEventListener('controllersupdated', this.attachWhatEverController.bind(this) ) // downside: only called when switching [no model yet]
  },

  attachWhatEverController: function(e){
    setTimeout( () => { // needed because the events are called before the model was added via add())
      let wrist = false 
      let hand  =  this.data.el.components['hand-tracking-controls']
      if( hand && hand.controllerPresent ) wrist = hand.wristObject3D
      this.attach( wrist || this.data.el.object3D)
      this.update( wrist ? 'hand' : 'control')
    },100)
  },

  attach: function(target){
    if( this.target && target.uuid == this.target.uuid ) return// already attached 
    target.add(this.el.object3D )
    this.target = target
  },

  detach: function(){
    this.parent.add(this.el.object3D) 
    this.el.object3D.position.copy( this.position )
    this.el.object3D.rotation.copy( this.rotation )
  },

  remember: function(){
    this.position = this.el.object3D.position.clone()
    this.rotation = this.el.object3D.rotation.clone()
    this.parent   = this.el.object3D.parent
  },

  update: function(type){
    let position = type == 'hand' ? this.data.handPos : this.data.controlPos
    let rotation = type == 'hand' ? this.data.handRot : this.data.controlRot
    this.el.object3D.position.copy( position )
    this.el.object3D.rotation.set( rotation.x, rotation.y, rotation.z )
  }

})
