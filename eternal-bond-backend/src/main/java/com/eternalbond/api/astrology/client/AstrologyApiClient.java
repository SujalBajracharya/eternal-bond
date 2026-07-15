package com.eternalbond.api.astrology.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.netty.channel.ChannelOption;
import io.netty.handler.timeout.ReadTimeoutHandler;
import io.netty.handler.timeout.WriteTimeoutHandler;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.netty.http.client.HttpClient;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
public class AstrologyApiClient {

    private static final int      CONNECT_TIMEOUT_MS = 5_000;
    private static final int      READ_TIMEOUT_S     = 15;
    private static final int      WRITE_TIMEOUT_S    = 10;
    private static final Duration REQUEST_TIMEOUT    = Duration.ofSeconds(20);

    private final WebClient    webClient;
    private final String       apiKey;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AstrologyApiClient(
            @Value("${free-astrology-api.base-url}") String baseUrl,
            @Value("${free-astrology-api.api-key}")  String apiKey) {

        this.apiKey = apiKey;

        HttpClient httpClient = HttpClient.create()
                .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, CONNECT_TIMEOUT_MS)
                .doOnConnected(conn -> conn
                        .addHandlerLast(new ReadTimeoutHandler(READ_TIMEOUT_S, TimeUnit.SECONDS))
                        .addHandlerLast(new WriteTimeoutHandler(WRITE_TIMEOUT_S, TimeUnit.SECONDS)));

        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .defaultHeader(HttpHeaders.ACCEPT,       MediaType.APPLICATION_JSON_VALUE)
                .clientConnector(new ReactorClientHttpConnector(httpClient))
                .build();

        log.info("AstrologyApiClient initialised — base URL: {}", baseUrl);
    }

    /**
     * Calls {@code /match-making/ashtakoot-score} and returns the parsed response.
     *
     * <p>The raw JSON body is logged at INFO level before parsing so that any
     * field-name mismatches can be diagnosed from the Spring Boot logs.
     */
    public AstrologyMatchResponse fetchAshtakootScore(AstrologyMatchRequest request) {
        log.info("Calling Astrology API — male {}/{}/{}, female {}/{}/{}",
                request.getMale().getYear(),   request.getMale().getMonth(),   request.getMale().getDate(),
                request.getFemale().getYear(), request.getFemale().getMonth(), request.getFemale().getDate());

        try {
            // ── Step 1: get raw String so we can log + parse independently ──
            String rawJson = webClient.post()
                    .uri("/match-making/ashtakoot-score")
                    .header("x-api-key", apiKey)
                    .bodyValue(request)
                    .retrieve()
                    .onStatus(
                            status -> status.value() == 401 || status.value() == 403,
                            clientResponse -> clientResponse.bodyToMono(String.class)
                                    .defaultIfEmpty("(empty body)")
                                    .flatMap(body -> {
                                        log.error("Astrology API auth failure — status: {}, body: {}",
                                                clientResponse.statusCode(), body);
                                        return Mono.error(new IllegalStateException(
                                                "Astrology API authentication failed ("
                                                + clientResponse.statusCode()
                                                + "). Check free-astrology-api.api-key."));
                                    })
                    )
                    .onStatus(
                            status -> status.value() == 429,
                            clientResponse -> {
                                log.warn("Astrology API rate limit hit");
                                return Mono.error(new AstrologyRateLimitException(
                                        "Free Astrology API rate limit exceeded. Try again later."));
                            }
                    )
                    .onStatus(
                            status -> status.is5xxServerError(),
                            clientResponse -> clientResponse.bodyToMono(String.class)
                                    .defaultIfEmpty("(empty body)")
                                    .flatMap(body -> {
                                        log.error("Astrology API 5xx — status: {}, body: {}",
                                                clientResponse.statusCode(), body);
                                        return Mono.error(new AstrologyApiException(
                                                "Astrology API server error (" + clientResponse.statusCode() + ")."));
                                    })
                    )
                    .bodyToMono(String.class)
                    .timeout(REQUEST_TIMEOUT,
                             Mono.error(new AstrologyApiException(
                                     "Astrology API timed out after " + REQUEST_TIMEOUT.getSeconds() + "s.")))
                    .block();

            if (rawJson == null || rawJson.isBlank()) {
                log.error("Astrology API returned an empty body");
                throw new AstrologyApiException("Astrology API returned an empty response.");
            }

            // ── Step 2: log the full JSON so we can inspect field names ─────
            log.info("=== RAW Astrology API response ===\n{}", prettyPrint(rawJson));

            // ── Step 3: navigate into "output" node, then deserialise ────────
            JsonNode root = objectMapper.readTree(rawJson);
            log.info("Top-level fields in response: {}", fieldNames(root));

            JsonNode outputNode = root.path("output");
            if (outputNode.isMissingNode() || outputNode.isNull()) {
                log.error("Astrology API response missing expected 'output' node. Root fields: {}",
                        fieldNames(root));
                throw new AstrologyApiException(
                        "Astrology API response format changed: 'output' node not found.");
            }

            log.info("'output' node fields: {}", fieldNames(outputNode));

            AstrologyMatchResponse parsed =
                    objectMapper.treeToValue(outputNode, AstrologyMatchResponse.class);

            log.info("Parsed — totalScore: {}/{}",
                    parsed.getTotalScore(), parsed.getOutOf());

            return parsed;

        } catch (AstrologyApiException | AstrologyRateLimitException | IllegalStateException e) {
            throw e;
        } catch (WebClientResponseException e) {
            log.error("Unhandled HTTP error — status: {}, body: {}",
                    e.getStatusCode(), e.getResponseBodyAsString(), e);
            throw new AstrologyApiException(
                    "HTTP error from Astrology API (" + e.getStatusCode() + "): " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error calling Astrology API: {}", e.getMessage(), e);
            throw new AstrologyApiException(
                    "Failed to contact Astrology API: " + e.getMessage(), e);
        }
    }

    // ── Diagnostic helpers ────────────────────────────────────────────────────

    private String prettyPrint(String json) {
        try {
            Object obj = objectMapper.readValue(json, Object.class);
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(obj);
        } catch (Exception e) {
            return json; // return raw if pretty-print fails
        }
    }

    private String fieldNames(JsonNode node) {
        if (node == null || !node.isObject()) return "(not an object)";
        java.util.List<String> names = new java.util.ArrayList<>();
        node.fieldNames().forEachRemaining(names::add);
        return names.toString();
    }

    // ── Typed exceptions ──────────────────────────────────────────────────────

    public static class AstrologyApiException extends RuntimeException {
        public AstrologyApiException(String message)                  { super(message); }
        public AstrologyApiException(String message, Throwable cause) { super(message, cause); }
    }

    public static class AstrologyRateLimitException extends RuntimeException {
        public AstrologyRateLimitException(String message) { super(message); }
    }
}
