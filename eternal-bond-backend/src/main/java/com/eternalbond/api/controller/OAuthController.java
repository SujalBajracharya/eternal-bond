package com.eternalbond.api.controller;

import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class OAuthController {

    @GetMapping("/google-success")
    public String loginSuccess(@AuthenticationPrincipal OAuth2User user,
                               HttpSession session) {

        String email = user.getAttribute("email");
        String name = user.getAttribute("name");

        session.setAttribute("email", email);
        session.setAttribute("name", name);

        return "redirect:http://localhost:5173/";
    }
}