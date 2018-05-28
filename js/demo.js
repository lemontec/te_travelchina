
const cv = document.getElementById("c-1");
const cxt= cv.getContext("2d");
var m_width = 0;
var m_height = 0;




window.onload = function(){
	getWidthAndHeight();
	//startDraw();
	console.log("m_width" + m_width + "|m_height:" + m_height );
	//play_animation();
}

 function addUrl() {
        var state = { title: "title", url: "#" };
        window.history.pushState(state, "title", "#");
    }
addUrl();  // 每调用一次可以监听返回一次
window.addEventListener("popstate", function(e) {
        alert("我监听到了浏览器的返回按钮事件啦");
		window.go();
}, false);

play_animation();

//动态获取页面长宽 start
function getWidthAndHeight(){
	var view = getViewportSize();
	m_width = view.width;
	m_height = view.height;
	cv.width = m_width - 30;
	cv.height = m_height - 30;
}
function getViewportSize () {
    return {
        width:   document.documentElement.clientWidth ||document.body.clientWidth   ||window.innerWidth ,
        height:  document.documentElement.clientHeight||document.body.clientHeight  ||window.innerHeight 
    };
}
//动态获取页面长宽 end

function play_animation() {
    var framesUrl = [];
    for (var i = 0; i < 52; i++) {
        framesUrl.push('img/close/te_00' + i + '.jpg');
    }

    var that = this;
    // frame animation
    var ani = new frame_ani({
        canvasTargetId: "c-1", // target canvas ID
        framesUrl: framesUrl, // frames url
        loop: false, // if loop
        height: 1100, // source image's height (px)m_height
        width: 750, // source image's width (px)m_width
        frequency: 10, // count of frames in one second
        audioIonName: null, // ion.sound audio name
        onComplete: function () { // complete callback
            console.log("Animation loop.");
			//that.window.open('', '_self', '');
			//that.window.close();
			//open(location, '_self').close();
        },
    });

    // preload & play
    ani.initialize(function (){
        $("#loading").hide();
        ani.play();
    });
}