venv:
	rm -rf ~/grapher-venv; python3.7 -m venv ~/grapher-venv && . ~/grapher-venv/bin/activate && pip3 install wheel && pip3 install grapher-web

run:
	. ~/grapher-venv/bin/activate && python3.7 -m grapher.web.server

