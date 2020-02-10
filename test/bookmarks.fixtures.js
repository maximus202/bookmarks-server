function makeBookmarksArray() {
    return [
        {
            id: 1,
            title: 'First bookmark',
            url: 'first.com',
            description: 'My first bookmark!',
            rating: '10'
        },
        {
            id: 2,
            title: '2nd bookmark',
            url: 'second.com',
            description: 'My second bookmark!',
            rating: '9'
        },
        {
            id: 3,
            title: '3rd bookmark',
            url: 'third.com',
            description: 'My third bookmark!',
            rating: '8'
        },
    ]
}

module.exports = { makeBookmarksArray }