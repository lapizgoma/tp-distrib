package main

import (
	"context"
	"fmt"
	"strings"
)

func fetchWorks(ctx context.Context, args map[string]interface{}) ([]Work, error) {
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
		WHERE 1 = 1`

	var queryArgs []interface{}

	if era, ok := args["era"].(string); ok {
		query += " AND w.era = ?"
		queryArgs = append(queryArgs, era)
	}
	if technique, ok := args["technique"].(string); ok {
		query += " AND w.technique = ?"
		queryArgs = append(queryArgs, technique)
	}
	if location, ok := args["location"].(string); ok {
		query += " AND w.location = ?"
		queryArgs = append(queryArgs, location)
	}
	if availability, ok := args["availability"].(string); ok {
		query += " AND w.availability = ?"
		queryArgs = append(queryArgs, availability)
	}
	if keyword, ok := args["keyword"].(string); ok {
		query += " AND (w.title LIKE ? OR w.description LIKE ? OR a.name LIKE ?)"
		pattern := "%" + keyword + "%"
		queryArgs = append(queryArgs, pattern, pattern, pattern)
	}

	query += " ORDER BY w.id"

	rows, err := db.QueryContext(ctx, query, queryArgs...)
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

	// IDs de las obras encontradas, para pedir sus comentarios de una sola vez.
	workIDs := make([]string, len(works))
	for i, w := range works {
		workIDs[i] = w.ID
	}

	commentsByWork, err := fetchComments(ctx, workIDs)
	if err != nil {
		return nil, err
	}

	for i := range works {
		if comments, ok := commentsByWork[works[i].ID]; ok {
			works[i].Comments = comments
		} else {
			works[i].Comments = []Comment{}
		}
	}

	return works, nil
}

// fetchComments trae, en una sola consulta, los comentarios de varias obras.
// Devuelve un mapa: id de la obra -> sus comentarios, del más viejo al más nuevo.
func fetchComments(ctx context.Context, workIDs []string) (map[string][]Comment, error) {
	result := make(map[string][]Comment)
	if len(workIDs) == 0 {
		return result, nil
	}

	// Un "?" por cada id: "?,?,?" (sin la coma sobrante del final).
	placeholders := strings.TrimSuffix(strings.Repeat("?,", len(workIDs)), ",")

	query := `
		SELECT
		    c.work_id,
		    CONCAT_WS(' ', u.first_name, u.last_name),
		    c.text,
		    DATE_FORMAT(c.date, '%Y-%m-%dT%H:%i:%s')
		FROM comments c
		JOIN users u ON u.id = c.user_id
		WHERE c.work_id IN (` + placeholders + `)
		ORDER BY c.work_id, c.date, c.id`

	queryArgs := make([]interface{}, len(workIDs))
	for i, id := range workIDs {
		queryArgs[i] = id
	}

	rows, err := db.QueryContext(ctx, query, queryArgs...)
	if err != nil {
		return nil, fmt.Errorf("falló la query de comentarios: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var workID string
		var c Comment
		if err := rows.Scan(&workID, &c.User, &c.Text, &c.Date); err != nil {
			return nil, fmt.Errorf("falló el escaneo de comentarios: %w", err)
		}
		result[workID] = append(result[workID], c)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("falló la iteración de comentarios: %w", err)
	}

	return result, nil
}
