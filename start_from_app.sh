#!/data/data/com.termux/files/usr/bin/sh
cd ~/backend
# Si ya hay un servidor corriendo, lo matamos primero para evitar duplicados
pkill -f "node server.js"
# Arrancamos en segundo plano
nohup node server.js > ~/backend/server.log 2>&1 &
