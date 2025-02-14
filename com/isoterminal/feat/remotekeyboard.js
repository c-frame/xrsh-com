ISOTerminal.prototype.enableRemoteKeyboard = function(opts){

    let service = {
      ready: false,
      reset: (service) => {
        service.ip = localStorage.getItem("keyboardIP") || ""
        service.ip = service.ip.trim()
        service.state = "need-ip"
        service.attempts = 0
      },
      init: function init( mainmenu ){ 
        this.emit('status',"")
        this.emit('enable-console',{stdout:true})
        service.reset(service)
        setTimeout( () => {
          const clearScreen = "[1;1H[2J\r"
          this.send(clearScreen);
          this.send(`\n\rfor instructions\n\rsee ${document.location.origin}/index.html#Remote%20keyboard\n\n\r`)
          this.send("enter 'm' for mainmenu\n\n\r")
          this.send("[36mkeyboard ip-adress> [0m")
          // autofill ip
          if( service.ip ){
            for( let i = 0; i < service.ip.length; i++ ) this.send(service.ip.charAt(i))
          }
        }, 100 )
      },
      server: (term) => {
        try{
          service.addr = `ws://${service.ip}:9090/`;
          service.ws = new WebSocket(service.addr)
          service.ws.addEventListener("open", () => {
            if( service.state == 'listening' ){
              this.send(`\n\rconnected to ${service.addr}! \\o/\n\r`)
              this.bootMenu() 
            }
            service.state = 'receiving'
          })
          service.ws.addEventListener("close", () => {
            service.attempts += 1
            if( service.attempts > 3 && service.state == 'listening'){
              service.reset(service)
              this.send(`\n\roops..I did not detect any connection :/\n\r`)
              localStorage.setItem("keyboardIP","") // reset ip 
              this.bootMenu()
            }else setTimeout( () => service.server(term), 1000 ) // retry connection
          }) // retry on EOF
          service.ws.onmessage = function(event) {
              if( !event.data ) return
              event.data.arrayBuffer().then( (buf) => {
                const arr   = new Uint8Array(buf)
                let string = Array.from(arr, byte => String.fromCharCode(byte)).join('')
                term.term.handler(string)
                service.state = 'receiving'
                localStorage.setItem("keyboardIP",service.ip) // save ip for later
              })
          };
        }catch(e){
          console.error(e)
          service.reset(service)
          localStorage.setItem("keyboardIP","") // reset ip 
          this.bootMenu()
        }
      }
    }

  // initialize REPL 
  ISOTerminal.prototype.boot.menu.push(
    {
      key: "k",
      title: (opts) => "connect a remote keyboard",
      init: service.init,
      keyHandler: function(ch){
        this.send(ch)
        if( service.state == 'need-ip'){
          if( ch == 'm'){
            this.send("\n\r")
            this.bootMenu()
          }else if( ch == '\n' || ch == '\r'){
            this.send("\n\rwaiting for connection..")
            service.server(this)
            service.state = 'listening'
          }else{
            service.ip = ch == '\b' ? service.ip.substr(0,this.service.ip.length-1) 
                                    : service.ip + ch 
          }
        }
      }
    }
  )
}

ISOTerminal.addEventListener('init', function(){
  this.enableRemoteKeyboard()
})

