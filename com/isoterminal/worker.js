importScripts("libv86.js");
importScripts("ISOTerminal.js")  // we don't instance it again here (just use its functions)

this.runISO = async function(opts){
  this.opts = opts
 if( opts.debug ) console.dir(opts)

  if( opts.cdrom   && !opts.cdrom.url.match(/^http/) ) opts.cdrom.url   = "../../"+opts.cdrom.url 
  if( opts.bzimage && !opts.cdrom.url.match(/^http/) ) opts.bzimage.url = "../../"+opts.bzimage.url 

  let emulator = this.emulator = new V86(opts); 
  console.log("[worker.js] started emulator")

  // event forwarding
  emulator.buf0 = {}
  emulator.buf1 = {}
  emulator.buf2 = {}

  emulator.add_listener("serial0-output-byte", function(byte){
    ISOTerminal.prototype.bufferOutput(byte, (str) => { // we buffer to prevent framerate dropping
      if( !str ) return
      this.postMessage({event:"serial0-output-string",data:str});
    }, opts.bufferLatency, emulator.buf0 )
  }.bind(this));

  emulator.add_listener("serial1-output-byte", function(byte){
    ISOTerminal.prototype.bufferOutput(byte, (str) => { // we buffer to prevent framerate dropping
      if( !str ) return
      this.postMessage({event:"serial1-output-string",data:str});
    }, opts.bufferLatency, emulator.buf1 )
  }.bind(this));

  emulator.add_listener("serial2-output-byte", function(byte){
    ISOTerminal.prototype.bufferOutput(byte, (str) => { // we buffer to prevent framerate dropping
      if( !str ) return
      this.postMessage({event:"serial2-output-string",data:str});
    }, opts.bufferLatency, emulator.buf2 )
  }.bind(this));

  emulator.add_listener("emulator-started", function(){
    importScripts("feat/9pfs_utils.js")
    this.postMessage({event:"emulator-started",data:false});
    if( opts.img ) this.restoreImage(opts)
  }.bind(this));

  /* 
   * forward events/functions so non-worker world can reach them
   */
 
  // stripping '/mnt' is needed (the 9p mounted fs does not know about this)
  const stripMountDir  = (arr) => {
    arr[0] = String(arr[0]).replace(/^\/mnt/,'')
    return arr
  }
  this.create_file          = async function(){ return emulator.create_file.apply(emulator, stripMountDir(arguments[0]) ) }
  this.create_file_from_url = async function(){ return emulator.fs9p.create_file_from_url.apply(emulator, stripMountDir(arguments[0]) ) }
  this.read_file            = async function(){ return emulator.read_file.apply(emulator, stripMountDir(arguments[0]) )   }
  this.read_file_world      = async function(){ return emulator.fs9p.read_file_world.apply(emulator.fs9p, stripMountDir(arguments[0]) )   }
  this.append_file          = async function(){ emulator.fs9p.append_file.apply(emulator.fs9p, stripMountDir(arguments[0])) }
  this.update_file          = async function(){ emulator.fs9p.update_file.apply(emulator.fs9p, stripMountDir(arguments[0])) }

  // filename will be read from 9pfs: "/mnt/"+filename
  emulator.readFromPipe = function(filename,cb){
    emulator.add_listener("9p-write-end", async (opts) => {
      if ( opts[0] == filename.replace(/.*\//,'') ){
        cb()
      }
    })
  }

  importScripts("feat/javascript.js")
  importScripts("feat/index.html.js")
  importScripts("feat/autorestore.js")

  if( opts.overlayfs ) await this.addOverlayFS(opts)

}
/* 
 * forward events/functions so non-worker world can reach them
 */

this['serial0-input'] = function(c){ emulator.bus.send( 'serial0-input', c) } // to /dev/ttyS0
this['serial1-input'] = function(c){ emulator.bus.send( 'serial1-input', c) } // to /dev/ttyS1
this['serial2-input'] = function(c){ emulator.bus.send( 'serial2-input', c) } // to /dev/ttyS2

this.onmessage = async function(e){
  let {event,data} = e.data
  if( this[event] ){
    if( this.opts?.debug ) console.log(`[worker.js] this.${event}(${JSON.stringify(data).substr(0,60)})`)
    try{
      let result = await this[event](data)
      if( data.promiseId ){ // auto-callback to ISOTerminal.worker.promise(...)
        this.postMessage({event,data: {...data,result}})
      } 
    }catch(e){
      if( data.promiseId ){ // auto-callback to ISOTerminal.worker.promise(...)
        this.postMessage({event,data: {...data,error:e}})
      } 
    }
  }
}

this.addOverlayFS = async function(opts){
  return new Promise( (resolve,reject) => {
    // OVERLAY FS *FIXME*
    if( opts.overlayfs ){
      fetch(opts.overlayfs)
      .then( (f) => {
        f.arrayBuffer().then( (buf) => {
          let filename = opts.overlayfs.match(/\.zip$/) ? 'overlayfs.zip' : '.env' 
          this.emulator.create_file( filename, new Uint8Array(buf) )
        })
      })
    }
  })
}

this.restoreImage = function(opts){

  this.postMessage({event:"serial0-output-string",data:`\n\r[!] loading session image:\n\r[!] ${opts.img}\n\r[!] please wait...internet speed matters here..\n`})

  fetch( opts.img )
  .then( (res) => {
    this.postMessage({event:"serial0-output-string",data:`\r[v] image downloaded..restoring..\n\r`})
    return res
  })
  .then( (res) => res.arrayBuffer() )
  .then( async (buf) => {
    await this.emulator.restore_state(buf) 
    this.postMessage({event:"serial0-output-string",data:`[v] restored\n\r`})

  })
  .catch( console.error )
}
