/**
 * Gitlab MergeRequest Webhooks handler
 */
const EventEmitter = require('events').EventEmitter;
const bl = require('bl');

export function handleMergeRequestEvent(options) {
    // make it an EventEmitter, sort of
    handler.__proto__ = EventEmitter.prototype;
    EventEmitter.call(handler);

    return handler;

    function handler(req, res, callback) {
        function hasError(msg) {
            res.writeHead(400, {'content-type': 'application/json'});
            res.end(JSON.stringify({error: msg}));

            const err = new Error(msg);
            handler.emit('error', err, req);
            callback(err);
        }

        if (typeof options.secret !== 'string')
            throw new TypeError('must provide a 'secret' option');

        const currentOptions = options;

        if (req.method !== 'POST') return callback();

        const token = req.headers['x-gitlab-token'];
        if (!token || token !== currentOptions.secret)
            return hasError(
                'No X-Gitlab-Token found on request or the token did not match'
            );

        const event = req.headers['x-gitlab-event'];

        if (!event) return hasError('No X-Gitlab-Event found on request');

        req.pipe(
            bl(function (err, data) {
                if (err) return hasError(err.message);

                var obj;

                try {
                    obj = JSON.parse(data.toString());
                } catch (e) {
                    return hasError(e);
                }

                const event = obj.object_kind;

                const emitData = {
                    event: event,
                    payload: obj,
                    protocol: req.protocol,
                    host: req.headers['host'],
                    url: req.url,
                    resp: res,
                };

                handler.emit(event, emitData);
            })
        );
    }
}

