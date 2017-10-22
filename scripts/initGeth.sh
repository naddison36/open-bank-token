#!/bin/sh

rm -f -r ../testchain/geth/*
rm ../testchain/history

geth --datadir ../testchain init genesis.json

