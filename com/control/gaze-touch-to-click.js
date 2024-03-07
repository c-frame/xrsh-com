// gaze + fuse-to-click on mobile VR
// gaze + tap-to-click on mobile AR
// also adds 'eye'-tracking (mouseover) functionality to display popovers

AFRAME.registerComponent('gaze-touch-to-click',{
  schema:{
    spawn:{type:'boolean',default:false}, 
  },
  events:{
    "fusing": function(e){
      if( e.detail.mouseEvent ) return // ignore click event
      console.dir(e)

    }
  },
  setGazer: function(state, fuse){
    if( !AFRAME.utils.device.isMobile() ) return
    let cam = document.querySelector("[camera]") 
    if( state ){
      if( cam.innerHTML.match(/cursor/) ) return; // avoid duplicate calls
      cam.innerHTML = `<a-entity id="cursor" cursor="fuse: ${fuse ? 'true': 'false'}; fuseTimeout: 1500"
        animation__click="property: scale; startEvents: click; easing: easeInCubic; dur: 150; from: 0.1 0.1 0.1; to: 1 1 1"
        animation__fusing="property: scale; startEvents: fusing; easing: easeInCubic; dur: 1500; from: 1 1 1; to: 0.1 0.1 0.1"
        animation__mouseleave="property: scale; startEvents: mouseleave; easing: easeInCubic; dur: 500; to: 1 1 1"
        raycaster="objects: .ray"
        visible="true"
        position="0 0 -1"
        material="color: #BBBBBB; shader: flat">
      </a-entity>`
      cam.querySelector('#cursor').setAttribute("geometry","primitive: ring; radiusInner: 0.02; radiusOuter: 0.03")
    }else{
      cam.querySelector('#cursor').removeAttribute("geometry")
      if( document.querySelector('[cursor]') ) {
        document.querySelector('[cursor]').setAttribute("visible",false)
      }
    }
  }, 
  init:function(data){
    this.setGazer(true);

    document.querySelector("a-scene").addEventListener('exit-vr',  () => this.setGazer(false,false) )
    document.querySelector("a-scene").addEventListener('enter-vr', () => this.setGazer(true,true) )
    document.querySelector("a-scene").addEventListener('enter-ar', () => this.setGazer(true,false) )
    document.querySelector("a-scene").addEventListener('exit-ar',  () => this.setGazer(false,false) )

  }
});
