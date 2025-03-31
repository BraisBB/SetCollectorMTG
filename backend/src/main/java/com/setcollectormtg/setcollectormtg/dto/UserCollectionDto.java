package com.setcollectormtg.setcollectormtg.dto;

import lombok.Data;

@Data
public class UserCollectionDto {
    private Long collectionId;
    private Long userId;
    private Integer nCopies;
}