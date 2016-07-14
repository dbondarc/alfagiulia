// Added by Dan Bond
videoData = {                   // video data object
    "color": null,
    "wheel": null,
    "wcolor": null,
    "caliper": null,
    "mobile": false
},
globTimer = 500;

// Place some loading transition here
window.onload = function() {
    $('.globalWrapper').animate({'opacity':1}, globTimer, 'linear');
};

(function ( $, win, doc ) {
    var timer = 200,               // assign slider speed
    anim = "swing",                 // assign animation style
    wrapper = $('#ag-vid-slider'),  // slider section wrapper id
    articles = $('#ag-vid-slider article'),
    logo = $('#ag-vid-slider #s1 figure div div'),
    nav = $('#ag-vid-slider #s3 nav'),
    menu = $('#ag-vid-slider #s3 ul'),
    max = articles.length,
    lastSlide,
    activeSlide,
    sliderHovered,
    mouseTimer, liW, i;

    var AG = {
        apply: function( obj ) {
            $.extend( true, AG, obj );
        }
    };

    AG.apply({
        env: {
            isMobile: null,
            isiOS: null,
            isPortrait: null
        },
        config: CONFIG,
        utils: {
            envDetect: Utilities.environmentDetector,
        }
    });

    //Added by Matt Wilson's squirrel
    AG.env.isMobile = CONFIG.App.MOBILE || AG.utils.envDetect().isMobile();
    CONFIG.App.MOBILE = CONFIG.App.MOBILE || AG.env.isMobile;
    //End squirrel code

    // Check screen orientation
    function readDeviceOrientation() {
        if ( win.innerWidth > win.innerHeight ) {
            AG.env.isPortrait = false;  // Landscape
        } else {
            AG.env.isPortrait = true;   // Portrait
        }
    }

    window.onresize = readDeviceOrientation;
    readDeviceOrientation();
    videoData.mobile = CONFIG.App.Mobile || AG.env.isMobile;

    // iOS detection
    AG.env.isiOS = AG.utils.envDetect().isiOS();

    // Browser detection
    function getBrowserId () {
        var aKeys = ["MSIE", "Firefox", "Safari", "Chrome", "Opera", "Edge"],
            sUsrAg = navigator.userAgent, nIdx = aKeys.length - 1;

        for (nIdx; nIdx > -1 && sUsrAg.indexOf(aKeys[nIdx]) === -1; nIdx--);
        return nIdx
    }

    var isIE = getBrowserId() <= 0;  // Detects IE
    var isSafari = getBrowserId() == 2; // Detects Safari
    var isEdge = getBrowserId() == 5; // Detects Edge


    function resizeAll() {

        var yOffset = $('#header').height();
/*            height = $('#technology').offset().top;*/

        if (AG.env.isMobile && !isIE) {  // ALL MOBILE
            $('#ag-vid-slider #s1 figure div ul li, #ag-vid-slider #s2 figure div ul li').css('opacity',1);
            $('#s3 header ul').css({
                'width': win.innerWidth,
                'height': 'auto'
            }).last().css({
                'width': win.innerWidth,
                'height': 'auto'
            });

            $('#s3').stop().animate({
                scrollTop: $('ul.choose').position().top
            }, globTimer, 'swing');

            if (AG.env.isPortrait) {    // PORTRAIT
                liW = '100%';
                liH = '100%';
                $('.sliderContainer').css('top', 0);
            }
            else {  // LANDSCAPE
                liW = win.innerWidth;
                liH = '100%';
                $('.sliderContainer').css('top', 0);

                if ( liW > 768 ) { // target large mobile
                    $('.sliderContainer').css('top', yOffset);
                    $('.split').css('height', liH/3);
                }

            }
        }
        else {
            if ( wrapper.parent()[0] === $('body')[0] ) {
                liW = win.innerWidth;
                liH = win.innerHeight;
                yOffset = $('.primaryNav').height();
            } else {
                liW = wrapper.parent().width();
                liH = '100%';
            }
            $('.sliderContainer').css('top', yOffset);
        }

        $('#ag-vid-slider, article, figure').css({
            'width': liW,
            'height': liH,
            'max-height': 800
        });

        nav.css({
            'bottom':0,
            'right':0
        });

    }

    $(function(){
        var s1 = $('#s1 li'),
        s2 = $('#s2 li'),
        s3 = $('#s3 li'),
        s4 = $('#s4 li');

        function mouseStopped() {
            $('#s1 figure div div').stop(true, true).animate({
                'top':0,'left':0
            },1000,'swing', function(){
                $('#s1 figure div ul li').removeClass('on');
            });
        }

        function slideIdx() {
            activeSlide = $('article').index($('.active'));
            setTimeout(slideIdx, 1000);
            console.log(sliderHovered);
            if (!sliderHovered) {
                $('#s1 figure div div').stop(true, true).animate({
                    'top':0,'left':0
                },1000,'swing', function(){
                    $('#s1 figure div ul li').removeClass('on');
                });
                logo.stop().animate({'top':0,'left':0},800,'swing');
                $('#s1 figure div ul li').removeClass('on');             
            }            
            return activeSlide;
        };
        slideIdx();

        (function isPlaying() {
            var status = $('video').hasClass('playing');
            setTimeout(isPlaying, 1000);
            if (status) {
                setTimeout(function(){
                    $('#info-popup').fadeOut(globTimer);
                }, 3000);
            } else {
                $('#info-popup').fadeIn(globTimer);
            }
        })();

        function parseVal(dv) {
            var first = dv.split(" ")[0];
            var next = dv.split(" ")[1];
            videoData['wheel'] = first;
            videoData['wcolor'] = next;
        }

        function goToSlide(slideIndex) {
            i = $('article').index($('.active'));
            $this = $('article').eq(i);
            $next = $('article').eq(slideIndex);

            if(i >= 0 && i < max) {

                if (i === 1) {
                    $('#s3 .m-overlay').delay(2000).fadeOut(1000);
                    setTimeout(function(){
                        $('#s3 .m-overlay').remove();
                    },3000);
                }

                if ( i < slideIndex ) {
                    $this.css( 'left',0 ).stop(true, true).animate({
                        'left':-liW
                    }, timer, anim).removeClass('active');
                    $next.css( 'left',liW ).stop(true, true).animate({
                        'left':0
                    }, timer, anim).addClass('active');
                }

                else if ( i > slideIndex ) {
                    $this.css( 'left',0 ).stop(true, true).animate({
                        'left': liW
                    }, timer, anim).removeClass('active');
                    $next.css( 'left',-liW ).stop(true, true).animate({
                        'left':0
                    }, timer, anim).addClass('active');
                }

                else return false;
            }
        }

        function resetMenu() {
            $('.choose-tab').stop(true, true).animate({
                'top':$('header ul').eq(0).position().top+'px'
            },400, 'swing');
            $('header li').removeClass('selected');
            $('header ul').removeClass('choose').eq(0).addClass('choose');
            if ( !$('.build').hasClass('disabled') )
                $('.build').addClass('disabled');
        }

        function endVideo(video) {
            if ( video && video[0].currentTime > 0 ) {
                if ( video.length > 0 ) {
                    video.remove();
                    $('#info-popup').fadeIn(1000);
                    return true;
                } else {
                    return false
                }
            }
        }

        $('nav, .build').on('click', function() {
            resizeAll();
            $(win).scrollTop(0);
            resetMenu()
        });

        $('.next, .config-launch, #visualizer-create-launch, .dive-launch, #video-launch-splitter, #video-launch-engine, #video-launch-carbonfiber, #vid-colorizer-launch').on('click', function() {
            resizeAll();
            var slideNum = $(this).attr('data-slide');
            lastSlide = $(this).attr('data-origin');

            if (slideNum) {
                goToSlide(slideNum);
            } else {
                slideNum = $('article').index($('.active'));
                goToSlide(slideNum + 1);
            }

        });

        $('.prev').on('click', function() {
            resizeAll();
            var slideNum = $(this).attr('data-slide');

            if (slideNum) {
                goToSlide(slideNum);
            } else {
                slideNum = $('article').index($('.active'));
                goToSlide(Math.abs(i-1));
            }
        });

        $('.back').on('click', function() {
            resizeAll();
            if (lastSlide) goToSlide(lastSlide);
                else goToSlide(0);
        });

        $('.home').on('click', function() {
            resizeAll();
            goToSlide(0);
        });

        $('.vid-main-launch').on('click', function() {
            resizeAll();
            goToSlide(5);
        });

        $('#colorizer-selection-video, #overlay-wrapper').on('click', function(){
           $('#s6').find('.back').addClass('reset');
        });

        // Colorizer video back button should reset video selection
        $('#s6 .back').click(function() {
            if ($(this).hasClass('reset')) {
                setTimeout(function(){
                    $('#vid-colorizer-launch').trigger('click');
                }, 20);
                $(this).removeClass('reset');
            }
        });

        $(doc).on('mousemove', function(e) {
            var w = win.innerWidth/2,
                h = win.innerHeight/2,
                slideIndex = $('article').index($('.active'))+1,
                sel = null;     // selection

            if (slideIndex === 1) {
                if (e.pageY > h) sel = 2;       // deepdive
                else if (e.pageX < w) sel = 0;  // launch
                else sel = 1;                   // config

                switch (sel) {
                    case sel:
                    s1.not(s1.eq(sel)).removeClass('on');
                    if ( s1.eq(sel).hasClass('on') )
                        return;
                    else
                        s1.eq(sel).addClass('on');
                    break;
                }

                if ( !AG.env.isMobile ) {
                    if (sel === 0)
                        logo.stop().animate({'top':50,'left':50},800,'swing');
                    else if (sel === 1)
                        logo.stop().animate({'top':50,'left':-50},800,'swing');
                    else if (sel === 2)
                        logo.stop().animate({'top':-50,'left':0},800,'swing');
                    else {
                        return false
                    }
                }
            }

            else if (slideIndex === 2) {
                if (e.pageY < h) sel = 0;
                else sel = 1;

                switch (sel) {
                    case sel:
                    s2.not(s2.eq(sel)).removeClass('on');
                    if ( s2.eq(sel).hasClass('on') )
                        return false;
                    else
                        s2.eq(sel).addClass('on');
                    break;
                }
            }
        });

        $('#ag-vid-slider').on('mouseover', function() {
            sliderHovered = true;
        });

        $('#ag-vid-slider').on('mouseout', function() {
            sliderHovered = false;
        });

        s4.on('mouseover', function() {
            s4.removeClass('on');
            if ( $(this).hasClass('on') )
                return false;
            else
                $(this).addClass('on');
        });


        s3.on('click', function() {
            var $li = $(this),
                $ul = $(this).parent('ul'),
                dv = undefined || $li.attr('data-val'),
                vals = undefined || (dv ? dv.indexOf(" ") > -1 : false),
                idxChosen = undefined || menu.index($('ul.choose')),
                idxClicked = menu.index($ul),
                maxUls = menu.length;

            // go back
            if  ( idxChosen && idxClicked < idxChosen ) {
                menu.removeClass('choose').eq(idxClicked).addClass('choose');
                $('ul.choose li').removeClass('selected');
                $('.choose-tab').stop().animate({
                    'top':menu.eq(idxClicked).position().top+'px'
                },1000, 'swing');
            }

            // go forward
            if ( idxChosen === idxClicked ) {
                idxChosen = menu.index($('ul.choose'));

                if ( idxChosen <= maxUls ) {
                    $('ul.choose li').removeClass('selected');
                    $li.addClass('selected');
                    $ul.removeClass('choose').parent().next().find('ul').addClass('choose');

                    if ( idxChosen < maxUls ) {
                        $('.choose-tab').stop().animate({
                            'top':menu.eq(idxChosen+1).position().top+'px'
                        },1000, 'swing');
                    } else {
                        $('.choose-tab').stop().animate({
                            'top':menu.last().position().top+20+'px'
                        },1000, 'swing');
                    }

                    if ( AG.env.isMobile ) {
                        $('#s3').stop().animate({
                            scrollTop: $('ul.choose').position().top
                        }, 1000, 'swing');
                    }

                    if ( $('#s3').scrollTop() > 700 )
                        $('.m-overlay').remove();

                    if (vals) {
                        parseVal(dv);
                    } else {
                        for (var dc in videoData) {
                            if ( dc === $ul.attr('data-cat') )
                                videoData[dc] = dv;
                        }
                    }

                    for (var v in videoData) {
                        if (!videoData.hasOwnProperty(v)) continue;
                        if (videoData[v] === undefined || videoData[v] === null) {
                            if ( !$('.build').hasClass('disabled') )
                                $('.build').addClass('disabled');
                        } else {
                            $('.build').removeClass('disabled');
                        }
                    }
                }
            }
/*        console.log(videoData); */
        });

        resizeAll();

        $('#ag-vid-slider, #ag-vid-slider article, .slide, .m-slide, .container-x, .sliderContainer').css(
            'height', liH
        );

    });

    $(window).resize(function() {
        resizeAll();
    });

    $(window).load(function() {
       setInterval(function(){
           $(".loader").fadeOut(300);
           $('#ag-vid-slider').fadeIn(300);
       },2000);
    });

    window.requestAnimFrame=window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||function(a){window.setTimeout(a,1E3/60)};


})( jQuery, window, document );