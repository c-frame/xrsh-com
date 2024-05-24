/*
 * ## launcher
 *
 * displays app (icons) for enduser to launch
 *
 * ```javascript
 *  <a-entity app="app/launcher.js"/>
 * ```
 *
 * | property     | type               | example                                                                                |
 * |--------------|--------------------|----------------------------------------------------------------------------------------|
 * | `registries` | `array` of strings | <a-entity app="app/launcher.js; registers: https://foo.com/index.json, ./index.json"/> |
 *
 * | event        | target | info                                                                                               |
 * |--------------|-------------------------------------------------------------------------------------------------------------|
 * | `launcher`   | an app | when pressing an app icon, `launcher` event will be send to the respective app                     |
 */

AFRAME.registerComponent('launcher', {
  schema: {
    attach: { type:"selector"},
    padding: { type:"number","default":0.15},
    fingerTip: {type:"selector"},
    fingerDistance: {type:"number", "default":0.25},
    rescale: {type:"number","default":0.4},
    open: { type:"boolean", "default":true},
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
    cols:   { type:"number", "default": 5 }
  },

  dependencies:['dom'],

  init: async function () {
    this.worldPosition = new THREE.Vector3()

    await AFRAME.utils.require({
      html:        "https://unpkg.com/aframe-htmlmesh@2.1.0/build/aframe-html.js",  // html to AFRAME
      dom:         "./com/dom.js",
      data_events: "./com/data2event.js"
    })

    this.el.setAttribute("dom","")
    this.render()

    if( this.data.attach ){
      this.el.object3D.visible = false
      if( this.isHand(this.data.attach) ){
        this.data.attach.addEventListener('model-loaded', () => this.attachMenu() )
        // add button
        this.menubutton = this.createMenuButton()
        this.menubutton.object3D.visible = false
        this.data.attach.appendChild( this.menubutton )
      }else this.data.attach.appendChild(this.el)
    }

  },

  isHand: (el) => {
    return el.getAttributeNames().filter( (n) => n.match(/^hand-tracking/) ? n : null ).length ? true : false
  },

  dom: {
    scale:   3,
    events:  ['click'],
    html:    (me) => `<div id="iconmenu">loading components..</div>`,
    css:     (me) => `#iconmenu {
                z-index: 1000;
                display: flex;
                flex-direction: row;
                align-items: flex-start;
                height: 50px;
                overflow:hidden;
                position: fixed;
                right: 162px;
                bottom: 0px;
                left:20px;
                background: transparent;
                padding-bottom: 54px;
                box-sizing: border-box;
                pointer-events: none;
                visibility: visible !important;
              }
              #iconmenu > button {
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
              }

              #iconmenu > button:first-child {
                border-radius: 5px 0px 0px 5px;
                border-bottom: 2px solid #BBB;
                border-left: 2px solid #BBB;
                padding-bottom:16px;
              }

              #iconmenu > button:last-child {
                border-radius:0px 5px 5px 0px;
                border-top: 2px solid #BBB;
                border-right: 2px solid #BBB;
                padding-top:13px;
              }

              #iconmenu > button > img {
                transform: translate(0px,-14px);
                opacity:0.5;
                padding: 5px;
                border-radius: 0px;
              }
              #iconmenu > button > img:hover{
                background: #AAA;
                transition:0.gg3s;
                border-radius: 50%;
              }`
  },

  events:{
    open: function(){
      this.preventAccidentalButtonPresses()
      if( this.data.open ){
        this.el.setAttribute("animation",`dur: 200; property: scale; from: 0 0 1; to: ${this.data.rescale} ${this.data.rescale} ${this.data.rescale}`)
        this.menubutton.object3D.visible = false
      }else{
        this.el.setAttribute("animation",`dur: 200; property: scale; from: ${this.data.rescale} ${this.data.rescale} ${this.data.rescale}; to: 0 0 1`)
        this.menubutton.object3D.visible = true
      }
    }
  },

  preventAccidentalButtonPresses: function(){
    this.data.paused = true
    setTimeout( () => this.data.paused = false, 500 ) // prevent menubutton press collide with animated buttons
  },

  createMenuButton: function(colo){
    let aentity = document.createElement('a-entity')
    aentity.setAttribute("mixin","menubutton")
    aentity.addEventListener('obbcollisionstarted', this.onpress )
    aentity.addEventListener('obbcollisionended', this.onreleased )
    return aentity
  },

  render: async function(){
    if( !this.el.dom ) return // too early (dom.js component not ready)

    let items    = [...this.el.children]
    let requires = [] 
    let i        = 0 
    let j        = 0
    let colors   = this.data.colors 
    const add2D = (launchCom,el,manifest) => {
      let btn    = document.createElement('button')
      btn.innerHTML = `${ manifest?.icons?.length > 0  
                             ? `<img src='${manifest.icons[0].src}' title='${manifest.name}: ${manifest.description}'/>` 
                             : `${manifest.short_name}`
                      }`
      btn.addEventListener('click', () => el.emit('launcher',{}) )
      this.el.dom.appendChild(btn)
    }

    const add3D = (launchCom,el,manifest) => {
      let aentity = document.createElement('a-entity')
      let atext   = document.createElement('a-entity')
      let padding = this.data.padding
      if( (i % this.data.cols) == 0 ) j++
      aentity.setAttribute("mixin","menuitem")
      aentity.setAttribute("position",`${padding+(i++ % this.data.cols) * padding} ${j*padding} 0`)
      if( !aentity.getAttribute("material")){
        aentity.setAttribute('material',`side: double; color: ${colors[ i % colors.length]}`)
      }
      aentity.addEventListener('obbcollisionstarted', this.onpress )
      aentity.addEventListener('obbcollisionended', this.onreleased )
      atext.setAttribute("text",`value: ${manifest.short_name}; align: baseline; anchor: align; align:center; wrapCount:7`)
      atext.setAttribute("scale","0.1 0.1 0.1")
      aentity.appendChild(atext)
      this.el.appendChild(aentity)
      aentity.launchCom = launchCom
      return aentity
    }

    // finally render them!
    this.el.dom.innerHTML = '' // clear
    this.system.components.map( (c) => {
      const launchComponentKey = c.getAttributeNames().shift()
      const launchCom          = c.components[ launchComponentKey ]
      if( !launchCom ) return console.warn(`could not find component '${launchComponentKey}' (forgot to include script-tag?)`)
      const manifest           = launchCom.manifest
      if( manifest ){
        add2D(launchCom,c,manifest)
        add3D(launchCom,c,manifest)
      }
    })

  },

  onpress: function(e){
    const launcher = document.querySelector('[launcher]').components.launcher
    if( launcher.data.paused                           ) return // prevent accidental pressed due to animation
    if( e.detail.withEl.computedMixinStr == 'menuitem' ) return // dont react to menuitems touching eachother

    // if user press menu button toggle menu
    if( launcher && e.srcElement.computedMixinStr == 'menubutton' ){
      return launcher.data.open = !launcher.data.open
    }
    if( launcher && !launcher.data.open ) return // dont process menuitems when menu is closed
    let el = e.srcElement
    if(!el) return
    el.object3D.traverse( (o) => {
      if( o.material && o.material.color ){
        if( !o.material.colorOriginal ) o.material.colorOriginal = o.material.color.clone() 
        o.material.color.r *= 0.3
        o.material.color.g *= 0.3
        o.material.color.b *= 0.3
      }
    })
    if( el.launchCom ){
      console.log("launcher.js: launching "+el.launchCom.el.getAttributeNames().shift())
      launcher.preventAccidentalButtonPresses()
      el.launchCom.el.emit('launcher') // launch component!
    }
  },

  onreleased: function(e){
    if( e.detail.withEl.computedMixinStr == 'menuitem' ) return // dont react to menuitems touching eachother
    let el = e.srcElement
    el.object3D.traverse( (o) => {
      if( o.material && o.material.color ){
        if( o.material.colorOriginal ) o.material.color = o.material.colorOriginal.clone() 
      }
    })
  },

  attachMenu: function(){
    if( this.el.parentNode != this.data.attach ){
      this.el.object3D.visible = true
      let armature = this.data.attach.object3D.getObjectByName('Armature') 
      if( !armature ) return console.warn('cannot find armature')
      this.data.attach.object3D.children[0].add(this.el.object3D)
      this.el.object3D.scale.x = this.data.rescale
      this.el.object3D.scale.y = this.data.rescale
      this.el.object3D.scale.z = this.data.rescale

      // add obb-collider to index finger-tip
      let aentity = document.createElement('a-entity')
      trackedObject3DVariable = 'parentNode.components.hand-tracking-controls.bones.9';
      this.data.fingerTip.appendChild(aentity)
      aentity.setAttribute('obb-collider', {trackedObject3D: trackedObject3DVariable, size: 0.015});

      if( this.isHand(this.data.attach) ){
        // shortly show and hide menu into palm (hint user)
        setTimeout( () => { this.data.open = false }, 1500 )
      }
    }
  },

  tick: function(){
    if( this.data.open ){
      let indexTipPosition = document.querySelector('#right-hand[hand-tracking-controls]').components['hand-tracking-controls'].indexTipPosition
      this.el.object3D.getWorldPosition(this.worldPosition)
      const lookingAtPalm = this.data.attach.components['hand-tracking-controls'].wristObject3D.rotation.z > 2.0 
      if( !lookingAtPalm ){ this.data.open = false }
    }
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
    this.components = []
    // observe HTML changes in <a-scene>
    observer = new MutationObserver( (a,b) => this.getLaunchables(a,b) )
    observer.observe( this.sceneEl, {characterData: false, childList: true, attributes: false});
  },

  getLaunchables: function(mutationsList,observer){
    let searchEvent = 'launcher'
    let els         = [...this.sceneEl.getElementsByTagName("*")]

    this.components = els.filter( (el) => {
      let hasEvent = false
      if( el.components ){
        for( let i in el.components ){
          if( el.components[i].events && el.components[i].events[searchEvent] ){
            hasEvent = true
          }
        } 
      }
      return hasEvent ? el : null 
    })
    this.updateLauncher()
  },

  updateLauncher: function(){
    let launcher = document.querySelector('[launcher]')
    if( launcher ) launcher.components['launcher'].render()
  }

})
