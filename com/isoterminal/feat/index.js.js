ISOTerminal.addEventListener('init', function(){

  this.addEventListener('emulator-started', function(e){

    const emulator = this.emulator

    // unix to js device
    this.readFromPipe( '/mnt/index.js', async (data) => {
      const buf = await emulator.read_file("index.js")
      const decoder = new TextDecoder('utf-8');
      const js = decoder.decode(buf)
      try{
        let $root = document.querySelector("script#root")
        if( !$root ){                          
          $root = document.createElement("script")
          $root.id = "root"               
          document.body.appendChild($root)
        }                                                            
        $root.innerHTML = js
      }catch(e){ 
        console.error(e)
      }
    })
  
  })  

})

