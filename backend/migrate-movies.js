const mongoose = require('mongoose');
const Movie = require('./src/models/Movies');

require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cinebooking';

async function runMigration() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    const movies = await Movie.find({ posterUrl: { $exists: false } });
    let modifiedCount = 0;
    for (const movie of movies) {
      movie.posterUrl = movie.poster || "https://via.placeholder.com/300x450?text=No+Poster";
      movie.backdropUrl = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1920";
      movie.trailerUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      movie.status = "now_showing";
      movie.isFeatured = true;
      await movie.save();
      modifiedCount++;
    }

    console.log(`Migration complete. Modified ${modifiedCount} documents.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

runMigration();
