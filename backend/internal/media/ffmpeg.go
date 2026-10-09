package media

import (
	"context"
	"fmt"
	"os/exec"
	"path/filepath"
)

type FFmpegProcessor struct {
	ffmpegPath string
}

func NewFFmpegProcessor() *FFmpegProcessor {
	path, err := exec.LookPath("ffmpeg")
	if err != nil {
		path = "ffmpeg" // Fallback para PATH padrão
	}
	return &FFmpegProcessor{ffmpegPath: path}
}

// GenerateThumbnail extrai uma captura do vídeo em 1 segundo e salva em JPEG otimizado
func (f *FFmpegProcessor) GenerateThumbnail(ctx context.Context, inputPath, outputPath string) error {
	cmd := exec.CommandContext(ctx, f.ffmpegPath,
		"-y",                 // Sobrescrever se existir
		"-ss", "00:00:01",    // Posição: 1 segundo
		"-i", inputPath,      // Arquivo de entrada
		"-vframes", "1",      // Apenas 1 frame
		"-vf", "scale=720:-1", // Escalar largura para 720 mantendo aspect ratio
		"-q:v", "3",          // Alta qualidade visual
		outputPath,
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("erro no ffmpeg ao gerar thumbnail (%s): %w", string(output), err)
	}
	return nil
}

// TranscodeHLS converte um vídeo MP4/MOV em formato de streaming adaptativo HLS (.m3u8 + chunks .ts)
func (f *FFmpegProcessor) TranscodeHLS(ctx context.Context, inputPath, outputDir string) error {
	playlistPath := filepath.Join(outputDir, "master.m3u8")
	segmentPattern := filepath.Join(outputDir, "segment_%03d.ts")

	cmd := exec.CommandContext(ctx, f.ffmpegPath,
		"-y",
		"-i", inputPath,
		"-c:v", "libx264",
		"-crf", "23",
		"-preset", "veryfast",
		"-c:a", "aac",
		"-b:a", "128k",
		"-hls_time", "4",
		"-hls_playlist_type", "vod",
		"-hls_segment_filename", segmentPattern,
		playlistPath,
	)

	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("erro no ffmpeg ao gerar hls (%s): %w", string(output), err)
	}
	return nil
}
