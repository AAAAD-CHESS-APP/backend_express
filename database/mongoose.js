const mongoose = require('mongoose');

mongoose.connect(`${process.env.MONGODB_URL}/aichessdb`)
    .then(() => console.log('Database is connected'))
    .catch(err => console.error('Database connection error:', err));