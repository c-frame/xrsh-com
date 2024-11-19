AFRAME.registerComponent('selfcontainer', {
  schema: { 
    foo: { type:"string"}
  },

  init: async function () {
    this.installProxyServer()
  },

  events:{ },

  convert:{

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
  },


  installProxyServer: function(){
    if( !window.store ) window.store = {}

    // selfcontain every webrequest to store (and serve if stored)
    let curry = function(me){
      return function(request, response, cb){

        let data = request ? window.store[ request.url ] || false : false 
        if( data ){ // return inline version
          console.log('selfcontainer.js: serving '+request.url+' from cache')
          let res = new Response()
          res[ data.binary ? 'data' : 'text' ] = data.binary ? () => me.convert.base64ToArrayBuffer(data.text) : data.text 
          cb(res)
        }else{

          if( request.url.match(/(^file:\/\/xrsh)/) ) return cb(response)

          console.log("selfcontainer.js: caching "+request.url)
          if( response.text ){
            data = {text: response.text}
          }else{
            data = {binary: true, text: me.convert.arrayBufferToBase64(response.data)}
          }
          window.store[ request.url ] = data 
          let $store = document.querySelector('template#store')
          if( $store ) $store.remove()
          document.head.innerHTML += `\n<`+`template id="store">\nwindow.store = ${JSON.stringify(window.store,null,2)}\n`+`<`+`/template>`
          cb(response);
        }
      }
    }
    xhook.after( curry(this) )
  }

});

