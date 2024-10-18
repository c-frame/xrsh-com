if( typeof emulator != 'undefined' ){
  // inside worker-thread
  
  this['emulator.restore_state'] = async function(data){ 
    await emulator.restore_state(data)
    console.log("restored state")
    this.postMessage({event:"state_restored",data:false})
  }
  this['emulator.save_state'] = async function(){ 
    console.log("saving session")
    let state = await emulator.save_state()
    this.postMessage({event:"state_saved",data:state},[state])
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
            // simulate / fastforward boot events
            this.postBoot( () => {
              this.send("l\n") 
              this.send("hook wakeup\n")
            })
          })

          this.worker.postMessage({event:'emulator.restore_state',data:state})
        } 
      })

      this.save = async () => {
        const state = await this.worker.postMessage({event:"emulator.save_state",data:false})
      }

      this.addEventListener('state_saved', function(e){
        const state = e.detail
        localforage.setItem("state", this.convert.arrayBufferToBase64(state) )
        console.log("state saved")
      })

      window.addEventListener("beforeunload", function (e) {
        var confirmationMessage = "Sure you want to leave?\nTIP: enter 'save' to continue this session later";
        (e || window.event).returnValue = confirmationMessage; //Gecko + IE
        return confirmationMessage;                            //Webkit, Safari, Chrome
      });

    })
  }

}
