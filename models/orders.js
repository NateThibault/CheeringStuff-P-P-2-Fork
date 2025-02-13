// Importe le module mongoose pour la modélisation des schémas MongoDB
const mongoose = require("mongoose");

// Importe la classe Schema de mongoose pour définir la structure du schéma
const Schema = mongoose.Schema;

// Définit le schéma de la collection "orders" dans la base de données
const orderSchema = new Schema(
  {
    // Identifiant de l'utilisateur associé à la commande
    userId: {
      type: Schema.Types.ObjectId,  // Type ObjectId de mongoose pour représenter les identifiants MongoDB
      ref: "User", // Référence à la collection "users"
      required: true, // Le champ est obligatoire
    },
    // Liste des articles dans la commande avec leur quantité
    itemsCart: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
    // Montant total de la commande
    totalAmount: {
      type: Number,
    },
  },
  // Autres informations de commande
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
