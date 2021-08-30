const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

const connectDB = async () => {
    try {
        await mongoose.connect(db);
        console.log('Mongo DB Connected');
    } catch (err) {
        console.error(err.message);
        //Exit Process with Failure
        process.exit(1);
    }
}

module.exports = connectDB;