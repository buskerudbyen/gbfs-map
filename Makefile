SHELL := /bin/bash
DEST := /home/lenni/www/
DATE := $(shell date "+%Y%m%d%H%M%S")

deploy:
	rsync -rC \
		`pwd` \
		lenni@leonard.io:${DEST}

watch:
	ag -l | entr make deploy


