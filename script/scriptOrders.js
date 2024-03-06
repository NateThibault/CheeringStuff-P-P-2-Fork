"use strict";

const ftp = require("ftp");
const fs = require("fs");
const Order = require("../models/orders");
const client = new ftp();

const config = {
  host: "ftp.solusoft-erp.com",
  port: 21,
  user: "Ricart@solusoft-erp.com",
  password: "ric2024art",
};
client.connect(config);
// Fonction pour convertir une commande en fichier JSON
const orderToJSON = (order) => {
  const orderData = {
    _id: order._id,
    userId: order.userId,
    itemsCart: order.itemsCart,
  };
  return JSON.stringify(orderData);
};

// Fonction pour créer le répertoire distant
const createRemoteDirectory = async (remoteDirectory) => {
  try {
    await client.mkdir(remoteDirectory, true);
    console.log(`Répertoire ${remoteDirectory} créé avec succès .`);
  } catch (error) {
    console.error(
      `Erreur lors de la création du répertoire ${remoteDirectory} :`,
      error
    );
  }
};

// ZIP - Chemin d'accès vers le fichier zip (produits)
const zipFilePath = "solusoft/compressedFiles/produitTest666.zip";

// FTP Vérification de la connexion + Listing du contenu
client.on("ready", () => {
  client.list((err, list) => {
    if (err) throw err;
    console.log("Vous êtes bien connecté au serveur FTP.");
    console.log("Listing du contenu des dossiers:");
    console.dir(list);
    client.end();
  });
});
// FTP Active l'écoute des événements et déclanche les callbacks.
client.on("ready", () => {
  client.list((err, list) => {
    if (err) throw err;
    // FTP Sélection du fichier à télécharger sur le serveuer - produitTest.zip (temporaire)
    const remoteFilePath = "/Produits/produitTest.zip";

    // FTP Destination du dossier/nom du fichier dans le dossier du projet (local)
    const localFilePath = "solusoft/compressedFiles/produitTest666.zip";

    //GET - Méthode pour télécharger un fichier
    client.get(remoteFilePath, (err, stream) => {
      if (err) {
        console.error("Error downloading file:", err);
        return;
      }
      // FTP PIPE PROCESS - Stream du fichier Serveur vers Stream Local
      stream.pipe(fs.createWriteStream(localFilePath));

      // FTP CLOSE EVENT - Écoute de la terminaison du processus de téléchargement
      stream.once("close", () => {
        console.log("File downloaded successfully");
        client.end(); // Close the FTP connection
      });
    });
  });
});
// FTP Gestion des événements
client.on("error", (err) => {
  console.log("FTP error occurred: " + err);
});
// Fonction pour importer les commandes depuis MongoDB et les convertir en fichiers JSON.
exports.importOrders = async () => {
  try {
    // Récupérer toutes les commandes de la base de données MongoDB
    const orders = await Order.find();

    // Créer le répertoire 'orders/' s'il n'existe pas
    const directoryPath = "solusoft/parseOrdersFiles";
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    // Parcourir les commandes et les convertir en fichiers JSON

    for (const order of orders) {
      const orderJSON = orderToJSON(order);
      const fileName = `c-${order._id}.json`;
      const localFilePathForUpload = `${directoryPath}/${fileName}`;
      // Ecrire le fichier JSON dans le dossier 'solusoft/orders'

      fs.writeFileSync(localFilePathForUpload, orderJSON);
    }

    console.log("Importation des commandes terminée.");
  } catch (error) {
    console.error(
      "Une erreur est survenue lors de l'importation des commandes :",
      error
    );
  } finally {
    // Fermer la connexion FTP
    client.end();
  }
};

// Fonction pour exporter les commandes vers le serveur FTP
exports.exportOrdersToFTP = async () => {
  try {
    // Récupérer toutes les commandes de la base de données MongoDB
    const orders = await Order.find();

    // Définir le répertoire cible sur le serveur FTP en dehors de la fonction de rappel
    const remoteDirectory = "/Commandes/commandeTraiter"; // Répertoire sur le serveur FTP
    
    // Créer le répertoire distant "Commandes"
    await createRemoteDirectory(remoteDirectory);

    //// Parcourir les commandes et les exporter vers le serveur FTP
    for (const order of orders) {
      const directoryPath = "solusoft/parseOrdersFiles";
      const orderJSON = orderToJSON(order);
      const fileName = `c-${order._id}.json`;
      const localFilePathForUpload = `${directoryPath}/${fileName}`;

      // Valider le nom du fichier
      if (!/\bc-[0-9a-f]{12,}\.json\b/.test(fileName)) {
        console.error(`Le nom du fichier ${fileName} est invalide.`);
        continue;
      }

      // Écrire le fichier JSON temporairement localement

      fs.writeFileSync(localFilePathForUpload, orderJSON);

      // Téléverser le fichier JSON vers le serveur FTP
      if (fs.existsSync(localFilePathForUpload) && client.connected) {
        client.put(
          localFilePathForUpload,
          `${remoteDirectory}/${fileName}`,
          (err) => {
            if (err) {
              console.error(
                `Erreur lors de l'envoi du fichier ${fileName} au serveur FTP :`,
                err
              );
              return;
            }
            console.log(`${fileName} a été téléversé avec succès.`);
            // Supprimer le fichier JSON temporaire localement
            // fs.unlinkSync(localFilePath);
          }
        );
      } else {
        console.error(`${fileName} n'existe pas.`);
      }
    }
  } catch (error) {
    console.error(
      "Une erreur est survenue lors de l'exportation des commandes :",
      error
    );
  } finally {
    // Fermer la connexion FTP
    client.end();
  }
};

