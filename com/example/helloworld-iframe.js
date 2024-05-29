AFRAME.registerComponent('helloworld-iframe', {
  schema: { 
    url: { type:"string"}
  },

  init: function(){},

  requires:{
    html:        "https://unpkg.com/aframe-htmlmesh@2.1.0/build/aframe-html.js",  // html to AFRAME
    winboxjs:    "https://unpkg.com/winbox@0.2.82/dist/winbox.bundle.min.js",     // deadsimple windows: https://nextapps-de.github.io/winbox
    winboxcss:   "https://unpkg.com/winbox@0.2.82/dist/css/winbox.min.css",       // 
  },

  dom: {
    scale:   3,
    events:  ['click','keydown'],
    html:    (me) => `<div>
                        <iframe src=""></iframe>
                      </div>`,

    css:     (me) => `
      .XR #overlay .winbox.iframe{ visibility: visible; } /* don't hide in XR mode */
      .winbox.iframe iframe      { background:#FFF;     }
    `
  },

  events:{

    // combined AFRAME+DOM reactive events
    click:   function(e){ }, // 
    keydown: function(e){ }, // 

    // reactive updates (data2event.js)
    url: function(e){ 
      this.el.dom.querySelector('iframe').src = this.data.url
      console.dir(this.el.dom.querySelector('iframe'))
    },

    launcher: async function(){
      let URL = this.data.url || prompt('enter URL to display','https://fabien.benetou.fr/Wiki/Wiki')
      if( !URL ) return

      let s = await AFRAME.utils.require(this.requires)

      // instance this component
      const instance = this.el.cloneNode(false)
      this.el.sceneEl.appendChild( instance )
      instance.setAttribute("dom",       "")
      instance.setAttribute("data2event","")
      instance.setAttribute("visible",  AFRAME.utils.XD() == '3D' ? 'true' : 'false' )
      instance.setAttribute("position", AFRAME.utils.XD.getPositionInFrontOfCamera(1.39) )
      instance.object3D.quaternion.copy( AFRAME.scenes[0].camera.quaternion ) // face towards camera

      const setupWindow = () => {
        const com = instance.components['helloworld-iframe']
        instance.dom.style.display = 'none'
        new WinBox("Hello World",{ 
          width: 250,
          height: 150,
          class:["iframe"],
          x:"center",
          y:"center",
          id:  instance.uid, // important hint for html-mesh  
          root: document.querySelector("#overlay"),
          mount: instance.dom,
          onclose: () => { instance.dom.style.display = 'none'; return false; },
          oncreate: () => {
            com.data.url = URL
            instance.setAttribute("html",`html:#${instance.uid}; cursor:#cursor`)
          }
        });
        instance.dom.style.display = ''
      }

      setTimeout( () => setupWindow(), 10 ) // give new components time to init
    },

  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "Iframe",
    "name": "Hello world IFRAME window",
    "icons": [
      {
        "src": "https://css.gg/browse.svg",
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

