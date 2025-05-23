package com.setcollectormtg.setcollectormtg.model;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.Objects;

@Getter
@Setter
@ToString(exclude = { "userCollection", "card" })
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "user_collection_card", uniqueConstraints = {
        @UniqueConstraint(columnNames = { "collection_id", "card_id" })
})
public class UserCollectionCard {

    @EmbeddedId
    private UserCollectionCardId id; // Clave compuesta

    @ManyToOne
    @MapsId("collectionId") // Mapea la parte de collectionId en la clave compuesta
    @JoinColumn(name = "collection_id", nullable = false)
    private UserCollection userCollection;

    @ManyToOne
    @MapsId("cardId") // Mapea la parte de cardId en la clave compuesta
    @JoinColumn(name = "card_id", nullable = false)
    private Card card;

    @Column(name = "n_copies", nullable = false)
    private Integer nCopies;

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        UserCollectionCard that = (UserCollectionCard) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
