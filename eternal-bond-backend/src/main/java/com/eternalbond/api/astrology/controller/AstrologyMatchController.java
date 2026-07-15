package com.eternalbond.api.astrology.controller;

import com.eternalbond.api.astrology.client.AstrologyApiClient.AstrologyApiException;
import com.eternalbond.api.astrology.client.AstrologyApiClient.AstrologyRateLimitException;
import com.eternalbond.api.astrology.dto.AstrologyMatchResultDto;
import com.eternalbond.api.astrology.service.AstrologyMatchService;
import com.eternalbond.api.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for Vedic astrology compatibility calculations.
 *
 * <p>All external API models remain hidden behind the service boundary.
 * Only {@link AstrologyMatchResultDto} is used in the response body.
 */
@Slf4j
@RestController
@RequestMapping("/api/astrology/match")
@RequiredArgsConstructor
public class AstrologyMatchController {

    private final AstrologyMatchService astrologyMatchService;

    /**
     * Computes the Ashtakoot compatibility score between the authenticated user
     * and a target profile.
     *
     * <p>Both profiles must have Kundali (birth) data saved via
     * {@code POST /api/astrology/profile} before this endpoint can succeed.
     *
     * @param myProfileId    the authenticated user's profile ID (from JWT)
     * @param targetProfileId the profile ID of the person to match against
     * @return {@link AstrologyMatchResultDto} containing per-Koota breakdown and total score
     */
    @GetMapping("/{targetProfileId}")
    public ResponseEntity<?> getAshtakootScore(
            @AuthenticationPrincipal String myProfileId,
            @PathVariable String targetProfileId) {

        if (myProfileId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(errorBody("Authentication required."));
        }

        if (myProfileId.equals(targetProfileId)) {
            return ResponseEntity.badRequest()
                    .body(errorBody("Cannot calculate compatibility score with yourself."));
        }

        log.info("Ashtakoot score request — requester: {}, target: {}", myProfileId, targetProfileId);

        try {
            AstrologyMatchResultDto result =
                    astrologyMatchService.calculateAshtakootScore(myProfileId, targetProfileId);
            return ResponseEntity.ok(result);

        } catch (ResourceNotFoundException e) {
            log.warn("Resource not found for match calculation: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(errorBody(e.getMessage()));

        } catch (AstrologyRateLimitException e) {
            log.warn("Rate limit hit on Astrology API: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(errorBody(e.getMessage()));

        } catch (IllegalStateException e) {
            // API key / authentication misconfiguration
            log.error("Astrology API authentication error: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(errorBody("Astrology service is currently unavailable. Please try again later."));

        } catch (AstrologyApiException e) {
            log.error("Astrology API failure: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(errorBody("Astrology service returned an error. Please try again later."));

        } catch (IllegalArgumentException e) {
            log.warn("Invalid request for match calculation: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(errorBody(e.getMessage()));
        }
    }

    private static java.util.Map<String, String> errorBody(String message) {
        return java.util.Map.of("error", message);
    }
}
