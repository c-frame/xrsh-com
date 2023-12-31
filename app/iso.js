AFRAME.registerComponent('helloworld', {
  schema: { 
    foo: { type:"string"}
  },
  dependencies:{
    "html":   "https://unpkg.com/aframe-htmlmesh@2.1.0/build/aframe-html.js",  // html to AFRAME
    "stylis": "https://unpkg.com/stylis@4.3.1/dist/umd/stylis.js"              // modern CSS (https://stylis.js.org)
  },
  dom: {
    scale:   3.5,
    events:  ['click'],
    html:    `<div id="hello"><button>hello</button></div>`,
    css:     `div{ #hello {position:absolute;top:0;width:300px} }`
  },
  events:{
    "html":  function( ){ console.log("htmlmesh component mounted!")                 },   // html-component was added to this AFRAME entity
    "title": function(e){ this.dom.el.querySelector("button").innerHTML = e.detail.v },   // this.data.title was changed
    "click": function(e){ alert("clicked "+ (e.detail.target || e.target).tagName )  },   // a click was detected on this.dom.el or AFRAME entity
//    "aframe-html": function(){
//      this.el.setAttribute()
//      alert("aframe loaded")
//    }

//    "iso":   function(tty){// act when component gets mounted 
//      // 'term' is basically AFRAME.components.ISOterminal
//      tty.write('hello to tty ISO-os from AFRAME')
//      tty.on('stdout', (data) => {
//        // react to data being spoken/typed into the terminal
//        // (spatial prompting like 'open foo.gltf', 'component helloworld' e.g.)
//      })
//    },
//
//    "xterm":   function(xterm){// act when component gets mounted 
//      // 'term' is basically AFRAME.components.ISOterminal
//    },
//
//    "content-menu": function(menu){
//      menu.add({
//        name: 'edit',         // "everything must have an edit-button" ~ Fabien Benetou
//        icon: 'gear',         // see https://jsonforms.io to see json-2-html forms                   
//        type: 'object',       // json-2-webxr has nothing like it (yet) but offers uniform interfaces across components 
//        properties:{           
//          enabled:        { type: 'boolean',  default: true, format: 'checkbox' },
//          edit_terminal:  { type: 'function', cb: () => AFRAME.components.ISOterminal.exec('pico /com/helloworld.js') },
//          edit_spatial:   { type: 'function', cb: () => this.require({"spatial-edit":{required:true}})                }
//        }
//      })
//    }
  },

  init: function () {  
    this.require( this.dependencies )
    .then( () => {
      document.body.appendChild(this.dom.el)

      setInterval( () => this.data.title = String(Math.random()), 500 )
      this.el.setAttribute("html",'html:#hello; cursor:#cursor')
    })
  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "Hello world",
    "name": "Hello world",
    "icons": [
      {
        "src": "/images/icons-vector.svg",
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
        "name": "How are you today?",
        "short_name": "Today",
        "description": "View weather information for today",
        "url": "/today?source=pwa",
        "icons": [{ "src": "/images/today.png", "sizes": "192x192" }]
      },
      {
        "name": "How's weather tomorrow?",
        "short_name": "Tomorrow",
        "description": "View weather information for tomorrow",
        "url": "/tomorrow?source=pwa",
        "icons": [{ "src": "/images/tomorrow.png", "sizes": "192x192" }]
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

