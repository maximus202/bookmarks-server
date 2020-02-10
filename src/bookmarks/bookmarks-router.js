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

        const { title, url, description, rating } = req.body
        const newBookmark = { title, url, description, rating }
        BookmarksService.insertBookmark(
            req.app.get('db'),
            newBookmark
        )
            .then(bookmark => {
                res
                    .status(201)
                    .json(bookmark)
            })
    })

//Route for /bookmarks/:id (GET bookmarks based on id and DELETE bookmarks based on id)
bookmarksRouter
    .route('/bookmarks/:id')
    .get((req, res) => {
        //Respond with single bookmark based on ID
        const knexInstance = req.app.get('db');
        BookmarksService.getById(knexInstance, req.params.id)
            .then(bookmark => {
                if (!bookmark) {
                    return res.status(404).json({
                        error: { message: 'Bookmark does not exist' }
                    })
                }
                res.json(bookmark)
            })
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