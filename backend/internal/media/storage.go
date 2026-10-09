package media

import (
	"context"
	"fmt"
	"path/filepath"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/google/uuid"
	"github.com/slowsocial/backend/internal/config"
)

type StorageService struct {
	client       *s3.Client
	presign      *s3.PresignClient
	bucket       string
	cdnBaseURL   string
}

type PresignedUploadResponse struct {
	UploadURL   string `json:"upload_url"`
	FileKey     string `json:"file_key"`
	PublicURL   string `json:"public_url"`
	ExpiresIn   int64  `json:"expires_in_seconds"`
}

func NewStorageService(cfg *config.Config) (*StorageService, error) {
	customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		if cfg.S3Endpoint != "" {
			return aws.Endpoint{
				PartitionID:       "aws",
				URL:               cfg.S3Endpoint,
				SigningRegion:     cfg.S3Region,
				HostnameImmutable: true,
			}, nil
		}
		return aws.Endpoint{}, &aws.EndpointNotFoundError{}
	})

	s3Config := aws.Config{
		Region:                      cfg.S3Region,
		Credentials:                 credentials.NewStaticCredentialsProvider(cfg.S3AccessKey, cfg.S3SecretKey, ""),
		EndpointResolverWithOptions: customResolver,
	}

	client := s3.NewFromConfig(s3Config, func(o *s3.Options) {
		o.UsePathStyle = true // Necessário para MinIO e compatibilidade S3 local
	})

	presignClient := s3.NewPresignClient(client)

	return &StorageService{
		client:     client,
		presign:    presignClient,
		bucket:     cfg.S3Bucket,
		cdnBaseURL: cfg.CDNBaseURL,
	}, nil
}

// GeneratePresignedUploadURL gera uma URL segura temporária para upload direto do cliente para o S3
func (s *StorageService) GeneratePresignedUploadURL(ctx context.Context, folder string, filename string, contentType string) (*PresignedUploadResponse, error) {
	ext := filepath.Ext(filename)
	uniqueKey := fmt.Sprintf("%s/%s%s", folder, uuid.New().String(), ext)

	lifetime := 15 * time.Minute

	presignedReq, err := s.presign.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(s.bucket),
		Key:         aws.String(uniqueKey),
		ContentType: aws.String(contentType),
	}, s3.WithPresignExpires(lifetime))

	if err != nil {
		return nil, fmt.Errorf("falha ao gerar url pré-assinada s3: %w", err)
	}

	publicURL := fmt.Sprintf("%s/%s", s.cdnBaseURL, uniqueKey)

	return &PresignedUploadResponse{
		UploadURL: presignedReq.URL,
		FileKey:   uniqueKey,
		PublicURL: publicURL,
		ExpiresIn: int64(lifetime.Seconds()),
	}, nil
}
