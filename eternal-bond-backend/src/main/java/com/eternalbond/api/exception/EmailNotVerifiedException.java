package com.eternalbond.api.exception;

import org.springframework.security.core.AuthenticationException;

public class EmailNotVerifiedException extends AuthenticationException {
    public EmailNotVerifiedException(String msg) {
        super(msg);
    }
}
