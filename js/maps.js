// JavaScript Document

var curr_index = 0;

function test_talter(index){
    curr_index++;
	cxt.clearRect(0,0,cv.width,cv.height);
	cxt.drawImage(img_map, 900*curr_index, 0);
}


var progress = 0;
var m_width = 0;
var m_height = 0;

var img_map = new Image();
img_map.src = "http://localhost/h5/img/full_map.png";
img_map.onload = function(){
    progress += 50;
	startDraw();
}
var img_flag = new Image();
img_flag.src = "http://localhost/h5/images/flag.png";
img_flag.onload = function(){
    progress += 50;
	startDraw();
}

window.onload = function(){
	getWidthAndHeight();
	startDraw();
}

//动态获取页面长宽 start
function getWidthAndHeight(){
	var view = getViewportSize();
	m_width = view.width;
	m_height = view.height;
	cv.width = m_width;
	cv.height = m_height;
}
function getViewportSize () {
    return {
        width:   document.documentElement.clientWidth ||document.body.clientWidth   ||window.innerWidth ,
        height:  document.documentElement.clientHeight||document.body.clientHeight  ||window.innerHeight 
    };
}
//动态获取页面长宽 end

function startDraw(){
    if (progress == 100){
		onDrawEvent();
	}
}

function onRandomEvent(){

}

const cv = document.getElementById("cv");
const cxt= cv.getContext("2d");

var m_index = 0;
var m_x = 0;
var m_y = 0;
var m_city = 0;
function onDrawEvent(){
	//var cv = document.getElementById("cv");
	//var cxt= cv.getContext("2d");
	
	calcPosition();
	
	cxt.drawImage(img_map, m_x, m_y);
	cxt.drawImage(img_flag, 200, 300);
}

function calcPosition(){

}

function drawMap(){

}

function drawFlag(){

}

function alterMsg(){

}

//拖动地图移动
//test location
/*
cv.onmousedown=function (e) {
    alert("x:" + e.clientX + "|y:" + e.clientY);
}
*/


var ax,ay,x,y;
cv.onmousedown=function (e) {
cv.onmousemove = function(e){
	x= e.clientX;
	y= e.clientY;
	//限制移动不能超出画布
	(x<173)? ax=75 : ax=425;
	(y<148)? ay=50 : ay=350;

	(x < 425 && x >75)? x =e.clientX : x =ax;
	(y > 50 && y <350) ? y=e.clientY : y=ay;
	
	//先清除之前的然后重新绘制
	cxt.clearRect(0,0,cv.width,cv.height);
    cxt.drawImage(img_map ,x-75,y-50,150,100);
};

cv.onmouseup = function(e){
           cv.onmousemove = null;
            cv.onmouseup = null;
};

};
