import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '.env.local') });

const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const BASE_URL = "https://api.themoviedb.org/3";

async function searchMovies(query) {
  console.log(`\n🔍 Searching for movies with query: "${query}"\n`);

  const url = `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&page=1&include_adult=false`;

  const headers = {
    Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };

  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    const data = await response.json();

    console.log(`✅ Found ${data.total_results} results (showing page 1 of ${data.total_pages})\n`);

    if (data.results.length > 0) {
      console.log('Top 10 Results:');
      console.log('=' .repeat(80));

      data.results.slice(0, 10).forEach((movie, index) => {
        console.log(`\n${index + 1}. ${movie.title} (${movie.release_date?.substring(0, 4) || 'N/A'})`);
        console.log(`   ID: ${movie.id}`);
        console.log(`   Rating: ⭐ ${movie.vote_average.toFixed(1)}/10 (${movie.vote_count} votes)`);
        console.log(`   Overview: ${movie.overview.substring(0, 150)}${movie.overview.length > 150 ? '...' : ''}`);
      });

      console.log('\n' + '='.repeat(80));
    } else {
      console.log('No results found.');
    }

    return data;
  } catch (error) {
    console.error('❌ Error searching movies:', error.message);
    throw error;
  }
}

// Test search
searchMovies('together')
  .then(() => {
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
