//
// this is just an AFRAME wrapper for golden-layout v2 (docs: https://golden-layout.github.io/golden-layout/)
//
//

AFRAME.registerComponent('windowmanager', {
  schema: { 
  },

  requires:{
    "goldenlayout_css1": "https://unpkg.com/golden-layout@2.6.0/dist/css/goldenlayout-base.css",
    "goldenlayout_css2": "https://unpkg.com/golden-layout@2.6.0/dist/css/themes/goldenlayout-dark-theme.css"
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
    ready: function(){
      this.initLayout(this)
    }
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
            content: [
                {
                    title: 'Terminal',
                    type: 'component',
                    componentType: 'Modal',
                    width: 50,
                },
                {
                    title: 'Welcome to XR shell',
                    type: 'component',
                    componentType: 'Modal',
                    // componentState: { text: 'Component 2' }
                }
            ]
        }
    };

    this.goldenLayout = new GoldenLayout( this.el.dom.querySelector('.modals'));
    this.goldenLayout.registerComponent('Modal', Modal);
    this.goldenLayout.loadLayout(myLayout);

  },

  add: function(title,el){
    setTimeout( () => {
      let item = this.goldenLayout.addComponent('Modal', undefined, title )
      console.dir(item)
      item.parentItem.contentItems[ item.parentItem.contentItems.length-1 ].element.querySelector('.lm_content').appendChild(el)
    },1000)
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

// monkeypatching updateProperties will detect a component config like: 
//   dom: { 
//     html:   `<h1>Welcome to XR shell</h1>`, 
//     css:    `#hello {color:red}`,
//     events: ['click']
//   }
// and use it to create a reactive DOM-component (using native javascript Proxy)
// which delegates all related DOM-events AND data-changes back to the AFRAME component
AFRAME.AComponent.prototype.updateProperties = function(updateProperties){
  return function(){
    updateProperties.apply(this,arguments)
    if( this.dom && this.data && this.data.uri ){

      tasks = {

        generateUniqueId: () => {
          this.el.uid = String(Math.random()).substr(2)
          return tasks
        },

        ensureOverlay: () => {
          let overlay = document.querySelector('#overlay')
          if( !overlay ){
            overlay = document.createElement('div')
            overlay.id = "overlay"
            document.body.appendChild(overlay)
            document.querySelector("a-scene").setAttribute("webxr","overlayElement:#overlay")
          }
          tasks.overlay = overlay
          return tasks
        },

        createReactiveDOMElement: () => {
          const reactify = (el,aframe) => new Proxy(this.data,{
            get(me,k,v)  { return me[k] },
            set(me,k,v){
              me[k] = v
              aframe.emit(k,{el,k,v})
            }
          })
          this.el.dom = document.createElement('div')
          this.el.dom.className = this.parseAppURI(this.data.uri).component
          this.el.dom.innerHTML = this.dom.html(this)
          this.data = reactify( this.dom.el, this.el )
          this.dom.events.map( (e) => this.el.dom.addEventListener(e, (ev) => this.el.emit(e,ev) ) )
          return tasks
        },

        addCSS: () => {
          if( this.dom.css && !document.head.querySelector(`style#${this.attrName}`) ){
            document.head.innerHTML += `<style id="${this.attrName}">${this.dom.css}</style>`
          }
          return tasks
        },

        scaleDOMvsXR: () => {
          if( this.dom.scale ) this.el.setAttribute('scale',`${this.dom.scale} ${this.dom.scale} ${this.dom.scale}`)
          return tasks
        },

        addModalFunctions: () => {
          this.el.close = () => {
            this.el.dom.remove()
            this.el.removeAttribute("html")
          }
          this.el.toggleFold = () => {
            this.el.dom.querySelector(".modal").classList.toggle('fold')
            this.el.dom.querySelector('.top .fold').innerText = this.el.dom.querySelector('.modal').className.match(/fold/) ? '▢' : '_'
          }
          return tasks
        },
      }

      tasks
      .generateUniqueId()
      .ensureOverlay()
      .addCSS()
      .createReactiveDOMElement()
      .scaleDOMvsXR()
      .addModalFunctions()
      // finally lets add the bad boy to the DOM
      if( this.dom && this.dom.modal ){
        document.querySelector('[windowmanager]').components['windowmanager'].add( this.parseAppURI(this.data.uri).component, this.el.dom )
      }else tasks.overlay.appendChild(this.el.dom)
    }
  }
}( AFRAME.AComponent.prototype.updateProperties)


//
// base CSS for XRSH apps 
//
// limitations / some guidelines for html-mesh compatibility:
//   * no icon libraries (favicon e.g.)
//   * 'border-radius: 2px 3px 4px 5px' (applies 2px to all corners)
//

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
      --xrsh-font-sans-serif: system-ui, -apple-system, segoe ui, roboto, ubuntu, helvetica, cantarell, noto sans, sans-serif;
      --xrsh-font-monospace: menlo, monaco, lucida console, liberation mono, dejavu sans mono, bitstream vera sans mono, courier new, monospace, serif;
      --xrsh-font-size-0: 12px;
      --xrsh-font-size-1: 14px;
      --xrsh-font-size-2: 17px;
      --xrsh-font-size-3: 21px;
      --xrsh-modal-button-bg: #CCC;
      --xrsh-modal-button-fg: #FFF;
    }

    /* CSS reset */
    html{line-height:1.15;-webkit-text-size-adjust:100%}body{margin:0}main{display:block}h1{font-size:2em;margin:0.67em 0}hr{box-sizing:content-box;height:0;overflow:visible}pre{font-family:monospace, monospace;font-size:1em}a{background-color:transparent}abbr[title]{border-bottom:none;text-decoration:underline;text-decoration:underline dotted}b,strong{font-weight:bolder}code,kbd,samp{font-family:monospace, monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-0.25em}sup{top:-0.5em}img{border-style:none}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:1.15;margin:0}button,input{overflow:visible}button,select{text-transform:none}[type="button"],[type="reset"],[type="submit"],button{-webkit-appearance:button}[type="button"]::-moz-focus-inner,[type="reset"]::-moz-focus-inner,[type="submit"]::-moz-focus-inner,button::-moz-focus-inner{border-style:none;padding:0}[type="button"]:-moz-focusring,[type="reset"]:-moz-focusring,[type="submit"]:-moz-focusring,button:-moz-focusring{outline:1px dotted ButtonText}fieldset{padding:0.35em 0.75em 0.625em}legend{box-sizing:border-box;color:inherit;display:table;max-width:100%;padding:0;white-space:normal}progress{vertical-align:baseline}textarea{overflow:auto}[type="checkbox"],[type="radio"]{box-sizing:border-box;padding:0}[type="number"]::-webkit-inner-spin-button,[type="number"]::-webkit-outer-spin-button{height:auto}[type="search"]{-webkit-appearance:textfield;outline-offset:-2px}[type="search"]::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}details{display:block}summary{display:list-item}template{display:none}[hidden]{display:none}

    a-scene{
      position:fixed;
      top:0;
      left:0;
      right:0;
      bottom:0;
    }
    canvas{
      z-index:10;
    }

    body,
    html.a-fullscreen body{  
      color:       var(--xrsh-dark-gray);
      font-size:   var(--xrsh-font-size-1); 
      font-family: var(--xrsh-font-sans-serif);
      padding:15px;
      accent-color: var(--xrsh-light-primary);
    }

    #overlay{
      display: flex; /* tile modals */
    }
             
    h1,h2,h3,h4,h5{
      color: var(--xrsh-gray);
    }
    h1      {  font-size: var(--xrsh-font-size-3); }
    h2,h3,h4{  font-size: var(--xrsh-font-size-2); }

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
      background: transparent;
      padding: 20px 20px 10px 20px;
      border-radius: 15px;
      display: inline-block;
      position:relative;
      z-index:50;
      height:unset;
      overflow:hidden;
      margin-left:10px;
      color: var(--xrsh-light-gray);
      margin-top:-41px;
    }

    .modal.fold {
      height:22px;  
      overflow:hidden;
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
      transform: translate(-4px,-3px) scale(1.5,1);
      margin-left: 6px;
    }

    .modal .top button.fold{
      background: transparent;
      border: none;
      margin: 0;
      margin-left: 30px;
      transform: scale(1.2) translate(0px,-6px);
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
      box-sizing:content-box;
      border:1px solid #444;
      background:transparent;
    }
    #windowmanager .lm_goldenlayout{
      background:#000D;
    }
    #windowmanager .lm_title{
      font-family: var(--xrsh-font-sans-serif);
      font-size:   var(--xrsh-font-size-1);
      font-weight:bold;
    }
}

  </style>
`
