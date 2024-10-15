ISOTerminal.prototype.redirectConsole = function(handler){
   const log = console.log;
   const dir = console.dir;
   const err = console.error;
   const warn = console.warn;
   console.log = (...args)=>{
       const textArg = args[0];
       handler(textArg+'\n');
       log.apply(log, args);
   };
   console.error = (...args)=>{
       const textArg = args[0]
       handler( textArg+'\n', '\x1b[31merror\x1b[0m');
       err.apply(log, args);
   };
   console.dir = (...args)=>{
       const textArg = args[0]
       handler( JSON.stringify(textArg,null,2)+'\n');
       dir.apply(log, args);
   };
   console.warn = (...args)=>{
       const textArg = args[0]
       handler(textArg+'\n','\x1b[38;5;208mwarn\x1b[0m');
       err.apply(log, args);
   };

}

ISOTerminal.addEventListener('emulator-started', function(){

  this.redirectConsole( (str,prefix) => {
    let finalStr = ""
    prefix = prefix ? prefix+' ' : ' '
    str.trim().split("\n").map( (line) => {
      finalStr += '\x1b[38;5;165m/dev/browser: \x1b[0m'+prefix+line+'\n'
    })
    this.emit('fs9p.append_file', ["/dev/browser/console",finalStr])
  })

  window.addEventListener('error', function(event) {
    if( event.filename ){
      console.error(event.filename+":"+event.lineno+":"+event.colno)
      console.error(event.message);
      console.error(event.error);
    }else console.error(event)
  });

  window.addEventListener('unhandledrejection', function(event) {
    console.error(event);
  });

})
