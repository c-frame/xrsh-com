ISOTerminal.addEventListener('init', function(){

  this.addEventListener('emulator-started', function(e){

    const emulator = this.emulator

    // unix to js device
    this.readFromPipe( '/mnt/index.html', async (data) => {
      const buf = await emulator.read_file("index.html")
      const decoder = new TextDecoder('utf-8');
      const html = decoder.decode(buf)
      try{
        this.runHTML(html)
      }catch(e){ 
        console.error(e)
      }
    })
  
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
  $root.innerHTML = html
}
