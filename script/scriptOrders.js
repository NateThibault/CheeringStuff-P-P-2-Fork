
"use strict";

const ftp = require("ftp");
const fs = require("fs");
const AdmZip = require("adm-zip");
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
   client.mkdir(remoteDirectory, true);
    console.log(`Répertoire ${remoteDirectory} créé avec succès ou déjà existant.`);
  } catch (error) {
    console.error(`Erreur lors de la création du répertoire ${remoteDirectory} :`, error);
  }
};

// Fonction pour exporter les commandes vers le serveur FTP
const exportOrdersToFTP = async () => {
  try {
    // Récupérer toutes les commandes de la base de données MongoDB
    const orders = await Order.find();

    // Définir le répertoire cible sur le serveur FTP en dehors de la fonction de rappel
    const remoteDirectory = "Commandes"; // Répertoire sur le serveur FTP

    // Créer le répertoire distant "Commandes"
     await createRemoteDirectory(remoteDirectory);

    //// Parcourir les commandes et les exporter vers le serveur FTP
    for (const order of orders) {
      const orderJSON = orderToJSON(order);
      const fileName = `commande-${order._id}.json`;
      const remoteFilePath = `${remoteDirectory}`; // Chemin sur le serveur FTP
      const filePath = `solusoft/orders/${fileName}`;
     
       // Écrire le fichier JSON temporairement localement
     /*  const localFilePath = `orders/${fileName}`;
      fs.writeFileSync(localFilePath, orderJSON); 
 */
      // Téléverser le fichier JSON vers le serveur FTP
       client.put(filePath, remoteFilePath);

      // Supprimer le fichier JSON temporaire localement
     /*  fs.unlinkSync(localFilePath); */
    }
  } catch (error) {
    console.error("Une erreur est survenue lors de l'exportation des commandes :", error);
  } finally {
    // Fermer la connexion FTP
    client.end();
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
const importOrders = async () => {
  try {
    // Récupérer toutes les commandes de la base de données MongoDB
    const orders = await Order.find();
     
    /* // Créer le répertoire 'orders/' s'il n'existe pas
    if (!fs.existsSync('orders')) {
      fs.mkdirSync('orders');
    } */
    // Parcourir les commandes et les convertir en fichiers JSON
    
    for (const order of orders) {
      const orderJSON = orderToJSON(order);
      const fileName = `commande-${order._id}.json`;
     

      // Ecrire le fichier JSON dans le dossier 'solusoft/orders'
      const filePath = `solusoft/orders/${fileName}`;
      fs.writeFileSync(filePath, orderJSON);

    }
    
    // Appeler la fonction pour exporter les commandes vers le serveur FTP
     exportOrdersToFTP();
  } catch (error) {
    console.error("Une erreur est survenue lors de l'importation des commandes :", error);
  }
  client.end();
};

// Exécuter la fonction pour importer les commandes
importOrders();



/* "use strict";

const ftp = require("ftp");
const fs = require("fs");
const AdmZip = require("adm-zip");
const Order = require("../models/orders");

// ZIP - Chemin d'accès vers le fichier zip (produits)
const zipFilePath = "solusoft/compressedFiles/produitTest666.zip";
const client = new ftp();
const config = {
  host: "ftp.solusoft-erp.com",
  port: 21,
  user: "Ricart@solusoft-erp.com",
  password: "ric2024art",
};

client.connect(config);

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
 
////////////

try {
  const zip = new AdmZip(zipFilePath);
  zip.extractAllTo("solusoft/uncompressedFiles", true);
} catch (err) {
  if (err.message.includes("Aucun en-tête END trouvé")) {
    console.error(
      "Erreur : Format ZIP invalide ou non pris en charge. Le fichier est peut-être corrompu."
    );
  } else {
    console.error("Erreur inattendue lors de lextraction ZIP :", err);
  }
}

// Fonction pour importer les commandes depuis MongoDB et les convertir en fichiers JSON.
exports.importOrders = async () => {
  try {
    // Récupérer toutes les commandes de la base de données MongoDB
    const orders = await Order.find();

    // Parcourir les commandes et les convertir en fichiers JSON
    for (const order of orders) {
      const orderJSON = orderToJSON(order);
      const fileName = `commande-${order._id}.json`;
      const filePath = `solusoft/orders/${fileName}`;

      // Ecrire le fichier JSON dans le dossier 'solusoft/orders'
      fs.writeFileSync(filePath, orderJSON);
    }
    // Créer un fichier dans le dossier 'orders'
    const createFileInOrdersFolder = () => {
      try {
        
      } catch (error) {
        console.error(
          "Une erreur est survenue lors de la création du fichier :",
          error
        );
      }
    };
    // Appeler la fonction pour créer le fichier dans le dossier 'orders'
    createFileInOrdersFolder();
    // Se connecter au serveur FTP
    client.connect(config);
    // Fonction pour gérer les erreurs
    function handleError(error) {
      console.error("Une erreur est survenue :", error);
      client.end(); // Fermer la connexion FTP en cas d'erreur
    }
  } catch (error) {
    console.error(
      "Une erreur est survenue lors de l'importation des commandes :",
      error
    );
  }
  client.end();
};

// Fonction pour convertir une commande en fichier JSON
const orderToJSON = (order) => {
  const orderData = {
    _id: order._id,
    userId: order.userId,
    itemsCart: order.itemsCart,
  };
  return JSON.stringify(orderData);
}; */

// Démarrer l'importation des commandes
//importOrders();