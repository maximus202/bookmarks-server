const express = require('express')
const uuid = require('uuid/v4')
const logger = require('../logger')
const BookmarksService = require('../bookmarks-service')

//Create Router for bookmarksRouter
const bookmarksRouter = express.Router()
//Create JSON body parser for POST request
const bodyParser = express.json()

//bookmarks route
//GET /bookmarks (returns full list of bookmarks)
//GET /bookmarks/:id (returns single bookmark or 404 if not found)
//POST /bookmarks (Adds an object to list of bookmarks)
//DELETE /bookmarks/:id (Deletes bookmark with given id)

//bookmarks array
const bookmarks = [{
    id: 1,
    URL: 'google.com'
}]

//Route for /bookmarks (GET bookmarks list and POST new bookmark to list)
bookmarksRouter
    .route('/bookmarks')
    .get((req, res) => {
        //respond with full list of bookmarks
        const knexInstance = req.app.get('db')
        BookmarksService.getAllBookmarks(knexInstance)
            .then(bookmarks => {
                res.json(bookmarks)
            })

    })
    .post(bodyParser, (req, res) => {
        //POST new bookmark to list of bookmarks

        //deconstructing URL from request body
        const { URL } = req.body
        //if URL is missing, respond with error message
        if (!URL) {
            logger.error('URL is required.');
            return res
                .status(400)
                .send('Invalid request.')
        }

        //if data exists, generate an ID and push bookmark object to array
        //get id
        const id = uuid()

        //generate object
        const bookmark = {
            id,
            URL
        }

        //push object to bookmarks array
        bookmarks.push(bookmark);

        //log bookmark creation and send response with location header
        logger.info(`Created bookmark with ${id}`)
        return res
            .status(202)
            .location(`http://localhost:8000/bookmarks/${id}`)
            .json(bookmark)
    })

//Route for /bookmarks/:id (GET bookmarks based on id and DELETE bookmarks based on id)
bookmarksRouter
    .route('/bookmarks/:id')
    .get((req, res) => {
        //Respond with single bookmark based on ID

        //deconstruct URL from request
        const { id } = req.params;

        //find bookmark
        const bookmark = bookmarks.find(bookmark => bookmark.id == id);

        //Respond with error if bookmark was not found
        if (!bookmark) {
            logger.error(`No results found with id ${id}`);
            return res
                .status(404)
                .send('Bookmark not found');
        }

        //If bookmark was found, send it in response
        res.json(bookmark);
    })
    .delete((req, res) => {
        //DELETE bookmark based on ID

        //deconstruct id from request
        const { id } = req.params

        //Find ID
        const bookmarkIndex = bookmarks.findIndex(li => li.id == id);

        //If ID doesn't exist, respond with error
        if (bookmarkIndex === -1) {
            logger.error(`Bookmark with id ${id} not found.`);
            return res
                .status(404)
                .send('Bookmark not found');
        }

        //If ID exists, remove from array
        bookmarks.splice(bookmarkIndex, 1);
        logger.info(`Bookmark with with ${id} deleted.`);
        res
            .status(200)
            .send('Bookmark deleted.');
    });

module.exports = bookmarksRouter