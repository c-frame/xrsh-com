importScripts("libv86.js");
importScripts("ISOTerminal.js")  // we don't instance it again here (just use its functions)

this.runISO = function(opts){
  if( opts.cdrom   && !opts.cdrom.url.match(/^http/) ) opts.cdrom.url   = "../../"+opts.cdrom.url 
  if( opts.bzimage && !opts.cdrom.url.match(/^http/) ) opts.bzimage.url = "../../"+opts.bzimage.url 

  console.dir(opts)
  let emulator = this.emulator = new V86(opts); 
  console.log("worker:started emulator")

  // event forwarding

  emulator.add_listener("serial0-output-byte", function(byte){
    ISOTerminal.prototype.bufferOutput(byte, (str) => { // we buffer to prevent framerate dropping
      if( !str ) return
      this.postMessage({event:"serial0-output-string",data:str});
    }, opts.bufferLatency )
  }.bind(this));

  emulator.add_listener("serial1-output-byte", function(byte){
    ISOTerminal.prototype.bufferOutput(byte, (str) => { // we buffer to prevent framerate dropping
      if( !str ) return
      this.postMessage({event:"serial1-output-string",data:str});
    }, opts.bufferLatency )
  }.bind(this));

  emulator.add_listener("serial2-output-byte", function(byte){
    ISOTerminal.prototype.bufferOutput(byte, (str) => { // we buffer to prevent framerate dropping
      if( !str ) return
      this.postMessage({event:"serial2-output-string",data:str});
    }, opts.bufferLatency )
  }.bind(this));

  emulator.add_listener("emulator-started", function(){
    importScripts("feat/9pfs_utils.js")
    this.postMessage({event:"emulator-started",data:false});
  }.bind(this));

  /* 
   * forward events/functions so non-worker world can reach them
   */
  this['emulator.create_file']   = function(){ emulator.create_file.apply(emulator, arguments[0]) }
  this['emulator.read_file']     = function(){ emulator.read_file.apply(emulator, arguments[0])   }

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
}
/* 
 * forward events/functions so non-worker world can reach them
 */

this['serial0-input'] = function(c){ this.emulator.bus.send( 'serial0-input', c) } // to /dev/ttyS0
this['serial1-input'] = function(c){ this.emulator.bus.send( 'serial1-input', c) } // to /dev/ttyS1
this['serial2-input'] = function(c){ this.emulator.bus.send( 'serial2-input', c) } // to /dev/ttyS2

this.onmessage = function(e){
  let {event,data} = e.data
  if( this[event] ) this[event](data)
}
