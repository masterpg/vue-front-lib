#!/bin/sh -e

if [ -z $1 ]; then
  eslint --fix ./ --ext .js --ext .ts
else
  if [ -d $1 ]; then
    eslint --fix "$1"
  elif [ -e $1 ]; then
    eslint --fix "$1"
  else
    echo "Directory or File \"$1\" not exists."
    exit 1
  fi
fi
