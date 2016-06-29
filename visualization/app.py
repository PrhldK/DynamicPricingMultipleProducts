import os
import tornado.ioloop
import tornado.web

from visualization.handlers import MainHandler
from visualization.handlers.regression import RegressionHandler
from visualization.handlers.bellman import BellmanHandler


def make_app():
    settings = dict(
        template_path=os.path.join(os.path.dirname(__file__), 'templates'),
        static_path=os.path.join(os.path.dirname(__file__), 'static')
    )
    handlers = [
        (r"/", MainHandler),
        (r"/regression", RegressionHandler),
        (r"/bellman", BellmanHandler)
    ]
    return tornado.web.Application(handlers, **settings)

if __name__ == "__main__":
    app = make_app()
    app.listen(8080)
    tornado.ioloop.IOLoop.current().start()
