# coding=UTF-8
# coding=UTF-8
import json
import logging
from datetime import datetime
from os import abort

from flask import request, Flask, jsonify



app = Flask(__name__)
logging.basicConfig(level=logging.DEBUG,
                    format='%(asctime)s %(levelname)s %(message)s',
                    datefmt='%Y-%M-%d %H:%M:%S',
                    filename="logs/"+datetime.now().strftime('%Y%m%d%H%M%S') + '.log',
                    filemode='a')

@app.route("/")
def index():
    try:
        logging.info('开始抓取')

    except Exception,e:
        logging.info('抓取失败:'+str(e))
    return "result"

if __name__ == '__main__':
    app.debug = True
    app.run()