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
    attach: { type:"selector"}
  },

  dependencies:['dom'],

  init: async function () {
    this.data.apps = []

    await AFRAME.utils.require({
      html:      "https://unpkg.com/aframe-htmlmesh@2.1.0/build/aframe-html.js",  // html to AFRAME
      dom:       "./com/dom.js",
      svgfile:   "https://7dir.github.io/aframe-svgfile-component/aframe-svgfile-component.min.js",
    })

    this.el.setAttribute("dom","")
    this.render()
    this.el.sceneEl.addEventListener('enter-vr', (e) => this.render() )
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

  },

  render: async function(){
    if( !this.el.dom ) return // too early (dom.js component not ready)

    let inVR     = this.sceneEl && this.sceneEl.renderer.xr.isPresenting
    let items    = [...this.el.children]
    let requires = [] 
    let i        = 0
    let colors   = [
      '#4C73FE',
      '#554CFE',
      '#864CFE',
      '#B44CFE',
      '#E24CFE',
      '#FE4CD3'
    ]

    const add2D = (launchCom,el,manifest,aentity) => {
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
      aentity.setAttribute("mixin","menuitem")
      aentity.setAttribute("position",`${i++ * 0.2} 0 0`)
      if( !aentity.getAttribute("material")){
        aentity.setAttribute('material',`side: double; color: ${colors[ i % colors.length]}`)
      }
      atext.setAttribute("text",`value: ${manifest.short_name}; align: baseline; anchor: align; align:center; wrapCount:7`)
      atext.setAttribute("scale","0.1 0.1 0.1")
      atext.setAttribute("position","0 0 0.0")
      aentity.appendChild(atext)
      this.el.appendChild(aentity)
      return aentity
    }

    // finally render them!
    this.el.dom.innerHTML = '' // clear
    this.system.components.map( (c) => {
      const launchComponentKey = c.getAttributeNames().pop()
      const launchCom          = c.components[ launchComponentKey ]
      if( !launchCom ) return console.warn(`could not find component '${launchComponentKey}' (forgot to include script-tag?)`)
      const manifest           = launchCom.manifest
      if( manifest ){
        add2D(launchCom,c,manifest, add3D(launchCom,c,manifest) )
      }
    })

    if( this.data.attach ){
      this.el.object3D.visible = inVR ? true : false
     // if( inVR ) this.data.attach.appendChild(this.el)
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
    // observer HTML changes in <a-scene>
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
