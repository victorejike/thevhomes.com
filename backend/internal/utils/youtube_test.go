package utils

import "testing"

func TestExtractYouTubeID(t *testing.T) {
	const want = "dQw4w9WgXcQ"

	valid := []string{
		"https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		"https://youtube.com/watch?v=dQw4w9WgXcQ&t=42s",
		"http://m.youtube.com/watch?v=dQw4w9WgXcQ",
		"https://youtu.be/dQw4w9WgXcQ",
		"https://youtu.be/dQw4w9WgXcQ?t=10",
		"https://www.youtube.com/embed/dQw4w9WgXcQ",
		"https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
		"https://www.youtube.com/shorts/dQw4w9WgXcQ",
		"https://www.youtube.com/live/dQw4w9WgXcQ",
		"www.youtube.com/watch?v=dQw4w9WgXcQ",
		"  https://www.youtube.com/watch?v=dQw4w9WgXcQ  ",
		"dQw4w9WgXcQ", // already-bare ID stays stable on re-submit
	}
	for _, in := range valid {
		got, err := ExtractYouTubeID(in)
		if err != nil {
			t.Errorf("ExtractYouTubeID(%q) returned error %v", in, err)
			continue
		}
		if got != want {
			t.Errorf("ExtractYouTubeID(%q) = %q, want %q", in, got, want)
		}
	}

	invalid := []string{
		"",
		"   ",
		"not a url",
		"https://vimeo.com/123456789",
		"https://www.youtube.com/",
		"https://www.youtube.com/watch?v=",
		"https://www.youtube.com/watch?v=tooshort",
		"https://youtu.be/",
		"https://example.com/watch?v=dQw4w9WgXcQ",
	}
	for _, in := range invalid {
		if got, err := ExtractYouTubeID(in); err == nil {
			t.Errorf("ExtractYouTubeID(%q) = %q, want error", in, got)
		}
	}
}
