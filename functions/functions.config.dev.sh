#!/bin/sh

firebase functions:config:set functions.region="asia-northeast1" cors.whitelist="http://localhost, http://localhost:5000, http://localhost:5010"
