/**
 * ## [require](com/require('').js)
 *
 * automatically requires dependencies or missing components
 * 
 * ```javascript
 * await AFRAME.utils.require( this.dependencies )               (*) autoload missing components
 * await AFRAME.utils.require( this.el.getAttributeNames() )     (*) autoload missing components
 * await AFRAME.utils.require({foo: "https://foo.com/aframe/components/foo.js"},this)
 * await AFRAME.utils.require(["./app/foo.js","foo.css"],this)
 * ```
 * 
 * > (*) = prefixes baseURL AFRAME.utils.require.baseURL ('./com/' e.g.)
 */ 
AFRAME.utils.require = function(arr_or_obj,opts){
  opts            = opts || {}
  let i           = 0
  let deps        = []
  let packagesArr = arr_or_obj.map ? arr_or_obj : Object.values(arr_or_obj)

  const parseURI = function(uri){
    return {
      id:        String(uri).split("/").pop(),                      // 'a/b/c/mycom.js' => 'mycom.js'
      component: String(uri).split("/").pop().replace(/\..*/,''),   // 'mycom.js' => 'mycom'
      type:      String(uri).split(".").pop()                       // 'mycom.js' => 'js'
    }
  }

  packagesArr.map( (package) => {
    try{
      package = package.match(/\./) ? package : AFRAME.utils.require.baseURL+package+".js"
      let id = Object.keys(arr_or_obj)[i++]
      if( id.match(/^[0-9]/) ){ // if AFRAME component.dependency -array was passed
        id = parseURI(package).component 
      }

      // prevent duplicate requests
      if( AFRAME.utils.require.required[id] ) return // already loaded before
      AFRAME.utils.require.required[id] = true

      if( !document.body.querySelector(`script#${id}`) &&
          !document.body.querySelector(`link#${id}`) ){
        let {type} = parseURI(package)
        let p = new Promise( (resolve,reject) => {
          switch(type){
            case "js":  let script = document.createElement("script")
                        script.id  = id
                        script.onload  = () => setTimeout( () => resolve(id), 50 )
                        script.onerror = (e) => reject(e)
                        script.src = package
                        document.body.appendChild(script)
                        break;
            case "css": let link = document.createElement("link")
                        link.id  = id
                        link.href = package
                        link.rel = 'stylesheet'
                        link.onload = () => setTimeout( () => resolve(id), 50 )
                        link.onerror = (e) => reject(e)
                        document.body.appendChild(link)
                        break;
          }
        })
        deps.push(p)
      }
    }catch(e){ 
      console.error(`package ${package} could not be retrieved..aborting :(`); 
      console.dir(e)
      if( opts.halt ) throw e; 
    }
  })
  return Promise.all(deps)
}

AFRAME.utils.require.required   = {}

AFRAME.utils.require.baseURL = './com/'


//// this component will scan the DOM for missing components and lazy load them
//AFRAME.registerSystem('require',{
//
//  init: function(){
//    this.components = []
//    // observe HTML changes in <a-scene>
//    observer = new MutationObserver( (a,b) => this.getMissingComponents(a,b) )
//    observer.observe( this.sceneEl, {characterData: false, childList: true, attributes: false});
//  },
//
//  getMissingComponents: function(mutationsList,observer){
//    let els         = [...this.sceneEl.getElementsByTagName("*")]
//    let seen        = []
//
//    els.map( async (el) => {
//      let attrs    = el.getAttributeNames()
//                       .filter( (a) => a.match(/(^aframe-injected|^data-aframe|^id$|^class$|^on)/) ? null : a )
//      for( let attr in attrs ){
//        let component = attrs[attr]
//        if( el.components && !el.components[component] ){
//          console.info(`require.js: lazy-loading missing <${el.tagName.toLowerCase()} ${component} ... > (TODO: fix selectors in schema)`)
//          // require && remount
//          try{
//            await AFRAME.utils.require([component])
//            el.removeAttribute(component)
//            el.setAttribute(component, el.getAttribute(component) )
//          }catch(e){ } // give up, normal AFRAME behaviour follows
//        }
//      }
//    })
//  }
//
//})
