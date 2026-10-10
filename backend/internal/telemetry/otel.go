package telemetry

import (
	"context"
	"fmt"
	"log"

	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
	"go.opentelemetry.io/otel/trace"
)

var Tracer trace.Tracer

// InitTracer inicializa o OpenTelemetry TracerProvider para observabilidade distribuída
func InitTracer(ctx context.Context, serviceName, environment string) (*sdktrace.TracerProvider, error) {
	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceNameKey.String(serviceName),
			semconv.DeploymentEnvironmentKey.String(environment),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("falha ao criar recurso otel: %w", err)
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithSampler(sdktrace.AlwaysSample()),
		sdktrace.WithResource(res),
	)

	otel.SetTracerProvider(tp)
	otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(
		propagation.TraceContext{},
		propagation.Baggage{},
	))

	Tracer = tp.Tracer(serviceName)
	log.Printf("🔭 OpenTelemetry Tracer ativo para o serviço: %s (%s)", serviceName, environment)

	return tp, nil
}
