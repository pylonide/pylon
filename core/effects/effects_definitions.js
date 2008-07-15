// #ifdef __WITH_EFFECTS

var Effect = {
  PAIRS: {
    'slide':  ['SlideDown','SlideUp'],
    'blind':  ['BlindDown','BlindUp'],
    'appear': ['Appear','Fade']
  },
  toggle : function(el, effect, opts){
    effect = (effect || 'appear').toLowerCase();
    Effect[Effect.PAIRS[effect][el.style.display != 'none' ? 1 : 0]](el, opts);
  }
};
Effect.Transitions = {}

Effect.Transitions.linear = function(pos) {
	return pos;
}
Effect.Transitions.sinoidal = function(pos) {
	return (-Math.cos(pos*Math.PI)/2) + 0.5;
}
Effect.Transitions.reverse  = function(pos) {
	return 1-pos;
}
Effect.Transitions.flicker = function(pos) {
	return ((-Math.cos(pos*Math.PI)/4) + 0.75) + Math.random()/4;
}
Effect.Transitions.wobble = function(pos) {
	return (-Math.cos(pos*Math.PI*(9*pos))/2) + 0.5;
}
Effect.Transitions.pulse = function(pos) {
	return (Math.floor(pos*10) % 2 == 0 ? 
		(pos*10-Math.floor(pos*10)) : 1-(pos*10-Math.floor(pos*10)));
}
Effect.Transitions.none = function(pos) {
	return 0;
}
Effect.Transitions.full = function(pos) {
	return 1;
}

function $() {
	var results = [], el;
	for(var i=0;i<arguments.length;i++)
		results.push(document.getelementById(arguments[i]));
	
	return results.length < 2 ? results[0] : results;
}

function extend(dest, src){
	if(!src) return dest;
	for(var prop in src) dest[prop] = src[prop];
	return dest;
}

function getOpacity(el){  
  var opacity;
  if(opacity = jpf.compat.getStyle(el, "opacity"))  
    return parseFloat(opacity);  
  if(opacity = (jpf.compat.getStyle(el, "filter") || '').match(/alpha\(opacity=(.*)\)/))  
    if(opacity[1]) return parseFloat(opacity[1]) / 100;  
  return 1.0;  
}

function getDimensions(el) {
	if (jpf.compat.getStyle(el, 'display') != 'none')
		return {width: el.offsetWidth, height: el.offsetHeight};
	
	// All *Width and *Height properties give 0 on els with display none,
	// so enable the el temporarily
	var els = el.style;
	var originalVisibility = els.visibility;
	var originalPosition = els.position;
	els.visibility = 'hidden';
	els.position = 'absolute';
	els.display = '';
	var originalWidth = el.clientWidth;
	var originalHeight = el.clientHeight;
	els.display = 'none';
	els.position = originalPosition;
	els.visibility = originalVisibility;
	return {width: originalWidth, height: originalHeight};
}

function makePositioned(el){
	var pos = jpf.compat.getStyle(el, 'position');
	if (pos == 'static' || !pos) {
		el._madePositioned = true;
		el.style.position = 'relative';
		// Opera returns the offset relative to the positioning context, when an
		// el is position relative but top and left have not been defined
		if (window.opera) {
			el.style.top = 0;
			el.style.left = 0;
		}
	}
}

function undoPositioned(el) {
	if(el._madePositioned) {
		el._madePositioned = undefined;
		el.style.position =
		el.style.top =
		el.style.left =
		el.style.bottom =
		el.style.right = '';
	}
}

function makeClipping(el) {
	if(el._overflow) return;
	el._overflow = el.style.overflow;
	if((jpf.compat.getStyle(el, 'overflow') || 'visible') != 'hidden')
		el.style.overflow = 'hidden';
},

function undoClipping(el) {
	if(el._overflow) return;
	el.style.overflow = el._overflow;
	el._overflow = undefined;
}

Effect.Opacity = function(el, opts, iAnim){
	if(isIE && !el.hasLayout) el.style.zoom = 1;
	
	var opts = extend({from: getOpacity(el) || 0, to:   1, transition: 0, fps: 12, duration: 1}, opts);
	var aSeq = new AnimationSequence(el, "fade", opts.from, opts.to, opts.transition, opts.fps * opts.duration, 1000/opts.fps);
	return iAnim ? iAnim.addSequence(aSeq) : aSeq.start();
}

Effect.Move = function(el, opts, iAnim){
	makePositioned(el);
	
	var opts = extend({x: 0, y: 0, mode: 'relative', transition: 0, fps: 12, duration: 1}, opts);
	var isAbs = opts.mode == 'absolute';
	var anim = iAnim || new Animation(1000/opts.fps);
	anim.addSequence(0, new AnimationSequence(el, "left", (isAbs ? 0 : el.offsetLeft), opts.x + (isAbs ? 0 : el.offsetLeft), opts.transition, opts.fps * opts.duration));
	anim.addSequence(0, new AnimationSequence(el, "top", (isAbs ? 0 : el.offsetTop), opts.y + (isAbs ? 0 : el.offsetTop), opts.transition, opts.fps * opts.duration));
	
	return iAnim || anim.start();
}

Effects.Scale = function(el, percent, opts, iAnim){
	var pos = jpf.compat.getStyle(el, "position");
	if(pos == 'static' || !pos) el.style.position = 'relative';
	
	var opts = extend({scaleX: true, scaleY: true, scaleContent: true, scaleFromCenter: false, scaleMode: 'box', scaleFrom: 100.0, scaleTo: percent, transition: 0, fps: 12, duration: 1}, opts);
	var anim = iAnim || new Animation(1000/opts.fps);
	var frmScale = (opts.scaleFrom/100);
	var toScale = (opts.scaleTo/100);
	
	var iDim;
	if(opts.scaleMode == 'box')
		iDim = [el.offsetHeight, el.offsetWidth];
	if(/^content/.test(opts.scaleMode))
		iDim = [el.scrollHeight, el.scrollWidth];
	if(!iDim)
		iDim = [jpf.compat.getStyle(el, "height"), jpf.compat.getStyle(el, "width")];
	
	if(opts.scaleContent){
		(fsize = jpf.compat.getStyle(el, "font-size") || '100%').match(/(em|px|\%)/);
		fsize = parseFloat(fsize);
		ftype = RegExp.$1;
		
		if(fsize)
			anim.addSequence(0, new AnimationSequence(el, "font" + ftype, fsize * frmScale, fsize * toScale, opts.transition, opts.fps * opts.duration));
	}
	
	if(opts.scaleX) anim.addSequence(0, new AnimationSequence(el, "width", iDim[1] * frmScale, iDim[1] * toScale, opts.transition, opts.fps * opts.duration));
	if(opts.scaleY) anim.addSequence(0, new AnimationSequence(el, "height", iDim[0] * frmScale, iDim[0] * toScale, opts.transition, opts.fps * opts.duration));
	
	if(opts.scaleFromCenter){
		if(opts.scaleX) anim.addSequence(0, new AnimationSequence(el, "left", el.offsetLeft + (iDim[1] - (frmScale*iDim[1]), el.offsetLeft + (iDim[1] - (toScale*iDim[1]), opts.transition, opts.fps * opts.duration));
		if(opts.scaleY) anim.addSequence(0, new AnimationSequence(el, "top", el.offsetTop + (iDim[0] - (frmScale*iDim[0]), el.offsetTop + (iDim[0] - (toScale*iDim[0]), opts.transition, opts.fps * opts.duration));
	}
	
	if(opts.restoreAfterFinish){
		//BUILD RESTORE CODE
	}
	
	return iAnim || anim.start();
}

Effect.SlideDown = function(el, opts, iAnim){
	//el.cleanWhitespace();
	
	var iDim = getDimensions(el);
	var opts = extend({scaleContent: false, scaleX: false, scaleFrom: isOpera ? 0 : 1, scaleMode: {originalHeight: iDim.height, originalWidth: iDim.width}, restoreAfterFinish: true, fps: 12, duration: 1}, opts);
	
	makePositioned(el);
	if(isOpera) el.style.top = '';
	makeClipping(el);
	el.style.height = '0px';
	el.style.display = '';
	
	var anim = iAnim || new Animation(1000/opts.fps);
	anim.addScript(0, function(){oHTML.scrollTop = oHTML.scrollHeight;});
	anim.addScript(opts.fps * opts.duration, function() {
		undoClipping(oHTML);
		undoPositioned(oHTML);
	}
	
	this.Scale(el, 100, opts, anim);
	return iAnim ? iAnim : anim.start();
}
	
Effect.SlideUp = function(el, opts, iAnim) {
	//el.cleanWhitespace();
	
	var opts = extend({scaleContent: false, scaleX: false, scaleMode: 'box', scaleFrom: 100, restoreAfterFinish: true, fps: 12, duration: 1}, opts);
	
	makePositioned(el);
	if(isOpera) el.style.top = '';
	makeClipping(el);
	el.style.height = '0px';
	el.style.display = '';
	
	var anim = iAnim || new Animation(1000/opts.fps);
	this.Scale(el, isOpera ? 0 : 1, opts, anim);
	
	anim.changeType(0, "height", "scrollheight");
	anim.addScript(opts.fps * opts.duration, function() {
		oHTML.style.display = "none";
		undoClipping(oHTML);
		undoPositioned(oHTML);
	}
	
	return iAnim ? iAnim : anim.start();
}

// #endif