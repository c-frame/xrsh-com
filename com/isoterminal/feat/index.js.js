if( typeof emulator != 'undefined' ){
  // inside worker-thread

  // unix to js device
  this.emulator.readFromPipe( 'root/index.js', async (data) => {
    const buf = await emulator.read_file("root/index.js")
    const decoder = new TextDecoder('utf-8');
    const js = decoder.decode(buf).replace(/^#!\/bin\/js/,'') // remove leftover shebangs if any
    try{
      this.postMessage({event:'runJavascript',data:[js]})
    }catch(e){ 
      console.error(e)
    }
  })
    

}else{
  // inside browser-thread

  ISOTerminal.prototype.runJavascript = function(js){
    let $root = document.querySelector("script#root")
    if( !$root ){                          
      $root = document.createElement("script")
      $root.id = "root"               
      document.body.appendChild($root)
    }                                                            
    $root.innerHTML = js
  }

}
