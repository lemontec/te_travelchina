// JavaScript Document

//0:加载 1：开始页 2：主页
var m_current_phase = 0;
//页面大小
var m_width = 0;
var m_height = 0;
var isFullMapOnLoad = false;
//地图大小
var m_map_width = 0;
var m_map_height = 0;
//当前数据信息
var m_total_steps = 44;//default
var m_user_wx_token = "";
var m_user_wx_icon = "";
var m_curr_today_remaind_num = 0;//剩余摇一摇次数
var m_curr_steps_begin2last = 0;//开始到上一个城市的总步数
var m_curr_steps_to_lastcity = 0;//到上一个城市当前走了多少步
var m_curr_city_index = 0;//当前城市的索引
var m_today_arrived_city = 0;//今天到达的城市数

window.onload = function(){
	getWidthAndHeight();

	console.log("m_width:" + m_width + "|m_height" + m_height);

	//先到起点
	moveStepsToNextCity(0, 0);
	//加载数据
	loadUserData();
	//移动到上次所到达的位置
	moveStepsToNextCity(m_curr_city_index, m_curr_steps_to_lastcity);
	
	//自动加载进度信息，完成后调用nextPhase()
	progress(100, 10, () => {
        nextPhase();
    });
}

//定时器 100ms变化一次 loading进度 start
var timer = 0;
var prg = 0;
progress(80, 100);//先走到80%
function progress (dist, delay, callback) {
	window.clearInterval(timer);
	timer = window.setInterval(() => {
		if (prg >= dist) {
		  	window.clearInterval(timer)
		  	prg = dist
		  	callback && callback()
		} else {
			prg = prg + 2;
		}

		//$progress.html(prg + '%')
		loadProgressBar(prg);
		console.log(prg)
	}, delay);
}
//定时器 100ms变化一次 loading进度 end


//动态获取页面长宽 start
function getWidthAndHeight(){
	var view = getViewportSize();
	m_width = view.width;
	m_height = view.height;
}
function getViewportSize () {
    return {
        width:   document.documentElement.clientWidth ||document.body.clientWidth   ||window.innerWidth ,
        height:  document.documentElement.clientHeight||document.body.clientHeight  ||window.innerHeight 
    };
}
//动态获取页面长宽 end

function nextPhase(){
	m_current_phase++;
	
    if (m_current_phase == 1) {
	    $("#div_resoure_load").hide();
		$("#div_start_page").show();
	} else if(m_current_phase == 2){
		$("#div_start_page").hide();
	    $("#div_main_page").show();
		$("#div_main_page").width(m_width);
		$("#div_main_page").height(m_height);
		
		drawWeChartIcon(m_user_wx_icon);//绘制微信图像
	}
}

//游戏逻辑 start
function startGame(){
    //alert("starting...");
	nextPhase();
	//开始游戏
	//首先移动到上一次的位置
	moveStepsToNextCity(m_curr_city_index, m_curr_steps_to_lastcity);
	//绘制进度信息
	drawProgressBar();
}

function shakePhone(){
    //剩余次数：
	if (m_curr_today_remaind_num == 0){
		if (!sharkeAll) {
		    showLimitWarning();
		    return;
		} else {//无限摇一摇,重置剩余数量，并且将已经到达的城市数目变为0
			m_curr_today_remaind_num = m_city_list[m_curr_city_index].limit_count;
			m_today_arrived_city = 0;
		}
	}
	var l_remaind_step_to_next_city = m_city_list[m_curr_city_index].steps - m_curr_steps_to_lastcity;
	var next_go_steps = 0;
	//如果今天未到达过城市，且剩余次数为1，则默认剩下全走
	if (m_curr_today_remaind_num == 1 && m_today_arrived_city == 0) {
	    next_go_steps = l_remaind_step_to_next_city;
	} else {
	    //calc next steps
	    next_go_steps = calcNextGoSteps(m_curr_today_remaind_num, l_remaind_step_to_next_city);
	}
	if (next_go_steps == 0) {
	    //信息未同步 check and sync
		//check server data,keep data uniformity
	} else {
	    moveStepsToNextCity(m_curr_city_index, next_go_steps);
		//sync data, update local data
		m_curr_today_remaind_num--;
		m_curr_steps_to_lastcity += next_go_steps;
		
		//移动地图
		moveStepsToNextCity(m_curr_city_index, m_curr_steps_to_lastcity);
	
		if (m_curr_steps_to_lastcity == m_city_list[m_curr_city_index].steps) {
			//到达下一个城市
			m_today_arrived_city += 1;
			m_curr_steps_begin2last += m_curr_steps_to_lastcity;
			m_curr_steps_to_lastcity = 0;
			m_curr_city_index++;
			//拉取信息，显示城市介绍
			showCityInfo(m_curr_city_index);
		}
		//sync data, server
		//传递信息-：
		var jsonData = {
			"wx_token:":"121312",
			"curr_city_index":m_curr_city_index,
			"steps_begin2last:":m_curr_steps_begin2last,
			"steps_to_lastcity":m_curr_steps_to_lastcity,
			"today_remaind_num":m_curr_today_remaind_num,
			"today_arrived_city":m_today_arrived_city
		};
	}
	drawProgressBar();
/*
var m_curr_today_remaind_num = 0;//剩余摇一摇次数
var m_curr_steps_begin2last = 0;//开始到上一个城市的总步数
var m_curr_steps_to_lastcity = 0;//到上一个城市当前走了多少步
var m_curr_city_index = 0;//当前城市的索引
var m_today_arrived_city = 0;//今天到达的城市数
*/
}

function calcNextGoSteps(m_curr_today_remaind_num, l_remaind_step_to_next_city){
    //生成随机数的范围为1-向上取整[剩余步数/剩余次数]+1
	if (l_remaind_step_to_next_city == 0) {
	    return 0;
	}
	var seed = Math.ceil(l_remaind_step_to_next_city/m_curr_today_remaind_num) + 1;
	var ret = Math.floor(Math.random()*seed + 1);
	return ( ret > l_remaind_step_to_next_city) ? l_remaind_step_to_next_city : ret;
}
//游戏逻辑 end

/*数据信息 start*/
function loadUserData(){
    //从网络拿数据
	m_curr_city_index = 0;
	var jsonData = {
		"wx_token":"121312",
		"wx_icon":"wx_icon.jpg",
		"curr_city_index":0,
		"steps_begin2last":0,
		"steps_to_lastcity":0,
		"today_remaind_num":2,////此属性特殊，第二天重置默认值
		"today_arrived_city":0////此属性特殊，第二天重置为0
		};
	m_user_wx_token = jsonData["wx_token"];
	m_user_wx_icon = jsonData["wx_icon"];
	m_curr_city_index = jsonData["curr_city_index"];
	m_curr_today_remaind_num = m_city_list[m_curr_city_index].limit_count;//jsonData["today_remaind_num"];
	m_curr_steps_begin2last = jsonData["steps_begin2last"];
	m_curr_steps_to_lastcity = jsonData["steps_to_lastcity"];
	m_today_arrived_city = jsonData["today_arrived_city"];
	
	var url_web = window.location.href;
	m_user_wx_icon = url_web.substring(0, url_web.lastIndexOf("/") + 1) + m_user_wx_icon;
	
}

var m_city_list = [
    {index:0, name:"上海", position:{x:2010, y:1328}, steps:8, limit_count:5},
    {index:1, name:"厦门", position:{x:1960, y:1607}, steps:5, limit_count:3},
	{index:2, name:"东莞", position:{x:1806, y:1676}, steps:5, limit_count:2},
	{index:3, name:"深圳", position:{x:1810, y:1740}, steps:5, limit_count:2},
	{index:4, name:"广州", position:{x:1740, y:1636}, steps:5, limit_count:2},
	{index:5, name:"珠海", position:{x:1677, y:1754}, steps:5, limit_count:2},
	{index:6, name:"佛山", position:{x:1654, y:1667}, steps:12,limit_count:5},
	{index:7, name:"成都", position:{x:1281, y:1354}, steps:10,limit_count:5},
	{index:8, name:"武汉", position:{x:1564, y:1354}, steps:5, limit_count:3},
	{index:9, name:"南京", position:{x:1738, y:1263}, steps:4, limit_count:2},
	{index:10, name:"苏州", position:{x:1843, y:1327},steps:5, limit_count:2},
	{index:11, name:"昆山", position:{x:1911, y:1292},steps:6, limit_count:3},
	{index:12, name:"青岛", position:{x:1956, y:1103},steps:6, limit_count:3},
	{index:13, name:"北京", position:{x:1837, y:879}, steps:9, limit_count:5},
	{index:14, name:"长春", position:{x:2234, y:615}, steps:0, limit_count:0}
];
//,{"东莞"},{"深圳"}//,"广州","珠海","佛山","成都","武汉","南京","苏州","昆山","青岛","北京","长春"
/*数据信息 end*/


/*辅助提示窗口 start*/
//load页加载进度条信息
function loadProgressBar(load_rate){
	if (load_rate > 100){
	    load_rate = 100;
	}
	$("#loading_precent").css("width", load_rate + "%");
}

function showCityInfo(m_curr_city_index){
    //与服务器通信，拿到数据
	var city_name = m_city_list[m_curr_city_index].name;
	var url_web = window.location.href;
	var city_img  = "";
	var city_info = "欢迎来到上海这座国际化的大都市，1988年，TE的开拓者在上海华亭宾馆开始了他们的深耕中国之旅。所以，我们的旅程也将从这里开始。";
	
	$("#div_overlay_id").show();
	$("#div_show_cityinfo_page").show();
}
function hideCityInfo (){
	$("#div_overlay_id").hide();
	$("#div_show_cityinfo_page").hide();
	if (m_curr_city_index == m_city_list.length - 1){
		showCertificate();
	}
}

function showCertificate(){
	$("#div_overlay_id").show();
	$("#div_show_certificate_page").show();
	
	m_GameOver = true;
}
function hideCertificate(){
	$("#div_overlay_id").hide();
	$("#div_show_certificate_page").hide();
}

function showRanking(){
	$("#div_overlay_id").show();
	$("#div_ranking_list_page").show();
}

function hideRanking(){
    $("#div_overlay_id").hide();
	$("#div_ranking_list_page").hide();
}

function showLimitWarning(){
	$("#div_overlay_id").show();
    $("#div_show_limit_window").show();
}
function closeLimitWindow(){
	$("#div_overlay_id").hide();
    $("#div_show_limit_window").hide();
}
/*辅助提示窗口 end*/

/*游戏逻辑 start*/
function fullMapOnload(){
	var img = document.getElementById("main_map_img");
	m_map_width = img.width;
	m_map_height= img.height;
	isFullMapOnLoad = true;
}

//初始化游戏，需要找到当前的城市和已经走了的步数
function moveStepsToNextCity(begin_city_index, curr_steps){
    if (begin_city_index == m_city_list.length - 1) {
		//超出范围
		moveAnimation(Math.floor(m_width/2  - m_city_list[begin_city_index].position.x ), 
		              Math.floor(m_height/2 - m_city_list[begin_city_index].position.y  + 30));
		return;
	}
	/*
	m_map_width  2700
    m_map_height 2098
	*/
	var currPos = calcCurrPosition(begin_city_index, curr_steps);
	moveAnimation(Math.floor(m_width/2  - currPos.x ), Math.floor(m_height/2 - currPos.y  + 30));
}

function moveAnimation(x, y){
    var left = x + "px";
	var top =  y + "px"; 
    $("#main_map_img").stop(!0).animate({"left": left, "top": top});
}

function calcCurrPosition(begin_city_index, curr_steps){
    var t = curr_steps / m_city_list[begin_city_index].steps;
	var pos_x = (1-t)*m_city_list[begin_city_index].position.x + t*m_city_list[begin_city_index + 1].position.x;
	var pos_y = (1-t)*m_city_list[begin_city_index].position.y + t*m_city_list[begin_city_index + 1].position.y;
	return {x:pos_x, y:pos_y};
}

//绘制进度信息
function drawProgressBar(){
    //总步数：m_total_steps
	//当前走过步数：
	//按照高度计算进度
	var bar = document.getElementById("div_main_progress_rate");
	var bar_height = 100 - Math.floor(((m_curr_steps_begin2last + m_curr_steps_to_lastcity)/m_total_steps) * 100);
	var bar_rate = "rect(" + bar_height + "px 100px 100px 0px)";
	bar.style.clip = bar_rate;
}


function drawWeChartIcon(url){
	//$("#div_wechart_icon").css("background","url(http://localhost/h5/wx_icon.jpg) no-repeat");
    $("#div_wechart_icon").css("background-image", "url(" + url+ ")");
}
/*游戏逻辑 end*/




/*测试 start*/

var index = 0;
function moveTest(){
	index++;
	moveStepsToNextCity(1, index);
	/*
	index++;
	var x = index % 5;
	var y = Math.floor(index / 5);
	var left = "-" + (x*m_width) + "px";
	var top = "-" + (y*m_height) + "px"; 
    $("#main_map_img").stop(!0).animate({"left": left, "top": top});
	*/
}

function sharkeTest(){
	if (m_GameOver) {
		alert("Rravel End!");
		return;
	}
    shakePhone();
}

var sharkeAll = false;
var m_GameOver = false;
function sharkeAllTest() {
	if (m_GameOver) {
		alert("Rravel End!");
		return;
	}

    sharkeAll = true;
	shakePhone();
	sharkeAll = false;
}

function printState(){
		var jsonData = {
			"wx_token:":"121312",
			"curr_city_index":m_curr_city_index,
			"steps_begin2last:":m_curr_steps_begin2last,
			"steps_to_lastcity":m_curr_steps_to_lastcity,
			"today_remaind_num":m_curr_today_remaind_num,
			"today_arrived_city":m_today_arrived_city
		};
    console.log(jsonData);
}

var rate = 0.1;
function testProgress(){
	//按照高度计算进度
	var bar = document.getElementById("div_main_progress_rate");
	var bar_height = 100 - Math.floor(rate * 100);
	var bar_rate = "rect(" + bar_height + "px 100px 100px 0px)";
	bar.style.clip = bar_rate;
	if(rate >= 1){
		rate = 0;
	}
	rate += 0.1;
}

var load_rate = 10;
function testLoading(){
    loadProgressBar(load_rate);
	load_rate = load_rate + 10;
	if(load_rate >= 100) {
	    load_rate = 0;
	}
}
/*测试 end*/