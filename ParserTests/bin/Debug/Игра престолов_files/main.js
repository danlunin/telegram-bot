 DOCUMENT_LOADED = false;
var unavailableMessage = "КиноПоиск временно не принимает данные, но скоро всё заработает.";
$(function(){ DOCUMENT_LOADED = true; });

function isIOS()
{
    return (navigator.userAgent.indexOf('iPad') > -1 || navigator.userAgent.indexOf('iPhone') > -1);
}

function BlurMonitor()
{
    if ($('#darkSite').length == 0) {
        $("body").append("<div id='darkSite'></div><div id='loadtimer'><img src='http://www.kinopoisk.ru/images/loaders/fff_989898.gif' /></div>");
    }
    $('#darkSite').css({'display': 'block'}).animate({'opacity': 0.7});
    $('#loadtimer').css({'display': 'block'});
}

function unBlurMonitor()
{
    $('#darkSite').animate({'opacity': 0}, function(){
        $('#loadtimer').css({'display': 'none'});
        $('#darkSite').css({'display': 'none'});
    });
}

function setCommentVote(comment_id, vote, user, film)
{
    // ajax-крутилка
    $("#comment_num_vote_"+comment_id+"_note").css({display: "inline"});
    $("#comment_num_vote_"+comment_id+"_note").css({visibility: "visible"});

    $.get('/handler_comment.php', {comment: comment_id, vote: vote, user: user, film: film, rnd: (new Date()).getTime()}, function(resp){
        // ajax-крутилка
        $("#comment_num_vote_"+comment_id+"_note").css({display: "none"});
        $("#comment_num_vote_"+comment_id+"_note").css({visibility: "hidden"});

        if (resp == 'auth_error') {
            alert('Для голосования необходимо <a href="/login/" class="all">авторизоваться...</a>');
        } else if (resp == 'limit_vote') {
            alert('Голосовать можно не чаще одного раза в одну минуту.');
        } else if (resp == 'ban') {
            //
        } else {
            if (resp == 'too_young') {
                alert("К сожалению, данная функция пока что вам не доступна.");
            } else {
                document.getElementById("comment_num_vote_"+comment_id).innerHTML = resp.replace(/\n/g, "");

                try {
                    document.getElementById("vote_link_"+vote+"_"+comment_id).className = "vote_set";
                    document.getElementById("vote_link_"+(vote == "ok" ? "no" : "ok")+"_"+comment_id).className = "vote";
                } catch (e) {
                    //
                }
            }
        }
    }).fail(function(){
        $("#comment_num_vote_"+comment_id+"_note").css({display: "none"});
        $("#comment_num_vote_"+comment_id+"_note").css({visibility: "hidden"});
        alert(unavailableMessage);
    });
}

function alert_kp(error_text, reload_flag, place, div_name, callback)
{
    var timeout=2;
    if($.browser.msie) timeout=1000;
    setTimeout(function(){
        if(!DOCUMENT_LOADED)
        {
            $(function()
            {
                createAlert(reload_flag,callback);
                $("#ui_dialog").html(error_text);
                $("#ui_dialog").css({'textAlign':'center'});
                $("#ui_dialog").dialog('open');
                $(".ui-dialog-buttonpane > .ui-state-default").get(0).focus();

            });
        }
        else
        {
            createAlert(reload_flag,callback);
            $("#ui_dialog").html(error_text);
            $("#ui_dialog").css({'textAlign':'center'});
            $("#ui_dialog").dialog('open');
        }},timeout);
}

function createAlert(reload_flag, callback)
{
    if (!$("#ui_dialog").get(0)) {
        $("body").append("<div id='ui_dialog' title='ВНИМАНИЕ!'></div>");
        $("#ui_dialog").dialog({
            autoOpen:false,
            resizable:false,
            bgiframe:true,
            dialogClass: 'kp_alert',
            width:350,
            buttons: {
                OK: function() {
                    $(this).dialog('close');
                    if(reload_flag) top.location=top.location.href;

                }
            }
        });
        if (typeof(callback)=='function')
            $("#ui_dialog").bind( "dialogclose", callback);
    }
}

if(typeof(KP)=="undefined") KP={};
KP.Notice={
    window_focused : true,
    noticeQueue : [],
    noticeTimeout : [],
    noticeCount : 1,
    noticeTime : 10000,

    show: function(message, title, image, link, onclick, icon, autoclose, notice_num, onlyBuilt){
        if($("#ui_notice_container").length==0){
            $("body").append("<div id='ui_notice_container'></div>");
        }

        var id="ui_notice_"+(notice_num ? notice_num : KP.Notice.noticeCount++);
        var a_start= (link ? "<a href='"+link+"'>" : "");
        var a_end= (link ? "</a>" : "");

        $("#ui_notice_container > div").each(function(){
            KP.Notice.noticeHide($(this).attr('id'))
        });

        // tdimage
        // tdtext
        if(image){
            message=
                ( icon ? "<s class='icon icon_"+icon+"'></s>" : "" ) +
                "<div class='tdimage'><div>"+
                        "<img src='"+image+"' style='opacity:0.1' onload='$(this).animate({opacity:1});'>" +
                "</div></div><div class='tdtext'>"+
                ( title ? "<b>" + title + "</b><br />" : "" ) + message +  "</div><br clear=both>";
        } else
            message = ( title ? "<b>" + a_start + title + a_end + ":</b><br />" : "" ) + a_start + message + a_end;
        /*if(!onclick && link) {
            onclick = 'top.location = "'+link+'"';
        }*/
        $("#ui_notice_container").append("<"+ (link ? "a href='"+ link +"'" : "div") +" id='"+id+"' "+ (onclick ? "onclick='"+onclick+"'" : "")+" "+(autoclose ? "onmouseover='KP.Notice.noticeOver(this)' onmouseout='KP.Notice.noticeOut(this)'" : "")+" class='ui_notice ui_widget'></"+ (link ? "a" : "div") +">");
        $("#"+id)
        .html("<a class='close' href='#' onclick='KP.Notice.noticeHide(\""+id+"\"); return false;'></a>"+message)
        .animate({bottom:10},function(){
            if(!onlyBuilt)
                $(this).css({'display':'block'});
            if(autoclose){
                if(KP.Notice.window_focused){
                    clearTimeout(KP.Notice.noticeTimeout[id]);
                    KP.Notice.noticeTimeout[id]=setTimeout('KP.Notice.noticeHide("'+id+'")', KP.Notice.noticeTime);
                } else {
                    KP.Notice.noticeQueue[id]=id;
                }
            }
        });
    },

    noticeOver: function(obj){
        id=$(obj).attr("id");
        clearTimeout(KP.Notice.noticeTimeout[id]);
    },

    noticeOut: function(obj){
        id=$(obj).attr("id");
        KP.Notice.noticeTimeout[id]=setTimeout('KP.Notice.noticeHide("'+id+'")', Math.round(KP.Notice.noticeTime/2));
        //$(obj).;
    },

    noticeHide: function(id){
        $("#"+id).animate({opacity:0},function(){
            $("#"+id).css({display:"none"}).remove();
        });
    },

    initFocus: function () {
        var i = 0;
        for(var id = 0, num = KP.Notice.noticeQueue.length; id < num; id += 1) {
            KP.Notice.noticeTimeout[KP.Notice.noticeQueue[id]] =
                setTimeout(KP.Notice.noticeHide.bind(this, KP.Notice.noticeQueue[id]),
                    Math.round(KP.Notice.noticeTime) + (3000 * i++));
            KP.Notice.noticeQueue[id] = null;
        }
    },

    observe: function(){
        $(window).blur(function(){
            KP.Notice.window_focused=false;
        });

        $(window).focus(function(){
            KP.Notice.window_focused=true;
            KP.Notice.initFocus();
        });
    }
}

function notice_alert(message,title,image,link,icon){
    message = message.replace(/<\/?center>/g,"");
    if(typeof(KP.Notice)!="undefined"){
        KP.Notice.show(message,title,image ? image : 'http://st.kp.yandex.net/images/realTimePopupThumb.png',link, false, icon, false);
    }
}

function notice(message,title,image,link,icon){
    message = message.replace(/<\/?center>/g,"");
    if(typeof(KP.Notice)!="undefined"){
        KP.Notice.show(message,title,image ? image : 'http://st.kp.yandex.net/images/realTimePopupThumb.png',link, false, icon, true);
    }
}

function alert_popup(text, div_name, width, height)
{
    if (!DOCUMENT_LOADED) {
        $(function() {
            createPopup(width,height);
            $("#ui_popup").html(text);
            $("#ui_popup").parent().css({position:"fixed"}).end().dialog('open');

            $(".ui-widget-overlay").css({
                background: "#000",
                cursor: "pointer",
                opacity: 0.7,
                width: $(document.body).width(),
                height: $(document.body).height()
            }).click(function(){
                close_alert_window();
            });
        });
    } else {
        createPopup(width,height);
        $("#ui_popup").html(text);
        $("#ui_popup").parent().css({position:"fixed"}).end().dialog('open');

        $(".ui-widget-overlay").css({
            background: "#000",
            cursor: "pointer",
            opacity: 0.7,
            width: $(document.body).width(),
            height: $(document.body).height()
        }).click(function(){
            close_alert_window();
        });
    }
}
function createPopup(width,height)
{
    if(!$("#ui_popup").get(0)){
        $("body").append("<div id='ui_popup'></div>");
    } else {
        $("#ui_popup").dialog('destroy');
    }
    $("#ui_popup").dialog({
        autoOpen:false,
        resizable:true,
        modal: true,
        dialogClass: 'kp_popup',
        width:width?width:800,
        height:height?height:600
    });
}

function close_alert_window()
{
    $("#ui_popup").dialog('close');
    $("#ui_popup").dialog('close');
}

function setBBCode(obj, code, pos)
{
    var partBefore = '';
    var partInner = '';
    var partAfter = '';
    var partInnerTags = '';

    if (code == '&laquo;' || code == '&raquo;') {
        var codeOpener = code;
        var codeCloser = '';
        pos = {start: pos.start, end: pos.start};
    } else if (code == '&laquo;&raquo;') {
        var codeOpener = '&laquo;';
        var codeCloser = '&raquo;';
    } else {
        var codeOpener = '['+code+']';
        var codeCloser = '[/'+code+']';
    }

    var oldVal = obj[0].value;
    var newVal = '';

    partBefore = oldVal.substr(0, pos.start);
    partInner = oldVal.substr(pos.start, pos.end - pos.start);
    partAfter = oldVal.substr(pos.end);
    partInnerTags = codeOpener + partInner + codeCloser;

    var scrollTop = obj[0].scrollTop;

    newVal = partBefore + partInnerTags + partAfter;

    obj[0].value = newVal;

    // IE
    if (document.selection) {
        var range = obj[0].createTextRange();
        range.collapse(true);
        range.moveStart('character', pos.start - numRowBreak(partBefore));
        range.moveEnd('character', partInnerTags.length);
        range.select();
    } else {
        obj[0].setSelectionRange(pos.start, pos.end + codeOpener.length + codeCloser.length);
    }

    obj[0].scrollTop = scrollTop;
    obj.focus();
}

function numRowBreak(str)
{
    var ret = 0;
    for (var i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) == 0x0A) {
            ret++;
        }
    }
    return ret;
}

function setTag(type, text_obj, add_url, bbcode, marker)
{
    if (typeof(marker) == 'undefined') {
        marker = '';
    }
    var type_arr = type.split("|");
    type = type_arr[0];
    if (type_arr[1]) {
        var img_sizes=type_arr[1].split("x");
        if (img_sizes[0])
            var IMG_W=img_sizes[0];
        if (img_sizes[1])
            var IMG_H=img_sizes[1];
    }
    // bbcode - true  = [B], [I] ..
    //        - false = <b>, <i> ..
    if (!bbcode || bbcode == 'yes') {
        bbcode = true;
    } else {
        bbcode = false;
    }

    var url = '';
    var url_href = '';

    if (add_url) {
        if (type == 'img_upload_original') {
            url_href = add_url;
        } else {
            if (type == 'img_upload') {
                url_href = ' src="'+add_url+'"';
                type = 'IMG';
            } else {
                url = prompt(add_url, 'http://');
                if (url==null || url=='http://')
                    return false;

                if (bbcode) {
                    var url_href = '='+absolute2relativeKPURL(url);
                } else {
                    if (type == 'A') {
                        var url_href = ' class="all" href="'+absolute2relativeKPURL(url)+'"';
                    }
                    if (type == 'IMG') {
                        var url_href = ' src="'+absolute2relativeKPURL(url)+'"';
                    }
                }
            }
        }
    }

    if (text_obj.caretPos) {
        var sel_text = text_obj.caretPos.text;

        if (sel_text=='' && url!='') {
            sel_text=url;
        }

        if (bbcode) {
            var tag_text='['+type+url_href+']' + sel_text + '[/'+type+']';
        } else {
            if (type == 'IMG' || type == 'img_upload' || type == 'img_upload_original') {
                if(type == 'img_upload_original')
                    {
                        var path=url_href.split("/");
                        path[path.length-1]="original_"+path[path.length-1];
                        var origPath="";
                        for(var ll=0;ll<path.length;ll++)
                        {
                            origPath+=path[ll];
                                if(path[ll+1]) origPath+="/";
                        }
                        var tag_text = sel_text + '<a href="'+origPath+'"  target="_blank" data-imgtype="'+marker+'"><IMG style="border:5px solid #f60" src="'+url_href+'" '+(IMG_W?' width="'+IMG_W+'" ':'')+'  '+(IMG_H?' height="'+IMG_H+'" ':'')+'  /></a>';
                    }
                    else    var tag_text = sel_text + '<'+type+url_href+' '+(IMG_W?' width="'+IMG_W+'" ':'')+'  '+(IMG_H?' height="'+IMG_H+'" ':'')+'  />';
            } else {
                var tag_text = '<'+type+url_href+'>' + sel_text + '</'+type+'>';
            }
        }

        text_obj.caretPos.text = text_obj.caretPos.text.charAt(text_obj.caretPos.text.length - 1) == ' ' ? tag_text + ' ' : tag_text;
        text_obj.focus();
    } else if (typeof text_obj.selectionStart !== 'undefined') {
        var start = text_obj.selectionStart,
            end = text_obj.selectionEnd,
            sel_text = text_obj.value.substr(start, end - start) || url,
            scrollTop = text_obj.scrollTop,
            tag_text;

        if (bbcode) {
            tag_text='['+type+url_href+']' + sel_text + '[/'+type+']';
        } else {
            if (type == 'IMG' || type == 'img_upload' || type == 'img_upload_original') {
                if(type == 'img_upload_original') {
                    var path=url_href.split("/");
                    path[path.length-1]="original_"+path[path.length-1];
                    var origPath="";
                    for(var ll=0;ll<path.length;ll++) {
                        origPath+=path[ll];
                        if (path[ll+1]) {
                            origPath += "/";
                        }
                    }
                    tag_text = sel_text +
                                   '<a href="'+origPath+'"  target="_blank" data-imgtype="'+marker+'">' +
                                   '<IMG style="border:5px solid #f60"  src="'+url_href+'" '+(IMG_W?' width="'+IMG_W+'" ':'')+'  '+(IMG_H?' height="'+IMG_H+'" ':'')+'  /></a>';
                }
                else {
                    tag_text = sel_text +
                                   '<'+type+url_href+' '+(IMG_W?' width="'+IMG_W+'" ':'')+'  '+(IMG_H?' height="'+IMG_H+'" ':'')+'  />';
                }
            } else {
                tag_text = '<'+type+url_href+'>' + sel_text + '</'+type+'>';
            }
        }

        text_obj.value = text_obj.value.substr(0, start) + tag_text + text_obj.value.substr(end);
        text_obj.setSelectionRange(end, end);
        text_obj.scrollTop = scrollTop;
    } else if (document.getElementById('storeCaret_point[start]').value > 0) {

        var start = document.getElementById('storeCaret_point[start]').value;
        var end = document.getElementById('storeCaret_point[end]').value;

        if (start == end) {
            start = 0;
        }

        var sel_text = text_obj.value.substr(start, end - start);

        if (sel_text == '' && url != '') {
            sel_text = url;
        }

        if (bbcode) {
            var tag_text='['+type+url_href+']' + sel_text + '[/'+type+']';
        } else {
            if (type == 'IMG' || type == 'img_upload' || type == 'img_upload_original') {
                if(type == 'img_upload_original')
                    {
                        var path=url_href.split("/");
                        path[path.length-1]="original_"+path[path.length-1];
                        var origPath="";
                        for(var ll=0;ll<path.length;ll++)
                        {
                            origPath+=path[ll];
                                if(path[ll+1]) origPath+="/";
                        }
                        var tag_text = sel_text + '<a href="'+origPath+'"  target="_blank" data-imgtype="'+marker+'"><IMG style="border:5px solid #f60"  src="'+url_href+'" '+(IMG_W?' width="'+IMG_W+'" ':'')+'  '+(IMG_H?' height="'+IMG_H+'" ':'')+'  /></a>';
                    }
                    else    var tag_text = sel_text + '<'+type+url_href+' '+(IMG_W?' width="'+IMG_W+'" ':'')+'  '+(IMG_H?' height="'+IMG_H+'" ':'')+'  />';
            } else {
                var tag_text = '<'+type+url_href+'>' + sel_text + '</'+type+'>';
            }
        }

        var scrollTop = text_obj.scrollTop;

        text_obj.value = text_obj.value.substr(0, start) + tag_text + text_obj.value.substr(end);
        text_obj.setSelectionRange(end, end);

        text_obj.scrollTop = scrollTop;
    }
}

function absolute2relativeKPURL(str)
{
    r1 = /http:\/\/(www|s)\.kinopoisk\.[^\/]+\//i;
    r2 = /\/sr\/1\//i;
    str = str.replace(r1, '/');
    str = str.replace(r2, '/');
    return str;
}

function storeCaret(text_obj)
{

    if (text_obj.createTextRange) {
        text_obj.caretPos = document.selection.createRange().duplicate();
    } else if (text_obj.selectionStart) {
        document.getElementById('storeCaret_point[start]').value=text_obj.selectionStart;
        document.getElementById('storeCaret_point[end]').value=text_obj.selectionEnd;
    }
}

function add_user_vote(obj,user_vote)
{
    if (document.getElementById('user_vote_init').value==0 && user_vote!='')
        obj.value=obj.value + "\n\n" + user_vote;

    document.getElementById('user_vote_init').value=1;
}

/**
 * src.: http://www.nigraphic.com/blog/java-script/how-open-new-window-popup-center-screen
 */
function PopupCenter(pageURL, title, w, h)
{
    var left = (screen.width/2)-(w/2);
    var top = (screen.height/2)-(h/2);
    var targetWin = window.open (pageURL, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+w+', height='+h+', top='+top+', left='+left);
}

original_alert=window.alert;
window.alert_mykp = auto_alert_mykp;
window.alert=auto_alert_mykp;

function auto_alert_mykp(){
    if(!DOCUMENT_LOADED) {
        var f=this;
        var a=arguments;
        $(function(){
            auto_alert_mykp.apply(f, a);
        });
        return false;
    }

    if (isIOS() && arguments.length == 1) { // обрезаем теги
        var withStrippedTags = arguments;
        withStrippedTags[0] = $('<div>').html(arguments[0]).text();
        original_alert.apply(this, withStrippedTags);

        return;
    }

    var strippedLength = $('<div>').html(arguments[0]).text().length; //

    if(strippedLength > 200){
        alert_kp.apply(this, arguments);
    } else if((typeof(arguments[1]) == 'boolean' || typeof(arguments[1]) == 'undefined') && arguments.length < 2){
        if(arguments[1]){
            notice_alert.apply(this, arguments);
        } else if(arguments[0].indexOf('<a') > 0){
            notice_alert.apply(this, arguments);
        } else {
            notice.apply(this, arguments);
        }
    } else {
        alert_kp.apply(this, arguments);
    }
}

// постраничный навигатор, кнопка "вверх"
$(function(){
    // self_url, ancher - задаются в шаблонах навигатора
    InitPages();
});

function InitPages(){
    $('.navigator_per_page').change(function(){
        clear_url = self_url;

        // хак для разделов с амперсандом (левел 7, БО и т.п.)
        if (
            self_url.indexOf('?level=7&') != -1 ||
            self_url.indexOf('/action_log/') != -1
        ) {
            regex_search = /perpage=[0-9]+&?/gi;
            clear_url = clear_url.replace(regex_search, '');

            regex_search = /page=[0-9]+&?/gi;
            clear_url = clear_url.replace(regex_search, '');

            window.location = clear_url + '&perpage='+$(this).val()+'&';
        } else {
            regex_search = /perpage\/[0-9]+\/?/gi;
            clear_url = clear_url.replace(regex_search, '');

            regex_search = /page\/[0-9]+\/?/gi;
            clear_url = clear_url.replace(regex_search, '');

            window.location = clear_url + 'perpage/'+$(this).val()+'/' + ancher;
        }
    });
}

/**
 *  Процент жирного текста в строке от её общей полезной длины
 */
function getBoldLengthPercent(str, minLength)
{
    if (isNaN(minLength)) {
        minLength = 30;
    }

    if (str.length < minLength) {
        return 0;
    }

    str = str.replace(/[\r\n\t]/g, ' ');

    // общая длина полезных данных
    noTags_reg = /<[^>]+>|\[\/?[busi]{1}\]/ig;
    noTags_str = str.replace(noTags_reg, '');

    if (!noTags_str.length) {
        return 0;
    }

    // строка без содержимого болдов
    noBold_reg = /\[B\].*?\[\/B\]/ig;
    noBold_str = str.replace(noBold_reg, '');
    noBold_reg = /\[B\].*/ig; // без закрывашки
    noBold_str = noBold_str.replace(noBold_reg, '');

    // полезные данные без болдов
    noBold_noTags_str = noBold_str.replace(noTags_reg, '');

    return 100 - Math.round(noBold_noTags_str.length / noTags_str.length * 100);
}


/**
 *
 */
function updateHideBlockCookie(flag, status)
{
    var hideBlocks = $.cookie('hideBlocks');
    //trace('current hideBlocks='+hideBlocks);
    if (status) {
        var new_value = hideBlocks | flag;
    } else {
        var new_value = hideBlocks & ~flag;
    }

    // unset old value
    $.cookie('hideBlocks', 0, {expires: -1, path: '/'});

    //trace('new_value='+new_value);
    if (hideBlocks != new_value) {
        hideBlocks = new_value;
        if (hideBlocks > 0) {
            //trace('set');
            $.cookie('hideBlocks', hideBlocks, {expires: 365, path: '/', domain: '.kinopoisk.ru'});
        } else {
            //trace('unset');
            $.cookie('hideBlocks', 0, {expires: -1, path: '/', domain: '.kinopoisk.ru'});
        }
    }

    return hideBlocks;
}


(function($){
    var listenEvents = ['focus', 'click', 'dblclick', 'select', 'keydown', 'keypress', 'keyup'];

    var methods = {
        init: function(options){
            return this.each(function(){
                var $this = $(this);
                var data = $this.data('selectableText');

                if (!data) {
                    $this.data('selectableText', {
                        target: this,
                        start: -1,
                        end: -1,
                        IESel: null
                    });

                    methods._bindEvents($this);
                }
            });
        },

        destroy: function(){
            return this.each(function(){
                var $this = $(this);
                var data = $this.data('selectableText');

                $this.removeData('selectableText');

                methods._unbindEvents($this);
            })
        },

        getSelectedText: function(){
            var $this = $(this);
            var data = $this.data('selectableText');
            var target = data.target;
            var start = data.start;
            var end = data.end;
            var IESel = data.IESel;

            $(target).focus();

            return IESel ? IESel.text : (
                (start >= 0 && end > start) ? target.value.substring(start, end) : ''
            );
        },

        getPos: function(){
            var $this = $(this);
            var data = $this.data('selectableText');
            var start = data.start;
            var end = data.end;
            return {start: start, end: end};
        },

        getStart: function(){
            var $this = $(this);
            var data = $this.data('selectableText');
            var start = data.start;
            return start;
        },

        getEnd: function(){
            var $this = $(this);
            var data = $this.data('selectableText');
            var end = data.end;
            return end;
        },

        _storeCaret: function($this){
            var data = $this.data('selectableText');
            var start = -1;
            var end = -1;
            var len = 0;

            // IE
            if (document.selection) {
                data.IESel = document.selection.createRange().duplicate();
                len = data.IESel.text.length;
                start = methods._getCaretPosIE(data.target);
                end = start + len;
            } else if (typeof(data.target.selectionStart) != "undefined") {
                start = data.target.selectionStart;
                end = data.target.selectionEnd;
            }

            data.start = start;
            data.end = end;
        },

        _bindEvents: function($this){
            for (var i = 0; i < listenEvents.length; i++) {
                $this.bind(listenEvents[i], function(){
                    methods._storeCaret($this);
                });
            }
        },

        _unbindEvents: function($this){
            for (var i = 0; i < listenEvents.length; i++) {
                $this.unbind(listenEvents[i]);
            }
        },

        /**
         *  позиция курсора внутри textarea в IE
         */
        _getCaretPosIE: function(obj){
            var objTextRange = document.selection.createRange();
            var clone = objTextRange.duplicate();
            objTextRange.collapse(true);
            try {
                clone.moveToElementText(obj);
            } catch (e) {}
            clone.setEndPoint('StartToEnd', objTextRange);
            return obj.value.length - clone.text.length;
        }
    };

    $.fn.selectableText = function(method){
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Метод '+method+' отсутствует в jQuery.selectableText');
        }
    };
})(jQuery);

/**
 *  Отображает всплывающий посередине окна алерт
 *
 *  $.showModalAlert(options)
 *
 *  options.width - ширина алерта
 *  options.title - заголовок
 *  options.cssURI - ссылка на CSS-файл со стилями.
 *      Лучше добавлять нужные к тому, что по умолчанию - modal_alert.css
 *  options.html - HTML алерта.
 *      То значение, которое стоит по умолчанию (ниже), стоит использовать как шаблон
 **/

(function($) {
    var version = '20130613',
        defaultOptions = {
            width: 305,
            title: '',
            cssURI: "/js/modal_alert.css?v=" + version,
            html: '<!--[if IE]><style type="text/css">\
                    .modalAlert .block {border: 3px #b0b0b0 solid; border-bottom-width: 1px}\
                  <![endif]-->\
                  <div class="modalAlertParent">\
                  <div class="modalAlert">\
                    <div class="content">\
                      <!-- Кнопка "Закрыть" -->\
                      <div><div class="close"></div><div class="title"></div></div>\
                      <div class="text">\
                        <!-- Содержимое алерта -->\
                      </div>\
                      <!-- Кнопка(и) -->\
                      <div class="formButton"><input type="button" value="">\
                      </div>\
                    </div>\
                  </div>\
                </div>'
        };

    function setContainerData(container, settings) {
        container.css({ height: $(window).height(), top: 0, display: 'none' });
        container.find('.content').css({ width: settings.width });
        container.find('.close').click(function() {
            hideAlert(container, settings.closeCallback);
        });

        container.find('.title').text(settings.title);
    }

    function showAlert(container, callback) {
        container.find('.modalAlert').css({ opacity: 0 });
        container.css({ display: 'block' });
        container.find('.modalAlert').animate({ opacity: 1 }, 'fast', 'easeOutQuad', function() { if (typeof callback === 'function') { callback(); } });
    }

    function hideAlert(container, callback) {
        container.find('.modalAlert').animate({ opacity: 0 }, 'fast', 'easeOutQuad', function() {
            container.css({ display: 'none' });
            if (typeof callback === 'function') { callback(); }
        });
    }

    $.showModalAlert = function( options ) {
        var settings = $.extend({}, defaultOptions, options);
        return /*this.each*/(function() {
            var $this = $(this);

            if (!$('link[href="' + settings.cssURI + '"]').length) {
                $('body').append('<link href="' + settings.cssURI + '" type="text/css" rel="stylesheet" media="all">');
            }
            if (!$('.modalAlert').length) {
                $('body').append(settings.html);
            } else {
                $('.modalAlert').html($(settings.html).find('.modalAlert').html());
            }
            var container = $('.modalAlertParent').first();
            setContainerData(container, settings);

            showAlert(container, settings.openCallback);
        } ());
    }
})(jQuery);


/**
 *  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf
 **/

if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
    "use strict";
    if (this == null) {
      throw new TypeError();
    }
    var t = Object(this);
    var len = t.length >>> 0;

    if (len === 0) {
      return -1;
    }
    var n = 0;
    if (arguments.length > 1) {
      n = Number(arguments[1]);
      if (n != n) { // shortcut for verifying if it's NaN
        n = 0;
      } else if (n != 0 && n != Infinity && n != -Infinity) {
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
      }
    }
    if (n >= len) {
      return -1;
    }
    var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
    for (; k < len; k++) {
      if (k in t && t[k] === searchElement) {
        return k;
      }
    }
    return -1;
  }
}


/**
 *  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
 **/

if (!Array.prototype.filter)
{
  Array.prototype.filter = function(fun /*, thisp*/)
  {
    "use strict";

    if (this == null)
      throw new TypeError();

    var t = Object(this);
    var len = t.length >>> 0;
    if (typeof fun != "function")
      throw new TypeError();

    var res = [];
    var thisp = arguments[1];
    for (var i = 0; i < len; i++)
    {
      if (i in t)
      {
        var val = t[i]; // in case fun mutates this
        if (fun.call(thisp, val, i, t))
          res.push(val);
      }
    }

    return res;
  };
}


/**
 *  bind для не поддерживающих JavaScript 1.8.5 браузеров
 *  https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/bind
 **/

if (!Function.prototype.bind) {
  Function.prototype.bind = function (oThis) {
    if (typeof this !== "function") {
      // closest thing possible to the ECMAScript 5 internal IsCallable function
      throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
    }

    var aArgs = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP = function () {},
        fBound = function () {
          return fToBind.apply(this instanceof fNOP && oThis
                                 ? this
                                 : oThis,
                               aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}


(function($){
    if (!$.cookie || ($.cookie('hideBlocks') & 2097152)) {
        return false;
    }

    // iOS может посылать hover перед touch
    var iDevice = ['iPad', 'iPhone', 'iPod'];
    for (var i = 0; i < iDevice.length; i += 1) {
        if (navigator.platform === iDevice[i]) { return false; }
    }

    var deprecatedFilmPopup = false,
        storage = {},
        popupDiv,
        currentURL = '',
        currentItem,
        $window = $(window),
        $lastFilm,
        re = /kinopoisk\.ru\/(name|film|level\/1\/film|level\/4\/people)\/(\d+)\/?(sr\/1\/|sr\/2\/|video\/(\d+\/)?)?$/,
        reWeak = /(name|film|level\/1\/film|level\/4\/people)\/(\d+)\/?/;

    function posterLoaded(currentItem) {
        var anchor = $('a:hover');

        if (currentItem == this.itemID &&
            this.src.substr(currentURL) !== -1 &&
            anchor.length &&
            anchor.prop('href').search(currentItem.replace(/(film|name)/, '')) !== -1
        ) {
            var isRatingHidden = ($.cookie('hideBlocks') & 2) ? true : false;
            popupDiv.find('.rating').toggleClass('hidden', isRatingHidden); // CONST_BLOCK_RATING_USER

            popupDiv.stop().fadeTo(0, 0.01, function () {
                popupDiv.find('.info_title')
                    .toggleClass('concatenated', popupDiv.find('.director').width() > popupDiv.find('.info_title').width());

                var fullWhoisTitle = popupDiv.find('.year_whois').text(), // 'актер'
                    whoisCount = 0,
                    isConcatenated = false;

                while (!isConcatenated && (whoisCount == 0 || fullWhoisTitle.split(', ').length > whoisCount)) {
                    popupDiv.find('.year_whois').text(fullWhoisTitle.split(', ').slice(0, whoisCount + 1).join(', '));

                    isConcatenated = popupDiv.find('.title').width() >
                        popupDiv.find('.info_title').width() -
                        popupDiv.find('.year_whois').outerWidth() -
                        (isRatingHidden ? 0 : parseFloat(popupDiv.find('.rating').css('margin-left') || 0) +
                        popupDiv.find('.rating').outerWidth() + 10);

                    whoisCount += 1;
                }

                if (isConcatenated && whoisCount > 1) {
                    popupDiv.find('.year_whois').text(fullWhoisTitle.split(', ').slice(0, whoisCount - 1).join(', '));
                    isConcatenated = false;
                }

                popupDiv.find('.info_title')
                    .toggleClass('concatenated', isConcatenated);
                popupDiv.find('.title')
                    .css('max-width',
                        popupDiv.find('.info_title').width() -
                        popupDiv.find('.year_whois').outerWidth() -
                        (isRatingHidden ? 0 : parseFloat(popupDiv.find('.rating').css('margin-left') || 0) +
                        popupDiv.find('.rating').outerWidth()));
                var $text = popupDiv.find('.text'),
                    text = $text.html() ? $text.html().split('<span class="comma">, </span>') : '';
                while ($text.height() > $('#popup_info').height() - popupDiv.find('.info_title').outerHeight()) {
                    var oldHtml = $text.html();
                    text = text.slice(0, text.length - 1);
                    $text.html(text.join('<span class="comma">, </span>'));
                    if (oldHtml == $text.html()) {
                        break;
                    }
                }

                anchor = $('a:hover');
                if (anchor.length && anchor.prop('href').search(currentItem.replace(/(film|name)/, '')) !== -1) {
                    popupDiv.stop().fadeTo(50, 1);
                } else {
                    popupDiv.stop().fadeOut(0);
                }
            });
        } else {
            popupDiv.stop().fadeOut(0);
        }
    };

    function popupInfoHandlerDone (data) {
        if (!data || typeof data !== 'object') {
            return false;
        }

        data.type = 'year' in data ? 'film' : 'name';
        if (currentItem != data.type + data.id) {
            return false;
        }

        storage[currentItem] = data;

        try {
            localStorage.setItem('popupInfo', JSON.stringify(storage));
        } catch (e) {}

        var title1 = data.title || data.name,
            title2 = data.year || data.who_is,
            text = data.actors || data.films || '',
            imageURL = 'url(/images/sm_' + ('year' in data ? 'film' : 'actor') + '/' + data.id + '.jpg)';

        if (data.rating) {
            var ratingColor = data.rating < 5 ? 'red' : data.rating >= 7 ? 'green' : '';
        }

        if (data.id && title1) {
            if (data.director) {
                var datadirector = data.director.replace("режиссер:","").replace("режиссеры:","");
            }
            popupDiv.find('.info_title').html(
                (data.rating ? '<span class="rating ' + ratingColor + '">' + data.rating + '</span>' : '') +
                '<span class="title">' + title1 + '<span class="gradient"></span></span>' +
                (title2 ? '<span class="year_whois">' + title2 + '</span>' : '') + '<br/>' + (datadirector ? '<span class="director">' + datadirector + '</span><span class="gradient_director"></span><br />' : '')
            );
            popupDiv.find('.info_text').html(
                (text && text.join ? '<span class="text">' + text.join('<span class="comma">, </span>') + '</span>' : '')
            );

            $('#popup_info').css({
                backgroundImage: data.image ? imageURL : 'url(/images/no-pic.png)',
            });

            var preloadedImage = new Image();
            preloadedImage.itemID = currentItem;
            preloadedImage.onload = posterLoaded.bind(preloadedImage, currentItem);
            currentURL = data.image ? imageURL.replace(/url\((.+)\)/, '$1') : 'http://st.kp.yandex.net/images/no-pic.png';
            preloadedImage.src = currentURL;
        } else {
            popupDiv.stop().hide();
        }
    };

    function deferredHoverOn (event) {
        setTimeout(hoverOn.bind(this, event), 100);
    };

    function hoverOn (event) {
        var type = hrefType(this.href),
            id = hrefID(this.href);

        currentItem = type + id;
        if (typeof currentItem == 'string' &&
            storage[currentItem] &&
            storage[currentItem]['type'] + storage[currentItem]['id'] == currentItem &&
            $.now() / 1000 - storage[currentItem]['time'] < 86400
        ) {
            popupInfoHandlerDone(storage[currentItem]);
        } else {
            $.get('/handler_popup_info.php', {
                type: type,
                id: id,
                rnd: Math.random(),
            }).done(popupInfoHandlerDone).fail(function () {
                popupDiv.stop().hide();
            });
        }
    };

    function hoverOff (event, realOff) {
        if (!popupDiv.mouseIn) {
            if (realOff) {
                popupDiv.stop().fadeOut(50);
            } else {
                setTimeout(hoverOff.bind(this, event, true), 30);
            }
        } else {
            setTimeout(hoverOff.bind(this, event), 100);
        }
    };

    function hrefType(href, weak) {
        var exp = weak ? reWeak : re;
        if (href && exp.test(href)) {
            return exp.exec(href)[1].replace('level/1/film', 'film').replace('level/4/people', 'name');
        } else {
            return null;
        }
    }

    function hrefID(href, weak) {
        var exp = weak ? reWeak : re;
        if (exp.test(href)) {
            return exp.exec(href)[2];
        } else {
            return null;
        }
    }

    function attachPopup(mutationEvent) {
        try {

            var $this = $(this),
                dataPopup = $this.attr('data-popup');
            if (dataPopup && dataPopup.match(/(en|dis)abled/)) {
                $this.attr('data-popup-info', dataPopup);
                $this.attr('data-popup', null);

                if (dataPopup == 'enabled') {
                    $this.hover(deferredHoverOn.bind(this)/*hoverOn.bind(this)*/, hoverOff);
                }
                return;
            }

            var href = $this.prop('href'),
                children = $this.children(),
                type = hrefType(href),
                isInRightBlock = $this.parent().hasClass('dl'),
                $autocomplete = $('.main-search-autocomplete');

            if (type && (
                    !children.length ||
                    children.first().is('br') || // оскар-тотализатор
                    (type == 'film' && children.length == 1 && children.first().is('span')) || // заголовок рецензии
                    (type == 'name' && children.length == 1 && children.first().is('b')) || // Мои звезды
                    $this.parent().is('dd') || // dvd/bluray на главной
                    $('.await_and_fav').find(this) // любимые/ожидаемые в профиле
                ) && !(
                    type == 'film' &&
                    deprecatedFilmPopup &&
                    !$lastFilm.find(this).length &&
                    !isInRightBlock && // правый блок
                    !$autocomplete.find(this).length // быстрый поиск
                ) &&
                (!hrefID(location.href, true) || hrefID(location.href, true) != hrefID(href))
            ) {
                $this.attr('data-popup-info', 'enabled');
                $this.hover(deferredHoverOn.bind(this)/*hoverOn.bind(this)*/, hoverOff);
            } else {
                $this.attr('data-popup-info', 'disabled');
            }
        } catch (e) {}
    }

    $(function(){
        try {
            var loginText = $('.login').find('a').first().text();
            if (loginText && (loginText.search('Войти') !== -1)) {
                return false;
            }
        } catch (e) {
            return false;
        }

        try {
            storage = JSON.parse(localStorage.getItem('popupInfo')) || {};
        } catch (e) {
            storage = {};
        }

        setTimeout(function () {
            for (var id in storage) {
                if ($.now() / 1000 - storage[id]['time'] > 86400) {
                    delete storage[id];
                }
            }
            try {
                localStorage.setItem('popupInfo', JSON.stringify(storage));
            } catch (e) {}
        }, 1000);

        if ((/\/(chance|premiere|comingsoon(?!\/dvd)|navigator|top\/lists|recommend|level\/78\/movies|level\/10|film\/\d+\/like|user\/\d+\/(movies\/(try|fav|list)|await|list))/.test(location.pathname) ||
            (/(kp_query\=|find\/)/.test(location.href) && $.cookie('result_type') != 'simple')) && !(
            (/\/level\/78\/movies/.test(location.pathname) && (/\/format\/mini/.test(location.pathname) || $.cookie('mustseeFormat') == 'mini'))
            )
        ) { deprecatedFilmPopup = true; }

        $lastFilm = $('#last_film');
        popupDiv = $('<div id="popup_info_wrapper"><div id="popup_info"><p class="info_title"></p><p class="info_text"></p></div></div>');
        var upButtonIntervalRetries = 0;
            upButtonInterval = setInterval(function () {
            if (($('#GoUpClickZone p').length && $('#GoUpClickZone p').css('background-color')) ||
                upButtonIntervalRetries > 5
            ) {
                clearInterval(upButtonInterval);
                popupDiv.find('#popup_info')
                    .css('border-top', '3px solid ' + ($('#GoUpClickZone p').length ?
                        $('#GoUpClickZone p').css('background-color').replace(/rgba\((.+),\ ?[\d\.]+\)/, 'rgb($1)') : '#f60'));
            } else {
                upButtonIntervalRetries += 1;
            }
        }, 500);
        popupDiv.appendTo('body')
            .on('mouseenter', function () {
                popupDiv.mouseIn = true;
                var data = storage[currentItem],
                    href = '/' + data.type + '/' + data.id + '/';
                popupDiv.find('.title').wrap('<a data-popup="disabled" href="' + href + '"></a>');
            })
            .on('mouseleave', function () {
                popupDiv.mouseIn = false;
                popupDiv.find('.title').unwrap('<a></a>');
            });

        var urls = [
                'http://st.kp.yandex.net/images/popup_background.png',
                'http://st.kp.yandex.net/images/popup_title_gradient.png',
                'http://st.kp.yandex.net/images/popup_director_gradient.png'
            ],
            images = [];
        for (var i = 0; i < urls.length; i += 1) {
            images[i] = new Image();
            images[i].src = urls[i];
        }

        $('a').each(attachPopup);
        var updateAttaches = function () {
            $('a:not([data-popup-info])').each(attachPopup);
            $('[data-popup]').each(attachPopup);
        }

        setInterval(updateAttaches, 1000);
    });
})(jQuery);


/**
 *  "Доскроллили!"
 * плагин слежения за скроллом. вызывает функцию обратного вызова для всех элементов, до которых доскроллили
 */
(function($){
    var $window = $(window);
    var listenerBinded = false;
    var objects = [];
    var addTimer;

    var listener = function(){
        var wTop = $window.scrollTop() + $window.height();
        for (var k = 0, object, oTop, callback, data; k < objects.length; k++) {
            object = objects[k];
            oTop = object.offset().top;
            if (wTop >= oTop) {
                data = object.data('scrollReached');
                callback = data.callback;
                if (data.one) {
                    object.scrollReached('destroy');
                }
                callback.call(object.get(0));
            }
        }
    };

    var methods = {
        init: function(options, callback){
            if (!callback && typeof options === 'function') {
                callback = options;
                options = {};
            }

            return this.each(function(){
                var $this = $(this);
                var data = $this.data('scrollReached');

                if (!data) {
                    $this.data('scrollReached', {
                        target: this,
                        one: !!options.one,
                        callback: callback
                    });
                }

                if (!listenerBinded) {
                    listenerBinded = true;
                    methods._listenerBind();
                }

                objects[objects.length] = $this;

                if (addTimer) {
                    clearTimeout(addTimer);
                }
                addTimer = setTimeout(listener, 100);
            });
        },

        destroy: function(){
            return this.each(function(){
                var $this = $(this);
                var data = $this.data('scrollReached');

                $this.removeData('scrollReached');

                var newObjects = [];
                for (var k = 0, object; k < objects.length; k++) {
                    object = objects[k];
                    if (!object.is($this)) {
                        newObjects[newObjects.length] = object;
                    }
                }
                objects = newObjects;

                if (!objects.length) {
                    methods._listenerUnbind();
                    listenerBinded = false;
                }
            });
        },

        _listenerBind: function(){
            $window.bind('scroll', listener);
            $window.bind('resize', listener);
        },

        _listenerUnbind: function(){
            $window.unbind('scroll', listener);
            $window.unbind('resize', listener);
        }
    };

    $.fn.scrollReached = function(method){
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof method === 'object' || typeof method === 'function' || !method) {
            return methods.init.apply(this, arguments);
        } else {
            $.error('Метод '+method+' отсутствует в jQuery.scrollReached');
        }
    };

})(jQuery);

$(function() {
    $('.profileInsertsMenu .act_gray, .profileInsertsMenu .act_white').not('.menuButton9').css('border', 'none').next().css('border-left', '1px solid #c6c6c6');
});

( function( $, window, undefined ) {
/*    Array.prototype.diff = function(a, f) {
        return this.filter(function(i) {
            return typeof f !== 'function' ? !(a.indexOf(i) > -1) :
                !(f(i, a) > -1);
        });
    };
*/
    function getHiddenProp () {
        var prefixes = ['webkit','moz','ms','o'];
        if ('hidden' in document) return 'hidden';
        for (var i = 0; i < prefixes.length; i++){
            if ((prefixes[i] + 'Hidden') in document)
                return prefixes[i] + 'Hidden';
        }
        return null;
    }
    function isHidden() {
        var prop = getHiddenProp();
        if (!prop) return false;
        return document[prop];
    }
    function isEmpty( obj ) {
        return Object.keys(obj).length === 0;
    }
    $.GridRotator = function( options, element ) {
        this.$el = $(element);
        var self = this;
        this._init( options );
    };
    $.GridRotator.defaults = {
        animSpeed : 800,
        animEasingOut : 'linear',
        animEasingIn: 'linear',
        interval : 3000,
        slideshow : true,
        onhover : false,
        nochange : [],
        imageData: [],
        showTotal: 19,
        step: 5
    };
    $.GridRotator.prototype = {
        _init : function( options ) {
            this.options = $.extend( true, {}, $.GridRotator.defaults, options );
            this._config();
        },
        _config : function() {
            var self = this,
                transEndEventNames = {
                    'WebkitTransition' : 'webkitTransitionEnd',
                    'MozTransition' : 'transitionend',
                    'OTransition' : 'oTransitionEnd',
                    'msTransition' : 'MSTransitionEnd',
                    'transition' : 'transitionend'
                };
            this.supportTransitions = Modernizr.csstransitions;
            this.supportTransforms3D = Modernizr.csstransforms3d;
            this.transEndEventName = transEndEventNames[ Modernizr.prefixed( 'transition' ) ] + '.gridrotator';
            this.animTypes = [ 'fadeInOut' ];
            this.animType = this.options.animType;
            this.imageData = this.options.imageData;
            if( this.animType !== 'random' && !this.supportTransforms3D && $.inArray( this.animType, this.animTypes ) === -1 && this.animType !== 'showHide' ) {
                this.animType = 'fadeInOut';
            }
            this.animTypesTotal    = this.animTypes.length;
            this.showTotal = this.options.showTotal;

            var idsFilm = [];
            this.canChooseSameFilm =
                this.imageData.filter(function (item) {
                    if (idsFilm.indexOf(item.id_film) === -1) {
                        idsFilm.push(item.id_film);
                        return true;
                    } else {
                        return false;
                    }
                }).length < this.showTotal;

            this.$list = this.$el.children( 'ul' );

            this.$itemsCache = '';
            for (var i = 0, _l = this.imageData.length; i < _l; i += 1) {
                var data = this.imageData[i];

                this.$itemsCache += '<li><a data-id-film="' + data.id_film + '" href="' +
                    data.url + '" data-popup="disabled"><img class="resizew" data-src="' +
                    data.image + '" alt="' + data.rus + '" /><p><span><span class="rusName">' +
                    data.rus + '</span><i>' +
                    (!data.russian_film ? data.name + (data.year ? ', ' + data.year : '') : data.year) +
                    '</i></span></p></a></li>';
            }

            this.$itemsCache = $(this.$itemsCache);
            this.itemsTotal = this.$itemsCache.length;
            this.outItems= [];
            this._layout( function() {
                self._initEvents();
            } );
            this._start();

        },
        _layout : function( callback ) {
            var self = this;
            // reset
            this.$list.empty();
            this.$items = this.$itemsCache.slice(0, this.showTotal);//.appendTo( this.$list );
            var $outItems = this.$itemsCache.slice(this.showTotal),
                $outAItems = $outItems.children( 'a' );
            this.outItems.length = 0;
            $outAItems.each( function( i ) {
                self.outItems.push( $( this ) );
            } );
            $outItems.remove();

            var loaded = 0;
            this.$items.each(function () {
                var $img = $(this).find('img');
                $img.load(function () {
                    loaded += 1;
                    if (loaded === self.$items.length) {
                        self.$items.appendTo(self.$list);

                        if (typeof callback === 'function') {
                            callback.call();
                        }
                    }
                }).prop('src', 'http://st.kp.yandex.net' + $img.data('src'));
            });

/*            $('<div id="fav_log">' +
                '<p>Всего фильмов: <span class="films"></span></p>' +
                '<p>Всего кадров: <span class="stills"></span></p>' +
                '<p>Сейчас показано фильмов: <span class="films-now"></span></p>' +
                '<p>Ни разу не показано фильмов: <span class="unused-films"></span></p>' +
                '<p>Ни разу не показано кадров: <span class="unused-stills"></span></p>' +
                '</div>'
            ).css({
                position: 'fixed',
                left: 20,
                top: 20,
                padding: 10,
                backgroundColor: 'rgba(255,255,255,0.7)',

            }).appendTo('body');
*/        },
        _initEvents : function() {
            var self = this;
            var visProp = getHiddenProp();
            if (visProp) {
                var evtname = visProp.replace(/[H|h]idden/,'') + 'visibilitychange';
                document.addEventListener(evtname, function() { self._visChange(); } );
            }
        },
        _visChange : function() {
            isHidden() ? clearTimeout( this.playtimeout ) : this._start();
        },
        _start : function() {

            this.$list.fadeIn(300, this.$el.css.bind(this, 'background-color', '#ffffff'));
            this.$items.each(function (index) {
                var id = index + 1,
                    idphoto = 'photo__' + id;
                $(this).prop('id', idphoto);
                $(this).find('img').addClass('resizew');
            });

            if( this.showTotal < this.itemsTotal && this.options.slideshow ) {

                // this.allFilms = this._filmsInStills(this.imageData);
                // this.allStills = this.imageData;
                // this.unusedStills = this._stills(this.outItems).diff(this._stills(this.$items.find('a:last')), this._indexOfStill);
                // this.unusedFilms = this._filmsInStills(this.imageData).diff(this._filmsInStills(this.$items.find('a:last')));

                this._showNext();
            }
        },
/*        _stills: function ($objects) {
            return $objects.map(function (index, item) {
                if (typeof index !== 'number') {
                    item = index;
                }
                return {
                    id_film: $(item).data('idFilm'),
                    src: $(item).find('img').data('src')
                };
            });
        },
        _indexOfStill: function (item, stills) {
            for (var i = 0; i < stills.length; i += 1) {
                if (item.src === stills[i].src) {
                    return i;
                }
            }
            return -1;
        },
        _filmsInStills: function (stills) {
            var result = [];
            for (var i = 0; i < stills.length; i += 1) {
                var id_film = Number(stills[i].id_film || $(stills[i]).data('idFilm'));
                if (result.indexOf(id_film) === -1) {
                    result.push(id_film);
                }
            }
            return result;
        },
*/        _getAnimProperties : function( $out ) {
            var startInProp = {}, startOutProp = {}, endInProp = {}, endOutProp = {},
                animType = this.animType, speed, delay = 0;
            switch( animType ) {
                case 'fadeInOut' :
                    endOutProp.opacity = 0;
                    break;
            }
            return {
                startInProp : startInProp,
                startOutProp : startOutProp,
                endInProp : endInProp,
                endOutProp : endOutProp,
                delay : delay,
                animSpeed : speed != undefined ? speed : this.options.animSpeed
            };

        },
        _showNext : function(time) {
            var self = this;
            clearTimeout( this.playtimeout );
            this.playtimeout = setTimeout( function() {
                var tr = 0, fs = 0;
                self.$items.each(function () {
                    if ($(this).data('active')) {
                        tr += 1;
                    } else {
                        fs += 1;
                    }
                });

                var nmbOut    = self.options.step,
                    randArr    = self._getRandom(nmbOut),
                    excludedFilms = null;

/*                self.unusedStills = self.unusedStills.diff(self._stills(self.$items.find('a:last')), self._indexOfStill);
                self.unusedFilms = self.unusedFilms.diff(self._filmsInStills(self.$items.find('a:last')));

                $('#fav_log .films').text(self.allFilms.length);
                $('#fav_log .stills').text(self.imageData.length);
                $('#fav_log .films-now').text(self._filmsInStills(self.$items.find('a:last')).length);
                $('#fav_log .unused-films').text(self.unusedFilms.length);
                $('#fav_log .unused-stills').text(self.unusedStills.length);
*/
                if (!self.canChooseSameFilm) {
                    excludedFilms = randArr[1];
                    randArr = randArr[0];
                }

                for( var i = 0; i < nmbOut; ++i ) {
                    var $out = self.$items.eq( randArr[ i ] );
                    if( $out.data( 'active' ) || $out.data( 'nochange' ) ) {
                        self._showNext();
                        return false;
                    }
                    var newExcluededId = self._replace($out, excludedFilms);
                    if (excludedFilms) {
                        excludedFilms.push(newExcluededId);
                    }
                }
                self._showNext();
            }, time || Math.max( Math.abs( this.options.interval ) , 300 ) );

        },
        _replace: function ($out, excludedFilms) {
            var self = this,
                $outA = $out.children( 'a:last' ),
                newElProp = {
                    width : $outA.width(),
                    height : $outA.height()
                };

            var $inA = null;
            if (!excludedFilms) {
                $inA = this.outItems.shift();
            } else {
                var index = 0;
                while (index < this.outItems.length - 1 &&
                    excludedFilms.indexOf(this.outItems[index].data('idFilm')) !== -1
                ) {
                    index += 1;
                }

                $inA = this.outItems.splice(index, 1)[0];
            }
            this.outItems.push($outA.clone().data('active', false).css('transition', 'none'));

            $out.data( 'active', true );
            var afterLoad = function () {
                $inA.css( newElProp ).prependTo( $out );
                var animProp = this._getAnimProperties( $outA );
                $inA.css( animProp.startInProp );
                $outA.css( animProp.startOutProp );
                $outA.css({'position': 'absolute', 'top': '0px'});
                this._setTransition( $inA, 'all', animProp.animSpeed, animProp.delay, this.options.animEasingIn );
                this._setTransition( $outA, 'all', animProp.animSpeed, 0, this.options.animEasingOut );
                this._applyTransition( $inA, animProp.endInProp, animProp.animSpeed, function() {
                    var $el = $( this ),
                        t = animProp.animSpeed === self.options.animSpeed && isEmpty( animProp.endInProp ) ? animProp.animSpeed : 0;
                    setTimeout( function() {
                        if( self.supportTransitions ) {
                            $el.off( self.transEndEventName );
                        }
                        $el.next().remove();
                        $el.parent().data( 'active', false );
                        $out.data('active', false);

                    }, t );
                }, animProp.animSpeed === 0 || isEmpty( animProp.endInProp ) );
                this._applyTransition( $outA, animProp.endOutProp, animProp.animSpeed );
            }

            var $img = $inA.find('img');
            if (!$img.prop('src')) {
                $img.load(afterLoad.bind(this)).prop('src', 'http://st.kp.yandex.net' + $img.data('src'));
            } else {
                afterLoad.call(this);
            }

            return $inA.data('idFilm');
        },
        _getRandom : function (count) {
            var i = 0,
                curItems = [],
                itemsToRemove = [];

            curItems = $.map(this.$items, function (item, index) {
                var $this = $(item);
                var result = ($this.data('active') || $this.data('nochange')) ? null : {
                    index: index,
                    id_film: $this.find('a').last().data('idFilm')
                }
                return result;
            });

            count = Math.min(count, curItems.length);
            for (var i = 0; i < count; i += 1) {
                var t = curItems.splice(Math.floor(Math.random() * curItems.length), 1)[0];
                itemsToRemove.push(t);
            }

            var result = itemsToRemove.map(function (item) {
                return item.index;
            });

            if (!this.canChooseSameFilm) {
                result = [result, curItems.map(function (item) { return item.id_film })];
            }
            return result;
        },
        _setTransition : function( el, prop, speed, delay, easing ) {
            setTimeout( function() {
                el.css( 'transition', prop + ' ' + speed + 'ms ' + delay + 'ms ' + easing );
            }, 25 );
        },
        _applyTransition : function( el, styleCSS, speed, fncomplete, force ) {
            var self = this;
            setTimeout( function() {
                $.fn.applyStyle = self.supportTransitions ? $.fn.css : $.fn.animate;
                if( fncomplete && self.supportTransitions ) {
                    el.on( self.transEndEventName, fncomplete );
                    if( force ) {
                        fncomplete.call( el );
                    }
                }
                fncomplete = fncomplete || function() { return false; };
                el.stop().applyStyle( styleCSS, $.extend( true, [], { duration : speed + 'ms', complete : fncomplete } ) );
            }, 25 );
        }
    };
    $.fn.gridrotator = function( options ) {
        var instance = $.data( this, 'gridrotator' );
            this.each(function() {
                if ( instance ) {
                    instance._init();
                }
                else {
                    instance = $.data( this, 'gridrotator', new $.GridRotator( options, this ) );
                }
            });
        return instance;
    };
} )( jQuery, window );

VKmax = 165;
function VKCheck(text)
{
    text = text.replace("'", "");
    if (VKmax > 0 && text.length >= VKmax) {
        text = text.substr(0, VKmax - 3)+'...';
        VKmax = VKmax - text.lenght;
        return text;
    }
    if (VKmax <= 0) {
        return false;
    }
    return text;
}

// Заменяем функцию escape(), чтобы она умела кодить русские символы
var trans = [];
for (var i = 0x410; i <= 0x44F; i++) {
    trans[i] = i - 0x350; // А-Яа-я
}
trans[0x401] = 0xA8;    // Ё
trans[0x451] = 0xB8;    // ё
var escapeOrig = window.escape;
window.escapeRu = function(str){
  var ret = [];
  for (var i = 0; i < str.length; i++) {
    var n = str.charCodeAt(i);
    if (typeof trans[n] != "undefined") n = trans[n];
    if (n <= 0xFF) ret.push(n);
  }
  return escapeOrig(String.fromCharCode.apply(null, ret));
}


function createRequest()
{
    var msxmlhttp = new Array(
        'Msxml2.XMLHTTP.5.0',
        'Msxml2.XMLHTTP.4.0',
        'Msxml2.XMLHTTP.3.0',
        'Msxml2.XMLHTTP',
        'Microsoft.XMLHTTP');
    for (var i = 0; i < msxmlhttp.length; i++) {
        try {
            A = new ActiveXObject(msxmlhttp[i]);
        } catch (e) {
            A = null;
        }
    }

    if(!A && typeof XMLHttpRequest != "undefined")
        A = new XMLHttpRequest();

    return A;
}

var DelayArray = new Array();
var mouse_on_menu = -1;

function buildTreeFromArray(array) {
    return array.reduceRight(function (memo, item) {
        var nested = {};
        nested[item] = memo;
        return nested;
    }, array.pop());
}

function getTopLevelMetrikaParams(target) {
    var mainPageLocations = [
        '/',
        '/index.html',
        '/index.php',
        '/index.phtml'
    ];

    var res = null;

    if (!location.search && mainPageLocations.indexOf(location.pathname) !== -1) {
        res = ['blocks_main_click', 'header'];
    } else if (/^\/film\/\d+\/$/.test(location.pathname)) {
        res = ['blocks_film_click', 'header'];
    }

    if (res && target) {
        res.push(target);
    }

    return res;
}

function sendHeaderMenuStat($menuItem) {
    var menuItemParam = $menuItem.data('metrika');
    if (!menuItemParam) {
        return;
    }

    var params = getTopLevelMetrikaParams('main_menu');
    if (!params) {
        return;
    }

    params = params.concat(menuItemParam);
    Metrika.params(buildTreeFromArray(params));
}

function sendHeaderSubMenuStat($menuItem) {
    var menuItemParam = $menuItem.data('metrika');
    if (!menuItemParam) {
        return;
    }

    var params = getTopLevelMetrikaParams('main_menu');
    if (!params) {
        return;
    }

    var parentsParams = [];
    $menuItem.parents('[data-metrika]').each(function () {
        parentsParams.push($(this).data('metrika'));
    });
    parentsParams.reverse();

    params = params.concat(parentsParams, menuItemParam);
    Metrika.params(buildTreeFromArray(params), true);
}

function sendSearchButtonStat(param) {
    var params = getTopLevelMetrikaParams();

    if (!params) {
        return;
    }

    params.push(param);
    Metrika.params(buildTreeFromArray(params), true);
}

function sendHeaderActionsStat($action) {
    var actionParam = $action.data('metrika');
    if (!actionParam) {
        return;
    }

    var params = getTopLevelMetrikaParams();

    if (!params) {
        return;
    }

    var topLevelActions = [
        'chance',
        'advanced_search',
        'top',
        'search',
        'direct_search',
        'logo'
    ];

    if (actionParam === 'logo' && params[0] !== 'blocks_film_click') {
        return;
    }

    var parentsParams = [];

    if (topLevelActions.indexOf(actionParam) === -1) {
        $action.parents('[data-metrika]').each(function () {
            parentsParams.push($(this).data('metrika'));
        });
    }

    parentsParams.reverse();

    params = params.concat(parentsParams, actionParam);

    var sendOnNextPage = actionParam !== 'chance';

    Metrika.params(buildTreeFromArray(params), sendOnNextPage);
}

$(function(){
    $allLi = $('ul.menu > li');
    $allLi.mouseover(function(){
        $(this).addClass('show_arrow');
        mouse_on_menu = $(this).attr('id');
    }).mouseout(function(){
        $(this).removeClass('show_arrow');
        mouse_on_menu = -1;
    }).click(function(){
        // close/clear old
        $allLi.removeClass('show_arrow').removeClass('act');
        for (id in DelayArray) {
            clearInterval(DelayArray[id]);
        }

        var $this = $(this);

        sendHeaderMenuStat($this);

        // open new
        $this.addClass('act');
        mouse_on_menu = $this.attr('id');
        DelayArray[$this.attr('id')] = setInterval(function(){
            for (id in DelayArray) {
                if (mouse_on_menu == -1 || id != mouse_on_menu) {
                    $('#'+id).removeClass('act').removeClass('show_arrow');
                    clearInterval(DelayArray[id]);
                }
            }
        }, 100);
    })
    .find('a')
        .click(function (evt) {
            sendHeaderSubMenuStat($(this));
            evt.stopPropagation();
        });

    $([
        '#top_form a[data-metrika]',
        '#top_form button[data-metrika]',
        '#top_form img[data-metrika]'
    ].join()).click(function () {
        sendHeaderActionsStat($(this));
    });
});

function overspan(el) {el.className="act"}
function outspan(el)  {el.className=""}
function overlast(el) {el.className="lastact"}
function outlast(el)  {el.className="last"}

function mainMenu(type)
{
    var m = ''+
    '<ul class="menu">'+
       '<li data-metrika="afisha_tv" id="li1'+type+'">'+
          '<i class="ar ar_1"></i><i class="ar ar_2"></i><i class="ar ar_3"></i><i class="ar ar_4"></i>'+
          '<p>афиша &amp; тв</p>'+
          '<div>'+
             '<a data-metrika="afisha_now" href="/afisha/new/"><s></s>сегодня в кино</a>'+
             (typeof(need_buy_button) !='undefined' && need_buy_button ? '<a data-metrika="bilet" href="/bilet/"><s></s>билеты в кино</a>' : '')+
             '<a data-metrika="premiere" href="/premiere/"><s></s>график премьер</a>'+
             '<a data-metrika="tv" href="/tv/"><s></s>фильмы на ТВ</a>'+
             '<a data-metrika="events" href="/events/"><s></s>кинособытия</a>'+
             '<a data-metrika="cinemas" href="/cinemas/"><s></s>все кинотеатры</a>'+
             '<a data-metrika="map" class="last" href="/map/"><s></s>карта города</a>'+
          '</div>'+
       '</li>'+
       '<li data-metrika="texts" id="li2'+type+'">'+
          '<i class="ar ar_1"></i><i class="ar ar_2"></i><i class="ar ar_3"></i><i class="ar ar_4"></i>'+
          '<p>тексты</p>'+
          '<div>'+
             '<a data-metrika="news" href="/news/"><s></s>новости кино</a>'+
             '<a data-metrika="blogs" href="/blogs/"><s></s>редакционные блоги</a>'+
             '<a data-metrika="reviews" href="/reviews/"><s></s>рецензии пользователей</a>'+
             '<a data-metrika="photostory" href="/photostory/"><s></s>репортажи</a>'+
             '<span data-metrika="interview_article" onmouseover="overspan(this)" onmouseout="outspan(this)"><s></s>'+
                '<a data-metrika="interview" href="/interview/">интервью</a> &amp; <a data-metrika="interview_article" href="/article/">статьи</a>'+
             '</span>'+
             '<a data-metrika="review3500" class="last" href="/review/3500/"><s></s>3500 кинорецензий</a>'+
          '</div>'+
       '</li>'+
       '<li data-metrika="media" id="li3'+type+'">'+
          '<i class="ar ar_1"></i><i class="ar ar_2"></i><i class="ar ar_3"></i><i class="ar ar_4"></i>'+
          '<p>медиа</p>'+
          '<div>'+
             '<a data-metrika="photos" href="/photos/"><s></s>фотографии</a>'+
             '<a data-metrika="wall" href="/wall/"><s></s>обои для рабочего стола</a>'+
             '<span data-metrika="posters_flyers" onmouseover="overspan(this)" onmouseout="outspan(this)"><s></s>'+
                '<a data-metrika="posters" href="/posters/">постеры</a> &amp; <a data-metrika="flyers" href="/flyers/">флаеры</a>'+
             '</span>'+
             '<a data-metrika="video" href="/video/"><s></s>трейлеры</a>'+
             '<a data-metrika="podcast" href="/podcast/"><s></s>подкасты</a>'+
             '<a data-metrika="tracks" class="last" href="/tracks/"><s></s>саундтреки</a>'+
          '</div>'+
       '</li>'+
       '<li data-metrika="communication" id="li4'+type+'">'+
          '<i class="ar ar_1"></i><i class="ar ar_2"></i><i class="ar ar_3"></i><i class="ar ar_4"></i>'+
          '<p>общение</p>'+
          '<div>'+
             '<a data-metrika="reviews" href="/reviews/"><s></s>рецензии пользователей</a>'+
             '<a data-metrika="social" href="/social/"><s></s>звёзды в соцсетях</a>'+
             '<a data-metrika="forum" href="http://forum.kinopoisk.ru/"><s></s>форум на КиноПоиске</a>'+
             '<a data-metrika="polls" href="/polls/"><s></s>опросы</a>'+
             '<a data-metrika="feedback" class="last" href="/feedback/"><s></s>обратная связь</a>'+
          '</div>'+
       '</li>'+
       '<li data-metrika="ratings" id="li5'+type+'">'+
          '<i class="ar ar_1"></i><i class="ar ar_2"></i><i class="ar ar_3"></i><i class="ar ar_4"></i>'+
          '<p>рейтинги</p>'+
          '<div>'+
             '<a data-metrika="votes" href="/votes/"><s></s>оценки пользователей</a>'+
             '<span data-metrika="Top250_comingsoon" onmouseover="overspan(this)" onmouseout="outspan(this)"><s></s>'+
                '<a data-metrika="Top250" href="/top/">Top250</a>, <a data-metrika="comingsoon" href="/comingsoon/">самые ожидаемые</a>'+
             '</span>'+
             '<span data-metrika="popular_films_names" onmouseover="overspan(this)" onmouseout="outspan(this)"><s></s>'+
                '<a data-metrika="popular_films" href="/popular/">популярные фильмы</a> и <a data-metrika="names" href="/popular/names/">имена</a>'+
             '</span>'+
             '<span data-metrika="navigator_lists" onmouseover="overspan(this)" onmouseout="outspan(this)"><s></s>'+
                '<a data-metrika="navigator" href="/top/navigator/">поиск лучших</a> и <a data-metrika="lists" href="/top/lists/">списки</a>'+
             '</span>'+
             '<a data-metrika="recommend" href="/recommend/"><s></s>персональные рекомендации</a>'+
             '<span data-metrika="awards_fame" onmouseover="overspan(this)" onmouseout="outspan(this)"><s></s>'+
                '<a data-metrika="awards" href="/awards/">кинонаграды</a> и <a data-metrika="fame" href="/fame/">аллея славы</a>'+
             '</span>'+
             '<span data-metrika="box_rus_usa_world" onmouseover="overspan(this)" onmouseout="outspan(this)"><s></s>'+
                '<a data-metrika="box_rus" href="/box/">сборы в России</a>, <a data-metrika="box_usa" href="/box/usa/">в США</a>, <a data-metrika="box_world" href="/box/world/">в мире</a>'+
             '</span>'+
             '<a class="last" data-metrika="box_best" href="/box/best_usa/"><s></s>кассовые рекорды</a>'+
          '</div>'+
       '</li>'+
       '<li data-metrika="dvd_bluray" id="li6'+type+'">'+
          '<i class="ar ar_1"></i><i class="ar ar_2"></i><i class="ar ar_3"></i><i class="ar ar_4"></i>'+
          '<p>DVD &amp; Blu-Ray</p>'+
          '<div>'+
             '<span data-metrika="dvd_bluray" onmouseover="overspan(this)" onmouseout="outspan(this)"><s></s>'+
                '<a data-metrika="dvd" href="/dvd/">DVD-диски</a>, <a data-metrika="bluray" href="/bluray/">Blu-Ray</a>'+
             '</span>'+
             '<span data-metrika="soon_dvd_bluray" onmouseover="overspan(this)" onmouseout="outspan(this)"><s></s>'+
                '<a data-metrika="soon_dvd" href="/comingsoon/dvd/">скоро на DVD</a>, <a data-metrika="soon_bluray" href="/comingsoon/bluray/">на Blu-Ray</a>'+
             '</span>'+
             '<a data-metrika="top_dvd" href="/top/dvd/"><s></s>рейтинги DVD</a>'+
             '<a data-metrika="top_usa_dvd" href="/box/usa/dvd/"><s></s>продажи DVD в США</a>'+
             '<span data-metrika="books_games_tracks" class="last" onmouseover="overlast(this)" onmouseout="outlast(this)"><s></s>'+
                '<a data-metrika="books" href="/books/">книги</a>, <a data-metrika="games" href="/gameshop/">игры</a>, <a data-metrika="tracks" href="/tracks/buy/">саундтреки</a>'+
             '</span>'+
          '</div>'+
          '</li>'+
       '<li data-metrika="play" id="li7'+type+'">'+
          '<i class="ar ar_1"></i><i class="ar ar_2"></i><i class="ar ar_3"></i><i class="ar ar_4"></i>'+
          '<p>играть!</p>'+
          '<div class="last">'+
             '<a data-metrika="quiz" href="/quiz/"><s></s>розыгрыши призов</a>'+
             '<a data-metrika="chance" href="/chance/"><s></s>случайный фильм</a>'+
             '<a data-metrika="oscargame" class="act" href="/oscargame/"><s></s>угадай победителей Оскара!</a>'+
             '<a data-metrika="goldenglobegame" class="unact last" href="/goldenglobegame/"><s></s>... и Золотого глобуса!</a>'+
             //'<a data-metrika="oscartote" class="unact last" href="/oscartote/"><s></s>Оскар-тотализатор</a>'+
          '</div>'+
       '</li>'+
    '</ul>';
    document.write(m);
}

// строка поиска, фокус и ctrl+enter поиск в ней
if (typeof($) == 'function') {
    $(function(){
        // на главной фокусим Поиск
        if (top.location.href.toString() == 'http://www.kinopoisk.ru/') {
            $('#search_input').focus();
        }

        $('#search_input').keypress(function(event) {
            if ((event.keyCode == '10' || event.keyCode == '13') && event.ctrlKey && !!$(this).val()) {
                document.searchForm.first.value = 'yes';
                document.searchForm.submit();
            }
        }).focus(function(){
            $("#top_form .formText").addClass("shadowed");
        }).blur(function(){
            $("#top_form .formText").removeClass("shadowed");
        });
    });
}

function serialize(mixed_value)
{
    var _getType = function( inp ) {
        var type = typeof inp, match;
        var key;
        if (type == 'object' && !inp) {
            return 'null';
        }
        if (type == "object") {
            if (!inp.constructor) {
                return 'object';
            }
            var cons = inp.constructor.toString();
            if (match = cons.match(/(\w+)\(/)) {
                cons = match[1].toLowerCase();
            }
            var types = ["boolean", "number", "string", "array"];
            for (key in types) {
                if (cons == types[key]) {
                    type = types[key];
                    break;
                }
            }
        }
        return type;
    };
    var type = _getType(mixed_value);
    var val, ktype = '';

    switch (type) {
        case "function":
            val = "";
            break;
        case "undefined":
            val = "N";
            break;
        case "boolean":
            val = "b:" + (mixed_value ? "1" : "0");
            break;
        case "number":
            val = (Math.round(mixed_value) == mixed_value ? "i" : "d") + ":" + mixed_value;
            break;
        case "string":
            val = "s:" + mixed_value.length + ":\"" + mixed_value + "\"";
            break;
        case "array":
        case "object":
            val = "a";
            var count = 0;
            var vals = "";
            var okey;
            var key;
            for (key in mixed_value) {
                ktype = _getType(mixed_value[key]);
                if (ktype == "function") {
                    continue;
                }

                okey = (key.match(/^[0-9]+$/) ? parseInt(key) : key);
                vals += serialize(okey) +
                        serialize(mixed_value[key]);
                count++;
            }
            val += ":" + count + ":{" + vals + "}";
            break;
    }
    if (type != "object" && type != "array") val += ";";
    return val;
}

$(function() {
    $('#newMenuSub > li').not('.off').hover(function() {
        $(this).children('a').css({'background': '#e6e6e6', 'border-right': '1px solid transparent'});
        $(this).prev('li').find('a').css('border-right', '1px solid transparent');
        $(this).prev('li.off').css('border-right', '1px solid transparent');
    }, function() {
        $(this).children('a').css({'background': '#f2f2f2', 'border-right': '1px solid #ccc'});
        $(this).prev('li').find('a').css('border-right', '1px solid #ccc');
        $(this).prev('li.off').css('border-right', '1px solid #ccc');
    });
    $('.toolltipMessNum').hover(function() {
       var self = $(this);
       $('.toolltipMessNum a.messNum').hide();
       $('.toolltipMessNum i').css({"opacity": "0"});
       self.find('i').animate({"opacity": "1"}, 200, function() {
            self.find('a.messNum').fadeIn();
       });
    }, function() {
       var self = $(this);
       self.find('a.messNum').hide();
       self.find('i').stop().css({"opacity": "0"});
    });
});
var newMenuSub ={
    animateduration: {over: 200, out: 100},
    buildmenu:function(menuid){
        jQuery(document).ready(function($){
            var $mainmenu=$("#"+menuid)
            var $headers=$mainmenu.find("ul").parent()
            $headers.each(function(i){
                var $curobj=$(this)
                var $subul=$(this).find('ul:eq(0)')
                this._dimensions={w:this.offsetWidth, h:this.offsetHeight, subulw:$subul.outerWidth(), subulh:$subul.outerHeight()}
                this.istopheader=$curobj.parents("ul").length==1? true : false
                $subul.css({top:this.istopheader? this._dimensions.h+"px" : 0})
                $curobj.hover(
                    function(e){
                        var $targetul=$(this).children("ul:eq(0)")
                        this._offsets={left:$(this).offset().left, top:$(this).offset().top}
                        var menuleft=this.istopheader? 0 : this._dimensions.w
                        menuleft=(this._offsets.left+menuleft+this._dimensions.subulw>$(window).width())? (this.istopheader? -this._dimensions.subulw+this._dimensions.w : -this._dimensions.w) : menuleft
                        if ($targetul.queue().length<=1)
                            $targetul.css({left:menuleft+"px", width:this._dimensions.subulw+'px'}).slideDown(newMenuSub.animateduration.over);
                    },
                    function(e){
                        var $targetul=$(this).children("ul:eq(0)")
                        $targetul.slideUp(newMenuSub.animateduration.out);
                    }
                )
            })
            $mainmenu.find("ul").css({display:'none', visibility:'visible'})
        })
    }
}
newMenuSub.buildmenu("newMenuSub");

var KPLightBox = {
    wrapper: '',
    settings: {},
    init: function(opts) {
        KPLightBox.settings = opts;
        KPLightBox.wrapper ='<div id="KPLightBoxOverlay" class="' + (KPLightBox.settings.overlay ? 'overlay' : "") + '">' +
		                    '	<div id="KPLightBox" ' + (KPLightBox.settings.styleclass ? KPLightBox.settings.styleclass : "") + '>' +
							'		<div id="lbClose"></div>' +
							'		<div id="lbHeader">' + (KPLightBox.settings.title ? KPLightBox.settings.title : "") + '</div>' +
							'		<div id="lbContent">' + (KPLightBox.settings.html ? KPLightBox.settings.html : "") + '</div>' +
							'	</div>' +
							'</div>';
        $('body').append(KPLightBox.wrapper);
		$('#KPLightBoxOverlay').fadeIn('fast');
		$('#lbClose').bind('click', function() {
			$('#KPLightBoxOverlay').remove();
		});
		$('#KPLightBox').css({
			width: (KPLightBox.settings.width ? KPLightBox.settings.width : "300px"),
			height:(KPLightBox.settings.height ? KPLightBox.settings.height : "300px")
		});
    },
	initTop : function() {
		KPLightBox.init({
			title: 'КиноПоиск запускает СМС-сервисы',
			html: '<div class="smsPushSettings">' +
					'<p>Теперь вы можете получать СМС-уведомления об интересующих вас фильмах. Вы сами выбираете на какие фильмы хотите подписаться. Будьте всегда в курсе событий:</p>' +
					'<ul>' +
						'<li><i>&mdash;</i>премьера и начало показа в кинотеатрах;</li>' +
						'<li><i>&mdash;</i>начало продаж на DVD и Blu-ray;</li>' +
						'<li><i>&mdash;</i>демонстрация фильма по ТВ;</li>' +
						'<li><i>&mdash;</i>а также восстановление пароля и многое другое.</li>' +
					'</ul>' +
				  '</div>'+
				  '<form class="formNum">' +
					'<h3>Начните использовать наши смс-сервисы прямо сейчас и совершенно бесплатно</h3>' +
					'<label>Введите ваш номер телефона</label>' +
					'<input id="phone" placeholder="901 123-12-12" type="text">' +
				  '</form>' +
				  '<div class="footerNotes">Мы обязуемся надежно хранить ваш номер телефона и не присылать сообщений рекламного характера</div>',
			overlay:false,
			styleclass: 'class="smsPushBox"',
			width:'700px',
			height:'370px'
		});
    },
    initPersonalMessage : function(name) {
        KPLightBox.init({
            title: 'Отправка персонального сообщения',
            html:'<form action="#" class="sendPS">' +
                    '<p class="profileName"><label for="profilename">Кому</label><s></s><a target="_blank" href="#" data-popup-info="disabled">' + name + '</a></p>' +
                    '<p><label for="subject">Тема</label><input type="text" name="subject" id="subject"/></p>' +
                    '<p><label class="textareaL" for="message">Текст</label><textarea cols="10" rows="4" id="message" name="message" autofocus></textarea></p>' +
                    '<p><button type="submit">Отправить</button></p>' +
                '</form>',
            overlay:false,
            styleclass: 'class="sendPSBox"',
            width:'480px',
            height:'auto'
        });
    },
	initSettings : function() {
        KPLightBox.init({
            title: 'Изменение номера телефона',
            html: '<div class="formLeft">' +
                        '<form>' +
                            '<label>Для работы с смс-сервисами КиноПоиска вам необходимо указать ваш номер телефона.</label>' +
                            '<input id="phone" type="text">' +
                            '<input id="submit" type="submit" value="Сохранить номер">' +
                        '</form>' +
                   '</div>' +
                    '<div class="formRight">' +
                        'Ваш номер скрыт от других пользователей и виден только вам. КиноПоиск обязуется использовать ваш номер только для ' + 'восстановления доступа к аккаунту и предоставления выбранных вами смс-сервисов. ' +
                        '<p>После сохранения номера необходимо подтвердить его введя код из отправленного вам смс-сообщения.</p>' +
                    '</div>',
            overlay:false,
            styleclass: 'class="stepMaster clearfix"',
            width:'550px',
            height:'228px'
        });
    },
	initStep2 : function() {

    },
	initStep2Bottom : function() {
        var html = '<form class="fixedStep2" name="" action="" method="">' +
        '               <label>Введите код из смс для подтверждения вашего номера</label>'+
        '               <i></i><input id="smsKod" name="kod" type="text"  placeholder="XXXX" value="" />' +
        '               <input id="smsSubmit" type="submit" value="СОХРАНИТЬ" />' +
        '               <span class="closeFixed"></span>' +
        '           </form>'
        $('body').append(html)
    }
}

$(function(){
    setTimeout(function(){
        if(typeof($.cookie) != 'undefined' && !$.cookie('refresh_yandexuid')) {
            $('body').append("<iframe style='width:1px; height:1px; position:ablosute; left:-50000px' src='http://awaps.yandex.ru/0/17986/0.htm?"+Math.round(Math.random()*65535)+"'></iframe>");
        }
    }, 300);
});

function checkRequestForCaptcha(request) {
    var res;
    try {
        res = JSON.parse(request.responseText);
    } catch (ex) {}
    if (res && res.type === 'captcha') {
        document.location.href = res.captcha['captcha-page'];
    } 
}

function overrideSend(prototype) {
    var origSend = prototype.send;
    prototype.send = function () {
        var xhr = this;
        var origOnreadystatechange = this.onreadystatechange;
        this.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                checkRequestForCaptcha(xhr);
            }

            if (origOnreadystatechange) {
                origOnreadystatechange.apply(xhr, arguments);
            }
        }
        origSend.apply(this, arguments);
    }
}

$(document).ajaxSuccess(function (evt, request) {
    checkRequestForCaptcha(request);
});

if (window.XMLHttpRequest) {
    overrideSend(XMLHttpRequest.prototype);
}

if (window.XDomainRequest) {
    overrideSend(XDomainRequest.prototype);
}

