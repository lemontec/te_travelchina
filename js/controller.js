// JavaScript Document

//for close window
window.name="main_window";

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
var m_total_distance = 6750;//default
var m_user_wx_token = "";
var m_user_wx_icon = "";
var m_curr_today_remaind_num = 0;//剩余摇一摇次数
var m_curr_dist_begin2last = 0;//开始到上一个城市的总公里数--不需要从服务器拿，自己计算
var m_curr_steps_to_lastcity = 0;//到上一个城市当前走了多少步
var m_curr_city_index = 0;//当前城市的索引
var m_today_arrived_city = 0;//今天到达的城市数

var m_can_sharke_flag = true;
var base_img_url = "";

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
	progress(100, 10, function() {
        nextPhase();
    });
}

//定时器 100ms变化一次 loading进度 start
var timer = 0;
var prg = 0;
progress(80, 100);//先走到80%
function progress (dist, delay, callback) {
	window.clearInterval(timer);
	timer = window.setInterval(function () {
		if (prg >= dist) {
		  	window.clearInterval(timer)
		  	prg = dist
		  	callback && callback()
		} else {
			prg = prg + 2;
		}

		//$progress.html(prg + '%')
		loadProgressBar(prg);
		//console.log(prg)
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
		bindMapMoveEvent();//绑定拖动事件
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
	//移动地图之后第一次摇一摇会回到之前的位置，不记录摇一摇次数
	if (!m_can_sharke_flag) {
		console.log("this sense cannot shake phone");
	    return;
	}
	if (map_reset_flag) {
		map_reset_flag = false;
		goTodayCurrPosition();
		return;
	}
	//如果已经在最后一座城市
	if (m_curr_city_index == m_city_list.length - 1){
		showCertificate();
		return;
	}
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
	    //moveStepsToNextCity(m_curr_city_index, next_go_steps);
		//sync data, update local data
		m_curr_today_remaind_num--;
		m_curr_steps_to_lastcity += next_go_steps;
		
		//移动地图
		moveStepsToNextCity(m_curr_city_index, m_curr_steps_to_lastcity);
	
		if (m_curr_steps_to_lastcity == m_city_list[m_curr_city_index].steps) {
			//到达下一个城市
			m_today_arrived_city += 1;
			m_curr_dist_begin2last += m_city_list[m_curr_city_index].dist;//走完一个城市，加上路程
			m_curr_steps_to_lastcity = 0;
			m_curr_city_index++;
			//拉取信息，显示城市介绍，延长100ms
			showCityInfo();
			showcity_delay_timer_event(1000);
		}
		
//sync data, server
/*
    m_user_wx_token      = "[:te_wx_openid]";
	m_user_wx_icon           = "[:te_wx_icon]";
	m_curr_city_index        = "[:te_city_index]";
	m_curr_today_remaind_num = "[:te_today_remaind_num]";
	m_curr_steps_to_lastcity = "[:te_steps_2_lastcity]";////此属性特殊，第二天重置默认
	m_today_arrived_city     = "[:te_today_arrived_city]";////此属性特殊，第二天重置默认
    var l_not_today_data     = "[:te_not_today_data]";////与上次时间匹配，如果是同一天返回0，不是同一天返回1
*/
		//传递信息-：
		var paramsData = {
			"te_wx_openid:":m_user_wx_token,
			"te_city_index":m_curr_city_index,
			"te_today_remaind_num":m_curr_today_remaind_num,
			"te_steps_2_lastcity":m_curr_steps_to_lastcity,
			"te_today_arrived_city":m_today_arrived_city
		};//缺少数据上报时间，服务器端必须记录每次数据上报的时间，用来对比  te_upload_time
        //=======================================================================================syncData to server
		jRequest("index_test", paramsData, function (){
		    //成功函数
		}, jRequest_error);
	}
	drawProgressBar();
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
	//获取基础图面网址	
	if (base_img_url.length == 0){
	    base_img_url = document.getElementById("main_map_img").src;
		base_img_url = base_img_url.substring(0, base_img_url.lastIndexOf("/") + 1);
	}
    //从网络拿数据
	//=======================================================================================getData from server start
	m_user_wx_token          = "[:te_wx_openid]";
	m_user_wx_icon           = g_headimgurl;
	m_curr_city_index        = "[:te_city_index]";
	m_curr_today_remaind_num = "[:te_today_remaind_num]";
	m_curr_steps_to_lastcity = "[:te_steps_2_lastcity]";////此属性特殊，第二天重置默认
	m_today_arrived_city     = "[:te_today_arrived_city]";////此属性特殊，第二天重置默认
    var l_is_today_data      = "[:te_is_today_data]";////与上次时间匹配，如果是同一天返回1，不是同一天返回0

	//重置第二天属性
	if (l_is_today_data == 0 || l_is_today_data == "0") {
		m_curr_steps_to_lastcity = m_city_list[m_curr_city_index].steps;////此属性特殊，第二天重置默认
		m_today_arrived_city     = 0;////此属性特殊，第二天重置默认
	}

	//test start
	m_user_wx_token = "121312";
	// m_user_wx_icon =  base_img_url + "wx_icon.jpg"; 
	m_curr_city_index = 0;
	m_curr_today_remaind_num = 5;//jsonData["today_remaind_num"];
	m_curr_steps_to_lastcity = 0;
	m_today_arrived_city = 0;
    //test end
	//=======================================================================================getData from server end

	//计算m_curr_dist_begin2last
	m_curr_dist_begin2last = 0;
	for (var i = 0; i < m_curr_city_index; i++) {
	    m_curr_dist_begin2last += m_city_list[i].dist;
	}
}

//模拟异步网络请求
function jRequest(url, params, success, error){
	var type="POST";
	//__request();
	//=======================================================================================syncData to server
}

function jRequest_error(){
	//失败函数，提示网络连接失败，请重试
}

var m_city_list = [
    {index:0, name:"上海", position:{x:2010, y:1328}, dist:800 ,steps:8, limit_count:5},
    {index:1, name:"厦门", position:{x:1960, y:1607}, dist:500 ,steps:5, limit_count:3},
	{index:2, name:"东莞", position:{x:1806, y:1676}, dist:100 ,steps:5, limit_count:2},
	{index:3, name:"深圳", position:{x:1810, y:1740}, dist:100 ,steps:5, limit_count:2},
	{index:4, name:"广州", position:{x:1740, y:1636}, dist:100 ,steps:5, limit_count:2},
	{index:5, name:"珠海", position:{x:1677, y:1754}, dist:100 ,steps:5, limit_count:2},
	{index:6, name:"佛山", position:{x:1654, y:1667}, dist:1200,steps:12,limit_count:5},
	{index:7, name:"成都", position:{x:1281, y:1354}, dist:1000,steps:10,limit_count:5},
	{index:8, name:"武汉", position:{x:1564, y:1354}, dist:500 ,steps:5, limit_count:3},
	{index:9, name:"南京", position:{x:1738, y:1263}, dist:200 ,steps:4, limit_count:2},
	{index:10, name:"苏州", position:{x:1843, y:1327},dist:50  ,steps:5, limit_count:2},
	{index:11, name:"昆山", position:{x:1911, y:1292},dist:600 ,steps:6, limit_count:3},
	{index:12, name:"青岛", position:{x:1956, y:1103},dist:600 ,steps:6, limit_count:3},
	{index:13, name:"北京", position:{x:1837, y:879}, dist:900 ,steps:9, limit_count:5},
	{index:14, name:"长春", position:{x:2234, y:615}, dist:0   ,steps:1, limit_count:0}
];

/*数据信息 end*/


/*辅助提示窗口 start*/
//load页加载进度条信息
function loadProgressBar(load_rate){
	if (load_rate > 100){
	    load_rate = 100;
	}
	$("#loading_precent").css("width", load_rate + "%");
}

function showCityInfo(){
    //与服务器通信，拿到数据
	//cityinfo_name    cityinfo_img   cityinfo_word
	var city_name = m_city_list[m_curr_city_index].name + "市";
	var url_web = window.location.href;
	//var url_web = url_web.substring(0, url_web.lastIndexOf("/"));
	var city_img  = base_img_url + "city/" + m_curr_city_index + ".jpg";
	var city_info = m_city_info[m_curr_city_index].desc;
	
	document.getElementById("cityinfo_name").innerHTML = city_name;
	$("#cityinfo_img").attr("src", city_img); 
	document.getElementById("cityinfo_word").innerHTML = city_info;  
}

function showCityInfoWindow(){
	$("#div_overlay_id").show();
	$("#div_show_cityinfo_page").show();
}

//100ms后，再弹出城市介绍窗口
var showcity_delay_timer = 0;
function showcity_delay_timer_event(delay) {

	m_can_sharke_flag = false;//显示城市信息时不可以摇，只有显示完毕才可以

	window.clearTimeout(showcity_delay_timer);
	showcity_delay_timer = window.setTimeout(function (){
		showCityInfoWindow();
	},delay);
}

function hideCityInfo (){
	$("#div_overlay_id").hide();
	$("#div_show_cityinfo_page").hide();
	if (m_curr_city_index == m_city_list.length - 1){
		showCertificate();
	}
	m_can_sharke_flag = true;//显示完毕城市信息
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
	// 从服务器拿数据
	//=======================================================================================requestData to server
	//每次必须返回10条数据，后面的数据可以模拟，数据格式如下
	jRequest("index_test", "", requestRankData, jRequest_error);
	requestRankData();
}

function requestRankData(retData){
    var jsonData = [
			{"no":1, "name":"西门吹雪..", "icon":"wx_icon.jpg","dist":1200, "date":"未完成", "self":0},
			{"no":2, "name":"西门吹雪..", "icon":"wx_icon.jpg","dist":1200, "date":"未完成", "self":0},
			{"no":3, "name":"西门吹雪..", "icon":"wx_icon.jpg","dist":1200, "date":"未完成", "self":0},
			{"no":4, "name":"西门吹雪..", "icon":"wx_icon.jpg","dist":1200, "date":"未完成", "self":0},
			{"no":5, "name":"西门吹雪..", "icon":"wx_icon.jpg","dist":1200, "date":"未完成", "self":0},
			{"no":6, "name":"西门吹雪..", "icon":"wx_icon.jpg","dist":1200, "date":"未完成", "self":0},
			{"no":7, "name":"西门吹雪..", "icon":"wx_icon.jpg","dist":1200, "date":"未完成", "self":0},
			{"no":8, "name":"西门吹雪..", "icon":"wx_icon.jpg","dist":1200, "date":"未完成", "self":0},
			{"no":9, "name":"西门吹雪..", "icon":"wx_icon.jpg","dist":1200, "date":"未完成", "self":0},
		    {"no":10001, "name":"西门吹雪..", "icon":"wx_icon.jpg","dist":1200, "date":"未完成", "self":1}
		];
	var rank_innerHtml = "";
	for (var i = 0; i < jsonData.length; i++) {
		var l_li = "";
		//top 1 2 3, self
		if (jsonData[i]["self"] == 1) {
			if (jsonData[i]["no"] == "1") {
				l_li = "<li class='top1 rank_me'><em>";
			} else if (jsonData[i]["no"] == "2") {
				l_li = "<li class='top2 rank_me'><em>";
			} else if (jsonData[i]["no"] == "3") {
				l_li = "<li class='top3 rank_me'><em>";
			} else {
				var l_no = jsonData[i]["no"] + "";
				if(l_no.length > 4) {
					l_no = "100+"
				}
				l_li = "<li class='rank_me'><em>" + l_no;
			}
		} else {
			if (jsonData[i]["no"] == "1") {
				l_li = "<li class='top1'><em>";
			} else if (jsonData[i]["no"] == "2") {
				l_li = "<li class='top2'><em>";
			} else if (jsonData[i]["no"] == "3") {
				l_li = "<li class='top3'><em>";
			} else {
				var l_no = jsonData[i]["no"] + "";
				if(l_no.length > 4) {
					l_no = "100+"
				}
				l_li = "<li><em>" + l_no;
			}
		}
		//处理name
		var l_name = jsonData[i]["name"];
		if (l_name.length > 3){
			l_name = l_name.substring(0, 3) + "..";
		}

		l_li += "</em><div style='background-image:url(" + base_img_url + jsonData[i]["icon"] + ")'></div><span>" + l_name
		     + "</span><a>" + jsonData[i]["dist"] + "公里</a><p>" + jsonData[i]["date"] + "</p></li>";
		rank_innerHtml += l_li;
	}
	document.getElementById("rank_list_ul").innerHTML = rank_innerHtml;
	
	$("#div_overlay_id").show();
	$("#div_ranking_list_page").show();
}

function hideRanking(){
    $("#div_overlay_id").hide();
	$("#div_ranking_list_page").hide();
	document.getElementById("rank_list_ul").innerHTML = "";
}

function showLimitWarning(){
	$("#div_overlay_id").show();
    $("#div_show_limit_window").show();
}
function closeLimitWindow(){
	$("#div_overlay_id").hide();
    $("#div_show_limit_window").hide();
	window.open(base_img_url + '../index2_close.htm','main_window');
	//window.location.href='';
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

//回到移动地图前的位置，超时会走这里，移动之后第一次摇一摇也会走这里
function goTodayCurrPosition(){
	moveStepsToNextCity(m_curr_city_index, m_curr_steps_to_lastcity);
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
    //总距离：m_total_distance
	//当前走过距离：
	//按照高度计算进度
	var bar = document.getElementById("div_main_progress_rate");
	
	if ( m_curr_city_index == m_city_list.length - 1){
	    m_city_list[m_curr_city_index].steps = 1;
    }
	var l_curr_dist = m_city_list[m_curr_city_index].dist * (m_curr_steps_to_lastcity / m_city_list[m_curr_city_index].steps);
	var bar_height = 100 - Math.floor(((m_curr_dist_begin2last + l_curr_dist)/m_total_distance) * 100);
	var bar_rate = "rect(" + bar_height + "px 100px 100px 0px)";
	bar.style.clip = bar_rate;
}

//绘制微信图标
function drawWeChartIcon(url){
	//$("#div_wechart_icon").css("background","url(http://localhost/h5/wx_icon.jpg) no-repeat");
    $("#div_wechart_icon").css("background-image", "url(" + url + ")");
}

//拖动地图逻辑 start
var move_map_flag = false;
var move_cur_pos = {
	x:0,
	y:0
}
var map_nx,map_ny,map_dx,map_dy,map_move_x,map_move_y;
//需要onload之后就绑定
const map_img = document.getElementById("main_map_img");
function bindMapMoveEvent(){
	//找到IMG
	if ( map_img == undefined) {
	    map_img = document.getElementById("main_map_img");
	}
	map_img.addEventListener("mousedown",function(){
        action_down();
    },false);
    map_img.addEventListener("touchstart",function(){
        action_down();
    },false)
    map_img.addEventListener("mousemove",function(){
        action_move();
    },false);
    map_img.addEventListener("touchmove",function(){
        action_move();
    },false)
    document.body.addEventListener("mouseup",function(){
        action_end();
    },false);
    map_img.addEventListener("touchend",function(){
        action_end();
    },false);
}

function action_down(){
	//console.log("--->down" + new Date());
	move_map_flag = true;
	var touch ;
	if(event.touches){
		touch = event.touches[0];
	}else {
		touch = event;
	}
	move_cur_pos.x = touch.clientX;
	move_cur_pos.y = touch.clientY;
	map_dx = map_img.offsetLeft;
	map_dy = map_img.offsetTop;
}

function action_move(){
	if(move_map_flag){
		//console.log("---------move");
		var touch ;
		if(event.touches){
			touch = event.touches[0];
		}else {
			touch = event;
		}
		map_nx = touch.clientX - move_cur_pos.x;
		map_ny = touch.clientY - move_cur_pos.y;
		map_move_x = map_dx+map_nx;
		map_move_y = map_dy+map_ny;
		map_img.style.left = map_move_x +"px";
		map_img.style.top = map_move_y +"px";
		
		//阻止页面的滑动默认事件
		document.addEventListener("touchmove",function(){
			event.preventDefault();
		},false);
	}
}
//鼠标释放时候的函数
function action_end(){
	if (move_map_flag) {
	    //置回到初始点的flag为true
		map_reset_flag = true;
		map_reset_timer_event(5000);
		
		//重置move_map_flag
		move_map_flag = false;
	}
}

//2s无响应 自动移动到初始点，或者摇一摇回到初始点，不计摇一摇次数
var map_reset_timer = 0;
var map_reset_flag  = false;//地图回到初始点的标志
function map_reset_timer_event(delay) {
	window.clearTimeout(map_reset_timer);
	map_reset_timer = window.setTimeout(function (){
		if (map_reset_flag) {
			map_reset_flag = false;
            goTodayCurrPosition();
		}
	},delay);
}
//拖动地图逻辑 end


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
			"dist_begin2last:":m_curr_dist_begin2last,
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



//存储城市介绍数据
var m_city_info = [
    {index:0, name:"上海", head:"TE荣耀之城",       desc:"上海坐拥TE全球六大研发中心之一的研发工程中心、先进制造实验室，和500多位工程师。每年七月的中国创新大会更是一场工程师的盛宴。智慧的碰撞，创新的孵化…在这里，洞见TE的创新力量。"},
	{index:1, name:"厦门", head:"工业双引擎",       desc:"TE厦门工厂，是TE在中国的第一家专注于工业领域的生产工厂。与苏州工厂南北呼应，双引擎助力TE在工业市场的布局。"},
    {index:2, name:"东莞", head:"东莞",             desc:"在位于珠江口东方的“明珠城市”东莞，坐落了一家集生产制造、创新研发、服务于一体的基地——TE东莞工厂。成立于2002年，TE东莞不仅仅关注客户，在履行企业社会责任方面也非常积极突出。 在东莞检验检疫局2017年“中国质量诚信企业”授牌仪式上被授予“中国质量诚信企业”的称号。"},
	{index:3, name:"深圳", head:"传感器“视”界",     desc:"来深圳绝不能错过TE传感器深圳工厂。在这里，你可以轻松进入传感器的“视”界，感知细微的温度、压力或者高度变化，上天、入地、下海，观你所不敢想。"},
	{index:4, name:"广州", head:"华南大本营",       desc:"26年的沉淀、五大生产基地遍布深圳、东莞、顺德、珠海，并在广州坐拥一个办事处，持续的研发投入和人才培养，广东省是当之无愧的TE华南大本营。"},
	{index:5, name:"珠海", head:"助飞国之重器",     desc:"在百岛之市珠海坐落着TE珠海工厂。也是在这里，TE助攻了一个国产大项目 –鲲龙号AG600。2017年12月，这架中国自行研发的大型水路两栖飞机在珠海首飞。"},
	{index:6, name:"佛山", head:"佛山顺德",         desc:"坐落于佛山顺德的TE广东工厂已过弱冠之年（建立于1995年），占地面积20,000平方米，主要从事连接器的制造和线束组装，产品在业内享负盛名。在2014年获得TEOA 4星工厂认证。员工从100多人发展到2000多人，正在自己最好的年华展现自己的能量。"},
	{index:7, name:"成都", head:"Chengdu, CAN DO!", desc:"这是曾亮相纽约时代广场电子屏的宣传语，TE成都工厂就用敢拼的个性诠释着他们的“CAN DO”精神：自2015年正式启动TEOA，短短2年，他们就完成了TEOA四星认证。"},
	{index:8, name:"武汉", head:"未来工程师",       desc:"TE“未来工程师”项目正在武汉进行时。2016年，TE与武汉理工大学签订校企合作项目协议书，共同推进人才培养及大学教育的可持续发展。"},
	{index:9, name:"南京", head:"南京",             desc:"1.在六朝古都南京你也找到TE的办事处。TE“未来工程师”项目也在这里落地生根。2017年TE与南京理工大学电光学院召开了“人才培养座谈会”，就TE创意竞赛、学生就业以及联合培养事宜进行了深入的探讨。当高精尖工程师人才的孵化器，我们是认真的。"},
	{index:10, name:"苏州",head:"TE的苏州情缘",     desc:"苏州，这座历史名城，是TE全球在单一城市最大的生产基地之一。TE在苏州工业园区、相城区和昆山市拥有8个先进制造基地、1个财务共享中心和1个物流分拨中心。"},
	{index:11, name:"昆山",head:"昆山",             desc:"“百戏之祖”的昆曲故乡，“第一水乡”的周庄隶属。昆山可谓充满了发展机遇。除了工厂，TE作为美商会会员公司，于2016年有幸出席了首届上海美国商会昆山市交流会，收获满满。"},
	{index:12, name:"青岛",head:"有故事的青岛",     desc:"TE在大美青岛有两家工厂、一个办事处，以及无数精彩的故事。比如，TE的产品被应用在青岛3号线上，助力山东步入了地铁时代。3号线也成为了我们新员工培训的特别所在。"},
	{index:13, name:"北京",head:"中国速度",         desc:"帝都不仅有我们的团队，更见证TE助力复兴号跑进350公里时代 - 2017年6月26日，由北京开往上海的中国标准动车组G123次“复兴号”动车稳步启动，领跑中国高铁新征程。"},
	{index:14, name:"长春",head:"长春",             desc:"每个城市都有自己的性格，在长春，人们会高谈阔论三样东西：人情味、酒量和汽车。身披中国“汽车城”的铠甲，长春在一路高歌猛进的中国汽车行业持续沸腾。在这里，TE长春办事处的TE人练就了一身过人的技能，演绎着TE家庭里好爽而丰满的个性。"},
];
