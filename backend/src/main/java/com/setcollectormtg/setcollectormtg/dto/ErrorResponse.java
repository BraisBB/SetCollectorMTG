package com.setcollectormtg.setcollectormtg.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
public class ErrorResponse {
    private String code;
    private String message;
    private Map<String, String> errors;
    private LocalDateTime timestamp;
    private String path;
    private String details;
    private Integer status;
}