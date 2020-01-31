require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
const bookmarksRouter = require('./bookmarks/bookmarks-router')
const logger = require('./logger')

const app = express()

const morganOption = (NODE_ENV === 'production')
    ? 'tiny'
    : 'common';

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())

//Validation
app.use(function validateBearerToken(req, res, next) {
    //Grabbing the actual API key and key sent in Authorization header
    const apiToken = process.env.API_TOKEN;
    const authToken = req.get('Authorization');

    //Respond with unauthorized request if Auth key is not in header
    //or if it does not match API_TOKEN
    if (!authToken || authToken.split(' ')[1] !== apiToken) {
        //log error with Winston
        logger.error(`Unauthorized request to path ${req.path}`);
        //Return response status and message 
        return res.status(401).json({ error: 'Unauthorized request' })
    }

    //Go to next middleware on successful Authentication
    next()
});

app.get('/', (req, res) => {
    res.send('Hello, world!')
});

//bookmarksRouter
app.use(bookmarksRouter)

app.use(function errorHandler(error, req, res, next) {
    let response
    if (NODE_ENV === 'production') {
        response = { error: { message: 'server error' } }
    } else {
        console.error(error)
        response = { message: error.message, error }
    }
    res.status(500).json(response)
})


module.exports = app