
// 向后台发送请求，获取参会人员姓名
function getMemberMSG(){
    let myUrl = window.location.href;
    let index = myUrl.lastIndexOf("\/");
    let _uuid = myUrl.substring(index + 1,myUrl.length);  // 根据url获取到UUID
    let member = ""
    axios({
        method:'post',
        url:'http://127.0.0.1:1234/getMembermsg',
        data:{
            'UUID':_uuid
        }
    })
    .then(function(res){
        if(res.data.member == null)
            document.getElementById("chats").innerHTML =  ""; 
        for(x in res.data.member){
            if(res.data.member[x] == res.data.ceater){         // 会议创建者的姓名标红
                member += "<h4 style='font-weight:bold;color:#0000EE'>"+ "   ·  "+res.data.member[x]+ "(主持)" +"</h4>" ;    
                continue ;
            }
            if(res.data.member[x] == getCookie('username')){
                member += "<h4 style='font-weight:bold'>"+ "   ·  "+res.data.member[x]+"(我)" +"</h4>" ;
                continue ;
            }
            member += "<h4 style='font-weight:bold'>"+ "   ·  "+res.data.member[x] +"</h4>" ;
        }
        document.getElementById("grouplist").innerHTML =  member;     // 显示与会者姓名
    }).catch(function(error){
        console.log(error);
    })
}
// 获取聊天信息
function getChattingMSG(){
    let myUrl = window.location.href;
    let index = myUrl.lastIndexOf("\/");
    let _uuid = myUrl.substring(index + 1,myUrl.length);  // 根据url获取到UUID
    let member = ""
    axios({
        method:'post',
        url:'http://127.0.0.1:1234/getChattingmsg',
        data:{
            'UUID':_uuid
        }
    })
    .then(function(res){
        if(res.data.newchat <= res.data.membernum){
            for(x in res.data.chats){
                if(x == getCookie('username')){
                     member += "<h5 style='text-align: right;font-weight:bold'>"+ x +"</h5>" + "<h4 style='font-weight:bold;text-align: right;color:#32CD32;'>"+ res.data.chats[x] +"</h4>" ; //
                     continue;
                }
                member += "<h5 style='font-weight:bold'>"+ x +"</h5>" + "<h4 style='font-weight:bold; color: #00BFFF'>"+ res.data.chats[x] +"</h4>" ; //
            }           
            document.getElementById("chats").innerHTML +=  member;  
        }
    }).catch(function(error){
        console.log(error);
    })
}
window.setInterval(getMemberMSG,800) ;   // 轮询（每个0.8s发送请求/获取成员信息）
window.setInterval(getChattingMSG,300) ;  // 轮询（每隔0.3s发送请求/获取聊天信息）
window.onbeforeunload = function(){        // 退出页面时，向后台发送消息，删除cookie（采用js的XMLHttpRequest）
    let myUrl = window.location.href;
    let index = myUrl.lastIndexOf("\/");
    let _uuid = myUrl.substring(index + 1,myUrl.length);  // 根据url获取到UUID
    xmlhttp = new XMLHttpRequest();
    xmlhttp.open("POST","http://127.0.0.1:1234/leave",true);
    xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
    xmlhttp.send(JSON.stringify({
        'UUID':_uuid,
        'username':getCookie('username'),
        'sessionid':getCookie('sessionid')    
    }));
    clearCookie('sessionid');        // 清除cookie
    clearCookie('username');
} 

// 获取cookie
function getCookie(name){
    var cookieName = encodeURIComponent(name) + "=",
        cookieStart = document.cookie.indexOf(cookieName),
        cookieValue = null;
    if (cookieStart > -1) {
      var cookieEnd = document.cookie.indexOf(";",cookieStart);
      if (cookieEnd == -1) {
        cookieEnd = document.cookie.length;
      }
      cookieValue = decodeURIComponent(document.cookie.substring(cookieStart + cookieName.length,cookieEnd));
    }
    return cookieValue;
}
// 设置cookie
function setCookie(name,value,exp){
    var cookieText = encodeURIComponent(name) + "=" + encodeURIComponent(value);
    var exp = new Date(); 
    exp.setTime(exp.getTime() + 60*1000*30);
    cookieText += ";expires=" + exp.toGMTString();    //设置存活时间
    document.cookie = cookieText;   
}
// 清除cookie
function clearCookie(name){
    setCookie(name, "", -1);
}


// 与会者——加入会议页面
const joinmeeting = {
    methods:{
        // 点击加入会议
        async joinMeeting(){

            let myUrl = window.location.href;
            let index = myUrl.lastIndexOf("\/");
            let _uuid = myUrl.substring(index + 1,myUrl.length);  // 根据url获取到UUID
            var _username = document.getElementById("username").value;   // 获取参会者的username
            await axios({
                method:'post',
                url:'http://127.0.0.1:1234/join',
                data:{
                    'UUID':_uuid,
                    'name':_username
                },
                headers:{
                    'Content-Type':'application/x-www-form-urlencoded',
                }
            })
            .then(function(res){
                document.getElementById("header").innerHTML = res.data.meetingName ;  
                setCookie('sessionid',res.data.sessionID);  // 将sessionid保存到cookie
                setCookie('username',_username);                // 将昵称保存早cookie
            }).catch(function(error){
                console.log(error);
            })
            this._skipToMeeting();          // 到meeting页
        },
        _skipToMeeting(){              
            style="display: none;"
            document.getElementById("join").style.display="none";//隐藏 
            document.getElementById("mt").style.display="" ;  //显示
            
        }
    },
    template : '#join'  
}

// 会议页面
const meeting = {
    mounted(){
        // 判断uuid是否有效
        // 判断是否有sessionid
        this.judge();       
    },

    methods:{
        async judge(){
            var skip ;
            var title;    // 会议标题
            var sessionid = getCookie('sessionid');

            let myUrl = window.location.href;
            let index = myUrl.lastIndexOf("\/");
            let _uuid = myUrl.substring(index + 1,myUrl.length);  // 根据url获取到UUID

            await axios({
                method:'post',
                url:'http://127.0.0.1:1234/judge',
                data:{
                    'sessionid':sessionid,
                    'UUID':_uuid 
                },
                headers:{
                    'Content-Type':'application/x-www-form-urlencoded',
                }
            })
            .then(function(res){
                if(res.data.flag == 0){
                    style="display: none;"
                    document.getElementById("join").style.display="none";//隐藏
                    alert('无效的会议号（UUID）！'); 
                }
                else if(res.data.skip == '1') {           // ‘1’表示要跳转到join页
                    skip = 1;
                    document.getElementById("title").innerHTML = res.data.title + "会议";       // join页里显示会议名称
                }
                else if(res.data.skip == '0'){            // ‘0’表示要跳到meeting页
                    skip = 0 ;               
                    document.getElementById("header").innerHTML = res.data.title ;              // meeting页里显示会议名称
                }
            }).catch(function(error){
                console.log(error);
            })
            // 根据skip判断到哪个页
            if(skip == 1)
                this.skipToJoinin();
            else if(skip == 0)
                this.skipToMeeting(title);
        },

        skipToJoinin(){
            style="display: none;"
            document.getElementById("join").style.display="";//显示
            document.getElementById("mt").style.display="none";//隐藏 
            
        },
        skipToMeeting(){
            style="display: none;"
            document.getElementById("mt").style.display="";//显示 
            document.getElementById("join").style.display="none";//隐藏 
            
        },
        // 发送消息
        sendChattingMSG(){
            let myUrl = window.location.href;
            let index = myUrl.lastIndexOf("\/");
            let _uuid = myUrl.substring(index + 1,myUrl.length);  // 根据url获取到UUID
            let _msg = document.getElementById("inputbox").value;
            document.getElementById("inputbox").value = "" ;      
            axios({
                method:'post',
                url:'http://127.0.0.1:1234/sendmsg',
                data:{
                    'UUID':_uuid,
                    'username':getCookie('username'),
                    'msg':_msg
                }
            })
            .then(function(res){
                setCookie('username',getCookie('username'));       // 更新cookie的存活时间
                setCookie('sessionid',getCookie('sessionid'));
            }).catch(function(error){
                console.log(error);
            })
            
        } ,
         // 退出会议
         async leave(){
            let myUrl = window.location.href;
            let index = myUrl.lastIndexOf("\/");
            let _uuid = myUrl.substring(index + 1,myUrl.length);  // 根据url获取到UUID
            let route = 1 ;
            await axios({
                method:'post',
                url:'http://127.0.0.1:1234/leave',
                data:{
                    'UUID':_uuid,
                    'username':getCookie('username'),
                    'sessionid':getCookie('sessionid')                
                }
            })
            .then(function(res){
                clearCookie('username');            // 退出会议——清除cookie
                clearCookie('sessionid');

                if(res.data.route == '0')        
                    route = 0 ;
              
            }).catch(function(error){
                console.log(error);
            })
            
            if(route)                    // 退出会议——跳转到创建会议页面
                this.$router.push('/');
            else{
                style="display: none;"
                document.getElementById("mt").style.display="none" ;  //隐藏
                document.getElementById("join").style.display="";     //显示
                
            }
                
        }
    },
    template : '#meeting'    
}

// 创建者——创建会议页面
const Userlogin = { 
    methods:{
        // 新建会议
        // 给后台发送 会议名称/创建者的名称/sessionid
        async newMeeting(){
            var _meetingtitle = document.getElementsByName("meetingname")[0].value;    // 获取会议名称
            var _name = document.getElementsByName("name")[0].value;                    // 获取创建者的昵称

            title = _meetingtitle;  
            var sessionid = getCookie('sessionid');
            await axios({
                method:'post',
                url:'http://127.0.0.1:1234',
                data:{
                    'meetingname':_meetingtitle,
                    'name':_name,
                    'sessionid':sessionid
                },
                headers:{
                    'Content-Type':'application/x-www-form-urlencoded',
                } 
            })
            .then(function(res){     
                UUID = res.data.UUID ;        // 会议号
                if(res.data.sessionID != undefined){
                    setCookie('sessionid',res.data.sessionID); // 保存sessionid
                    setCookie('username',_name);
                }    
                    
            }).catch(function(error){
                console.log(error);
            })

            this.$router.push('/'+UUID);       // 跳转到带有uuid的路径
        }
    },
    
    template: '#create'
}

const router = new VueRouter({
    // 根路径和带有uuid的路径分别对应的tempelete
    routes:[
        { path:'/',component:Userlogin},
        { 
            path:'/:id',
            components:{
                a:meeting,
                b:joinmeeting
            }
        }
    ]
})

new Vue({
    el:'#app',
    router,
})