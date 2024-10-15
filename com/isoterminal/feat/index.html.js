
if( typeof emulator != 'undefined' ){
  // inside worker-thread

  this.listenIndexHTML = () => {
    const file = "dev/browser/html"
    emulator.readFromPipe( file, async (data) => {
      const buf = await emulator.read_file( file )
      const decoder = new TextDecoder('utf-8');
      const html = decoder.decode(buf).replace(/^#!\/bin\/html/,'') // remove leftover shebangs if any
      try{
        this.postMessage({event:'runHTML',data:[html]})
      }catch(e){ 
        console.error(file)
        console.error(e)
      }
    })
  }
    

}else{
  // inside browser-thread
  
  ISOTerminal.addEventListener('emulator-started', function(){
    this.addEventListener('ready', async () => {
      this.worker.listenIndexHTML()
    })
  })
  
  ISOTerminal.prototype.runHTML = function(html){
    let $scene = document.querySelector("a-scene")
    let $root = document.querySelector("a-entity#root")
    if( !$root ){                          
      $root = document.createElement("a-entity")
      $root.id = "root"               
      $scene.appendChild($root)
    }                                                            
    console.log(html)
    $root.innerHTML = html
  }

}
