/** 
 * ## [launcher](com/launcher.js)
 *
 * displays app (icons) in 2D and 3D handmenu (enduser can launch desktop-like 'apps')
 *
 * ```html
 * <a-entity launcher>
 *   <a-entity launch="component: helloworld; foo: bar"><a-entity>
 * </a-entity>
 *  
 * ```
 *
 * | property     | type               | example                                                                                |
 * |--------------|--------------------|----------------------------------------------------------------------------------------|
 * | `attach`     | `selector`         | hand or object to attach menu to                                                       |
 * | `registries` | `array` of strings | `<a-entity launcher="registers: https://foo.com/index.json, ./index.json"/>`           |
 *
 * | event        | target | info                                                                                               |
 * |--------------|-------------------------------------------------------------------------------------------------------------|
 * | `launcher`   | an app | when pressing an app icon, `launcher` event will be send to the respective app                     |
 *
 * There a multiple ways of letting the launcher know that an app can be launched:
 *
 * 1. any AFRAME component with an `launcher`-event + manifest is automatically added:
*  
*  ```javascript
*  AFRAME.registerComponent('foo',{
*    events:{
*      launcher: function(){ ...launch something... }
*    },
*    manifest:{ // HTML5 manifesto JSON object
*      // https://www.w3.org/TR/appmanifest/ 
*    }
*  }
*  ```
*
* 2. dynamically in javascript   
*
* ```javascript
* window.launcher.register({
*   name:"foo",
*   icon: "https://.../optional_icon.png" 
*   description: "lorem ipsum",
*   cb: () => alert("foo")
* })
* //window.launcher.unregister('foo')
* ```
* 
*/

AFRAME.registerComponent('launch', { // use this component to auto-launch component
  init: function(){ 
    this.el.sceneEl.addEventListener('loaded', () => {
      setTimeout( () => this.el.emit('launcher',{}), 1000 )
    })
  }
})

AFRAME.registerComponent('launcher', {
  schema: {
    colors: { type:"array", "default": [
      '#4C73FE',
      '#554CFE',
      '#864CFE',
      '#B44CFE',
      '#E24CFE',
      '#FE4CD3',
      '#333333',
    ]},
    paused: { type:"boolean","default":false},
  },

  requires:{
    dom:         "com/dom.js",
    htmlinxr:    "com/html-as-texture-in-xr.js",
    data2events: "com/data2event.js"
  },

  init: async function () {
    this.el.object3D.visible = false;
    await AFRAME.utils.require(this.requires)
    this.worldPosition = new THREE.Vector3()

    this.el.setAttribute("dom","")
    this.el.setAttribute("pressable","")
    this.el.sceneEl.addEventListener('enter-vr', () => this.centerMenu() )
    this.el.sceneEl.addEventListener('enter-ar', () => this.centerMenu() )
    this.render()
  },

  dom: {
    scale:   0.8,
    events:  ['click'],
    html:    (me) => `<div class="iconmenu">loading components..</div>`,
    css:     (me) => `
              .iconmenu {
                z-index: 1000;
                display: flex;
                flex-direction: row;
                align-items: flex-start;
                height: 50px;
                overflow:hidden;
                position: fixed;
                bottom: 10px;
                left:20px;
                background: transparent;
                padding-bottom: 54px;
                box-sizing: border-box;
                pointer-events: none;
                visibility: visible !important;
              }
              .iconmenu > button {
                line-height:0px;
                pointer-events:all;
                width: 58px;
                height: 34px;
                padding: 12px 0px 12px 0px;
                border-radius: 0px;
                color: var(--xrsh-primary);
                background: #FFF;
                border-top: 2px solid #BBB;
                border-bottom: 2px solid #BBB;
                font-size:18px;
                color: #777;
                line-height: 7px;
              }

              .iconmenu > button:first-child {
                border-radius: 5px 0px 0px 5px;
                border-bottom: 2px solid #BBB;
                border-left: 2px solid #BBB;
                padding-bottom:16px;
              }

              .iconmenu > button:last-child {
                border-radius:0px 5px 5px 0px;
                border-top: 2px solid #BBB;
                border-right: 2px solid #BBB;
                padding-top:13px;
              }

              .iconmenu > button:only-child{
                border-radius:5px 5px 5px 5px;
              }

              .iconmenu > button > img {
                transform: translate(0px,-14px);
                opacity:0.5;
                padding: 5px;
                border-radius: 0px;
              }
              .iconmenu > button > img:hover{
                background: #AAA;
                transition:0.gg3s;
                border-radius: 50%;
              }`
  },

  events:{

    click: function(e){ },

    DOMready: function(){
      this.el.setAttribute("html-as-texture-in-xr", `domid: #${this.el.dom.id}; faceuser: false`)
    }
  },

  preventAccidentalButtonPresses: function(){
    this.data.paused = true
    setTimeout( () => this.data.paused = false, 500 ) // prevent menubutton press collide with animated buttons
  },

  render: async function(els){
    if( !this.el.dom ) return // too early (dom.js component not ready)

    let colors   = this.data.colors 
    const add2D = (launchCom,manifest) => {
      let btn    = document.createElement('button')
      let iconDefault = "data:image/svg+xml;base64,PHN2ZwogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKPgogIDxwYXRoCiAgICBmaWxsLXJ1bGU9ImV2ZW5vZGQiCiAgICBjbGlwLXJ1bGU9ImV2ZW5vZGQiCiAgICBkPSJNMjAuMTcwMiAzTDIwLjE2NjMgMy4wMDQ1M0MyMS43NDU4IDMuMDkwODQgMjMgNC4zOTg5NiAyMyA2VjE4QzIzIDE5LjY1NjkgMjEuNjU2OSAyMSAyMCAyMUg0QzIuMzQzMTUgMjEgMSAxOS42NTY5IDEgMThWNkMxIDQuMzQzMTUgMi4zNDMxNSAzIDQgM0gyMC4xNzAyWk0xMC40NzY0IDVIMTYuNDc2NEwxMy4wODkgOUg3LjA4ODk5TDEwLjQ3NjQgNVpNNS4wODg5OSA5TDguNDc2NDQgNUg0QzMuNDQ3NzIgNSAzIDUuNDQ3NzIgMyA2VjlINS4wODg5OVpNMyAxMVYxOEMzIDE4LjU1MjMgMy40NDc3MiAxOSA0IDE5SDIwQzIwLjU1MjMgMTkgMjEgMTguNTUyMyAyMSAxOFYxMUgzWk0yMSA5VjZDMjEgNS40NDc3MSAyMC41NTIzIDUgMjAgNUgxOC40NzY0TDE1LjA4OSA5SDIxWiIKICAgIGZpbGw9ImN1cnJlbnRDb2xvciIKICAvPgo8L3N2Zz4="
      let html    = manifest?.icons?.length > 0 || !manifest.name ? `<img src='${manifest.icons[0].src || iconDefault}' title='${manifest.name}: ${manifest.description}'/>` : ""
      if( manifest.name && !html ) html = `${manifest.short_name || manifest.name}`
      btn.innerHTML = html 

      btn.addEventListener('click', (e) => {
        launchCom.launcher()
        e.stopPropagation()
        // visual feedback to user
        btn.style.filter = "brightness(0.5)"
        this.el.components.html.rerender()
        setTimeout(  () => {
          btn.style.filter = "brightness(1)"
          this.el.components.html.rerender()
        }, 500 )
        return false
      })
      this.el.dom.appendChild(btn)
    }

    // finally render them!
    this.el.dom.innerHTML = '' // clear
    els = els || this.system.launchables
    els.map( (c) => {
      const manifest           = c.manifest
      if( manifest ){
        add2D(c,manifest)
      }
    })

    this.centerMenu();

  },

  centerMenu: function(){
    // center along x-axis
    this.el.object3D.traverse( (o) => {
      if( o.constructor && String(o.constructor).match(/HTMLMesh/) ){
        this.setOriginToMiddle(o, this.el.object3D, {x:true})
        o.position.z = 0.012 // position a bit before the grab-line
        o.position.y = -0.01 // position a bit before the grab-line
      }
    })
    this.el.object3D.visible = true // ensure visibility
  },

  setOriginToMiddle: function(fromObject, toObject, axis) {
    var boxFrom = new THREE.Box3().setFromObject(fromObject);
    var boxTo   = new THREE.Box3().setFromObject(toObject);
    var center = new THREE.Vector3();
    if( !toObject.positionOriginal ) toObject.positionOriginal = toObject.position.clone()
    center.x = axis.x ? - (boxFrom.max.x/2) : 0
    center.y = axis.y ? - (boxFrom.max.y/2) : 0
    center.z = axis.z ? - (boxFrom.max.z/2) : 0
    toObject.position.copy( toObject.positionOriginal )
    toObject.position.sub(center);
  },


  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "launcher",
    "name": "App Launcher",
    "icons": [
      {
        "src": "https://css.gg/browser.svg",
        "type": "image/svg+xml",
        "sizes": "512x512"
      }
    ],
    "category":"system",
    "id": "/?source=pwa",
    "start_url": "/?source=pwa",
    "background_color": "#3367D6",
    "display": "standalone",
    "scope": "/",
    "theme_color": "#3367D6",
    "shortcuts": [
      {
        "name": "What is the latest news?",
        "cli":{
          "usage":  "helloworld <type> [options]",
          "example": "helloworld news",
          "args":{
            "--latest": {type:"string"}
          }
        },
        "short_name": "Today",
        "description": "View weather information for today",
        "url": "/today?source=pwa",
        "icons": [{ "src": "/images/today.png", "sizes": "192x192" }]
      }
    ],
    "description": "Hello world information",
    "screenshots": [
      {
        "src": "/images/screenshot1.png",
        "type": "image/png",
        "sizes": "540x720",
        "form_factor": "narrow"
      }
    ],
    "help":`
Helloworld application

This is a help file which describes the application.
It will be rendered thru troika text, and will contain
headers based on non-punctualized lines separated by linebreaks,
in above's case "\nHelloworld application\n" will qualify as header.
    `
  }

});


AFRAME.registerSystem('launcher',{

  init: function(){
    this.launchables = []
    this.dom         = []
    this.registered  = []
    // observe HTML changes in <a-scene>
    observer = new MutationObserver( (a,b) => this.getLaunchables(a,b) )
    observer.observe( this.sceneEl, {characterData: false, childList: true, attributes: false});

    window.launcher = this
    this.getLaunchables()
  },

  register: function(launchable){
    try{
      let {name, description, cb} = launchable
      this.registered.push({ 
        manifest: {name, description, icons: launchable.icon ? [{src:launchable.icon}] : [] },
        launcher: cb 
      })
    }catch(e){
      console.error('AFRAME.systems.launcher.register({ name, description, icon, cb }) got invalid obj')
      console.error(e)
    }

    this.getLaunchables()
  },

  unregister: function(launchableName){
    this.registered = this.registered.filter( (l) => l.name != launchableName )
  },

  getLaunchables: function(mutationsList,observer){
    let searchEvent = 'launcher'
    let els         = [...this.sceneEl.getElementsByTagName("*")]
    let seen        = {}
    this.launchables = [
      /* 
       * {
       *   manifest: {...}
       *   launcher: () => ....
       * }
       */ 
    ];

    // collect manually registered launchables
    this.registered.map( (launchable) => this.launchables.push(launchable) )

    // collect launchables in aframe dom elements
    this.dom = els.filter( (el) => {
      let hasEvent = false
      if( el.components ){
        for( let i in el.components ){
          if( el.components[i].events && el.components[i].events[searchEvent] && !seen[i] ){
            let com = hasEvent = seen[i] = el.components[i]
            com.launcher = () => com.el.emit('launcher',null,false) // important: no bubble
            this.launchables.push(com)
          }
        } 
      }
      return hasEvent ? el : null 
    })
    this.updateLauncher()
    return this.launchables
  },

  updateLauncher: function(){
    let launcher = document.querySelector('[launcher]')
    if( launcher && launcher.components.launcher) launcher.components.launcher.render()
  }

})
