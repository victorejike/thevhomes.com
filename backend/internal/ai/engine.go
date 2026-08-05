// Package ai provides TheVHomes AI Engine: a self-contained intelligent
// assistant for property completeness scoring, content moderation, search
// intelligence, and recommendations.
//
// The engine is designed with independent, replaceable modules so individual
// capabilities can be swapped or upgraded without touching the rest — e.g.
// swapping the completeness scorer from rule-based to ML-driven without
// changing how property_handler.go calls it.
//
// Core constraint from Phase 4 spec: "This AI is a core part of the platform
// and must not depend on proprietary third-party AI APIs for its core
// functionality." The rule-based completeness and moderation scorers here meet
// that requirement; the optional LLM-backed modules (conversation, advanced
// search parsing) gracefully degrade when no API key is configured.
package ai

import (
	"context"

	"github.com/thevhomes/backend/internal/models"
)

// Engine is the top-level interface to TheVHomes AI platform.
type Engine struct {
	Completeness CompletenessScorer
	Moderation   ModerationScorer
	// Future modules go here: Recommender, SearchIntelligence, etc.
}

// NewEngine constructs the AI engine with default rule-based modules.
func NewEngine() *Engine {
	return &Engine{
		Completeness: &RuleBasedCompletenessScorer{},
		Moderation:   &RuleBasedModerationScorer{},
	}
}

// EvaluateListing computes completeness and moderation scores for a property.
// Called by property_handler.Create after the listing is persisted but before
// the response is sent, so the scores are immediately visible to the agent.
//
// This is advisory/quality feedback, not a gate: a low completeness score does
// not block draft creation; it tells the agent what to improve before
// submitting for review.
func (e *Engine) EvaluateListing(ctx context.Context, property *models.Property) error {
	property.CompletenessScore = e.Completeness.Score(ctx, property)
	modScore, modStatus := e.Moderation.Score(ctx, property)
	property.ModerationScore = modScore
	property.ModerationStatus = modStatus
	return nil
}

// CompletenessScorer evaluates how fully a property listing is filled in.
type CompletenessScorer interface {
	// Score returns 0–100, where 100 means every recommended field is present
	// and the listing is ready for admin review.
	Score(ctx context.Context, property *models.Property) int
}

// ModerationScorer detects policy violations in listing content.
type ModerationScorer interface {
	// Score returns a confidence level (0–100) and a status.
	//
	// Statuses:
	//  - "clear": no issues detected
	//  - "pending_review": high confidence of a violation; route to admin review
	//  - "dismissed": previously flagged but an admin marked it safe
	//
	// Phase 4 requirement: "Do not automatically delete content. Instead: Assign
	// a moderation score." High scores trigger admin notification, never
	// auto-delete.
	Score(ctx context.Context, property *models.Property) (score int, status string)
}
