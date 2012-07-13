function formatCss (cssText) {
    return cssText.replace(';', ';\n\t')
           .replace('{', '{\n\t')
           .replace('}', '\n}');
}
function extractCssPathes (content) {
    return content.filter('link').filter(function () {
        var link = $(this);
        return link.attr('type') == 'text/css' ||
               link.attr('rel')  == 'stylesheet';
    }).map(function (){
        return $(this).attr('href');
    }).get();
}
function makeCssUrl (path, url) {
    if (/^https?:\/\//.test(path)) {
        return path;
    } else if (/^\//.test(path)) {
        return url.replace(/(^https?:\/\/.+?)\/.+/, '$1') + path;
    } else {
        return url.replace(/(https?:\/\/.+\/).*/,   '$1') + path;
    }
}
Deferred.chrome.tabs.getSelected(null).next(function (tab) {
    return Deferred.chrome.tabs.sendMessage(tab.id, {name: 'getContent'}).next(function(res) {
        if (res.name == 'getContent') {
            var content   = $(res.responseText);
            var cssPathes = extractCssPathes(content);
            var req = {};
            cssPathes.forEach(function (path) {
                req[path] = $.get( makeCssUrl(path, tab.url) );
            });
            return Deferred.parallel(req).next(function (res) {
                var stash = {};
                var i = 0;
                for (var url in res) {
                    var result = {
                        url           : url,
                        styles        : undefined,
                        used          : undefined,
                        unused        : undefined,
                        usedPercentage: undefined,
                    };
                    var cssContent = res[url];
                    var parser = new CSSParser();
                    var styles = parser.parse(cssContent).cssRules;
                    result.styles = styles.map(function (style) {
                        var ret = {};
                        ret.styleText = formatCss(style.parsedCssText);
                        selector = style.mSelectorText;
                        try {
                            ret.used = !! ($(selector, content).length);
                        } catch (e) {
                            console.log('selector parse error: ' + selector + '\n');
                        }
                        return ret;
                    });
                    var total = result.styles.length;
                    result.used = result.styles.filter(function (style) {
                        return !! style.used;
                    }).length;
                    result.unused = total - result.used;
                    result.usedPercentage = parseInt( (result.used / total) * 100 );
                    stash[i++] = result;
                }
                return stash;
            }).error(function (e) {
                console.trace(e);
            });
        }
    });
}).next(function (stash) {
      function render (targetSelector, _stash) {
        var template = $( '#template-' + targetSelector ).html();
        var rendered = Jarty.eval( template, _stash );
        $( '#' + targetSelector ).html( rendered );
      }
      render('select-box', {results: stash});
      render('content',    stash[0]);
      $('select#select-box').change(function () {
        var selectedVal = $(this).find(':selected').val();
        render('content', stash[selectedVal]);
      });
}).error(function (e) {
    console.trace(e);
});
