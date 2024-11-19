if( typeof emulator != 'undefined' ){

}else{

  ISOTerminal.addEventListener('ready', function(e){

    // listen for http request to the filesystem ( file://host/path )
    xhook.before( (request,callback) => {

      if (request.url.match(/^file:\/\/xrsh\/mnt\/.*/) ){
        let response
        let file     = request.url.replace(/^file:\/\/xrsh\/mnt\//,'')
        this.worker.read_file_world(file)
        .then( (data) => {
          response = new Response( new Blob( [data] ) ) // wrap Uint8Array into array
          response.status = 200
          callback(response)
        })
        .catch( (e) => {
          response = new Response()
          response.status = 404
          callback(response)
        })
        return
      }
      callback()
    })

  })
}   
