// this makes WebXR hand controls able to click things (by touching it)

AFRAME.registerComponent('pressable', {
    schema: {
      pressDistance: { default: 0.005 },
      pressDuration: { default: 300 },
      immersiveOnly: { default: true } 
    },
    init: function() {
        this.worldPosition = new THREE.Vector3();
        this.raycaster = new THREE.Raycaster()
        this.handEls = document.querySelectorAll('[hand-tracking-controls]');
        this.pressed = false;
        this.distance = -1
        // we throttle by distance, to support scenes with loads of clickable objects (far away)
        this.tick = this.throttleByDistance( () => this.detectPress() )
        this.el.addEventListener("raycaster-intersected", (e) => {
          if( !this.data || (this.data.immersiveOnly && !this.el.sceneEl.renderer.xr.isPresenting) ) return
          this.el.emit('click', e.detail ) 
        })

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
    detectPress: function(){
        if( this.handEls.length == 0 ){
            this.handEls = document.querySelectorAll('[hand-tracking-controls]');
        }
        var handEls = this.handEls;
        var handEl;
        let minDistance = 5

        // compensate for an object inside a group 
        let object3D = this.el.object3D.type == "Group" ? this.el.object3D.children[0] : this.el.object3D
        if( !object3D ) return

        for (var i = 0; i < handEls.length; i++) {
            handEl = handEls[i];
            let indexTip  = handEl.object3D.getObjectByName('index-finger-tip')
            if( ! indexTip ) return // nothing to do here 

            this.raycaster.far = this.data.pressDistance

            // Create a direction vector to negative Z
            const direction = new THREE.Vector3(0,0,-1.0);
            direction.normalize()
            this.raycaster.set(indexTip.position, direction)
            intersects = this.raycaster.intersectObjects([object3D],true)

            object3D.getWorldPosition(this.worldPosition)
      
            distance    = indexTip.position.distanceTo(this.worldPosition)
            minDistance = distance < minDistance ? distance : minDistance 

            if (intersects.length ){
              this.i = this.i || 0;
              if( !this.pressed ){
                this.el.emit('pressedstarted', intersects);
                this.el.emit('click', intersects);
                this.pressed = setTimeout( () => {
                  this.el.emit('pressedended', intersects);
                  this.pressed = null 
                }, this.data.pressDuration )
              }
            }
        }
        this.distance = minDistance
    },

});
