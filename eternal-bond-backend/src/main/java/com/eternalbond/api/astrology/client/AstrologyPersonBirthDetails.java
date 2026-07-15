package com.eternalbond.api.astrology.client;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AstrologyPersonBirthDetails {
    private int year;
    private int month;
    private int date;
    private int hours;
    private int minutes;
    private int seconds;
    private double latitude;
    private double longitude;
    private double timezone;
}
