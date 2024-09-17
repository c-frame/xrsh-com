/*
 * ## requestAnimationFrameXR
 *
 * reroutes requestAnimationFrame-calls to xrSession.requestAnimationFrame 
 * reason: in immersive mode this function behaves differently 
 *         (causing HTML apps like xterm.js not getting updated due to relying 
 *          on window.requestAnimationFrame)
 *
 * ```html 
 *  <a-entity requestAnimationFrameXR dom/>
 * ```
 */

if( !AFRAME.systems.requestAnimationFrameXR ){

  AFRAME.registerSystem('requestAnimationFrameXR',{

    init: function init(){
      if( document.location.hostname.match(/localhost/) ) return // allow webxr polyfill during development (they hang in XR)
      AFRAME.systems.requestAnimationFrameXR.q = []
      this.sceneEl.addEventListener('enter-vr', this.enable )
      this.sceneEl.addEventListener('enter-ar', this.enable )
      this.sceneEl.addEventListener('exit-vr', this.disable )
      this.sceneEl.addEventListener('exit-ar', this.disable )
    },

    enable: function enable(){
      this.requestAnimationFrame = window.requestAnimationFrame
      // NOTE: we don't call xrSession.requestAnimationFrame directly like this:
      //
      //   window.requestAnimationFrame = AFRAME.utils.throttleTick( (cb) => this.sceneEl.xrSession.requestAnimationFrame(cb), 50 )
      //
      // as that breaks webxr polyfill (for in-browser testing)
      // instead we defer calls to tick() (which is called both in XR and non-XR)
      //
      window.requestAnimationFrame = (cb) => AFRAME.systems.requestAnimationFrameXR.q.push(cb)
      const q = AFRAME.systems.requestAnimationFrameXR.q
      this.tick = AFRAME.utils.throttleTick( () => {
        while( q.length != 0 ) (q.pop())()
      },50)
    },

    disable: function disable(){
      delete this.tick
      window.requestAnimationFrame = this.requestAnimationFrame
    }


  })
}
