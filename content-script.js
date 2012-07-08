window.addEventListener('load', function () {
    chrome.extension.onMessage.addListener(function(req, sender, callback) {
        if (req.name == 'getContent') {
            callback({
                name        : 'getContent', 
                responseText: document.documentElement.innerHTML
            });
        }
    });
}, false);
