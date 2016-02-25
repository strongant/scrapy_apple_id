# coding=UTF-8
import ConfigParser
import base64
import os

import sys
from datetime import datetime, time

from chaojiying import Chaojiying_Client
from util.mccLog import mccLog
from hashlib import md5



class configReader(object):
    def __init__(self,configPath):
        configFile = os.path.join(sys.path[0],configPath)
        self.cReader = ConfigParser.ConfigParser()
        self.cReader.read(configFile)

    def readConfig(self,section,item):
        return self.cReader.get(section,item)

    def getDict(self,section):
        commondDict = {}
        items = self.cReader.items(section)
        for key,value in items:
            commondDict[key] = value
        return commondDict

class scrapingByString(object):
    CONFIGPATH = '_config.ini'
    def __init__(self):
        self.logger = mccLog()
        self.cfReader = configReader(self.CONFIGPATH)
        self.accounts = self.cfReader.getDict("Account")
        self.logger.mccWriteLog("用户信息:{}".format(self.accounts))


    #通过指定的base64字符串进行识别验证码
    def get_image_code(self,image_base64_str):
        self.logger.mccWriteLog("开始识别验证码")
        try:

            #尝试三次进行识别，如果三次识别都失败则返回""
            chaojiying = Chaojiying_Client(self.accounts.get("username"),md5(self.accounts.get("password")).hexdigest(),self.accounts.get("soft_id"))
            times = self.cfReader.readConfig("SYS","times")
            result = ""
            if image_base64_str is not None and len(image_base64_str)>0:
                start_time = datetime.now()
                #替换base64多余的字符
                replace_str = image_base64_str.replace(self.cfReader.readConfig("IMAGEREG","reg"), "")
                self.logger.mccWriteLog("验证码替换字符串规则{}".format(self.cfReader.readConfig("IMAGEREG","reg")))
                self.logger.mccWriteLog("验证码识别前为{}".format(replace_str))
                content  = base64.b64decode(replace_str)
                for i in range(int(times)):
                    self.logger.mccWriteLog("开始识别验证码{}次".format(str(i+1)))
                    result_dict = chaojiying.PostPic(content, self.cfReader.readConfig("IMAGETYPE","code"))
                    self.logger.mccWriteLog("识别验证码结果{}".format(str(result_dict)))
                    tag = result_dict.get("err_str") == u'OK'
                    if tag:
                        result = result_dict.get('pic_str')
                        end_time= datetime.now()
                        diff = (end_time - start_time).seconds
                        self.logger.mccWriteLog("{}次识别验证码成功:{}\n耗时{}秒.".format(str(i),str(result),str(diff)))
                        break
                    else:
                        self.logger.mccError("{}次识别验证码失败:{}".format(str(i+1), str(result)))
                    time.sleep(2)
            return result
        except Exception,e:
            self.logger.mccError("验证码识别错误:"+str(e))
