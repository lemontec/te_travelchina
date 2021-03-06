var isIOS = function() {
    return !(/Android (\d+\.\d+)/.test(navigator.userAgent));
    // var isIphone = navigator.userAgent.includes('iPhone'）;
    // var isIpad = navigator.userAgent.includes('iPad');
    // return isIphone || isIpad;
};

var wxshare = function() {
    if (g_appid == "[:appid]") {
        // alert(g_appid);
        console.log("Not in wechat browser.");
        return;
    }

    if (isIOS()) {
        // alert(document.location.href);
        // alert(g_appid);
        // alert(g_timestamp);
        // alert(g_noncestr);
        // alert(g_signature);
        // try {
        //     // alert("IOS!");
        //     share.init({
        //         img: 'http://travelchina.xiaoningmengkeji.com/te/travelchina/img/share.jpg',
        //         url: 'http://travelchina.xiaoningmengkeji.com/?index/index&share=1',
        //         desc: "快来踏上TE中国之旅，与TE一起走遍中国。",
        //         title: "连动中国三十年",
        //     });
        // } catch(e) {
        // }
        // return;
    }

    wx.config({
        debug: false,
        appId: g_appid,
        timestamp: g_timestamp,
        nonceStr: g_noncestr,
        signature: g_signature,
        jsApiList: [
            'checkJsApi', 'onMenuShareTimeline', 'onMenuShareAppMessage', 'onMenuShareQQ', 'onMenuShareWeibo', 'onMenuShareQZone', 'hideMenuItems', 'showMenuItems', 'hideAllNonBaseMenuItem',
            'showAllNonBaseMenuItem', 'translateVoice', 'startRecord', 'stopRecord', 'onVoiceRecordEnd', 'playVoice', 'onVoicePlayEnd', 'pauseVoice', 'stopVoice', 'uploadVoice', 'downloadVoice',
            'chooseImage', 'previewImage', 'uploadImage', 'downloadImage', 'getNetworkType', 'openLocation', 'getLocation', 'hideOptionMenu', 'showOptionMenu', 'closeWindow', 'scanQRCode', 'chooseWXPay',
            'openProductSpecificView', 'addCard', 'chooseCard', 'openCard'
        ]
    });
    wx.ready(function() {
        wx.onMenuShareAppMessage({
            title: "连动中国三十年",
            desc: "快来踏上TE中国之旅，与TE一起走遍中国。",
            link: 'http://travelchina.xiaoningmengkeji.com/?index/index&share=1',
            imgUrl: 'http://travelchina.xiaoningmengkeji.com/te/travelchina/img/share.jpg',
            success: function (res) {
                $('.filter').hide();
            }
        });
        wx.onMenuShareTimeline({
            title: "连动中国三十年",
            link: 'http://travelchina.xiaoningmengkeji.com/?index/index&share=1',
            imgUrl: 'http://travelchina.xiaoningmengkeji.com/te/travelchina/img/share.jpg',
            success: function () {
                $('.filter').hide();
            }
        });
        wx.hideMenuItems({
            menuList: [
                'menuItem:share:qq', 'menuItem:share:weiboApp', 'menuItem:favorite', "menuItem:share:facebook", "menuItem:share:QZone",
                "menuItem:editTag", "menuItem:delete", "menuItem:copyUrl", "menuItem:originPage", "menuItem:readMode", "menuItem:openWithQQBrowser", "menuItem:openWithSafari",
                "menuItem:share:email", "menuItem:share:brand"
            ]
        });
    });
}
wxshare();

