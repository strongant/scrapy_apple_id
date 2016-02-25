# coding=UTF-8
# coding=UTF-8
import json
import logging
from datetime import datetime
from os import abort

from flask import request, Flask, jsonify

from scraping import scrapingByString
from util.mccLog import mccLog

app = Flask(__name__)
log = mccLog()

scraping_obj = scrapingByString()


@app.route("/")
def index():
    try:
        log.mccWriteLog('开始抓取')

    except Exception, e:
        log.mccError('抓取失败:' + str(e))
    return "result"


@app.route("/scraping/", methods=['POST'])
def scraping_by_bstring():
    result = {}
    try:
        request_data = request.data
        log.mccWriteLog('开始识别验证码{}'.format(request_data))
        if request_data is not None and len(request_data) > 0:
            r = scraping_obj.get_image_code(request_data)
            if r != '':
                result["state"] = "success"
                result["code"] = r
            else:
                result["state"] = "error"
        else:
            result["state"] = "error"
    except Exception, e:
        log.mccError('识别验证码失败:' + str(e))
    return json.dumps(result)


if __name__ == '__main__':
    app.debug = True
    app.run()
