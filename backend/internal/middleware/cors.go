package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// CORS configures cross-origin access for the frontend (Netlify) origin(s).
func CORS(allowedOrigin string) gin.HandlerFunc {
	allowed := map[string]bool{
		allowedOrigin:               true,
		"http://localhost:3000":     true,
		"https://thevhomes.com":     true,
		"https://www.thevhomes.com": true,
	}

	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		if allowed[origin] {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Access-Control-Allow-Credentials", "true")
		}
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}
