package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// RequireRole restricts a route to one or more roles. Must run after AuthRequired.
func RequireRole(roles ...string) gin.HandlerFunc {
	allowed := make(map[string]bool, len(roles))
	for _, r := range roles {
		allowed[r] = true
	}

	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists || !allowed[role.(string)] {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"success": false, "message": "insufficient permissions"})
			return
		}
		c.Next()
	}
}
