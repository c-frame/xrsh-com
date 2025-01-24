if( typeof emulator != 'undefined' ){

}else{

  ISOTerminal.addEventListener('ready', function(e){

    function getMimeType(file) {
      const mimeTypes = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        mp4: 'video/mp4',
        gif: 'image/gif',
      };

      const extension = file.split('.').pop().toLowerCase();
      return mimeTypes[extension] || 'application/octet-stream'; // Fallback
    }

    // listen for http request to the filesystem ( file://host/path )
    xhook.before( (request,callback) => {
      console.log(request.url)
      if (request.url.match(/^\/mnt\/.*/) ){
        let response
        let file     = request.url.replace(/^\/mnt\//,'')
        let mimetype = getMimeType(file)
        this.worker.read_file_world(file)
        .then( (data) => {
          if( data == null ) throw `/mnt/${file} does not exist in ISO filesystem`
          let blob     = new Blob( [data], {type: getMimeType(file) })  // wrap Uint8Array into array
          response = {
              headers: new Headers({ 'Content-Type': getMimeType(file) }),
              data,
              url: file,
              status: 200,
              blob: () => new Promise( (resolve,reject) => resolve(blob) ),
              arrayBuffer: blob.arrayBuffer
          }
          console.log("serving from iso filesystem: "+file)
          console.log("*TODO* large files being served partially")
          callback(response)
        })
        .catch( (e) => {
            console.error(e)
          response = new Response()
          response.status = 404
          callback(response)
        })
        return
      }else{
        callback()
      }
    })

  })
}   
