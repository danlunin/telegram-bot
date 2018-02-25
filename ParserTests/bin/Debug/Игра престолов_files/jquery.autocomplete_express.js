allgray=false;
lastquery=null;
lastresult={};
lastrequest='';
lastmode='';

var searchtypes=new Array();
searchtypes['first']='Возможно, вы искали';
searchtypes['film']='Фильмы';
searchtypes['people']='Имена';
searchtypes['cinema']='Кинотеатры';
searchtypes['page']='Страницы КиноПоиска';
searchtypes['user']='Пользователи';
searchtypes['keyword']='Ключевые слова';

var mode='';
var ModeSettingsex=new Array();
ModeSettingsex['']=new Array();
ModeSettingsex['']['handler']="handler_search.php";
ModeSettingsex['']['label']="";
ModeSettingsex['']['pos']={"padding-left":2,"width":272};
ModeSettingsex['user']=new Array();
ModeSettingsex['user']['handler']="handler_search_login.php";
ModeSettingsex['user']['label']="Пользователь";
ModeSettingsex['user']['pos']={"padding-left":100,"width":174};
ModeSettingsex['keyword']=new Array();
ModeSettingsex['keyword']['handler']="handler_search_keyword.php";
ModeSettingsex['keyword']['label']="Слово";
ModeSettingsex['keyword']['pos']={"padding-left":60,"width":214};
ModeSettingsex['text']=new Array();
ModeSettingsex['text']['handler']="";
ModeSettingsex['text']['label']="Текст";
ModeSettingsex['text']['pos']={"padding-left":60,"width":214};
ModeSettingsex['studio']=new Array();
ModeSettingsex['studio']['handler']="";
ModeSettingsex['studio']['label']="Студия";
ModeSettingsex['studio']['pos']={"padding-left":65,"width":209};
SearchModeex="";

function ListenSearchFieldex(){
    var search_query=$( "#search_inputex" ).val();
    if(search_query.indexOf("user:")>-1) SetSearchModeex("user");
    if(search_query.indexOf("keyword:")>-1) SetSearchModeex("keyword");
    if(search_query.indexOf("studio:")>-1) SetSearchModeex("studio");
    if(search_query.indexOf("text:")>-1) SetSearchModeex("text");
}

function normalHtml(text){
    text = text.replace("&raquo;","»");
    text = text.replace("&laquo;","«");
    text = text.replace("&nbsp;"," ");
    return text;
}

function SetSearchModeex(mode){
    SearchModeex=mode;
    $('#SearchModeex').val(mode);
    if(ModeSettingsex[mode]){
        if(ModeSettingsex[mode]['label']){
            if(!$("#search_labelex").length)
                $( "<div id='search_labelex' class='search_labelex'></div>" ).insertBefore( "#search_inputex" );
                var html= "<img onclick='SetSearchModeex(\"\"); return false;' src='http://st.kp.yandex.net/images/bg_close_small.gif'>"+ ModeSettingsex[mode]['label']+":";
                if(!ModeSettingsex[mode]['handler']){
                    $( "#search_inputex" ).autocomplete('close');
                    $( "#search_inputex" ).autocomplete('disable');
                    $( "#search_inputex" ).removeClass('ui-autocomplete-loading');
                } else {
                    $( "#search_inputex" ).autocomplete('enable');
                }
                $("#search_labelex").html(html).fadeIn('fast');
        } else {
            $("#search_labelex").fadeOut('fast');
        }
        $( "#search_inputex" ).val(trim($( "#search_inputex" ).val().replace(mode+":","")));
        $( "#search_inputex" ).animate( ModeSettingsex[mode]['pos'] );
    }
}

// поиск в шапке
$(function(){

    host = window.location.hostname;

    if ($( "#search_inputex" ).length>0){
        $( "#search_inputex" ).keyup(ListenSearchFieldex);
        ListenSearchFieldex();

        $( "#search_inputex" ).autocomplete({
            source: function( request, response ) {
                allgray=false;
                lastquery=Math.random();
                lastrequest=(SearchModeex?SearchModeex+": ":"")+request.term;
                lastmode=SearchModeex;

                $.ajax({
                    url: "http://"+host+"/"+ModeSettingsex[SearchModeex]['handler'],
                    dataType: "jsonp",
                    data: {
                        q: request.term,
                        query_id: lastquery,
                        type: "jsonp",
                        topsuggest: true
                    },
                    success: function( data ) {
                        if(data.query_id && data.query_id!=lastquery){
                            data=lastresult;
                        }
                        lastresult=data;
                        data.query_id=null;
                        count=0;
                        for(v in data)
                            if(data[v])
                                count++;

                        response( $.map( data, function( item,key ) {
                            if(count-1==key) item.last=true;
                            return item;
                        }));
                    }
                });
            },
            minLength: 2,
            open:  function( event, ui ) {
                Metrika.params({suggest_express: true});
                $(".ui-menu-item a").on('click',function(event){
                    Metrika.reachGoal('visit_from_suggest_express')
                    return true;
                });
            },
            position: { my: "left-3 top+2", at: "left bottom" },
            delay: 200,
            focus: function( event, ui ){
                if(event.keyCode > 0){
                    if(ui.item.name) label=ui.item.name;
                    if(ui.item.rus) label=ui.item.rus;
                    if(ui.item.login) label=ui.item.login;
                    $( "#search_inputex" ).val( normalHtml(label) );
                }
                return false;
            },
            select: function( event, ui ) {
                if(!ui.item.link) return false;
                top.location=ui.item.link;
                if(ui.item.name) label=ui.item.name;
                if(ui.item.rus) label=ui.item.rus;
                if(ui.item.login) label=ui.item.login;
                $( "#search_inputex" ).val( normalHtml(label) );
                return false;
            }
        }).data("ui-autocomplete")._renderItem = function(ul, item){
            if (lastmode != SearchModeex) {
                return false;
            }
            var txt = '';
            if (item.type) {
                ul.append("<li class='ui-menu-item-other'><b class='category'>"+searchtypes[item.type]+"</b></li>");
            }
            if (item.type == 'cinema' || item.type == 'page' ) {
                allgray = true;
            } else if (item.type != '') {
                allgray = false;
            }

            switch (SearchModeex) {
                case "user":{
                    txt+="<a href='"+item.link+"'><span class='act allgray profile_name "+item.icon_class+"'><s></s>"+item.login+"</span><span class='fio'>"+item.fio+"</span></a>";
                    break;
                }
                case "keyword":{
                    txt+="<a href='"+item.link+"'><span class='act allgray'>"+item.rus+"</span></a>";
                    break;
                }
                default:{
                    var param = new Array();
                    var allowed = 65;
                    if (item.type == 'first') {
                        allowed = 62;
                    }

                    if (item.rus.length > allowed) {
                        var reg = new RegExp('^(.{1,'+allowed+'})[^&#a-z0-9;]+', 'i');
                        var ar = reg.exec(item.rus+' ');
                        if (ar) {
                            item.rus2 = ar[1].replace(/\s$/, '');
                        } else {
                            item.rus2 = item.rus.substr(0, allowed);
                        }
                        item.rus2 += '...';
                    } else {
                        item.rus2 = item.rus;
                    }

                    if (item.name && item.name != item.rus) {
                        allowed -= item.rus2.length;
                        if (allowed > 1 && item.name.length > allowed) {
                            var reg = new RegExp('^(.{1,'+allowed+'})[^&#a-z0-9;]+', 'i');
                            var ar = reg.exec(item.name+' ');
                            if (ar) {
                                item.name = ar[1].replace(/\s$/, '');
                            } else {
                                item.name = item.name.substr(0, allowed);
                            }
                            item.name += '...';
                        } else if (allowed < 2) {
                            item.name = '';
                        } else {
                            item.name = item.name;
                        }
                        if (item.name.length && item.name != '...') {
                            param[param.length] = item.name;
                        }
                    }

                    if (item.is_serial && item.is_serial =='mini'){
                        param[param.length]="мини-сериал";
                    }
                    if (item.is_serial && item.is_serial =='serial'){
                        param[param.length]="сериал";
                    }
                    if (item.year && item.year != 0) {
                        param[param.length] = item.year;
                    }
                    var ur_rating = item.ur_rating;
                    if (item.ur_rating)  {
                        var ur_rating = "<b class='ratingGreyColor'>"+(item.ur_rating ? item.ur_rating : '')+"</b>"
                    }
                    if (item.ur_rating && item.ur_rating < 5)  {
                        var ur_rating = "<b class='ratingRedColor'>"+(item.ur_rating ? item.ur_rating : '')+"</b>"
                    }
                    if (item.ur_rating && item.ur_rating >= 7)  {
                        var ur_rating = "<b class='ratingGreenColor'>"+(item.ur_rating ? item.ur_rating : '')+"</b>"
                    }
                    if (item.ur_rating === 0)  {
                        var ur_rating = '<b class="rNone">&mdash;</b>'
                    }
                    txt +=
                        "<a href='"+item.link+"'>"+
                            "<span class='act"+(allgray ? " allgray" : '')+(item.type == 'first' ? " bolder" : '')+"'>"+item.rus2+"</span>"+
                            (param.length > 0 ? " ("+param.join(", ")+")" : '')+(ur_rating ? ur_rating :'')+
                        "</a>";
                    break;
                }
            }

            ret=$( "<li></li>" )
                .data( "ui-autocomplete-item", item )
                .append( txt )
                .appendTo( ul );

            if (item.last) {
                var lastrequest_encode = encodeURIComponent(lastrequest);
                var html_last = "<span class='adds'><span href='#' class='auto-right' onclick='hideSuggestex(); return false;'>убрать подсказки</span>"
                               +'<span class="auto-left" href="/index.php?first=no&kp_query='+lastrequest_encode+'" onclick="top.location=\'/index.php?first=no&kp_query='+lastrequest_encode.replace(/'/g, "\\'")+'\'; return false;">все результаты</span> &raquo;</span>';
                ul.append("<li class='ui-menu-item-other'>" + html_last + "</li>");
            }
            return ret;
        };
        $( "#search_inputex" ).autocomplete('widget').addClass('main-search-autocomplete').addClass('navui');
        if($.cookie("hideSuggest"))
            $( "#search_inputex" ).autocomplete('disable');
         ListenSearchFieldex();
    }
});


function hideSuggestex(){
    $.cookie("hideSuggest",1,{path:"/",domain:"kinopoisk.ru",expires:30});
    $( "#search_inputex" ).autocomplete('close');
    $( "#search_inputex" ).autocomplete('disable');
    if(typeof(noalertforsuggest)=='undefined')
        alert("Подсказки скрыты. Вы можете включить их на странице результатов поиска.");
}

function trim(s) {
  s = s.replace( /^\s+/g, '');
  return s.replace( /\s+$/g, '');
}

   var userAgent = navigator.userAgent;
	if (navigator.userAgent.indexOf('iPad') > -1 || navigator.userAgent.indexOf('iPhone') > -1 || navigator.userAgent.indexOf('Android') > -1) {
		$('#GoUpWrapper').hide();
	} else {
		$(function () {
			var scroll_timer;
			var displayeds = false;
			var $window = $(window);
			if($.browser.opera || $.browser.msie){
				var top = 800;
			} else {
				var top = 350;
			}
			$(document).on("focus", ".express form .formText input", function(){
				$("#nav_express").addClass("nav_active");
				$(".formText input").css("color", "#000");
				if ($(".formText input").val() == "поиск фильмов и актёров" || $(this).val() == "поиск фильмов и актёров") {
					$(this).val("");
				}
			});
            $("#top_form .formText input").bind("keyup", function(){
                if ($("#top_form .formText input").val() != '') {
				   $(".express form .formText input").val($("#top_form .formText input").val());
				}
			});
            $(".express form .formText input").bind("keyup", function(){
                if ($(".express form .formText input").val() != "поиск фильмов и актёров" || $(this).val() != "поиск фильмов и актёров") {
                    $("#top_form .formText input").val($(".express form .formText input").val());
				}
			});
            $("#top_form .formText input").bind("blur", function(){
                if ($("#top_form .formText input").val() != '') {
				   $(".express form .formText input").val($("#top_form .formText input").val());
				}
			});
            if ($("#top_form .formText input").val() != '') {
				$(".express form .formText input").val($("#top_form .formText input").val());
			}
			$(document).on("blur", ".express form .formText input", function(){
				$("#nav_express").removeClass("nav_active");
				$(this).css("color", "#999999");
				if ($(".express form .formText input").val() == '') {
				   $(".express form .formText input").val("поиск фильмов и актёров").css("color", "#999999");
				   $("#nav_express").removeClass("nav_active");
				}
			});
			$window.scroll(function () {
				window.clearTimeout(scroll_timer);
				scroll_timer = window.setTimeout(function () {
					$("#nav_express").removeClass("nav_active");
					$(".express form .formText input").blur();
					$(".ui-autocomplete").hide();
					if(document.getElementById('out_indicator')) {
						 document.getElementById('out_indicator').value=0;
					}
                    if ($("#top_form .formText input").val() == '') {
                       $(".express form .formText input").val("поиск фильмов и актёров");
                    }
					if($window.scrollTop() <= top) {
						displayeds = false;
						$("#nav_express").hide();
						if ($(".express form .formText input").val() == 'поиск фильмов и актёров') {
							$(".express form .formText input").val("");
						}
						$(".express form .formText input").css("color", "#999999");
						$("#nav_express").removeClass("nav_active");

					} else if (displayeds == false) {
						$("#nav_express").show();
						displayeds = true;
					}
				}, 10);
			});
            $window.one("scroll", function(){
               if(location.hash != ''){
                    window.setTimeout(function () {
                        $("#nav_express").hide();
                        displayeds = false;
                    }, 200);
               }
            });
            function onhashchangeOne() {
               if(location.hash != ''){
                   $("#nav_express").hide();
                   displayeds = false;
               }
            }
            window.onhashchange = function () {
                setTimeout(onhashchangeOne, 10);
            }
		});

	}
