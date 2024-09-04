ISOTerminal.addEventListener('ready', function(){
  this.addEventListener('file-read', (e) => {
    const data = e.detail
    if( data.file == 'index.html'){
      data.promise = new Promise( (resolve,reject) => {
        resolve( this.toUint8Array(document.documentElement.outerHTML) )
      })
    }
  })
})
