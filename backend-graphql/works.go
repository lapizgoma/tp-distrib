package main

import (
	"github.com/graphql-go/graphql"
)

// ---------- Structs de Go ----------

type Artist struct {
	Name      string `json:"name"`
	Biography string `json:"biography"`
}

type Comment struct {
	User string `json:"user"`
	Text string `json:"text"`
	Date string `json:"date"`
}

type Work struct {
	ID           string    `json:"id"`
	Title        string    `json:"title"`
	Artist       Artist    `json:"artist"`
	ImageURL     string    `json:"image_url"`
	CreationYear int       `json:"creation_year"`
	Technique    string    `json:"technique"`
	Dimensions   string    `json:"dimensions"`
	Era          string    `json:"era"`
	Description  string    `json:"description"`
	Location     string    `json:"location"`
	Availability string    `json:"availability"`
	Comments     []Comment `json:"comments"`
}

// ---------- Tipos GraphQL ----------

var availabilityEnum = graphql.NewEnum(graphql.EnumConfig{
	Name:        "Availability",
	Description: "Estado de disponibilidad de una obra dentro del museo.",
	Values: graphql.EnumValueConfigMap{
		"EN_EXHIBICION": &graphql.EnumValueConfig{
			Value:       "EN_EXHIBICION",
			Description: "La obra está expuesta al público en una sala.",
		},
		"EN_DEPOSITO": &graphql.EnumValueConfig{
			Value:       "EN_DEPOSITO",
			Description: "La obra está guardada en el depósito y no se puede visitar.",
		},
	},
})

var artistType = graphql.NewObject(graphql.ObjectConfig{
	Name:        "Artist",
	Description: "Artista autor de una obra.",
	Fields: graphql.Fields{
		"name":      &graphql.Field{Type: graphql.String, Description: "Nombre del artista."},
		"biography": &graphql.Field{Type: graphql.String, Description: "Reseña biográfica del artista."},
	},
})

var commentType = graphql.NewObject(graphql.ObjectConfig{
	Name:        "Comment",
	Description: "Comentario que un usuario dejó sobre una obra.",
	Fields: graphql.Fields{
		"user": &graphql.Field{Type: graphql.String, Description: "Nombre y apellido de quien comentó."},
		"text": &graphql.Field{Type: graphql.String, Description: "Contenido del comentario."},
		"date": &graphql.Field{Type: graphql.String, Description: "Fecha y hora del comentario."},
	},
})

var workType = graphql.NewObject(graphql.ObjectConfig{
	Name:        "Work",
	Description: "Una obra del catálogo del museo.",
	Fields: graphql.Fields{
		"id":            &graphql.Field{Type: graphql.ID, Description: "Identificador único de la obra."},
		"title":         &graphql.Field{Type: graphql.String, Description: "Título de la obra."},
		"artist":        &graphql.Field{Type: artistType, Description: "Artista autor de la obra."},
		"image_url":     &graphql.Field{Type: graphql.String, Description: "URL de la imagen de la obra."},
		"creation_year": &graphql.Field{Type: graphql.Int, Description: "Año de creación. Vale 0 si no se conoce."},
		"technique": &graphql.Field{
			Type:        graphql.String,
			Description: "Código de la técnica: OLEO, ACRILICO, ACUARELA, TEMPLE o ESCULTURA.",
		},
		"dimensions": &graphql.Field{
			Type:        graphql.String,
			Description: "Dimensiones de la obra, en texto libre (ej. \"73,7 x 92,1 cm\").",
		},
		"era": &graphql.Field{
			Type: graphql.String,
			Description: "Código de la época: RENACIMIENTO, BARROCO, IMPRESIONISMO, " +
				"VANGUARDIA o CONTEMPORANEO.",
		},
		"description": &graphql.Field{Type: graphql.String, Description: "Descripción de la obra."},
		"location": &graphql.Field{
			Type: graphql.String,
			Description: "Código de la ubicación: SALA_1_GRANDES_MAESTROS, SALA_2_IMPRESIONISMO, " +
				"SALA_3_VANGUARDIAS, SALA_4_ARTE_MODERNO o DEPOSITO.",
		},
		"availability": &graphql.Field{
			Type:        availabilityEnum,
			Description: "Si la obra está en exhibición o en depósito.",
		},
		"comments": &graphql.Field{
			Type:        graphql.NewList(commentType),
			Description: "Comentarios de los visitantes. Todavía no implementado: devuelve null.",
		},
	},
})

// ---------- Query: works (con filtros opcionales) ----------

var worksField = &graphql.Field{
	Type: graphql.NewList(workType),
	Description: "Catálogo de obras del museo. Todos los filtros son opcionales y se pueden " +
		"combinar: la obra tiene que cumplir todos los que se envíen. Sin filtros devuelve todo el catálogo.",
	Args: graphql.FieldConfigArgument{
		"keyword": &graphql.ArgumentConfig{
			Type: graphql.String,
			Description: "Texto a buscar (coincidencia parcial) en el título, la descripción " +
				"o el nombre del artista.",
		},
		"era": &graphql.ArgumentConfig{
			Type: graphql.String,
			Description: "Filtra por época. Usa códigos, no texto libre: RENACIMIENTO, BARROCO, " +
				"IMPRESIONISMO, VANGUARDIA o CONTEMPORANEO.",
		},
		"technique": &graphql.ArgumentConfig{
			Type: graphql.String,
			Description: "Filtra por técnica. Usa códigos, no texto libre: OLEO, ACRILICO, " +
				"ACUARELA, TEMPLE o ESCULTURA.",
		},
		"location": &graphql.ArgumentConfig{
			Type: graphql.String,
			Description: "Filtra por ubicación. Usa códigos, no texto libre: SALA_1_GRANDES_MAESTROS, " +
				"SALA_2_IMPRESIONISMO, SALA_3_VANGUARDIAS, SALA_4_ARTE_MODERNO o DEPOSITO.",
		},
		"availability": &graphql.ArgumentConfig{
			Type:        availabilityEnum,
			Description: "Filtra por disponibilidad: EN_EXHIBICION o EN_DEPOSITO.",
		},
	},
	Resolve: func(p graphql.ResolveParams) (interface{}, error) {
		works, err := fetchWorks(p.Context, p.Args)
		if err != nil {
			return nil, err
		}
		return works, nil
	},
}
