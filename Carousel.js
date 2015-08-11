var React = require('react')
var assign = require('object-assign')

var Swipeable = React.createFactory(require('react-swipeable'))
var Carousel = React.createClass({
	
	_element: null,
	_proxy: null,
	_maxScale:3,
	_transitionSpeed: 20,
	_pinchable: false,
	
	getInitialState: function () {
	return {
	  prevIndex: 0,
	  currentIndex: this.props.current|0,
	  itemWidths: Array(this.props.children.length),
	  itemStart: Array(this.props.children.length),
	  containerWidth: 0,
	  delta: 0
	}
	},

	componentDidMount: function () {
	var widths = Array.prototype.map.call(
	  this.refs.carouselContainer.getDOMNode().children,
	  function (node) {
		return node.offsetWidth
	  }
	)

	var totalWidth = widths.reduce(function (a, b) { return a + b }, 0)
	var startPos = widths.reduce(function (total, width) {
	  total.push(total[total.length - 1] + width)
	  return total
	}, [0])

	this.setState({
	  itemWidths: widths,
	  itemStart: startPos,
	  containerWidth: totalWidth
	})
	},

	addResistance: function (delta) {
		return delta * (1 - parseInt(Math.sqrt(Math.pow(delta, 2)), 10) / 1000)
	},

	doMoveImage: function (_, x) {
	  
	if( this._isZoomed() == true )
		return;  
	  
    var index = this.state.currentIndex
    var imageMoveIndex = this.state.currentIndex
    if (x < 0) {
      if (index > 0) {
        index = index - 1
        imageMoveIndex = index
      }
    } else if (x > 0) {
      if (index < this.props.children.length - 1) {
        index = index + 1
        imageMoveIndex = imageMoveIndex
      }
    }

    this.setState({
      prevIndex: imageMoveIndex,
      currentIndex: index,
      delta: 0
    })
    
    // Execute callback on change current
    if (this.props.onChangeCurrent) this.props.onChangeCurrent(index);
  },

	prevImageScroll: function (e, delta) {
		
		if( this._isZoomed() == true && this._proxy.left == false)
			return;
			
		this._clearZoom();
		this.setState({
		  delta: this.addResistance(delta)
		})
	},

	nextImageScroll: function (e, delta) {
	  
		if( this._isZoomed() == true && this._proxy.right == false)
			return;
			
		this._clearZoom();
		this.setState({
		  delta: 0 - this.addResistance(delta)
		})
	},

	_isZoomed:function() {		
		return( this._proxy != null && this._proxy.zoom > 1 );	
	},
  
	_clearZoom:function(e){
		if( this._proxy != null )
		{
			this._proxy.element.style.transformOrigin = "none";
			this._proxy.element.style.transform = "none";
			this._proxy.element.style.transition = "none";
			this._proxy = null;
		}
	},

	_renderZoomedElement:function(smooth){
		
		//GOOD
		if( this._proxy != null )
		{
			var proxy = this._proxy;
			var x = parseInt(proxy.originX * 100) / 100;
			var y = parseInt(proxy.originY * 100) / 100;
			
			this._proxy.element.style.transform = "scale("+proxy.zoom+","+proxy.zoom+")";
			this._proxy.element.style.transformOrigin = x+"% "+y+"%";
			if( smooth == true )
			{
				this._proxy.element.style.transition = "all "+this._transitionSpeed+"ms";
			}
			else
			{
				this._proxy.element.style.transition = "none";
			}
		}
	},

	touchStart: function (e) {
		
		this._pinchable = ( this.props.pinchable == undefined ) ?  this._pinchable : ( this.props.pinchable == true );
		
		if( this._pinchable == false )
			return;
			
		if( e.targetTouches.length > 1 )
		{
			var xa = e.targetTouches[0].clientX;
			var ya = e.targetTouches[0].clientY;
			var xb = e.targetTouches[1].clientX;
			var yb = e.targetTouches[1].clientY;
			var dist = Math.sqrt((xb-xa) * (xb-xa)	+ (yb-ya) * (yb-ya) );
			
			this._proxy = this._proxy || { 	originDist:0, 
											zoom: 1, 
											element: e.target,
											originZoom: 1, 
											currentX:xa,
											currentY:ya,
											originX:50, 
											originY:50, 
											left: false, 
											right: false,
											counter:0
										};
										
			this._proxy.originDist 	= dist;
			this._proxy.currentX 	= xa;
			this._proxy.currentY 	= ya;
			this._proxy.element 	= e.target;
			this._proxy.zoom 		= this._proxy.originZoom;
			this._transitionSpeed 	= this.props.transitionSpeed 	||  this._transitionSpeed;
			this._maxScale 			= this.props.maxScale 			||  this._maxScale;
			this._renderZoomedElement(true);
		}
		else if( this._proxy != null )
		{
			this._proxy.currentX 	= e.targetTouches[0].clientX;
			this._proxy.currentY 	= e.targetTouches[0].clientY;
		}
	},

	touchMove: function (e) {
		
		if( this._pinchable == false || this._proxy == null )
			return;
	
		if( e.targetTouches.length > 1   )
		{
			var proxy = this._proxy;
			var xa = e.targetTouches[0].clientX;
			var ya = e.targetTouches[0].clientY;
			var xb = e.targetTouches[1].clientX;
			var yb = e.targetTouches[1].clientY;
			var distance = Math.sqrt((xb-xa)*(xb-xa) + (yb-ya)* (yb-ya));
			var factor = distance / proxy.originDist;
			
			if( factor > 0.9 && factor < 1.1 )
				return;
			
			proxy.zoom = proxy.originZoom * factor;
			proxy.zoom = ( proxy.zoom > this._maxScale ) ? this._maxScale : ( proxy.zoom < 1 ) ? 1 : proxy.zoom;
		}
		else
		{
			this._proxy.counter++;
		
			if( this._proxy.counter % 5 != 0 )
				return;
			
			var proxy = this._proxy;
			var xa = e.targetTouches[0].clientX;
			var ya = e.targetTouches[0].clientY;
			var distX = xa - proxy.currentX;
			var distY = ya - proxy.currentY;
			var newX = proxy.originX - ( distX  / proxy.zoom );
			var newY = proxy.originY - ( distY  / proxy.zoom );

			
			newX = ( newX < 0 ) ? 0 : newX;
			newY = ( newY < 0 ) ? 0 : newY;
			
			newX = ( newX > 100 ) ? 100 : newX;
			newY = ( newY > 100 ) ? 100 : newY;
			
			proxy.originX = newX;
			proxy.originY = newY;
			proxy.currentX = xa;
			proxy.currentY = ya;
		}
		this._renderZoomedElement(e.targetTouches.length > 1);
		
	},

	touchEnd: function (e) {
		if( this._isZoomed() == true )
		{
			this._proxy.right = false;
			this._proxy.left = false;
				
			if( this._proxy.originX >= 100 )
			{
				this._proxy.right = true;
			}
			
			if( this._proxy.originX <= 0 )
			{
				this._proxy.left = true;
			}
		}
	},

	render: function () {
		
		var delta = this.state.delta +(0 - this.state.itemStart[this.state.currentIndex]);
		var transition = 'all 250ms ease-out'
		var clear = React.createElement('div', {
			key: 'carousel-clear',
			style: {
				height: 0,
				visibility: 'hidden',
				clear: 'left'
			}
		})

		// Pagination
		var currentIndex = this.state.currentIndex;
		var pagination = React.createElement('div', {
			className: 'carousel-pagination'
		  }, this.props.children.map(function (item, i) {
			var activePager = ''
			if(currentIndex === i) {
			  activePager = 'active';
			}
			return React.createElement('div', {
			  key: 'pager'+i,
			  className: 'page-item '+activePager
			})
		  }));

		var containerWidth = "100000px";
		if (this.state.containerWidth)
		  containerWidth = this.state.containerWidth + "px";

		var swipeContainer = Swipeable({
		  onSwipingRight: this.prevImageScroll,
		  onSwipingLeft: this.nextImageScroll,
		  onSwiped: this.doMoveImage,
		  
		  ref: 'carouselContainer',
		  style: {
			webkitTransform: 'translate3d(' + delta + 'px, 0, 0)',
			transition: this.state.delta === 0 ? transition : 'none',
			width: containerWidth
		  }
		}, this.props.children.map(function (item, i) {
		  return React.createElement('div', {
			key: i,
			style: { float: 'left', background: "green" }
		  }, item)
		}).concat(clear))
		
		return React.createElement('div', assign({}, this.props, {
		  style: {
			overflow: 'hidden',
			width: '100%'
		  },
		  onTouchStart:this.touchStart,
		  onTouchMove:this.touchMove,
		  onTouchEnd:this.touchEnd


		  
		}), swipeContainer, pagination);
	}

})

module.exports = Carousel;
