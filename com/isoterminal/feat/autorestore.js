ISOTerminal.addEventListener('emulator-started', function(e){
  this.autorestore(e)
})

ISOTerminal.prototype.convert = {

  arrayBufferToBase64: function(buffer){
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
      return window.btoa(binary);
  },

  base64ToArrayBuffer: function(base64) {
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);

      for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
  }
}

ISOTerminal.prototype.autorestore = async function(e){

  localforage.setDriver([
  localforage.INDEXEDDB,
  localforage.WEBSQL,
  localforage.LOCALSTORAGE
  ]).then( () => {

    localforage.getItem("state", (err,stateBase64) => {
      if( !err && confirm('continue last session?') ){
        this.noboot = true // see feat/boot.js
        state = this.convert.base64ToArrayBuffer( stateBase64 )
        this.emulator.restore_state(state)
        this.emit('postReady',e)
        setTimeout( () => {
          this.emit('ready',e)
          this.send("alert last session restored\n")
        }, 500 )
      } 
    })

    this.save = async () => {
      const state = await this.emulator.save_state() 
      console.log( String(this.convert.arrayBufferToBase64(state)).substr(0,5) )
      localforage.setItem("state", this.convert.arrayBufferToBase64(state) )
    }
  })
}

