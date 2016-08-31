import sys

from visualization.app import start_server


if len(sys.argv) > 1:
    start_server(sys.argv[1])
else:
    start_server()
