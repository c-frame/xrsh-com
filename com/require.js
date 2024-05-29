// usage: 
//
// await AFRAME.utils.require( this.dependencies )               (*) autoload missing components
// await AFRAME.utils.require( this.el.getAttributeNames() )     (*) autoload missing components
// await AFRAME.utils.require({foo: "https://foo.com/aframe/components/foo.js"},this)
// await AFRAME.utils.require(["./app/foo.js","foo.css"],this)
// 
// (*) = prefixes baseURL AFRAME.utils.require.baseURL ('./com/' e.g.)
//
AFRAME.utils.require = function(arr_or_obj,opts){
  opts            = opts || {}
  let i           = 0
  let deps        = []
  AFRAME.required = AFRAME.required || {}
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
      let id = Object.keys(arr_or_obj)[i]
      if( id == i ) id = parseURI(package).component 
      // prevent duplicate requests
      if( AFRAME.required[id] ) return // already loaded before
      AFRAME.required[id] = true

      if( !document.head.querySelector(`script#${id}`) ){
        let {type} = parseURI(package)
        let p = new Promise( (resolve,reject) => {
          switch(type){
            case "js":  let script = document.createElement("script")
                        script.id  = id
                        script.onload  = () => setTimeout( () => resolve(id), 50 )
                        script.onerror = (e) => reject(e)
                        script.src = package
                        document.head.appendChild(script)
                        break;
            case "css": let link = document.createElement("link")
                        link.id  = id
                        link.href = package
                        link.rel = 'stylesheet'
                        document.head.appendChild(link)
                        resolve(id)
                        break;
          }
        })
        deps.push(p)
      }
    }catch(e){ 
      console.error(`package ${package} could not be retrieved..aborting :(`); 
      if( opts.halt ) throw e; 
    }
    i++
  })
  return Promise.all(deps)
}

AFRAME.utils.require.baseURL = './com/'
