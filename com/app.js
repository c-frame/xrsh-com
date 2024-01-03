// this is a highlevel way of loading buildless 'apps' (a collection of js components)

AFRAME.required    = {}
AFRAME.app         = new Proxy({

  add(component, entity){ 
    this[component] = this[component] || []
    this[component].push(entity)
  },
  foreach(cb){
    for( let i in this ){
      if( typeof this[i] != 'function' ) this[i].map( (app) => cb({app,component:i}) )
    }
  }
},{
  get(me,k)  { return me[k] },
  set(me,k,v){ me[k] = v    }
})

AFRAME.registerComponent('app', {
  schema:{
    "uri":{ type:"string"}
  },

  events:{
    "app:ready": function(){
      let {id,component,type} = this.parseAppURI(this.data.uri)
      AFRAME.app[component].map( (app) => {
        if( !app.el.getAttribute(component) ) app.el.setAttribute(component,app.data)
      }) 
    }
  },

  init: function() { 
    let {id,component,type} = this.parseAppURI(this.data.uri)
    let sel = `script#${component}`
    if( AFRAME.app[component] || AFRAME.components[component] || document.head.querySelector(sel) ) return AFRAME.app.add(component,this)
    AFRAME.app.add(component,this)
    this.require([ this.data.uri ], 'app:ready') 
  },

  parseAppURI: AFRAME.AComponent.prototype.parseAppURI = function(uri){
    return {
      id:        String(uri).split("/").pop(),                      // 'a/b/c/mycom.js' => 'mycom.js'
      component: String(uri).split("/").pop().split(".js").shift(), // 'mycom.js' => 'mycom'
      type:      String(uri).split(".").pop()                       // 'mycom.js' => 'js'
    }
  },

  // usage: require(["./app/foo.js"])
  //        require({foo: "https://foo.com/foo.js"})
  require: AFRAME.AComponent.prototype.require = function(packages,readyEvent){
    let deps = []
    if( !packages.map ) packages = Object.values(packages)
    packages.map( (package) => {
      let id = package.split("/").pop()
      // prevent duplicate requests
      if( AFRAME.required[id] ) return
      AFRAME.required[id] = true 

      if( !document.head.querySelector(`script#${id}`) ){
        let {id,component,type} = this.parseAppURI(package)
        let p = new Promise( (resolve,reject) => {
          switch(type){
            case "js":  let script = document.createElement("script")
                        script.id  = id
                        script.src = package
                        script.onload  = () => resolve()
                        script.onerror = (e) => reject(e)
                        document.head.appendChild(script)
                        break;
            case "css": let link = document.createElement("link")
                        link.id  = id
                        link.href = package
                        link.rel = 'stylesheet'
                        document.head.appendChild(link)
                        resolve()
                        break;
          }
        })
        deps.push(p)
      }
    })
    Promise.all(deps).then( () => this.el.emit( readyEvent||'ready', packages) )
  }

})

// monkeypatching initComponent will trigger events when components 
// are initialized (that way apps can react to attached components) 
// basically, in both situations: 
//   <a-entity foo="a:1"/> 
//   <a-entity app="uri: myapp.js"/>   <!-- myapp.js calls this.require(['foo.js']) -->
//   
// event 'foo' will be triggered as both entities (in)directly require component 'foo'

AFRAME.AComponent.prototype.initComponent = function(initComponent){
  return function(){
    this.el.emit( this.attrName, this)
    this.scene = AFRAME.scenes[0]        // mount scene for convenience
    return initComponent.apply(this,arguments)
  }
}( AFRAME.AComponent.prototype.initComponent)


AFRAME.AComponent.prototype.updateProperties = function(updateProperties){
  return function(){
    updateProperties.apply(this,arguments)
    if( this.dom && this.data && this.data.uri ){

      tasks = {

        generateUniqueId: () => {
          this.el.uid = String(Math.random()).substr(10)
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
          return tasks
        }
      }

      tasks
      .generateUniqueId()
      .ensureOverlay()
      .addCSS()
      .createReactiveDOMElement()
      .scaleDOMvsXR()
      .addModalFunctions()

      tasks.overlay.appendChild(this.el.dom)
      this.el.emit('DOMready',{el: this.el.dom})
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

    #overlay{
      display: flex; /* tile modals */
      z-index:10;
    }
    #overlay.hide{
      z-index:-10;
    }

    #toggle_overlay{
      position: fixed;
      right: 20px;
      bottom: 73px;
      width: 58px;
      text-align: center;
      height: 40px;
      padding: 0;
      z-index: 100;
      border: 3px solid #3aacff;
      border-radius:11px;
      transition:0.3s;
      padding: 0px;
      font-weight: bold;
      cursor:pointer;
      font-family:sans-serif;
      font-size:15px;
      color: #FFF;  
      background: #3aacff;
      transition:0.5s;
    }
    .XR #toggle_overlay{
      background: transparent;
      color: #3aacff;
    }

    .XR #overlay{
      visibility: hidden;
    }
  </style>
`

// draw a button so we can toggle apps between 2D / XR
let toggle = (state) => {
  state = state || document.body.className.match(/XR/)
  document.body.classList[ state ? 'remove' : 'add'](['XR'])
  AFRAME.scenes[0].emit( state ? 'apps:2D' : 'apps:XR') 
}
document.addEventListener("DOMContentLoaded", (event) => {
  let btn       = document.createElement("button")
  btn.id        = "toggle_overlay"
  btn.innerText = 'XRSH'
  btn.addEventListener('click', (e) => toggle() )
  document.body.appendChild(btn)

  document.querySelector('a-scene').addEventListener('enter-vr', () => toggle(true) )
  document.querySelector('a-scene').addEventListener('exit-vr', () => toggle(false) )
  document.querySelector('a-scene').addEventListener('loaded', () => {
    let VRbtn = document.querySelector('a-scene .a-enter-vr')
    let ARbtn = document.querySelector('a-scene .a-enter-ar')
    if( VRbtn ) document.body.appendChild(VRbtn) // move to body
    if( ARbtn ) document.body.appendChild(ARbtn) // so they will always be visible
  })

})
