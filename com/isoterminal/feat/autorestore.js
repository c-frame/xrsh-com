if( typeof emulator != 'undefined' ){
  // inside worker-thread
  
  this['emulator.restore_state'] = async function(){ 
    await emulator.restore_state.apply(emulator, arguments[0])   
    this.postMessage({event:"state_restored",data:false})
  }
  this['emulator.save_state'] = async function(){ 
    let state = await emulator.save_state.apply(emulator, arguments[0])   
    this.postMessage({event:"state_saved",data:state})
  }


}else{
  // inside browser-thread
  ISOTerminal.addEventListener('emulator-started', function(e){
    this.autorestore(e)
  })

  ISOTerminal.prototype.autorestore = async function(e){

    localforage.setDriver([
      localforage.INDEXEDDB,
      localforage.WEBSQL,
      localforage.LOCALSTORAGE
    ]).then( () => {

      localforage.getItem("state", async (err,stateBase64) => {
        if( stateBase64 && !err && confirm('continue last session?') ){
          this.noboot = true // see feat/boot.js
          state = this.convert.base64ToArrayBuffer( stateBase64 )

          this.addEventListener('state_restored', function(){
            this.emit('postReady',e)
            setTimeout( () => {
              this.emit('ready',e)
              // press CTRL+a l  (=gnu screen redisplay)
              setTimeout( () => this.send("l\n"),400 ) 
              // reload index.js
              this.emulator.read_file("root/index.js")
              .then( this.convert.Uint8ArrayToString )
              .then( this.runJavascript )
              .catch( console.error )
              // reload index.html
              this.emulator.read_file("root/index.html")
              .then( this.convert.Uint8ArrayToString )
              .then( this.runHTML )
              .catch( console.error )

            }, 500 )
          })

          this.worker.postMessage({event:'emulator.restore_state',data:state})
        } 
      })

      this.save = async () => {
        const state = await this.worker.postMessage({event:"save_state",data:false})
        console.log( String(this.convert.arrayBufferToBase64(state)).substr(0,5) )
        localforage.setItem("state", this.convert.arrayBufferToBase64(state) )
      }

      this.addEventListener('state_saved', function(data){
          debugger
      })

      window.addEventListener("beforeunload", function (e) {
        var confirmationMessage = "Sure you want to leave?\nTIP: enter 'save' to continue this session later";
        (e || window.event).returnValue = confirmationMessage; //Gecko + IE
        return confirmationMessage;                            //Webkit, Safari, Chrome
      });

    })
  }

}
