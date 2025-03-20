package com.setcollectormtg.setcollectormtg.model;

import jakarta.persistence.Embeddable;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.util.Objects;

@Data
@Embeddable
public class UserCollectionCardId implements Serializable {

    private Long collectionId;
    private Long cardId;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserCollectionCardId that = (UserCollectionCardId) o;
        return Objects.equals(collectionId, that.collectionId) && Objects.equals(cardId, that.cardId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(collectionId, cardId);
    }
}
