"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
const exporter_trace_otlp_http_1 = require("@opentelemetry/exporter-trace-otlp-http");
const sdk_node_1 = require("@opentelemetry/sdk-node");
const sdk = new sdk_node_1.NodeSDK({
    traceExporter: new exporter_trace_otlp_http_1.OTLPTraceExporter(),
    instrumentations: [(0, auto_instrumentations_node_1.getNodeAutoInstrumentations)()],
});
sdk.start();
