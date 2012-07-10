chrome.tabs.getSelected(function (tab) {
    chrome.tabs.sendMessage(tab.id, {name: 'getContent'}, function(res) {
        if (res.name == 'getContent') {
            var content = $(res.responseText);
            var cssUrls = content.filter('link').filter(function () {
                var link = $(this);
                return link.attr('type') == 'text/css' ||
                       link.attr('rel')  == 'stylesheet';
            }).map(function () {
                return $(this).attr('href');
            });
            var results = [];
            $.each(cssUrls, function () {
                var cssUrl = this;
                var result = {
                    url   : cssUrl,
                    used  : [],
                    unused: []
                };
                $.get(cssUrl, function (cssContent) {
                    var parser = new CSSParser();
                    var styles = parser.parse(cssContent, false, true).cssRules;
                    $.each(styles, function () {
                        var selector = this.mSelectorText;
                        try {
                            if ($(selector, content).length) {
                                result.used.push(selector);
                            } else {
                                result.unused.push(selector);
                            }
                        } catch (e) {
                            console.log('selector parse error: ' + selector + '\n');
                        }
                    });
                });
                //console.log(result);
                document.write(JSON.stringify(result, null, '  '));
            });
        }
    });
});
