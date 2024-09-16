ISOTerminal.addEventListener('init', function(){

  this.addEventListener('emulator-started', function(e){

    const emulator = this.emulator

    // unix to js device
    this.readFromPipe( '/mnt/js', async (data) => {
      const buf = await emulator.read_file("js")
      const decoder = new TextDecoder('utf-8');
      const script = decoder.decode(buf)
      let PID="?"
      try{
        if( script.match(/^PID/) ){ 
          PID = script.match(/^PID=([0-9]+);/)[1] 
        }
        let res = (new Function(`${script}`))()
        if( res && typeof res != 'string' ) res = JSON.stringify(res,null,2)
        // write output to 9p with PID as filename
        // *FIXME* not flexible / robust
        emulator.create_file(PID, this.toUint8Array(res) )
      }catch(e){ 
        console.error(e)
      }
    })
  
  })  

})

