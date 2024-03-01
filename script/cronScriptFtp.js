
exports.ftpConnect = (req, res) => {

    // Exécution du script cron cronScriptFtp
    console.log('Script Cron exécuté à toute les heures. (cronScriptFtp.js)');
    const cron = require('node-cron');


    //CRON script - Mode TEST (exécution toute les minute - Remplacer * * * * * par 0 */1 * * *)
    //Référence: https://crontab.guru/#0_*/1_*_*_*

    cron.schedule('* * * * *', function () {
        console.log('*Mode TEST: Exécution du script pour télécharger le fichier (toute les minutes)');

        const ftp = require('ftp');
        const fs = require('fs');
        const AdmZip = require('adm-zip');

        // FTP CONNEXION (dependencies: node-ftp) - Connexion à ftp.solusoft-erp.com (+ Création des sous-dossiers Solusoft + Décompression des fichiers)
        const client = new ftp();
        const config = {
            host: 'ftp.solusoft-erp.com',
            port: 21,
            user: 'Ricart@solusoft-erp.com',
            password: 'ric2024art'
        };

        client.connect(config);


        // FTP Active l'écoute des événements et déclanche les callbacks.
        client.on('ready', () => {
            client.list((err, list) => {
                if (err) throw err;
                // Ajout du fichier temporaire pour recevoir le WriteStream

                const fs = require('fs');
                const path = require('path');

                const folderPath = './folder';

                // Vérification SI dossier "solusoft/compressedFiles" existe déjà, sinon le créé.
                fs.access("solusoft/compressedFiles", fs.constants.F_OK, (err) => {
                    if (err) {
                        // Directory does not exist, so create it
                        fs.mkdir("solusoft/compressedFiles", { recursive: true }, (err) => {
                            if (err) {
                                console.error('Erreur de création du dossier "solusoft/compressedFiles":', err);
                            } else {
                                console.log('Dossier "solusoft/compressedFiles" créé avec succès"');
                            }
                        });
                    } else {
                        console.log('Le dossier "solusoft/compressedFiles" existe déjà');
                    }
                });

                // Vérification SI dossier "solusoft/uncompressedFiles" existe déjà, sinon le créé.
                fs.access("solusoft/uncompressedFiles", fs.constants.F_OK, (err) => {
                    if (err) {
                        // Directory does not exist, so create it
                        fs.mkdir("solusoft/uncompressedFiles", { recursive: true }, (err) => {
                            if (err) {
                                console.error('Erreur de création du dossier "solusoft/uncompressedFiles":', err);
                            } else {
                                console.log('Dossier "solusoft/uncompressedFiles" créé avec succès"');
                            }
                        });
                    } else {
                        console.log('Le dossier "solusoft/uncompressedFiles" existe déjà');
                    }
                });


                const pathName = 'solusoft/compressedFiles/downloadedFile.zip';

                // FTP Sélection du fichier à télécharger sur le serveuer - produitTest.zip (temporaire)
                const remoteFilePath = '/Produits/produitTest.zip'; // Fichier sur le FTP
                //GET - Méthode pour télécharger un fichier
                client.get(remoteFilePath, (err, stream) => {
                    if (err) {
                        console.error('Error downloading file:', err);
                        return;
                    }

                    // FTP PIPE PROCESS - WriteStream du fichier Serveur vers Stream Local
                    stream.pipe(fs.createWriteStream(pathName));


                    // FTP CLOSE EVENT - Écoute de la terminaison du processus de téléchargement
                    stream.once('close', () => {
                        console.log('fichier "downloadedFile.zip" téléchargé avec succès');
                        client.end(); // Close the FTP connection

                        // ADM-ZIP - Gestionnaire de compression/décompression de fichier
                        // ZIP - Chemin d'accès vers le fichier zip (produits)
                        const zipFilePath = 'solusoft/compressedFiles/downloadedFile.zip';


                        // Crée une instance d'AdmZip
                        const zip = new AdmZip(zipFilePath);


                        // Extrait le contenu du fichier compressé (produits)
                        zip.extractAllTo('solusoft/uncompressedFiles', true);

                    });
                });
            });
        });

        // FTP Gestion des événements
        client.on('error', (err) => {
            console.log('FTP error occurred: ' + err);
        })
    });












}
