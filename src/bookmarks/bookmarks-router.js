const express = require('express')
const uuid = require('uuid/v4')
const logger = require('../logger')
const BookmarksService = require('../bookmarks-service')
const xss = require('xss')

//Create Router for bookmarksRouter
const bookmarksRouter = express.Router()
//Create JSON body parser for POST request
const bodyParser = express.json()

//bookmarks route
//GET /bookmarks (returns full list of bookmarks)
//GET /bookmarks/:id (returns single bookmark or 404 if not found)
//POST /bookmarks (Adds an object to list of bookmarks)
//DELETE /bookmarks/:id (Deletes bookmark with given id)

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

        for (const [key, value] of Object.entries(newBookmark)) {
            if (value == null) {
                return res.status(400).json({
                    error: { message: `Missing ${key} in request body` }
                })
            }
        }

        BookmarksService.insertBookmark(
            req.app.get('db'),
            newBookmark
        )
            .then(bookmark => {
                res
                    .status(201)
                    .json({
                        id: bookmark.id,
                        title: xss(bookmark.title),
                        url: bookmark.url,
                        description: xss(bookmark.description),
                        rating: bookmark.rating
                    })
            })
    })

//Route for /bookmarks/:id (GET bookmarks based on id and DELETE bookmarks based on id)
bookmarksRouter
    .route('/bookmarks/:id')
    .all((req, res, next) => {
        const knexInstance = req.app.get('db');
        BookmarksService.getById(knexInstance, req.params.id)
            .then(bookmark => {
                if (!bookmark) {
                    return res.status(404).json({
                        error: {
                            message: 'Bookmark does not exist'
                        }
                    })
                }
                res.bookmark = bookmark
                next()
            })
    })
    .get((req, res) => {
        //Respond with single bookmark based on ID
        res.json({
            id: res.bookmark.id,
            title: xss(res.bookmark.title),
            url: res.bookmark.url,
            description: xss(res.bookmark.description),
            rating: res.bookmark.rating
        })
    })
    .delete((req, res) => {
        //DELETE bookmark based on ID
        BookmarksService.deleteBookmark(
            req.app.get('db'),
            req.params.id
        )
            .then(() => {
                res.status(204).end()
            })
    })
    .patch((req, res) => {
        res.status(204).end()
    })

module.exports = bookmarksRouter