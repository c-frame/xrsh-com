/*
 * This is basically a Javascript Proxy for 'new Worker()' 
 * which allows calling worker-functions via promises.
 *
 * It's basically comlink without the fat.
 *
 * const w = new PromiseWorker("worker.js", (cb,event_or_fn,data) => {
 *   cb(event_or_fn,data) // decorate/ratelimit/hooks here
 * })
 * w.foo().then( console.dir )
 *
 * in worker.js define a function: this.foo = () => return {foo:"Bar"}
 */

function PromiseWorker(file, onmessage){

  let proxy
  const worker = new Worker(file)

  worker.onmessage = (e) => {           // handle messages originating from worker
    const {event,data} = e.data         // this is worker.onmessage(...)
    const cb = (event,data) => () => {  //
      if( data.promiseId ){             //
        proxy.resolver(data)             // forward to promise resolver 
      }
    }
    onmessage(cb,event,data)
  }

  return proxy = new Proxy(this,{
    get(me,k){
      if( k.match(/(postMessage|onmessage)/) ) return worker[k].bind(worker)
      if( k.match(/(resolver|promise)/)      ) return this[k].bind(this)
      // promisify postMessage(...) call
      return function(){
        return this.promise(me,{event: k, data: [...arguments] })
      }
    },

    promise(me,msg){
      if( typeof msg != 'object' || !msg.event || !msg.data ){ 
        throw 'worker.promise({event:..,data:..}) did not receive correct msg : '+JSON.stringify(msg)
      }
      this.resolvers = this.resolvers || {last:1,pending:{}}
      msg.data.promiseId = this.resolvers.last++
      // Send id and task to WebWorker
      worker.postMessage(msg, PromiseWorker.prototype.getTransferable(msg.data) )
      return new Promise( resolve => this.resolvers.pending[ msg.data.promiseId ] = resolve );
    },

    resolver(data){
      if( !data || !data.promiseId ) throw 'promiseId not given'
      this.resolvers.pending[ data.promiseId ](data.result);
      delete this.resolvers.pending[ data.promiseId ]; // Prevent memory leak
    }

  })

}

PromiseWorker.prototype.getTransferable = function(data){
  let objs = []
  function isTransferable(obj) {
    return obj instanceof ArrayBuffer ||
           obj instanceof MessagePort ||
           obj instanceof ImageBitmap ||
           (typeof OffscreenCanvas !== 'undefined' && obj instanceof OffscreenCanvas) ||
           (typeof ReadableStream !== 'undefined' && obj instanceof ReadableStream) ||
           (typeof WritableStream !== 'undefined' && obj instanceof WritableStream) ||
           (typeof TransformStream !== 'undefined' && obj instanceof TransformStream);
  }
  for( var i in data ){
    if( isTransferable(data[i]) ) objs.push(data[i])
  }
  if( objs.length ) debugger
  return objs.length ? objs : undefined
}
