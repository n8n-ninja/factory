#!/bin/bash

# Script pour créer un nouveau projet Remix depuis un starter

# -- CONFIGURATION DE BASE --
STARTER_DIR="starters/remix-landing-page"
APPS_DIR="apps"

# -- FONCTION PRINCIPALE --

if [ -z "$1" ]; then
  echo "❌ Please provide a name for your new app."
  echo "Usage: pnpm run new my-app-name"
  exit 1
fi

APP_NAME=$1
DEST_DIR="$APPS_DIR/$APP_NAME"

# Vérifier si l'app existe déjà
if [ -d "$DEST_DIR" ]; then
  echo "❌ Project $APP_NAME already exists in $APPS_DIR/"
  exit 1
fi

# Copier le starter
echo "🚀 Creating new app from starter..."
cp -R "$STARTER_DIR" "$DEST_DIR"

# Remplacer __APP_NAME__ par le vrai nom dans wrangler.template.toml
if [ -f "$STARTER_DIR/wrangler.template.toml" ]; then
  sed "s/__APP_NAME__/$APP_NAME/g" "$STARTER_DIR/wrangler.template.toml" > "$DEST_DIR/wrangler.toml"
else
  echo "⚠️  wrangler.template.toml not found in starter. Skipping wrangler config."
fi

# Modifier le package.json pour changer le name
if [ -f "$DEST_DIR/package.json" ]; then
  sed -i '' "s/\"name\": \".*\"/\"name\": \"$APP_NAME\"/" "$DEST_DIR/package.json"
else
  echo "⚠️  package.json not found. Skipping name change."
fi

# Supprimer le .git si existant
rm -rf "$DEST_DIR/.git"

# Installer les dépendances
echo "📦 Installing dependencies..."
cd "$DEST_DIR" || exit
pnpm install

echo "✅ New app $APP_NAME created successfully in $DEST_DIR/"
echo "👉 Next steps:"
echo "cd $DEST_DIR"
echo "pnpm run dev  # to start development"
echo "pnpm run deploy  # to deploy on Cloudflare Pages"
