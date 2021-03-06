import config from '../config';
import {generateToken, getUser, createUser, updateUser, deleteUser} from './controllers/users';
import {getChannel, createChannel, updateChannel, deleteChannel} from './controllers/channels';
import {userCreate, userUpdate} from './requests/users';
import {channelCreate, channelUpdate} from './requests/channels';
import * as Joi from 'joi';

export default function (app) {
    app.get('/users/:userId/access-token', auth, wrap(generateToken));
    app.get('/users/:userId', auth, wrap(getUser));
    app.post('/users', auth, validate(userCreate), wrap(createUser));
    app.patch('/users/:userId', auth, validate(userUpdate), wrap(updateUser));
    app.delete('/users/:userId', auth, wrap(deleteUser));

    app.get('/channels/:channelId', auth, wrap(getChannel));
    app.post('/channels', auth, validate(channelCreate), wrap(createChannel));
    app.patch('/channels/:channelId', auth, validate(channelUpdate), wrap(updateChannel));
    app.delete('/channels/:channelId', auth, wrap(deleteChannel));
}

function wrap(action) {
    return function (req, res) {
        const result = action.apply(null, arguments);

        if (result.subscribe) {
            return result.subscribe(
                response => res.json(response),
                err => res.json(err)
            );
        }

        if (result.then) {
            return result
                .then(response => res.json(response))
                .catch(err => res.json(err));
        }

        res.json(result);
    };
}

function auth(req, res, next) {
    const authToken = req.headers.authorization || req.query.secret;

    if (authToken !== config.api.secret) {
        return res
            .status(401)
            .json({
                error: 'Unauthorized request'
            });
    }

    next();
}

function validate(schema) {
    return function(req, res, next) {
        const result = Joi.validate(req.body, schema);

        if (result.error) {
            return res
                .status(400)
                .json({
                    error: result.error
                });
        }

        req.body = result.value;

        next();
    }
}