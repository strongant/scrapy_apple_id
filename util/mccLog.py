# coding=UTF-8
import logging
import os
from datetime import datetime


class mccLog(object):
    def __init__(self):
        log_path = os.path.realpath(os.path.join(os.path.dirname(__file__), '../logs'))
        if not os.path.exists(log_path):
            os.makedirs(log_path)
        logging.basicConfig(level=logging.DEBUG,
                            format='%(asctime)s %(levelname)s %(message)s',
                            datefmt='%Y-%M-%d %H:%M:%S',
                            filename=log_path+"/"+datetime.now().strftime('%Y%m%d%H%M%S')+'.log',
                            filemode='a')
    def mccWriteLog(self,logContent):
        logging.info(logContent)

    def mccError(self,errorContent):
        logging.error(errorContent)


