import os

import tornado.ioloop
import tornado.web

from visualization.handlers import MainHandler
from visualization.handlers.regression import RegressionHandler
from visualization.handlers.bellman import BellmanHandler


VENDOR_URL_PATH = 'vendor'
VENDOR_DIRECTORY_PATH = 'node_modules'


def make_app():
    settings = dict(
        template_path=os.path.join(os.path.dirname(__file__), 'templates'),
        static_path=os.path.join(os.path.dirname(__file__), 'static'),
        ui_methods={
            'vendor_url': lambda req, path: '%s/%s' % (VENDOR_URL_PATH, path)
        }
    )

    vendor_path = os.path.join(os.path.dirname(__file__), VENDOR_DIRECTORY_PATH)
    handlers = [
        (r'/', MainHandler),
        (r'/regression', RegressionHandler),
        (r'/bellman', BellmanHandler),
        (r'/%s/(.*)' % VENDOR_URL_PATH, tornado.web.StaticFileHandler, {'path': vendor_path})
    ]

    return tornado.web.Application(handlers, **settings)


def start_server():
    print(__file__)
    app = make_app()
    app.listen(8080)
    tornado.ioloop.IOLoop.current().start()

