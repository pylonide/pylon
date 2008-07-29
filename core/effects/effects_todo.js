// #ifdef 0

Effect.Highlight = Class.create();
Object.extend(Object.extend(Effect.Highlight.prototype, Effect.Base.prototype), {
	initialize: function(element) {
		this.element = $(element);
		var options = Object.extend({ startcolor: '#ffff99' }, arguments[1] || {});
		this.start(options);
	},
	setup: function() {
		// Prevent executing on elements not in the layout flow
		if(this.element.getStyle('display')=='none') { this.cancel(); return; }
		// Disable background image during the effect
		this.oldStyle = {
			backgroundImage: this.element.getStyle('background-image') };
		this.element.setStyle({backgroundImage: 'none'});
		if(!this.options.endcolor)
			this.options.endcolor = this.element.getStyle('background-color').parseColor('#ffffff');
		if(!this.options.restorecolor)
			this.options.restorecolor = this.element.getStyle('background-color');
		// init color calculations
		this._base  = $R(0,2).map(function(i){ return parseInt(this.options.startcolor.slice(i*2+1,i*2+3),16) }.bind(this));
		this._delta = $R(0,2).map(function(i){ return parseInt(this.options.endcolor.slice(i*2+1,i*2+3),16)-this._base[i] }.bind(this));
	},
	update: function(position) {
		this.element.setStyle({backgroundColor: $R(0,2).inject('#',function(m,v,i){
			return m+(Math.round(this._base[i]+(this._delta[i]*position)).toColorPart()); }.bind(this)) });
	},
	finish: function() {
		this.element.setStyle(Object.extend(this.oldStyle, {
			backgroundColor: this.options.restorecolor
		}));
	}
});

Effect.ScrollTo = Class.create();
Object.extend(Object.extend(Effect.ScrollTo.prototype, Effect.Base.prototype), {
	initialize: function(element) {
		this.element = $(element);
		this.start(arguments[1] || {});
	},
	setup: function() {
		Position.prepare();
		var offsets = Position.cumulativeOffset(this.element);
		if(this.options.offset) offsets[1] += this.options.offset;
		var max = window.innerHeight ? 
			window.height - window.innerHeight :
			document.body.scrollHeight - 
			  (document.documentElement.clientHeight ? 
			    document.documentElement.clientHeight : document.body.clientHeight);
		this.scrollStart = Position.deltaY;
		this.delta = (offsets[1] > max ? max : offsets[1]) - this.scrollStart;
	},
	update: function(position) {
		Position.prepare();
		window.scrollTo(Position.deltaX, 
			this.scrollStart + (position*this.delta));
	}
});

/* ------------- combination effects ------------- */

Effect.Fade = function(element) {
	element = $(element);
	var oldOpacity = element.getInlineOpacity();
	var options = Object.extend({
	from: element.getOpacity() || 1.0,
	to:   0.0,
	afterFinishInternal: function(effect) { 
		if(effect.options.to!=0) return;
		effect.element.hide();
		effect.element.setStyle({opacity: oldOpacity}); 
	}}, arguments[1] || {});
	return new Effect.Opacity(element,options);
}

Effect.Appear = function(element) {
	element = $(element);
	var options = Object.extend({
	from: (element.getStyle('display') == 'none' ? 0.0 : element.getOpacity() || 0.0),
	to:   1.0,
	// force Safari to render floated elements properly
	afterFinishInternal: function(effect) {
		effect.element.forceRerendering();
	},
	beforeSetup: function(effect) {
		effect.element.setOpacity(effect.options.from);
		effect.element.show(); 
	}}, arguments[1] || {});
	return new Effect.Opacity(element,options);
}

Effect.Puff = function(element) {
	element = $(element);
	var oldStyle = { opacity: element.getInlineOpacity(), position: element.getStyle('position') };
	return new Effect.Parallel(
	 [ new Effect.Scale(element, 200, 
			{ sync: true, scaleFromCenter: true, scaleContent: true, restoreAfterFinish: true }), 
		 new Effect.Opacity(element, { sync: true, to: 0.0 } ) ], 
		 Object.extend({ duration: 1.0, 
			beforeSetupInternal: function(effect) {
			  effect.effects[0].element.setStyle({position: 'absolute'}); },
			afterFinishInternal: function(effect) {
			   effect.effects[0].element.hide();
			   effect.effects[0].element.setStyle(oldStyle); }
		 }, arguments[1] || {})
	 );
}

Effect.BlindUp = function(element) {
	element = $(element);
	element.makeClipping();
	return new Effect.Scale(element, 0, 
		Object.extend({ scaleContent: false, 
			scaleX: false, 
			restoreAfterFinish: true,
			afterFinishInternal: function(effect) {
			  effect.element.hide();
			  effect.element.undoClipping();
			} 
		}, arguments[1] || {})
	);
}

Effect.BlindDown = function(element) {
	element = $(element);
	var elementDimensions = element.getDimensions();
	return new Effect.Scale(element, 100, 
		Object.extend({ scaleContent: false, 
			scaleX: false,
			scaleFrom: 0,
			scaleMode: {originalHeight: elementDimensions.height, originalWidth: elementDimensions.width},
			restoreAfterFinish: true,
			afterSetup: function(effect) {
			  effect.element.makeClipping();
			  effect.element.setStyle({height: '0px'});
			  effect.element.show(); 
			},  
			afterFinishInternal: function(effect) {
			  effect.element.undoClipping();
			}
		}, arguments[1] || {})
	);
}

Effect.SwitchOff = function(element) {
	element = $(element);
	var oldOpacity = element.getInlineOpacity();
	return new Effect.Appear(element, { 
		duration: 0.4,
		from: 0,
		transition: Effect.Transitions.flicker,
		afterFinishInternal: function(effect) {
			new Effect.Scale(effect.element, 1, { 
			  duration: 0.3, scaleFromCenter: true,
			  scaleX: false, scaleContent: false, restoreAfterFinish: true,
			  beforeSetup: function(effect) { 
			    effect.element.makePositioned();
			    effect.element.makeClipping();
			  },
			  afterFinishInternal: function(effect) {
			    effect.element.hide();
			    effect.element.undoClipping();
			    effect.element.undoPositioned();
			    effect.element.setStyle({opacity: oldOpacity});
			  }
			})
		}
	});
}

Effect.DropOut = function(element) {
	element = $(element);
	var oldStyle = {
		top: element.getStyle('top'),
		left: element.getStyle('left'),
		opacity: element.getInlineOpacity() };
	return new Effect.Parallel(
		[ new Effect.Move(element, {x: 0, y: 100, sync: true }), 
			new Effect.Opacity(element, { sync: true, to: 0.0 }) ],
		Object.extend(
			{ duration: 0.5,
			  beforeSetup: function(effect) {
			    effect.effects[0].element.makePositioned(); 
			  },
			  afterFinishInternal: function(effect) {
			    effect.effects[0].element.hide();
			    effect.effects[0].element.undoPositioned();
			    effect.effects[0].element.setStyle(oldStyle);
			  } 
			}, arguments[1] || {}));
}

Effect.Shake = function(element) {
	element = $(element);
	var oldStyle = {
		top: element.getStyle('top'),
		left: element.getStyle('left') };
		return new Effect.Move(element, 
			{ x:  20, y: 0, duration: 0.05, afterFinishInternal: function(effect) {
		new Effect.Move(effect.element,
			{ x: -40, y: 0, duration: 0.1,  afterFinishInternal: function(effect) {
		new Effect.Move(effect.element,
			{ x:  40, y: 0, duration: 0.1,  afterFinishInternal: function(effect) {
		new Effect.Move(effect.element,
			{ x: -40, y: 0, duration: 0.1,  afterFinishInternal: function(effect) {
		new Effect.Move(effect.element,
			{ x:  40, y: 0, duration: 0.1,  afterFinishInternal: function(effect) {
		new Effect.Move(effect.element,
			{ x: -20, y: 0, duration: 0.05, afterFinishInternal: function(effect) {
			  effect.element.undoPositioned();
			  effect.element.setStyle(oldStyle);
	}}) }}) }}) }}) }}) }});
}

// Bug in opera makes the TD containing this element expand for a instance after finish 
Effect.Squish = function(element) {
	return new Effect.Scale(element, window.opera ? 1 : 0, 
		{ restoreAfterFinish: true,
			beforeSetup: function(effect) {
			  effect.element.makeClipping(effect.element); },  
			afterFinishInternal: function(effect) {
			  effect.element.hide(effect.element); 
			  effect.element.undoClipping(effect.element); }
	});
}

Effect.Grow = function(element) {
	element = $(element);
	var options = Object.extend({
		direction: 'center',
		moveTransition: Effect.Transitions.sinoidal,
		scaleTransition: Effect.Transitions.sinoidal,
		opacityTransition: Effect.Transitions.full
	}, arguments[1] || {});
	var oldStyle = {
		top: element.style.top,
		left: element.style.left,
		height: element.style.height,
		width: element.style.width,
		opacity: element.getInlineOpacity() };

	var dims = element.getDimensions();    
	var initialMoveX, initialMoveY;
	var moveX, moveY;
	
	switch (options.direction) {
		case 'top-left':
			initialMoveX = initialMoveY = moveX = moveY = 0; 
			break;
		case 'top-right':
			initialMoveX = dims.width;
			initialMoveY = moveY = 0;
			moveX = -dims.width;
			break;
		case 'bottom-left':
			initialMoveX = moveX = 0;
			initialMoveY = dims.height;
			moveY = -dims.height;
			break;
		case 'bottom-right':
			initialMoveX = dims.width;
			initialMoveY = dims.height;
			moveX = -dims.width;
			moveY = -dims.height;
			break;
		case 'center':
			initialMoveX = dims.width / 2;
			initialMoveY = dims.height / 2;
			moveX = -dims.width / 2;
			moveY = -dims.height / 2;
			break;
	}
	
	return new Effect.Move(element, {
		x: initialMoveX,
		y: initialMoveY,
		duration: 0.01, 
		beforeSetup: function(effect) {
			effect.element.hide();
			effect.element.makeClipping();
			effect.element.makePositioned();
		},
		afterFinishInternal: function(effect) {
			new Effect.Parallel(
			  [ new Effect.Opacity(effect.element, { sync: true, to: 1.0, from: 0.0, transition: options.opacityTransition }),
			    new Effect.Move(effect.element, { x: moveX, y: moveY, sync: true, transition: options.moveTransition }),
			    new Effect.Scale(effect.element, 100, {
			      scaleMode: { originalHeight: dims.height, originalWidth: dims.width }, 
			      sync: true, scaleFrom: window.opera ? 1 : 0, transition: options.scaleTransition, restoreAfterFinish: true})
			  ], Object.extend({
			       beforeSetup: function(effect) {
			         effect.effects[0].element.setStyle({height: '0px'});
			         effect.effects[0].element.show(); 
			       },
			       afterFinishInternal: function(effect) {
			         effect.effects[0].element.undoClipping();
			         effect.effects[0].element.undoPositioned();
			         effect.effects[0].element.setStyle(oldStyle); 
			       }
			     }, options)
			)
		}
	});
}

Effect.Shrink = function(element) {
	element = $(element);
	var options = Object.extend({
		direction: 'center',
		moveTransition: Effect.Transitions.sinoidal,
		scaleTransition: Effect.Transitions.sinoidal,
		opacityTransition: Effect.Transitions.none
	}, arguments[1] || {});
	var oldStyle = {
		top: element.style.top,
		left: element.style.left,
		height: element.style.height,
		width: element.style.width,
		opacity: element.getInlineOpacity() };

	var dims = element.getDimensions();
	var moveX, moveY;
	
	switch (options.direction) {
		case 'top-left':
			moveX = moveY = 0;
			break;
		case 'top-right':
			moveX = dims.width;
			moveY = 0;
			break;
		case 'bottom-left':
			moveX = 0;
			moveY = dims.height;
			break;
		case 'bottom-right':
			moveX = dims.width;
			moveY = dims.height;
			break;
		case 'center':  
			moveX = dims.width / 2;
			moveY = dims.height / 2;
			break;
	}
	
	return new Effect.Parallel(
		[ new Effect.Opacity(element, { sync: true, to: 0.0, from: 1.0, transition: options.opacityTransition }),
			new Effect.Scale(element, window.opera ? 1 : 0, { sync: true, transition: options.scaleTransition, restoreAfterFinish: true}),
			new Effect.Move(element, { x: moveX, y: moveY, sync: true, transition: options.moveTransition })
		], Object.extend({            
			   beforeStartInternal: function(effect) {
			     effect.effects[0].element.makePositioned();
			     effect.effects[0].element.makeClipping(); },
			   afterFinishInternal: function(effect) {
			     effect.effects[0].element.hide();
			     effect.effects[0].element.undoClipping();
			     effect.effects[0].element.undoPositioned();
			     effect.effects[0].element.setStyle(oldStyle); }
			 }, options)
	);
}

Effect.Pulsate = function(element) {
	element = $(element);
	var options    = arguments[1] || {};
	var oldOpacity = element.getInlineOpacity();
	var transition = options.transition || Effect.Transitions.sinoidal;
	var reverser   = function(pos){ return transition(1-Effect.Transitions.pulse(pos)) };
	reverser.bind(transition);
	return new Effect.Opacity(element, 
		Object.extend(Object.extend({  duration: 3.0, from: 0,
			afterFinishInternal: function(effect) { effect.element.setStyle({opacity: oldOpacity}); }
		}, options), {transition: reverser}));
}

Effect.Fold = function(element) {
	element = $(element);
	var oldStyle = {
		top: element.style.top,
		left: element.style.left,
		width: element.style.width,
		height: element.style.height };
	Element.makeClipping(element);
	return new Effect.Scale(element, 5, Object.extend({   
		scaleContent: false,
		scaleX: false,
		afterFinishInternal: function(effect) {
		new Effect.Scale(element, 1, { 
			scaleContent: false, 
			scaleY: false,
			afterFinishInternal: function(effect) {
			  effect.element.hide();
			  effect.element.undoClipping(); 
			  effect.element.setStyle(oldStyle);
			} });
	}}, arguments[1] || {}));
};

['setOpacity','getOpacity','getInlineOpacity','forceRerendering','setContentZoom',
 'collectTextNodes','collectTextNodesIgnoreClass','childrenWithClassName'].forEach( 
	function(f) { Element.Methods[f] = Element[f]; }
);

Element.Methods.visualEffect = function(element, effect, options) {
	s = effect.gsub(/_/, '-').camelize();
	effect_class = s.charAt(0).toUpperCase() + s.substring(1);
	new Effect[effect_class](element, options);
	return $(element);
};

// #endif