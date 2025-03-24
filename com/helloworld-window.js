AFRAME.registerComponent('helloworld-window', {
  schema: { 
    foo: { type:"string"}
  },

  init: function () {

  },

  requires:{
    window:   "com/window.js",
    reactive: "com/data2event.js"
  },

  dom: {
    scale:   0.66,
    events:  ['click','input'],
    html:    (me) => `<div class="htmlform">
                        <fieldset>
                          <legend>Welcome to XR Shell</legend>
                          A free offline-first morphable<br>
                          environment which provides <br>
                          <span id="myvalue"></span>&nbsp; XR-friendly shells.<br>
                          <ol>
                            <li>check the <a href="/" target="_blank">website</a></li> 
                            <li>check the <a href="https://forgejo.isvery.ninja/xrsh/xrsh-buildroot/src/branch/main/buildroot-v86/board/v86/rootfs_overlay/root/manual.md" target="_blank">manual</a></li> 
                          </ol>
                        </fieldset>
                        <br>
                        <fieldset>
                          <legend>Icons</legend>
                          <input type="radio" id="small" name="icons" value="0.8" checked style=""><label for="small" style="margin-right:15px;">Small</label>
                          <input type="radio" id="big"   name="icons" value="1.5"><label for="big">Big</label><br>
                        </fieldset>
                        <!--
                        <fieldset>
                          <legend>Size</legend>
                          <input type="range" min="0.1" max="2" value="1" step="0.01" id="myRange" style="background-color: transparent;">
                        </fieldset>
                        <button>hello <span id="myvalue"></span></button>
                        -->
                      </div>`,

    css:     (me) => `.htmlform { padding:11px; }`

  },

  events:{

    // component events
    window:     function( ){ console.log("window component mounted") },

    // combined AFRAME+DOM reactive events
    click: function(e){ console.dir(e) }, // 
    input: function(e){
      if( !e.detail.target                 ) return
      if(  e.detail.target.id == 'myRange' ) this.data.myvalue = e.detail.target.value // reactive demonstration
      if(  e.detail.target.name == 'cmenu' ) document.querySelector(".iconmenu").style.display = e.detail.target.value == 'on' ? '' : 'none';
      if(  e.detail.target.name == 'icons' ){ 
        document.querySelector('[launcher]').object3D.getObjectByProperty("HTMLMesh").scale.setScalar( e.detail.target.value )
        document.querySelector('.iconmenu').style.transform = e.detail.target.value == '0.8' ? 'scale(1)' : 'scale(1.33)' 
      }
      console.dir(e.detail)
    },

    // reactive events for this.data updates 
    myvalue: function(e){ this.el.dom.querySelector('#myvalue').innerText = this.data.myvalue },

    launcher: async function(){
      let s = await AFRAME.utils.require(this.requires)

      // instance this component
      this.el.setAttribute("dom", "")
      this.el.object3D.quaternion.copy( AFRAME.scenes[0].camera.quaternion ) // face towards camera
    },

    DOMready: function(){
      this.el.setAttribute("window", `title: XRSH; uid: ${this.el.uid}; attach: #overlay; dom: #${this.el.dom.id}; width:250; height: 360`)

      // data2event demo
      this.el.setAttribute("data2event","")
      this.data.myvalue = 1001
      this.data.foo     = `this.el ${this.el.uid}: `
      setInterval( () => this.data.myvalue++, 500 )

    },

    "window.oncreate": function(){
      this.el.setAttribute("html-as-texture-in-xr", `domid: .winbox#${this.el.uid}; faceuser: true`)
    }

  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "Hello world htmlform",
    "name": "Hello world htmlform",
    "icons": [
      {
        "src": "https://css.gg/browser.svg",
        "src": "data:image/svg+xml;base64,PHN2ZwogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKPgogIDxwYXRoCiAgICBkPSJNNCA4QzQuNTUyMjggOCA1IDcuNTUyMjggNSA3QzUgNi40NDc3MiA0LjU1MjI4IDYgNCA2QzMuNDQ3NzIgNiAzIDYuNDQ3NzIgMyA3QzMgNy41NTIyOCAzLjQ0NzcyIDggNCA4WiIKICAgIGZpbGw9ImN1cnJlbnRDb2xvciIKICAvPgogIDxwYXRoCiAgICBkPSJNOCA3QzggNy41NTIyOCA3LjU1MjI4IDggNyA4QzYuNDQ3NzIgOCA2IDcuNTUyMjggNiA3QzYgNi40NDc3MiA2LjQ0NzcyIDYgNyA2QzcuNTUyMjggNiA4IDYuNDQ3NzIgOCA3WiIKICAgIGZpbGw9ImN1cnJlbnRDb2xvciIKICAvPgogIDxwYXRoCiAgICBkPSJNMTAgOEMxMC41NTIzIDggMTEgNy41NTIyOCAxMSA3QzExIDYuNDQ3NzIgMTAuNTUyMyA2IDEwIDZDOS40NDc3MSA2IDkgNi40NDc3MiA5IDdDOSA3LjU1MjI4IDkuNDQ3NzEgOCAxMCA4WiIKICAgIGZpbGw9ImN1cnJlbnRDb2xvciIKICAvPgogIDxwYXRoCiAgICBmaWxsLXJ1bGU9ImV2ZW5vZGQiCiAgICBjbGlwLXJ1bGU9ImV2ZW5vZGQiCiAgICBkPSJNMyAzQzEuMzQzMTUgMyAwIDQuMzQzMTUgMCA2VjE4QzAgMTkuNjU2OSAxLjM0MzE1IDIxIDMgMjFIMjFDMjIuNjU2OSAyMSAyNCAxOS42NTY5IDI0IDE4VjZDMjQgNC4zNDMxNSAyMi42NTY5IDMgMjEgM0gzWk0yMSA1SDNDMi40NDc3MiA1IDIgNS40NDc3MiAyIDZWOUgyMlY2QzIyIDUuNDQ3NzIgMjEuNTUyMyA1IDIxIDVaTTIgMThWMTFIMjJWMThDMjIgMTguNTUyMyAyMS41NTIzIDE5IDIxIDE5SDNDMi40NDc3MiAxOSAyIDE4LjU1MjMgMiAxOFoiCiAgICBmaWxsPSJjdXJyZW50Q29sb3IiCiAgLz4KPC9zdmc+",
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
    "description": "Hello world htmlform",
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

