//ISOTerminal.prototype.exec(cmd_array,stdin){
//  // exec(['lua'] "print \"hello\") ---> cat /dev/browser/js/stdin | lua > /dev/browser/js/stdout
//}

ISOTerminal.prototype.serial_input = undefined; // can be set to 0,1,2,3 to define stdinput tty (xterm plugin)

ISOTerminal.prototype.exec = function(shellscript){
  //let ts = String(Date.now())+".job"
  //this.emulator.create_file(ts, this.toUint8Array(shellscript) )
  this.send(shellscript+"\n",1)
}

ISOTerminal.prototype.send = function(str, ttyNr){
  if( !ttyNr ) ttyNr = this.serial_input
  if( !ttyNr ){
    if( this.emulator.serial_adapter ){
      this.emulator.serial_adapter.term.paste(str)
    }else this.emulator.keyboard_send_text(str) // vga screen
  }else{
    this.convert.toUint8Array( str ).map( (c) => this.emulator.bus.send(`serial${ttyNr}-input`, c ) )
  }
}

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
  },

  toUint8Array: function(str) {
    str = String(str) || String("")
    // Create a new Uint8Array with the same length as the input string
    const uint8Array = new Uint8Array(str.length);
    
    // Iterate over the string and populate the Uint8Array
    for (let i = 0; i < str.length; i++) {
        uint8Array[i] = str.charCodeAt(i);
    }
    return uint8Array;
  },

  Uint8ArrayToString: function(arr){
    const decoder = new TextDecoder('utf-8'); // Specify encoding
    return decoder.decode(arr);
  }
}

ISOTerminal.prototype.runISO = function(opts){

  let me = this
  this.opts = {...this.opts, ...opts}
  let image = {}
  if( opts.iso.match(/\.iso$/) ) image.cdrom   = { url: opts.iso }
  if( opts.iso.match(/\.bin$/) ) image.bzimage = { url: opts.iso }

  opts = { ...image,
    uart1:true, // /dev/ttyS1
    uart2:true, // /dev/ttyS2
    uart3:true, // /dev/ttyS3
    wasm_path:        "com/isoterminal/v86.wasm",
    memory_size:      opts.memory * 1024 * 1024,
    vga_memory_size:  2 * 1024 * 1024,
    screen_container: opts.dom,
    //serial_container: opts.dom,
    bios: {
      url: "com/isoterminal/bios/seabios.bin",
    },
    vga_bios: {
      url: "com/isoterminal/bios/vgabios.bin",
      //urg|: "com/isoterminal/bios/VGABIOS-lgpl-latest.bin",
    },
    network_relay_url: "wss://relay.widgetry.org/",
    cmdline: "rw root=host9p rootfstype=9p rootflags=trans=virtio,cache=loose modules=virtio_pci tsc=reliable init_on_freg|=on vga=ask", //vga=0x122",
    //bzimage_initrd_from_filesystem: true,
    //filesystem: {
    //          baseurl: "com/isoterminal/v86/images/alpine-rootfs-flat",
    //          basefs:  "com/isoterminal/v86/images/alpine-fs.json",
    //      },
    //screen_dummy: true,
    //disable_jit: false,
    filesystem: {},
    autostart: true,
  };
  this.emit('runISO',opts)
  let emulator = this.emulator = new V86(opts)

  const loading = [
    'loading quantum bits and bytes',
    'preparing quantum flux capacitors',
    'crunching peanuts and chakras',
    'preparing parallel universe',
    'loading quantum state fluctuations',
    'preparing godmode',
    'loading cat pawns and cuteness',
    'beaming up scotty',
    'still faster than Windows update',
    'loading a microlinux',
    'figuring out meaning of life',
    'Aligning your chakras now',
    'Breathing in good vibes',
    'Finding inner peace soon',
    'Centering your Zen energy',
    'Awakening third eye powers',
    'Tuning into the universe',
    'Balancing your cosmic karma',
    'Stretching time and space',
    'Recharging your soul battery',
    'Transcending earthly limits'
  ]

  let loadmsg = loading[ Math.floor(Math.random()*1000) % loading.length ]
  this.emit('status',loadmsg)

  // replace welcome message https://github.com/copy/v86/blob/3c77b98bc4bc7a5d51a2056ea73d7666ca50fc9d/src/browser/serial.js#L231
  let welcome = "This is the serial console. Whatever you type or paste here will be sent to COM1"
  let motd = "\r[38;5;129m" 
  let msg  = `${loadmsg}, please wait..`
  while( msg.length < welcome.length ) msg += " "
  msg += "\n"
  motd += msg+"\033[0m"

  emulator.bus.register("emulator-started", async (e) => {
    this.emit('emulator-started',e)

    if( emulator.serial_adapter ){
      emulator.serial_adapter.term.clear()
      emulator.serial_adapter.term.write(motd)
    }


    if( me.opts.overlayfs ){
      fetch(me.opts.overlayfs)
      .then( (f) => {
        f.arrayBuffer().then( (buf) => {
          emulator.create_file('overlayfs.zip', new Uint8Array(buf) )
        })
      })
    }

    let line = ''
    let ready = false
    emulator.add_listener(`serial0-output-byte`, async (byte) => {
        this.emit('${this.serial}-output-byte',byte)
        var chr = String.fromCharCode(byte);
        if(chr < " " && chr !== "\n" && chr !== "\t" || chr > "~")
        {
            return;
        }

        if(chr === "\n")
        {
            var new_line = line;
            line = "";
        }
        else if(chr >= " " && chr <= "~")
        {
            line += chr;
        }
        if( !ready && line.match(/^(\/ #|~%|\[.*\]>)/) ){
          this.emit('postReady',e)
          setTimeout( () => this.emit('ready',e), 500 )
          ready = true
        }
    });    
  });

}

ISOTerminal.prototype.readFromPipe = function(filename,cb){

  this.emulator.add_listener("9p-write-end", async (opts) => {
    if ( opts[0] == filename.replace(/.*\//,'') ){
      const buf = await this.emulator.read_file("console.tty")
      cb( this.convert.Uint8ArrayToString(buf) )
    }
  })

}
