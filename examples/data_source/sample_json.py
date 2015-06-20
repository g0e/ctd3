#!/usr/bin/python
# coding:utf-8

import cgi
import json
import random
import string
import time

def random_series(params):
	ar = []
	offset = int(params.getfirst("offset",0))
	row_size = int(params.getfirst("row_size",20))
	for i in range(0,row_size):
		random_str = ''.join(random.choice(string.digits + string.letters) for i in xrange(10))
		ar.append({"id":(1+offset+i), "random_int":int(random.random()*100), "random_str":random_str})
	return ar
	
time.sleep(3)
dataset = random_series(cgi.FieldStorage())

print("Content-Type: application/json; charset=utf-8\n")
print(json.dumps(dataset,sort_keys=True,indent=4))

