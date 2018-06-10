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
var m_total_distance = 6750;//default
var m_user_wx_token = "";
var m_user_wx_icon = "";
var m_curr_today_remaind_num = 0;//剩余摇一摇次数
var m_curr_dist_begin2last = 0;//开始到上一个城市的总公里数--不需要从服务器拿，自己计算
var m_curr_steps_to_lastcity = 0;//到上一个城市当前走了多少步
var m_curr_city_index = 0;//当前城市的索引
var m_today_arrived_city = 0;//今天到达的城市数

var m_can_sharke_flag = false;
var base_img_url = "";

/*退出动画相关*/
const cv = document.getElementById("c-1");
//const cxt= cv.getContext("2d");

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
	document.getElementById("c-1").style.width = (m_width - 30) + "px";
	document.getElementById("c-1").style.height= (m_height- 30) + "px";
	cv.width = (m_width - 30)*2;
	cv.height = (m_height - 30)*2;
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
        showHelpInfo();
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
	//初始化旗子和Wx_Icon位置
	initFlagAndWxIcon(0);
	m_can_sharke_flag = true;
	//下一阶段
	nextPhase();
	
	//开始游戏
	//首先移动到上一次的位置
	moveStepsToNextCity(m_curr_city_index, m_curr_steps_to_lastcity);
	//绘制已到达城市的初始橙色信息
	initArrivedCityIcon(-1);

	//PRD:开始游戏到进入游戏之间先弹出排行榜
	showRanking();
}

//开始移动的button
var m_next_go_steps = 0;
function startMoveSteps(){
    //alert("开始移动");
	if (m_next_go_steps <= 0 || m_can_sharke_flag) {
	    //信息未同步 check and sync
		//check server data,keep data uniformity
		return;
	} else {
	    //moveStepsToNextCity(m_curr_city_index, m_next_go_steps);
		//sync data, update local data
		m_curr_today_remaind_num--;
		m_curr_steps_to_lastcity += m_next_go_steps;
		
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
        console.log("steps_to_lastcity"+m_curr_steps_to_lastcity);
		/*中间显示城市介绍信息，规则：如果steps>=6, 在第二次弹出城市介绍，其余在第一次弹出城市介绍，如果没弹出，则先弹出城市介绍，再弹出城市到达*/
		if (m_curr_steps_to_lastcity != 0){
		    if (m_city_list[m_curr_city_index].steps >= 6){//第二次
                if (m_curr_steps_to_lastcity > 2 && !isShowedCityInfo) {
				    showCityInfo();
			        showcity_delay_timer_event(1000);
                    if (m_curr_city_index == 0) {
                        needShowCityInfo_shanghai3 = true;
                    }

			    }else if(needShowCityInfo_shanghai3){//弹出上海3的信息
                    showCityInfo_shanghai3();
                    showcity_delay_timer_event(1000);
                }
				//第一次走一步，显示上海的介绍
				if (m_curr_city_index == 0 && m_curr_steps_to_lastcity == 1){
				    //showCityInfo();
				    //showcity_delay_timer_event(1000);
				}
			} else {//小于6，第一次
			    if(!isShowedCityInfo) {
					showCityInfo();
				    showcity_delay_timer_event(1000);
				}
			}
            if (m_curr_city_index == 1  && needShowCityInfo_guangdong){//广东的提示
                isShowedCityInfo = false;
                showCityInfo_guangdong();
                showcity_delay_timer_event(1000);
            }
		}
	}
	$("#div_main_progress_tips").hide();
	drawEnergyProgressBar(-1);
	m_next_go_steps = -1;
	m_can_sharke_flag = true;//移动之后置摇一摇属性为true
}

function shakePhone(){
	//移动地图之后第一次摇一摇会回到之前的位置，不记录摇一摇次数
	if (!m_can_sharke_flag) {
		console.log("this sense cannot shake phone");
	    return;
	}
	if (map_reset_flag || map_zoom_inout_flag) {//放大缩小之后第一次摇一摇不计数，回到原来的尺寸与比例
		backToTodayOriginPosition();
		map_reset_flag = false;
		return;
	}
	//如果已经在最后一座城市
	if (m_curr_city_index == m_city_list.length - 1){
		//showCertificate();
		return;
	}
    // jiayazhou add for no limit shark
    if (sharkeAll) {
       m_curr_today_remaind_num = 5;
    }
    //剩余次数：
	if (m_curr_today_remaind_num == 0){
		if (!sharkeAll) {
		    showLimitWarning();
		    return;
		} else {//无限摇一摇,重置剩余数量，并且将已经到达的城市数目变为0
			m_curr_today_remaind_num = m_city_list[m_curr_city_index].limit_count;
			m_today_arrived_city = 0;
            m_curr_today_remaind_num = 5;
		}
	}
	var l_remaind_step_to_next_city = m_city_list[m_curr_city_index].steps - m_curr_steps_to_lastcity;
	//var next_go_steps = 0;
	//如果今天未到达过城市，且剩余次数为1，则默认剩下全走
	if (m_curr_today_remaind_num == 1 && m_today_arrived_city == 0) {
	    m_next_go_steps = l_remaind_step_to_next_city;
	} else {
	    //calc next steps
	    m_next_go_steps = calcNextGoSteps(m_curr_today_remaind_num, l_remaind_step_to_next_city);
	}
	if (m_curr_city_index == 0 && m_curr_steps_to_lastcity == 0){//第一次摇一摇只走一步，显示上海的介绍
	    m_next_go_steps = 1;
	} //厦门之后的第一步显示广东，第二步显示厦门
    else if (m_curr_city_index == 1 && m_curr_steps_to_lastcity == 0){//第一步显示厦门
        needShowCityInfo_guangdong = false;
        isShowedCityInfo = false;
        m_next_go_steps = 1;
    } else if (m_curr_city_index == 1 && m_curr_steps_to_lastcity == 1){//第二步显示广东提示
       needShowCityInfo_guangdong = true;
    }

	//获取当前需要移动的步数之后,tips alert,能量条填充
	$("#div_main_progress_tips").show();
	drawEnergyProgressBar(m_next_go_steps);
	m_can_sharke_flag = false;//摇一摇一次之后
/*	if (next_go_steps == 0) {
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
		//中间显示城市介绍信息，规则：如果steps>=6, 在第二次弹出城市介绍，其余在第一次弹出城市介绍，如果没弹出，则先弹出城市介绍，再弹出城市到达
		if (m_curr_steps_to_lastcity != 0){
		    if (m_city_list[m_curr_city_index].steps >= 6){//第二次
				if (m_curr_steps_to_lastcity > 3 && !isShowedCityInfo) {
					showCityInfo();
				    showcity_delay_timer_event(1000);
				}
			} else {//小于6，第一次
			    if(!isShowedCityInfo) {
					showCityInfo();
				    showcity_delay_timer_event(1000);
				}
			}
		}
	}
	*/
}

//此属性标志在形变和移动自动返回时，不能操作放大和移动
var isBackingOriginPosition = false;
function backToTodayOriginPosition(){
    isBackingOriginPosition = true;
    if (map_reset_flag){
		if (map_zoom_inout_flag){
			hideOrShowCityIcon(false);
		}
		goTodayCurrPosition();
	}
	if (map_zoom_inout_flag){
		backToOriginSizeAndLoc();
		goTodayCurrPosition();
		//hideOrShowCityIcon(true);
		show_city_icon_timer_event(1000);
	} else {
        isBackingOriginPosition = false;
    }
}

var show_city_icon_timer = 0;
function show_city_icon_timer_event(delay) {
	window.clearTimeout(show_city_icon_timer);
	show_city_icon_timer = window.setTimeout(function (){
		//显示城市ICON信息
		hideOrShowCityIcon(true);
        isBackingOriginPosition = false;
	},delay);
}

//计算下一次摇一摇走的步数
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
	//public enable
	m_user_wx_token          = "[:te_wx_openid]";
	m_user_wx_icon           = g_headimgurl;
	m_curr_city_index        = g_cityindex;
	m_curr_today_remaind_num = g_today_remaind_num;
	m_curr_steps_to_lastcity = g_steps_2_lastcity;////此属性特殊，第二天重置默认
	m_today_arrived_city     = g_today_arrived_city;////此属性特殊，第二天重置默认
    var l_is_today_data      = "[:te_is_today_data]";////与上次时间匹配，如果是同一天返回1，不是同一天返回0

	//重置第二天属性
	if (l_is_today_data == 0 || l_is_today_data == "0") {
		m_curr_steps_to_lastcity = m_city_list[m_curr_city_index].steps;////此属性特殊，第二天重置默认
		m_today_arrived_city     = 0;////此属性特殊，第二天重置默认
	}

	//test start-------public disable
	/*
	m_user_wx_token = "121312";
	m_user_wx_icon =  base_img_url + "wx_icon.jpg"; 
	m_curr_city_index = 0;
	m_curr_today_remaind_num = 5;//jsonData["today_remaind_num"];
	m_curr_steps_to_lastcity = 0;
	m_today_arrived_city = 0;
        */
        //test end
	//=======================================================================================getData from server end

	//计算m_curr_dist_begin2last
	m_curr_dist_begin2last = 0;
	for (var i = 0; i < m_curr_city_index; i++) {
	    m_curr_dist_begin2last += m_city_list[i].dist;
	}
}


var m_city_list = [
    {index:0, name:"上海", position:{x:3351, y:2214}, dist:800 ,steps:8, limit_count:5, img: "/img/city/shanghai.png", showinfo:1},
    {index:1, name:"厦门", position:{x:3268, y:2679}, dist:500 ,steps:5, limit_count:3, img: "/img/city/xiamen.png"  , showinfo:1},
	{index:2, name:"东莞", position:{x:3012, y:2794}, dist:100 ,steps:5, limit_count:2, img: "/img/city/dongguan.png", showinfo:0},
	{index:3, name:"深圳", position:{x:3018, y:2900}, dist:100 ,steps:5, limit_count:2, img: "/img/city/shenzhen.png", showinfo:1},
	{index:4, name:"广州", position:{x:2900, y:2729}, dist:100 ,steps:5, limit_count:2, img: "/img/city/guangzhou.png", showinfo:0},
	{index:5, name:"珠海", position:{x:2797, y:2923}, dist:100 ,steps:5, limit_count:2, img: "/img/city/zhuhai.png", showinfo:1},
	{index:6, name:"佛山", position:{x:2759, y:2778}, dist:1200,steps:12,limit_count:5, img: "/img/city/foshan.png", showinfo:0},
	{index:7, name:"成都", position:{x:2138, y:2248}, dist:1000,steps:10,limit_count:5, img: "/img/city/chengdu.png", showinfo:1},
	{index:8, name:"武汉", position:{x:2608, y:2258}, dist:500 ,steps:5, limit_count:3, img: "/img/city/wuhan.png", showinfo:1},
	{index:9, name:"南京", position:{x:2899, y:2105}, dist:200 ,steps:4, limit_count:2, img: "/img/city/nanjing.png", showinfo:0},
	{index:10, name:"苏州", position:{x:3074, y:2211},dist:50  ,steps:5, limit_count:2, img: "/img/city/suzhou.png", showinfo:1},
	{index:11, name:"昆山", position:{x:3179, y:2150},dist:600 ,steps:6, limit_count:3, img: "/img/city/kunshan.png", showinfo:0},
	{index:12, name:"青岛", position:{x:3257, y:1842},dist:600 ,steps:6, limit_count:3, img: "/img/city/qingdao.png", showinfo:1},
	{index:13, name:"北京", position:{x:3056, y:1458},dist:900 ,steps:9, limit_count:5, img: "/img/city/beijing.png", showinfo:1},
	{index:14, name:"长春", position:{x:3724, y:1025},dist:0   ,steps:1, limit_count:0, img: "/img/city/changchun.png", showinfo:0}
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

function showCityInfo_shanghai1(){
    var l_city_index = m_curr_city_index;
	var city_name = m_city_list[l_city_index].name + "市";
	var city_img  = base_img_url + "city/" + l_city_index + ".png";
	var city_info = m_city_info[l_city_index].desc;
	

	document.getElementById("cityinfo_name").innerHTML = city_name;
	$("#cityinfo_img").attr("src", city_img); 
	document.getElementById("cityinfo_word").innerHTML = city_info;  

    var img = g_appurl + "/img/cityinfo/" + m_city_list[l_city_index].name + "1.png";
    console.log(img);
    var w = m_width * 0.67;
    var h = w * 709 / 494;
    var th = (m_height - h) / 4;
    $("#div_show_cityinfo_page2").css({"width": w + "px", "height": h + "px", "margin-top": th + "px"});
    $("#div_show_cityinfo_page2 img").attr("src", img);

    $("#div_overlay_id").show();
    // $("#div_show_cityinfo_page").show();
    $("#div_show_cityinfo_page2").removeClass("hidden");
}

var needShowCityInfo_shanghai3 = false;
function showCityInfo_shanghai3(){
        var l_city_index = m_curr_city_index;
        isShowedCityInfo = false;
        if (m_curr_steps_to_lastcity == 0 && !isShowedCityInfo){
            l_city_index--;
            if (l_city_index < 0){
                l_city_index = 0;
            }
        }
        var city_name = m_city_list[l_city_index].name + "市";
        var city_img  = base_img_url + "city/" + l_city_index + ".png";
        var city_info = m_city_info[l_city_index].desc;

        document.getElementById("cityinfo_name").innerHTML = city_name;
        $("#cityinfo_img").attr("src", city_img); 
        document.getElementById("cityinfo_word").innerHTML = city_info;  

    var img = g_appurl + "/img/cityinfo/" + m_city_list[l_city_index].name + "3.png";
    console.log(img);
    var w = m_width * 0.67;
    var h = w * 709 / 494;
    var th = (m_height - h) / 4;
    $("#div_show_cityinfo_page2").css({"width": w + "px", "height": h + "px", "margin-top": th + "px"});
    $("#div_show_cityinfo_page2 img").attr("src", img);

    needShowCityInfo_shanghai3 = false;
}
var neddShowCityInfo_guangdong = false;
function showCityInfo_guangdong(){
        var l_city_index = m_curr_city_index;
        isShowedCityInfo = false;
        if (m_curr_steps_to_lastcity == 0 && !isShowedCityInfo){
            l_city_index--;
            if (l_city_index < 0){
                l_city_index = 0;
            }
        }
        var city_name = m_city_list[l_city_index].name + "市";
        var city_img  = base_img_url + "city/" + l_city_index + ".png";
        var city_info = m_city_info[l_city_index].desc;

        document.getElementById("cityinfo_name").innerHTML = city_name;
        $("#cityinfo_img").attr("src", city_img); 
        document.getElementById("cityinfo_word").innerHTML = city_info;  

    var img = g_appurl + "/img/cityinfo/广东.png";
    console.log(img);
    var w = m_width * 0.67;
    var h = w * 709 / 494;
    var th = (m_height - h) / 4;
    $("#div_show_cityinfo_page2").css({"width": w + "px", "height": h + "px", "margin-top": th + "px"});
    $("#div_show_cityinfo_page2 img").attr("src", img);

    needShowCityInfo_guangdong = false;
}

function showCityInfo(){
    //与服务器通信，拿到数据
	//cityinfo_name    cityinfo_img   cityinfo_word
	var l_city_index = m_curr_city_index;
	//if(m_curr_steps_to_lastcity > 0){
		//l_city_index++;//jiayazhou disable for dispaly cityinfo of last city
		//if(m_curr_city_index == 0 && m_curr_steps_to_lastcity == 1){//第一次第一步显示上海的信息
		//    l_city_index = 0;
		//}
        if (m_curr_steps_to_lastcity == 0 && !isShowedCityInfo){
            l_city_index--;
            if (l_city_index < 0){
                l_city_index = 0;
            }
        }
	//}
    /*
	var city_name = m_city_list[l_city_index].name + "市";
	var city_img  = base_img_url + "city/" + l_city_index + ".png";
	var city_info = m_city_info[l_city_index].desc;
	

	document.getElementById("cityinfo_name").innerHTML = city_name;
	$("#cityinfo_img").attr("src", city_img); 
	document.getElementById("cityinfo_word").innerHTML = city_info;  
    */
    if (m_city_list[l_city_index].showinfo == 0){
        return;
    }

    var img = g_appurl + "/img/cityinfo/" + m_city_list[l_city_index].name + ".png";
    console.log(img);
    
    var w = m_width * 0.67;
    var h = w * 709 / 494;
    var th = (m_height - h) / 4;
    $("#div_show_cityinfo_page2").css({"width": w + "px", "height": h + "px", "margin-top": th + "px"});
    $("#div_show_cityinfo_page2 img").attr("src", img);
    
}

function showCityInfoWindow(){
    var l_city_index = m_curr_city_index;
    if (m_curr_steps_to_lastcity == 0 && !isShowedCityInfo){
        l_city_index--;
    }
    if (m_city_list[l_city_index].showinfo == 1){
    	$("#div_overlay_id").show();
	    // $("#div_show_cityinfo_page").show();
        $("#div_show_cityinfo_page2").removeClass("hidden");
	    isShowedCityInfo = true;
	    //第一次走一步，显示上海的介绍
	    //if (m_curr_city_index == 0 && m_curr_steps_to_lastcity == 1){
		//    isShowedCityInfo = false;
	    //}
    } else {
        isShowedCityInfo = true;
    }
}

//100ms后，再弹出城市介绍窗口
var isShowedCityInfo = false;
var showcity_delay_timer = 0;
function showcity_delay_timer_event(delay) {

	m_can_sharke_flag = false;//显示城市信息时不可以摇，只有显示完毕才可以

	window.clearTimeout(showcity_delay_timer);
	showcity_delay_timer = window.setTimeout(function (){
		//显示城市介绍信息
		if (!isShowedCityInfo) {
		    showCityInfoWindow();
		}
		//到达新的城市
		if (m_curr_steps_to_lastcity == 0) {//确认到达新的城市
		    //已到达的城市显示橙色信息
		    initArrivedCityIcon(m_curr_city_index);
			showCityArrived();//如果到达新城市,到达城市提示
		}
	},delay);
}

function hideCityInfo (){
	$("#div_overlay_id").hide();
	$("#div_show_cityinfo_page").hide();
    $("#div_show_cityinfo_page2").addClass("hidden");
    console.log("hide cityinfo");

	if (m_curr_city_index != 0 && m_curr_steps_to_lastcity == 0) {
	    showCityArrived();//如果到达新城市,到达城市提示
	}
	m_can_sharke_flag = true;//显示完毕城市信息
}

//城市到达提示页
function showCityArrived(){
	m_can_sharke_flag = false;//不能摇一摇
	//数据信息
	var city_name = m_city_list[m_curr_city_index].name;
    var img = m_city_list[m_curr_city_index].img;
    img = g_appurl + img;
    console.log(img);

	document.getElementById("div_city_arrived_name").innerHTML = city_name;
	document.getElementById("div_city_arrived_dist").innerHTML = m_curr_dist_begin2last + "公里";

    // $("#div_overlay_id").show();
	// $("#div_show_city_arrived_page").show();

    var w = m_width * 0.67;
    var h = w * 709 / 494;
    var dh = (m_height - h) / 4;
    $("#div_overlay_id").show();
    $("#div_arrived_city").css("margin-top", dh + "px");
	$("#div_arrived_city img").attr("src", img);
	$("#div_arrived_city").removeClass("hidden");
}

function hideCityArrived(){
    $("#div_overlay_id").hide();
	$("#div_show_city_arrived_page").hide();
    $("#div_arrived_city").addClass("hidden");
	isShowedCityInfo = false;///清除标记值
	m_can_sharke_flag = true;//可以摇一摇
    
    //如果已经在最后一座城市
    if (m_curr_city_index == m_city_list.length - 1){
        //showCertificate();
        //$("#div_overlay_id").show();
        $("#close_window").show();
        document.getElementById("div_overlay_id").style.opacity = 1;
        play_animation();
        m_can_sharke_flag = false;
    }
}

//完成奖杯
function showCertificate(){
    /*var w = m_width * 0.66;
    var h = w * 837 / 494;
    var th = (m_height - h) / 4;

    $("#div_show_certificate_page2").css({"width": w + "px", "height": h + "px", "margin-top": th + "px"});
    */
    document.getElementById("div_show_certi_name").innerHTML = g_nickname;
	$("#div_overlay_id").show();
	$("#div_show_certificate_page2").removeClass("hidden");
	
	//m_GameOver = true;
}
function hideCertificate(){
	$("#div_overlay_id").hide();
	$("#div_show_certificate_page2").addClass("hidden");
    //如果已经在最后一座城市
    if (m_curr_city_index == m_city_list.length - 1){
        showInputInfo();
    }
}
function saveCertificationBtn(){
    alert("保存图片...");
}

//输入页面
function showInputInfo(){
    /*var w = m_width * 0.66;
    var h = w * 837 / 494;
    var th = (m_height - h) / 4;

    $("#div_show_inputinfo_page2").css({"width": w + "px", "height": h + "px", "margin-top": th + "px"});
    */
	$("#div_overlay_id").show();
	$("#div_show_inputinfo_page2").removeClass("hidden");
	
	//m_GameOver = true;
}
function hideInputInfo(){
	$("#div_overlay_id").hide();
	$("#div_show_inputinfo_page2").addClass("hidden");
}
function saveInputInfo(){
    alert("保存个人信息...");
    //jiayazhou 0610 test
    hideInputInfo();
}


function showHelpInfo(){
    var w = m_width * 0.73;
    var h = w * 802 / 550;
    var th = (m_height - h) / 4;
    $("#div_show_help2").css({"width": w + "px", "height": h + "px", "margin-top": th + "px"});
    $("#div_overlay_id").show();
	$("#div_show_help2").removeClass("hidden");
}

function hideHelpInfo(){
    $("#div_overlay_id").hide();
	$("#div_show_help").hide();
	$("#div_show_help2").addClass("hidden");
}

function showRanking(){
	// 从服务器拿数据
	//=======================================================================================requestData to server
	//每次必须返回10条数据，后面的数据可以模拟，数据格式如下
	requestRankData();
}

function requestRankData(retData){
    // 模拟数据 public disable
    /*
    var jsonData = [
			{"no":1, "name":"西门吹雪..", "icon":"wx_icon.jpg","dist":1200, "date":"05-26", "self":0},
			{"no":2, "name":"西门吹雪..", "icon":"wx_icon.jpg","dist":1200, "date":"05-26", "self":0},
			{"no":3, "name":"西雪..", "icon":"wx_icon.jpg","dist":1200, "date":"05-26", "self":0},
			{"no":4, "name":"西吹雪..", "icon":"wx_icon.jpg","dist":1200, "date":"05-26", "self":0},
			{"no":5, "name":"西门吹雪..", "icon":"wx_icon.jpg","dist":1200, "date":"05-26", "self":0},
			{"no":6, "name":"西门吹雪..", "icon":"wx_icon.jpg","dist":1200, "date":"05-26", "self":0},
			{"no":7, "name":"吹雪", "icon":"wx_icon.jpg","dist":1200, "date":"05-26", "self":0},
			{"no":8, "name":"西门吹雪..", "icon":"wx_icon.jpg","dist":1200, "date":"05-26", "self":0},
			{"no":9, "name":"西门吹雪..", "icon":"wx_icon.jpg","dist":1200, "date":"05-26", "self":0},
		    {"no":10001, "name":"西门吹雪..", "icon":"wx_icon.jpg","dist":1200, "date":"05-26", "self":1}
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
		var l_name = subStringName(jsonData[i]["name"],4);

		l_li += "</em><div style='background-image:url(" + base_img_url + jsonData[i]["icon"] + ")'></div><span>" + l_name
		     + "</span><a class='a1'>" + jsonData[i]["dist"] + "公里</a><a class='a2'>" + jsonData[i]["date"] + "</a></li>";
		rank_innerHtml += l_li;
	}
	document.getElementById("rank_list_ul").innerHTML = rank_innerHtml;
    document.getElementById("div_rank_total_dist").innerHTML = "当前共累计: 20000公里";

	$("#div_overlay_id").show();
	$("#div_ranking_list_page").show();
        */
        // public enable
        var request_url = "index.rank2";
        if (m_curr_city_index == 14){
            request_url = "index.rank";
        }
        __request(request_url, {}, function(res) {
        console.debug(res);

        var rank_innerHtml = "";
        for (var i in res) {
            console.debug(res[i]);
            var l_li = "";
            //top 1 2 3, self
            if (res[i]["self"] == 1) {
                if (res[i]["rank"] == "1") {
                    l_li = "<li class='top1 rank_me'><em>";
                } else if (res[i]["rank"] == "2") {
                    l_li = "<li class='top2 rank_me'><em>";
                } else if (res[i]["rank"] == "3") {
                    l_li = "<li class='top3 rank_me'><em>";
                } else if (res[i]["rank"] == "-1") {
                    l_li = "<li class='rank_me'><em>100+";
                } else {
                    var l_no = res[i]["rank"] + "";
                    if(l_no.length > 4) {
                        l_no = "100+"
                    }
                    l_li = "<li class='rank_me'><em>" + l_no;
                }
            } else {
                if (res[i]["rank"] == "1") {
                    l_li = "<li class='top1'><em>";
                } else if (res[i]["rank"] == "2") {
                    l_li = "<li class='top2'><em>";
                } else if (res[i]["rank"] == "3") {
                    l_li = "<li class='top3'><em>";
                } else if (res[i]["rank"] == "-1") {
                    l_li = "<li><em>100+";
                } else {
                    var l_no = res[i]["rank"] + "";
                    if(l_no.length > 4) {
                        l_no = "100+"
                    }
                    l_li = "<li><em>" + l_no;
                }
            }
            //处理name
            console.debug(res[i]["nickname"]);
            //处理name
	        var l_name = subStringName(res[i]["nickname"], 4);
            var l_loc1 = parseInt(res[i]["loc1"]);
            var l_loc2 = parseInt(res[i]["loc2"]);
            //var l_curr_dist = m_city_list[m_curr_city_index].dist * (m_curr_steps_to_lastcity / m_city_list[m_curr_city_index].steps);
            //var dist = m_curr_dist_begin2last + l_curr_dist;
            var dist = calcDistance(l_loc1, l_loc2);

            l_li += "</em><div style='background-image:url(" + res[i]["headimgurl"] + ")'></div><span>" + l_name
                                + "</span><a class='a1'>" + dist + "公里</a><a class='a2'>" + res[i]["date"] + "</a></li>";
                        rank_innerHtml += l_li;
        }
        document.getElementById("rank_list_ul").innerHTML = rank_innerHtml;
        //建议服务端处理，返回5-6位字符串，5位一下直接显示，5-10显示XXX万，10位以上显示XXXX亿，XXXX千亿, wuhanyong
		document.getElementById("div_rank_total_dist").innerHTML = "当前共累计: " + getTotalDistanceDesc(total_dist) + "公里";

        $("#div_overlay_id").show();
        $("#div_ranking_list_page").show();
    });
        //get total distance
        var total_dist = "121111";
        __request("index.totaldistance", {}, function(res){
            total_dist = res["dist"];
            //console.log(dist);
            //建议服务端处理，返回5-6位字符串，5位一下直接显示，5-10显示XXX万，10位以上显示XXXX亿，XXXX千亿, wuhanyong
		    document.getElementById("div_rank_total_dist").innerHTML = "当前共累计: " + getTotalDistanceDesc(total_dist) + "公里";
        });
}

function getTotalDistanceDesc(total_dist){
    total_dist = total_dist + "";
    if (total_dist.length <= 5){
        return total_dist;
    } else if (total_dist.length < 9) {
        total_dist = total_dist.substring(0, total_dist.length - 4);
        return total_dist + "万";
    } else if (total_dist.length < 13){
        total_dist = total_dist.substring(0, total_dist.length - 8);
        return total_dist + "亿";
    } else {
        return "9999亿";
    }
}

function calcDistance(loc1, loc2){
    var dist = 0;
    for(var i=0; i< loc1; i++){
        dist += m_city_list[i].dist;
    }
    dist += m_city_list[loc1].dist * (loc2 / m_city_list[m_curr_city_index].steps);
    return Math.floor(dist);
}

function hideRanking(){
    $("#div_overlay_id").hide();
	$("#div_ranking_list_page").hide();
	document.getElementById("rank_list_ul").innerHTML = "";
    if (m_curr_city_index == 0 && m_curr_steps_to_lastcity == 0) {
        //jiayazhou add 0608
        showCityInfo_shanghai1();
    }
    if (m_curr_city_index == 14){//完成后第一次打开显示奖状信息
        showCertificate();
    }
}

function showLimitWarning(){
	$("#div_overlay_id").show();
    $("#div_show_limit_window").show();
}
function closeLimitWindow(){
	$("#div_overlay_id").hide();
    $("#div_show_limit_window").hide();
	//window.location.href='';
	$("#div_overlay_id").css("opacity",'1');
	enterCloseWindow();
}

function enterCloseWindow(){
    $("#div_overlay_id").show();
	$("#close_window").show();
	play_animation();
}

/*辅助提示窗口 end*/

/*放大缩小逻辑处理 start*/
var map_obj_origin_size = [
{width:0, height:0,top:0,left:0},//map
{width:0, height:0,top:0,left:0},//city1
{width:0, height:0,top:0,left:0},//city2
{width:0, height:0,top:0,left:0},//city3
{width:0, height:0,top:0,left:0},//city4
{width:0, height:0,top:0,left:0},//city5
{width:0, height:0,top:0,left:0},//city6
{width:0, height:0,top:0,left:0},//city7
{width:0, height:0,top:0,left:0},//city8
{width:0, height:0,top:0,left:0},//city9
{width:0, height:0,top:0,left:0},//city10
{width:0, height:0,top:0,left:0},//city11
{width:0, height:0,top:0,left:0},//city12
{width:0, height:0,top:0,left:0},//city13
{width:0, height:0,top:0,left:0},//city14
{width:0, height:0,top:0,left:0},//flag
{width:0, height:0,top:0,left:0},//icon
];
var map_zoom_in_rate = 1.0;
var map_zoom_inout_flag = false;
function mapZoomIn(){
    if (isBackingOriginPosition){
        console.log("...is auto resizeing");
        return;
    }
    map_zoom_in_rate += 0.05;
	if(map_zoom_in_rate > 2){
	    map_zoom_in_rate = 2;
	}
	mapZoomRate(map_zoom_in_rate);
}
function mapZoomOut(){
    if (isBackingOriginPosition){
        console.log("...is auto resizeing");
        return;
    }
	map_zoom_in_rate -= 0.05;
    if (map_zoom_in_rate == 0.85){
        return;
    }
	if(map_zoom_in_rate < 0.85){
	    map_zoom_in_rate = 0.85;
	}
	mapZoomRate(map_zoom_in_rate);
}
function backToOriginSizeAndLoc(){
	mapZoomRate(1);
	map_zoom_inout_flag = false;
	map_zoom_in_rate    = 1.0;
}
function mapZoomRate(rate){
	if(!map_zoom_inout_flag){//如果未进行过放大缩小，则先获取坐标信息
	    map_zoom_inout_flag = true;
		getOriginMapSize();
	}
	//放大缩小改变的是height,width  同时left,top均会更改
    //width，height等比例缩小
	var l_map = document.getElementById("main_map_img");
	l_map.style.width  = map_obj_origin_size[0].width *rate + "px";
	l_map.style.height = map_obj_origin_size[0].height*rate + "px";
	l_map.style.top    = map_obj_origin_size[0].top   *rate + "px";
	l_map.style.left   = map_obj_origin_size[0].left  *rate + "px";

	for (var i=0;i<m_gragObjs.length;i++){
		m_gragObjs[i].style.width  = map_obj_origin_size[i+1].width *rate + "px";
		m_gragObjs[i].style.height = map_obj_origin_size[i+1].height*rate + "px";
		m_gragObjs[i].style.top    = map_obj_origin_size[i+1].top   *rate + "px";
		m_gragObjs[i].style.left   = map_obj_origin_size[i+1].left  *rate + "px";
	}
}
function getOriginMapSize(){
	//放大缩小改变的是height,width
	var l_map = document.getElementById("main_map_img");
	map_obj_origin_size[0].width  = parseFloat(l_map.width);
	map_obj_origin_size[0].height = parseFloat(l_map.height);
	map_obj_origin_size[0].top    = parseFloat(l_map.style.top.replace("px", "") );
	map_obj_origin_size[0].left   = parseFloat(l_map.style.left.replace("px", ""));
	
	for (var i=0;i<m_gragObjs.length;i++){
		map_obj_origin_size[i+1].width  = parseFloat(m_gragObjs[i].width );
		map_obj_origin_size[i+1].height = parseFloat(m_gragObjs[i].height);
		map_obj_origin_size[i+1].top    = parseFloat(m_gragObjs[i].style.top.replace("px", "") );
		map_obj_origin_size[i+1].left   = parseFloat(m_gragObjs[i].style.left.replace("px", ""));
	}
}

/*放大缩小逻辑处理 end*/

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
		var currPos = {x:(m_width/2  - m_city_list[begin_city_index].position.x/2 ),
		               y:(m_height/2 - m_city_list[begin_city_index].position.y/2  + 30) };
		moveAnimation(currPos.x, currPos.y);
		moveArrivedCityIcon(currPos);//移动之后立即更新CityIcon信息
		return;
	}
	/*
	m_map_width  2700
    m_map_height 2098
	*/
	var currPos = calcCurrPosition(begin_city_index, curr_steps);
	moveAnimation((m_width/2  - currPos.x ), Math.floor(m_height/2 - currPos.y  + 30));
	moveArrivedCityIcon(currPos);//移动之后立即更新CityIcon信息
}

//回到移动地图前的位置，超时会走这里，移动之后第一次摇一摇也会走这里
function goTodayCurrPosition(){
	//首先初始化旗帜和Wx_Icon位置
	initFlagAndWxIcon(1);
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
	return {x: pos_x/2, y: pos_y/2};
}

//绘制进度信息
function drawEnergyProgressBar(steps){
	if (steps < 0){
	    uploadEverySteps();
		steps = 0;
	}
	var bar = document.getElementById("div_main_progress_rate");

	var bar_height = 100 - Math.floor(steps/m_city_list[m_curr_city_index].steps * 100);
	var bar_rate = "rect(" + bar_height + "px 100px 100px 0px)";
	bar.style.clip = bar_rate;
}

function uploadEverySteps(){
    	//sync data, server
    //=======================================================================================syncData to server
    //public enable
    var l_curr_dist = m_city_list[m_curr_city_index].dist * (m_curr_steps_to_lastcity / m_city_list[m_curr_city_index].steps);
	var dist = m_curr_dist_begin2last + l_curr_dist;
	dist = parseInt(dist);
    console.log("index.move:   dist:" + dist);
	__request("index.move", {loc1: m_curr_city_index, loc2: m_curr_steps_to_lastcity, distance: dist }, function(res) {
		console.debug(res);
		// m_current_city_index = res.cityindex;
		// m_today_arrived_city = res.today_arrived_city;
	});
}

function drawProgressBar(isInit){//abandon this method
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
    document.getElementById("div_wechart_icon_id").src = url;
}

//城市橙色覆盖计算逻辑 start
function initArrivedCityIcon(index){
	if (index > 0){
	    //每次到达一个城市，更新这个城市的橙色信息
		//$("#map_arrived_city" + index).show();
		//document.getElementById("map_arrived_city12").src = 'img/maps_city_lock2.png'
		$("#map_arrived_city" + index).hide();
	    return;
	}
	//初始化已走过的城市的橙色信息
	for(var i=1; i <= m_curr_city_index; i++){
	   $("#map_arrived_city" + i).hide();
	}
}

function hideOrShowCityIcon(showing){
	for(var i=m_curr_city_index + 1; i <= 14; i++){
		if (showing){
			$("#map_arrived_city" + i).show();
		} else {
			$("#map_arrived_city" + i).hide();
		}
	}
}

function moveArrivedCityIcon(center_pos){
	//拿到当前的中心点坐标
    //var m_curr_steps_to_lastcity = 0;//到上一个城市当前走了多
	//var center_pos = calcCurrPosition(m_curr_city_index ,m_curr_steps_to_lastcity);
	var curr_x = 0;
	var curr_y = 0;
	var map_arrived_city = 0;
	for(var i=1; i<15; i++) {
		//var i = 12;
		//计算offset，注意真实尺寸和移动尺寸差了2倍
		curr_x = m_city_list[i].position.x/2 - center_pos.x + m_width /2;
		curr_y = m_city_list[i].position.y/2 - center_pos.y + m_height/2 + 30;
		//在这个基础上，做自己的偏移, 20为city图标宽度的一半
		curr_x = curr_x  - 20;
		curr_y = curr_y  - 20;
		
		//map_arrived_city1
		//var map_arrived_city = document.getElementById("map_arrived_city" + i);
		//map_arrived_city.style.left = curr_x +"px";
		//map_arrived_city.style.top = curr_y +"px";
		//var map_arrived_city = "#map_arrived_city" + i;
		$("#map_arrived_city" + i).stop(!0).animate({"left": curr_x, "top": curr_y});
	}
}

function initFlagAndWxIcon(isInit){
	//flag 	    top: 266px; left: 181px;
	//wx_icon  left: 145px; top: 277px;
	if(isInit == 0){
		document.getElementById("div_main_flag_id").style.top    = (m_height*0.5 - 67.5) + "px";
		document.getElementById("div_main_flag_id").style.left   = (m_width*0.5  - 6.5)  + "px";
		document.getElementById("div_wechart_icon_id").style.top = (m_height*0.5 - 56.5) + "px";
		document.getElementById("div_wechart_icon_id").style.left =(m_width*0.5  - 42.5) + "px";
		return;
	}
	//182.5px
	//0.4*height
	//var map_arrived_city = "#map_arrived_city" + i;
	$("#div_main_flag_id").stop(!0).animate({"left": (m_width*0.5  - 6.5), "top": (m_height*0.5 - 67.5)});
	$("#div_wechart_icon_id").stop(!0).animate({"left": (m_width*0.5  - 42.5), "top": (m_height*0.5 - 56.5)});
}
//城市橙色覆盖计算逻辑 start

//拖动地图逻辑 start
var move_map_flag = false;
var move_cur_pos = {
	x:0,
	y:0
}
var map_nx,map_ny,map_dx,map_dy,map_move_x,map_move_y;
//需要onload之后就绑定
const map_img = document.getElementById("main_map_img");
//拖动对象
var m_gragObjs_const_count = 2;//拖动对象的常量值
const m_gragObjs =[
document.getElementById("div_main_flag_id"),
document.getElementById("div_wechart_icon_id"),
document.getElementById("map_arrived_city1"),
document.getElementById("map_arrived_city2"),
document.getElementById("map_arrived_city3"),
document.getElementById("map_arrived_city4"),
document.getElementById("map_arrived_city5"),
document.getElementById("map_arrived_city6"),
document.getElementById("map_arrived_city7"),
document.getElementById("map_arrived_city8"),
document.getElementById("map_arrived_city9"),
document.getElementById("map_arrived_city10"),
document.getElementById("map_arrived_city11"),
document.getElementById("map_arrived_city12"),
document.getElementById("map_arrived_city13"),
document.getElementById("map_arrived_city14") ];
var m_gragObjs_offset = [
{x:0, y:0},{x:0, y:0},{x:0, y:0},{x:0, y:0},{x:0, y:0},{x:0, y:0},
{x:0, y:0},{x:0, y:0},{x:0, y:0},{x:0, y:0},{x:0, y:0},{x:0, y:0},
{x:0, y:0},{x:0, y:0},{x:0, y:0},{x:0, y:0},{x:0, y:0}
];

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

var action_move_down_i = 0;
var action_move_move_i = 0;
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
	
	for (action_move_down_i = 0; action_move_down_i < m_gragObjs_const_count + 14; action_move_down_i++){
	    m_gragObjs_offset[action_move_down_i].x = m_gragObjs[action_move_down_i].offsetLeft;
		m_gragObjs_offset[action_move_down_i].y = m_gragObjs[action_move_down_i].offsetTop;
	}
}

function action_move(){
    if (isBackingOriginPosition){
        console.log("...is auto resizeing");
        return;
    }
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
		map_move_x = map_dx + map_nx;
		map_move_y = map_dy + map_ny;
		//添加移动边界保护
		if (map_move_x < (-2250*map_zoom_in_rate + m_width)){
			map_move_x = (-2250*map_zoom_in_rate + m_width);
			map_nx = map_move_x - map_dx;
		}
		if (map_move_y < (-1748.5*map_zoom_in_rate + m_height)){
			map_move_y = (-1748.5*map_zoom_in_rate + m_height);
			map_ny = map_move_y - map_dy;
		}
		if (map_move_x > 0){
		    map_move_x = 0;
			map_nx = map_move_x - map_dx;
		}
		if (map_move_y > 0){
		    map_move_y = 0;
			map_ny = map_move_y - map_dy;
		}
		//console.log("----move:map_move_x:" + map_move_x + "|map_move_y:" + map_move_y)
		map_img.style.left = map_move_x +"px";
		map_img.style.top = map_move_y +"px";
		//console.log("--map_dx:" + map_dx + "|map_dy:" + map_dy + "|map_nx:" + map_nx + "|map_ny:" + map_ny);

		for (action_move_move_i = 0; action_move_move_i <m_gragObjs_const_count + 14; action_move_move_i++){
			//m_gragObjs_offset[i].x = m_gragObjs[i].offsetLeft;
			//m_gragObjs_offset[i].y = m_gragObjs[i].offsetTop;
			map_move_x = m_gragObjs_offset[action_move_move_i].x + map_nx;
			map_move_y = m_gragObjs_offset[action_move_move_i].y + map_ny;
			m_gragObjs[action_move_move_i].style.left = map_move_x +"px";
			m_gragObjs[action_move_move_i].style.top  = map_move_y +"px";
		}
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
		map_reset_timer_event(4000);
		
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
			backToTodayOriginPosition();
			map_reset_flag = false;
			/*if (map_zoom_inout_flag){
			    backToOriginSizeAndLoc();
			}
            goTodayCurrPosition();*/
		}
	},delay);
}
//拖动地图逻辑 end


/*游戏逻辑 end*/


/*退出逻辑 start*/
function play_animation() {
    var framesUrl = [];
    for (var i = 0; i < 55; i++) {
        framesUrl.push(base_img_url + "close/te_00" + i + ".jpg");
    }

    var that = this;
    // frame animation
    var ani = new frame_ani({
        canvasTargetId: "c-1", // target canvas ID
        framesUrl: framesUrl, // frames url
        loop: false, // if loop
        height: 1100, // source image's height (px)m_height
        width: 750, // source image's width (px)m_width
        frequency: 20, // count of frames in one second
        audioIonName: null, // ion.sound audio name
        onComplete: function () { // complete callback
			//$("#c-1").hide();
			console.log("Animation loop.");
			//that.window.open('', '_self', '');
			//that.window.close();
			//open(location, '_self').close();
            $("#close_window").hide();
            document.getElementById("div_overlay_id").style.opacity = 0.8;
            showCertificate();
        },
    });

    // preload & play
    ani.initialize(function (){
        ani.play();
    });
}
/*退出逻辑 end*/



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
		alert("Travel End!");
		return;
	}
    sharkeAll = true;
    shakePhone();
    sharkeAll = false;
}

var sharkeAll = false;
var m_GameOver = false;
function sharkeAllTest() {
	// if (m_GameOver) {
	// 	alert("Travel End!");
	// 	return;
	// }

    // sharkeAll = true;
	// shakePhone();
	// sharkeAll = false;

    // showCityArrived();
    showCityInfo();
    showCityInfoWindow();
    // showCertificate();
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

/*通用方法 按全角半角截取字符串*/
function subStringName(str, num) {
    var len = 0;
    for (var i = 0; i < str.length; i++) {
        if (str[i].match(/[^\x00-\xff]/ig) != null) //全角
            len += 2;
        else
            len += 1;
    }
    if (len >= num) {
        newStr = str.substring(0, num) + "..";
    }
    return newStr;
}

//存储城市介绍数据
var m_city_info = [
    {index:0, name:"上海", head:"TE荣耀之城",       desc:"上海坐拥TE全球六大研发中心之一的研发工程中心、先进制造实验室、先进材料实验室，和500多位工程师。每年七月的中国创新大会更是一场工程师的盛宴。智慧的碰撞，创新的孵化…在这里，洞见TE的创新力量。"},
	{index:1, name:"厦门", head:"工业双引擎",       desc:"TE厦门是TE在中国的第一家专注于工业领域的先进制造基地。与苏州先进制造基地和客户体验中心南北呼应，双引擎助力TE在工业市场的布局。"},
    {index:2, name:"东莞", head:"东莞",             desc:"在位于珠江口东方的“明珠城市”东莞，坐落了一家集生产制造、创新研发、服务于一体的基地——TE东莞工厂。成立于2002年，TE东莞不仅仅关注客户，在履行企业社会责任方面也非常积极突出。 在东莞检验检疫局2017年“中国质量诚信企业”授牌仪式上被授予“中国质量诚信企业”的称号。"},
	{index:3, name:"深圳", head:"传感器“视”界",     desc:"来深圳绝不能错过TE传感器深圳先进制造基地和研发中心。在这里，你可以轻松进入传感器的“视”界，感知细微的温度、压力或者高度变化，上天、入地、下海，带你探索新“视”界。"},
	{index:4, name:"广州", head:"华南大本营",       desc:"26年的沉淀、五大先进制造基地分布于深圳、东莞、顺德、珠海，并在广州拥有一个办事处，持续的研发投入和人才培养，广东省是当之无愧的TE华南大本营。"},
	{index:5, name:"珠海", head:"助飞国之重器",     desc:"在百岛之市珠海坐落着TE珠海先进制造基地。也是在这里，TE助攻了一个国产大项目–鲲龙号AG600。2017年12月，这架中国自行研发的大型水路两栖飞机在珠海首飞。"},
	{index:6, name:"佛山", head:"佛山顺德",         desc:"坐落于佛山顺德的TE广东工厂已过弱冠之年（建立于1995年），占地面积20,000平方米，主要从事连接器的制造和线束组装，产品在业内享负盛名。在2014年获得TEOA 4星工厂认证。员工从100多人发展到2000多人，正在自己最好的年华展现自己的能量。"},
	{index:7, name:"成都", head:"Chengdu, CAN DO!", desc:"这是曾亮相纽约时代广场电子屏的宣传语，TE成都先进制造基地就用敢拼的个性诠释着他们的“CAN DO”精神：自2015年正式启动TEOA，短短2年，他们就完成了TEOA四星认证。"},
	{index:8, name:"武汉", head:"未来工程师",       desc:"TE“未来工程师”项目正在武汉进行时。2016年，TE与武汉理工大学签订校企合作项目协议书，共同推进人才培养及大学教育的可持续发展。"},
	{index:9, name:"南京", head:"南京",             desc:"1.在六朝古都南京你也找到TE的办事处。TE“未来工程师”项目也在这里落地生根。2017年TE与南京理工大学电光学院召开了“人才培养座谈会”，就TE创意竞赛、学生就业以及联合培养事宜进行了深入的探讨。当高精尖工程师人才的孵化器，我们是认真的。"},
	{index:10, name:"苏州",head:"TE的苏州情缘",     desc:"历史名城苏州是TE全球在单一城市最大的生产基地之一。TE在苏州工业园区、相城区和昆山市拥有8个先进制造基地、1个财务共享中心和1个物流分拨中心。"},
	{index:11, name:"昆山",head:"昆山",             desc:"“百戏之祖”的昆曲故乡，“第一水乡”的周庄隶属。昆山可谓充满了发展机遇。除了工厂，TE作为美商会会员公司，于2016年有幸出席了首届上海美国商会昆山市交流会，收获满满。"},
	{index:12, name:"青岛",head:"有故事的青岛",     desc:"TE在大美青岛有两家先进制造基地、一个办事处，以及无数精彩的故事。比如，TE的产品被应用在青岛3号线上，助力山东步入地铁时代。3号线也成为了我们新员工培训的特别场所"},
	{index:13, name:"北京",head:"中国速度",         desc:"帝都不仅有我们的办事处，还见证了TE助力“复兴号”驰入时速350公里的时代 - 2017年6月26日，由北京开往上海的中国标准动车组G123次“复兴号”动车稳步启动，领跑中国高铁新征程。"},
	{index:14, name:"长春",head:"长春",             desc:"每个城市都有自己的性格，在长春，人们会高谈阔论三样东西：人情味、酒量和汽车。身披中国“汽车城”的铠甲，长春在一路高歌猛进的中国汽车行业持续沸腾。在这里，TE长春办事处的TE人练就了一身过人的技能，演绎着TE家庭里好爽而丰满的个性。"},
];

// public enable
// the following code is copied from: https://www.cnblogs.com/catEatBird/p/7123441.html
function toShake(callBack) {
    var RANGE = 60;//当用户摇晃的幅度超过这个值，我们认定用户在摇一摇
    var isShake = false;//是否进行了摇一摇
    var lastX,lastY,lastZ;
    var lastTime = Date.now();
    window.addEventListener('devicemotion', function(e) {
        var nowTime = Date.now();
        //拉开执行的间隔，让iso和安卓的执行频率接近一致
        if(nowTime - lastTime < 100){
            return;
        }
        lastTime = nowTime;
        var motion = e.accelerationIncludingGravity;
        var x = motion.x;
        var y = motion.y;
        var z = motion.z;
        if(typeof lastX == "undefined"){//第一次进来还没有上一次的值
            lastX = x;
            lastY = y;
            lastZ = z;
            return;
        }
        var nowRange = Math.abs(x - lastX) + Math.abs(y - lastY) + Math.abs(z - lastZ);
        if(nowRange > RANGE){
            isShake = true;
        } 
        //当用户进行了剧烈的摇动，我们就认定用户进行了摇一摇，然后摇晃幅度慢下来之后，执行摇一摇函数
        if(isShake&&nowRange < 20){
            callBack&&callBack();
            isShake = false;
        }
        lastX = x;
        lastY = y;
        lastZ = z;
    });
}

toShake(function(){
    // alert("shake shake.");
    sharkeAll = true;//for all sharke jiayazhou 0608
    shakePhone();
    sharkeAll = false;//for all sharke jiayazhou 0608
});

function resetAll() {
    __request("index.reset", {}, function(res) {
        console.debug(res);
        m_curr_city_index = 0;
        m_curr_steps_to_lastcity = 0;
        m_today_arrived_city = 0;
        m_curr_today_remaind_num = 5;
        m_total_distance = 0;
	    m_GameOver = false;
        moveStepsToNextCity(0, 0);
    });
}

