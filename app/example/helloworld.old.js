AFRAME.registerComponent('helloworld', {
  schema: { 
    foo: { type:"string"}
  },

  requires:{
    html:        "https://unpkg.com/aframe-htmlmesh@2.1.0/build/aframe-html.js",  // html to AFRAME
    stylis:      "https://unpkg.com/stylis@4.3.1/dist/umd/stylis.js",             // modern CSS (https://stylis.js.org)
  },

  dom: {
    scale:   3,
    events:  ['click','input'],
    html:    (me) => `
              <div id="${me.el.uid}" class="modal hello">
                <div class="top">
                  <div class="title">Hello world</div>
                </div>
                <br><br>
                <fieldset>
                  <legend>Colour</legend>
                  <input type="radio" id="color-red" name="color" value="red" checked><label for="color-red"> Red</label><br>
                  <input type="radio" id="color-blue" name="color" value="blue"><label for="color-blue"> Blue</label><br>
                </fieldset>
                <fieldset>
                  <legend>Material:</legend>
                  <input id="material-wireframe" type="checkbox" name="wireframe"><label for="material-wireframe"> Wireframe</label><br>
                </fieldset>
                <fieldset>
                  <legend>Size: <span id="value"></span></legend>
                  <input type="range" min="0.1" max="2" value="1" step="0.01" id="myRange" style="background-color: transparent;">
                </fieldset>
                <button>hello</button>
              </div>`,
    css:     `
              /* 
*              * HTML-2-WebGL limitations / guidelines for html-mesh compatibility:
               * no icon libraries (favicon e.g.)
               * in case of 'border-radius: 2px 3px 4px 5px' (2px will apply to all corners)
               * dont use transform: scale(1.2) e.g.   
*              */
              .modal.hello {
                position:relative;
                top:0;
                width:200px;
                .title { font-weight:bold; } /* modern nested buildless css thanks to stylis */
              }`
  },

  events:{

    html:    function( ){ console.log("html-mesh requirement mounted") },
    stylis:  function( ){ console.log("stylis    requirement mounted") },

    DOMready: function(e){
      // our reactive dom element has been added to the dom (DOMElement = this.el.dom)
    },

    click: function(e){ // a click was detected on this.el.dom or AFRAME entity
      let el = e.detail.target || e.detail.srcElement
      if( !el ) return
      if( el.className.match("fold")  ) this.el.toggleFold()
      if( el.className.match("close") ) this.el.close()
    },  

    input: function(e){
      if( !e.detail.target                 ) return
      if(  e.detail.target.id == 'myRange' ) this.data.value = e.detail.target.value // reactive demonstration
    },

    value: function(e){ this.el.dom.querySelector("#value").innerHTML = e.detail.v },   // auto-emitted when this.data.value gets updated

  },

  init: function () {  
    this.require( this.requires )
    
    this.scene.addEventListener('apps:2D', () => this.el.setAttribute('visible', false) )
    this.scene.addEventListener('apps:XR', () => {
      this.el.setAttribute('visible', true) 
      this.el.setAttribute("html",`html:#${this.el.uid}; cursor:#cursor`)
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

