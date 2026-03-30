(function ($) {

    var methods = {
        init: function (options) {
            //modify the default settings with the options passed in
            //and save them to the jQuery object using .data()

            if (typeof options === 'undefined') { options = {}; }

            var settings = $.extend({

            }, options);

            var $obj = $(this),
				classes = (typeof $obj.attr('class') !== 'undefined') ? $obj.attr('class').split(' ') : '';

            settings.loop = ($.inArray('loop-animation', classes) !== -1) ? true : false;

            //navigation settings
            settings.autoAdvance = ($.inArray('no-auto-advance', classes) !== -1) ? false : true;
            settings.pauseOnHover = ($.inArray('pause-on-hover', classes) !== -1) ? true : false;
            settings.pauseOnAction = ($.inArray('pause-on-action', classes) !== -1) ? true : false;

            settings.haveDetails = ($.inArray('no-details', classes) !== -1) ? false : true;

            settings.random = ($.inArray('randomize', classes) !== -1) ? true : false;

            //animation settings
            settings.slideshowSpeed = (!isNaN(parseFloat($obj.attr('slideshowSpeed'), 10))) ? methods.convertToMiliseconds(parseFloat($obj.attr('slideshowSpeed'), 10)) : 5000;
            settings.animationSpeed = (!isNaN(parseFloat($obj.attr('animationSpeed'), 10))) ? methods.convertToMiliseconds(parseFloat($obj.attr('animationSpeed'), 10)) : 1000;

            if ($obj.closest('html').hasClass('styler')) {
                settings.autoAdvance = false;
            }

            if (settings.random) {
                $obj.find('.bg-image').shuffle();
            }

            $obj.data({
                'options': settings,
                'index': 0,
                'finished': false
            });

            //set up the region so images don't go crazy
            $obj.closest('.region').css({ 'position': 'relative' });

            //set up slides
            var $first = $obj.find('.bg-image').eq(0); //might need to change this is we add randomize

            $first.addClass('current-slide');
            $obj.find('.pager li a').eq(0).addClass('current-pager-item');

            //set up details
            var $details = $obj.find('.details-' + $first.data('id')),
				$viewport = $obj.find('.details-viewport');

            $details.addClass('current-details');

            $viewport.height($details.outerHeight());

            

            return $obj;
        },
        convertToMiliseconds: function (sec) {
            return sec * 1000;
        },
        version: function () {
            return "Background Carousel : Version 1.2";
        },
        log: function (message) {
            if (window.console) {
                console.debug(message);
            }
        }
    };

    $.fn.bgcarousel = function (method) {
        // "this" is already a jquery object

        // Method calling logic
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            //run init

            return this.each(function (method) {

                $obj = methods.init.apply(this, arguments);

                var vars = {
                    obj: $obj,
                    slides: $obj.find('.bg-image'),
                    pager: $obj.find('.pager'),
                    options: $obj.data('options'),
                    queue:[],
                    timeout: "",
                    animating:false,
                    go: function (dir) {
                        if (!vars.animating) {
                            vars.animating = true;
                            //methods.log('go:'+dir);
                            // //methods.log(methods.$slides.index('.current-slide'));
                            var newIndex = vars.obj.data('index') + dir;

                            // //methods.log('current index : '+vars.obj.data('index'));
                            // //methods.log('direction : '+dir);
                            // //methods.log('new index : '+newIndex);

                            if (dir > 0) {
                                newIndex = (newIndex >= vars.slides.length) ? 0 : newIndex;
                            }

                            //vars.queue.push(newIndex);

                            vars.obj.data('next', newIndex);
                            vars.maybeLoadNextImages(newIndex);

                            //vars.updateNavigation();

                            vars.animate();
                        }
                    },
                    animate: function () {

                        var $current = vars.slides.eq(vars.obj.data('index')),
							$new = vars.slides.eq(vars.obj.data('next')),
							$allDetails = vars.obj.find('.details'),
							$cDetails = vars.obj.find('.details-' + $current.data('id')),
							$nDetails = vars.obj.find('.details-' + $new.data('id')),
							$viewport = vars.obj.find('.details-viewport');

                        //methods.log(vars.obj.find('.details-viewport'));

                        //start animate of details
                        
                        $cDetails.animate({ opacity: 0 }, vars.options.animationSpeed / 2, 'swing', function () {
                            $allDetails.removeClass('current-details').css({ opacity: 0 });
                            $viewport.animate({ height: $nDetails.outerHeight() }, vars.options.animationSpeed / 2, function () {
                                $nDetails.animate({ opacity: 1 }, vars.options.animationSpeed / 2, 'swing', function () {
                                    $(this).addClass('current-details');
                                });
                            });
                            //$(this).removeClass('current-details');
                        });
                        

                        //hide all details
                        //$allDetails.removeClass('current-details').css({ opacity: 0 });
                        
                        $new.animate({ opacity: 1 }, vars.options.animationSpeed, 'swing', function () {
                            /*
                            $viewport.animate({ height: $nDetails.outerHeight() }, vars.options.animationSpeed / 3, function () {
                                $nDetails.animate({ opacity: 1 }, vars.options.animationSpeed / 3, 'swing', function () {
                                    $(this).addClass('current-details');
                                });
                            });
                            */

                            $current.animate({ opacity: 0 }, vars.options.animationSpeed, 'swing', function () {
                                $(this).removeClass('current-slide');
                            });

                            $(this).addClass('current-slide');
                            vars.obj.data('index', vars.obj.data('next'));

                            //reset pager
                            vars.pager.find('.current-pager-item').removeClass('current-pager-item');
                            vars.pager.find('a').eq(vars.obj.data('index')).addClass('current-pager-item');

                            vars.animating = false;
                            //methods.log('animate complete');
                            //methods.log('current index:'+ vars.obj.data('index') );
                        });

                    },
                    autoAdvance: function () {
                        vars.timeout = setTimeout(function () {
                            var index = vars.obj.data('index'),
								advance = true;

                            if (!vars.options.loop && index === vars.slides.length - 1) {
                                advance = false;
                                vars.obj.data('finished', true);
                            }

                            if (advance) {
                                vars.go(1);
                                vars.autoAdvance();
                            }
                        }, vars.options.slideshowSpeed);
                    },
                    maybeLoadNextImages: function (index) {
                        var $photos = vars.obj.find('.bg-resp-photo'),
							$last = '',
							prev = next = 1;

                        if (index === 0) {
                            prev = 0;
                            //next = 2;
                            $last = $photos.slice($photos.length - 1);
                        }

                        var $set = $photos.slice(index - prev, index + next).add($last);

                        $set.each(function () {
                            var $photo = $(this);
                            vars.loadImage($photo);
                        });
                    },
                    loadImage: function ($photo) {

                        var $col = $photo.closest('.region'),
							oldColWidth = $photo.data('colWidth'),
							colWidth = $col.width();

                        if (oldColWidth && oldColWidth == colWidth) {
                            return;
                        }

                        $photo.data('colWidth', colWidth);

                        var renditions = vars.setRenditions($photo);

                        var rendition = vars.selectRendition(renditions, colWidth);

                        if (rendition) {

                            $photo.css({ 'background-image': 'url(' + rendition.Src + ')' });
                            return;
                        }
                    },
                    selectRendition: function (renditions, colWidth) {
                        for (var i = 0; i < renditions.length; i++) {
                            if (colWidth >= renditions[i].MinWidth && colWidth <= renditions[i].MaxWidth) {
                                return renditions[i];
                            }
                        }
                    },
                    setRenditions: function ($photo) {
                        if ($photo.data('renditions')) {
                            return $photo.data('renditions');
                        }

                        var renditions = [],
							imageSrc,
							lastVal = 0;

                        $photo.find('SPAN').each(function () {
                            renditions.push({
                                Src: $(this).data('src'),
                                MinWidth: lastVal,
                                MaxWidth: $(this).data('width')
                            });
                            lastVal = $(this).data('width') + 1;
                        });

                        if (renditions.length > 0) {
                            renditions[renditions.length - 1].MaxWidth = 9999;
                        }

                        $photo.data('renditions', renditions);
                        return renditions;
                    }
                };
                //methods.log(vars);

                vars.maybeLoadNextImages(0);

                if (vars.slides.length > 1) {


                    //controls events
                    $obj.find('.controls a').on('click', function (e) {
                        e.preventDefault();
                        var $btn = $(this);

                        if ($btn.hasClass('control-next')) {
                            // //methods.log('next');
                            vars.go(1);
                        } else {
                            // //methods.log('prev');
                            vars.go(-1);
                        }

                    });

                    //pager events
                    $obj.find('.pager a').on({
                        click: function (e) {
                            e.preventDefault();
                            var $btn = $(this),
							    $pager = $btn.closest('ul'),
							    idx = $pager.find('a').index($btn);

                            // //methods.log(idx);
                            // //methods.log(vars.obj.data('index'));

                            if (vars.obj.data('index') !== idx) {
                                vars.go(idx - vars.obj.data('index'));
                            }
                        },
                        mouseenter: function () {
                            var $btn = $(this),
							    $pager = $btn.closest('ul'),
							    idx = $pager.find('a').index($btn);

                            vars.maybeLoadNextImages(idx);
                        }

                    });

                    if (vars.options.autoAdvance) {
                        vars.autoAdvance();

                        if (vars.options.haveDetails) {

                            if (vars.options.pauseOnHover) {
                                vars.obj.find('.details-content').on({
                                    mouseenter: function (e) {
                                        clearTimeout(vars.timeout);
                                    },
                                    mouseleave: function (e) {
                                        var finished = vars.obj.data('finished');
                                        if (!finished) {
                                            setTimeout(function () {
                                                vars.autoAdvance();
                                            }, vars.options.animationSpeed);
                                        }

                                    }
                                });
                            }

                            if (vars.options.pauseOnAction) {

                                vars.obj.find('.controls a, .pager a').on('click', function (e) {
                                    e.preventDefault();
                                    clearTimeout(vars.timeout);
                                });

                            }

                        }
                    }
                } else {
                    //remove arrows and pager
                    vars.obj.find('.bg-carousel-nav').remove();
                    vars.obj.find('.controls').remove();
                }

            });

        } else {
            $.error('Method ' + method + ' does not exist on jQuery.bgcarousel');
        }

    };

    $.fn.shuffle = function () {

        var allElems = this.get(),
            getRandom = function (max) {
                return Math.floor(Math.random() * max);
            },
            shuffled = $.map(allElems, function () {
                var random = getRandom(allElems.length),
                    randEl = $(allElems[random]).clone(true)[0];
                allElems.splice(random, 1);
                return randEl;
            });

        this.each(function (i) {
            $(this).replaceWith($(shuffled[i]));
        });

        return $(shuffled);

    };

})(jQuery);