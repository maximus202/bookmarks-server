const BookmarksService = {
    getAllBookmarks() {
        return knex.select('*').from('bookmarks')
    }
}

module.exports = BookmarksService