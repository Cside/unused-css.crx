window.addEventListener('load', function () {
    chrome.extension.onMessage.addListener(function(req, sender, callback) {
        if (req.name == 'getContent') {
            callback({
                name        : 'getContent',
                responseText: document.documentElement.innerHTML
            });
        } else if (req.name == 'getCss') {
            callback({
                name        : 'getCss',
                responseText: xhr.responseText,
            });
        }
        return true;
    });
}, false);
