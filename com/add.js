AFRAME.registerComponent('add', {
  schema:{
    comps: {type:"array"}
  },

  init: function () { },

  getInstallables: function(){
    const installed   = document.querySelector('[launcher]').components.launcher.system.getLaunchables() 
    return this.data.comps.map( (c) => {
      return installed[c] ? null : c
    })
    .filter( (c) => c ) // filters out null elements
  },

  events:{
    launcher: function(){
      if( this.el.sceneEl.renderer.xr.isPresenting ){
        this.el.sceneEl.exitVR() // *FIXME* we need a gui 
      }

      let msg    = `Which item to add to the menu?\n\n`
      const coms = this.getInstallables()
      for( let i = 0; i < coms.length; i++ ){
        msg += `${i+1}. ${coms[i]}\n`
      }
      let choice = prompt(msg, 1)
      if( parseInt(choice) == NaN ) return console.log("choice NaN")

      // add a-entity + selected component
      const com = coms[ parseInt(choice)-1 ]
      if( !com ) return console.log("choice != component")
      AFRAME.utils.require([com])
      .then( () => {
        let el = document.createElement('a-entity')        
        el.setAttribute( com.split("/").pop(), "")
        this.el.sceneEl.appendChild(el)
      })
    }
  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "+",
    "name": "Add item",
    "icons": [
      {
        "src": "https://css.gg/add-r.svg",
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
    "category":"system",
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
    "description": "adds item to menu",
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

