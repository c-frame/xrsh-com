AFRAME.registerComponent('boot', {
  init: function ( ) { 

    let scene  = document.querySelector('a-scene').object3D

    // webxros events are optional, but can be listed here 
    scene.addEventListener('tty', (tty) => {
      tty.write("hello terminal from XR")
      tty.on('stdout', (data) => {
        // react to data being spoken/typed into the terminal
        // (spatial prompting like 'open foo.gltf', 'component helloworld' e.g.)
      })
    })

    console.log("this is the boot component which initializes other components")

  },

});
