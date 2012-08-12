function assert (name, val) {
    if (!val) throw 'No ' + name + '.';
}

window.addEventListener('load', function () {
    window.addEventListener('message', function (ev) {
        var targetSelector = ev.data.targetSelector;
        var stash          = ev.data.stash;
        assert('target selector', targetSelector);
        assert('stash',           stash);

        var template = document.getElementById( 'template-' + targetSelector ).innerHTML;
        assert('template', template);

        var rendered = Jarty.eval( template, stash );
        assert('renderd html', rendered);

        ev.source.postMessage({
            targetSelector: targetSelector,
            html          : rendered
        }, ev.origin);
    });
});
