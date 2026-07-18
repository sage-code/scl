#!/bin/bash
cp *.css   ../ > /dev/null
cp *.js    ../ > /dev/null
cp *.html  ../ > /dev/null
if ! test -L ../images; then
  ln -s ./www/images ../ 
fi
echo "done"