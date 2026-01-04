export const MOVIE_CATEGORIES = [
  { id: "action", label: "Action" },
  { id: "adventure", label: "Adventure" },
  { id: "comedy", label: "Comedy" },
  { id: "drama", label: "Drama" },
  { id: "horror", label: "Horror" },
  { id: "romance", label: "Romance" },
  { id: "sci-fi", label: "Sci-Fi" },
  { id: "thriller", label: "Thriller" },
  { id: "animation", label: "Animation" },
  { id: "documentary", label: "Documentary" },
] as const;

export type MovieCategory = (typeof MOVIE_CATEGORIES)[number]["id"];

export const isMovieCategory = (value: string): value is MovieCategory =>
  MOVIE_CATEGORIES.some((category) => category.id === value);
