/*
 * ## data_events
 *
 * allows components to react to data changes 
 *
 * ```html 
 *  <script>
 *    AFRAME.registerComponent('mycom',{
 *      init: function(){ this.data.foo = 1 }, 
 *      event: {
 *        foo:   (e) => alert("I was updated!")
 *      }
 *    })
 *  </script>
 *
 *  <a-entity mycom data_events/>
 * ```
 *
 */

AFRAME.registerComponent('data2event',{

  init: function(){
    setTimeout( () => {
      for( let i in this.el.components ){
        let com = this.el.components[i]
        if( typeof com.data == 'object' ){
          com.data = this.reactify( this.el, com.data)
        }
      }
    },50)
  },

  reactify: function(el,data){
    return new Proxy(data, {
      get(me,k,v)  { 
        return me[k]
      },
      set(me,k,v){
        me[k] = v
        el.emit(k,{el,k,v})
      }
    })
  },

})
