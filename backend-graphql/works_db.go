package main

import (
	"context"
	"fmt"
)

func fetchWorks(ctx context.Context) ([]Work, error) {
	query := `
		SELECT
		    w.id,
		    w.title,
			a.name,
		    COALESCE(a.biography, ''),
		    w.image_url,
		    COALESCE(w.creation_year, 0),
		    COALESCE(w.technique, ''),
		    COALESCE(w.dimensions, ''),
		    COALESCE(w.era, ''),
		    COALESCE(w.description, ''),
		    COALESCE(w.location, ''),
		    w.availability
		FROM works w
		JOIN artists a ON a.id = w.artist_id
		ORDER BY w.id`

	rows, err := db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("falló la query de obras: %w", err)
	}
	defer rows.Close()

	var works []Work
	for rows.Next() {
		var w Work
		err := rows.Scan(
			&w.ID,
			&w.Title,
			&w.Artist.Name,
			&w.Artist.Biography,
			&w.ImageURL,
			&w.CreationYear,
			&w.Technique,
			&w.Dimensions,
			&w.Era,
			&w.Description,
			&w.Location,
			&w.Availability,
		)
		if err != nil {
			return nil, fmt.Errorf("falló el escaneo de obras: %w", err)
		}
		works = append(works, w)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("falló la iteración de obras: %w", err)
	}

	return works, nil
}
