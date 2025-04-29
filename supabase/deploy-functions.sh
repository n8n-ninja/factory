#!/bin/bash

# Configuration
SERVER="root@91.107.237.123"
SERVER_PASS="bAp7rxaiecaEpxMsiUsu"
FUNCTIONS_DIR="./supabase/functions"
CONTAINER_NAME="supabase-edge-functions-o04gswcwkwco4c00oosgcgkw"
CONTAINER_FUNCTIONS_PATH="/home/deno/functions"

echo "🚀 Déploiement des Edge Functions..."

# Vérifier la structure du serveur
echo "🔍 Vérification de la structure du serveur..."
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no $SERVER "docker exec $CONTAINER_NAME ls -la /var/lib/edge-runtime || echo 'Container non accessible'"

# Déployer chaque fonction
for function_file in $FUNCTIONS_DIR/*.ts; do
    if [ -f "$function_file" ]; then
        filename=$(basename "$function_file")
        function_name="${filename%.*}"  # Enlève l'extension .ts
        echo "📦 Déploiement de $function_name..."
        
        echo "  Copie du fichier dans le conteneur..."
        # Créer un dossier temporaire sur le serveur
        sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no $SERVER "mkdir -p /tmp/edge-functions/$function_name"
        
        # Copier le fichier vers le serveur
        sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no "$function_file" "$SERVER:/tmp/edge-functions/$function_name/index.ts"
        
        # Copier dans le conteneur et nettoyer
        sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no $SERVER "
            docker exec $CONTAINER_NAME mkdir -p $CONTAINER_FUNCTIONS_PATH/$function_name &&
            docker cp /tmp/edge-functions/$function_name/index.ts $CONTAINER_NAME:$CONTAINER_FUNCTIONS_PATH/$function_name/index.ts &&
            rm -rf /tmp/edge-functions/$function_name
        "
        
        if [ $? -eq 0 ]; then
            echo "✅ $function_name déployé avec succès"
        else
            echo "❌ Erreur lors du déploiement de $function_name"
            exit 1
        fi
    fi
done

echo "🔄 Redémarrage du service Edge Functions..."
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no $SERVER "docker restart $CONTAINER_NAME"

echo "🎉 Déploiement terminé!"
echo "⚠️  Note: Il peut falloir quelques secondes pour que les changements soient appliqués"
echo "📝 Les fonctions devraient être accessibles via: https://db.yourvideoengine.com/functions/v1/[nom-fonction]"

# Vérifier que les fichiers sont bien en place
echo "🔍 Vérification de l'installation..."
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no $SERVER "docker exec $CONTAINER_NAME ls -la $CONTAINER_FUNCTIONS_PATH" 