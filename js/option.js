$(function(){
    $('input[type="submit"]').click(function(){
        var url = $('#url').val();
        if (! /^http/.test(url)) {
            alert('Not a url: ' + url);
            return;
        }
        chrome.sendRequest(url, function(res){
            console.log(res);
        });

        return false;
    });
});
