$(function () {
    'use strict';

    var baseTitle = document.title,
        // base (general) part of title
        pathName = window.location.pathname,
        fileName = pathName.substring(window.location.pathname.lastIndexOf("/") + 1);


    // sticky footer stuff
    if ($('#mainContent').height() > $('#sidebarContainer').height()) {
        $('#nonFooter').css( {
            'min-height': '100%'
        });
        $('#nonFooter').height("auto");
    }

    var fileNameRE = new RegExp("^" + fileName, "i");

    $('a.menuLink').each(function (index) {
        if ($(this).attr("href").match(fileNameRE)) {
            $(this).addClass("currentItem");
            return false;
        }
    });

    // init search
    $('#search')
    // prevent from form submit
    .on('submit', function () {
        return false;
    }).find('input');
});

$(document).ready(function () {
    var d = 'a.menu, .dropdown-toggle'

    function clearMenus() {
        $(d).parent('li').each(function () {
            $(this).removeClass('open')
        });
    }

    $('#tabbable a:first').tab('show');

    var s, sx;

    // scrolling offset calculation via www.quirksmode.org
    if (window.pageYOffset || window.pageXOffset) {
        s = window.pageYOffset;
        sx = window.pageXOffset;
    }
    else if (document.documentElement && (document.documentElement.scrollTop || document.documentElement.scrollLeft)) {
        s = document.documentElement.scrollTop;
        sx = document.documentElement.scrollLeft;
    }
    else if (document.body) {
        s = document.body.scrollTop;
        sx = document.body.scrollLeft;
    }

    if (document.documentElement.offsetWidth < 1010) {
        if (sx <= 0) sx = 0;
        else if (sx + document.documentElement.offsetWidth > 1010) sx = 1010 - document.documentElement.offsetWidth;
    }
    else sx = 0;

    $('span.methodClicker, article.article, h3.methodClicker').each(function () {
        var a = $(this);
        var constructorPos = a.attr("id").indexOf("new ");

        var objName = a.attr("id");
        if (constructorPos >= 0) {
            objName = objName.substring(constructorPos + 4);
            objName += ".new";
        }

        a.attr("id", objName);
    });

    $('.brand').parent('.dropdown').hover(

    function () {
        $(this).addClass('open');
    }, function () {
        clearMenus();
    });

    $('.versions').hover(

    function () {
        $(this).addClass('open');
    }, function () {
        clearMenus();
    });

    function showMethodContent() {
        if (!location.hash) return;

        var $clickerEl = $('span#' + location.hash.replace(/^#/, '').replace(/\./g, '\\.'));
        if ($clickerEl.length > 0 && $clickerEl.hasClass('methodClicker')) {
            var p = $clickerEl.parent();
            p[0].force = true;
            p.trigger('click');
            p[0].force = false;
        }
    }

    if (location.hash) {
        showMethodContent();
        var data = location.hash;
        scrollTo(null, data.substr(1));
    }

    window.onhashchange = function () {
        showMethodContent();
    }
});

function scrollTo(el, data) {
    if (!data) {
        data = el.getAttribute("data-id");
        location.hash = data;
    }
    var el = $("span#" + data.replace(/\./g, "\\."))[0];
    if (!el) return;

    var article = $(el).closest('.article')[0];

    var top = article.offsetTop - 100;

    if (document.body.scrollTop > top || document.body.scrollTop != top && document.body.scrollTop + (window.innerHeight || document.documentElement.offsetHeight) < top + article.offsetHeight) {
        $('body').animate({
            scrollTop: top
        }, {
            duration: 200,
            easing: "swing"
        });
    }
}