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
    foo: { type:"string"}
  },

  init: function () {  
    this.data.apps = []

    AFRAME.scenes.map( (scene) => {
      scene.addEventListener('app:ready', (e) => this.render(e.detail) )
    })
  },

  requires:{
    html:        "https://unpkg.com/aframe-htmlmesh@2.1.0/build/aframe-html.js",  // html to AFRAME
  },

  dom: {
    scale:   3,
    events:  ['click'],
    html:    (me) => `<div>
                        <div class="iconmenu"></div>
                      </div>`,

    css:     `#iconmenu {
                z-index: 1000;
                display: flex;
                flex-direction: column-reverse;
                align-items: flex-end;
                height: 100%;
                position: fixed;
                top: 0px;
                right: 20px;
                bottom: 0;
                padding-bottom: 72px;
                box-sizing: border-box;
                pointer-events: none;
              }
              #iconmenu > button {
                pointer-events:all;
                width: 58px;
                height: 39px;
                padding: 12px 0px 20px 0px;
                border-radius: 0px;
                color: var(--xrsh-primary);
                background: #FFF;
                border-left: 5px solid var(--xrsh-primary);
                border-right: 5px solid var(--xrsh-primary);
              }

              #iconmenu > button:first-child {
                border-radius:0px 0px 30px 30px;
                border-bottom: 5px solid var(--xrsh-primary);
                padding-bottom:35px;
              }

              #iconmenu > button:last-child {
                border-radius:30px 30px 0px 0px;
                border-top: 5px solid var(--xrsh-primary);
                padding-top:13px;
              }

              #iconmenu > button > img {
                transform: translate(0px,-5px);
                opacity:0.5;
                padding: 5px;
                border-radius: 0px;
              }
              #iconmenu > button > img:hover,
              #iconmenu > button.enable > img {
                border:2px solid #444;
                transition:0.gg3s;
                border-radius: 50%;
              }`
  },

  events:{

    // combined AFRAME+DOM reactive events
    click:    function(e){ 
      console.dir(e)
    }, // 


    ready: function( ){ 
      this.el.dom.children[0].id = this.el.uid  // important hint for html-mesh
    },

  },

  render: function(app){
    clearTimeout(this.timeout)
    this.timeout = setTimeout( () => {
      AFRAME.app.foreach( (app) => {
        console.dir(app)
        if( !app.manifest ) return 

        console.log("--rendering button")
        return
        let btn = app.btn = document.createElement('button')
        if( app.manifest.icons?.length > 0){
          let img = document.createElement('img') 
          img.src = app.manifest.icons[0].src
          img.alt = app.manifest.name
          btn.appendChild(img)
        }else btn.innerText = app.manifest.short_name
        btn.addEventListener('click', () => {
          app.el.emit('launcher',app)
        })
        this.el.dom.querySelector('#iconmenu').appendChild(btn)
      })
    },200)
  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "Hello world",
    "name": "Hello world",
    "icons": [
      {
        "src": "https://css.gg/browser.svg",
        "type": "image/svg+xml",
        "sizes": "512x512"
      }
    ],
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

