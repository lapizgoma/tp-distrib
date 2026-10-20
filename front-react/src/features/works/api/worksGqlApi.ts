import type { Work, WorkFilters } from '../types/works.types';

const GRAPHQL_URL = '/api/graphql';

export async function getWorks(filters: WorkFilters = {}, signal?: AbortSignal): Promise<Work[]> {
  const query = `
    query GetWorks(
      $keyword: String, 
      $era: String, 
      $technique: String, 
      $location: String, 
      $availability: Availability
    ) {
      works(
        keyword: $keyword, 
        era: $era, 
        technique: $technique, 
        location: $location, 
        availability: $availability
      ) {
        id
        title
        image_url
        creation_year
        technique
        dimensions
        era
        description
        location
        availability
        artist {
          name
          biography
        }
        comments {
          user
          text
          date
        }
      }
    }
  `;

  const variables = Object.fromEntries(
    Object.entries(filters).filter((entry) => entry[1] !== undefined && entry[1] !== '')
  );

  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables,
    }),
    signal,
  });

  const result = await response.json();

  if (result.errors && result.errors.length > 0) {
    throw new Error(result.errors[0]?.message || 'Error al obtener las obras del catálogo');
  }

  return result.data.works;
}