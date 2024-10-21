AFRAME.registerComponent('window', {
  schema:{
    title:     {type:'string',"default":"title"},
    width:     {type:'string'}, // wrap
    height:    {type:'string',"default":'260px'},
    uid:       {type:'string'},
    attach:    {type:'selector'},
    dom:       {type:'selector'},
    max:       {type:'boolean',"default":false},
    min:       {type:'boolean',"default":false},
    x:         {type:'string',"default":"center"},
    y:         {type:'string',"default":"center"}
  },

  dependencies:{
    dom:         "com/dom.js",
    winboxjs:    "https://unpkg.com/winbox@0.2.82/dist/winbox.bundle.min.js",     // deadsimple windows: https://nextapps-de.github.io/winbox
    //winboxcss:   "https://unpkg.com/winbox@0.2.82/dist/css/winbox.min.css",       // main theme
  },

  init: function(){
    setTimeout( () => this.setupWindow(), 10 ) // init after other components
  },

  setupWindow: async function(){
    await AFRAME.utils.require(this.dependencies)
    if( !this.el.dom ) return console.error('window element requires dom-component as dependency')

    this.el.dom.style.display = 'none'
    let winbox = this.el.winbox = new WinBox( this.data.title, {
      height:this.data.height,
      width:this.data.width,
      x: this.data.x,
      y: this.data.y,
      id:  this.data.uid || String(Math.random()).substr(4), // important hint for html-mesh
      root: this.data.attach || document.body,
      mount: this.data.dom,
      max: this.data.max,
      min: this.data.min,
      onresize: () => this.el.emit('window.onresize',{}),
      onmaximize: () => this.el.emit('window.onmaximize',{}),
      oncreate: (e) => {
        this.el.emit('window.oncreate',{})
        // resize after the dom content has been rendered & updated 
        setTimeout( () => {
          if( !this.data.max ) winbox.resize( this.el.dom.offsetWidth+'px', this.el.dom.offsetHeight+'px' )
          // hint grabbable's obb-collider to track the window-object
          this.el.components['obb-collider'].data.trackedObject3D = 'components.html.el.object3D.children.0'
          this.el.components['obb-collider'].update()
        },1000)
      },
      onclose: () => {
        let e = {halt:false}
        this.el.emit('window.onclose',e)
        if( e.halt ) return true 
        this.data.dom.style.display = 'none';
        if( this.el.parentNode ) this.el.remove() //parentElement.remove( this.el )
        this.data.dom.parentElement.remove()
        return false
      },
    });
    this.data.dom.style.display = '' // show

    this.el.setAttribute("grabbable","")

    if( this.el.object3D.position.x == 0 && 
        this.el.object3D.position.y == 0 && 
        this.el.object3D.position.z == 0 ){ // position next to previous window
      var els = [...document.querySelectorAll('[window]')]
      if( els.length < 2 ) return
      let current = els[ els.length-1 ]
      let last    = els[ els.length-2 ]
      AFRAME.utils.positionObjectNextToNeighbor( current.object3D , last.object3D, els.length )
    }
  },

  show: function(state){
    this.el.dom.closest('.winbox').style.display = state ? '' : 'none'
  }
})

AFRAME.utils.positionObjectNextToNeighbor = function positionObjectNextToNeighbor(object, lastNeighbor = null, neighbours, margin = 0.45, degree = 20) {
  // *FIXME* this could be more sophisticated :)
  object.position.x = lastNeighbor.position.x + ((neighbours-1) * margin)
  object.position.y = lastNeighbor.position.y 
  object.position.z = lastNeighbor.position.z
  //object.rotation.y += THREE.MathUtils.degToRad( (neighbours-1) * degree);

}
