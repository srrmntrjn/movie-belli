// TMDB API Client

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_ACCESS_TOKEN = process.env.TMDB_ACCESS_TOKEN;
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  adult: boolean;
  original_language: string;
  original_title: string;
}

export interface SearchMoviesResponse {
  page: number;
  results: Movie[];
  total_pages: number;
  total_results: number;
}

export interface MovieDetails extends Movie {
  runtime: number;
  genres: { id: number; name: string }[];
  budget: number;
  revenue: number;
  status: string;
  tagline: string;
}

class TMDBClient {
  private headers: HeadersInit;

  constructor() {
    this.headers = {
      Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    };
  }

  /**
   * Search for movies by title
   */
  async searchMovies(
    query: string,
    page: number = 1
  ): Promise<SearchMoviesResponse> {
    if (!query.trim()) {
      return {
        page: 1,
        results: [],
        total_pages: 0,
        total_results: 0,
      };
    }

    const url = `${BASE_URL}/search/movie?query=${encodeURIComponent(
      query
    )}&page=${page}&include_adult=false`;

    const response = await fetch(url, { headers: this.headers });

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get detailed information about a specific movie
   */
  async getMovie(id: number): Promise<MovieDetails> {
    const url = `${BASE_URL}/movie/${id}`;
    const response = await fetch(url, { headers: this.headers });

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get popular movies
   */
  async getPopular(page: number = 1): Promise<SearchMoviesResponse> {
    const url = `${BASE_URL}/movie/popular?page=${page}`;
    const response = await fetch(url, { headers: this.headers });

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get trending movies
   */
  async getTrending(
    timeWindow: "day" | "week" = "week"
  ): Promise<SearchMoviesResponse> {
    const url = `${BASE_URL}/trending/movie/${timeWindow}`;
    const response = await fetch(url, { headers: this.headers });

    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get image URL for a poster
   */
  getPosterUrl(path: string | null, size: string = "w500"): string | null {
    if (!path) return null;
    return `${IMAGE_BASE_URL}/${size}${path}`;
  }

  /**
   * Get image URL for a backdrop
   */
  getBackdropUrl(path: string | null, size: string = "w1280"): string | null {
    if (!path) return null;
    return `${IMAGE_BASE_URL}/${size}${path}`;
  }
}

// Export singleton instance
export const tmdb = new TMDBClient();
