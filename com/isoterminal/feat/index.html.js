
if( typeof emulator != 'undefined' ){
  // inside worker-thread

  // unix to js device
  this.emulator.readFromPipe( 'root/index.html', async (data) => {
    const buf = await emulator.read_file("root/index.html")
    const decoder = new TextDecoder('utf-8');
    const html = decoder.decode(buf).replace(/^#!\/bin\/html/,'') // remove leftover shebangs if any
    try{
      this.postMessage({event:'runHTML',data:[html]})
    }catch(e){ 
      console.error(e)
    }
  })
    

}else{
  // inside browser-thread
  
  ISOTerminal.prototype.runHTML = function(html){
    let $scene = document.querySelector("a-scene")
    let $root = document.querySelector("a-entity#root")
    if( !$root ){                          
      $root = document.createElement("a-entity")
      $root.id = "root"               
      $scene.appendChild($root)
    }                                                            
    $root.innerHTML = html
  }

}
