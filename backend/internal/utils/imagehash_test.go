package utils

import (
	"bytes"
	"image"
	"image/color"
	"image/jpeg"
	"image/png"
	"testing"
)

// gradient builds a deterministic test image: a diagonal luminance ramp with a
// bright block, which produces a non-trivial hash (not all-zero/all-one).
func gradient(w, h int, shift int) image.Image {
	img := image.NewRGBA(image.Rect(0, 0, w, h))
	for y := 0; y < h; y++ {
		for x := 0; x < w; x++ {
			v := uint8(((x+shift)*255/w + y*255/h) / 2)
			img.Set(x, y, color.RGBA{R: v, G: v, B: v, A: 255})
		}
	}
	// A bright square so the gradient isn't perfectly monotonic.
	for y := h / 4; y < h/2; y++ {
		for x := w / 3; x < 2*w/3; x++ {
			img.Set(x, y, color.RGBA{R: 250, G: 250, B: 250, A: 255})
		}
	}
	return img
}

func encodePNG(t *testing.T, img image.Image) []byte {
	t.Helper()
	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		t.Fatalf("png.Encode: %v", err)
	}
	return buf.Bytes()
}

func encodeJPEG(t *testing.T, img image.Image, quality int) []byte {
	t.Helper()
	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: quality}); err != nil {
		t.Fatalf("jpeg.Encode: %v", err)
	}
	return buf.Bytes()
}

func hashBytes(t *testing.T, b []byte) uint64 {
	t.Helper()
	h, err := DHash(bytes.NewReader(b))
	if err != nil {
		t.Fatalf("DHash: %v", err)
	}
	return h
}

func TestDHashIsStableAcrossReEncoding(t *testing.T) {
	original := gradient(400, 300, 0)

	pngHash := hashBytes(t, encodePNG(t, original))
	highJPEG := hashBytes(t, encodeJPEG(t, original, 95))
	lowJPEG := hashBytes(t, encodeJPEG(t, original, 40))

	// Re-encoding the same photo must stay within the duplicate threshold —
	// this is the case plain URL comparison cannot catch.
	if d := HammingDistance(pngHash, highJPEG); d > DuplicateThreshold {
		t.Errorf("PNG vs high-quality JPEG distance = %d, want <= %d", d, DuplicateThreshold)
	}
	if d := HammingDistance(pngHash, lowJPEG); d > DuplicateThreshold {
		t.Errorf("PNG vs low-quality JPEG distance = %d, want <= %d", d, DuplicateThreshold)
	}
	if !IsPerceptualDuplicate(pngHash, lowJPEG) {
		t.Error("IsPerceptualDuplicate(png, lowJPEG) = false, want true")
	}
}

func TestDHashIsStableAcrossResize(t *testing.T) {
	full := hashBytes(t, encodePNG(t, gradient(800, 600, 0)))
	small := hashBytes(t, encodePNG(t, gradient(200, 150, 0)))

	if d := HammingDistance(full, small); d > DuplicateThreshold {
		t.Errorf("800x600 vs 200x150 distance = %d, want <= %d", d, DuplicateThreshold)
	}
}

func TestDHashDistinguishesDifferentImages(t *testing.T) {
	a := hashBytes(t, encodePNG(t, gradient(400, 300, 0)))

	flat := image.NewRGBA(image.Rect(0, 0, 400, 300))
	for y := 0; y < 300; y++ {
		for x := 0; x < 400; x++ {
			// Vertical bars — structurally unlike the diagonal ramp.
			v := uint8(0)
			if (x/20)%2 == 0 {
				v = 240
			}
			flat.Set(x, y, color.RGBA{R: v, G: v, B: v, A: 255})
		}
	}
	b := hashBytes(t, encodePNG(t, flat))

	if IsPerceptualDuplicate(a, b) {
		t.Errorf("distinct images reported as duplicates (distance %d)", HammingDistance(a, b))
	}
}

func TestDHashRejectsNonImages(t *testing.T) {
	if _, err := DHash(bytes.NewReader([]byte("this is not an image"))); err == nil {
		t.Error("DHash on garbage input returned nil error, want ErrUnsupportedImageFormat")
	}
}

func TestFormatAndParseDHash(t *testing.T) {
	for _, want := range []uint64{0, 1, 0xdeadbeef, 0xFFFFFFFFFFFFFFFF} {
		s := FormatDHash(want)
		if len(s) != 16 {
			t.Errorf("FormatDHash(%d) = %q, want 16 characters", want, s)
		}
		got, err := ParseDHash(s)
		if err != nil {
			t.Errorf("ParseDHash(%q) error: %v", s, err)
			continue
		}
		if got != want {
			t.Errorf("round trip of %d gave %d", want, got)
		}
	}
}

func TestHammingDistance(t *testing.T) {
	cases := []struct {
		a, b uint64
		want int
	}{
		{0, 0, 0},
		{0, 1, 1},
		{0b1010, 0b0101, 4},
		{0xFFFFFFFFFFFFFFFF, 0, 64},
	}
	for _, c := range cases {
		if got := HammingDistance(c.a, c.b); got != c.want {
			t.Errorf("HammingDistance(%d, %d) = %d, want %d", c.a, c.b, got, c.want)
		}
	}
}
