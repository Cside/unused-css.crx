function assert (name, val) {
    if (! val) throw 'No ' + name + '.';
}

function formatCss (cssText) {
    return cssText.replace(/;\s*?[^}]/g, ';\n\t')
                  .replace(/\{\s*/g,     '{\n\t')
                  .replace(/\s*\}/g,     '\n} ' );
}

function extractCssPaths (content) {
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
        return url.replace(/(^https?:\/\/.+?)\/.*/, '$1') + path;
    } else {
        return url + path;
    }
}

$(function () {
    var iframe = $('#iframe').get(0);

    window.addEventListener('message', function (ev) {
        var targetSelector = ev.data.targetSelector;
        var html           = ev.data.html;
        assert('target selector', targetSelector);
        assert('html',            html);

        $( '#' + targetSelector ).html( html );
        $('#tab a:first').tab('show');
    });

    Deferred.onerror = function (e) { console.error(e.stack, e) };

    Deferred.chrome.tabs.getSelected(null).next(function (tab) {
        return Deferred.chrome.tabs.sendMessage(tab.id, {name: 'getContent'}).next(function(res) {
            if (! res) {
                console.error('Request faild: ' + tab.url);
                return;
            }

            var content     = $(res.responseText);
            var cssPaths    = extractCssPaths(content);
            var targetPaths = {};

            cssPaths.forEach(function (path) {
                targetPaths[path] = $.get( makeCssUrl(path, tab.url) );
            });

            return Deferred.parallel(targetPaths).next(function (res) {
                var stash = {};
                var i = 0;

                for (var url in res) {
                    var cssContent = res[url];
                    var parser     = new CSSParser();

                    var styles = parser.parse(cssContent).cssRules.filter(function (style) {
                        return style instanceof jscsspStyleRule &&
                            ! /^(html|body)$/.test(style.mSelectorText);

                    }).map(function (style) {
                        var selector = style.mSelectorText;
                        var used;
                        try {
                            used = !! ($(selector, content).length);
                        } catch (e) {
                            console.log('selector parse error: ' + selector + '\n');
                        }
                        return {
                            styleText: formatCss(style.parsedCssText),
                            used     : used
                        };
                    });

                    var total = styles.length;
                    var used  = styles.filter(function (style) {
                        return !! style.used;
                    }).length;

                    stash[i++] = {
                        url           : url,
                        styles        : styles,
                        total         : total,
                        used          : used,
                        unused        : total - used,
                        usedPercentage: Math.floor( (used / total) * 100 )
                    };
                }
                return stash;
            });
        });
    }).next(function (stash) {
        function render (targetSelector, _stash) {
            iframe.contentWindow.postMessage({
                targetSelector: targetSelector,
                stash         : _stash
            }, '*');
        }

        render('select-box', {results: stash});
        render('content',    stash[0]);

        $('select#select-box').change(function () {
          var selectedVal = $(this).find(':selected').val();
          render('content', stash[selectedVal]);
        });
    });
});
