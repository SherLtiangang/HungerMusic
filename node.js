var EventCenter = {
    on: function(type,handler){
        $(document).on(type,handler)
    },

    fire: function(type,data){
        $(document).trigger(type,data)
    }
}

var Footer  = {
    init: function(){
        this.$footer = $('footer')
        this.$ul = this.$footer.find('ul')
        this.$li = this.$footer.find('li')
        this.$box = this.$footer.find('.box')
        this.$leftBtn = this.$footer.find('.icon-left')
        this.$rightBtn = this.$footer.find('.icon-right')
        this.isToEnd = false
        this.isToStart = true
        this.isAnimate = false
        this.bind()
        this.render()
    },

    bind: function(){
        var _this = this
        this.$rightBtn.on('click',function(){
            if(_this.isAnimate) return
            var itemWidth = _this.$box.find('li').outerWidth(true)
            var rowcount = Math.floor(_this.$box.width()/itemWidth)
            if(!_this.isToEnd){
                _this.isAnimate = true
                _this.$ul.animate({
                    left: '-='+rowcount*itemWidth
                },400,function(){
                    _this.isAnimate = false
                    _this.isToStart = false
                    if(parseFloat(_this.$box.width()) - parseFloat(_this.$ul.css('left')) >= parseFloat(_this.$ul.css('width'))){
                        _this.isToEnd = true
                    }
                })
            }
        })

        this.$leftBtn.on('click',function(){
            if(_this.isAnimate) return
            var itemWidth = _this.$box.find('li').outerWidth(true)
            var rowcount = Math.floor(_this.$box.width()/itemWidth)
            if(!_this.isToStart){
                _this.isAnimate = true
                _this.$ul.animate({
                    left: '+='+rowcount*itemWidth
                },400,function(){
                    _this.isAnimate = false
                    _this.isToEnd = false
                    if(parseFloat(_this.$ul.css('left')) >= 0){
                        _this.isToStart = true
                    }
                })
            }
        })

        this.$footer.on('click','li',function(){
            $(this).addClass('active').siblings().removeClass('active')

            EventCenter.fire('select-albumn', {
                channelId: $(this).attr('data-channel-id'),
                channelName: $(this).attr('data-channel-name')
            })
        })
    },

    render: function(){
        var _this = this
        $.getJSON('//jirenguapi.applinzi.com/fm/getChannels.php')
        .done(function(ret){
            console.log(ret)
            _this.renderFooter(ret.channels)
        })
        .fail(function(){
            console.log('error...')
        })
    },

    renderFooter: function(channels){
        console.log(channels)
        var html = ''
        channels.forEach(function(channels){
            html += '<li data-channel-id="' + channels.channel_id + '"'
                 + ' data-channel-name="' + channels.name + '">'
                 + '<div class="cover" style="background-image:url(' + channels.cover_small + '"></div>'
                 + '<h3>' + channels.name + '</h3>'
                 + '</li>'
        })
        this.$ul.html(html)
        this.setStyle()
    },

    setStyle: function(){
        var count = this.$footer.find('li').length
        var width = this.$footer.find('li').outerWidth(true)
        this.$ul.css({
            width:count * width + 'px'
        })
    }
}

var Main = {
    init: function(){
        this.$container = $('#page-music')
        this.audio = new Audio()
        this.audio.autoplay = true
        this.bind()
    },

    bind: function(){
        var _this = this
        EventCenter.on('select-albumn',function(e,channelObj){
            _this.channelId = channelObj.channelId 
            _this.channelName = channelObj.channelName
            _this.loadMusic()
        })

        this.$container.find('.btn-play').on('click',function(){
            var $btn = $(this)
            if($btn.hasClass('icon-play')){
                $btn.removeClass('icon-play').addClass('icon-pause')
                _this.audio.play();
            }else{
                $btn.removeClass('icon-pause').addClass('icon-play')
                _this.audio.pause()
            }
        })
        
        this.$container.find('.btn-next').on('click',function(){
            var $btn = $(_this.$container.find('.btn-play'))
            $btn.removeClass('icon-play').addClass('icon-pause')
            _this.loadMusic()
        })

        this.audio.addEventListener('play',function(){
            clearInterval(_this.statusClock)
            _this.statusClock = setInterval(function(){
                _this.updateStatus()
            },1000)
        })

        this.audio.addEventListener('pause',function(){
            clearInterval(_this.statusClock)
        })
    },

    loadMusic: function(callback){
        var _this = this
        $.getJSON('//jirenguapi.applinzi.com/fm/getSong.php',{channel:this.channelId})
        .done(function(ret){
            _this.song = ret['song'][0]
            _this.setMusic()
            _this.loadLyric()
        })
    },

    loadLyric: function(){
        var _this = this
        $.getJSON('//jirenguapi.applinzi.com/fm/getLyric.php',{sid:this.song.sid})
        .done(function(ret){
            var lyric = ret.lyric
            var lyricObj = {}
            lyric.split('\n').forEach((function(line){
                 var times = line.match(/\d{2}:\d{2}/)
                 var str = line.replace(/\[.+?\]/g,'')
                 if(Array.isArray(times)){
                    times.forEach(function(time){
                        lyricObj[time] = str
                     })
                 }
            }))
            _this.lyricObj = lyricObj
        })
    },

    setMusic: function(){
        this.audio.src = this.song.url
        $('.bg').css('background','url(' + this.song.picture + ')')
        this.$container.find('.aside > figure').css('background','url(' + this.song.picture + ')')
        this.$container.find('.detail h1').text(this.song.title)
        this.$container.find('.detail .author').text(this.song.artist)
        this.$container.find('.tag').text(this.channelName)
    },

    updateStatus: function(){
        var min = Math.floor(this.audio.currentTime/60)
        var second = Math.floor(this.audio.currentTime%60) + ''
        second = second.length === 2 ? second : '0' + second
        this.$container.find('.current-time').text(min + ':' + second)
        this.$container.find('.bar-progress').css('width',this.audio.currentTime/this.audio.duration*100 + '%')
        var line = this.lyricObj['0' + min + ':' + second]
        if(line){
            this.$container.find('.lyric p').text(line)
            .boomText('lightSpeedIn')
        }
    }
}

$.fn.boomText = function(type){
    type = type || 'rollIn'
    console.log(type)
    this.html(function(){
      var arr = $(this).text()
      .split('').map(function(word){
          return '<span class="boomText">'+ word + '</span>'
      })
      return arr.join('')
    })
    
    var index = 0
    var $boomTexts = $(this).find('span')
    var clock = setInterval(function(){
      $boomTexts.eq(index).addClass('animated ' + type)
      index++
      if(index >= $boomTexts.length){
        clearInterval(clock)
      }
    }, 400)
  }
  
  
Footer.init()
Main.init()




