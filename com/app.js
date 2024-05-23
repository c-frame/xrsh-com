// this is a highlevel way of loading buildless 'apps' (a collection of js components)

AFRAME.required    = {}
AFRAME.app         = new Proxy({

  order:0,

  components: {},       // component-strings in this array are automatically
                        // added to each app
  add(component, entity){
    // categorize by component to prevent similar apps loading duplicate dependencies simultaniously
    this[component] = this[component] || []
    this[component].push(entity)
    entity.data.order = entity.data.order || this.count()
  },
  count(){
    let n = 0
    this.foreach( () => n++ )
    return n
  },
  foreach(cb){
    const isArray = (e) => e.push
    let arr = []
    for( let i in this ){
      if( isArray(this[i]) ) this[i].map( (app) => arr.push(app.el.app) )
    }
    arr.sort( (a,b) => a.data.order > b.data.order )
       .map( cb )
  }
},{
  get(me,k)  { return me[k] },
  set(me,k,v){ me[k] = v    }
})

/*
 * This is the abstract 'app' component
 */

appComponent = {
  schema:{
    "uri":{ type:"string"}
  },

  events:{
    "app:ready": function(){
      let {id,component,type} = this.parseAppURI(this.data.uri)
      AFRAME.app[component].map( (app) => {
        if( !app.el.getAttribute(component) ){
          if( AFRAME.components[ component ] ){
            app.el.setAttribute(component,app.data)
          }else console.warn(`${component} was not fully downloaded yet (${app.data.uri})`)
        }
      })
    },
    "requires:ready": function(){
      let {id,component,type} = this.parseAppURI(this.data.uri)
      AFRAME.app[component].map( (app) => {
        if( app.readyFired ) return
        setTimeout( () => {
          if( this.el.dom ) this.el.dom.style.display = '' // finally show dom elements
          app.el.emit('ready')
          app.readyFired = true
        },400) // big js scripts need some parsing time
      })
    },
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
      try{
        let id = package.split("/").pop()
        // prevent duplicate requests
        if( AFRAME.required[id] ) return
        AFRAME.required[id] = true

        if( !document.head.querySelector(`script#${id}`) ){
          let {component,type} = this.parseAppURI(package)
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
      }catch(e){ console.error(`package ${package} could not be retrieved..aborting :(`); throw e; }
    })
    Promise.all(deps).then( () => {
      this.el.emit( readyEvent || 'requireReady', packages)
    })
  }

}

AFRAME.registerComponent('app', appComponent)
AFRAME.registerComponent('com', appComponent)

/*
 * Here are monkeypatched AFRAME component prototype functions
 *
 *  monkeypatching initComponent will trigger events when components
 *  are initialized (that way apps can react to attached components)
 *  basically, in both situations:
 *    <a-entity foo="a:1"/>
 *    <a-entity app="uri: myapp.js"/>   <!-- myapp.js calls this.require(['foo.js']) -->
 *
 *  event 'foo' will be triggered as both entities (in)directly require component 'foo'
 */

AFRAME.AComponent.prototype.initComponent = function(initComponent){
  return function(){
    this.el.emit( this.attrName, this)
    this.scene = AFRAME.scenes[0]        // mount scene for convenience
    return initComponent.apply(this,arguments)
  }
}( AFRAME.AComponent.prototype.initComponent)


AFRAME.AComponent.prototype.updateProperties = function(updateProperties){
  let setupApp = function(){
    updateProperties.apply(this,arguments)

    if( !this.data || !this.data.uri || this.isApp  ) return // only deal with apps (once)

    // ensure overlay
    let overlay = document.querySelector('#overlay')
    if( !overlay ){
      overlay = document.createElement('div')
      overlay.id = "overlay"
      document.body.appendChild(overlay)
      document.querySelector("a-scene").setAttribute("webxr","overlayElement:#overlay")
    }

    const reactify = (el,aframe) => new Proxy(this.data,{
      get(me,k,v)  { return me[k]
      },
      set(me,k,v){
        me[k] = v
        aframe.emit(k,{el,k,v})
      }
    })

    // reactify components with dom-definition
    if( this.data.uri && this.dom && !this.el.dom ){

      tasks = {

        createReactiveDOMElement: () => {
          this.el.dom = document.createElement('div')
          this.el.dom.className = this.parseAppURI(this.data.uri).component
          this.el.dom.innerHTML = this.com.dom.html(this)
          this.el.dom.style.display = 'none'
          this.data = reactify( this.dom.el, this.el )
          this.dom.events.map( (e) => this.el.dom.addEventListener(e, (ev) => this.el.emit(e,ev) ) )
          return tasks
        },

        addCSS: () => {
          if( this.dom.css && !document.head.querySelector(`style#${this.attrName}`) ){
            document.head.innerHTML += `<style id="${this.attrName}">${this.dom.css(this)}</style>`
          }
          return tasks
        },

        scaleDOMvsXR: () => {
          if( this.dom.scale ) this.el.setAttribute('scale',`${this.dom.scale} ${this.dom.scale} ${this.dom.scale}`)
          return tasks
        },

        setupListeners: () => {
          this.scene.addEventListener('apps:2D', () => this.el.setAttribute('visible', false) )
          this.scene.addEventListener('apps:XR', () => {
            this.el.setAttribute('visible', true)
            this.el.setAttribute("html",`html:#${this.el.uid}; cursor:#cursor`)
          })
          return tasks
        },

        initAutoComponents: () => {
          for ( let i in AFRAME.app.components ) {
            this.el.setAttribute( i, AFRAME.app.components[i] )
          }
          return tasks
        },

        triggerKeyboardForInputs: () => {
          // https://developer.oculus.com/documentation/web/webxr-keyboard ;
          [...this.el.dom.querySelectorAll('[type=text]')].map( (input) => {
            let triggerKeyboard = function(){
              this.focus()
              console.log("focus")
            }
            input.addEventListener('click', triggerKeyboard )
          })
          return tasks
        }

      }

      tasks
      .addCSS()
      .createReactiveDOMElement()
      .scaleDOMvsXR()
      .triggerKeyboardForInputs()
      .setupListeners()
      .initAutoComponents()

      document.querySelector('#overlay').appendChild(this.el.dom)
      this.el.emit('DOMready',{el: this.el.dom})

    }else this.data = reactify( this.el, this.el )

    // assign unique app id
    if( !this.el.uid ) this.el.uid = '_'+String(Math.random()).substr(10)

    // require coms
    let requires = {}
    for ( let i in AFRAME.app.components  ) {
      if( !AFRAME.components[i] ) requires[i] = AFRAME.app.components[i]
    }
    if( this.requires ) requires = {...requires, ...this.requires }
    if( Object.values(requires).length ) this.require( requires, 'requires:ready' )
    else this.el.emit('requires:ready' )

    // mark app as being initialized
    this.isApp  = true
    this.el.app = this
  }
  return function(){
    try{ setupApp.apply(this,arguments) }catch(e){ console.error(e) }
  }
}( AFRAME.AComponent.prototype.updateProperties)

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
  </style>
`
