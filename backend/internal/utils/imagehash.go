package utils

import (
	"errors"
	"image"
	"io"
	"math/bits"
	"net/http"
	"strconv"
	"time"

	_ "image/gif"  // register GIF decoder
	_ "image/jpeg" // register JPEG decoder
	_ "image/png"  // register PNG decoder
)

// ErrUnsupportedImageFormat is returned when a fetched file is not a
// recognisable image.
var ErrUnsupportedImageFormat = errors.New("unsupported image format")

// DuplicateThreshold is the Hamming distance at or below which two perceptual
// hashes are treated as the same photo. 5 differing bits out of 64 tolerates
// re-compression, resizing, and light watermarking while still rejecting two
// genuinely different rooms.
const DuplicateThreshold = 5

// imageFetchClient bounds how long a listing submission can be held up by a
// slow image host. Hashing is best-effort: a fetch failure never blocks a
// listing, it just means that image isn't dedup-checked.
var imageFetchClient = &http.Client{Timeout: 8 * time.Second}

// maxImageBytes caps how much of a remote file we read before giving up, so a
// malicious or misconfigured URL can't exhaust memory.
const maxImageBytes = 12 << 20 // 12 MiB

// DHashURL fetches the image at url and returns its 64-bit difference hash.
//
// A difference hash is perceptual: visually identical images produce identical
// or near-identical hashes even when resized, re-encoded at a different JPEG
// quality, or renamed. That is what lets TheVHomes catch an agent re-uploading
// the same photo under a new filename, which plain URL comparison misses.
func DHashURL(url string) (uint64, error) {
	resp, err := imageFetchClient.Get(url)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, errors.New("failed to fetch image: " + resp.Status)
	}

	return DHash(io.LimitReader(resp.Body, maxImageBytes))
}

// DHash decodes an image from r and returns its 64-bit difference hash.
func DHash(r io.Reader) (uint64, error) {
	img, _, err := image.Decode(r)
	if err != nil {
		return 0, ErrUnsupportedImageFormat
	}
	return computeDHash(img), nil
}

// computeDHash implements the difference-hash algorithm:
//
//  1. Sample the image down to a 9×8 grayscale grid — only gradient structure
//     matters, not colour or resolution.
//  2. For each row, compare each pixel with its right-hand neighbour.
//  3. Pack those 8 rows × 8 comparisons into a uint64.
//
// The result survives compression artifacts and rescaling, which is exactly
// the transformation an image goes through between two separate uploads.
func computeDHash(img image.Image) uint64 {
	bounds := img.Bounds()
	width, height := bounds.Dx(), bounds.Dy()
	if width == 0 || height == 0 {
		return 0
	}

	const cols, rows = 9, 8
	var gray [rows][cols]uint32
	for y := 0; y < rows; y++ {
		srcY := bounds.Min.Y + (y*height)/rows
		for x := 0; x < cols; x++ {
			srcX := bounds.Min.X + (x*width)/cols
			r, g, b, _ := img.At(srcX, srcY).RGBA()
			// Rec. 601 luma, kept in 16-bit space to avoid rounding loss.
			gray[y][x] = (299*r + 587*g + 114*b) / 1000
		}
	}

	var hash uint64
	for y := 0; y < rows; y++ {
		for x := 0; x < cols-1; x++ {
			if gray[y][x] > gray[y][x+1] {
				hash |= 1 << uint(y*8+x)
			}
		}
	}
	return hash
}

// HammingDistance returns how many of the 64 bits differ between two hashes.
// See DuplicateThreshold for the cutoff used by the publishing pipeline.
func HammingDistance(a, b uint64) int {
	return bits.OnesCount64(a ^ b)
}

// IsPerceptualDuplicate reports whether two hashes represent the same photo.
func IsPerceptualDuplicate(a, b uint64) bool {
	return HammingDistance(a, b) <= DuplicateThreshold
}

// FormatDHash renders a hash as a fixed-width 16-character hex string for
// logging and for storage in text columns.
func FormatDHash(hash uint64) string {
	s := strconv.FormatUint(hash, 16)
	for len(s) < 16 {
		s = "0" + s
	}
	return s
}

// ParseDHash is the inverse of FormatDHash.
func ParseDHash(s string) (uint64, error) {
	return strconv.ParseUint(s, 16, 64)
}
