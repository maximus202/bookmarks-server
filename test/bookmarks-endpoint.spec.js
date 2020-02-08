const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
require('dotenv').config()

describe('Bookmarks endpoint', () => {
    let db

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL,
        })
    });

    app.set('db', db);

    after('disconnect from db', () => db.destroy());

    before('Clean the table', () => db('bookmarks').tuncate());

    context('Table has data', () => {
        testBookmarks = [
            {
                id: '1',
                title: 'First bookmark',
                url: 'first.com',
                description: 'My first bookmark!',
                rating: '10'
            },
            {
                id: '2',
                title: '2nd bookmark',
                url: 'second.com',
                description: 'My second bookmark!',
                rating: '9'
            },
            {
                id: '3',
                title: '3rd bookmark',
                url: 'third.com',
                description: 'My third bookmark!',
                rating: '8'
            },
        ];

        beforeEach('insert bookmarks', () => {
            return db
                .into('bookmarks')
                .insert(testBookmarks)
        });

        it('GET /bookmarks responds with all bookmarks in db.', () => {
            console.log(process.env.API_TOKEN)
            return supertest(app)
                .get('/bookmarks')
                .set('Authorization', 'Bearer ' + process.env.API_TOKEN)
                .expect(200)
            //Assertions to the response body
        });
    });
});