AFRAME.registerComponent('launcher-optional', {
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
      let launcher = this.el.sceneEl.querySelector('[launcher]').components['launcher']

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
        "src": "data:image/svg+xml;base64,PHN2ZwogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKPgogIDxwYXRoCiAgICBkPSJNMTIgNkMxMi41NTIzIDYgMTMgNi40NDc3MiAxMyA3VjExSDE3QzE3LjU1MjMgMTEgMTggMTEuNDQ3NyAxOCAxMkMxOCAxMi41NTIzIDE3LjU1MjMgMTMgMTcgMTNIMTNWMTdDMTMgMTcuNTUyMyAxMi41NTIzIDE4IDEyIDE4QzExLjQ0NzcgMTggMTEgMTcuNTUyMyAxMSAxN1YxM0g3QzYuNDQ3NzIgMTMgNiAxMi41NTIzIDYgMTJDNiAxMS40NDc3IDYuNDQ3NzIgMTEgNyAxMUgxMVY3QzExIDYuNDQ3NzIgMTEuNDQ3NyA2IDEyIDZaIgogICAgZmlsbD0iY3VycmVudENvbG9yIgogIC8+CiAgPHBhdGgKICAgIGZpbGwtcnVsZT0iZXZlbm9kZCIKICAgIGNsaXAtcnVsZT0iZXZlbm9kZCIKICAgIGQ9Ik01IDIyQzMuMzQzMTUgMjIgMiAyMC42NTY5IDIgMTlWNUMyIDMuMzQzMTUgMy4zNDMxNSAyIDUgMkgxOUMyMC42NTY5IDIgMjIgMy4zNDMxNSAyMiA1VjE5QzIyIDIwLjY1NjkgMjAuNjU2OSAyMiAxOSAyMkg1Wk00IDE5QzQgMTkuNTUyMyA0LjQ0NzcyIDIwIDUgMjBIMTlDMTkuNTUyMyAyMCAyMCAxOS41NTIzIDIwIDE5VjVDMjAgNC40NDc3MiAxOS41NTIzIDQgMTkgNEg1QzQuNDQ3NzIgNCA0IDQuNDQ3NzIgNCA1VjE5WiIKICAgIGZpbGw9ImN1cnJlbnRDb2xvciIKICAvPgo8L3N2Zz4K",
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

