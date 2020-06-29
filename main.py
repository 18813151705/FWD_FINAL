from sanic import Sanic
from sanic.response import text, json
from sanic_cors import CORS
import random

app = Sanic(__name__)
CORS(app)

# 会议相关数据
class meeting:
    def __init__(self,name,uuid,creater,sessionid):
        self.meetingname = name  # 会议名称
        self.uuid = uuid         # 会议的UUID
        self.sessionid = sessionid  # 会议创建人的sessionid
        self.creater = creater   # 会议创建人
        self.membername = dict()     # 成员名

# 聊天记录相关数据
class chatting:
    def __init__(self,UUID):
        self.uuid = UUID       # 会议的 UUID
        self.newchat = 0       # 是否有新的聊天记录
        self.records = {}      # 存储聊天记录

meetingList = []     # 成员记录数组
chattingList = []    # 聊天记录数组

'''
场景：前端轮询获取成员信息
功能：从meetinglist里获取到此UUID里的成员发送给前端
'''
@app.route("/getMembermsg", methods=["POST"])
async def getMMsg(request):
    response = json({})
    for a in meetingList:
        if a.uuid == request.json["UUID"]:   # 从会议成员记录里寻找跟UUID对应的会议的成员姓名
            response = json({'member':a.membername , 'ceater':a.creater})
    return response

'''
场景：前端轮询获取聊天记录
功能：将新的聊天记录发送给前端
'''
@app.route("/getChattingmsg", methods=["POST"])
async def getCMsg(request):
    membernum = 0
    for a in meetingList:
        if a.uuid == request.json["UUID"]:
            membernum = len(a.membername)
    for a in chattingList:
        if a.uuid == request.json["UUID"]:
            a.newchat += 1
            return json({'newchat': a.newchat ,'membernum': membernum ,'chats':a.records})

'''
场景：退出会议/解散会议
功能：创建者解散会议：将此会议的信息从meetinglist里删除
     与会者推出会议：将此成员的信息从meetinglist 的 membername 里删除
'''
@app.route("/leave", methods=["POST"])
async def leave(request):
    for a in meetingList:
        if a.sessionid == request.json['sessionid'] :    # 创建者解散
            meetingList.remove(a)
            return json({'msg':'会议解散！' , 'route':'1'})
    for b in meetingList:
        for c in b.membername:
            if request.json['sessionid'] == c :          # 与会者退出
                del b.membername[c]
                return json({'msg':'退出会议！','route':'0'})
    return json({'msg':'退出会议！','route':'0'})   # 当会议解散时，找不到对应的sessionid，则直接返回此json


'''
场景：用户发送消息
功能：接收到用户发送的消息，保存到chattinglist的records里
'''
@app.route("/sendmsg", methods=["POST"])
async def sendMsg(request):
    if len(chattingList) == 0 :       # chattinglist为空 ， 则创建一个此会议的chatting插入到chattinglist
        item = chatting(request.json['UUID'])
        item.records[request.json['username']] = request.json['msg']   # 将新消息插入到记录
        item.newchat = 0
        chattingList.append(item)
        return text('OK')
    flag = 1
    for a in chattingList:
        if a.uuid == request.json["UUID"]:   # 从chattinglist里查找到此会议的记录
            flag = 0
            a.records.clear()                # 只保存新的聊天记录，将新的聊天记录发送给前端即可
            a.newchat = 0
            a.records[request.json['username']] = request.json['msg']
    if flag:                                   # 没有聊天记录
        item = chatting(request.json['UUID'])
        item.records[request.json['username']] = request.json['msg']
        item.newchat = 0
        chattingList.append(item)
    return text('OK')


'''
功能：根据传来的sessionid和uuid，判断uuid是否存在；用户是进入meeting页面还是join页面 ； 把会议名称传给前端
场景：进入会议页面时，进入此函数； 
'''
@app.route("/judge" , methods=["POST"])
async def judge(request):
    flag = 0
    for m in meetingList:    # 判断是否是无效UUID
        if m.uuid == request.json['UUID']:
            flag = 1
            break
    if request.json['sessionid'] == None or request.json['sessionid'] == '' :    # 查看用户的sessionid是否为空
        for a in meetingList:
            if a.uuid == request.json['UUID']:

                response = json({'flag': flag, 'skip': '1','title':a.meetingname})
                break
    else :
        for a in meetingList:
            if a.uuid == request.json['UUID']:
                fflag = True
                for b in a.membername:
                    if b == request.json['sessionid']:          # 判断sessionid是否存在在记录里
                        fflag = False
                        break
                if fflag :
                    response = json({'flag':flag,'skip': '1', 'title': a.meetingname})
                    break
                response = json({'flag':flag,'skip': '0', 'title': a.meetingname})
                break
    return response
'''
场景：用户点击参加会议
功能：为用户分配一个sessionid，把会议名称传给前端
'''
@app.route("/join" , methods=["POST"])
async def join(request):
    # 给加入会议的成员分配一个sessionid
    UUID = request.json['UUID']
    meetingName = ""
    sessionid = str(random.randint(100000000, 999999999))   # 分配sessionid
    for a in meetingList:
        if a.uuid == UUID:            # 查找此UUID的会议
            a.membername[sessionid] = request.json['name']    # 在此会议中插入与会者的信息（sessionid和username）
            meetingName = a.meetingname
    return json({'sessionID':sessionid , 'meetingName':meetingName})

'''
场景：创建会议时
功能：为会议分配UUID，为创建者分配sessionid； meetinglist里加入此会议相关信息
'''
@app.route("/" ,methods=["POST"])
async def test(request):
    meetingName = request.json['meetingname']
    userName = request.json['name']
    UUID = str(random.randint(100000000, 999999999))      # 会议的UUID
    sessionID = str(random.randint(100000000, 999999999))  # 给会议创建者的sessionid
    item = meeting(meetingName, UUID,userName,sessionID)   # 创建一个meeting类，保存此会议相关数据
    item.membername[sessionID] = userName
    meetingList.append(item)

    if request.json['sessionid'] == None or request.json['sessionid']=='':        # 若此用户不存在sessionid，为其分配一个
        return  json({'UUID':UUID ,'sessionID':sessionID})
    else :
        return json({'UUID':UUID , 'sessionID':request.json['sessionid']})

    return json({'UUID':UUID})


if __name__ == "__main__":
    app.run(host="127.0.0.1" , port=1234)