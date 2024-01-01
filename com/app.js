// this is a highlevel way of loading buildless 'apps' (a collection of js components)

AFRAME.registerComponent('app', {
  schema:{
    "uri":{ type:"string"}
  },
  init: function() { 
    this.require([ this.data.uri ])
    .then( () => {
      let id = this.data.uri.split("/").pop() // 'a/b/c/mycom.js' => 'mycom.js'
      let component = id.split(".js").shift() // 'mycom.js' => 'mycom'
      let entity = document.createElement("a-entity")
      this.el.setAttribute(component,this.data)
    })
  },


  // usage: require(["./app/foo.js"])
  //        require({foo: "https://foo.com/foo.js"})
  require: AFRAME.AComponent.prototype.require = function(packages){
    let deps = []
    if( !packages.map ) packages = Object.values(packages)
    packages.map( (package) => {
      let id = package.split("/").pop()
      if( !document.head.querySelector(`script#${id}`) ){
        let p = new Promise( (resolve,reject) => {
          let script = document.createElement("script")
          script.id  = id
          script.src = package
          script.onload  = () => resolve()
          script.onerror = (e) => reject(e)
          document.head.appendChild(script)
        })
        deps.push(p)
      }
    })
    return Promise.all(deps)
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
    return initComponent.apply(this,arguments)
  }
}( AFRAME.AComponent.prototype.initComponent)


// monkeypatching updateProperties will detect a component config like: 
//   dom: { 
//     html:   `<h1>hello</h1>`, 
//     css:    `#hello {color:red}`,
//     events: ['click']
//   }
// and use it to create a reactive DOM-component (using native javascript Proxy)
// which delegates all related DOM-events AND data-changes back to the AFRAME component

AFRAME.AComponent.prototype.updateProperties = function(updateProperties){
  return function(){
    updateProperties.apply(this,arguments)
    if( this.dom && this.data){
      let reactify = (el,aframe) => new Proxy(this.data,{
        get(me,k,v)  { return me[k] },
        set(me,k,v){
          me[k] = v
          aframe.emit(k,{el,k,v})
        }
      })
      let el = document.createElement('div')
      el.innerHTML = this.dom.html 
      this.data = reactify( el, this.el )
      this.dom.el = el.childNodes[0]
      this.dom.events.map( (e) => this.dom.el.addEventListener(e, (ev) => this.el.emit(e,ev) ) )
      // add css if any
      if( this.dom.css && !document.head.querySelector(`style#${this.attrName}`) ){
        document.head.innerHTML += `<style id="${this.attrName}">${this.dom.css}</style>`
      }
      if( this.dom.scale ) this.el.setAttribute('scale',`${this.dom.scale} ${this.dom.scale} ${this.dom.scale}`)
      //('[helloworld]').object3D.children[0].material.map.magFilter = THREE.NearestFilter
    }
  }
}( AFRAME.AComponent.prototype.updateProperties)

//
// base CSS for XRSH apps 
//
document.head.innerHTML += `
  <style type="text/css">
    /* CSS reset */
    html{line-height:1.15;-webkit-text-size-adjust:100%}body{margin:0}main{display:block}h1{font-size:2em;margin:0.67em 0}hr{box-sizing:content-box;height:0;overflow:visible}pre{font-family:monospace, monospace;font-size:1em}a{background-color:transparent}abbr[title]{border-bottom:none;text-decoration:underline;text-decoration:underline dotted}b,strong{font-weight:bolder}code,kbd,samp{font-family:monospace, monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative;vertical-align:baseline}sub{bottom:-0.25em}sup{top:-0.5em}img{border-style:none}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;line-height:1.15;margin:0}button,input{overflow:visible}button,select{text-transform:none}[type="button"],[type="reset"],[type="submit"],button{-webkit-appearance:button}[type="button"]::-moz-focus-inner,[type="reset"]::-moz-focus-inner,[type="submit"]::-moz-focus-inner,button::-moz-focus-inner{border-style:none;padding:0}[type="button"]:-moz-focusring,[type="reset"]:-moz-focusring,[type="submit"]:-moz-focusring,button:-moz-focusring{outline:1px dotted ButtonText}fieldset{padding:0.35em 0.75em 0.625em}legend{box-sizing:border-box;color:inherit;display:table;max-width:100%;padding:0;white-space:normal}progress{vertical-align:baseline}textarea{overflow:auto}[type="checkbox"],[type="radio"]{box-sizing:border-box;padding:0}[type="number"]::-webkit-inner-spin-button,[type="number"]::-webkit-outer-spin-button{height:auto}[type="search"]{-webkit-appearance:textfield;outline-offset:-2px}[type="search"]::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}details{display:block}summary{display:list-item}template{display:none}[hidden]{display:none}

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
    }

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
             
    h1,h2,h3,h4,h5{
      color: var(--xrsh-gray);
    }
    h1      {  font-size: var(--xrsh-font-size-3); }
    h2,h3,h4{  font-size: var(--xrsh-font-size-2); }

    .modal{
      background: #f0f0f0;
      padding: 20px 20px 10px 20px;
      border-radius: 15px;
      display: inline-block;
      position:relative;
      z-index:50;
    }

    button,.btn,input[type=submit]{
      border-radius:7px;
      background: var(--xrsh-primary);
      color: var(--xrsh-primary-fg); 
      transition:0.3s;
      padding: 10px;
      font-weight: bold;
      border-block: none;
      border: none;
      cursor:pointer;
    }
    button:hover,.btn:hover,input[type=submit]:hover{
      filter: brightness(1.5);
    }

    button.close{
      background: transparent;
      color: #000;
      display: inline-block;
      float: right;
      font-size: 20px;
      padding: 0;
      transform: translate(-4px,-3px) scale(1.3,1);
      margin-left: 20px;
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
}

  </style>
`
