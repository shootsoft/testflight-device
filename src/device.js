/**
 * This is a script to extract device list from TestFlightApp.com
 * by shootsoft@qq.com
 *
 * useage: casperjs device.js --username=xxxx --password=yyyy
 *
 * */
var casper = require('casper').create({
    pageSettings:{loadImages:false}
    ,verbose: true
    , pageSettings: {
        loadImages:  false,
        loadPlugins: true,
        userAgent: 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)'
    }
});

var urlsObj;
var tables=[];

var DEBUG = casper.cli.get('debug');
var username = casper.cli.get('username');
var password =  casper.cli.get('password');

if(!username || !password){
    casper.echo('useage: casperjs device.js --username=xxxx --password=yyyy');
    casper.exit();
}

casper.start('https://testflightapp.com/login/', function() {
    //Login
    var user = {username:username, password:password};
    this.evaluate(function(user) {

        $('#id_username').val(user.username);
        $('#id_password').val(user.password);
        $('form').submit();
    }, user);

    if(DEBUG)capture("temp/login.png", 'login');


    this.wait(5000, function(){
        if(DEBUG)capture("login2.png", 'login2');
    });

}).thenOpen('https://testflightapp.com/dashboard/team/',function(){
    //Open people list
     if(DEBUG)capture("people.png", 'people');
     urlsObj = this.evaluate(function(){
        var arr={};
        $.each($('td[class=launchdetails]'), function(k, v){
            var key = $(v).attr('id');
            if(arr[key]==undefined){
                arr[key]=k;
            }
        });
        return arr;
    });
}).then(function(){
    if(DEBUG)casper.echo(JSON.stringify(urlsObj));
    //Object -> Array
    for(var p in urlsObj){
        var url = 'https://testflightapp.com'+p;
        casper.thenOpen(url, function(){
             if(DEBUG)casper.echo('visit: ' + url);
            var devices = this.evaluate(function(){
                var dev_list=[];
                var name =  document.querySelector('.username').innerText;
                var email =  document.querySelector('.teamname').innerText;
                var list = document.querySelectorAll('tbody tr');
                if(list!=[]){
                    Array.prototype.forEach.call(list, function(e) {
                        var device ={
                            name:name,
                            email:email,
                            platform: e.children[0].innerText,
                            hardware: e.children[1].innerText,
                            os: e.children[2].innerText
                        };
                        if(e.children[3] != undefined){
                            device.udid = e.children[3].innerText;
                        } else {
                            device.udid='';
                        }
                        dev_list.push(device);
                    });
                }
                return dev_list;
            });
            tables = tables.concat(devices);
            if(DEBUG)casper.echo(JSON.stringify(devices));
        });
    }
}).then(function() {
        //casper.echo('done');
        if(DEBUG)casper.echo(JSON.stringify(tables));
        casper.echo('email,platform,hardware,os,udid');
        for(var i=0;i< tables.length;i++){
            var t=tables[i];
            casper.echo(t.email+','+ t.platform +','+t.hardware + ','+ t.os+','+ t.udid);
        }

});

/**
 * capture the web page and echo message
 * */
function capture(img, msg){
    casper.capture(img, {
        top: 0,
        left: 0,
        width: 1024,
        height: 600
    });
    casper.echo(msg);
}

casper.on('http.status.404', function(resource) {
    casper.test.fail("404 error");
});

casper.on('error', function(msg, trace){
    casper.echo("error: " + msg + "\r\n" + trace);
});

casper.on('page.error', function(msg, trace){
    casper.echo("page.error: "+ msg + "\r\n" + trace);
});

casper.run();