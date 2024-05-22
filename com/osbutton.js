AFRAME.registerComponent('osbutton',{

  data:{
    width:    {type: 'number', default: 0.4},
    height:   {type: 'number', default: 0.2},
    depth:    {type: 'number', default: 0.06},
    color:    {type: 'color',  default: 'blue'},
    distance: {type: 'number'},
    label:    {type: 'string'}
  },

  init: function(){
    this
    .createBox()
    .setupDistanceTick()
  },

  setupDistanceTick: function(){
    // we throttle by distance, to support scenes with loads of clickable objects (far away)
    if( !this.data.distance ) this.data.distance = 0.9
    this.distance = -1
    this.worldPosition = new THREE.Vector3()
    this.posCam        = new THREE.Vector3()
    this.tick = this.throttleByDistance( () => this.showSource() )
  },

  createBox: function(){
    let geometry = this.geometry = new THREE.BoxGeometry(this.data.width, this.data.height, this.data.depth);
    this.material = new THREE.MeshStandardMaterial({color: this.data.color });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scaleChildToButton(this.el.object3D, this.mesh) 
    this.el.object3D.add(this.mesh)
    return this
  },

  throttleByDistance: function(f){
      return function(){
         if( this.distance < 0 ) return f() // first call
         if( !f.tid ){
           let x = this.distance
           let y = x*(x*0.05)*1000 // parabolic curve
           f.tid = setTimeout( function(){
             f.tid = null
             f()
           }, y )
         }
      }
  },

  showSource: function(){
    this.el.sceneEl.camera.getWorldPosition(this.posCam)
    this.el.object3D.getWorldPosition(this.worldPosition)
    this.distance    = this.posCam.distanceTo(this.worldPosition)

    if( this.distance < this.data.distance ){
      this.material.side = THREE.BackSide
    }else{
      this.material.side = THREE.FrontSide
    }
  },

  scaleChildToButton: function(scene, mesh ){
    let cleanScene = scene.clone()  
    let remove = []
    const notVisible = (n) => !n.visible || (n.material && !n.material.visible)
    cleanScene.traverse( (n) => notVisible(n) && n.children.length == 0 && (remove.push(n)) )
    remove.map( (n) => n.removeFromParent() )
    let restrictTo3DBoundingBox = mesh.geometry
    if( restrictTo3DBoundingBox ){    
      // normalize instanced objectsize to boundingbox
      let sizeFrom  = new THREE.Vector3() 
      let sizeTo    = new THREE.Vector3() 
      let empty = new THREE.Object3D()
      new THREE.Box3().setFromObject(mesh).getSize(sizeTo)
      new THREE.Box3().setFromObject(cleanScene).getSize(sizeFrom)
      let ratio = sizeFrom.divide(sizeTo)
      scene.children.map( (c) => {
        if( c.uuid != mesh.uuid ){
          c.scale.multiplyScalar( 1.0 / Math.max(ratio.x, ratio.y, ratio.z)) 
        }
      })
    }

  },

})
