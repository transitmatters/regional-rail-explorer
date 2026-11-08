#!/bin/bash
# Lambda's handler. The Web Adapter layer (AWS_LAMBDA_EXEC_WRAPPER=/opt/bootstrap) runs this,
# waits for the server to listen on $PORT, then forwards each request to it over HTTP.
exec node server.js
