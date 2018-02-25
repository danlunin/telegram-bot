
if(typeof(PUSHURL)=='undefined')
    var PUSHURL='';
if(typeof(PUSH_COMMENT_URL)=='undefined')
    var PUSH_COMMENT_URL='';
if(typeof(PUSH_MESSAGES_URL)=='undefined')
    var PUSH_MESSAGES_URL='';
STOP_LISTENING = false;
LISTENING=[];
function listen(url, callback) {
       // console.log("initListen " + url);
    if(LISTENING[url]/*|| STOP_LISTENING*/) {
        return false;
       // console.log("break! already listening " + url);
    }
    LISTENING[url]=true;

    // console.log("ajaxStarting " + url);
    $.ajax({
       url: url + '&r=' + Math.random(),
       dataType: 'json',
       timeout: 180000,
       type: 'get',
       cache: 'false',
       success: function(data, textStatus, xhr) {
           LISTENING[url]=false;
           listen(url, callback);
           callback(data);
       },
       error: function(xhr, textStatus, errorThrown) {
            // console.log(errorThrown);
            if(errorThrown=='Conflict')
                LISTENING[url]=false;
            //STOP_LISTENING=true;
            /*
            if(errorThrown=="timeout" || errorThrown=="Gone" ){
                listen(url, callback);
            }

            if(errorThrown=="Bad Gateway"){
                PUSHURL='';
            }*/
       }
    });
};


function InitPush(){
    if(PUSHURL)
        listen( PUSHURL, function(data){
            if(typeof(pushAvailable)!='undefined' && pushAvailable){



                if(data && data.message && typeof(KP.Notice)!='undefined') {

					if(typeof(GROUP_ID) !='undefined' && data.message.link.indexOf("group/" + GROUP_ID))
						return false;

                    if(data.message.comment_id && $("#comm" + data.comment.before).length){
                        data.message.link="#";
                        data.message.onclick='scrollTo(getElementTop("comm'+data.message.comment_id+'")); return false;';
                    }
                    KP.Notice.show(data.message.text, data.message.title, data.message.image, data.message.link, data.message.onclick, data.message.icon, true);
                }

                if(data && typeof(data.newMessageCount) != "undefined"){
                    if($('.mez_rez').length==0){
                        $('<div class="mez_rez"></div>').insertAfter(".searchButton2")
                    }
                    data.newMessageCount=parseInt(data.newMessageCount,10);
                    if(data.newMessageCount>0){
                        if(data.newMessageCount==1)
                            $('.mez_rez').html('<p title="'+data.newMessageCount+' новое сообщение" class="mez"><a href="/level/78/messages/one/"><b></b><s>'+data.newMessageCount+'</s></a></p>');
                        else
                            $('.mez_rez').html('<p title="'+data.newMessageCount+' новых сообщений" class="mez"><a href="/level/78/messages/new/"><b></b><s>'+data.newMessageCount+'</s></a></p>');
                    } else {
                        $('.mez_rez').remove();
                    }
                }
			}
        });

    if(PUSH_COMMENT_URL)
        listen( PUSH_COMMENT_URL, function(data){
            if(typeof(pushAvailable)!='undefined' && pushAvailable){
                if(data && data.comment && typeof(KP.Comments)!='undefined') {
                    KP.Comments.insert(data.comment);
                }
			}
        });

    if(PUSH_MESSAGES_URL)
        listen( PUSH_MESSAGES_URL, function(data){
            if(typeof(pushAvailable)!='undefined' && pushAvailable){

                if(data && data.message && typeof(KP.Messages)!='undefined' && my_user_id!=data.message.sender) {
                    KP.Messages.insert(data.message);
                }
			}
        });
}

$(function(){
    // баг iOS6 с keep-alive (или long-polling) запросами: все хэндлеры ждут окончания listen/
    // в каких именно случаях - не выяснено, рубим пуши там, где это возникает и мешает
    if (navigator.userAgent.match(/(iPad|iPhone|iPod).*OS\ 6/i) &&
        location.pathname.match(/facegame|kadrgame/)
    ) {
        return;
    }

    setTimeout(function(){
        InitPush();
    }, $.browser.safari ? 1000 : 200);
    KP.Notice.observe();
    $(window).focus(function(){
        InitPush();
    });
});
