//
// this is just an AFRAME wrapper for golden-layout v2 (docs: https://golden-layout.github.io/golden-layout/)
//
//
AFRAME.registerComponent('apptiler', {
  schema: { 
  },

  requires:{
    goldenlayout_css1: "https://unpkg.com/golden-layout@2.6.0/dist/css/goldenlayout-base.css",
    goldenlayout_css2: "https://unpkg.com/golden-layout@2.6.0/dist/css/themes/goldenlayout-dark-theme.css",
  },

  dom: {
    events:  [],

    // for stylesheet see bottom of file
    html:    (me) => `
              <div id="windowmanager">
                <div class="modals"></div>
              </div>`,

  },

  events:{
    DOMready: async function(){
      await this.initLayout(this)
      AFRAME.app.foreach( (opts) => {
        this.add( opts.component, opts.app.el.dom) 
        if( opts.component != 'apptiler' ) opts.app.el.dom.classList.add(['tile'])
      })
      setTimeout( () => document.querySelector('#overlay').classList.add(['apptiler']), 100 )
      // surf to entrypoint of other xrsh worlds 
      //<script src="https://xrfragment.org/feat/multiparty/dist/xrfragment.aframe.js"></script>
      //AFRAME.XRF.navigator.to("https://coderofsalvation.github.io/xrsh-media/assets/background.glb")
    },

  },

  init: function () {  
    this.require( this.requires )
  },

  initLayout: async function(){
    if( this.goldenLayout !== undefined  || !this.el.dom.querySelector(".modals")) return console.warn("TODO: fix duplicate ready-events")

    let { GoldenLayout } = await import("https://cdn.skypack.dev/pin/golden-layout@v2.5.0-dAz3xMzxIRpbnbfEAik0/mode=imports/optimized/golden-layout.js");

    class Modal {
        constructor(container) {
            this.container = container;
            this.rootElement = container.element;
            this.rootElement.innerHTML = ''
            this.resizeWithContainerAutomatically = true;
        }
    }
    const myLayout = {
        root: {
            type: 'row',
            content: []
        }
    };

    this.goldenLayout = new GoldenLayout( this.el.dom.querySelector('.modals'));
    this.goldenLayout.registerComponent('Modal', Modal);
    this.goldenLayout.loadLayout(myLayout);
  },

  add: function(title,el){
    if( title == 'apptiler' ) return // dont add yourself to yourself please
    let item = this.goldenLayout.addComponent('Modal', undefined, title )
    try{
      item.parentItem.contentItems[ item.parentItem.contentItems.length-1 ].element.querySelector('.lm_content').appendChild(el)
    }catch(e){} // ignore elements which are already appended 
  },

  manifest: { // HTML5 manifest to identify app to xrsh
    "short_name": "windowmanager",
    "name": "Window Manager",
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
    "shortcuts": [],
    "description": "2D/3D management of windows",
    "screenshots": [
      {
        "src": "/images/screenshot1.png",
        "type": "image/png",
        "sizes": "540x720",
        "form_factor": "narrow"
      }
    ],
    "help":`
Window Manager 

The window manager manages all the windows in 2D/XR.
This is a core XRSH system application
    `
  }

});

document.head.innerHTML += `
  <style type="text/css">

    :root {
      --xrsh-primary: #3aacff;
      --xrsh-primary-fg: #FFF;
      --xrsh-light-primary: #00a3Ff;
      --xrsh-secondary: #872eff;
      --xrsh-third: #ce7df2;
      --xrsh-box-shadow: #0005;
      --xrsh-dark-gray: #343334;
      --xrsh-gray: #424280;
      --xrsh-white: #fdfdfd;
      --xrsh-light-gray: #efefef;
      --xrsh-lighter-gray: #e4e2fb96;
      --xrsh-modal: #000B;
      --xrsh-font-sans-serif: system-ui, -apple-system, segoe ui, roboto, ubuntu, helvetica, cantarell, noto sans, sans-serif;
      --xrsh-font-monospace: menlo, monaco, lucida console, liberation mono, dejavu sans mono, bitstream vera sans mono, courier new, monospace, serif;
      --xrsh-font-size-0: 12px;
      --xrsh-font-size-1: 14px;
      --xrsh-font-size-2: 17px;
      --xrsh-font-size-3: 21px;
      --xrsh-modal-button-bg: #CCC;
      --xrsh-modal-button-fg: #FFF;
    }

    body,
    html.a-fullscreen body{  
      color:       var(--xrsh-light-gray);
      font-size:   var(--xrsh-font-size-1); 
      font-family: var(--xrsh-font-sans-serif);
      accent-color: var(--xrsh-light-primary);
      line-height:22px;
    }

    #overlay{
      opacity:0;
    }

    #overlay.apptiler{
      transition:1s;
      opacity:1;
    }

    h1,h2,h3,h4,h5{
      color: var(--xrsh-light-gray);
    }
    h1      {  font-size: var(--xrsh-font-size-3); }
    h2,h3,h4{  font-size: var(--xrsh-font-size-2); }

    a,a:visited,a:active{
      color: var(--xrsh-light-primary);
    }

    button,.btn,input[type=submit]{
      border-radius:7px;
      background: var(--xrsh-primary);
      color: var(--xrsh-primary-fg); 
      transition:0.3s;
      padding: 10px;
      font-weight: bold;
      border: none;
      cursor:pointer;
    }
    button:hover,.btn:hover,input[type=submit]:hover{
      filter: brightness(1.5);
    }

    .modal{
      background: var(--xrsh-modal);
      padding: 20px 20px 10px 20px;
      border-radius: 15px;
      display:inline-block;
      position:relative;
      z-index:50;
      height:unset;
      overflow:hidden;
      margin-left:0px;
      margin-top:-41px;
      color: var(--xrsh-white);
    }

    .modal.tile{
    }

    .modal .top{
      background: var(--xrsh-light-primary);
      border-radius:15px;
      position: absolute;
      z-index:1;
      left: 0;
      right: 0;
      top: 0;
      height: 25px;
      padding: 13px 10px 1px 14px;
      color: #FFF;
    }

    /* remove this to see why this is a workaround for border-radius bug */
    .modal .top .title{
      position: absolute;
      background: var(--xrsh-light-primary);
      display: block;
      left: 0;
      right: 0;
      height: 27px;
      padding: 0px 0px 0px 20px;
      font-weight: bold;
    }

    .modal .top button{
      padding: 5px 7px;
      background: var(--xrsh-modal-button-bg);
      color: var(--xrsh-modal-button-fg);
      font-weight: bold;
      float:right;
    }
    .modal .top button:hover{
      filter: brightness(1.1);
    }

    .modal .top button.close{
      background: transparent;
      display: block;
      font-size: 20px;
      padding: 0;
      transform: translate(-4px,-3px);
      margin-left: 6px;
    }

    legend{
      font-size: var(--xrsh-font-size-0);
      margin-bottom: 15px;
      border-bottom: 1px solid var(--xrsh-light-primary);
    }

    fieldset{
      border: none;
      padding: 0;
      margin: 0;
      margin-bottom: 0px;
      margin-bottom: 5px;
    }
    label{
      margin-left:10px;
    }
    button,input,.btn{
      margin-bottom:10px;
    }
    [type="checkbox"], [type="radio"]{
      transform: scale(1.4);
      margin-left:3px;
    }

    #windowmanager{
      display: flex;
      height: 100%;
      width: 100%;
      position:fixed;
      top:0;
      left:0;
      bottom:0;
      right:0;
    }
    .modals{
      flex: 0 0 auto;
      height:100%;
      width:100%;
      margin-right: 3px;
    }
    #windowmanager .lm_content{
      overflow-y: auto;
      box-sizing:content-box;
      border:1px solid #444;
      background:transparent;
    }
    #windowmanager .lm_goldenlayout{
      background: var(--xrsh-modal);
    }
    #windowmanager .lm_title{
      font-family: var(--xrsh-font-sans-serif);
      font-size:   var(--xrsh-font-size-1);
      font-weight:bold;
    }
  </style>
`
