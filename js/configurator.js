////Change this value to whatever we eventually have determining which language to use
var ClientLanguage = ClientLanguage || "english";
//var CDN = 'http://cdn.robotink.com/alfaphase2b/';
// var CDN = 'http://www.alfaromeousa.com/ar_nafta/videos/videosync/';
//var CDN = 'http://dev.synful.us/alpha-new/videos/';
var CDN = CONFIG.CDN;
var YT_READY = true;
var isPortrait = false;

// Check screen orientation
function readDeviceOrientation() {
    if ( window.innerWidth > window.innerHeight ) {
        isPortrait = false;  // Landscape
    } else {
        isPortrait = true;   // Portrait
    }
}

window.onresize = readDeviceOrientation;


function onYouTubeIframeAPIReady()
{
    YT_READY = true;
};

var State = function(name, overrides)
{
    this.player = null;
    this.ready = overrides.ready || false;
    this.playing = overrides.playing || false;
    this.done = overrides.done || false;
    this.name = name;
}

var Configurator = function(container, mobile_container)
{
    Configurator.config = CONFIG;
    this.config = CONFIG;
    // Configurator.config.CDN = './videos/';

    this.poster_extension = 'jpg';

    this.container = CONFIG.App.MOBILE ? mobile_container : container;

    this.config = {
        container: this.container,
        autoplay: !CONFIG.App.MOBILE,
        loop: true,
        controls: false
    };
    this.states = [];
    var self = this;

    if (CONFIG.App.USE_YOUTUBE)
    {
        var player = document.createElement('script');
        player.src = "https://www.youtube.com/iframe_api";

        var prependto = document.getElementsByTagName('script')[0];
        prependto.parentNode.insertBefore(player, prependto);

        return;
    }

}


Configurator.generateVisualizerFilenames = function(options, mobile)
{
    //format: $bodyColor_$wheelType_$wheelColor_$caliper[_$mobile][_$dayOrNight]
    var config = {
        bodyColor: options.color || 'rossoalfa',
        wheelType: options.wheel || 'tecnico',
        wheelColor: options.wcolor || 'dark',
        caliper: options.caliper || 'red',
        mobile: CONFIG.App.MOBILE
    };

    var baseName = config.bodyColor + '_' + config.wheelType + '_' + config.wheelColor + '_' + config.caliper;
    var prefix = CONFIG.CDN + 'visualizer';
    var files = [];

    if (CONFIG.App.USE_YOUTUBE)
    {

        prefix = CONFIG.App.YOUTUBE_PREFIX;

        if (config.mobile)
        {
            var videoId = CONFIG.Youtube[baseName + '_m'];
            if (videoId)
            {
                files = [
                    videoId
                ];
            }


        }
        else
        {
            var day = CONFIG.Youtube[baseName + '_day'];
            var night = CONFIG.Youtube[baseName + '_night'];

            files = [
                day,
                night
            ];
        }

        return files;
    }
};

Configurator.generateDeepDiveFilenames = function(type, language, mobile)
{
    mobile = mobile || false;
    var folder = mobile ? 'deep_dives_mobile/' : 'deep_dives/';
    var m = mobile ? '_m' : '';

    if (!mobile)
    {

        var filenames = {
            'splitter':
            {
                webm: CONFIG.CDN + folder + 'splitter.webm.b64',
                mp4: CONFIG.CDN + folder + 'splitter_' + language + 'callouts.mp4.b64',
            },
            'engine':
            {
                webm: CONFIG.CDN + folder + 'engine.webm.b64',
                mp4: CONFIG.CDN + folder + 'engine_' + language + 'callouts.mp4.b64',
            },
            'carbonfiber':
            {
                webm: CONFIG.CDN + folder + 'carbonfiber.webm.b64',
                mp4: CONFIG.CDN + folder + 'carbonfiber_' + language + 'callouts.mp4.b64'
            },
        }
    }
    else
    {
        var filenames = {
            'splitter':
            {
                webm: CONFIG.CDN + folder + 'splitter_' + language + 'callout_m.mp4',
                mp4: CONFIG.CDN + folder + 'splitter_' + language + 'callout_m.webm',
            },
            'engine':
            {
                webm: CONFIG.CDN + folder + 'engine_' + language + 'callout_m.mp4',
                mp4: CONFIG.CDN + folder + 'engine_' + language + 'callout_m.webm',
            },
            'carbonfiber':
            {
                webm: CONFIG.CDN + folder + 'carbonfiber_' + language + 'callout_m.webm',
                mp4: CONFIG.CDN + folder + 'carbonfiber_' + language + 'callout_m.mp4',
            },
        }
    }

    return filenames[type];
},

Configurator.prototype = {
    init: function(config)
    {
        Configurator.config = config;
        this.config = config;
        Configurator.config.CDN = config.CDN;
        this.language = ClientLanguage || config.language;
    },

    reset: function()
    {
        this.container.addClass('fresh');
        this.container.removeClass('paused launch colorizer deep-dives visualizer engine splitter carbonfiber');
    },

    destroy: function()
    {
        if (CONFIG.App.USE_YOUTUBE)
        {
            this.YT.$destroy.bind(this)();
        }

        if (this.vhsPlayer)
        {
            this.vhsPlayer.$destroy();
        }
    },

    loadColorizer: function()
    {
        this.reset();
        var self = this;
        var container = this.container;
        var height = (container.height() / 2) + 'px';
        var files = CONFIG.Files.colorizer;

        this.container.addClass('colorizer');

        var overlays = [
            'rossocompetizionetricoat',
            'rossoalfa',
            'trofeowhitetricoat',
            'vulcanoblackmetallic',
            'vesuviograymetallic',
            'montecarlobluemetallic',
            'silverstonegraymetallic'
        ];

        if(CONFIG.App.USE_YOUTUBE && !CONFIG.App.MOBILE)
        {
            var slices = [
                'rossoalfa',
                'vesuviograymetallic',
                'trofeowhitetricoat',
                'rossocompetizionetricoat',
                'silverstonegraymetallic',
                'vulcanoblackmetallic',
                'montecarlobluemetallic',
            ];

            container.addClass('selector');
            var selection_video = $('#colorizer-selection-video');

            selection_video[0].play();

            selection_video.click(function(event)
            {
                var width = container.width();
                var num_tiles = slices.length;
                var tile_width = Math.ceil(width / num_tiles);

                var clientX = event.clientX;

                var selected = null;

                //We'll brute force this cause my brain no worky today
                for(var x = 0; x < num_tiles; x++)
                {
                    var xpos = tile_width * (x + 1);

                    if(clientX < xpos)
                    {
                        selected = x;
                        break;
                    }
                }

                if(selected != null && slices[selected])
                {
                    var videoID = CONFIG.Youtube[ slices[selected] ];
                    self.container.removeClass('selector');
                    selection_video[0].pause();
                    self.YT.renderVideo.bind(self)(videoID, 'yt-colorizer-' + slices[selected]);
                }
                console.log(width, tile_width, clientX);
            });
        }
        else if(CONFIG.App.MOBILE)
        {
            var container = this.container.find('#overlay-wrapper');
            container.empty();


            var tile_height = 0;
            var aspect_ratio = 1;

            var caption = $('<div>')
                .addClass('selection')
                .attr('id', 'overlay-caption');
            var background;

            //placeholder, invisible. just to get width/height for tiles
            if ( isPortrait ) {
                background = $('<img>')
                    .attr('src', 'img/AlfaRomeo_ETC_Menu_Mobile_Portrait.jpg');
            } else {
                background = $('<img>')
                    .attr('src', 'img/AlfaRomeo_ETC_Menu_Mobile_Landscape.jpg');
            }

            caption.append(img);
            container.append(caption);


            for(var i in overlays)
            {
                var filename = overlays[i];
                var overlay = $('<div>')
                    .css({
                        // 'background-image': 'url(img/tiles/frame-' + filename + '.jpg)'
                    })
                    .addClass('selection')
                    .attr('id', 'overlay-' + filename)
                    .data('filename', filename);

                var img = $('<img>')
                    .attr('src', 'img/tiles/frame-' + filename + '.jpg');

                overlay.click(function()
                {

                    var filename = $(this).data('filename');
                    console.log(filename);
                    // self.container.addClass('selected');
                    self.YT.renderVideo.bind(self)(
                        CONFIG.Youtube[filename],
                        'yt-colorizer-mobile-video'
                    );
                });

                overlay.append(img);
                container.append(overlay);
            }

            var bgLoad = function()
            {
                var width = $(this).width();
                var height = $(this).height();

                var oWidth = $('#overlay-wrapper').innerWidth();
                var oHeight = $('#overlay-wrapper').innerHeight();

                var curWidth = $(document.body).width();
                var curHeight = $(document.body).height();

                var selWidth, selHeight;

                if (curWidth < curHeight) {
                    selWidth = oWidth / 2;
                    selHeight = oHeight / 4;
                } else {
                    selWidth = oWidth / 4;
                    selHeight = oHeight / 2;
                }

                if (curWidth < curHeight) {
                    $('#overlay-wrapper').css({'margin-top':0, 'max-width': '100%', 'height': '100%'});
                } else {
                    $('#overlay-wrapper').css({'margin-top':0, 'max-width': '100%', 'height': '100%'});
                }

                var newHeight = Math.min(curHeight, newHeight);

                container.css({
                    height:  newHeight + 'px'
                })
                .find('.selection').css({
                    width: (selWidth) + 'px',
                    height: (selHeight) + 'px'
                });

            }

            $(window).on('resize', function() {
                readDeviceOrientation();
                var background;
                if ( isPortrait ) {
                    background = $('<img>')
                        .attr('src', 'img/AlfaRomeo_ETC_Menu_Mobile_Portrait.jpg');
                } else {
                    background = $('<img>')
                        .attr('src', 'img/AlfaRomeo_ETC_Menu_Mobile_Landscape.jpg');
                }

                background[0].onload = bgLoad();
            });

            background[0].onload = bgLoad();
        }
    },

    loadDeepDives: function(type, language)
    {
        this.reset();

        var container = this.container;
        var vhsPlayer = this.vhsPlayer;
        var files = CONFIG.App.MOBILE ? CONFIG.Files.deep_dives_mobile[type] : CONFIG.Files.deep_dives[type];
        var folder = CONFIG.App.MOBILE ? CONFIG.Folders.Mobile.deep_dives : CONFIG.Folders.Desktop.deep_dives;

        //We'll screw with language later
        var language = CONFIG.App.ClientLanguage || 'english';
        var options = {
            files: files,
            prefix: CONFIG.App.CDN,
            mp4: true,
            webm: true,
            b64: CONFIG.App.MOBILE ? false : true,
            mobile: CONFIG.App.MOBILE,
            folder: folder
        };

        var extension = CONFIG.App.VideoExtension;
        var results = {};

        container.addClass('deep-dives');

        if (CONFIG.App.USE_YOUTUBE)
        {
            this.YT.loadDeepDives.bind(this)(type, language);
            return;
        }


    },

    loadVisualizer: function(videoData)
    {
        this.reset();

        var container = this.container;
        var vhsPlayer = this.vhsPlayer;
        var poster = Configurator.config.CDN + this.visualizer_folder + 'posters/';
        var files = CONFIG.App.MOBILE ? CONFIG.Files.visualizer_mobile : CONFIG.Files.visualizer;
        var folder = CONFIG.App.MOBILE ? CONFIG.Folders.Mobile.visualizer : CONFIG.Folders.Desktop.visualizer;

        var options = {
            files: files,
            prefix: CONFIG.App.CDN,
            mp4: true,
            webm: true,
            b64: CONFIG.App.MOBILE ? false : true,
            mobile: CONFIG.App.MOBILE,
            folder: folder
        };

        var config = {
            bodyColor: videoData.color || 'rossoalfa',
            wheelType: videoData.wheel || 'tecnico',
            wheelColor: videoData.wcolor || 'dark',
            caliper: videoData.caliper || 'red',
            mobile: CONFIG.App.MOBILE
        };

        container.addClass('visualizer');

        if (CONFIG.App.USE_YOUTUBE)
        {
            this.YT.loadVisualizer.bind(this)(videoData);
            return;
        }
    },

    loadLaunchVideo: function()
    {
        this.reset();
        this.container.addClass('launch');

        if(CONFIG.App.USE_YOUTUBE)
        {
            //fuck you fucking piece of shit you goddamn cunt ass piece of garbage android bullshit fucking piece of nonsense

            var videoID = CONFIG.Youtube['90snoneinteractive'];
            this.YT.renderVideo.bind(this)(videoID, 'yt-launch-video');
            //
            // var iframe = $('<iframe id="yt-launch-video" class="yt-video"  src="https://www.youtube.com/embed/' + videoID + '" frameborder="0" allowfullscreen></iframe>');
            // this.container.append(iframe);

        }
    },

    play: function()
    {

    },

    YT:
    {
        $init: function()
        {
            var self = this;
            this.YT.currentVideo = null;
            this.YT.config = {
                width: $(window).width(),
                height: $(window).height(),
                events:
                {
                    'onReady': function(event)
                    {
                        self.YT.onReady.bind(self)(event)
                    },
                    'onStateChange': function(event)
                    {
                        self.YT.onStateChange.bind(self)(event);
                    }
                },
                videoId: null,
                playerVars:
                {
                    autoplay: 0,
                    controls: 0,
                    loop: 1,
                    fs: 0,
                    modestbranding: 0,
                    playsinline: 0,
                    rel: 0,
                    showinfo: 0,
                    theme: 'dark'
                }
            };

            $(window).resize(function()
            {
                self.YT.config.width = $(window).width();
                self.YT.config.height = $(window).height();

                self.container.find('.yt-video').css(
                {
                    width: self.YT.config.width,
                    height: self.YT.config.height
                });

                console.log('resizing client');
            });

            this.YT.$destroy.bind(this)();
        },

        $destroy: function()
        {
            console.log('YT DESTROY');

            this.states = [];
            this.container.find('.yt-video').remove();
            this.container.addClass('loading').removeClass('playing selected selector');
            this.container.find('#info-popup').off('click');

            var selection_video = $('#colorizer-selection-video');

            if(!CONFIG.App.MOBILE)
            {
                selection_video[0].pause();
                selection_video[0].currentTime = 0;
            }


        },

        getURLForID: function(id)
        {
        //    https://www.youtube.com/watch?t=6&v=6v40XahLjBs
            return 'https://www.youtube.com/watch?v=' + id;
        },

        onReady: function(event)
        {
            var state = this.YT.currentVideo;

            console.log('yt ready', state);
            console.log()
            if (this.YT.checkComplete.bind(this)())
            {
                this.container.removeClass('loading').addClass('playing');
                this.YT.playAll.bind(this)();
            }
        },

        renderVideo: function(videoID, container_id)
        {
            this.YT.$init.bind(this)();
            this.container.append($('<div id="' + container_id + '" class="yt-video">'));

            var config = $.extend(this.YT.config,
            {
                videoId: videoID
            });

            // var yt_url = this.YT.getURLForID(videoID);

            config.playerVars.playlist = videoID;
            config.playerVars.autoplay = CONFIG.App.MOBILE ? 0 : 1;

            this.YT.currentVideo = {
                name: container_id,
                player: new YT.Player(container_id, config)
            }

            this.states.push(this.YT.currentVideo);

        },

        playAll: function(onlyPaused)
        {
            if(CONFIG.App.MOBILE) return; //can't manually play in mobile
            this.YT.syncVideos.bind(this)();

            for (var i in this.states)
            {
                this.states[i].ready = true;

                if (!onlyPaused || (onlyPaused && this.states[i].player.getPlayerState() == YT.PlayerState.PAUSED))
                    this.states[i].player.playVideo();
            }
        },

        pauseAll: function()
        {
            if(CONFIG.App.MOBILE) return;
            this.YT.syncVideos.bind(this)();

            for (var i in this.states)
            {
                if (this.states[i].player.getPlayerState() != YT.PlayerState.PAUSED)
                    this.states[i].player.pauseVideo();
            }

        },

        checkComplete: function()
        {
            for (var i in this.states)
            {
                var state = this.states[i];
                var player = state.player;

                if (!player || !player.getPlayerState) return false;
                if (player.getPlayerState() < YT.PlayerState.CUED)
                {
                    return false;
                }
            }

            return true;
        },

        onStateChange: function(event)
        {
            var state = this.YT.currentVideo;
            console.log('state change', event, state);

            if (!state) return;

            if (this.YT.checkComplete.bind(this)())
            {
                this.YT.playAll.bind(this)();
            }

            if (event.data == YT.PlayerState.PLAYING)
            {
                this.container.removeClass('loading').addClass('playing loaded');
                this.YT.playAll.bind(this)();
            }

            if (event.data == YT.PlayerState.ENDED)
            {
                // state.playing = false;
                // state.done = true;

                // for(var i in this.states)
                // {
                //     this.states[i].player.seekTo(0);
                // }

                // this.YT.playAll.bind(this)(true);
            }

            if (event.data == YT.PlayerState.PAUSED)
            {
                console.log("PAUSED...");

                this.YT.pauseAll.bind(this)();
                // for(var i in this.states)
                // {
                //     this.states[i].pauseVideo();
                // }

            }

            if (event.data == YT.PlayerState.BUFFERING)
            {
                // this.YT.pauseAll
            }

            if (event.data == YT.PlayerState.CUED)
            {
                console.log("CUED...");
                // event.target.seekTo(playerRunTime);
                // event.target.playVideo();
                this.YT.playAll.bind(this)();
            }
        },

        syncVideos: function()
        {
            console.log(this);
            if(CONFIG.App.MOBILE) return;
            if(!this.YT.currentVideo) return;

            var basePlayer = this.YT.currentVideo.player;

            for (var i in this.states)
            {
                var p = this.states[i].player;
                var currentTime = basePlayer.getCurrentTime();

                if (this.states[i].name != this.YT.currentVideo.name && p.getCurrentTime() != currentTime)
                {
                    // p.pauseVideo();
                    p.seekTo(currentTime);
                }

            }
        },

        loadDeepDives: function(type, language)
        {
            this.YT.$init.bind(this)();

            if (CONFIG.App.MOBILE)
                var file = type + '_' + language + 'callouts';
            else
                var file = type + '_' + language + 'callouts';

            var videoIDs = [
                // CONFIG.Youtube[type + CONFIG.App.MOBILE ? '_m' : ''],
                CONFIG.Youtube[file]
            ];

            for (var i in videoIDs)
            {
                var videoID = videoIDs[i];
                if (videoID)
                {
                    var config = $.extend(this.YT.config,
                    {
                        videoId: videoID
                    });
                    config.playerVars.playlist = videoID;
                    config.playerVars.autoplay = CONFIG.App.MOBILE ? 0 : 1;
                    this.container.append($('<div id="yt-deep-dive" class="yt-video">'));
                    this.YT.currentVideo = {
                        name: file,
                        player: new YT.Player('yt-deep-dive', config)
                    }
                    this.states.push(this.YT.currentVideo);
                }
            }

        },

        loadVisualizer: function(videoData)
        {
            this.YT.$init.bind(this)();

            this.day = new State('day',
            {
                ready: false,
                playing: false,
                done: false
            });

            this.night = new State('night',
            {
                ready: false,
                playing: false,
                done: false
            });

            this.YT.currentVideo = this.day;
            this.states = [this.day, this.night];

            var self = this;
            var links = Configurator.generateVisualizerFilenames(videoData);
            var config = $.extend(this.YT.config,
            {
                videoId: links[0],
            });
            config.playerVars.playlist = links[0];

            this.container.append($('<div id="yt-day" class="yt-video">'));
            this.container.append($('<div id="yt-night" class="yt-video">'));

            this.day.player = new YT.Player('yt-day', config);

            var nightConfig = $.extend(config,
            {
                videoId: links[1],
                playlist: links[1]
            });
            config.playerVars.playlist = links[1];

            this.night.player = new YT.Player('yt-night', nightConfig);

            this.container.find('#info-popup').click(function(event)
            {

                // self.YT.syncVideos.bind(self)();
                if (self.container.hasClass('night'))
                {
                    self.currentVideo = self.day;
                    self.container.removeClass('night');
                }
                else
                {
                    self.currentVideo = self.night;
                    self.container.addClass('night');
                }

            });
        }
    }
}

$(document).ready(function() {

    //Check for IE <10, Safari
    if ($('html').is('.ie6, .ie7, .ie8, .ie9'))
    {
        CONFIG.App.MOBILE = true;
    }

    if (is_safari) {
        $('#loader').hide();
    }

    if (CONFIG.App.USE_YOUTUBE)
    {
        $(document.body).addClass('youtube');
    }

    if (CONFIG.App.MOBILE)
    {
        $(document.body).addClass('mobile');
    }

    /*    DebugConsole(CONFIG.App.DEBUG, CONFIG.App.MOBILE);*/

    var configurator = new Configurator(
        $('#video-container'),
        $('#mobile-video-container')
    );

    var popup_container = $('#info-popup');
    var body = $('body');

    var mobile_container = $('#mobile-video-container')
    var mobile_videos = {
        colorizer:
        {
            webm: CDN + 'colorizer_mobile/30snoneinteractive.mp4',
            mp4: CDN + 'colorizer_mobile/30snoneinteractive.webm'
        },
        deep_dives:
        {
            engine: Configurator.generateDeepDiveFilenames('engine', ClientLanguage, true),
            splitter: Configurator.generateDeepDiveFilenames('splitter', ClientLanguage, true),
            carbonfiber: Configurator.generateDeepDiveFilenames('carbonfiber', ClientLanguage, true)
        },
        visualizer: []
    };

    if (videoData.mobile)
    {
        body.addClass('mobile');
    }

    $('#mobile-video-container video').each(function()
    {
        var video = $(this);
        this.addEventListener('play', function()
        {
            mobile_container.addClass('loaded playing');
        });

        this.addEventListener('end', function()
        {
            mobile_container.removeClass('playing');
        });
    });

    $('#vid-colorizer-launch').click(function()
    {
        popup_container
            .removeClass('popup-visualizer popup-deep-dives')
            .addClass('popup-colorizer');

        configurator.loadColorizer();
    });

    $('#visualizer-create-launch').click(function()
    {
        popup_container
            .removeClass('popup-colorizer popup-deep-dives')
            .addClass('popup-visualizer');

        configurator.loadVisualizer(videoData);
    });

    $('#video-launch-splitter').click(function()
    {
        popup_container
            .removeClass('popup-visualizer popup-colorizer')
            .addClass('popup-deep-dives');

        console.log('loading splitter deep dive');
        configurator.loadDeepDives('splitter', ClientLanguage);
    });

    $('#video-launch-engine').click(function()
    {
        popup_container
            .removeClass('popup-visualizer popup-colorizer')
            .addClass('popup-deep-dives');

        console.log('loading engine deep dive');
        configurator.loadDeepDives('engine', ClientLanguage);
    });

    $('#video-launch-carbonfiber').click(function()
    {
        popup_container
            .removeClass('popup-visualizer popup-colorizer')
            .addClass('popup-deep-dives');

        console.log('loading carbon fiber deep dive');
        configurator.loadDeepDives('carbonfiber', ClientLanguage);
    });

    //Stop the videos and clean up when we back out of a slide
    $('div.slide button.nav-btn.back, div.slide button.nav-btn.home').click(function()
    {
        configurator.destroy();
        $('video').each(function()
        {
            if(!CONFIG.App.MOBILE) this.pause();
            mobile_container.removeClass('playing');
        });
    });

        //Give the launch video a loading modal
    $('.vid-main-launch').click(function()
    {
        console.log('loading launch video');
        configurator.loadLaunchVideo();
    });


});