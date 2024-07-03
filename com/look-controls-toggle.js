AFRAME.registerComponent('look-controls-toggle', {
  schema: {},
  dependencies: [],

  init: async function() {
    this.el.object3D.visible = false
    //await AFRAME.utils.require(this.dependencies)
  },

  events:{

    launcher: function(e){ 
      const $player = document.querySelector("#player")
      let enabled = $player.getAttribute("look-controls")
      if( enabled ){
        $player.setAttribute("look-controls","")
      }else{
        $player.removeAttribute("look-controls")
      }
    }

  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "wasd-controls",
    "name": "WASD controls",
    "icons": [
      {
        "src": "https://css.gg/keyboard.svg",
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
          "usage":  "wasd-controls <type> [options]",
          "example": "wasd-controls news",
          "args":{
            "--latest": {type:"string"}
          }
        },
        "short_name": "Today",
        "description": "allows moving camera via W,A,S,D keyboard keys",
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

