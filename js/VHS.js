var is_chrome = navigator.userAgent.indexOf('Chrome') > -1;
var is_explorer = navigator.userAgent.indexOf('MSIE') > -1;
var is_firefox = navigator.userAgent.indexOf('Firefox') > -1;
var is_safari = navigator.userAgent.indexOf("Safari") > -1;
var is_opera = navigator.userAgent.toLowerCase().indexOf("op") > -1;
var is_edge = navigator.userAgent.indexOf('Edge') > -1;

if ((is_chrome)&&(is_safari)) {is_safari=false;}
if ((is_chrome)&&(is_opera)) {is_chrome=false;}

var VHS = null;
var BaseVideo = null;
var CurrentTime = 0;
var CurrentVolume = 1.0;
var CurrentVideo = null;
var LastVideo = null;
//In seconds, how much drift before we resync. Set to false to disable, 
//making the video transitions smoother but at the cost of potential audio drift
var SyncThreshold = false;
//In seconds, how long you must wait before clicking the next video
var RateLimit = 0.25;
var _lastClick = 0;
//In seconds, how much to pad the next video play sequence
//Note that javascript is only accurate down to about 250ms for this kind of thing
var TransitionDelay = 0.05;
//DynamicThrottle. Oh lord what's wrong with me, I should be asleep.
//Toggle whether or not to subtly increase or decrease base track to catch up 
//Experimental.
var DynamicThrottle = true;
//How much to add to/subtract from the playback rate on each transition
var DynamicThrottleIncrement = 0.02;
//Minimum & Maximum playback rates
var DynamicThrottleMin = 0.8;
var DynamicThrottleMax = 1.2;
//How often to schedule throttle checks, in milliseconds
var DynamicThrottleRate = 1000;
//Similar to SyncThreshold, what's our threshold before we act
var DynamicThrottleThreshold = 0.5;

var VHSPlayer = function(config)
{
	this.i = 0;
	this.config = config;
	this.initialized = false;
	this.destroyed = false;
	this.firstPlay = true;
	this.baseTrack = config.baseTrack || null;
	this.videos = [];
	this.loaded = 0;
	this.loadComplete = false;

	this.$container = $(config.container);
	this.$progressStart = this.$container.find('.ps');
	this.$progressEnd = this.$container.find('.pe');
}

VHSPlayer.prototype = {

	init: function()
	{	
		if(this.initialized) return;

		this.$reset();
		this.$frameSync();
		this.$dynamicThrottle();

		var self = this;
		this.$container.on('videoloadcomplete', function(e, video)
		{
			if(video.canplaythrough && video.loaded)
			{
				if(video.base == false) 
					self.loaded++;
			}
			self.$loaded();
		});

		if(this.videos.length)
		{
			CurrentVideo = this.videos[0];
			var config = $.extend(CurrentVideo.config, {
				i: -1,
				loop: false,
				base: true,
				autoplay: false,
				source: this.baseTrack
			});

			config.i = -1;
			config.loop = false;
			config.base = true;
			BaseVideo = new VHSVideo(CurrentVideo.config);
			BaseVideo.$dom.addClass('base');
			BaseVideo.v.addEventListener('seeked', function()
			{
				if(self.playing)
					this.play();
			});

			BaseVideo.load();
		}
		
		for(var i in this.videos)
		{
			var video = this.videos[i];
			video.v.addEventListener('seeked', function() { 
				self.$seeked();
			});

			this.$container.append(video.$dom);

			if(!video.loaded) 
				video.load();
		}

		this.initialized = true;
	},

	$loaded: function()
	{
		this.$progressStart.parent().addClass('load-begin');
		this.$progressStart.html( this.loaded );
		this.$progressEnd.html( this.videos.length );
			
		if(!this.loadComplete && this.loaded >= this.videos.length)
		{
			this.$loadComplete();
			return true;
		}
		return false;
	},

	$loadComplete: function()
	{
		if(this.destroyed) return;

		console.log('All videos loaded');
		this.loadComplete = true;
		this.$container.addClass('loaded');

		for(var i in this.videos)
		{
			var vid = this.videos[i];
			
			if(!vid.$dom.hasClass('loaded'))
			{
				vid.$dom.addClass('loaded');
			}
		}
		
		if(!BaseVideo.$dom.hasClass('loaded'))
		{
			var baseData = this.baseTrack ? BaseVideo.data : this.videos[0].$dom.prop('src');
			BaseVideo.$dom.prop('src', baseData);
			BaseVideo.$dom.addClass('loaded');
		}		
		console.log("AUTOPLAY", this.config.autoplay);

		if(this.config.autoplay)
		{
			this.play();
		}
	},

	$destroy: function()
	{
		this.destroyed = true;
		this.playing = false;
		this.loadComplete = false;

		for(var i in this.videos)
		{
			var vid = this.videos[i];
			vid.pause();
			vid.$dom.remove();
		}

		if(BaseVideo)
		{
			BaseVideo.pause();
			BaseVideo.$dom.remove();
		}

		this.$container.removeClass('loaded')
			.removeClass('playing');

		this.videos = [];
		BaseVideo = null;
		LastVideo = null;
		CurrentTime = 0;

		console.log('Destroyed');
	},

	$reset: function()
	{
		console.log('Reset');

		this.$container.removeClass('playing');
		this.$container.addClass('even').removeClass('odd');

		CurrentTime = 0;
		this.playing = false;
		this.firstPlay = true;

		if(BaseVideo && this.loadComplete)
		{			
			CurrentVideo.pause();
			CurrentVideo.v.currentTime = CurrentTime;

			BaseVideo.v.currentTime = CurrentTime;
			BaseVideo.v.playing = false;

			for(var i in self.videos)
			{
				var vid = self.videos[i];
				
				vid.pause();
				vid.v.currentTime = 0;
			}
		}		
	},

	$ended: function()
	{
		console.log('ended');
		console.log(this.config.loop);
		this.$reset();
		
		if(this.config.loop)
		{
			this.$container.trigger('click');
			this.nextVideo();
		}
	},

	$seeked: function()
	{
		console.log('FSDFSDFSDFSDF');
		console.log("seek to " + CurrentTime);

		if(this.playing)
		{
			if(CurrentVideo.i != this.i)
			{
				return;
			}

			CurrentVideo.v.play();
			if(BaseVideo.v.paused) BaseVideo.v.play();
		}
		if(LastVideo && LastVideo.i != this.i) 
		{
			LastVideo.hide();
		}
		CurrentVideo.show();
		LastVideo = CurrentVideo;
	},

	$getNextN: function(n)
	{
		var max = this.videos.length-1;
		
		if(this.firstPlay) return 1;
		if(n >= max) return 0;

		return n+1;
	},

	setPoster: function(url)
	{
		this.$container.attr('data-poster', url);
		// this.$container.css({
		// 	background: 'url(' + url + ')'
		// });
		
	},

	addVideo: function(config)
	{
		config = $.extend(config, {
			i: this.videos.length,
			source: config.source,
			manager: this,
			preload: this.config.preload | ''
		});

		var video = new VHSVideo(config);
		this.videos.push(video);

	},

	nextVideo: function()
	{
		if(!this.loadComplete) return;
		if(RateLimit)
		{
			var ts = new Date().getTime() / 1000;
			var diff = ts - _lastClick;
			
			if((ts - _lastClick) < RateLimit)
			{
				console.log('Click ignored');
				return;
			}
			_lastClick = ts;
		}

		var n = this.$getNextN(this.i);
		this.i = n;
		
		var baseTime = BaseVideo.v.currentTime;
		var newTime = CurrentVideo.v.currentTime;
		var diff = (baseTime - newTime);

		if(SyncThreshold && !DynamicThrottle)
		{
			if(diff >= SyncThreshold)
			{
				CurrentTime = newTime;
			}
			else
			{
				CurrentTime = newTime;
			}
		}
		else
		{
			CurrentTime = CurrentVideo.v.currentTime;
		}

		var nextVideo = this.videos[n];
		
		if(this.firstPlay)
		{
			this.firstPlay = false;
		}

		// LastVideo = CurrentVideo;
		CurrentVideo = nextVideo;
		nextVideo.v.currentTime = CurrentTime;

		if(n % 2 == 0)
		{
			this.$container.addClass('even').removeClass('odd');
		}
		else
		{
			this.$container.addClass('odd').removeClass('even');
		}

		if(this.playing)
		{
			this.play(nextVideo);
		}
	},

	play: function(video)
	{
		video = video || CurrentVideo;

		if(video && this.loadComplete)
		{
			this.playing = true;
			this.$container.removeClass('paused');
			CurrentVideo.playing = true;
			video.v.currentTime = CurrentTime + TransitionDelay;
		}	
	},

	pauseAll: function()
	{
		this.playing = false;
		this.$container.addClass('paused');

		if(BaseVideo)
		{
			BaseVideo.pause();
		}
		for(var i in this.videos)
		{
			this.videos[i].pause();
		}
	},

	hideAllBut: function(v)
	{
		for(var i in this.videos)
		{
			if(i == v.i) continue;
			
			var video = this.videos[i];
			video.hide();
		}
		return this;
	},

	$dynamicThrottle: function()
	{
		if(this.playing)
		{
			var baseTime = BaseVideo.v.currentTime;
			var newTime = CurrentTime;
			var diff = Math.abs(baseTime - newTime);

			if(DynamicThrottle)
			{
				var defaultPlaybackRate = BaseVideo.v.defaultPlaybackRate;
				var playbackRate = BaseVideo.v.playbackRate;
				var threshold = DynamicThrottleThreshold || 0;
				//If the base track's current time is greater than 
				//the current video's time, increase the base track's playback rate
				//by DynamicThrottleIncrement on each transition until it catches up (within the threshold)
				// console.log({
				// 	diff: diff,
				// 	threshold: threshold,
				// 	playbackRate: playbackRate,
				// 	baseTime: baseTime,
				// 	newTime: newTime,
				// 	currentTime: CurrentTime
				// });

				if(diff >= DynamicThrottleThreshold)
				{
					if(baseTime > newTime)
					{
						console.log('too far ahead by ' + diff + ', decreasing speed to ' + (playbackRate - DynamicThrottleIncrement));
						playbackRate = playbackRate - DynamicThrottleIncrement;
						playbackRate = Math.min(DynamicThrottleMax, playbackRate);
					}
					else if(baseTime < newTime)
					{
						console.log('too far behind by ' + diff + ' decreasing speed to ' + (playbackRate - DynamicThrottleIncrement));
						playbackRate = playbackRate + DynamicThrottleIncrement;
						playbackRate = Math.max(DynamicThrottleMin, playbackRate);
					}
					BaseVideo.v.playbackRate = playbackRate;
				}
				else if(playbackRate != defaultPlaybackRate)
				{
					console.log('caught up');
					//We're caught up, so make it normal.
					
					BaseVideo.v.playbackRate = 1.0;
				}
			} 
		}

		if(!this.destroyed)
		{
			var self = this;
			setTimeout(function()
			{
				self.$dynamicThrottle();
			}, DynamicThrottleRate);
		}
	},

	$frameSync: function()
	{
		if(BaseVideo && BaseVideo.v.paused == false)
		{
			CurrentTime = CurrentVideo.v.currentTime || BaseVideo.v.currentTime || 0;
		}

		var self = this;
		requestAnimationFrame(function()
		{
			self.$frameSync();
		})
	}
};


var VHSVideo = function(config)
{
	this.config = config || {};
	
	this.i = config.i || 0;
	this.manager = config.manager;
	this.canplaythrough = false;
	this.loaded = false;
	this.base = config.base || false;
	this.source = config.source;
	this.$dom = $('<video></video>')
		.prop('autoplay', false)
		.prop('loop', true)
		.prop('preload', this.config.preload || this.manager.config.preload || 'auto')
		.prop('controls', this.config.controls || this.manager.config.controls || false)
		.addClass('vhs');
	this.v = this.$dom[0];
	
	if(this.config.poster && this.i == 0)
	{
		this.$dom.prop('poster', this.config.poster)
	}	

	if(this.base) 
	{
		this.$dom.prop({
			id: 'video-base',
			muted: false
		}).addClass('base');
	}
	else
	{
		this.$dom.prop({
			id: 'video-' + this.i,
			muted: true
		});
	}

	var self = this;
	this.v.addEventListener('canplaythrough', function()
	{
		self.loaded = true;	
		self.canplaythrough = true;
		self.manager.$container.trigger('videoloadcomplete', self);
	});

	self.v.addEventListener('pause', function()
	{
		console.log('Paused');
		self.playing = false;
		
		if(!self.base && BaseVideo)
			BaseVideo.pause();
	});

	self.v.addEventListener('play', function()
	{
		if(!BaseVideo) return;

		console.log('Resume');
		self.playing = true;
		self.manager.$container.addClass('playing');
		
		BaseVideo.v.CurrentTime = CurrentTime;
		// BaseVideo.v.play();
	});

	self.v.addEventListener('ended', function()
	{
		console.log('Ended');

		self.playing = false;

		if(self.manager.playing)
			self.manager.$ended();
	});
	
}

VHSVideo.prototype = {
	load: function(callback)
	{
		console.log('Beginning load of video #' + this.i);
		if(!this.source)
			return;

		var self = this;
		$.get(this.source, function(data)
		{
			console.log('video #' + self.i + ' load complete');
		
			// console.log(data);
			self.$dom.prop('src', data);
			self.loaded = true;
			self.v.source = data;

			if(callback) callback();
		});
	},

	pause: function()
	{
		this.playing = false;
		this.v.pause(CurrentTime);
	},

	play: function()
	{
		if(BaseVideo || CurrentTime == 0 || this.v.currentTime == 0)
		{
			console.log('Playing from 0');

			this.v.play();
			return;
		}
		this.v.currentTime = CurrentTime;
	},

	hide: function()
	{
		this.$dom.removeClass('playing');
	},

	show: function()
	{
		if(this.base == false) this.$dom.addClass('playing');
	}
}