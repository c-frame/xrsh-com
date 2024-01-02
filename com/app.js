// this is a highlevel way of loading buildless 'apps' (a collection of js components)

AFRAME.registerComponent('app', {
  schema:{
    "uri":{ type:"string"}
  },

  events:{
    "app:ready": function(){
      let {id,component,type} = this.parseAppURI(this.data.uri)
      let entity = document.createElement("a-entity")
      this.el.setAttribute(component,this.data)
    }
  },

  init: function() { 
    let {id,component,type} = this.parseAppURI(this.data.uri)
    if( AFRAME.components[component] || document.head.querySelector(`script#${id}`) ) this.el.emit('app:ready',{})
    else this.require([ this.data.uri ], 'app:ready')
  },

  parseAppURI: AFRAME.AComponent.prototype.parseAppURI = function(uri){
    return {
      id:        String(uri).split("/").pop(),                     // 'a/b/c/mycom.js' => 'mycom.js'
      component: String(uri).split("/").pop().split(".js").shift(), // 'mycom.js' => 'mycom'
      type:      String(uri).split(".").pop()                      // 'mycom.js' => 'js'
    }
  },

  // usage: require(["./app/foo.js"])
  //        require({foo: "https://foo.com/foo.js"})
  require: AFRAME.AComponent.prototype.require = function(packages,readyEvent){
    let deps = []
    if( !packages.map ) packages = Object.values(packages)
    packages.map( (package) => {
      let id = package.split("/").pop()
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
    return initComponent.apply(this,arguments)
  }
}( AFRAME.AComponent.prototype.initComponent)


