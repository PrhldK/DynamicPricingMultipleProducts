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

    handlers = [
        (r'/', MainHandler),
        (r'/regression', RegressionHandler),
        (r'/bellman', BellmanHandler),
        (r'/%s/(.*)' % VENDOR_URL_PATH, tornado.web.StaticFileHandler, {'path': VENDOR_DIRECTORY_PATH})
    ]

    return tornado.web.Application(handlers, **settings)


if __name__ == '__main__':
    app = make_app()
    app.listen(8080)
    tornado.ioloop.IOLoop.current().start()
