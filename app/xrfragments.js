AFRAME.registerComponent('xrfragments', {
  schema: { 
    url: { type:"string"}
  },

  init: function () {  
  },

  requires:{
    xrfragments: "https://xrfragment.org/dist/xrfragment.aframe.js",
  },

  events:{

    // requires are loaded
    ready: function(e){
      this.el.setAttribute("xrf","https://coderofsalvation.github.io/xrsh-media/assets/background.glb")

      let ARbutton = document.querySelector('.a-enter-ar-button')
      if( ARbutton ){  
        ARbutton.addEventListener('click', () => {
          AFRAME.XRF.reset() 
        })
      }
    },

    launcher:  function(){
      let url = prompt('enter URL to glb/fbx/json/obj/usdz asset', 'https://xrfragment.org/index.glb')
      if( url ) AFRAME.XRF.navigator.to(url)
    }

  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "XRF",
    "name": "XR Fragment URL",
    "icons": [ ],
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

