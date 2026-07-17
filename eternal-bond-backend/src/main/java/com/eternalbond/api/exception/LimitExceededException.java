package com.eternalbond.api.exception;

/**
 * Thrown when a user attempts an action that would exceed their tier's limit.
 * For example: sending a like when the daily like limit is reached.
 */
public class LimitExceededException extends RuntimeException {

    public LimitExceededException(String message) {
        super(message);
    }

    public LimitExceededException(String message, Throwable cause) {
        super(message, cause);
    }
}
