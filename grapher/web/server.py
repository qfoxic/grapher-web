import os
import http.server

from functools import partial
from grapher import web

PORT = 4200
HOSTNAME = ''

Handler = partial(
    http.server.SimpleHTTPRequestHandler,
    directory=os.path.join(*web.__path__, 'ui'))

with http.server.HTTPServer((HOSTNAME, PORT), Handler) as httpd:
    print('Warning! This is not production server. Use it only for local testing.')
    print('Listening on http://0.0.0.0:4200')
    httpd.serve_forever()
