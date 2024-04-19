AFRAME.registerComponent('vconsole', {
  schema: { 
    foo: { type:"string"}
  },

  init: function () {  
      //AFRAME.XRF.navigator.to("https://coderofsalvation.github.io/xrsh-media/assets/background.glb")
    document.head.innerHTML += `
      <style type="text/css">
        .vc-mask   { display: none !important }
        .vc-switch { display: none !important }
        .vc-panel  {
          right:unset !important;
          width:100%;
          max-width:600px;
          z-index:100 !important;
        }
      </style>
    `
  },

  requires:{
    vconsole:        "https://unpkg.com/vconsole@latest/dist/vconsole.min.js"
  },

  events:{

    // requires are loaded
    ready: function(e){
      this.vConsole = new window.VConsole() 
      document.querySelector('.vc-mask').remove()
      document.querySelector('.vc-switch').remove()
    },

    launcher: function(){
      if( !this.vConsole ) return 
      let panel = document.querySelector('.vc-panel') 
      if( panel.style.display == 'none' ) this.vConsole.show()
      else this.vConsole.hide()
    },
  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "Hello world",
    "name": "Hello world",
    "icons": [
      {
        "src": "https://css.gg/border-bottom.svg",
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

