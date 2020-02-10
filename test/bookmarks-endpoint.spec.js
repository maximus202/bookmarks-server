const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
require('dotenv').config()
const { makeBookmarksArray } = require('./bookmarks.fixtures')

describe('Bookmarks endpoint', () => {
    let db

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
        app.set('db', db);
    });

    after('disconnect from db', () => db.destroy());

    before('Clean the table', () => db('bookmarks').truncate());

    afterEach('Clean the table', () => db('bookmarks').truncate())

    describe('GET /bookmarks', () => {
        context('Given no articles', () => {
            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', 'bearer ' + process.env.API_TOKEN)
                    .expect(200, [])
            })
        })

        context('Table has data', () => {
            const testBookmarks = makeBookmarksArray()
            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            });

            it('GET /bookmarks responds with all bookmarks in db.', () => {
                return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', 'bearer ' + process.env.API_TOKEN)
                    .expect(200, testBookmarks)
                //Assertions to the response body
            });
        })
    });

    describe('GET /bookmarks/:id', () => {
        context('Given no bookmarks', () => {
            it('responds with 404', () => {
                const bookmarkId = 100
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', 'bearer ' + process.env.API_TOKEN)
                    .expect(404, { error: { message: 'Bookmark does not exist' } })
            })
        })

        context('Table has data', () => {
            const testBookmarks = makeBookmarksArray()
            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            });

            it('GET /bookmarks/:bookmark_id responds with the specific bookmark', () => {
                const bookmarkId = 2
                const expectedBookmark = testBookmarks[bookmarkId - 1]
                return supertest(app)
                    .get(`/bookmarks/${bookmarkId}`)
                    .set('Authorization', 'bearer ' + process.env.API_TOKEN)
                    .expect(200, expectedBookmark)
            })
        })
    })

    describe('POST /bookmarks', () => {
        const requiredFields = ['title', 'url', 'description', 'rating']
        requiredFields.forEach(field => {
            const newBookmark = {
                title: 'Test new title',
                url: 'www.test.com',
                description: 'Bookmark description',
                rating: '5'
            }
            it('responds with 400 and an error when title is missing', () => {
                delete newBookmark[field]

                return supertest(app)
                    .post('/bookmarks')
                    .set('Authorization', 'bearer ' + process.env.API_TOKEN)
                    .send(newBookmark)
                    .expect(400, {
                        error: {
                            message: `Missing ${field} in request body`
                        }
                    })
            })
        })

        it('creates an article, responding with 201 and the new article', () => {
            const newBookmark = {
                title: 'Test title',
                url: 'www.test.com',
                description: 'A test bookmark',
                rating: '10'
            }

            return supertest(app)
                .post('/bookmarks')
                .set('Authorization', 'bearer ' + process.env.API_TOKEN)
                .send(newBookmark)
                .expect(201)
                .expect(res => {
                    expect(res.body.title).to.eql(newBookmark.title)
                    expect(res.body.url).to.eql(newBookmark.url)
                    expect(res.body.description).to.eql(newBookmark.description)
                    expect(res.body.rating).to.eql(newBookmark.rating)
                    expect(res.body).to.have.property('id')
                })
                .then(postRes =>
                    supertest(app)
                        .get(`/bookmarks/${postRes.body.id}`)
                        .set('Authorization', 'bearer ' + process.env.API_TOKEN)
                        .expect(postRes.body)
                )
        })
    })
});