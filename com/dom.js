/*
 * ## dom
 *
 * instances reactive DOM component from AFRAME component's `dom` metadata 
 *
 * ```html 
 *  <script>
 *    AFRAME.registerComponent('mycom',{
 *      init: function(){ this.data.foo = 1 }, 
 *      dom: {
 *        scale:   3,
 *        events:  ['click'],
 *        html:    (me) => `<div id="iconmenu">${me.data.foo}</div>`,
 *        css:     (me) => `#iconmenu { display:block }`
 *      },
 *      event: {
 *        click: (e) => alert(e),
 *        foo:   (e) => alert("I was updated!")
 *      }
 *    })
 *  </script>
 *
 *  <a-entity mycom dom/>
 * ```
 *
 * | property     | type               | example                                                                                |
 * |--------------|--------------------|----------------------------------------------------------------------------------------|
 * | `com`        | `array` of strings | <a-entity app="app/launcher.js; registers: https://foo.com/index.json, ./index.json"/> |
 *
 * | event        | target | info                                                                                               |
 * |--------------|-------------------------------------------------------------------------------------------------------------|
 * | `DOMready`   | self   | fired when dom component (`this.dom`) is created                                                   |
 */

if( !AFRAME.components.dom ){

  AFRAME.registerComponent('dom',{

    init: function(){
      Object.values(this.el.components)
      .map( (c) => {
        if( c.dom && c.attrName != "dom"){ 
          this.dom = c.dom
          this.com = c
        }
      })
      if( !this.dom || !this.com){
        return console.warn('dom.js did not find a .dom object inside component')
      }

      this
      .ensureOverlay()
      .addCSS()
      .createReactiveDOMElement()
      .assignUniqueID()
      .scaleDOMvsXR()
      .triggerKeyboardForInputs()
      .stubRequestAnimationFrame()

      document.querySelector('#overlay').appendChild(this.el.dom)
      this.el.emit('DOMready',{el: this.el.dom})
    },

    ensureOverlay: function(){
      // ensure overlay
      let overlay = document.querySelector('#overlay')
      if( !overlay ){
        overlay = document.createElement('div')
        overlay.id = "overlay"
        overlay.setAttribute('style','position:fixed;top:0px;left:0px;right:0px;bottom:0px')
        document.body.appendChild(overlay)
        //  sceneEl.setAttribute("webxr","overlayElement:#overlay")
      }
      return this
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

    // creates el.dom  (the 2D DOM object)
    createReactiveDOMElement: function(){
      this.el.dom = document.createElement('div')
      this.el.dom.innerHTML = this.dom.html(this)
      this.el.dom.className = this.dom.attrName 
      this.com.data = this.reactify( this.el, this.com.data )
      if( this.dom.events ) this.dom.events.map( (e) => this.el.dom.addEventListener(e, (ev) => this.el.emit(e,ev) ) )
      this.el.dom = this.el.dom.children[0]
      return this
    },

    assignUniqueID: function(){
      // assign unique app id so it's easy to reference (by html-mesh component e.g.)
      if( !this.el.uid ) this.el.uid = this.el.dom.id = '_'+String(Math.random()).substr(10)
      return this
    },

    addCSS: function(){
      if( this.dom.css && !document.head.querySelector(`style#${this.com.attrName}`) ){
        document.head.innerHTML += `<style id="${this.com.attrName}">${this.dom.css(this)}</style>`
      }
      return this
    },

    scaleDOMvsXR: function(){
      if( this.dom.scale ) this.el.setAttribute('scale',`${this.dom.scale} ${this.dom.scale} ${this.dom.scale}`)
      return this
    },

    triggerKeyboardForInputs: function(){
      // https://developer.oculus.com/documentation/web/webxr-keyboard ;
      [...this.el.dom.querySelectorAll('[type=text]')].map( (input) => {
        let triggerKeyboard = function(){
          this.focus()
          console.log("focus")
        }
        input.addEventListener('click', triggerKeyboard )
      })
      return this
    },

    stubRequestAnimationFrame: function(){
      // stub, because WebXR with overrule this (it will not call the callback as expected in immersive mode)
      const requestAnimationFrame = window.requestAnimationFrame
      window.requestAnimationFrame = (cb) => {
        setTimeout( cb, 25 )
      }
    }

  })
}
