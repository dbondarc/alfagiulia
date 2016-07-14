var Utilities = {
    environmentDetector: function() {
        var userAgent = window.navigator.userAgent;

        return {
            getUserAgent: function() {
                return userAgent;
            },
            isiOS: function() {
                return ( /(iPad|iPhone|iPod)/gi ).test( userAgent );
            },
            isAndroid: function() {
                return ( /(Android)/gi ).test( userAgent );
            },
            isWindowsPhone: function() {
                return ( /(IEMobile)/gi ).test( userAgent );
            },
            isBB10: function() {
                return ( /(BB10)/gi ).test( userAgent );
            },
            isMobile: function() {
                var s = this;
                return ( s.isiOS() || s.isAndroid() || s.isWindowsPhone() || s.isBB10() );
            }
        };
    },

    getEnvironment: function()
    {
        if(Utilities.checkAnchorValue('dev'))
        {
            return 'dev';
        }

        if(Utilities.checkAnchorValue('prod-nefta'))
        {
            return 'prod-nefta';
        }

        if(Utilities.checkAnchorValue('prod-emea'))
        {
            return 'prod-emea';
        }

        return 'prod-nefta';
    },

    checkAnchorValue: function(value)
    {
        if(ANCHOR.indexOf('#' + value) > -1)
        {
            return true;
        }
        return false;
    },

    getLanguage: function()
    {
        var languages = [
            "english",
            "french",
            "italian",
            "german",
            "spanish"
        ];

        for(var i in languages)
        {
            var lang = languages[i];
            if(ANCHOR.indexOf('lang-' + lang) > -1)
            {
                return lang;
            }
        }
        return false;
    },

    generateFileList: function(type, config)
    {
        var results = {};
        var defaults = {
            files: [],
            prefix: '',
            mp4: true,
            webm: true,
            b64: false,
            mobile: false,
            folder: ''
        };

        var callbacks = {
            colorizer: Utilities.buildURL,
            deep_dives: Utilities.buildURL,
            visualizer: Utilities.getVisualizerFiles,
        };
 
        config = $.extend(defaults, config);

        var files = config.files;

        for(var key in files)
        {
            var file = files[key];
            results[file] = callbacks[type](file, config);
        }

        return results;
    },

    buildURL: function(filename, config)
    {
        var folder = config.folder; 
        var url = config.prefix + folder + '/' + filename;
        var b64 = config.mobile ? '' : '.b64';
        var files = {};

        if(config.webm)
        {
            files.webm = url + '.webm' + b64;
        }
        if(config.mp4)
        {
            files.mp4 = url + '.mp4' + b64;
        }

        return files;
    },

    getVisualizerFiles: function(file, config)
    {
        console.log(file);

        var files = {};
        var b64 = config.mobile ? '' : '.b64';
        var url = config.prefix + config.folder + '/' + file;

        if(config.webm)
        {
            files.webm = url + '.webm' + b64;
        }

        if(config.mp4)
        {
            files.mp4 = url + '.mp4' + b64;
        }

        return files;
    }
}

/*var DebugConsole = function(debug, mobile)
{
    this.container = $('#debug-console');
    this.textarea = $('#debug-console textarea');
    this.submit = $('#debug-console input[name=save_log]');
    var self = this;
    
    if(debug && mobile)
    {
        // $(document.body).addClass('debug');
    }

    if(!debug)
    {
        console.log = function() {}; 
    }
    else if(debug && mobile)
    {
        console.log = function()
        {  
            var args = Array.prototype.slice.call(arguments);
            self.textarea.append( args.join("\n") + "\n");
        }
    }

    this.submit.click(function()
    {
         $.ajax({
            type: 'POST',
            url: CONFIG.App.LogURL,
            data: {
                body: self.textarea.text()
            }
        });
    });
}*/
