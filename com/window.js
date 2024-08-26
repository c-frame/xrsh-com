AFRAME.registerComponent('window', {
  schema:{
    title: {type:'string',"default":"title"},
    width: {type:'string'}, // wrap
    height: {type:'string',"default":'260px'},
    uid:    {type:'string'},
    attach: {type:'selector'},
    dom:    {type:'selector'},
    x:      {type:'string',"default":"center"},
    y:      {type:'string',"default":"center"}
  },

  dependencies:{
    dom:         "com/dom.js",
    html:        "https://unpkg.com/aframe-htmlmesh@2.1.0/build/aframe-html.js",  // html to AFRAME
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
      onresize: () => this.el.emit('window.onresize',{}),
      onmaximize: () => this.el.emit('window.onmaximize',{}),
      oncreate: () => {
        this.el.emit('window.oncreate',{})
        // resize after the dom content has been rendered & updated 
        setTimeout( () => {
          winbox.resize( this.el.dom.offsetWidth+'px', this.el.dom.offsetHeight+'px' )
          setTimeout( () => this.el.setAttribute("html",`html:#${this.data.uid}; cursor:#cursor`), 1000)
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
        this.data.dom.parentElement.remove()
        debugger
        this.el.parentElement.remove( this.el )
        return false
      },
    });
    this.data.dom.style.display = '' // show

    this.el.setAttribute("grabbable","")

  }
})
