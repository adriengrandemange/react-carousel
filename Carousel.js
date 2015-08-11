var React = require('react')
var assign = require('object-assign')

var Swipeable = React.createFactory(require('react-swipeable'))

var Carousel = React.createClass({
	
	_element: null,
	_proxy: null,
	_maxScale:3,
	_scrollFactor:0.02,
	_transitionSpeed: 500,
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
		if( this._isZoomed() == true && this._proxy.left == false )
		{
			this._proxy.x -= delta * this._scrollFactor;
			this._proxy.x = ( this._proxy.x < 0 ) ? 0 : this._proxy.x;
			this._renderZoomedElement();
		}
		else
		{
			this._clearZoom();
			this.setState({
			  delta: this.addResistance(delta)
			})
		}
	},

	nextImageScroll: function (e, delta) {
	  
		if( this._isZoomed() == true && this._proxy.right == false )
		{
			this._proxy.x += delta * this._scrollFactor;
			this._proxy.x = ( this._proxy.x > 100 ) ? 100 : this._proxy.x;
			this._renderZoomedElement();
		}
		else
		{
			this._clearZoom();
			this.setState({
			  delta: 0 - this.addResistance(delta)
			})
		}
	},

	downScroll: function(e,delta){
		if( this._isZoomed() == false )
			return
		
		this._proxy.y += ( delta * this._scrollFactor );
		this._proxy.y = ( this._proxy.y > 100 ) ? 100 : this._proxy.y;
		this._proxy.y = ( this._proxy.y < 0 ) ? 0 : this._proxy.y;
		this._renderZoomedElement();
	},

	upScroll: function(e, delta){
		
		if( this._isZoomed() == false )
		{
			return
		}
		
		this._proxy.y -= ( delta * this._scrollFactor );
		this._proxy.y = ( this._proxy.y > 100 ) ? 100 : this._proxy.y;
		this._proxy.y = ( this._proxy.y < 0 ) ? 0 : this._proxy.y;
		this._renderZoomedElement();
	},

	_isZoomed:function() {
		return( this._element != null && this._proxy.zoom > 1 );
	},
  
	_clearZoom:function(e){
		if( this._element != null )
		{
			this._element.style.transformOrigin = "none";
			this._element.style.transform = "none";
			this._element.style.transition = "none";
			this._proxy = null;
			this._element = null;
		}
	},

	_renderZoomedElement:function(){
		
		if( this._element != null )
		{
			var proxy = this._proxy;
			this._element.style.transform = "scale("+proxy.zoom+","+proxy.zoom+")";
			this._element.style.transformOrigin = proxy.x+"% "+proxy.y+"%";
			this._element.style.transition = "all "+this._transitionSpeed+"ms ease-out";
		}
	},

	touchStart: function (e) {
		
		this._pinchable = ( this.props.pinchable == undefined ) ?  this._pinchable : ( this.props.pinchable == true );
		
		if( e.targetTouches.length > 1 && this._pinchable == true)
		{
			var xa = e.targetTouches[0].clientX;
			var ya = e.targetTouches[0].clientY;
			var xb = e.targetTouches[1].clientX;
			var yb = e.targetTouches[1].clientY;
			var dist = Math.sqrt((xb-xa) * (xb-xa)	+ (yb-ya) * (yb-ya) );
			
			this._element = e.target;
			this._proxy = this._proxy || { originDist:0, zoom: 1, originZoom: 1, x:50, y:50, left: false, right: false};
			this._proxy.originDist = dist;
			
			this._transitionSpeed 	= this.props.transitionSpeed 	||  this._transitionSpeed;
			this._maxScale 			= this.props.maxScale 			||  this._maxScale;
			this._scrollFactor 		= this.props.scrollFactor 		||  this._scrollFactor;
		}
	},

	touchMove: function (e) {
		if( e.targetTouches.length > 1 && this._element != null && this._pinchable == true  )
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
			
			this._renderZoomedElement();
		}
	},

	touchEnd: function (e) {
		if( this._isZoomed() == true )
		{
			this._proxy.right = false;
			this._proxy.left = false;
				
			if( this._proxy.x >= 100 )
			{
				this._proxy.right = true;
			}
			
			if( this._proxy.x <= 0 )
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
		  onSwipingUp: this.upScroll,
		  onSwipingDown: this.downScroll,
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
			style: { float: 'left' }
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



module.exports = Carousel
