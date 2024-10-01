ISOTerminal.addEventListener('emulator-started', function(e){
  return console.log("TODO: autorestore.js")
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
        this.emulator.restore_state(state)
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
      } 
    })

    this.save = async () => {
      const state = await this.emulator.save_state() 
      console.log( String(this.convert.arrayBufferToBase64(state)).substr(0,5) )
      localforage.setItem("state", this.convert.arrayBufferToBase64(state) )
    }

    window.addEventListener("beforeunload", function (e) {
      var confirmationMessage = "Sure you want to leave?\nTIP: enter 'save' to continue this session later";
      (e || window.event).returnValue = confirmationMessage; //Gecko + IE
      return confirmationMessage;                            //Webkit, Safari, Chrome
    });

  })
}

