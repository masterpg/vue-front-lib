#!/bin/sh -e

if [ -z $1 ]; then
  eslint --fix ./ --ext .js,.ts,.vue
else
  if [ -d $1 ]; then
    eslint --fix "$1" --ext .js,.ts,.vue
  elif [ -e $1 ]; then
    eslint --fix "$1"
  else
    echo "Directory or File \"$1\" not exists."
    exit 1
  fi
fi
