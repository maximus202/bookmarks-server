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

    describe('GET /api/bookmarks', () => {
        context('Given no articles', () => {
            it('responds with 200 and an empty list', () => {
                return supertest(app)
                    .get('/api/bookmarks')
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

            it('GET /api/bookmarks responds with all bookmarks in db.', () => {
                return supertest(app)
                    .get('/api/bookmarks')
                    .set('Authorization', 'bearer ' + process.env.API_TOKEN)
                    .expect(200, testBookmarks)
                //Assertions to the response body
            });
        })
    });

    describe('GET /api/bookmarks/:id', () => {
        context('Given there is an XSS attack', () => {
            const maliciousRequest = {
                id: 911,
                title: 'Naughty <script>alert("xss");</script>',
                url: 'www.whatever.com',
                description: 'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">.',
                rating: 5
            }
            beforeEach('insert malicious request', () => {
                return db
                    .into('bookmarks')
                    .insert([maliciousRequest])
            })
            it('Removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/bookmarks/${maliciousRequest.id}`)
                    .set('Authorization', 'bearer ' + process.env.API_TOKEN)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql('Naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                        expect(res.body.description).to.eql('Bad image <img src="https://url.to.file.which/does-not.exist">.')
                    })
            })
        })

        context('Given no bookmarks', () => {
            it('responds with 404', () => {
                const bookmarkId = 100
                return supertest(app)
                    .get(`/api/bookmarks/${bookmarkId}`)
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

            it('GET /api/bookmarks/:bookmark_id responds with the specific bookmark', () => {
                const bookmarkId = 2
                const expectedBookmark = testBookmarks[bookmarkId - 1]
                return supertest(app)
                    .get(`/api/bookmarks/${bookmarkId}`)
                    .set('Authorization', 'bearer ' + process.env.API_TOKEN)
                    .expect(200, expectedBookmark)
            })
        })
    })

    describe('POST /api/bookmarks', () => {
        context('Given there is an XSS attack', () => {
            const maliciousRequest = {
                id: 911,
                title: 'Naughty <script>alert("xss");</script>',
                url: 'www.whatever.com',
                description: 'Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">.',
                rating: 5
            }
            beforeEach('insert malicious request', () => {
                return db
                    .into('bookmarks')
                    .insert([maliciousRequest])
            })
            it('Removes XSS attack content', () => {
                return supertest(app)
                    .get(`/api/bookmarks/${maliciousRequest.id}`)
                    .set('Authorization', 'bearer ' + process.env.API_TOKEN)
                    .expect(200)
                    .expect(res => {
                        expect(res.body.title).to.eql('Naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
                        expect(res.body.description).to.eql('Bad image <img src="https://url.to.file.which/does-not.exist">.')
                    })
            })
        })

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
                    .post('/api/bookmarks')
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
                .post('/api/bookmarks')
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
                        .get(`/api/bookmarks/${postRes.body.id}`)
                        .set('Authorization', 'bearer ' + process.env.API_TOKEN)
                        .expect(postRes.body)
                )
        })
    })

    describe('DELETE /api/bookmarks/:id', () => {
        context('Given there are bookmarks in db', () => {
            const testBookmarks = makeBookmarksArray()
            beforeEach('insert bookmarks', () => {
                return db
                    .into('bookmarks')
                    .insert(testBookmarks)
            })
            it('responds with 204 and removes the bookmark', () => {
                const idToRemove = 2
                const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)
                return supertest(app)
                    .delete(`/api/bookmarks/${idToRemove}`)
                    .set('Authorization', 'bearer ' + process.env.API_TOKEN)
                    .expect(204)
                    .then(res =>
                        supertest(app)
                            .get('/api/bookmarks')
                            .set('Authorization', 'bearer ' + process.env.API_TOKEN)
                            .expect(expectedBookmarks)
                    )
            })
        })
    })

    describe('PATCH /api/bookmarks/:id', () => {
        context('Given no bookmarks', () => {
            it(`Responds with 404`, () => {
                const bookmarkId = 1234
                return supertest(app)
                    .patch(`/api/bookmarks/${bookmarkId}`)
                    .set('Authorization', 'bearer ' + process.env.API_TOKEN)
                    .expect(404, { error: { message: `Bookmark does not exist` } })
            })
        })
    })

    context('Given there are bookmarks', () => {
        const testBookmarks = makeBookmarksArray()
        beforeEach('Insert bookmarks', () => {
            return db
                .into('bookmarks')
                .insert(testBookmarks)
        })
        it('Responds with 204 and updates the bookmark', () => {
            const idToUpdate = 2
            const updateBookmark = {
                title: 'Updated title',
                url: 'newurl.com',
                description: 'A new description',
                rating: '1'
            }
            return supertest(app)
                .patch(`/api/bookmarks/${idToUpdate}`)
                .set('Authorization', 'bearer ' + process.env.API_TOKEN)
                .send(updateBookmark)
                .expect(204)
        })
    })
});