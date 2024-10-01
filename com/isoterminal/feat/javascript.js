if( typeof emulator != 'undefined' ){
  // inside worker-thread

  // unix to js device
  emulator.readFromPipe( 'dev/browser/js', async (data) => {
    const convert = ISOTerminal.prototype.convert
    const buf     = await this.emulator.read_file("dev/browser/js")
    const script  = convert.Uint8ArrayToString(buf)
    let PID="?"
    try{
      if( script.match(/^PID/) ){ 
        PID = script.match(/^PID=([0-9]+);/)[1] 
      }
      this.postMessage({event:'javascript-eval',data:{script,PID}})
    }catch(e){ 
      console.error(e)
    }
  })

}else{
  // inside browser-thread
  
  ISOTerminal.addEventListener('javascript-eval', function(e){
    const {script,PID} = e.detail
    let res = (new Function(`${script}`))()
    if( res && typeof res != 'string' ) res = JSON.stringify(res,null,2)
    // write output to 9p with PID as filename
    // *FIXME* not flexible / robust
    this.emit('emulator.create_file', [PID, this.convert.toUint8Array(res)] )
  })

}
